import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const { partnerId, commissionRate } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: 'Valid commission rate (0-100) is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET is_approved = true WHERE id = $1 AND role = $2',
      [partnerId, 'partner']
    );

    // Update commission_rate in partner_details
    await client.query(
      'UPDATE partner_details SET commission_rate = $1 WHERE user_id = $2',
      [rate, partnerId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Partner approved with ' + rate + '% commission' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve partner error:', error);
    return NextResponse.json({ error: 'Failed to approve partner' }, { status: 500 });
  } finally {
    client.release();
  }
}
