import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function POST(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'partner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, discountPercent, myShare, startDate, endDate } = body;

    console.log('Creating referral code:', code, 'User:', user, 'Discount:', discountPercent, 'My Share:', myShare);

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const client = await pool.connect();
    console.log('Database connected successfully');

    // Get partner's commission_rate
    const partnerCheck = await client.query('SELECT commission_rate FROM partner_details WHERE user_id = $1', [user.id]);
    const commissionRate = parseFloat(partnerCheck.rows[0]?.commission_rate || 20);

    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > commissionRate) {
      client.release();
      return NextResponse.json({ error: `Discount percentage must be between 0 and ${commissionRate}.` }, { status: 400 });
    }

    if (isNaN(myShare) || myShare < 0 || myShare > commissionRate) {
      client.release();
      return NextResponse.json({ error: `My share must be between 0 and ${commissionRate}.` }, { status: 400 });
    }

    if (Math.abs((discountPercent + myShare) - commissionRate) > 0.01) {
      client.release();
      return NextResponse.json({ error: `The sum of discount percentage and my share must be ${commissionRate}.` }, { status: 400 });
    }

    // Validate dates
    let validStartDate = null;
    let validEndDate = null;

    if (startDate) {
      validStartDate = new Date(startDate);
      if (isNaN(validStartDate.getTime())) {
        client.release();
        return NextResponse.json({ error: 'Invalid start date format.' }, { status: 400 });
      }
    }

    if (endDate) {
      validEndDate = new Date(endDate);
      if (isNaN(validEndDate.getTime())) {
        client.release();
        return NextResponse.json({ error: 'Invalid end date format.' }, { status: 400 });
      }
    }

    if (validStartDate && validEndDate && validStartDate > validEndDate) {
      client.release();
      return NextResponse.json({ error: 'End date cannot be before start date.' }, { status: 400 });
    }

    // Check if code already exists
    const codeCheck = await client.query(
      'SELECT code FROM referral_codes WHERE code = $1',
      [code.trim().toUpperCase()]
    );

    if (codeCheck.rows.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    // Create referral code with partner-provided code and discount percentage
    const result = await client.query(
      'INSERT INTO referral_codes (code, partner_id, is_active, discount_percent, my_share, start_date, end_date) VALUES ($1, $2, true, $3, $4, $5, $6) RETURNING *',
      [code.trim().toUpperCase(), user.id, parseFloat(discountPercent) || 0, parseFloat(myShare) || 0, validStartDate, validEndDate]
    );

    client.release();

    // Emit socket events for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
      global.io.to(`partner-${user.id}`).emit('partner-data-updated');
    }

    return NextResponse.json({
      message: 'Referral code created successfully',
      referralCode: result.rows[0].code
    });
  } catch (error) {
    console.error('Error creating referral code:', error);
    return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
  }
}
