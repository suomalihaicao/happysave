// REST API - SEO Pages
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result = db.getSeoPages();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const page = db.createSeoPage(body);
  return NextResponse.json({ success: true, data: page }, { status: 201 });
}
