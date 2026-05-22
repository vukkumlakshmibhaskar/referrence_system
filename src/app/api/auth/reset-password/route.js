import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/utils/password';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // 1. Verify OTP
      const otpCheck = await client.query(
        'SELECT id, expires_at FROM otp_verification WHERE email = $1 AND otp = $2',
        [email, otp]
      );

      if (otpCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      if (new Date() > new Date(otpCheck.rows[0].expires_at)) {
        await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);
        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }

      // 2. Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // 3. Update password and verified status (just in case they weren't verified)
      await client.query(
        'UPDATE users SET password = $1, is_verified = true WHERE email = $2',
        [hashedPassword, email]
      );

      // 4. Delete used OTP
      await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);

      return NextResponse.json({ message: 'Password reset successfully. You can now login.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
