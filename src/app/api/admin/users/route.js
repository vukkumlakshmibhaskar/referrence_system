import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  const client = await pool.connect();
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.role, u.name, u.is_verified, u.is_approved, u.created_at,
        CASE
          WHEN u.role = 'student' THEN json_build_object(
            'student_id', s.student_id,
            'course', s.course,
            'year', s.year
          )
          WHEN u.role = 'partner' THEN json_build_object(
            'position', p.position
          )
          ELSE NULL
        END as details
      FROM users u
      LEFT JOIN student_details s ON u.id = s.user_id AND u.role = 'student'
      LEFT JOIN partner_details p ON u.id = p.user_id AND u.role = 'partner'
      WHERE 1=1
    `;
    const params = [];
    const filters = [];

    if (role) {
      params.push(role);
      filters.push(`u.role = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(u.email ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
    }

    const filterClause = filters.length ? ` AND ${filters.join(' AND ')}` : '';
    query += `${filterClause} ORDER BY u.created_at DESC`;

    // Count total records matching the filters
    let countQuery = `
      SELECT COUNT(*)
      FROM users u
      LEFT JOIN student_details s ON u.id = s.user_id AND u.role = 'student'
      LEFT JOIN partner_details p ON u.id = p.user_id AND u.role = 'partner'
      WHERE 1=1
    `;
    countQuery += filterClause;
    const countParams = [...params];

    const totalCountResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(totalCountResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    // Apply LIMIT and OFFSET for pagination
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    return NextResponse.json({
      users: result.rows,
      pagination: {
        currentPage: page,
        limit: limit,
        totalCount: totalCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request) {
  const client = await pool.connect();
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (decoded.id === parseInt(userId)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get user role to delete from appropriate table
    const userResult = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userResult.rows[0].role;

    // Delete role-specific details first
    if (userRole === 'student') {
      await client.query('DELETE FROM student_details WHERE user_id = $1', [userId]);
    } else if (userRole === 'partner') {
      await client.query('DELETE FROM partner_details WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM referral_codes WHERE partner_id = $1', [userId]);
    }

    // Delete from users table
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'users');
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request) {
  const client = await pool.connect();
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, name, email, isVerified } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update user
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (isVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      params.push(isVerified);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, name, is_verified`;

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to('admin').emit('data-updated', 'users');
    }

    return NextResponse.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  } finally {
    client.release();
  }
}
