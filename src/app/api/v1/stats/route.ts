// REST API - Dashboard Stats
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async () => {
  const stats = await db.getDashboardStats();
  return NextResponse.json({ success: true, data: stats });
});