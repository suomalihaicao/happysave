// Enterprise REST API - Stores
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/universal-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const result = db.getStores({ category, featured: featured || undefined, search, page, limit });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const store = db.createStore(body);
  return NextResponse.json({ success: true, data: store }, { status: 201 });
}
