// REST API - 采集引擎
import { NextRequest, NextResponse } from 'next/server';
import { scraper } from '@/lib/scraper';
import { withErrorHandling } from '@/lib/api-wrapper';

// POST /api/v1/scraper - 触发采集
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'seed':
      const result = await scraper.seedMerchants();
      return NextResponse.json({
        success: true,
        message: `导入完成：${result.stores} 家商家，${result.coupons} 个优惠码`,
        data: result,
      });

    case 'stats':
      return NextResponse.json({ success: true, data: await scraper.getStats() });

    default:
      return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  }
});

// GET /api/v1/scraper - 采集状态
export const GET = withErrorHandling(async () => {
  return NextResponse.json({ success: true, data: await scraper.getStats() });
});