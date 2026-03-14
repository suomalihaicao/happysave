// Short Link API (SQLite backed)
import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/sqlite-db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, storeId, couponId } = body;
  if (!url || !storeId) {
    return NextResponse.json({ success: false, message: 'Missing url or storeId' }, { status: 400 });
  }
  const link = sqliteDb.shortLinks.create(url, storeId, couponId);
  return NextResponse.json({ success: true, data: link }, { status: 201 });
}

export async function GET() {
  const links = sqliteDb.shortLinks.findAll();
  return NextResponse.json({ success: true, data: links });
}
