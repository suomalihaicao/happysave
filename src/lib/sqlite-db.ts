// SQLite Database Layer for HappySave
// Enterprise-grade persistent storage
import Database from 'better-sqlite3';
import path from 'path';
import { nanoid } from 'nanoid';

const DB_PATH = path.join(process.cwd(), 'data', 'happysave.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb();
  }
  return db;
}

function initializeDb() {
  const database = db;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      description TEXT DEFAULT '',
      description_zh TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      website TEXT DEFAULT '',
      affiliate_url TEXT DEFAULT '',
      category TEXT NOT NULL,
      category_zh TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      code TEXT,
      title TEXT NOT NULL,
      title_zh TEXT NOT NULL,
      description TEXT DEFAULT '',
      description_zh TEXT DEFAULT '',
      discount TEXT NOT NULL,
      discount_type TEXT DEFAULT 'percentage',
      type TEXT DEFAULT 'code',
      affiliate_url TEXT DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      verified INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      use_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      store_id TEXT NOT NULL,
      coupon_id TEXT,
      clicks INTEGER DEFAULT 0,
      unique_clicks INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      last_clicked_at TEXT,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS click_logs (
      id TEXT PRIMARY KEY,
      short_code TEXT NOT NULL,
      store_id TEXT NOT NULL,
      coupon_id TEXT,
      ip TEXT,
      user_agent TEXT,
      referer TEXT,
      country TEXT DEFAULT '',
      device TEXT DEFAULT '',
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
    CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
    CREATE INDEX IF NOT EXISTS idx_click_logs_short_code ON click_logs(short_code);
    CREATE INDEX IF NOT EXISTS idx_click_logs_timestamp ON click_logs(timestamp);
  `);

  // Seed data if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM stores').get() as any;
  if (count.c === 0) {
    seedDatabase(database);
  }
}

function seedDatabase(database: Database.Database) {
  const stores = [
    { id: '1', slug: 'temu', name: 'Temu', name_zh: 'Temu', description: 'Shop like a billionaire', description_zh: '像亿万富翁一样购物', website: 'https://www.temu.com', affiliate_url: 'https://www.temu.com?aff=happysave', category: 'shopping', category_zh: '综合购物', tags: '["fashion","home","electronics"]', featured: 1, click_count: 15234, conversion_rate: 3.2 },
    { id: '2', slug: 'shein', name: 'SHEIN', name_zh: 'SHEIN', description: 'Affordable fashion for everyone', description_zh: '人人都买得起的时尚', website: 'https://www.shein.com', affiliate_url: 'https://www.shein.com?aff=happysave', category: 'fashion', category_zh: '时尚服饰', tags: '["fashion","women","men"]', featured: 1, click_count: 12456, conversion_rate: 4.1 },
    { id: '3', slug: 'aliexpress', name: 'AliExpress', name_zh: '速卖通', description: 'Global online shopping platform', description_zh: '全球在线购物平台', website: 'https://www.aliexpress.com', affiliate_url: 'https://www.aliexpress.com?aff=happysave', category: 'shopping', category_zh: '综合购物', tags: '["electronics","fashion","home"]', featured: 1, click_count: 9876, conversion_rate: 2.8 },
    { id: '4', slug: 'anker', name: 'Anker', name_zh: '安克创新', description: 'Leading charging technology', description_zh: '领先的充电技术品牌', website: 'https://www.anker.com', affiliate_url: 'https://www.anker.com?aff=happysave', category: 'electronics', category_zh: '电子产品', tags: '["electronics","charging","powerbank"]', featured: 0, click_count: 5432, conversion_rate: 5.6 },
    { id: '5', slug: 'chatgpt', name: 'ChatGPT Plus', name_zh: 'ChatGPT Plus', description: 'Most advanced AI assistant', description_zh: '最先进的AI助手', website: 'https://chat.openai.com', affiliate_url: 'https://openai.com/chatgpt?aff=happysave', category: 'ai', category_zh: 'AI工具', tags: '["ai","productivity","coding"]', featured: 1, click_count: 8765, conversion_rate: 6.2 },
    { id: '6', slug: 'nike', name: 'Nike', name_zh: '耐克', description: 'Just Do It', description_zh: 'Just Do It 运动装备', website: 'https://www.nike.com', affiliate_url: 'https://www.nike.com?aff=happysave', category: 'fashion', category_zh: '时尚服饰', tags: '["sports","shoes","fashion"]', featured: 1, click_count: 7654, conversion_rate: 3.8 },
    { id: '7', slug: 'hostinger', name: 'Hostinger', name_zh: 'Hostinger', description: 'Fast and affordable web hosting', description_zh: '快速实惠的虚拟主机', website: 'https://www.hostinger.com', affiliate_url: 'https://www.hostinger.com?aff=happysave', category: 'hosting', category_zh: '主机服务', tags: '["hosting","domain","ssl"]', featured: 0, click_count: 3210, conversion_rate: 8.4 },
  ];

  const coupons = [
    { id: '1', store_id: '1', code: 'SAVE20', title: '20% Off Sitewide', title_zh: '全场8折优惠', description: 'Get 20% off everything', description_zh: '全场8折，无最低消费', discount: '20%', discount_type: 'percentage', type: 'code', affiliate_url: 'https://www.temu.com?aff=happysave&cpn=SAVE20', start_date: '2026-03-01', end_date: '2026-04-01', featured: 1, verified: 1, click_count: 12345, use_count: 8765 },
    { id: '2', store_id: '1', code: null, title: 'Free Shipping on $15+', title_zh: '满$15免运费', description: 'Free shipping on all orders', description_zh: '满$15免运费', discount: 'Free Shipping', discount_type: 'free_shipping', type: 'deal', affiliate_url: 'https://www.temu.com?aff=happysave', start_date: '2026-03-01', end_date: null, featured: 0, verified: 1, click_count: 8567, use_count: 5432 },
    { id: '3', store_id: '2', code: 'SPRING15', title: '15% Off Spring Collection', title_zh: '春季新品85折', description: 'Save 15% on spring fashion', description_zh: '春季新品85折', discount: '15%', discount_type: 'percentage', type: 'code', affiliate_url: 'https://www.shein.com?aff=happysave&cpn=SPRING15', start_date: '2026-03-01', end_date: '2026-05-01', featured: 1, verified: 1, click_count: 23456, use_count: 15678 },
    { id: '4', store_id: '5', code: null, title: 'Free Trial - 7 Days', title_zh: '免费试用7天', description: 'Try ChatGPT Plus free', description_zh: '免费试用7天', discount: '7-Day Trial', discount_type: 'trial', type: 'deal', affiliate_url: 'https://openai.com/chatgpt?aff=happysave', start_date: '2026-03-01', end_date: null, featured: 1, verified: 1, click_count: 34567, use_count: 21098 },
    { id: '5', store_id: '6', code: 'NIKE25', title: '25% Off Select Styles', title_zh: '指定款式75折', description: 'Save 25% on select styles', description_zh: '指定款式75折', discount: '25%', discount_type: 'percentage', type: 'code', affiliate_url: 'https://www.nike.com?aff=happysave&cpn=NIKE25', start_date: '2026-03-10', end_date: '2026-03-31', featured: 1, verified: 1, click_count: 18765, use_count: 11234 },
    { id: '6', store_id: '7', code: 'HOST75', title: '75% Off Web Hosting', title_zh: '主机服务25折', description: 'Get 75% off hosting', description_zh: '高级主机方案低至25折', discount: '75%', discount_type: 'percentage', type: 'code', affiliate_url: 'https://www.hostinger.com?aff=happysave&cpn=HOST75', start_date: '2026-03-01', end_date: '2026-06-01', featured: 0, verified: 1, click_count: 5678, use_count: 2345 },
  ];

  const insertStore = database.prepare(`INSERT INTO stores (id, slug, name, name_zh, description, description_zh, logo, website, affiliate_url, category, category_zh, tags, featured, click_count, conversion_rate) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertCoupon = database.prepare(`INSERT INTO coupons (id, store_id, code, title, title_zh, description, description_zh, discount, discount_type, type, affiliate_url, start_date, end_date, featured, verified, click_count, use_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const transaction = database.transaction(() => {
    for (const s of stores) {
      insertStore.run(s.id, s.slug, s.name, s.name_zh, s.description, s.description_zh, s.website, s.affiliate_url, s.category, s.category_zh, s.tags, s.featured, s.click_count, s.conversion_rate);
    }
    for (const c of coupons) {
      insertCoupon.run(c.id, c.store_id, c.code, c.title, c.title_zh, c.description, c.description_zh, c.discount, c.discount_type, c.type, c.affiliate_url, c.start_date, c.end_date, c.featured, c.verified, c.click_count, c.use_count);
    }
  });
  transaction();
}

// ============================================
// Enterprise Database API
// ============================================

export const sqliteDb = {
  // Stores
  stores: {
    findAll: (params?: { category?: string; featured?: boolean; active?: boolean; page?: number; pageSize?: number }) => {
      const database = getDb();
      let where = 'WHERE 1=1';
      const args: any[] = [];
      
      if (params?.category) { where += ' AND category = ?'; args.push(params.category); }
      if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured ? 1 : 0); }
      if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active ? 1 : 0); }
      
      const total = (database.prepare(`SELECT COUNT(*) as c FROM stores ${where}`).get(...args) as any).c;
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const data = database.prepare(`SELECT *, name_zh as "nameZh", description_zh as "descriptionZh", category_zh as "categoryZh", affiliate_url as "affiliateUrl", click_count as "clickCount", conversion_rate as "conversionRate", sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt" FROM stores ${where} ORDER BY sort_order ASC LIMIT ? OFFSET ?`).all(...args, pageSize, offset);
      
      data.forEach((s: any) => { s.tags = JSON.parse(s.tags || '[]'); });
      
      return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
    },
    findBySlug: (slug: string) => {
      const database = getDb();
      const row = database.prepare('SELECT *, name_zh as "nameZh", description_zh as "descriptionZh", category_zh as "categoryZh", affiliate_url as "affiliateUrl", click_count as "clickCount", conversion_rate as "conversionRate", created_at as "createdAt", updated_at as "updatedAt" FROM stores WHERE slug = ? AND active = 1').get(slug) as any;
      if (row) row.tags = JSON.parse(row.tags || '[]');
      return row;
    },
    create: (data: any) => {
      const database = getDb();
      const id = nanoid();
      database.prepare('INSERT INTO stores (id, slug, name, name_zh, description, description_zh, logo, website, affiliate_url, category, category_zh, tags, featured, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, data.slug, data.name, data.nameZh || data.name, data.description || '', data.descriptionZh || '', data.logo || '', data.website || '', data.affiliateUrl || '', data.category, data.categoryZh || data.category, JSON.stringify(data.tags || []), data.featured ? 1 : 0, data.active !== false ? 1 : 0, data.sortOrder || 0);
      return { id, ...data };
    },
    update: (id: string, data: any) => {
      const database = getDb();
      const sets: string[] = [];
      const args: any[] = [];
      if (data.name) { sets.push('name = ?'); args.push(data.name); }
      if (data.nameZh) { sets.push('name_zh = ?'); args.push(data.nameZh); }
      if (data.description) { sets.push('description = ?'); args.push(data.description); }
      if (data.active !== undefined) { sets.push('active = ?'); args.push(data.active ? 1 : 0); }
      if (data.featured !== undefined) { sets.push('featured = ?'); args.push(data.featured ? 1 : 0); }
      sets.push("updated_at = datetime('now')");
      if (sets.length > 0) {
        database.prepare(`UPDATE stores SET ${sets.join(', ')} WHERE id = ?`).run(...args, id);
      }
      return { id, ...data };
    },
    delete: (id: string) => {
      getDb().prepare('DELETE FROM stores WHERE id = ?').run(id);
      return true;
    },
  },

  // Coupons
  coupons: {
    findAll: (params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; page?: number; pageSize?: number }) => {
      const database = getDb();
      let where = 'WHERE 1=1';
      const args: any[] = [];
      
      if (params?.storeId) { where += ' AND c.store_id = ?'; args.push(params.storeId); }
      if (params?.type) { where += ' AND c.type = ?'; args.push(params.type); }
      if (params?.featured !== undefined) { where += ' AND c.featured = ?'; args.push(params.featured ? 1 : 0); }
      if (params?.active !== undefined) { where += ' AND c.active = ?'; args.push(params.active ? 1 : 0); }
      
      const total = (database.prepare(`SELECT COUNT(*) as c FROM coupons c ${where}`).get(...args) as any).c;
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const data = database.prepare(`
        SELECT c.*, s.name as "storeName",
          c.title_zh as "titleZh", c.description_zh as "descriptionZh",
          c.discount_type as "discountType", c.affiliate_url as "affiliateUrl",
          c.start_date as "startDate", c.end_date as "endDate",
          c.click_count as "clickCount", c.use_count as "useCount",
          c.created_at as "createdAt", c.updated_at as "updatedAt",
          c.store_id as "storeId"
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        ${where}
        ORDER BY c.featured DESC, c.click_count DESC
        LIMIT ? OFFSET ?
      `).all(...args, pageSize, offset);
      
      return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
    },
    findByStoreSlug: (slug: string) => {
      const database = getDb();
      return database.prepare(`
        SELECT c.*, c.title_zh as "titleZh", c.description_zh as "descriptionZh",
          c.discount_type as "discountType", c.affiliate_url as "affiliateUrl",
          c.start_date as "startDate", c.end_date as "endDate",
          c.click_count as "clickCount", c.use_count as "useCount",
          c.store_id as "storeId"
        FROM coupons c
        JOIN stores s ON c.store_id = s.id
        WHERE s.slug = ? AND c.active = 1
        ORDER BY c.featured DESC, c.click_count DESC
      `).all(slug);
    },
    create: (data: any) => {
      const database = getDb();
      const id = nanoid();
      database.prepare('INSERT INTO coupons (id, store_id, code, title, title_zh, description, description_zh, discount, discount_type, type, affiliate_url, start_date, end_date, featured, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, data.storeId, data.code, data.title, data.titleZh, data.description || '', data.descriptionZh || '', data.discount, data.discountType || 'percentage', data.type || 'code', data.affiliateUrl || '', data.startDate, data.endDate, data.featured ? 1 : 0, data.active !== false ? 1 : 0, data.verified ? 1 : 0);
      return { id, ...data };
    },
    update: (id: string, data: any) => {
      getDb().prepare('UPDATE coupons SET title = ?, title_zh = ?, discount = ?, active = ?, updated_at = datetime(\'now\') WHERE id = ?').run(data.title, data.titleZh, data.discount, data.active ? 1 : 0, id);
      return { id, ...data };
    },
    delete: (id: string) => {
      getDb().prepare('DELETE FROM coupons WHERE id = ?').run(id);
      return true;
    },
  },

  // Short Links
  shortLinks: {
    create: (originalUrl: string, storeId: string, couponId?: string) => {
      const database = getDb();
      const id = nanoid();
      const code = nanoid(7);
      database.prepare('INSERT INTO short_links (id, code, original_url, store_id, coupon_id) VALUES (?, ?, ?, ?, ?)').run(id, code, originalUrl, storeId, couponId || null);
      const store = database.prepare('SELECT name FROM stores WHERE id = ?').get(storeId) as any;
      return { id, code, originalUrl, shortUrl: `/s/${code}`, storeId, storeName: store?.name, couponId: couponId || null, clicks: 0, uniqueClicks: 0, createdAt: new Date().toISOString() };
    },
    findByCode: (code: string) => {
      return getDb().prepare('SELECT *, original_url as "originalUrl", store_id as "storeId", coupon_id as "couponId", unique_clicks as "uniqueClicks", created_at as "createdAt", last_clicked_at as "lastClickedAt" FROM short_links WHERE code = ?').get(code) as any;
    },
    findAll: () => {
      return getDb().prepare('SELECT sl.*, s.name as "storeName", sl.original_url as "originalUrl", sl.store_id as "storeId", sl.coupon_id as "couponId", sl.unique_clicks as "uniqueClicks", sl.created_at as "createdAt", sl.last_clicked_at as "lastClickedAt" FROM short_links sl LEFT JOIN stores s ON sl.store_id = s.id ORDER BY sl.created_at DESC').all();
    },
    incrementClick: (code: string) => {
      getDb().prepare('UPDATE short_links SET clicks = clicks + 1, last_clicked_at = datetime(\'now\') WHERE code = ?').run(code);
    },
  },

  // Click Logs
  clickLogs: {
    create: (data: any) => {
      const database = getDb();
      const id = nanoid();
      database.prepare('INSERT INTO click_logs (id, short_code, store_id, coupon_id, ip, user_agent, referer, country, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, data.shortCode, data.storeId, data.couponId || null, data.ip || '', data.userAgent || '', data.referer || '', data.country || '', data.device || '');
      return { id, timestamp: new Date().toISOString() };
    },
    findAll: (params?: { storeId?: string; limit?: number }) => {
      const database = getDb();
      let where = 'WHERE 1=1';
      const args: any[] = [];
      if (params?.storeId) { where += ' AND store_id = ?'; args.push(params.storeId); }
      const limit = params?.limit || 100;
      return database.prepare(`SELECT *, short_code as "shortCode", store_id as "storeId", coupon_id as "couponId", user_agent as "userAgent" FROM click_logs ${where} ORDER BY timestamp DESC LIMIT ?`).all(...args, limit);
    },
  },

  // Dashboard Stats
  getDashboardStats: () => {
    const database = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const totalStores = (database.prepare('SELECT COUNT(*) as c FROM stores WHERE active = 1').get() as any).c;
    const totalCoupons = (database.prepare('SELECT COUNT(*) as c FROM coupons WHERE active = 1').get() as any).c;
    const totalClicks = (database.prepare('SELECT COALESCE(SUM(click_count), 0) as c FROM stores').get() as any).c;
    const totalConversions = (database.prepare('SELECT COALESCE(SUM(use_count), 0) as c FROM coupons').get() as any).c;
    const totalShortLinks = (database.prepare('SELECT COUNT(*) as c FROM short_links').get() as any).c;
    const todayClicks = (database.prepare("SELECT COUNT(*) as c FROM click_logs WHERE timestamp LIKE ?").get(today + '%') as any).c;
    
    const topStores = database.prepare('SELECT name, click_count as clicks, conversion_rate FROM stores WHERE active = 1 ORDER BY click_count DESC LIMIT 5').all().map((s: any) => ({
      name: s.name,
      clicks: s.clicks,
      conversions: Math.floor(s.clicks * s.conversion_rate / 100),
    }));
    
    return {
      totalStores, totalCoupons, totalClicks, totalConversions,
      totalRevenue: totalConversions * 25,
      totalShortLinks, todayClicks, todayConversions: Math.floor(todayClicks * 0.05),
      topStores,
      recentClicks: database.prepare('SELECT *, short_code as "shortCode", store_id as "storeId" FROM click_logs ORDER BY timestamp DESC LIMIT 10').all(),
    };
  },

  // Categories
  getCategories: () => {
    const database = getDb();
    const rows = database.prepare('SELECT category as name, category_zh as nameZh, COUNT(*) as count FROM stores WHERE active = 1 GROUP BY category').all();
    const icons: Record<string, string> = { shopping: '🛍️', fashion: '👗', electronics: '📱', ai: '🤖', hosting: '🌐' };
    return rows.map((r: any) => ({ ...r, icon: icons[r.name] || '🏪' }));
  },
};
