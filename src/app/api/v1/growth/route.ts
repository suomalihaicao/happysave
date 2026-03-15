// REST API - 数据增长引擎
import { NextRequest, NextResponse } from 'next/server';
import { dataGrowth } from '@/lib/data-growth';

// POST /api/v1/growth - 触发数据导入
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'import': {
      const result = await dataGrowth.importFromAllSources();
      return NextResponse.json({
        success: true,
        message: `导入完成：${result.merchants} 家商家，${result.coupons} 个优惠码 (来源: ${result.sources.join(', ') || '无'})`,
        data: result,
      });
    }

    default:
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  }
}

// GET /api/v1/growth - 数据源状态
export async function GET() {
  const status = dataGrowth.getSourceStatus();
  return NextResponse.json({ success: true, data: status });
}
