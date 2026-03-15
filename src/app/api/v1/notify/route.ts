// REST API - Notifications (email alerts for coupon updates)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = db.createNotification(body);
  return NextResponse.json({ success: true, data: { id }, message: '订阅成功' }, { status: 201 });
}
