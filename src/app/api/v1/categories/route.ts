// REST API - Categories
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const categories = db.getCategories();
  return NextResponse.json({ success: true, data: categories });
}
