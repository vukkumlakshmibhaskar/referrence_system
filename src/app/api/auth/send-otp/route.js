import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/email';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, name, role FROM users WHERE email = $1',
      [email]
    );

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);

    // Insert new OTP
    await client.query(
      'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please check SMTP configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@'))
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  } finally {
    client.release();
  }
}