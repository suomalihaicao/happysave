// Middleware - 保护 Admin 路由 + 安全头
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'hs_admin';

// 需要保护的 admin API 路由
const PROTECTED_API_PREFIXES = [
  '/api/v1/stores',
  '/api/v1/coupons',
  '/api/v1/categories',
  '/api/v1/links',
  '/api/v1/users',
  '/api/v1/ai',
  '/api/v1/auto',
  '/api/v1/discover',
  '/api/v1/seo',
  '/api/v1/growth',
  '/api/v1/marketing',
  '/api/v1/tasks',
  '/api/v1/notify',
  '/api/v1/submit',
  '/api/v1/stats',
  '/api/v1/config',
  '/api/v1/marketing-content',
  '/api/v1/strategies',
  '/api/v1/finance',
  '/api/v1/user-profiles',
];

// 公开 API（不需要 auth）
const PUBLIC_API_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/search',
  '/api/v1/track',
  '/api/v1/cron',     // Vercel Cron 走 secret 参数验证
  '/api/v1/qr',
  '/api/v1/affiliate',
  '/api/v1/scraper',
  '/api/v1/favorites', // 用户收藏是公开的
];

function isProtectedApi(pathname: string): boolean {
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) return false;
  return PROTECTED_API_PREFIXES.some(p => pathname.startsWith(p));
}

// 简单的内存限流（含自动清理）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX_SIZE = 10000; // 防止内存泄漏

function rateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  
  // 定期清理过期条目（避免内存泄漏）
  if (rateLimitMap.size > RATE_LIMIT_MAX_SIZE) {
    for (const [key, record] of rateLimitMap) {
      if (record.resetAt < now) rateLimitMap.delete(key);
    }
  }
  
  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // ========== happysave.cn 重定向到 www 主域名 ==========
  if (host === 'happysave.cn' || host === 'm.happysave.cn') {
    const url = request.nextUrl.clone();
    url.host = 'www.happysave.cn';
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();

  // ========== 安全头 ==========
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // ========== API 限流 ==========
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // ========== Admin API 鉴权 ==========
  if (isProtectedApi(pathname)) {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // 所有路由 (域名重定向 + 安全头 + API鉴权)
    '/((?!_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json).*)',
  ],
};
