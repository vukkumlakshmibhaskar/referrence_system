import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { hashPassword } from '@/utils/password';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email: inputEmail, password, name, position, token: inviteToken } = body;

    console.log('Registration request body:', body);

    let email = inputEmail;
    let assignedCommissionRate = 20.00;
    let isInvited = false;

    // 1. If inviteToken is provided, verify it
    if (inviteToken) {
      const inviteCheck = await client.query(
        'SELECT email, commission_rate, expires_at FROM partner_invitations WHERE token = $1 AND status = \'pending\'',
        [inviteToken]
      );

      if (inviteCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
      }

      const invitation = inviteCheck.rows[0];
      if (new Date() > new Date(invitation.expires_at)) {
        return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
      }

      // Override email from invitation and set commission rate
      email = invitation.email;
      assignedCommissionRate = invitation.commission_rate;
      isInvited = true;
    }

    const role = 'partner';
    const hashedPassword = await hashPassword(password);

    await client.query('BEGIN');

    // Check if user already exists
    const existing = await client.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    let userId;

    // Insert role-specific details
    if (existing.rows.length > 0) {
      // User exists but not verified - update their info
      userId = existing.rows[0].id;
      await client.query(
        'UPDATE users SET password = $1, name = $2, is_verified = false, is_approved = false WHERE id = $3',
        [hashedPassword, name, userId]
      );
      
      // Upsert partner details
      const partnerCheck = await client.query('SELECT id FROM partner_details WHERE user_id = $1', [userId]);
      if (partnerCheck.rows.length > 0) {
        await client.query(
          'UPDATE partner_details SET position = $1, commission_rate = $2 WHERE user_id = $3',
          [position || null, assignedCommissionRate, userId]
        );
      } else {
        await client.query(
          'INSERT INTO partner_details (user_id, position, commission_rate) VALUES ($1, $2, $3)',
          [userId, position || null, assignedCommissionRate]
        );
      }
    } else {
      // Insert new user
      const result = await client.query(
        'INSERT INTO users (email, password, role, name, is_verified, is_approved) VALUES ($1, $2, $3, $4, false, false) RETURNING id',
        [email, hashedPassword, role, name]
      );
      userId = result.rows[0].id;

      // Insert partner details
      await client.query(
        'INSERT INTO partner_details (user_id, position, commission_rate) VALUES ($1, $2, $3)',
        [userId, position || null, assignedCommissionRate]
      );
    }

    // Handle OTP for everyone
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);
    await client.query(
      'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await client.query('COMMIT');

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      pendingVerification: true,
      user: { id: userId, email, role, name }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  } finally {
    client.release();
  }
}