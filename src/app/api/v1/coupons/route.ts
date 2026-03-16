// REST API - Coupons (CRUD)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId') || undefined;
  const type = searchParams.get('type') || undefined;
  const featured = searchParams.get('featured') === 'true' ? true : undefined;
  const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const result = await db.getCoupons({ storeId, type, featured, active, search, page, limit });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const coupon = await db.createCoupon(body);
  return NextResponse.json({ success: true, data: coupon }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...data } = body;
  const coupon = await db.updateCoupon(id, data);
  if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: coupon });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
  await db.deleteCoupon(id);
  return NextResponse.json({ success: true, message: 'Deleted' });
});