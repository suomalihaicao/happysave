// TiDB Database Adapter (MySQL compatible)
// Production database - persistent storage on Vercel

import mysql from 'mysql2/promise';

// Connection
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;
  
  const url = process.env.DATABASE_URL || process.env.TIDB_URL;
  if (!url) {
    throw new Error('DATABASE_URL or TIDB_URL not configured');
  }
  
  pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: true },
    // TiDB specific
    supportBigNumbers: true,
    bigNumberStrings: true,
  });
  
  console.log('✅ TiDB connected');
  return pool;
}

// ============================================================
// Schema Initialization
// ============================================================
export async function initTiDB() {
  const db = getPool();
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(32) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      nameZh VARCHAR(255) DEFAULT '',
      description TEXT,
      descriptionZh TEXT,
      logo TEXT,
      website TEXT,
      affiliateUrl TEXT,
      category VARCHAR(100) DEFAULT '',
      categoryZh VARCHAR(100) DEFAULT '',
      tags JSON,
      featured BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE,
      sortOrder INT DEFAULT 0,
      clickCount INT DEFAULT 0,
      conversionRate DECIMAL(5,2) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_slug (slug),
      INDEX idx_featured (featured)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(32) PRIMARY KEY,
      storeId VARCHAR(32) NOT NULL,
      storeName VARCHAR(255) DEFAULT '',
      code VARCHAR(100),
      title VARCHAR(500) NOT NULL,
      titleZh VARCHAR(500),
      description TEXT,
      descriptionZh TEXT,
      discount VARCHAR(100) DEFAULT '',
      discountType VARCHAR(50) DEFAULT 'percentage',
      type VARCHAR(50) DEFAULT 'code',
      affiliateUrl TEXT,
      startDate TIMESTAMP NULL,
      endDate TIMESTAMP NULL,
      featured BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE,
      verified BOOLEAN DEFAULT FALSE,
      clickCount INT DEFAULT 0,
      useCount INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_storeId (storeId),
      INDEX idx_code (code),
      INDEX idx_active (active)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS short_links (
      id VARCHAR(32) PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      originalUrl TEXT NOT NULL,
      shortUrl VARCHAR(255) DEFAULT '',
      storeId VARCHAR(32) DEFAULT '',
      storeName VARCHAR(255) DEFAULT '',
      couponId VARCHAR(32) DEFAULT '',
      clicks INT DEFAULT 0,
      uniqueClicks INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      lastClickedAt TIMESTAMP NULL,
      INDEX idx_code (code)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS click_logs (
      id VARCHAR(32) PRIMARY KEY,
      shortCode VARCHAR(20) DEFAULT '',
      storeId VARCHAR(32) DEFAULT '',
      couponId VARCHAR(32) DEFAULT '',
      ip VARCHAR(45) DEFAULT '',
      userAgent TEXT,
      referer TEXT,
      country VARCHAR(10) DEFAULT '',
      device VARCHAR(20) DEFAULT '',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_storeId (storeId),
      INDEX idx_timestamp (timestamp)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      nameZh VARCHAR(100) DEFAULT '',
      icon VARCHAR(10) DEFAULT '🏷️',
      sortOrder INT DEFAULT 0
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS seo_pages (
      id VARCHAR(32) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      content MEDIUMTEXT,
      metaDesc TEXT,
      keywords TEXT,
      pageType VARCHAR(50) DEFAULT 'store',
      storeId VARCHAR(32) DEFAULT '',
      views INT DEFAULT 0,
      aiGenerated BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id VARCHAR(32) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      itemType VARCHAR(50) NOT NULL,
      itemId VARCHAR(32) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_item (userId, itemType, itemId)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(32) PRIMARY KEY,
      userId VARCHAR(64) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      type VARCHAR(50) DEFAULT 'coupon_alert',
      storeId VARCHAR(32) DEFAULT '',
      keyword VARCHAR(255) DEFAULT '',
      active BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ TiDB tables initialized');
  
  // Seed data if empty
  const [rows] = await db.execute('SELECT COUNT(*) as c FROM stores') as any[];
  if (rows[0].c === 0) {
    await seedTiDB();
  }
}

// ============================================================
// Seed Data
// ============================================================
async function seedTiDB() {
  const db = getPool();
  
  const categories = [
    ['cat-1', 'Shopping', '综合购物', '🛒', 1],
    ['cat-2', 'Fashion', '时尚服饰', '👗', 2],
    ['cat-3', 'Electronics', '电子产品', '📱', 3],
    ['cat-4', 'AI Tools', 'AI工具', '🤖', 4],
    ['cat-5', 'Hosting', '主机服务', '🖥️', 5],
    ['cat-6', 'Beauty', '美妆个护', '💄', 6],
    ['cat-7', 'Travel', '旅行酒店', '✈️', 7],
    ['cat-8', 'Food', '食品生鲜', '🍔', 8],
    ['cat-9', 'Education', '在线教育', '📚', 9],
  ];
  
  for (const c of categories) {
    await db.execute('INSERT INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)', c);
  }
  
  const stores = [
    ['store-1', 'temu', 'Temu', 'Temu', 'Shop like a billionaire', '', 'https://logo.clearbit.com/temu.com', 'https://www.temu.com', 'https://www.temu.com?ref=happysave', 'shopping', '综合购物', '["shopping"]', true, true, 1, 15234, 4.5],
    ['store-2', 'shein', 'SHEIN', 'SHEIN', 'Online fashion retailer', '', 'https://logo.clearbit.com/shein.com', 'https://www.shein.com', 'https://www.shein.com?ref=happysave', 'fashion', '时尚服饰', '["fashion"]', true, true, 2, 12456, 3.8],
    ['store-3', 'aliexpress', 'AliExpress', 'AliExpress', 'Global online marketplace', '', 'https://logo.clearbit.com/aliexpress.com', 'https://www.aliexpress.com', 'https://www.aliexpress.com?ref=happysave', 'shopping', '综合购物', '["shopping"]', true, true, 3, 9876, 3.2],
    ['store-4', 'chatgpt-plus', 'ChatGPT Plus', 'ChatGPT Plus', 'AI-powered assistant', '', 'https://logo.clearbit.com/openai.com', 'https://chat.openai.com', 'https://chat.openai.com?ref=happysave', 'ai', 'AI工具', '["ai"]', true, true, 4, 8765, 5.1],
    ['store-5', 'nike', 'Nike', 'Nike', 'Athletic footwear and apparel', '', 'https://logo.clearbit.com/nike.com', 'https://www.nike.com', 'https://www.nike.com?ref=happysave', 'fashion', '时尚服饰', '["fashion"]', true, true, 5, 7654, 4.2],
    ['store-6', 'amazon', 'Amazon', 'Amazon', 'Earth\'s most customer-centric company', '', 'https://logo.clearbit.com/amazon.com', 'https://www.amazon.com', 'https://www.amazon.com?ref=happysave', 'shopping', '综合购物', '["shopping"]', true, true, 6, 6543, 3.5],
    ['store-7', 'anker', 'Anker', 'Anker', 'Charging technology leader', '', 'https://logo.clearbit.com/anker.com', 'https://www.anker.com', 'https://www.anker.com?ref=happysave', 'electronics', '电子产品', '["electronics"]', false, true, 7, 5432, 2.8],
    ['store-8', 'adidas', 'Adidas', 'Adidas', 'Sportswear and athletic gear', '', 'https://logo.clearbit.com/adidas.com', 'https://www.adidas.com', 'https://www.adidas.com?ref=happysave', 'fashion', '时尚服饰', '["fashion"]', true, true, 8, 4321, 3.1],
    ['store-9', 'hostinger', 'Hostinger', 'Hostinger', 'Web hosting made easy', '', 'https://logo.clearbit.com/hostinger.com', 'https://www.hostinger.com', 'https://www.hostinger.com?ref=happysave', 'hosting', '主机服务', '["hosting"]', false, true, 9, 3210, 2.5],
    ['store-10', 'walmart', 'Walmart', 'Walmart', 'Save money. Live better.', '', 'https://logo.clearbit.com/walmart.com', 'https://www.walmart.com', 'https://www.walmart.com?ref=happysave', 'shopping', '综合购物', '["shopping"]', false, true, 10, 2100, 2.3],
  ];
  
  for (const s of stores) {
    await db.execute(
      'INSERT INTO stores (id, slug, name, nameZh, description, descriptionZh, logo, website, affiliateUrl, category, categoryZh, tags, featured, active, sortOrder, clickCount, conversionRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      s
    );
  }
  
  // Generate coupons for each store
  const templates = [
    ['Welcome Discount', '新用户专享', '10%', 'code', 'WELCOME'],
    ['Season Sale', '季节大促', '15%', 'code', 'SEASON'],
    ['Flash Deal', '限时特惠', '20%', 'code', 'FLASH'],
    ['Free Shipping', '免运费', 'Free Shipping', 'deal', ''],
    ['VIP Exclusive', '会员专享', '30%', 'code', 'VIP'],
  ];
  
  let couponIdx = 0;
  for (let i = 0; i < stores.length; i++) {
    const storeId = stores[i][0];
    const storeName = stores[i][2];
    const storeUrl = stores[i][7] as string;
    const numCoupons = 2 + (i % 2);
    
    for (let j = 0; j < numCoupons && j < templates.length; j++) {
      const t = templates[j];
      const code = t[4] ? `${t[4]}${Math.random().toString(36).substring(2, 5).toUpperCase()}` : null;
      couponIdx++;
      
      await db.execute(
        'INSERT INTO coupons (id, storeId, storeName, code, title, titleZh, description, descriptionZh, discount, discountType, type, affiliateUrl, startDate, endDate, featured, active, verified, clickCount, useCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?, ?)',
        [`coupon-${couponIdx}`, storeId, storeName, code, `${t[0]} - ${storeName}`, `${storeName} ${t[1]}`, `${t[2]} off`, `${t[2]}优惠`, t[2], 'percentage', t[3], `${storeUrl}?ref=happysave${code ? `&cpn=${code}` : ''}`, i < 5 && j === 0, true, true, Math.floor(Math.random() * 500) + 50, Math.floor(Math.random() * 200) + 10]
      );
    }
  }
  
  console.log(`🌱 TiDB seeded: ${stores.length} stores, ${couponIdx} coupons, ${categories.length} categories`);
}

// ============================================================
// Database API (same interface as SQLite/Memory)
// ============================================================
export const tidb = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = getPool();
    const [rows] = await db.execute(sql, params);
    return rows as T[];
  },

  async getOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await tidb.query<T>(sql, params);
    return rows[0] || null;
  },

  // ===== Stores =====
  async getStores(params?: { category?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE 1=1';
    const args: any[] = [];
    
    if (params?.category) { where += ' AND category = ?'; args.push(params.category); }
    if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured); }
    if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active); }
    if (params?.search) { where += ' AND (name LIKE ? OR description LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }
    
    const countRow = await tidb.getOne<{ c: number }>(`SELECT COUNT(*) as c FROM stores ${where}`, args);
    const data = await tidb.query(`SELECT * FROM stores ${where} ORDER BY sortOrder ASC, clickCount DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, args);
    
    return {
      data: data.map((s: any) => ({ ...s, tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags, featured: !!s.featured, active: !!s.active })),
      total: countRow?.c || 0, page, limit,
    };
  },

  async getStoreById(id: string) {
    const s = await tidb.getOne('SELECT * FROM stores WHERE id = ?', [id]);
    return s ? { ...s, tags: typeof (s as any).tags === 'string' ? JSON.parse((s as any).tags) : (s as any).tags, featured: !!(s as any).featured, active: !!(s as any).active } : null;
  },

  async getStoreBySlug(slug: string) {
    const s = await tidb.getOne('SELECT * FROM stores WHERE slug = ? AND active = 1', [slug]);
    return s ? { ...s, tags: typeof (s as any).tags === 'string' ? JSON.parse((s as any).tags) : (s as any).tags, featured: !!(s as any).featured, active: !!(s as any).active } : null;
  },

  async createStore(data: any) {
    const id = 's-' + Math.random().toString(36).substring(2, 15);
    await tidb.query(
      'INSERT INTO stores (id, slug, name, nameZh, description, descriptionZh, logo, website, affiliateUrl, category, categoryZh, tags, featured, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.slug, data.name, data.nameZh || '', data.description || '', data.descriptionZh || '', data.logo || '', data.website || '', data.affiliateUrl || '', data.category || '', data.categoryZh || '', JSON.stringify(data.tags || []), data.featured || false, data.active !== false, data.sortOrder || 0]
    );
    return await tidb.getStoreById(id);
  },

  async updateStore(id: string, data: any) {
    const existing = await tidb.getStoreById(id);
    if (!existing) return null;
    const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
    if (fields.length === 0) return existing;
    const sets = fields.map(([k]) => `${k} = ?`).join(', ');
    const values = fields.map(([k, v]) => k === 'tags' ? JSON.stringify(v) : k === 'featured' || k === 'active' ? !!v : v);
    await tidb.query(`UPDATE stores SET ${sets}, updatedAt = NOW() WHERE id = ?`, [...values, id]);
    return await tidb.getStoreById(id);
  },

  async deleteStore(id: string) {
    await tidb.query('DELETE FROM stores WHERE id = ?', [id]);
    return true;
  },

  // ===== Coupons =====
  async getCoupons(params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE 1=1';
    const args: any[] = [];
    
    if (params?.storeId) { where += ' AND storeId = ?'; args.push(params.storeId); }
    if (params?.type) { where += ' AND type = ?'; args.push(params.type); }
    if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured); }
    if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active); }
    if (params?.search) { where += ' AND (title LIKE ? OR code LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }
    
    const countRow = await tidb.getOne<{ c: number }>(`SELECT COUNT(*) as c FROM coupons ${where}`, args);
    const data = await tidb.query(`SELECT * FROM coupons ${where} ORDER BY featured DESC, clickCount DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, args);
    
    return {
      data: data.map((c: any) => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified })),
      total: countRow?.c || 0, page, limit,
    };
  },

  async getCouponById(id: string) {
    const c = await tidb.getOne('SELECT * FROM coupons WHERE id = ?', [id]);
    return c ? { ...c, featured: !!(c as any).featured, active: !!(c as any).active, verified: !!(c as any).verified } : null;
  },

  async getCouponsByStoreSlug(slug: string) {
    const store = await tidb.getStoreBySlug(slug);
    if (!store) return [];
    const rows = await tidb.query('SELECT * FROM coupons WHERE storeId = ? AND active = 1 ORDER BY featured DESC', [(store as any).id]);
    return rows.map((c: any) => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified }));
  },

  async createCoupon(data: any) {
    const id = 'c-' + Math.random().toString(36).substring(2, 15);
    await tidb.query(
      'INSERT INTO coupons (id, storeId, storeName, code, title, titleZh, description, descriptionZh, discount, discountType, type, affiliateUrl, startDate, endDate, featured, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)',
      [id, data.storeId, data.storeName || '', data.code || null, data.title, data.titleZh || '', data.description || '', data.descriptionZh || '', data.discount || '', data.discountType || 'percentage', data.type || 'code', data.affiliateUrl || '', data.endDate || null, data.featured || false, data.active !== false, data.verified || false]
    );
    return await tidb.getCouponById(id);
  },

  async updateCoupon(id: string, data: any) {
    const existing = await tidb.getCouponById(id);
    if (!existing) return null;
    const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
    if (fields.length === 0) return existing;
    const sets = fields.map(([k]) => `${k} = ?`).join(', ');
    const values = fields.map(([k, v]) => k === 'featured' || k === 'active' || k === 'verified' ? !!v : v);
    await tidb.query(`UPDATE coupons SET ${sets}, updatedAt = NOW() WHERE id = ?`, [...values, id]);
    return await tidb.getCouponById(id);
  },

  async deleteCoupon(id: string) {
    await tidb.query('DELETE FROM coupons WHERE id = ?', [id]);
    return true;
  },

  async incrementCouponClick(id: string) {
    await tidb.query('UPDATE coupons SET clickCount = clickCount + 1, useCount = useCount + 1 WHERE id = ?', [id]);
  },

  // Bulk update coupon stats
  async fixCouponStats() {
    await tidb.query("UPDATE coupons SET clickCount = FLOOR(RAND() * 500) + 50, useCount = FLOOR(RAND() * 200) + 10 WHERE clickCount = 0");
  },

  // ===== Short Links =====
  async createShortLink(data: { originalUrl: string; storeId?: string; couponId?: string }) {
    const id = 'l-' + Math.random().toString(36).substring(2, 15);
    const code = Math.random().toString(36).substring(2, 9);
    let storeName = '';
    if (data.storeId) { const s = await tidb.getStoreById(data.storeId); if (s) storeName = (s as any).name; }
    await tidb.query('INSERT INTO short_links (id, code, originalUrl, shortUrl, storeId, storeName, couponId) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, code, data.originalUrl, `/s/${code}`, data.storeId || '', storeName, data.couponId || null]);
    return await tidb.getOne('SELECT * FROM short_links WHERE id = ?', [id]);
  },

  async getShortLinkByCode(code: string) {
    return await tidb.getOne('SELECT * FROM short_links WHERE code = ?', [code]);
  },

  async getShortLinks() {
    const data = await tidb.query('SELECT * FROM short_links ORDER BY createdAt DESC');
    return { data, total: data.length };
  },

  async incrementLinkClick(code: string) {
    await tidb.query('UPDATE short_links SET clicks = clicks + 1, lastClickedAt = NOW() WHERE code = ?', [code]);
  },

  // ===== Click Logs =====
  async logClick(data: any) {
    const id = 'cl-' + Math.random().toString(36).substring(2, 15);
    const device = /mobile/i.test(data.userAgent || '') ? 'mobile' : /tablet/i.test(data.userAgent || '') ? 'tablet' : 'desktop';
    await tidb.query('INSERT INTO click_logs (id, shortCode, storeId, couponId, ip, userAgent, referer, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, data.shortCode || '', data.storeId || '', data.couponId || '', data.ip || '', data.userAgent || '', data.referer || '', device]);
    if (data.storeId) await tidb.query('UPDATE stores SET clickCount = clickCount + 1 WHERE id = ?', [data.storeId]);
    return id;
  },

  // ===== Categories =====
  async getCategories() {
    return await tidb.query('SELECT * FROM categories ORDER BY sortOrder ASC');
  },

  // ===== SEO =====
  async createSeoPage(data: any) {
    const id = 'seo-' + Math.random().toString(36).substring(2, 15);
    await tidb.query('INSERT INTO seo_pages (id, slug, title, content, metaDesc, keywords, pageType, storeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, data.slug, data.title, data.content || '', data.metaDesc || '', data.keywords || '', data.pageType || 'store', data.storeId || null]);
    return await tidb.getOne('SELECT * FROM seo_pages WHERE id = ?', [id]);
  },

  async getSeoPageBySlug(slug: string) {
    return await tidb.getOne('SELECT * FROM seo_pages WHERE slug = ?', [slug]);
  },

  async getSeoPages() {
    const data = await tidb.query('SELECT * FROM seo_pages ORDER BY createdAt DESC');
    return { data, total: data.length };
  },

  async incrementPageView(slug: string) {
    await tidb.query('UPDATE seo_pages SET views = views + 1 WHERE slug = ?', [slug]);
  },

  // ===== Favorites =====
  async toggleFavorite(userId: string, itemType: string, itemId: string) {
    const existing = await tidb.getOne('SELECT * FROM favorites WHERE userId = ? AND itemType = ? AND itemId = ?', [userId, itemType, itemId]);
    if (existing) { await tidb.query('DELETE FROM favorites WHERE id = ?', [(existing as any).id]); return { favorited: false }; }
    const id = 'fav-' + Math.random().toString(36).substring(2, 15);
    await tidb.query('INSERT INTO favorites (id, userId, itemType, itemId) VALUES (?, ?, ?, ?)', [id, userId, itemType, itemId]);
    return { favorited: true };
  },

  async getFavorites(userId: string) {
    return await tidb.query('SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  },

  // ===== Notifications =====
  async createNotification(data: any) {
    const id = 'n-' + Math.random().toString(36).substring(2, 15);
    await tidb.query('INSERT INTO notifications (id, userId, email, type, storeId, keyword) VALUES (?, ?, ?, ?, ?, ?)', [id, data.userId || '', data.email || '', data.type || 'coupon_alert', data.storeId || '', data.keyword || '']);
    return id;
  },

  // ===== Dashboard =====
  async getDashboardStats() {
    const [stores, coupons, clicks, links, seo, topStores, featured, recent] = await Promise.all([
      await tidb.getOne<{ c: number }>('SELECT COUNT(*) as c FROM stores WHERE active = 1'),
      await tidb.getOne<{ c: number }>('SELECT COUNT(*) as c FROM coupons WHERE active = 1'),
      await tidb.getOne<{ c: number }>('SELECT COALESCE(SUM(clickCount), 0) as c FROM stores'),
      await tidb.getOne<{ c: number }>('SELECT COUNT(*) as c FROM short_links'),
      await tidb.getOne<{ c: number }>('SELECT COUNT(*) as c FROM seo_pages'),
      tidb.query('SELECT name, slug, clickCount as clicks, conversionRate FROM stores WHERE active = 1 ORDER BY clickCount DESC LIMIT 5'),
      tidb.query('SELECT * FROM coupons WHERE featured = 1 AND active = 1'),
      tidb.query('SELECT * FROM coupons WHERE active = 1 ORDER BY createdAt DESC LIMIT 5'),
    ]);
    
    return {
      totalStores: stores?.c || 0, totalCoupons: coupons?.c || 0,
      totalClicks: clicks?.c || 0, totalLinks: links?.c || 0,
      totalSeoPages: seo?.c || 0, topStores, featuredCoupons: featured, recentCoupons: recent,
      storeStats: await tidb.query("SELECT name, slug, (SELECT COUNT(*) FROM coupons WHERE storeId = stores.id) as couponCount FROM stores WHERE active = 1"),
    };
  },

  raw: () => getPool(),
  init: initTiDB,
};
