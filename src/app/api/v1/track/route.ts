// REST API - Click Tracking
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { storeId, couponId, shortCode } = body;
  
  // Log the click
  const id = await db.logClick({
    shortCode: shortCode || '',
    storeId: storeId || '',
    couponId: couponId || '',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  });
  
  // Increment coupon click/use count
  if (couponId) {
    await db.incrementCouponClick(couponId);
  }
  
  return NextResponse.json({ success: true, data: { id } });
}
