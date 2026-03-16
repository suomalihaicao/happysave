// REST API - Notifications (email alerts for coupon updates)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const id = await db.createNotification(body);
  return NextResponse.json({ success: true, data: { id }, message: '订阅成功' }, { status: 201 });
});