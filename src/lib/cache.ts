// 数据缓存层 - SWR (Stale-While-Revalidate) 模式
// 解决远程数据库慢 + Vercel 冷启动无数据的问题

import { db } from './db';
import { Store, Coupon, Category } from '@/types';

// ============================================================
// Query option types for cache layer
// ============================================================
interface StoreQueryParams {
  [key: string]: unknown;
  active?: boolean;
  featured?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CouponQueryParams {
  [key: string]: unknown;
  active?: boolean;
  featured?: boolean;
  storeId?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// 缓存配置
// ============================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAfter: number;  // 多少毫秒后变"过期但可用"
  expiresAt: number;   // 多少毫秒后完全过期
}

interface CacheConfig {
  staleMs: number;   // 数据变旧的时间 (serve stale + revalidate)
  expiresMs: number; // 数据完全过期的时间 (必须重新获取)
}

const DEFAULT_CONFIG: CacheConfig = {
  staleMs: 5 * 60 * 1000,      // 5分钟内新鲜
  expiresMs: 30 * 60 * 1000,   // 30分钟后过期
};

// ============================================================
// 内存缓存
// ============================================================
class DataCache {
  private store = new Map<string, CacheEntry<any>>();
  private refreshing = new Set<string>(); // 防止并发刷新
  private listeners = new Map<string, Set<() => void>>();

  // 获取数据 (SWR 模式)
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const { staleMs, expiresMs } = { ...DEFAULT_CONFIG, ...config };
    const entry = this.store.get(key);
    const now = Date.now();

    // 没有缓存 → 直接查数据库
    if (!entry) {
      const data = await fetcher();
      this.set(key, data, staleMs, expiresMs);
      return data;
    }

    // 缓存新鲜 → 直接返回
    if (now < entry.staleAfter) {
      return entry.data;
    }

    // 缓存过期但未超时 → 返回旧数据 + 后台刷新
    if (now < entry.expiresAt) {
      // 静默后台刷新（不阻塞当前请求）
      if (!this.refreshing.has(key)) {
        this.refreshing.add(key);
        this.backgroundRefresh(key, fetcher, staleMs, expiresMs);
      }
      return entry.data;
    }

    // 缓存完全过期 → 必须重新获取
    const data = await fetcher();
    this.set(key, data, staleMs, expiresMs);
    return data;
  }

  // 设置缓存
  private set<T>(key: string, data: T, staleMs: number, expiresMs: number) {
    const now = Date.now();
    this.store.set(key, {
      data,
      timestamp: now,
      staleAfter: now + staleMs,
      expiresAt: now + expiresMs,
    });
    // 通知监听器
    this.listeners.get(key)?.forEach(cb => cb());
  }

  // 后台刷新
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleMs: number,
    expiresMs: number
  ) {
    try {
      const data = await fetcher();
      this.set(key, data, staleMs, expiresMs);
    } catch (err) {
      console.error(`[Cache] Failed to refresh ${key}:`, err);
    } finally {
      this.refreshing.delete(key);
    }
  }

  // 预热缓存 (冷启动时调用)
  async warmup() {
    console.log('[Cache] Warming up cache...');
    const start = Date.now();

    try {
      // 并行加载所有核心数据
      const [stores, coupons, categories, seoPages] = await Promise.all([
        db.getStores({ active: true, limit: 200 }),
        db.getCoupons({ active: true, limit: 500 }),
        db.getCategories(),
        db.getSeoPages(),
      ]);

      this.set('stores:all', stores, 10 * 60 * 1000, 60 * 60 * 1000);
      this.set('coupons:all', coupons, 5 * 60 * 1000, 60 * 60 * 1000);
      this.set('categories', categories, 30 * 60 * 1000, 24 * 60 * 60 * 1000);
      this.set('seo:all', seoPages, 10 * 60 * 1000, 60 * 60 * 1000);

      console.log(`[Cache] Warmup complete in ${Date.now() - start}ms`);
    } catch (err) {
      console.error('[Cache] Warmup failed:', err);
    }
  }

  // 获取缓存状态
  getStats() {
    const stats: Record<string, { age: string; status: string }> = {};
    for (const [key, entry] of this.store) {
      const now = Date.now();
      stats[key] = {
        age: `${Math.round((now - entry.timestamp) / 1000)}s`,
        status: now < entry.staleAfter ? 'fresh' : now < entry.expiresAt ? 'stale' : 'expired',
      };
    }
    return stats;
  }

  // 清除缓存 (支持通配符前缀匹配)
  invalidate(keyOrPattern?: string) {
    if (!keyOrPattern) {
      this.store.clear();
      return;
    }

    // 精确匹配
    if (this.store.has(keyOrPattern)) {
      this.store.delete(keyOrPattern);
      return;
    }

    // 前缀匹配 (e.g. "stores:" 匹配 "stores:all", "stores:{...}" 等)
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(keyOrPattern)) {
        this.store.delete(key);
      }
    }
  }

  // 按实体类型批量失效缓存
  invalidateStores() {
    this.invalidate('stores:');
    this.invalidate('store:');
    this.invalidate('store+coupons:');
  }

  invalidateCoupons() {
    this.invalidate('coupons:');
    this.invalidate('store+coupons:');
  }

  invalidateCategories() {
    this.invalidate('categories');
    this.invalidate('stores:');
  }
}

