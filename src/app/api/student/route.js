import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/auth';
import pool from '@/lib/db';

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    // Get student details
    const studentDetails = await client.query(
      'SELECT student_id, course, year FROM student_details WHERE user_id = $1',
      [user.id]
    );

    client.release();

    const details = studentDetails.rows[0] || {};

    const studentData = {
      profile: {
        studentId: details.student_id || 'N/A',
        name: user.name,
        email: user.email,
        course: details.course || 'Not enrolled',
        year: details.year || 1,
        enrolledCourses: 0
      },
      courses: [],
      grades: {
        GPA: 0,
        totalCredits: 0,
        completedCredits: 0
      },
      upcomingExams: []
    };

    return NextResponse.json(studentData);
  } catch (error) {
    console.error('Student API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}