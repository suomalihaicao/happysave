// REST API - Single Store (by slug or id)
import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  
  let store;
  if (slug) store = await cached.getStoreBySlug(slug);
  else if (id) {
    const { db } = await import('@/lib/db');
    store = await db.getStoreById(id);
  }
  
  if (!store) return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
  
  // Use cached version for coupons
  const coupons = await cached.getCouponsByStoreSlug(store.slug);
  
  return NextResponse.json({ success: true, data: { ...store, coupons } });
});