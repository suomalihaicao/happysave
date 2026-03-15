// REST API - Short Links
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result = await db.getShortLinks();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const link = await db.createShortLink({ originalUrl: body.originalUrl, storeId: body.storeId, couponId: body.couponId });
  return NextResponse.json({ success: true, data: link }, { status: 201 });
}
