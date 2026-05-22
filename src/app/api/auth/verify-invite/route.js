import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT email, expires_at FROM partner_invitations WHERE token = $1 AND status = \'pending\'',
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
      }

      const invitation = result.rows[0];
      if (new Date() > new Date(invitation.expires_at)) {
        return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
      }

      return NextResponse.json({ email: invitation.email });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Verify invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
