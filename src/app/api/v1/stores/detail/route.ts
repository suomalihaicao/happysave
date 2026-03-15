// REST API - Single Store (by slug or id)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  
  let store;
  if (slug) store = db.getStoreBySlug(slug);
  else if (id) store = db.getStoreById(id);
  
  if (!store) return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
  
  // Also get coupons for this store
  const coupons = db.getCouponsByStoreSlug(store.slug);
  
  return NextResponse.json({ success: true, data: { ...store, coupons } });
}
