// REST API - Stores (CRUD)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cached, cache } from '@/lib/cache';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const featured = searchParams.get('featured') === 'true' ? true : undefined;
  const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const result = await cached.getStores({ category, featured, active, search, page, limit });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const store = await db.createStore(body);
  cache.invalidateStores();
  return NextResponse.json({ success: true, data: store }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...data } = body;
  const store = await db.updateStore(id, data);
  if (!store) return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
  cache.invalidateStores();
  return NextResponse.json({ success: true, data: store });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
  await db.deleteStore(id);
  cache.invalidateStores();
  return NextResponse.json({ success: true, message: 'Deleted' });
});