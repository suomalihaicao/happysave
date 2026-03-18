// 管理员认证 - 基于签名 Cookie，无需服务端 session
import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'hs_admin';
// ADMIN_SECRET 用于签名 token，ADMIN_PASSWORD 用于验证密码
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'happysave-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// ============================================================
// 密码哈希 (简单 PBKDF2，生产环境建议用 bcrypt)
// ============================================================
function hashPassword(password: string, salt: string): string {
  return createHmac('sha256', salt).update(password).digest('hex');
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computed = hashPassword(password, salt);
  // timingSafeEqual 防止时序攻击
  if (computed.length !== hash.length) return false;
  return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

// ============================================================
// Token 生成 & 验证 (HMAC-SHA256 签名)
// Token 格式: base64(payload) + "." + hex(hmac)
// ============================================================
interface TokenPayload {
  username: string;
  role: string;
  exp: number;
}

function signToken(payload: TokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
  return `${data}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expectedSig = createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
  // timing-safe 比较
  if (sig.length !== expectedSig.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenPayload;
    if (payload.exp < Date.now()) return null; // 过期
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// Cookie 设置
// ============================================================
function getCookieSettings(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${7 * 24 * 60 * 60}`;
}

// ============================================================
// 数据库查询管理员（通过主数据库适配器）
// ============================================================
async function findAdminByUsername(username: string): Promise<{ id: string; username: string; passwordHash: string; passwordSalt: string; role: string } | null> {
  try {
    const { db } = await import('./db');
    return await db.findAdmin(username);
  } catch {
    return null;
  }
}

async function getAllAdmins(): Promise<Array<{ id: string; username: string; role: string; lastLogin: string | null }>> {
  try {
    const { db } = await import('./db');
    return await db.listAdmins();
  } catch {
    return [];
  }
}

async function createAdminRecord(username: string, passwordHash: string, passwordSalt: string, role: string): Promise<boolean> {
  try {
    const { db } = await import('./db');
    return await db.createAdmin(username, passwordHash, passwordSalt, role);
  } catch {
    return false;
  }
}

async function updateAdminLogin(username: string): Promise<void> {
  try {
    const { db } = await import('./db');
    await db.updateAdminLogin(username);
  } catch {
    // ignore
  }
}

// ============================================================
// 导出 auth 对象
// ============================================================
export const auth = {
  // 登录：验证密码，返回 token
  async login(username: string, password: string): Promise<string | null> {
    // 优先查数据库
    const admin = await findAdminByUsername(username);
    if (admin) {
      if (verifyPassword(password, admin.passwordSalt, admin.passwordHash)) {
        await updateAdminLogin(username);
        const payload: TokenPayload = {
          username: admin.username,
          role: admin.role,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天
        };
        return signToken(payload);
      }
      return null;
    }

    // 兼容旧方案：环境变量 ADMIN_PASSWORD（仅 username=admin 时）
    if (username === 'admin' && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      const payload: TokenPayload = {
        username: 'admin',
        role: 'admin',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      return signToken(payload);
    }

    return null;
  },

  // 验证请求
  verify(request: NextRequest): boolean {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return false;
    const payload = verifyToken(cookie);
    return !!payload;
  },

  // 获取当前用户信息
  getUser(request: NextRequest): TokenPayload | null {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return null;
    return verifyToken(cookie);
  },

  // 登出
  logout(_token: string) {
    // 签名 token 无需服务端清除，客户端删除 cookie 即可
  },

  getCookieSettings,

  // 生成密码哈希（用于初始化脚本）
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = createHmac('sha256', ADMIN_SECRET).update(Date.now().toString()).digest('hex').slice(0, 32);
    const hash = hashPassword(password, salt);
    return { hash, salt };
  },

  // 工具方法
  createAdmin: createAdminRecord,
  getAllAdmins,
};
