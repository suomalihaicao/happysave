// Short Link API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/universal-db';

export async function GET() {
  const result = db.getShortLinks();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const link = db.createShortLink(body);
  return NextResponse.json({ success: true, data: link }, { status: 201 });
}
