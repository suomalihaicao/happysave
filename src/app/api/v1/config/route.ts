// 站点配置 API
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { db } from '@/lib/db';

// 获取所有配置
export const GET = withErrorHandling(async () => {
  const config = db.getAllConfig();
  return NextResponse.json({ success: true, data: config });
});

// 更新配置
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { key, value } = body;
  if (!key) return NextResponse.json({ success: false, message: 'key required' }, { status: 400 });
  db.setConfig(key, value);
  return NextResponse.json({ success: true });
});

// 批量更新
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { configs } = body; // { key: value, ... }
  if (!configs || typeof configs !== 'object') {
    return NextResponse.json({ success: false, message: 'configs object required' }, { status: 400 });
  }
  for (const [key, value] of Object.entries(configs)) {
    db.setConfig(key, value as string);
  }
  return NextResponse.json({ success: true });
});
