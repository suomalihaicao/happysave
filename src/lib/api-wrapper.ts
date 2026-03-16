// API 路由错误处理封装
import { NextRequest, NextResponse } from 'next/server';

// Next.js 15 dynamic route context type
interface RouteContext {
  params: Promise<Record<string, string>>;
}

type ApiHandler = (req: NextRequest, context?: RouteContext) => Promise<NextResponse> | NextResponse;

// 包装 API 路由，自动添加 try-catch + 错误日志
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: RouteContext) => {
    try {
      return await handler(req, context);
    } catch (err: unknown) {
      const url = new URL(req.url).pathname;
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error(`[API Error] ${req.method} ${url}:`, message);
      
      // 开发环境返回详细错误，生产环境返回通用消息
      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json(
        {
          success: false,
          message: isDev ? message : 'Internal server error',
          ...(isDev && { stack }),
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
