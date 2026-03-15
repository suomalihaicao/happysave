// SQLite Database - Real persistence layer
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'happysave.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedIfEmpty();
  }
  return db;
}

function initSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      nameZh TEXT DEFAULT '',
      description TEXT DEFAULT '',
      descriptionZh TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      website TEXT DEFAULT '',
      affiliateUrl TEXT DEFAULT '',
      category TEXT DEFAULT '',
      categoryZh TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      clickCount INTEGER DEFAULT 0,
      conversionRate REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      storeId TEXT NOT NULL,
      storeName TEXT DEFAULT '',
      code TEXT,
      title TEXT NOT NULL,
      titleZh TEXT DEFAULT '',
      description TEXT DEFAULT '',
      descriptionZh TEXT DEFAULT '',
      discount TEXT DEFAULT '',
      discountType TEXT DEFAULT 'percentage',
      type TEXT DEFAULT 'code',
      affiliateUrl TEXT DEFAULT '',
      startDate TEXT,
      endDate TEXT,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      verified INTEGER DEFAULT 0,
      clickCount INTEGER DEFAULT 0,
      useCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      originalUrl TEXT NOT NULL,
      shortUrl TEXT DEFAULT '',
      storeId TEXT,
      storeName TEXT DEFAULT '',
      couponId TEXT,
      clicks INTEGER DEFAULT 0,
      uniqueClicks INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      lastClickedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS click_logs (
      id TEXT PRIMARY KEY,
      shortCode TEXT,
      storeId TEXT,
      couponId TEXT,
      ip TEXT DEFAULT '',
      userAgent TEXT DEFAULT '',
      referer TEXT DEFAULT '',
      country TEXT DEFAULT '',
      device TEXT DEFAULT '',
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameZh TEXT DEFAULT '',
      icon TEXT DEFAULT '🏷️',
      sortOrder INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seo_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      metaDesc TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      pageType TEXT DEFAULT 'store',
      storeId TEXT,
      views INTEGER DEFAULT 0,
      aiGenerated INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      itemType TEXT NOT NULL,
      itemId TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, itemType, itemId)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      email TEXT,
      type TEXT DEFAULT 'coupon_alert',
      storeId TEXT,
      keyword TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(storeId);
    CREATE INDEX IF NOT EXISTS idx_coupons_featured ON coupons(featured, active);
    CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
    CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
    CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
    CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
  `);
}

function seedIfEmpty() {
  const count = getDb().prepare('SELECT COUNT(*) as c FROM stores').get() as { c: number };
  if (count.c > 0) return;

  const insertStore = getDb().prepare(`
    INSERT INTO stores (id, slug, name, nameZh, description, descriptionZh, logo, website, affiliateUrl, category, categoryZh, tags, featured, active, sortOrder, clickCount, conversionRate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCoupon = getDb().prepare(`
    INSERT INTO coupons (id, storeId, storeName, code, title, titleZh, description, descriptionZh, discount, discountType, type, affiliateUrl, startDate, endDate, featured, active, verified, clickCount, useCount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = getDb().transaction(() => {
    // Stores
    insertStore.run('1', 'temu', 'Temu', 'Temu', 'Shop like a billionaire. Discover incredible deals.', '像亿万富翁一样购物。发现时尚、家居、美妆等超值优惠。', '/logos/temu.png', 'https://www.temu.com', 'https://www.temu.com?aff=happysave', 'shopping', '综合购物', '["fashion","home","electronics","deals"]', 1, 1, 1, 15234, 3.2);
    insertStore.run('2', 'shein', 'SHEIN', 'SHEIN', 'Affordable fashion for everyone.', '人人都买得起的时尚。潮流款式，无与伦比的价格。', '/logos/shein.png', 'https://www.shein.com', 'https://www.shein.com?aff=happysave', 'fashion', '时尚服饰', '["fashion","women","men","accessories"]', 1, 1, 2, 12456, 4.1);
    insertStore.run('3', 'aliexpress', 'AliExpress', '速卖通', 'The global online shopping platform.', '全球在线购物平台。数百万商品，工厂价格。', '/logos/aliexpress.png', 'https://www.aliexpress.com', 'https://www.aliexpress.com?aff=happysave', 'shopping', '综合购物', '["electronics","fashion","home","tools"]', 1, 1, 3, 9876, 2.8);
    insertStore.run('4', 'anker', 'Anker', '安克创新', 'Leading charging technology brand.', '领先的充电技术品牌。充电宝、充电器、数据线。', '/logos/anker.png', 'https://www.anker.com', 'https://www.anker.com?aff=happysave', 'electronics', '电子产品', '["electronics","charging","powerbank"]', 0, 1, 4, 5432, 5.6);
    insertStore.run('5', 'chatgpt', 'ChatGPT Plus', 'ChatGPT Plus', 'The most advanced AI assistant.', '最先进的AI助手。更快响应，优先体验新功能。', '/logos/chatgpt.png', 'https://chat.openai.com', 'https://openai.com/chatgpt?aff=happysave', 'ai', 'AI工具', '["ai","productivity","writing"]', 1, 1, 5, 8765, 6.2);
    insertStore.run('6', 'nike', 'Nike', '耐克', 'Just Do It. Athletic footwear & apparel.', 'Just Do It. 运动鞋、服装和装备。', '/logos/nike.png', 'https://www.nike.com', 'https://www.nike.com?aff=happysave', 'fashion', '时尚服饰', '["sports","shoes","fashion"]', 1, 1, 6, 7654, 3.8);
    insertStore.run('7', 'hostinger', 'Hostinger', 'Hostinger', 'Fast and affordable web hosting.', '快速实惠的虚拟主机。免费域名和SSL证书。', '/logos/hostinger.png', 'https://www.hostinger.com', 'https://www.hostinger.com?aff=happysave', 'hosting', '主机服务', '["hosting","domain","ssl"]', 0, 1, 7, 3210, 8.4);

    // Coupons
    insertCoupon.run('1', '1', 'Temu', 'SAVE20', '20% Off Sitewide', '全场8折优惠', 'Get 20% off everything.', '全场8折优惠，无最低消费要求。', '20%', 'percentage', 'code', 'https://www.temu.com?aff=happysave&cpn=SAVE20', '2026-03-01', '2026-04-01', 1, 1, 1, 12345, 8765);
    insertCoupon.run('2', '1', 'Temu', null, 'Free Shipping on Orders $15+', '满$15免运费', 'Free shipping on all orders over $15.', '满$15免运费，限时优惠。', 'Free Shipping', 'free_shipping', 'deal', 'https://www.temu.com?aff=happysave', '2026-03-01', null, 0, 1, 1, 8567, 5432);
    insertCoupon.run('3', '2', 'SHEIN', 'SPRING15', '15% Off Spring Collection', '春季新品85折', 'Save 15% on the new spring fashion collection.', '春季新品85折优惠。', '15%', 'percentage', 'code', 'https://www.shein.com?aff=happysave&cpn=SPRING15', '2026-03-01', '2026-05-01', 1, 1, 1, 23456, 15678);
    insertCoupon.run('4', '5', 'ChatGPT Plus', null, 'Free Trial - 7 Days', '免费试用7天', 'Try ChatGPT Plus free for 7 days.', '免费试用ChatGPT Plus 7天，随时取消。', '7-Day Trial', 'trial', 'deal', 'https://openai.com/chatgpt?aff=happysave', '2026-03-01', null, 1, 1, 1, 34567, 21098);
    insertCoupon.run('5', '6', 'Nike', 'NIKE25', '25% Off Select Styles', '指定款式75折', 'Save 25% on select Nike styles.', '指定款式75折优惠，限时抢购。', '25%', 'percentage', 'code', 'https://www.nike.com?aff=happysave&cpn=NIKE25', '2026-03-10', '2026-03-31', 1, 1, 1, 18765, 11234);
    insertCoupon.run('6', '7', 'Hostinger', 'HOST75', '75% Off Web Hosting', '主机服务25折', 'Get 75% off premium web hosting plans.', '高级主机方案低至25折。', '75%', 'percentage', 'code', 'https://www.hostinger.com?aff=happysave&cpn=HOST75', '2026-03-01', '2026-06-01', 0, 1, 1, 5678, 2345);

    // Categories
    getDb().prepare('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run('shopping', 'shopping', '综合购物', '🛒', 1);
    getDb().prepare('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run('fashion', 'fashion', '时尚服饰', '👗', 2);
    getDb().prepare('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run('electronics', 'electronics', '电子产品', '📱', 3);
    getDb().prepare('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run('ai', 'ai', 'AI工具', '🤖', 4);
    getDb().prepare('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run('hosting', 'hosting', '主机服务', '🌐', 5);
  });

  tx();
  console.log('✅ Database seeded with initial data');
}

// ============================================================
// Export DB API
// ============================================================
export const database = {
  // Stores
  getStores: (params?: { category?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) => {
    const d = getDb();
    let where = 'WHERE 1=1';
    const args: any[] = [];
    if (params?.category) { where += ' AND category = ?'; args.push(params.category); }
    if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured ? 1 : 0); }
    if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active ? 1 : 0); }
    if (params?.search) { where += ' AND (name LIKE ? OR description LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }

    const total = (d.prepare(`SELECT COUNT(*) as c FROM stores ${where}`).get(...args) as any).c;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const data = d.prepare(`SELECT * FROM stores ${where} ORDER BY sortOrder ASC, clickCount DESC LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit);
    return { data: data.map(parseStore), total, page, limit };
  },

  getStoreById: (id: string) => {
    const row = getDb().prepare('SELECT * FROM stores WHERE id = ?').get(id);
    return row ? parseStore(row) : null;
  },

  getStoreBySlug: (slug: string) => {
    const row = getDb().prepare('SELECT * FROM stores WHERE slug = ? AND active = 1').get(slug);
    return row ? parseStore(row) : null;
  },

  createStore: (data: any) => {
    const id = generateId();
    getDb().prepare(`
      INSERT INTO stores (id, slug, name, nameZh, description, descriptionZh, logo, website, affiliateUrl, category, categoryZh, tags, featured, active, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.slug, data.name, data.nameZh || '', data.description || '', data.descriptionZh || '', data.logo || '', data.website || '', data.affiliateUrl || '', data.category || '', data.categoryZh || '', JSON.stringify(data.tags || []), data.featured ? 1 : 0, data.active !== false ? 1 : 0, data.sortOrder || 0);
    return database.getStoreById(id);
  },

  updateStore: (id: string, data: any) => {
    const existing = database.getStoreById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'tags' ? JSON.stringify(value) : key === 'featured' || key === 'active' ? (value ? 1 : 0) : value);
      }
    }
    if (fields.length === 0) return existing;
    fields.push("updatedAt = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE stores SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return database.getStoreById(id);
  },

  deleteStore: (id: string) => {
    getDb().prepare('DELETE FROM stores WHERE id = ?').run(id);
    return true;
  },

  // Coupons
  getCoupons: (params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) => {
    const d = getDb();
    let where = 'WHERE 1=1';
    const args: any[] = [];
    if (params?.storeId) { where += ' AND storeId = ?'; args.push(params.storeId); }
    if (params?.type) { where += ' AND type = ?'; args.push(params.type); }
    if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured ? 1 : 0); }
    if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active ? 1 : 0); }
    if (params?.search) { where += ' AND (title LIKE ? OR code LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }

    const total = (d.prepare(`SELECT COUNT(*) as c FROM coupons ${where}`).get(...args) as any).c;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const data = d.prepare(`SELECT * FROM coupons ${where} ORDER BY featured DESC, clickCount DESC LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit);
    return { data: data.map(parseCoupon), total, page, limit };
  },

  getCouponById: (id: string) => {
    const row = getDb().prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    return row ? parseCoupon(row) : null;
  },

  getCouponsByStoreSlug: (slug: string) => {
    const store = database.getStoreBySlug(slug);
    if (!store) return [];
    return getDb().prepare('SELECT * FROM coupons WHERE storeId = ? AND active = 1 ORDER BY featured DESC').all(store.id).map(parseCoupon);
  },

  createCoupon: (data: any) => {
    const id = generateId();
    getDb().prepare(`
      INSERT INTO coupons (id, storeId, storeName, code, title, titleZh, description, descriptionZh, discount, discountType, type, affiliateUrl, startDate, endDate, featured, active, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.storeId, data.storeName || '', data.code || null, data.title, data.titleZh || '', data.description || '', data.descriptionZh || '', data.discount || '', data.discountType || 'percentage', data.type || 'code', data.affiliateUrl || '', data.startDate || new Date().toISOString(), data.endDate || null, data.featured ? 1 : 0, data.active !== false ? 1 : 0, data.verified ? 1 : 0);
    return database.getCouponById(id);
  },

  updateCoupon: (id: string, data: any) => {
    const existing = database.getCouponById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'featured' || key === 'active' || key === 'verified' ? (value ? 1 : 0) : value);
      }
    }
    if (fields.length === 0) return existing;
    fields.push("updatedAt = datetime('now')");
    values.push(id);
    getDb().prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return database.getCouponById(id);
  },

  deleteCoupon: (id: string) => {
    getDb().prepare('DELETE FROM coupons WHERE id = ?').run(id);
    return true;
  },

  incrementCouponClick: (id: string) => {
    getDb().prepare('UPDATE coupons SET clickCount = clickCount + 1 WHERE id = ?').run(id);
  },

  // Short Links
  createShortLink: (data: { originalUrl: string; storeId?: string; couponId?: string }) => {
    const id = generateId();
    const code = generateCode();
    const store = data.storeId ? database.getStoreById(data.storeId) : null;
    getDb().prepare(`
      INSERT INTO short_links (id, code, originalUrl, shortUrl, storeId, storeName, couponId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, code, data.originalUrl, `/s/${code}`, data.storeId || '', store?.name || '', data.couponId || null);
    return getDb().prepare('SELECT * FROM short_links WHERE id = ?').get(id);
  },

  getShortLinkByCode: (code: string) => {
    return getDb().prepare('SELECT * FROM short_links WHERE code = ?').get(code);
  },

  getShortLinks: () => {
    const data = getDb().prepare('SELECT * FROM short_links ORDER BY createdAt DESC').all();
    return { data, total: data.length };
  },

  incrementLinkClick: (code: string) => {
    getDb().prepare('UPDATE short_links SET clicks = clicks + 1, lastClickedAt = datetime(\'now\') WHERE code = ?').run(code);
  },

  // Click Logs
  logClick: (data: { shortCode?: string; storeId?: string; couponId?: string; ip?: string; userAgent?: string; referer?: string }) => {
    const id = generateId();
    getDb().prepare(`
      INSERT INTO click_logs (id, shortCode, storeId, couponId, ip, userAgent, referer, device)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.shortCode || '', data.storeId || '', data.couponId || '', data.ip || '', data.userAgent || '', data.referer || '', detectDevice(data.userAgent || ''));
    // Also increment store click count
    if (data.storeId) {
      getDb().prepare('UPDATE stores SET clickCount = clickCount + 1 WHERE id = ?').run(data.storeId);
    }
    return id;
  },

  // Categories
  getCategories: () => {
    return getDb().prepare('SELECT * FROM categories ORDER BY sortOrder ASC').all();
  },

  // SEO Pages
  createSeoPage: (data: { slug: string; title: string; content?: string; metaDesc?: string; keywords?: string; pageType?: string; storeId?: string }) => {
    const id = generateId();
    getDb().prepare(`
      INSERT INTO seo_pages (id, slug, title, content, metaDesc, keywords, pageType, storeId, aiGenerated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, data.slug, data.title, data.content || '', data.metaDesc || '', data.keywords || '', data.pageType || 'store', data.storeId || null);
    return getDb().prepare('SELECT * FROM seo_pages WHERE id = ?').get(id);
  },

  getSeoPageBySlug: (slug: string) => {
    return getDb().prepare('SELECT * FROM seo_pages WHERE slug = ?').get(slug);
  },

  getSeoPages: () => {
    const data = getDb().prepare('SELECT * FROM seo_pages ORDER BY createdAt DESC').all();
    return { data, total: data.length };
  },

  incrementPageView: (slug: string) => {
    getDb().prepare('UPDATE seo_pages SET views = views + 1 WHERE slug = ?').run(slug);
  },

  // Favorites
  toggleFavorite: (userId: string, itemType: string, itemId: string) => {
    const existing = getDb().prepare('SELECT * FROM favorites WHERE userId = ? AND itemType = ? AND itemId = ?').get(userId, itemType, itemId);
    if (existing) {
      getDb().prepare('DELETE FROM favorites WHERE id = ?').run((existing as any).id);
      return { favorited: false };
    } else {
      getDb().prepare('INSERT INTO favorites (id, userId, itemType, itemId) VALUES (?, ?, ?, ?)').run(generateId(), userId, itemType, itemId);
      return { favorited: true };
    }
  },

  getFavorites: (userId: string) => {
    return getDb().prepare('SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC').all(userId);
  },

  // Notifications
  createNotification: (data: { userId?: string; email?: string; type?: string; storeId?: string; keyword?: string }) => {
    const id = generateId();
    getDb().prepare(`
      INSERT INTO notifications (id, userId, email, type, storeId, keyword)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.userId || '', data.email || '', data.type || 'coupon_alert', data.storeId || '', data.keyword || '');
    return id;
  },

  // Dashboard Stats
  getDashboardStats: () => {
    const d = getDb();
    const totalStores = (d.prepare('SELECT COUNT(*) as c FROM stores WHERE active = 1').get() as any).c;
    const totalCoupons = (d.prepare('SELECT COUNT(*) as c FROM coupons WHERE active = 1').get() as any).c;
    const totalClicks = (d.prepare('SELECT COALESCE(SUM(clickCount), 0) as c FROM stores').get() as any).c;
    const totalLinks = (d.prepare('SELECT COUNT(*) as c FROM short_links').get() as any).c;
    const totalSeoPages = (d.prepare('SELECT COUNT(*) as c FROM seo_pages').get() as any).c;
    const topStores = d.prepare('SELECT name, slug, clickCount as clicks, conversionRate FROM stores WHERE active = 1 ORDER BY clickCount DESC LIMIT 5').all();
    const recentCoupons = d.prepare('SELECT * FROM coupons WHERE active = 1 ORDER BY createdAt DESC LIMIT 5').all().map(parseCoupon);

    return {
      totalStores, totalCoupons, totalClicks, totalLinks, totalSeoPages,
      featuredCoupons: d.prepare('SELECT * FROM coupons WHERE featured = 1 AND active = 1').all().map(parseCoupon),
      recentCoupons,
      topStores,
      storeStats: d.prepare('SELECT name, slug, (SELECT COUNT(*) FROM coupons WHERE storeId = stores.id) as couponCount FROM stores WHERE active = 1').all(),
    };
  },

  // Raw query for AI
  raw: getDb,
};

// ============================================================
// Helpers
// ============================================================
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function detectDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function parseStore(row: any): any {
  return { ...row, tags: JSON.parse(row.tags || '[]'), featured: !!row.featured, active: !!row.active };
}

function parseCoupon(row: any): any {
  return { ...row, featured: !!row.featured, active: !!row.active, verified: !!row.verified };
}
