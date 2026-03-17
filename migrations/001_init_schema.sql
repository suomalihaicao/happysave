-- ============================================
-- HappySave 数据库迁移脚本
-- 本地 (SQLite) ↔ 生产 (PostgreSQL / TiDB)
-- ============================================
-- 用法:
--   本地: sqlite3 happysave.db < migrations/001_xxx.sql
--   生产: 通过 Vercel 迁移 API 或手动执行

-- ============================================
-- v001: 2026-03-17
-- 说明: 初始化所有表结构 (当前状态快照)
-- ============================================

-- 商家表
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameZh TEXT,
  description TEXT,
  descriptionZh TEXT,
  logo TEXT,
  website TEXT,
  affiliateUrl TEXT,
  category TEXT,
  categoryZh TEXT,
  tags TEXT DEFAULT '[]',
  featured INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  conversionRate REAL DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- 优惠码表
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  storeId TEXT NOT NULL,
  storeName TEXT,
  code TEXT,
  title TEXT NOT NULL,
  titleZh TEXT,
  description TEXT,
  descriptionZh TEXT,
  discount TEXT,
  discountType TEXT DEFAULT 'percentage',
  type TEXT DEFAULT 'code',
  affiliateUrl TEXT,
  startDate TEXT,
  endDate TEXT,
  featured INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  verified INTEGER DEFAULT 0,
  value REAL DEFAULT 0,
  minPurchase REAL DEFAULT 0,
  usageLimit INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  useCount INTEGER DEFAULT 0,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (storeId) REFERENCES stores(id)
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameZh TEXT,
  description TEXT,
  descriptionZh TEXT,
  icon TEXT,
  sortOrder INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  storeCount INTEGER DEFAULT 0
);

-- SEO 页面
CREATE TABLE IF NOT EXISTS seo_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  titleZh TEXT,
  content TEXT,
  metaDesc TEXT,
  keywords TEXT,
  type TEXT DEFAULT 'guide',
  published INTEGER DEFAULT 1,
  pageViews INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- 点击追踪
CREATE TABLE IF NOT EXISTS click_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId TEXT NOT NULL,
  itemType TEXT DEFAULT 'coupon',
  ip TEXT,
  userAgent TEXT,
  referer TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 订阅者
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  active INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 收藏
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  itemId TEXT NOT NULL,
  itemType TEXT DEFAULT 'store',
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, itemId, itemType)
);

-- 通知
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  title TEXT,
  message TEXT,
  read INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 短链接
CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  targetUrl TEXT NOT NULL,
  storeId TEXT,
  couponId TEXT,
  clicks INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_coupons_storeId ON coupons(storeId);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_click_logs_itemId ON click_logs(itemId);
CREATE INDEX IF NOT EXISTS idx_click_logs_createdAt ON click_logs(createdAt);
CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
