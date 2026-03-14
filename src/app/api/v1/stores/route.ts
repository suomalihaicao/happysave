// Enterprise REST API - Stores (SQLite backed)
import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/sqlite-db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') || undefined;
  const featured = searchParams.has('featured') ? searchParams.get('featured') === 'true' : undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  const result = sqliteDb.stores.findAll({ category, featured, active: true, page, pageSize });
  return NextResponse.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = sqliteDb.stores.create(body);
    return NextResponse.json({ success: true, data: store }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
