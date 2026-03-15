// REST API - Coupons (CRUD)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId') || undefined;
  const type = searchParams.get('type') || undefined;
  const featured = searchParams.get('featured') === 'true' ? true : undefined;
  const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const result = db.getCoupons({ storeId, type, featured, active, search, page, limit });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const coupon = db.createCoupon(body);
  return NextResponse.json({ success: true, data: coupon }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  const coupon = db.updateCoupon(id, data);
  if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: coupon });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
  db.deleteCoupon(id);
  return NextResponse.json({ success: true, message: 'Deleted' });
}
