// Sentry Tunnel - 绕过广告拦截器
// 转发 Sentry 事件到 Sentry 服务器
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // 从请求 body 中解析 Sentry DSN
    let sentryUrl: string | null = null;
    try {
      const items = body.split('\n').filter(Boolean);
      for (const item of items) {
        const parsed = JSON.parse(item);
        if (parsed.dsn) {
          const url = new URL(parsed.dsn);
          sentryUrl = `${url.protocol}//${url.host}/api/${url.pathname.split('/')[1]}/envelope/`;
          break;
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!sentryUrl) {
      return NextResponse.json({ error: 'No DSN found' }, { status: 400 });
    }

    // 转发到 Sentry
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Tunnel failed' }, { status: 500 });
  }
}