// 全局单例
export const cache = new DataCache();

// ============================================================
// 预热 (仅在冷启动时执行一次)
// ============================================================
let warmed = false;
export async function ensureWarmup() {
  if (!warmed) {
    warmed = true;
    await cache.warmup();
  }
}

// 自动预热（服务端模块加载时触发，冷启动受益）
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  ensureWarmup().catch(() => {}); // 静默失败，不阻塞启动
}

// ============================================================
// 便捷缓存查询函数 - 供 API 路由使用
// ============================================================
export const cached = {
  getStores: (params?: StoreQueryParams): Promise<{ data: Store[]; total: number; page: number; limit: number }> => {
    const key = `stores:${JSON.stringify(params || {})}`;
    return cache.get(key, () => db.getStores(params), { staleMs: 10 * 60 * 1000, expiresMs: 60 * 60 * 1000 });
  },

  getStoreBySlug: (slug: string): Promise<Store | null> => {
    const key = `store:${slug}`;
    return cache.get(key, () => db.getStoreBySlug(slug), { staleMs: 5 * 60 * 1000, expiresMs: 30 * 60 * 1000 });
  },

  getCoupons: (params?: CouponQueryParams): Promise<{ data: Coupon[]; total: number; page: number; limit: number }> => {
    const key = `coupons:${JSON.stringify(params || {})}`;
    return cache.get(key, () => db.getCoupons(params), { staleMs: 5 * 60 * 1000, expiresMs: 30 * 60 * 1000 });
  },

  getCouponsByStoreSlug: (slug: string): Promise<Coupon[]> => {
    const key = `coupons:store:${slug}`;
    return cache.get(key, () => db.getCouponsByStoreSlug(slug), { staleMs: 5 * 60 * 1000, expiresMs: 30 * 60 * 1000 });
  },

  getCategories: (): Promise<Category[]> => {
    return cache.get('categories', () => db.getCategories(), { staleMs: 30 * 60 * 1000, expiresMs: 24 * 60 * 60 * 1000 });
  },

  getSeoPages: (): Promise<{ data: Record<string, unknown>[]; total: number }> => {
    return cache.get('seo:all', () => db.getSeoPages(), { staleMs: 10 * 60 * 1000, expiresMs: 60 * 60 * 1000 });
  },

  getSeoPageBySlug: (slug: string): Promise<Record<string, unknown> | null> => {
    const key = `seo:${slug}`;
    return cache.get(key, () => db.getSeoPageBySlug(slug), { staleMs: 10 * 60 * 1000, expiresMs: 60 * 60 * 1000 });
  },

  getStoreWithCoupons: (slug: string): Promise<{ store: Store | null; coupons: Coupon[] }> => {
    const key = `store+coupons:${slug}`;
    return cache.get(key, () => db.getStoreWithCoupons(slug), { staleMs: 5 * 60 * 1000, expiresMs: 30 * 60 * 1000 });
  },
};
