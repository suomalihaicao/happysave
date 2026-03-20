interface CacheConfig {
  staleMs: number;   // 数据变旧的时间 (serve stale + revalidate)
  expiresMs: number; // 数据完全过期的时间 (必须重新获取)
}

interface CacheEntry<T> {
  data: T;
  staleAfter: number;
  expiresAt: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  staleMs: 5 * 60 * 1000,      // 5分钟内新鲜
  expiresMs: 30 * 60 * 1000,   // 30分钟后过期
};

// ============================================================
// 内存缓存
// ============================================================
class DataCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private refreshing = new Set<string>(); // 防止并发刷新
  private listeners = new Map<string, Set<() => void>>();

  // 获取数据 (SWR 模式)
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const { staleMs, expiresMs } = { ...DEFAULT_CONFIG, ...config };
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
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
        void this.backgroundRefresh(key, fetcher, staleMs, expiresMs);
      }
      return entry.data;
    }

    // 完全过期 → 阻塞等待新数据
    const data = await fetcher();
    this.set(key, data, staleMs, expiresMs);
    return data;
  }

  set<T>(key: string, data: T, staleMs: number, expiresMs: number) {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      staleAfter: now + staleMs,
      expiresAt: now + expiresMs,
    };
    this.store.set(key, entry as CacheEntry<unknown>);
    this.notify(key);
  }

  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleMs: number,
    expiresMs: number,
  ) {
    try {
      const data = await fetcher();
      this.set(key, data, staleMs, expiresMs);
    } finally {
      this.refreshing.delete(key);
    }
  }

  subscribe(key: string, listener: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(listener);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(key: string) {
    const listeners = this.listeners.get(key);
    if (!listeners) return;
    for (const fn of listeners) fn();
  }
}

export const dataCache = new DataCache();
