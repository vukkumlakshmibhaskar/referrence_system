import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    // Get user counts
    const studentCount = await client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
    const approvedPartnerCount = await client.query('SELECT COUNT(*) FROM users WHERE role = $1 AND is_approved = true', ['partner']);
    const pendingPartnerCount = await client.query('SELECT COUNT(*) FROM users WHERE role = $1 AND is_approved = false', ['partner']);
    const totalUsers = await client.query('SELECT COUNT(*) FROM users');

    // Get financial stats
    const financialStats = await client.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_sales,
        COALESCE(SUM((amount * rc.my_share) / 100), 0) as total_earnings
      FROM transactions t
      JOIN referral_codes rc ON t.code = rc.code
    `);

    // Get recent registrations
    const recentUsers = await client.query(
      'SELECT id, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    client.release();

    const adminData = {
      totalStudents: parseInt(studentCount.rows[0].count),
      totalPartners: parseInt(approvedPartnerCount.rows[0].count),
      pendingPartners: parseInt(pendingPartnerCount.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalSales: parseFloat(financialStats.rows[0].total_sales),
      totalPartnerEarnings: parseFloat(financialStats.rows[0].total_earnings),
      recentRegistrations: recentUsers.rows.map(u => ({
        id: u.id,
        name: u.name,
        type: u.role,
        date: new Date(u.created_at).toISOString().split('T')[0]
      })),
      systemStats: {
        activeUsers: parseInt(totalUsers.rows[0].count),
        coursesInProgress: 0,
        completedCourses: 0
      }
    };

    return NextResponse.json(adminData);
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}