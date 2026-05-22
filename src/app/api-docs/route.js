import { NextResponse } from 'next/server';
import swaggerModule from '@/lib/swagger';

const { swaggerSpec } = swaggerModule;

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
