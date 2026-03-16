// REST API - Short Links
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async () => {
  const result = await db.getShortLinks();
  return NextResponse.json({ success: true, ...result });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const link = await db.createShortLink({ originalUrl: body.originalUrl, storeId: body.storeId, couponId: body.couponId });
  return NextResponse.json({ success: true, data: link }, { status: 201 });
});