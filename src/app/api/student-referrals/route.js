import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { query } from '@/lib/db'; // Assuming a db connection is available for future use

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has appropriate role (admin or partner)
    if (decoded.role !== 'admin' && decoded.role !== 'partner') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // For now, return mock data.
    // In the future, this would involve fetching data from the database
    // and potentially integrating with external student APIs.
    const mockData = {
      referredStudents: [
        { id: 's1', name: 'Alice Smith', email: 'alice.smith@example.com', registeredAt: '2023-01-15', referralCode: 'CODE123' },
        { id: 's2', name: 'Bob Johnson', email: 'bob.j@example.com', registeredAt: '2023-02-20', referralCode: 'CODE456' },
        { id: 's3', name: 'Charlie Brown', email: 'charlie.b@example.com', registeredAt: '2023-03-10', referralCode: 'CODE123' },
        { id: 's4', name: 'Diana Miller', email: 'diana.m@example.com', registeredAt: '2023-04-01', referralCode: 'CODE789' },
      ],
      referralStats: {
        total: 4
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching student referrals:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}