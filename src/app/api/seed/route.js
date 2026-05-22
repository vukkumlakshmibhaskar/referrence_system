import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed route error:', error);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}