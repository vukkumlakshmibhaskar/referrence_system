import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

// Generate unique referral code
function generateReferralCode() {
  return 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('DB_HOST:', process.env.DB_HOST);
    const client = await pool.connect();
    console.log('Connected to database');

    // Get all referral codes with partner details
    const result = await client.query(`
      SELECT rc.id, rc.code, rc.is_active,
             COALESCE(rc.discount_percent, 0) as discount_percent,
             COALESCE(rc.my_share, 0) as my_share,
             rc.created_at, rc.start_date, rc.end_date,
             u.name as partner_name, u.email as partner_email,             (SELECT COUNT(*) FROM users WHERE referred_by_code = rc.code) as student_count
      FROM referral_codes rc
      LEFT JOIN users u ON rc.partner_id = u.id
      ORDER BY rc.created_at DESC
    `);

    client.release();

    return NextResponse.json({ referralCodes: result.rows });
  } catch (error) {
    console.error('Error fetching referral codes:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { partnerId, code, discountPercent, myShare, startDate, endDate } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Verify partner exists and get their commission_rate
    const partnerCheck = await client.query(`
      SELECT u.id, u.name, pd.commission_rate 
      FROM users u 
      LEFT JOIN partner_details pd ON u.id = pd.user_id 
      WHERE u.id = $1 AND u.role = $2
    `, [partnerId, 'partner']);

    if (partnerCheck.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const commissionRate = parseFloat(partnerCheck.rows[0].commission_rate || 20);

    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > commissionRate) {
      return NextResponse.json({ error: `Discount percentage must be between 0 and ${commissionRate}.` }, { status: 400 });
    }

    if (isNaN(myShare) || myShare < 0 || myShare > commissionRate) {
      return NextResponse.json({ error: `My share must be between 0 and ${commissionRate}.` }, { status: 400 });
    }

    const totalPercentage = Math.round((parseFloat(discountPercent) + parseFloat(myShare)) * 100) / 100;
    if (Math.abs(totalPercentage - commissionRate) > 0.01) {
      return NextResponse.json({ error: `The sum of discount percentage and my share must be ${commissionRate}.` }, { status: 400 });
    }

    // Validate dates
    let validStartDate = null;
    let validEndDate = null;

    if (startDate) {
      validStartDate = new Date(startDate);
      if (isNaN(validStartDate.getTime())) {
        return NextResponse.json({ error: 'Invalid start date format.' }, { status: 400 });
      }
    }

    if (endDate) {
      validEndDate = new Date(endDate);
      if (isNaN(validEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end date format.' }, { status: 400 });
      }
    }

    if (validStartDate && validEndDate && validStartDate > validEndDate) {
      return NextResponse.json({ error: 'End date cannot be before start date.' }, { status: 400 });
    }

    // Check if code already exists
    const codeCheck = await client.query(
      'SELECT code FROM referral_codes WHERE code = $1',
      [code.toUpperCase()]
    );

    if (codeCheck.rows.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    // Insert referral code with admin-provided code, discount, share, and dates
    const result = await client.query(
      'INSERT INTO referral_codes (code, partner_id, created_by, discount_percent, my_share, is_active, start_date, end_date) VALUES ($1, $2, $3, $4, $5, true, $6, $7) RETURNING *',
      [code.toUpperCase(), partnerId, user.id, parseFloat(discountPercent), parseFloat(myShare), validStartDate, validEndDate]
    );

    client.release();

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
      global.io.to(`partner-${partnerId}`).emit('partner-data-updated');
    }

    return NextResponse.json({
      message: 'Referral code created successfully',
      referralCode: {
        ...result.rows[0],
        partner_name: partnerCheck.rows[0].name,
        student_count: 0
      }
    });
  } catch (error) {
    console.error('Error creating referral code:', error);
    return NextResponse.json({ error: error.message || 'Failed to create referral code' }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { codeId, isActive, startDate, endDate } = body;

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
    }

    // Validate dates
    let validStartDate = null;
    let validEndDate = null;

    if (startDate) {
      validStartDate = new Date(startDate);
      if (isNaN(validStartDate.getTime())) {
        return NextResponse.json({ error: 'Invalid start date format.' }, { status: 400 });
      }
    }

    if (endDate) {
      validEndDate = new Date(endDate);
      if (isNaN(validEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end date format.' }, { status: 400 });
      }
    }

    if (validStartDate && validEndDate && validStartDate > validEndDate) {
      return NextResponse.json({ error: 'End date cannot be before start date.' }, { status: 400 });
    }

    const client = await pool.connect();

    const result = await client.query(
      'UPDATE referral_codes SET is_active = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *',
      [isActive, validStartDate, validEndDate, codeId]
    );

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
    }

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
    }

    return NextResponse.json({ message: 'Referral code updated successfully', referralCode: result.rows[0] });
  } catch (error) {
    console.error('Error updating referral code:', error);
    return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Check if any students have used this code
    const usageCheck = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE referred_by_code IN (SELECT code FROM referral_codes WHERE id = $1)',
      [codeId]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      client.release();
      return NextResponse.json({ error: 'Cannot delete - students have already used this code' }, { status: 400 });
    }

    await client.query('DELETE FROM referral_codes WHERE id = $1', [codeId]);
    client.release();

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
    }

    return NextResponse.json({ message: 'Referral code deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral code:', error);
    return NextResponse.json({ error: 'Failed to delete referral code' }, { status: 500 });
  }
}