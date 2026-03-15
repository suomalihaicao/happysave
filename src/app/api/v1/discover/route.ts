// REST API - 自动发现
import { NextRequest, NextResponse } from 'next/server';
import { autoDiscover } from '@/lib/auto-discover';

// POST /api/v1/discover - 触发自动发现
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, count } = body;

  switch (action) {
    case 'stores': {
      const result = autoDiscover.discoverNewStores(count || 5);
      return NextResponse.json({
        success: true,
        message: `发现了 ${result.added} 家新商家`,
        data: result,
      });
    }

    case 'coupons': {
      const result = autoDiscover.discoverNewCoupons(count || 10);
      return NextResponse.json({
        success: true,
        message: `生成了 ${result.added} 个新优惠码`,
        data: result,
      });
    }

    case 'full': {
      // 完整发现流程：先加商家，再加优惠码
      const stores = autoDiscover.discoverNewStores(count || 3);
      const coupons = autoDiscover.discoverNewCoupons(15);
      return NextResponse.json({
        success: true,
        message: `新增 ${stores.added} 家商家，${coupons.added} 个优惠码`,
        data: { stores: stores.added, coupons: coupons.added },
      });
    }

    default:
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  }
}

// GET /api/v1/discover - 发现统计
export async function GET() {
  return NextResponse.json({ success: true, data: autoDiscover.getStats() });
}
