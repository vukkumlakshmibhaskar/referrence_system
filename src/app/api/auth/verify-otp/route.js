import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Find valid OTP
    const result = await client.query(
      'SELECT id, expires_at FROM otp_verification WHERE email = $1 AND otp = $2',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const otpRecord = result.rows[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid - mark user as verified
    await client.query(
      'UPDATE users SET is_verified = true WHERE email = $1',
      [email]
    );

    // Delete used OTP
    await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);

    return NextResponse.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  } finally {
    client.release();
  }
}