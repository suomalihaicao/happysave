// PostgreSQL Database Adapter
// Persistent storage - works with any PostgreSQL 15+ (including Vercel Postgres, Neon, self-hosted)

import { Pool } from 'pg';

// ============================================================
// Input types for create/update operations
// ============================================================
type StoreInput = { slug: string; name: string; nameZh?: string; description?: string; descriptionZh?: string; logo?: string; website?: string; affiliateUrl?: string; category?: string; categoryZh?: string; tags?: string[]; featured?: boolean; active?: boolean; sortOrder?: number; clickCount?: number; conversionRate?: number; [key: string]: unknown };
type StoreUpdate = Partial<StoreInput>;
type CouponInput = { storeId: string; storeName?: string; code?: string | null; title: string; titleZh?: string; description?: string; descriptionZh?: string; discount?: string; discountType?: string; type?: string; affiliateUrl?: string; startDate?: string; endDate?: string | null; featured?: boolean; active?: boolean; verified?: boolean; value?: number; minPurchase?: number; usageLimit?: number; sortOrder?: number; usageCount?: number; [key: string]: unknown };
type CouponUpdate = Partial<CouponInput>;
type ClickInput = { itemId: string; itemType?: string; ip?: string; userAgent?: string; referer?: string };
type SeoPageInput = { slug: string; title: string; content?: string; metaDesc?: string; keywords?: string; type?: string; published?: boolean };
type SeoPageUpdate = Partial<SeoPageInput>;
type CategoryInput = { slug: string; name: string; nameZh?: string; description?: string; icon?: string; sortOrder?: number; active?: boolean };
type CategoryUpdate = Partial<CategoryInput>;
type SubscriberInput = { email: string; name?: string };
type FavoriteInput = { userId: string; itemId: string; itemType?: string };
type NotificationInput = { userId: string; type?: string; title?: string; message?: string };
type _NotificationUpdate = Partial<Pick<NotificationInput, 'title' | 'message' | 'type'>> & { read?: boolean };
type StoreQueryOpts = { category?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number };
type CouponQueryOpts = { storeId?: string; type?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number };
type ClickStatsOpts = { days?: number };
type SeoPageQueryOpts = { type?: string; published?: boolean };

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not configured');

  // 检测是否是 PostgreSQL URL
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    throw new Error('Not a PostgreSQL URL');
  }

  pool = new Pool({
    connectionString: url,
    max: 10,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('✅ PostgreSQL connected');
  return pool;
}

// ============================================================
// Schema
// ============================================================
export async function initPostgres() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(32) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      name_zh VARCHAR(255) DEFAULT '',
      description TEXT,
      description_zh TEXT,
      logo TEXT,
      website TEXT,
      affiliate_url TEXT,
      category VARCHAR(100) DEFAULT '',
      category_zh VARCHAR(100) DEFAULT '',
      tags JSONB DEFAULT '[]',
      featured BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      conversion_rate DECIMAL(5,4) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(32) PRIMARY KEY,
      store_id VARCHAR(32) REFERENCES stores(id),
      code VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      title_zh VARCHAR(255) DEFAULT '',
      description TEXT,
      description_zh TEXT,
      type VARCHAR(50) DEFAULT 'code',
      discount VARCHAR(100) DEFAULT '',
      value DECIMAL(10,2) DEFAULT 0,
      min_purchase DECIMAL(10,2) DEFAULT 0,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      usage_limit INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(32) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      name_zh VARCHAR(255) DEFAULT '',
      description TEXT,
      icon VARCHAR(10) DEFAULT '🏷️',
      sort_order INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS click_logs (
      id VARCHAR(32) PRIMARY KEY,
      item_id VARCHAR(32),
      item_type VARCHAR(50) DEFAULT 'coupon',
      ip VARCHAR(45),
      user_agent TEXT,
      referer TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id VARCHAR(32) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) DEFAULT '',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seo_pages (
      id VARCHAR(32) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      meta_desc TEXT,
      keywords TEXT,
      type VARCHAR(50) DEFAULT 'guide',
      published BOOLEAN DEFAULT true,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id VARCHAR(32) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      item_id VARCHAR(32) NOT NULL,
      item_type VARCHAR(50) DEFAULT 'store',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(32) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'coupon',
      title VARCHAR(500),
      message TEXT,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
    CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
    CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
    CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
    CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  `);

  console.log('✅ PostgreSQL schema initialized');
}

// ============================================================
// Helpers
// ============================================================
function genId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Convert snake_case rows to camelCase
function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// ============================================================
// Store CRUD
// ============================================================
export const postgres = {
  // ---- Stores ----
  async getStores(opts: StoreQueryOpts = {}) {
    const db = getPool();
    let where = 'WHERE 1=1';
    const params: (string | number | boolean)[] = [];
    let idx = 1;

    if (opts.category) { where += ` AND category = $${idx++}`; params.push(opts.category); }
    if (opts.featured) { where += ` AND featured = true`; }
    if (opts.active !== undefined) { where += ` AND active = $${idx++}`; params.push(opts.active); }
    if (opts.search) { where += ` AND (name ILIKE $${idx} OR name_zh ILIKE $${idx})`; params.push(`%${opts.search}%`); idx++; }

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const offset = (page - 1) * limit;

    const countRes = await db.query(`SELECT COUNT(*) as total FROM stores ${where}`, params);
    const total = parseInt(countRes.rows[0]?.total || '0');

    const res = await db.query(
      `SELECT * FROM stores ${where} ORDER BY sort_order ASC, created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    return {
      data: res.rows.map(toCamel),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getStoreById(id: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM stores WHERE id = $1', [id]);
    return toCamel(res.rows[0]);
  },

  async getStoreBySlug(slug: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM stores WHERE slug = $1', [slug]);
    return toCamel(res.rows[0]);
  },

  async createStore(data: StoreInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      `INSERT INTO stores (id, slug, name, name_zh, description, description_zh, logo, website, affiliate_url, category, category_zh, tags, featured, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, data.slug, data.name, data.nameZh || '', data.description || '', data.descriptionZh || '',
       data.logo || '', data.website || '', data.affiliateUrl || '', data.category || '', data.categoryZh || '',
       JSON.stringify(data.tags || []), data.featured || false, data.active !== false, data.sortOrder || 0]
    );
    return this.getStoreById(id);
  },

  async updateStore(id: string, data: StoreUpdate) {
    const db = getPool();
    const sets: string[] = [];
    const params: (string | number | boolean)[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      name: 'name', nameZh: 'name_zh', description: 'description', descriptionZh: 'description_zh',
      logo: 'logo', website: 'website', affiliateUrl: 'affiliate_url', category: 'category',
      categoryZh: 'category_zh', tags: 'tags', featured: 'featured', active: 'active',
      sortOrder: 'sort_order', clickCount: 'click_count', conversionRate: 'conversion_rate',
      slug: 'slug',
    };

    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${dbKey} = $${idx++}`);
        params.push(key === 'tags' ? JSON.stringify(data[key]) : data[key] as string | number | boolean);
      }
    }

    if (sets.length === 0) return this.getStoreById(id);
    sets.push(`updated_at = NOW()`);
    params.push(id);

    await db.query(`UPDATE stores SET ${sets.join(', ')} WHERE id = $${idx}`, params);
    return this.getStoreById(id);
  },

  async deleteStore(id: string) {
    const db = getPool();
    await db.query('DELETE FROM coupons WHERE store_id = $1', [id]);
    await db.query('DELETE FROM stores WHERE id = $1', [id]);
    return { success: true };
  },

  // ---- Coupons ----
  async getCoupons(opts: CouponQueryOpts = {}) {
    const db = getPool();
    let where = 'WHERE 1=1';
    const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    if (opts.storeId) { where += ` AND c.store_id = $${idx++}`; params.push(opts.storeId); }
    if (opts.type) { where += ` AND c.type = $${idx++}`; params.push(opts.type); }
    if (opts.featured) { where += ` AND c.featured = true`; }
    if (opts.active !== undefined) { where += ` AND c.active = $${idx++}`; params.push(opts.active); }
    if (opts.search) { where += ` AND (c.title ILIKE $${idx} OR c.code ILIKE $${idx})`; params.push(`%${opts.search}%`); idx++; }

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const offset = (page - 1) * limit;

    const countRes = await db.query(`SELECT COUNT(*) as total FROM coupons c ${where}`, params);
    const total = parseInt(countRes.rows[0]?.total || '0');

    const res = await db.query(
      `SELECT c.*, s.name as store_name, s.slug as store_slug, s.logo as store_logo
       FROM coupons c LEFT JOIN stores s ON c.store_id = s.id
       ${where} ORDER BY c.sort_order ASC, c.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    return {
      data: res.rows.map(toCamel),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  },

  async getCouponById(id: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM coupons WHERE id = $1', [id]);
    return toCamel(res.rows[0]);
  },

  async createCoupon(data: CouponInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      `INSERT INTO coupons (id, store_id, code, title, title_zh, description, description_zh, type, discount, value, min_purchase, start_date, end_date, usage_limit, active, featured, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [id, data.storeId, data.code, data.title, data.titleZh || '', data.description || '', data.descriptionZh || '',
       data.type || 'code', data.discount || '', data.value || 0, data.minPurchase || 0,
       data.startDate || null, data.endDate || null, data.usageLimit || 0,
       data.active !== false, data.featured || false, data.sortOrder || 0]
    );
    return this.getCouponById(id);
  },

  async updateCoupon(id: string, data: CouponUpdate) {
    const db = getPool();
    const sets: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      storeId: 'store_id', code: 'code', title: 'title', titleZh: 'title_zh',
      description: 'description', descriptionZh: 'description_zh', type: 'type',
      discount: 'discount', value: 'value', minPurchase: 'min_purchase',
      startDate: 'start_date', endDate: 'end_date', usageLimit: 'usage_limit',
      active: 'active', featured: 'featured', sortOrder: 'sort_order', usageCount: 'usage_count',
    };

    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${dbKey} = $${idx++}`);
        params.push(data[key] as string | number | boolean | null);
      }
    }

    if (sets.length === 0) return this.getCouponById(id);
    sets.push(`updated_at = NOW()`);
    params.push(id);

    await db.query(`UPDATE coupons SET ${sets.join(', ')} WHERE id = $${idx}`, params);
    return this.getCouponById(id);
  },

  async deleteCoupon(id: string) {
    const db = getPool();
    await db.query('DELETE FROM coupons WHERE id = $1', [id]);
    return { success: true };
  },

  // ---- Categories ----
  async getCategories() {
    const db = getPool();
    const res = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.rows.map(toCamel);
  },

  async createCategory(data: CategoryInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      'INSERT INTO categories (id, slug, name, name_zh, description, icon, sort_order, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, data.slug, data.name, data.nameZh || '', data.description || '', data.icon || '🏷️', data.sortOrder || 0, data.active !== false]
    );
    return { id, ...data };
  },

  async updateCategory(id: string, data: CategoryUpdate) {
    const db = getPool();
    const sets: string[] = [];
    const params: (string | number | boolean)[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      const dbKey = key === 'nameZh' ? 'name_zh' : key === 'sortOrder' ? 'sort_order' : key;
      sets.push(`${dbKey} = $${idx++}`);
      params.push(val);
    }
    if (sets.length > 0) {
      params.push(id);
      await db.query(`UPDATE categories SET ${sets.join(', ')} WHERE id = $${idx}`, params);
    }
    return { id, ...data };
  },

  async deleteCategory(id: string) {
    const db = getPool();
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    return { success: true };
  },

  // ---- Click Tracking ----
  async trackClick(data: ClickInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      'INSERT INTO click_logs (id, item_id, item_type, ip, user_agent, referer) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, data.itemId, data.itemType || 'coupon', data.ip || '', data.userAgent || '', data.referer || '']
    );
    if (data.itemType === 'store' || data.itemType === 'coupon') {
      await db.query(`UPDATE stores SET click_count = click_count + 1 WHERE id = $1`, [data.itemId]);
    }
    return { success: true };
  },

  async getClickStats(opts: ClickStatsOpts = {}) {
    const db = getPool();
    const days = opts.days || 30;
    const res = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as clicks FROM click_logs WHERE created_at > NOW() - INTERVAL '${days} days' GROUP BY DATE(created_at) ORDER BY date DESC`
    );
    return res.rows.map(toCamel);
  },

  // ---- SEO Pages ----
  async getSeoPages(opts: SeoPageQueryOpts = {}) {
    const db = getPool();
    let where = 'WHERE 1=1';
    const params: (string | boolean)[] = [];
    let idx = 1;
    if (opts.type) { where += ` AND type = $${idx++}`; params.push(opts.type); }
    if (opts.published !== undefined) { where += ` AND published = $${idx++}`; params.push(opts.published); }
    const res = await db.query(`SELECT * FROM seo_pages ${where} ORDER BY created_at DESC`, params);
    return res.rows.map(toCamel);
  },

  async getSeoPageBySlug(slug: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM seo_pages WHERE slug = $1', [slug]);
    return toCamel(res.rows[0]);
  },

  async createSeoPage(data: SeoPageInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      'INSERT INTO seo_pages (id, slug, title, content, meta_desc, keywords, type, published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, data.slug, data.title, data.content || '', data.metaDesc || '', data.keywords || '', data.type || 'guide', data.published !== false]
    );
    return { id, ...data };
  },

  async updateSeoPage(id: string, data: SeoPageUpdate) {
    const db = getPool();
    const sets: string[] = [];
    const params: (string | boolean)[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      const dbKey = key === 'metaDesc' ? 'meta_desc' : key;
      sets.push(`${dbKey} = $${idx++}`);
      params.push(val as string | boolean);
    }
    if (sets.length > 0) {
      sets.push('updated_at = NOW()');
      params.push(id);
      await db.query(`UPDATE seo_pages SET ${sets.join(', ')} WHERE id = $${idx}`, params);
    }
    return { id, ...data };
  },

  async deleteSeoPage(id: string) {
    const db = getPool();
    await db.query('DELETE FROM seo_pages WHERE id = $1', [id]);
    return { success: true };
  },

  async incrementPageViews(slug: string) {
    const db = getPool();
    await db.query('UPDATE seo_pages SET views = views + 1 WHERE slug = $1', [slug]);
  },

  // ---- Subscribers ----
  async getSubscribers() {
    const db = getPool();
    const res = await db.query('SELECT * FROM subscribers ORDER BY created_at DESC');
    return res.rows.map(toCamel);
  },

  async createSubscriber(data: SubscriberInput) {
    const db = getPool();
    const id = genId();
    try {
      await db.query('INSERT INTO subscribers (id, email, name) VALUES ($1,$2,$3)', [id, data.email, data.name || '']);
      return { id, ...data };
    } catch (err: unknown) {
      if (err instanceof Error && (err as NodeJS.ErrnoException).code === '23505') return this.getSubscriberByEmail(data.email);
      throw err;
    }
  },

  async getSubscriberByEmail(email: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM subscribers WHERE email = $1', [email]);
    return toCamel(res.rows[0]);
  },

  async deleteSubscriber(id: string) {
    const db = getPool();
    await db.query('DELETE FROM subscribers WHERE id = $1', [id]);
    return { success: true };
  },

  // ---- Favorites ----
  async getFavorites(userId: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(toCamel);
  },

  async addFavorite(data: FavoriteInput) {
    const db = getPool();
    const id = genId();
    try {
      await db.query(
        'INSERT INTO favorites (id, user_id, item_id, item_type) VALUES ($1,$2,$3,$4)',
        [id, data.userId, data.itemId, data.itemType || 'store']
      );
      return { id, ...data };
    } catch (err: unknown) {
      if (err instanceof Error && (err as NodeJS.ErrnoException).code === '23505') return { alreadyExists: true };
      throw err;
    }
  },

  async removeFavorite(userId: string, itemId: string) {
    const db = getPool();
    await db.query('DELETE FROM favorites WHERE user_id = $1 AND item_id = $2', [userId, itemId]);
    return { success: true };
  },

  async isFavorited(userId: string, itemId: string) {
    const db = getPool();
    const res = await db.query('SELECT COUNT(*) as cnt FROM favorites WHERE user_id = $1 AND item_id = $2', [userId, itemId]);
    return parseInt(res.rows[0]?.cnt || '0') > 0;
  },

  // ---- Notifications ----
  async getNotifications(userId: string) {
    const db = getPool();
    const res = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
    return res.rows.map(toCamel);
  },

  async createNotification(data: NotificationInput) {
    const db = getPool();
    const id = genId();
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message) VALUES ($1,$2,$3,$4,$5)',
      [id, data.userId, data.type || 'coupon', data.title || '', data.message || '']
    );
    return { id, ...data };
  },

  async markNotificationRead(id: string) {
    const db = getPool();
    await db.query('UPDATE notifications SET read = true WHERE id = $1', [id]);
    return { success: true };
  },

  // ---- Combined queries (性能优化) ----
  async getStoreWithCoupons(slug: string) {
    const db = getPool();
    const storeRes = await db.query('SELECT * FROM stores WHERE slug = $1', [slug]);
    const store = toCamel(storeRes.rows[0]);
    if (!store) return { store: null, coupons: [] };

    const couponsRes = await db.query(
      'SELECT * FROM coupons WHERE store_id = $1 AND active = true ORDER BY sort_order ASC, created_at DESC',
      [store.id]
    );
    return { store, coupons: couponsRes.rows.map(toCamel) };
  },

  async getCategoriesWithCount() {
    const db = getPool();
    const res = await db.query(`
      SELECT c.*, COUNT(s.id) as store_count
      FROM categories c LEFT JOIN stores s ON s.category = c.slug AND s.active = true
      GROUP BY c.id ORDER BY c.sort_order ASC
    `);
    return res.rows.map(toCamel);
  },

  // ---- Stats ----
  async getStats() {
    const db = getPool();
    const [stores, coupons, clicks, subs] = await Promise.all([
      db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN active THEN 1 END) as active FROM stores'),
      db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN active THEN 1 END) as active FROM coupons'),
      db.query('SELECT COUNT(*) as total FROM click_logs'),
      db.query('SELECT COUNT(*) as total FROM subscribers'),
    ]);
    return {
      stores: { total: parseInt(stores.rows[0]?.total || '0'), active: parseInt(stores.rows[0]?.active || '0') },
      coupons: { total: parseInt(coupons.rows[0]?.total || '0'), active: parseInt(coupons.rows[0]?.active || '0') },
      clicks: { total: parseInt(clicks.rows[0]?.total || '0') },
      subscribers: { total: parseInt(subs.rows[0]?.total || '0') },
    };
  },

  // Site Config
  async getAllConfig(): Promise<Record<string, string>> {
    try {
      const p = getPool();
      const res = await p.query('SELECT key, value FROM site_config');
      const result: Record<string, string> = {};
      res.rows.forEach((r: { key: string; value: string }) => result[r.key] = r.value);
      return result;
    } catch { return {}; }
  },
  async setConfig(key: string, value: string): Promise<boolean> {
    try {
      const p = getPool();
      await p.query('INSERT INTO site_config (key, value, "updatedAt") VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()', [key, value]);
      return true;
    } catch { return false; }
  },

  // Users
  async getUsers(): Promise<Record<string, unknown>[]> {
    try {
      const p = getPool();
      const res = await p.query('SELECT id, email, name, role, active, "createdAt", "lastLogin" FROM users ORDER BY "createdAt" DESC');
      return res.rows;
    } catch { return []; }
  },
  async createUser(input: { email: string; name?: string; role?: string }): Promise<Record<string, unknown>> {
    const p = getPool();
    const id = Math.random().toString(36).slice(2);
    await p.query('INSERT INTO users (id, email, name, role, active, "createdAt") VALUES ($1, $2, $3, $4, true, NOW())', [id, input.email, input.name || '', input.role || 'user']);
    return { id, email: input.email, name: input.name || '', role: input.role || 'user', active: true };
  },
  async deleteUser(id: string): Promise<boolean> {
    try {
      const p = getPool();
      await p.query('DELETE FROM users WHERE id = $1', [id]);
      return true;
    } catch { return false; }
  },
};
