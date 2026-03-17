// Database - Runtime auto-select
// PostgreSQL (when DATABASE_URL starts with postgres://) → TiDB (mysql) → SQLite/Memory (dev)

import { Store, Coupon, Category } from '@/types';

// ============================================================
// Database interface — all backends implement this
// ============================================================
export interface Database {
  // Stores
  getStores(params?: Record<string, unknown>): Promise<{ data: Store[]; total: number; page: number; limit: number }>;
  getStoreById(id: string): Promise<Store | null>;
  getStoreBySlug(slug: string): Promise<Store | null>;
  createStore(data: Record<string, unknown>): Promise<Store | null>;
  updateStore(id: string, data: Record<string, unknown>): Promise<Store | null>;
  deleteStore(id: string): Promise<unknown>;

  // Coupons
  getCoupons(params?: Record<string, unknown>): Promise<{ data: Coupon[]; total: number; page: number; limit: number }>;
  getCouponById(id: string): Promise<Coupon | null>;
  getCouponsByStoreSlug(slug: string): Promise<Coupon[]>;
  createCoupon(data: Record<string, unknown>): Promise<Coupon | null>;
  updateCoupon(id: string, data: Record<string, unknown>): Promise<Coupon | null>;
  deleteCoupon(id: string): Promise<unknown>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: Record<string, unknown>): Promise<unknown>;
  updateCategory(id: string, data: Record<string, unknown>): Promise<unknown>;
  deleteCategory(id: string): Promise<unknown>;

  // Store + Coupons combined
  getStoreWithCoupons(slug: string): Promise<{ store: Store | null; coupons: Coupon[] }>;

  // Click tracking
  trackClick(data: Record<string, unknown>): Promise<unknown>;
  logClick(data: Record<string, unknown>): Promise<unknown>;
  getClickStats(params?: Record<string, unknown>): Promise<unknown>;
  incrementCouponClick(id: string): Promise<unknown>;

  // SEO
  getSeoPages(params?: Record<string, unknown>): Promise<{ data: Record<string, unknown>[]; total: number }>;
  getSeoPageBySlug(slug: string): Promise<Record<string, unknown> | null>;
  createSeoPage(data: Record<string, unknown>): Promise<unknown>;
  updateSeoPage(id: string, data: Record<string, unknown>): Promise<unknown>;
  deleteSeoPage(id: string): Promise<unknown>;
  incrementPageViews(slug: string): Promise<unknown>;

  // Subscribers
  getSubscribers(): Promise<Record<string, unknown>[]>;
  createSubscriber(data: Record<string, unknown>): Promise<unknown>;
  getSubscriberByEmail(email: string): Promise<Record<string, unknown> | null>;
  deleteSubscriber(id: string): Promise<unknown>;

  // Favorites
  getFavorites(userId: string): Promise<Record<string, unknown>[]>;
  addFavorite(data: Record<string, unknown>): Promise<unknown>;
  removeFavorite(userId: string, itemId: string): Promise<unknown>;
  isFavorited(userId: string, itemId: string): Promise<boolean>;
  toggleFavorite(userId: string, itemType: string, itemId: string): Promise<unknown>;

  // Notifications
  getNotifications(userId: string): Promise<Record<string, unknown>[]>;
  createNotification(data: Record<string, unknown>): Promise<unknown>;
  updateNotification(id: string, data: Record<string, unknown>): Promise<unknown>;
  deleteNotification(id: string): Promise<unknown>;
  markNotificationRead(id: string): Promise<unknown>;

  // Short Links
  getShortLinks(): Promise<{ data: Record<string, unknown>[]; total: number }>;
  getShortLinkByCode(code: string): Promise<Record<string, unknown> | null>;
  createShortLink(data: Record<string, unknown>): Promise<unknown>;
  incrementLinkClick(code: string): Promise<unknown>;

  // Dashboard & Stats
  getStats(): Promise<unknown>;
  getCategoriesWithCount(): Promise<Category[]>;
  getDashboardStats(): Promise<unknown>;

  // Maintenance
  fixCouponStats(): Promise<unknown>;

  // Site Config
  getAllConfig(): Promise<Record<string, string>>;
  setConfig(key: string, value: string): Promise<boolean>;

  // Users
  getUsers(): Promise<Record<string, unknown>[]>;
  createUser(input: { email: string; name?: string; role?: string }): Promise<Record<string, unknown>>;
  deleteUser(id: string): Promise<boolean>;
}

let _db: Database | null = null;

async function loadDb(): Promise<Database> {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  const hasTiDB = !isPostgres && (!!dbUrl || !!process.env.TIDB_URL);

  if (isPostgres) {
    try {
      const { postgres, initPostgres } = await import('./db-postgres');
      await initPostgres();
      _db = postgres as unknown as Database;
      console.log('✅ Using PostgreSQL database');
    } catch (err: unknown) {
      console.error('❌ PostgreSQL connection failed:', err instanceof Error ? err.message : String(err));
      console.log('⚠️  Falling back to SQLite/memory storage');
      const { database } = await import('./sqlite-db');
      _db = database as unknown as Database;
    }
  } else if (hasTiDB) {
    try {
      const { tidb, initTiDB } = await import('./db-tidb');
      await initTiDB();
      _db = tidb as unknown as Database;
      console.log('✅ Using TiDB database');
    } catch (err: unknown) {
      console.error('❌ TiDB connection failed:', err instanceof Error ? err.message : String(err));
      console.log('⚠️  Falling back to SQLite/memory storage');
      const { database } = await import('./sqlite-db');
      _db = database as unknown as Database;
    }
  } else {
    const { database } = await import('./sqlite-db');
    _db = database as unknown as Database;
    console.log('✅ Using SQLite/memory database');
  }

  return _db;
}

// Proxy that lazily loads the correct database
export const db = new Proxy({} as unknown as Database, {
  get(_, prop: string) {
    return async (...args: unknown[]) => {
      const impl = await loadDb();
      const fn = (impl as unknown as Record<string, unknown>)[prop];
      if (typeof fn === 'function') {
        return (fn as (...a: unknown[]) => unknown).apply(impl, args);
      }
      return fn;
    };
  },
});
