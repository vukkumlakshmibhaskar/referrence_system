import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT u.id, u.name, u.email, u.is_verified, u.is_approved, u.created_at,
             pd.position, pd.commission_rate,
             (SELECT COUNT(*) FROM referral_codes WHERE partner_id = u.id) as referral_code_count,
             COALESCE((
               SELECT SUM(t.amount) 
               FROM transactions t 
               JOIN referral_codes rc ON t.code = rc.code 
               WHERE rc.partner_id = u.id
             ), 0) as total_sales,
             COALESCE((
               SELECT SUM((t.amount * rc.my_share) / 100) 
               FROM transactions t 
               JOIN referral_codes rc ON t.code = rc.code 
               WHERE rc.partner_id = u.id
             ), 0) as total_earnings
      FROM users u
      LEFT JOIN partner_details pd ON u.id = pd.user_id
      WHERE u.role = 'partner' AND u.is_approved = true
      ORDER BY u.created_at DESC
    `);

    client.release();

    return NextResponse.json({ partners: result.rows });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { partnerId, name, email, position, isVerified, commissionRate } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Update user table
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (isVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      params.push(isVerified);
    }

    if (updates.length > 0) {
      params.push(partnerId);
      await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} AND role = 'partner'`, params);
    }

    // Update partner_details
    const detailUpdates = [];
    const detailParams = [];
    paramIndex = 1;

    if (position) {
      detailUpdates.push(`position = $${paramIndex++}`);
      detailParams.push(position);
    }
    if (commissionRate !== undefined) {
      detailUpdates.push(`commission_rate = $${paramIndex++}`);
      detailParams.push(commissionRate);
    }

    if (detailUpdates.length > 0) {
      detailParams.push(partnerId);
      await client.query(`UPDATE partner_details SET ${detailUpdates.join(', ')} WHERE user_id = $${paramIndex}`, detailParams);
    }

    client.release();

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'partners');
    }

    return NextResponse.json({ message: 'Partner updated successfully' });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('id');

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Check if partner has students
    const studentCheck = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE referred_by_code IN (SELECT code FROM referral_codes WHERE partner_id = $1)',
      [partnerId]
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      client.release();
      return NextResponse.json({ error: 'Cannot delete - students have registered using this partner\'s referral code' }, { status: 400 });
    }

    // Delete referral codes first
    await client.query('DELETE FROM referral_codes WHERE partner_id = $1', [partnerId]);

    // Delete partner details
    await client.query('DELETE FROM partner_details WHERE user_id = $1', [partnerId]);

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1 AND role = \'partner\'', [partnerId]);

    client.release();

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'partners');
    }

    return NextResponse.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}