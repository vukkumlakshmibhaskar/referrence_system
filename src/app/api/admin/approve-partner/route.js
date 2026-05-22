import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const { partnerId } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    await client.query(
      'UPDATE users SET is_approved = true WHERE id = $1 AND role = $2',
      [partnerId, 'partner']
    );

    return NextResponse.json({ message: 'Partner approved successfully' });
  } catch (error) {
    console.error('Approve partner error:', error);
    return NextResponse.json({ error: 'Failed to approve partner' }, { status: 500 });
  } finally {
    client.release();
  }
}
