// REST API - Click Tracking with UTM support
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { storeId, couponId, shortCode } = body;
  const url = new URL(request.url);
  
  // UTM 参数追踪
  const utm = {
    source: url.searchParams.get('utm_source') || body.utmSource || '',
    medium: url.searchParams.get('utm_medium') || body.utmMedium || '',
    campaign: url.searchParams.get('utm_campaign') || body.utmCampaign || '',
  };
  
  // Log the click with UTM data
  const id = await db.logClick({
    shortCode: shortCode || '',
    storeId: storeId || '',
    couponId: couponId || '',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
  });
  
  // Increment coupon click/use count
  if (couponId) {
    await db.incrementCouponClick(couponId);
  }
  
  return NextResponse.json({ success: true, data: { id, utm } });
}

// GET - 查看点击统计（管理员）
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '7');
  const storeId = url.searchParams.get('storeId') || undefined;
  
  const stats = await db.getClickStats({ days, storeId });
  return NextResponse.json({ success: true, data: stats });
}
