// 认证中间件 - 简单 session-based auth
import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin123');
const COOKIE_NAME = 'hs_admin';

// 生成简单 token
function genToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// 内存 session store
const sessions = new Map<string, { createdAt: number; expiresAt: number }>();

// 清理过期 session（每次调用时清理）
function cleanupSessions() {
  const now = Date.now();
  for (const [key, val] of sessions) {
    if (val.expiresAt < now) sessions.delete(key);
  }
}

export const auth = {
  // 登录
  login(password: string): string | null {
    if (!ADMIN_PASSWORD) return null; // 未配置密码，拒绝登录
    if (password === ADMIN_PASSWORD) {
      const token = genToken();
      sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天
      });
      return token;
    }
    return null;
  },

  // 验证
  verify(request: NextRequest): boolean {
    cleanupSessions();
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return false;
    const session = sessions.get(cookie);
    return !!session && session.expiresAt > Date.now();
  },

  // 登出
  logout(token: string) {
    sessions.delete(token);
  },

  // 获取 cookie 设置
  getCookieSettings(token: string) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${7 * 24 * 60 * 60}`;
  },
};
