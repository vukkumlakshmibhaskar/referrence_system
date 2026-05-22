import { NextResponse } from 'next/server';
import { createToken } from '@/utils/auth';
import pool from '@/lib/db';
import { comparePassword } from '@/utils/password';

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email, password } = body;

    // Get user by email only - role will be determined from database
    const result = await client.query(
      'SELECT id, email, role, name, password, is_verified, is_approved FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials or role mismatch' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Compare the plain password with the hashed password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials or role mismatch' },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.is_verified) {
      return NextResponse.json(
        { error: 'Please verify your email first', code: 'NOT_VERIFIED', email: email },
        { status: 401 }
      );
    }

    // Check if partner is approved
    if (user.role === 'partner' && !user.is_approved) {
      return NextResponse.json(
        { error: 'Your account is pending admin approval.', code: 'NOT_APPROVED' },
        { status: 403 }
      );
    }

    // Prevent student login (student registration has been disabled)
    if (user.role === 'student') {
      return NextResponse.json(
        { error: 'Student login is disabled' },
        { status: 403 }
      );
    }

    const token = createToken(user);

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

    // Set cookies for middleware
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    response.cookies.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  } finally {
    client.release();
  }
}