import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.is_verified, 
        u.is_approved, 
        u.created_at,
        pd.position
      FROM users u
      LEFT JOIN partner_details pd ON u.id = pd.user_id
      WHERE u.role = 'partner' AND u.is_approved = false
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ pendingPartners: result.rows });
  } catch (error) {
    console.error('Fetch pending partners error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending partners' }, { status: 500 });
  } finally {
    client.release();
  }
}
