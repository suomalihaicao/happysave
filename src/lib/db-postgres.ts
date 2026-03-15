// PostgreSQL Database Adapter - Vercel Postgres / Supabase
// 与 SQLite 版本相同的 API，自动适配

import { sql } from '@vercel/postgres';

// ============================================================
// 初始化 - 创建表
// ============================================================

export async function initPostgres() {
  await sql`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "nameZh" TEXT DEFAULT '',
      description TEXT DEFAULT '',
      "descriptionZh" TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      website TEXT DEFAULT '',
      "affiliateUrl" TEXT DEFAULT '',
      category TEXT DEFAULT '',
      "categoryZh" TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      featured BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      "sortOrder" INTEGER DEFAULT 0,
      "clickCount" INTEGER DEFAULT 0,
      "conversionRate" REAL DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      "storeId" TEXT NOT NULL,
      "storeName" TEXT DEFAULT '',
      code TEXT,
      title TEXT NOT NULL,
      "titleZh" TEXT DEFAULT '',
      description TEXT DEFAULT '',
      "descriptionZh" TEXT DEFAULT '',
      discount TEXT DEFAULT '',
      "discountType" TEXT DEFAULT 'percentage',
      type TEXT DEFAULT 'code',
      "affiliateUrl" TEXT DEFAULT '',
      "startDate" TIMESTAMP,
      "endDate" TIMESTAMP,
      featured BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      verified BOOLEAN DEFAULT false,
      "clickCount" INTEGER DEFAULT 0,
      "useCount" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      "originalUrl" TEXT NOT NULL,
      "shortUrl" TEXT DEFAULT '',
      "storeId" TEXT,
      "storeName" TEXT DEFAULT '',
      "couponId" TEXT,
      clicks INTEGER DEFAULT 0,
      "uniqueClicks" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "lastClickedAt" TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS click_logs (
      id TEXT PRIMARY KEY,
      "shortCode" TEXT,
      "storeId" TEXT,
      "couponId" TEXT,
      ip TEXT DEFAULT '',
      "userAgent" TEXT DEFAULT '',
      referer TEXT DEFAULT '',
      country TEXT DEFAULT '',
      device TEXT DEFAULT '',
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "nameZh" TEXT DEFAULT '',
      icon TEXT DEFAULT '🏷️',
      "sortOrder" INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS seo_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      "metaDesc" TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      "pageType" TEXT DEFAULT 'store',
      "storeId" TEXT,
      views INTEGER DEFAULT 0,
      "aiGenerated" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "itemType" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("userId", "itemType", "itemId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      email TEXT,
      type TEXT DEFAULT 'coupon_alert',
      "storeId" TEXT,
      keyword TEXT DEFAULT '',
      active BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('✅ PostgreSQL tables initialized');
}

// ============================================================
// Helpers
// ============================================================

function genId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let r = '';
  for (let i = 0; i < 7; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  return r;
}

function parseTags(t: string): string[] {
  try { return JSON.parse(t || '[]'); } catch { return []; }
}

// ============================================================
// PostgreSQL DB API (与 SQLite 版本相同接口)
// ============================================================

export const pgDb = {
  // ===== Stores =====
  async getStores(params?: { category?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const args: any[] = [];

    if (params?.category) { where += ` AND category = $${args.length + 1}`; args.push(params.category); }
    if (params?.featured !== undefined) { where += ` AND featured = $${args.length + 1}`; args.push(params.featured); }
    if (params?.active !== undefined) { where += ` AND active = $${args.length + 1}`; args.push(params.active); }
    if (params?.search) {
      where += ` AND (name ILIKE $${args.length + 1} OR description ILIKE $${args.length + 2})`;
      args.push(`%${params.search}%`, `%${params.search}%`);
    }

    const countResult = await sql.query(`SELECT COUNT(*) as c FROM stores ${where}`, args);
    const total = parseInt(countResult.rows[0]?.c || '0');

    const data = await sql.query(
      `SELECT * FROM stores ${where} ORDER BY "sortOrder" ASC, "clickCount" DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      [...args, limit, offset]
    );

    return {
      data: data.rows.map(r => ({ ...r, tags: parseTags(r.tags), featured: !!r.featured, active: !!r.active })),
      total, page, limit,
    };
  },

  async getStoreById(id: string) {
    const r = await sql`SELECT * FROM stores WHERE id = ${id}`;
    if (!r.rows[0]) return null;
    const s = r.rows[0];
    return { ...s, tags: parseTags(s.tags), featured: !!s.featured, active: !!s.active };
  },

  async getStoreBySlug(slug: string) {
    const r = await sql`SELECT * FROM stores WHERE slug = ${slug} AND active = true`;
    if (!r.rows[0]) return null;
    const s = r.rows[0];
    return { ...s, tags: parseTags(s.tags), featured: !!s.featured, active: !!s.active };
  },

  async createStore(data: any) {
    const id = genId();
    await sql`
      INSERT INTO stores (id, slug, name, "nameZh", description, "descriptionZh", logo, website, "affiliateUrl", category, "categoryZh", tags, featured, active, "sortOrder")
      VALUES (${id}, ${data.slug}, ${data.name}, ${data.nameZh || ''}, ${data.description || ''}, ${data.descriptionZh || ''}, ${data.logo || ''}, ${data.website || ''}, ${data.affiliateUrl || ''}, ${data.category || ''}, ${data.categoryZh || ''}, ${JSON.stringify(data.tags || [])}, ${data.featured || false}, ${data.active !== false}, ${data.sortOrder || 0})
    `;
    return pgDb.getStoreById(id);
  },

  async updateStore(id: string, data: any) {
    const existing = await pgDb.getStoreById(id);
    if (!existing) return null;
    const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
    if (fields.length === 0) return existing;

    const sets = fields.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
    const values = fields.map(([k, v]) => k === 'tags' ? JSON.stringify(v) : k === 'featured' || k === 'active' ? !!v : v);
    
    await sql.query(`UPDATE stores SET ${sets}, "updatedAt" = NOW() WHERE id = $${fields.length + 1}`, [...values, id]);
    return pgDb.getStoreById(id);
  },

  async deleteStore(id: string) {
    await sql`DELETE FROM stores WHERE id = ${id}`;
    return true;
  },

  // ===== Coupons =====
  async getCoupons(params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const args: any[] = [];

    if (params?.storeId) { where += ` AND "storeId" = $${args.length + 1}`; args.push(params.storeId); }
    if (params?.type) { where += ` AND type = $${args.length + 1}`; args.push(params.type); }
    if (params?.featured !== undefined) { where += ` AND featured = $${args.length + 1}`; args.push(params.featured); }
    if (params?.active !== undefined) { where += ` AND active = $${args.length + 1}`; args.push(params.active); }
    if (params?.search) {
      where += ` AND (title ILIKE $${args.length + 1} OR code ILIKE $${args.length + 2})`;
      args.push(`%${params.search}%`, `%${params.search}%`);
    }

    const countResult = await sql.query(`SELECT COUNT(*) as c FROM coupons ${where}`, args);
    const total = parseInt(countResult.rows[0]?.c || '0');

    const data = await sql.query(
      `SELECT * FROM coupons ${where} ORDER BY featured DESC, "clickCount" DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      [...args, limit, offset]
    );

    return {
      data: data.rows.map(r => ({ ...r, featured: !!r.featured, active: !!r.active, verified: !!r.verified })),
      total, page, limit,
    };
  },

  async getCouponById(id: string) {
    const r = await sql`SELECT * FROM coupons WHERE id = ${id}`;
    if (!r.rows[0]) return null;
    const c = r.rows[0];
    return { ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified };
  },

  async getCouponsByStoreSlug(slug: string) {
    const store: any = await pgDb.getStoreBySlug(slug);
    if (!store) return [];
    const r = await sql`SELECT * FROM coupons WHERE "storeId" = ${store.id} AND active = true ORDER BY featured DESC`;
    return r.rows.map(c => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified }));
  },

  async createCoupon(data: any) {
    const id = genId();
    await sql`
      INSERT INTO coupons (id, "storeId", "storeName", code, title, "titleZh", description, "descriptionZh", discount, "discountType", type, "affiliateUrl", "startDate", "endDate", featured, active, verified)
      VALUES (${id}, ${data.storeId}, ${data.storeName || ''}, ${data.code || null}, ${data.title}, ${data.titleZh || ''}, ${data.description || ''}, ${data.descriptionZh || ''}, ${data.discount || ''}, ${data.discountType || 'percentage'}, ${data.type || 'code'}, ${data.affiliateUrl || ''}, ${data.startDate || new Date().toISOString()}, ${data.endDate || null}, ${data.featured || false}, ${data.active !== false}, ${data.verified || false})
    `;
    return pgDb.getCouponById(id);
  },

  async updateCoupon(id: string, data: any) {
    const existing = await pgDb.getCouponById(id);
    if (!existing) return null;
    const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
    if (fields.length === 0) return existing;

    const sets = fields.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
    const values = fields.map(([k, v]) => k === 'featured' || k === 'active' || k === 'verified' ? !!v : v);

    await sql.query(`UPDATE coupons SET ${sets}, "updatedAt" = NOW() WHERE id = $${fields.length + 1}`, [...values, id]);
    return pgDb.getCouponById(id);
  },

  async deleteCoupon(id: string) {
    await sql`DELETE FROM coupons WHERE id = ${id}`;
    return true;
  },

  async incrementCouponClick(id: string) {
    await sql`UPDATE coupons SET "clickCount" = "clickCount" + 1 WHERE id = ${id}`;
  },

  // ===== Short Links =====
  async createShortLink(data: { originalUrl: string; storeId?: string; couponId?: string }) {
    const id = genId();
    const code = genCode();
    let storeName = '';
    if (data.storeId) {
      const store = await pgDb.getStoreById(data.storeId);
      storeName = (store as any)?.name || '';
    }
    await sql`
      INSERT INTO short_links (id, code, "originalUrl", "shortUrl", "storeId", "storeName", "couponId")
      VALUES (${id}, ${code}, ${data.originalUrl}, ${'/s/' + code}, ${data.storeId || ''}, ${storeName}, ${data.couponId || null})
    `;
    const r = await sql`SELECT * FROM short_links WHERE id = ${id}`;
    return r.rows[0];
  },

  async getShortLinkByCode(code: string) {
    const r = await sql`SELECT * FROM short_links WHERE code = ${code}`;
    return r.rows[0] || null;
  },

  async getShortLinks() {
    const r = await sql`SELECT * FROM short_links ORDER BY "createdAt" DESC`;
    return { data: r.rows, total: r.rows.length };
  },

  async incrementLinkClick(code: string) {
    await sql`UPDATE short_links SET clicks = clicks + 1, "lastClickedAt" = NOW() WHERE code = ${code}`;
  },

  // ===== Click Logs =====
  async logClick(data: any) {
    const id = genId();
    const device = /mobile/i.test(data.userAgent || '') ? 'mobile' : /tablet/i.test(data.userAgent || '') ? 'tablet' : 'desktop';
    await sql`
      INSERT INTO click_logs (id, "shortCode", "storeId", "couponId", ip, "userAgent", referer, device)
      VALUES (${id}, ${data.shortCode || ''}, ${data.storeId || ''}, ${data.couponId || ''}, ${data.ip || ''}, ${data.userAgent || ''}, ${data.referer || ''}, ${device})
    `;
    if (data.storeId) {
      await sql`UPDATE stores SET "clickCount" = "clickCount" + 1 WHERE id = ${data.storeId}`;
    }
    return id;
  },

  // ===== Categories =====
  async getCategories() {
    const r = await sql`SELECT * FROM categories ORDER BY "sortOrder" ASC`;
    return r.rows;
  },

  // ===== SEO =====
  async createSeoPage(data: any) {
    const id = genId();
    await sql`
      INSERT INTO seo_pages (id, slug, title, content, "metaDesc", keywords, "pageType", "storeId", "aiGenerated")
      VALUES (${id}, ${data.slug}, ${data.title}, ${data.content || ''}, ${data.metaDesc || ''}, ${data.keywords || ''}, ${data.pageType || 'store'}, ${data.storeId || null}, true)
    `;
    const r = await sql`SELECT * FROM seo_pages WHERE id = ${id}`;
    return r.rows[0];
  },

  async getSeoPageBySlug(slug: string) {
    const r = await sql`SELECT * FROM seo_pages WHERE slug = ${slug}`;
    return r.rows[0] || null;
  },

  async getSeoPages() {
    const r = await sql`SELECT * FROM seo_pages ORDER BY "createdAt" DESC`;
    return { data: r.rows, total: r.rows.length };
  },

  async incrementPageView(slug: string) {
    await sql`UPDATE seo_pages SET views = views + 1 WHERE slug = ${slug}`;
  },

  // ===== Favorites =====
  async toggleFavorite(userId: string, itemType: string, itemId: string) {
    const existing = await sql`SELECT * FROM favorites WHERE "userId" = ${userId} AND "itemType" = ${itemType} AND "itemId" = ${itemId}`;
    if (existing.rows[0]) {
      await sql`DELETE FROM favorites WHERE id = ${existing.rows[0].id}`;
      return { favorited: false };
    } else {
      await sql`INSERT INTO favorites (id, "userId", "itemType", "itemId") VALUES (${genId()}, ${userId}, ${itemType}, ${itemId})`;
      return { favorited: true };
    }
  },

  async getFavorites(userId: string) {
    const r = await sql`SELECT * FROM favorites WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`;
    return r.rows;
  },

  // ===== Notifications =====
  async createNotification(data: any) {
    const id = genId();
    await sql`
      INSERT INTO notifications (id, "userId", email, type, "storeId", keyword)
      VALUES (${id}, ${data.userId || ''}, ${data.email || ''}, ${data.type || 'coupon_alert'}, ${data.storeId || ''}, ${data.keyword || ''})
    `;
    return id;
  },

  // ===== Dashboard =====
  async getDashboardStats() {
    const [stores, coupons, clicks, links, seo, topStores] = await Promise.all([
      sql`SELECT COUNT(*) as c FROM stores WHERE active = true`,
      sql`SELECT COUNT(*) as c FROM coupons WHERE active = true`,
      sql`SELECT COALESCE(SUM("clickCount"), 0) as c FROM stores`,
      sql`SELECT COUNT(*) as c FROM short_links`,
      sql`SELECT COUNT(*) as c FROM seo_pages`,
      sql`SELECT name, slug, "clickCount" as clicks, "conversionRate" FROM stores WHERE active = true ORDER BY "clickCount" DESC LIMIT 5`,
    ]);

    return {
      totalStores: parseInt(stores.rows[0]?.c || '0'),
      totalCoupons: parseInt(coupons.rows[0]?.c || '0'),
      totalClicks: parseInt(clicks.rows[0]?.c || '0'),
      totalLinks: parseInt(links.rows[0]?.c || '0'),
      totalSeoPages: parseInt(seo.rows[0]?.c || '0'),
      topStores: topStores.rows,
      featuredCoupons: (await sql`SELECT * FROM coupons WHERE featured = true AND active = true`).rows,
      recentCoupons: (await sql`SELECT * FROM coupons WHERE active = true ORDER BY "createdAt" DESC LIMIT 5`).rows,
      storeStats: (await sql`SELECT name, slug, (SELECT COUNT(*) FROM coupons WHERE "storeId" = stores.id) as "couponCount" FROM stores WHERE active = true`).rows,
    };
  },

  raw: () => sql,
  init: initPostgres,
};
