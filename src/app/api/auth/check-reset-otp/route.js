import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Find valid OTP without deleting it yet
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
        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }

      return NextResponse.json({
        message: 'OTP verified successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Check reset OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
