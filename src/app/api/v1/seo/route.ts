// REST API - SEO Pages
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async () => {
  const result = await db.getSeoPages();
  return NextResponse.json({ success: true, ...result });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const page = await db.createSeoPage(body);
  return NextResponse.json({ success: true, data: page }, { status: 201 });
});