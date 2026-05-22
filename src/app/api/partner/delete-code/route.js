import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function DELETE(request) {
  const user = getUserFromRequest(request);

  // 1. Authentication & Authorization: Ensure user is a partner
  if (!user || user.role !== 'partner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    // 2. Authorization: Verify the code belongs to this partner
    const ownershipCheck = await client.query(
      'SELECT code FROM referral_codes WHERE id = $1 AND partner_id = $2',
      [codeId, user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Referral code not found or not owned by you' }, { status: 404 });
    }

    const referralCode = ownershipCheck.rows[0].code;

    // 3. Integrity Check: Check if any students have used this code
    const usageCheck = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE referred_by_code = $1',
      [referralCode]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      client.release();
      return NextResponse.json({ 
        error: 'Cannot delete: This code has already been used by students. Try deactivating it instead.' 
      }, { status: 400 });
    }

    // 4. Perform Deletion
    await client.query('DELETE FROM referral_codes WHERE id = $1 AND partner_id = $2', [codeId, user.id]);
    
    client.release();

    // 5. Real-time Updates
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'referralCodes');
      global.io.to(`partner-${user.id}`).emit('partner-data-updated');
    }

    return NextResponse.json({ message: 'Referral code deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral code:', error);
    return NextResponse.json({ error: 'Failed to delete referral code' }, { status: 500 });
  }
}
