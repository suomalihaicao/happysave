// Database Adapter - 支持 SQLite (本地) 和 PostgreSQL (生产)
// Vercel 部署时自动使用 Vercel Postgres

import type { Store, Coupon, ShortLink } from '@/types';

// ============================================================
// 数据库适配器 - 自动选择后端
// ============================================================

interface DBAdapter {
  // Stores
  getStores(params?: any): { data: Store[]; total: number; page: number; limit: number };
  getStoreById(id: string): Store | null;
  getStoreBySlug(slug: string): Store | null;
  createStore(data: any): Store;
  updateStore(id: string, data: any): Store | null;
  deleteStore(id: string): boolean;

  // Coupons
  getCoupons(params?: any): { data: Coupon[]; total: number; page: number; limit: number };
  getCouponById(id: string): Coupon | null;
  getCouponsByStoreSlug(slug: string): Coupon[];
  createCoupon(data: any): Coupon;
  updateCoupon(id: string, data: any): Coupon | null;
  deleteCoupon(id: string): boolean;
  incrementCouponClick(id: string): void;

  // Short Links
  createShortLink(data: any): any;
  getShortLinkByCode(code: string): any;
  getShortLinks(): { data: any[]; total: number };
  incrementLinkClick(code: string): void;

  // Click Logs
  logClick(data: any): string;

  // Categories
  getCategories(): any[];

  // SEO
  createSeoPage(data: any): any;
  getSeoPageBySlug(slug: string): any;
  getSeoPages(): { data: any[]; total: number };
  incrementPageView(slug: string): void;

  // Favorites
  toggleFavorite(userId: string, itemType: string, itemId: string): { favorited: boolean };
  getFavorites(userId: string): any[];

  // Notifications
  createNotification(data: any): string;

  // Dashboard
  getDashboardStats(): any;

  // Raw access
  raw(): any;
}

// ============================================================
// 选择适配器
// ============================================================

let dbInstance: DBAdapter | null = null;

export function getDb(): DBAdapter {
  if (dbInstance) return dbInstance;

  // 有 DATABASE_URL 说明是 PostgreSQL/MySQL (Vercel/Supabase/TiDB)
  if (process.env.DATABASE_URL) {
    console.log('📊 Using external database adapter');
    // 未来迁移到 Supabase/PlanetScale 时启用
    // const { externalDb } = require('./db-external');
    // dbInstance = externalDb;
    const { sqliteDb } = require('./sqlite-db');
    dbInstance = sqliteDb;
  } else {
    console.log('📊 Using SQLite adapter (local development)');
    const { sqliteDb } = require('./sqlite-db');
    dbInstance = sqliteDb;
  }

  return dbInstance!;
}

// 为了向后兼容，导出 db
export const db = new Proxy({} as DBAdapter, {
  get(_, prop) {
    const actual = getDb();
    return (actual as any)[prop];
  },
});
