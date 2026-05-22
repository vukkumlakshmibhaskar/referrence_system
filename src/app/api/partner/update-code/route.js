import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function PUT(request) {
  const user = getUserFromRequest(request);

  // 1. Authentication & Authorization: Ensure user is a partner
  if (!user || user.role !== 'partner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id: codeId, code: newCode, startDate, endDate } = body; // Removed discountPercent and myShare

    // 2. Input Validation
    if (!codeId) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 });
    }
    if (!newCode || !newCode.trim()) {
      return NextResponse.json({ error: 'New referral code is required' }, { status: 400 });
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

    // 3. Authorization: Verify the code belongs to this partner
    const codeCheck = await client.query(
      'SELECT id FROM referral_codes WHERE id = $1 AND partner_id = $2',
      [codeId, user.id]
    );

    if (codeCheck.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code not found or not owned by partner' }, { status: 404 });
    }

    const formattedCode = newCode.trim().toUpperCase();

    // 4. Check for duplicate code (excluding the current code being updated)
    const duplicateCodeCheck = await client.query(
      'SELECT id FROM referral_codes WHERE code = $1 AND id != $2',
      [formattedCode, codeId]
    );
    if (duplicateCodeCheck.rows.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    // 5. Database Update - Removed discount_percent and my_share from SET clause
    const result = await client.query(
      'UPDATE referral_codes SET code = $1, start_date = $2, end_date = $3 WHERE id = $4 AND partner_id = $5 RETURNING *',
      [formattedCode, validStartDate, validEndDate, codeId, user.id]
    );

    client.release();

    // 6. Real-time Updates
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
      global.io.to(`partner-${user.id}`).emit('partner-data-updated');
    }

    return NextResponse.json({
      message: 'Referral code updated successfully',
      referralCode: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating referral code:', error);
    return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 });
  }
}
