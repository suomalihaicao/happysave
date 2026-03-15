// REST API - Click Tracking
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = db.logClick({
    shortCode: body.shortCode || '',
    storeId: body.storeId || '',
    couponId: body.couponId || '',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  });
  return NextResponse.json({ success: true, data: { id } });
}
