// REST API - Categories
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cached, cache } from '@/lib/cache';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async () => {
  const categories = await cached.getCategories();
  return NextResponse.json({ success: true, data: categories });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const result = await db.createCategory(body);
  cache.invalidateCategories();
  return NextResponse.json({ success: true, data: result }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...data } = body;
  const result = await db.updateCategory(id, data);
  cache.invalidateCategories();
  return NextResponse.json({ success: true, data: result });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
  await db.deleteCategory(id);
  cache.invalidateCategories();
  return NextResponse.json({ success: true, message: 'Deleted' });
});