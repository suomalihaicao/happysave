// API 路由错误处理封装
import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

// 包装 API 路由，自动添加 try-catch + 错误日志
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (err: any) {
      const url = new URL(req.url).pathname;
      console.error(`[API Error] ${req.method} ${url}:`, err?.message || err);
      
      // 开发环境返回详细错误，生产环境返回通用消息
      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json(
        {
          success: false,
          message: isDev ? err?.message : 'Internal server error',
          ...(isDev && { stack: err?.stack }),
        },
        { status: 500 }
      );
    }
  };
}

// 包装 API 路由的 GET/POST/PUT/DELETE
export function withApiHandlers(handlers: Record<string, ApiHandler>) {
  const wrapped: Record<string, ApiHandler> = {};
  for (const [method, handler] of Object.entries(handlers)) {
    wrapped[method] = withErrorHandling(handler);
  }
  return wrapped;
}
