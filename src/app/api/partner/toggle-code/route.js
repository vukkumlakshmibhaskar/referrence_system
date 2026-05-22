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
    const { codeId, isActive } = body;

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Verify the code belongs to this partner
    const codeCheck = await client.query(
      'SELECT id FROM referral_codes WHERE id = $1 AND partner_id = $2',
      [codeId, user.id]
    );

    if (codeCheck.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
    }

    // Update the code status
    await client.query(
      'UPDATE referral_codes SET is_active = $1 WHERE id = $2',
      [isActive, codeId]
    );

    client.release();

    // Emit socket events for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
      global.io.to(`partner-${user.id}`).emit('partner-data-updated');
    }

    return NextResponse.json({ message: 'Code status updated successfully' });
  } catch (error) {
    console.error('Error toggling referral code:', error);
    return NextResponse.json({ error: 'Failed to update code status' }, { status: 500 });
  }
}