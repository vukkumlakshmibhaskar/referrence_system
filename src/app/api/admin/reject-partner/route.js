import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const { partnerId } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    await client.query('BEGIN');
    
    // Delete from partner_details first
    await client.query('DELETE FROM partner_details WHERE user_id = $1', [partnerId]);
    
    // Delete from users
    await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [partnerId, 'partner']);

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Partner rejected and removed' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject partner error:', error);
    return NextResponse.json({ error: 'Failed to reject partner' }, { status: 500 });
  } finally {
    client.release();
  }
}
