// 用户报告/反馈 API
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { db } from '@/lib/db';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { type, storeId, couponId, reportType, message: msg } = body;

  if (type === 'report') {
    // 记录报告到数据库（复用 notifications 表或 click_logs）
    console.log(`[Report] store=${storeId} coupon=${couponId} type=${reportType}`);
    
    // 追踪到 click_logs（复用现有表）
    try {
      await db.trackClick({
        itemId: couponId || storeId,
        itemType: `report_${reportType}`,
        userAgent: request.headers.get('user-agent') || '',
        referer: request.headers.get('referer') || '',
      });
    } catch {
      // 静默失败
    }

    return NextResponse.json({ success: true, message: '感谢反馈' });
  }

  if (type === 'feedback') {
    console.log(`[Feedback] ${msg}`);
    return NextResponse.json({ success: true, message: '感谢反馈' });
  }

  return NextResponse.json({ success: false, message: 'Unknown type' }, { status: 400 });
});
