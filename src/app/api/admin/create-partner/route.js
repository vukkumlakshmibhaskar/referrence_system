import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function POST(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, name, position, commissionRate } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }

      // Create partner user
      const result = await client.query(
        'INSERT INTO users (email, password, role, name, is_verified, is_approved) VALUES ($1, $2, $3, $4, true, true) RETURNING id, email, role, name',
        [email, password, 'partner', name]
      );

      const newPartner = result.rows[0];

      // Insert partner details
      await client.query(
        'INSERT INTO partner_details (user_id, position, commission_rate) VALUES ($1, $2, $3)',
        [newPartner.id, position || '', parseFloat(commissionRate) || 20.00]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Partner created successfully',
        partner: newPartner
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create partner error:', error);
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}