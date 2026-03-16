// REST API - Categories
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async () => {
  const categories = await db.getCategories();
  return NextResponse.json({ success: true, data: categories });
});