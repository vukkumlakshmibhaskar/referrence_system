import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateOTP, sendPasswordResetOTPEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if user exists
      const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (userCheck.rows.length === 0) {
        // For security, don't reveal that the user doesn't exist
        // But for this internal system, we can be more explicit if preferred
        return NextResponse.json({ 
          message: 'If an account exists with this email, you will receive a reset OTP.' 
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store or update OTP
      await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);
      await client.query(
        'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
        [email, otp, expiresAt]
      );

      // Send Email
      const emailResult = await sendPasswordResetOTPEmail(email, otp);

      if (!emailResult.success) {
        throw new Error(emailResult.error);
      }

      return NextResponse.json({ message: 'Password reset OTP sent to your email.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
