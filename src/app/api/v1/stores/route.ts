// REST API - Stores (CRUD)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const featured = searchParams.get('featured') === 'true' ? true : undefined;
  const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const result = await db.getStores({ category, featured, active, search, page, limit });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const store = await db.createStore(body);
  return NextResponse.json({ success: true, data: store }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  const store = await db.updateStore(id, data);
  if (!store) return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: store });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
  await db.deleteStore(id);
  return NextResponse.json({ success: true, message: 'Deleted' });
}
