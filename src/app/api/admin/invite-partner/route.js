import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, commissionRate } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const rate = parseFloat(commissionRate || 20);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: 'Invalid commission rate' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiry

      // Store invitation
      await client.query(
        'INSERT INTO partner_invitations (email, token, commission_rate, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET token = $2, commission_rate = $3, expires_at = $4, status = \'pending\'',
        [email, token, rate, expiresAt]
      );

      // Send email
      const emailResult = await sendInvitationEmail(email, token, rate);

      if (!emailResult.success) {
        throw new Error(emailResult.error);
      }

      return NextResponse.json({ message: 'Invitation sent successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Invite partner error:', error);
    return NextResponse.json({ error: 'Failed to send invitation: ' + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM partner_invitations ORDER BY created_at DESC');
    client.release();

    return NextResponse.json({ invitations: result.rows });
  } catch (error) {
    console.error('Fetch invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
