// 用户管理 + 邮件订阅
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

// POST /api/v1/users - 用户注册/订阅
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'subscribe': {
      // 邮件订阅
      const { email, name, category } = body;
      if (!email) return NextResponse.json({ success: false, message: '邮箱必填' }, { status: 400 });
      
      const notifId = await db.createNotification({
        type: 'email_subscribe',
        email,
        keyword: name || '',
        storeId: category || '',
      });
      
      return NextResponse.json({
        success: true,
        message: '订阅成功！我们会发送最新优惠到你的邮箱',
        data: { id: notifId },
      });
    }

    case 'favorite': {
      const { userId, itemType, itemId } = body;
      const result = await db.toggleFavorite(userId || 'anonymous', itemType, itemId);
      return NextResponse.json({ success: true, data: result });
    }

    default:
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  }
});

// GET /api/v1/users - 获取订阅列表
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'favorites') {
    const userId = searchParams.get('userId') || 'anonymous';
    const favorites = await db.getFavorites(userId);
    return NextResponse.json({ success: true, data: favorites });
  }

  return NextResponse.json({ success: true, data: [], message: '用户系统已就绪' });
});