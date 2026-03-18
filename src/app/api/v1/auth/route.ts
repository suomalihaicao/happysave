// 管理后台认证 API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withErrorHandling } from '@/lib/api-wrapper';

// POST /api/v1/auth - 登录/登出
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { action, username, password } = body;

  if (action === 'login') {
    // 支持 username + password，兼容旧的 password-only 方式
    const user = username || 'admin';
    const token = await auth.login(user, password);
    if (token) {
      const response = NextResponse.json({ success: true, message: '登录成功', username: user });
      response.headers.set('Set-Cookie', auth.getCookieSettings(token));
      return response;
    }
    return NextResponse.json({ success: false, message: '用户名或密码错误' }, { status: 401 });
  }

  if (action === 'logout') {
    const response = NextResponse.json({ success: true, message: '已退出' });
    response.headers.set('Set-Cookie', 'hs_admin=; Path=/; Max-Age=0');
    return response;
  }

  return NextResponse.json({ success: false }, { status: 400 });
});

// GET /api/v1/auth - 检查登录状态
export const GET = withErrorHandling(async (request: NextRequest) => {
  const loggedIn = auth.verify(request);
  const user = loggedIn ? auth.getUser(request) : null;
  return NextResponse.json({ success: true, loggedIn, username: user?.username || null });
});
