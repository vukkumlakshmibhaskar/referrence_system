import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { hashPassword } from '@/utils/password';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email, password, name, position } = body;

    console.log('Registration request body:', body);

    // Only allow partner registration
    const role = 'partner';
    const hashedPassword = await hashPassword(password);

    await client.query('BEGIN');

    // Check if user already exists
    const existing = await client.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    let userId;

    if (existing.rows.length > 0) {
      if (existing.rows[0].is_verified) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Email already exists and verified' }, { status: 400 });
      }
      
      // User exists but not verified - update their info
      userId = existing.rows[0].id;
      await client.query(
        'UPDATE users SET password = $1, name = $2, is_approved = false WHERE id = $3',
        [hashedPassword, name, userId]
      );
      
      // Upsert partner details
      const partnerCheck = await client.query('SELECT id FROM partner_details WHERE user_id = $1', [userId]);
      if (partnerCheck.rows.length > 0) {
        await client.query(
          'UPDATE partner_details SET position = $1 WHERE user_id = $2',
          [position || null, userId]
        );      } else { // Removed else if (company && company.trim()) because company is removed
        await client.query(
          'INSERT INTO partner_details (user_id, position) VALUES ($1, $2)',
          [userId, position || null]
        );
      }
    } else {
      // Insert new user
      const result = await client.query(
        'INSERT INTO users (email, password, role, name, is_verified, is_approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [email, hashedPassword, role, name, false, false]
      );
      userId = result.rows[0].id;

      // Insert partner details
      await client.query(
        'INSERT INTO partner_details (user_id, position) VALUES ($1, $2)',
        [userId, position || null]
      );
    }

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.query('DELETE FROM otp_verification WHERE email = $1', [email]);
    await client.query(
      'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await client.query('COMMIT');

    // Send OTP via email (outside transaction)
    const emailResult = await sendOTPEmail(email, otp);

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