// 前台搜索 API - 支持商家和优惠码联合搜索
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: { stores: [], coupons: [] } });
  }

  const stores = await db.getStores({ search: q, active: true, page, limit });
  const coupons = await db.getCoupons({ search: q, active: true, page, limit });

  return NextResponse.json({
    success: true,
    data: {
      stores: stores.data,
      storesTotal: stores.total,
      coupons: coupons.data,
      couponsTotal: coupons.total,
      query: q,
    },
  });
});