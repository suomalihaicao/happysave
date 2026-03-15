// SQLite Database - Local dev with better-sqlite3, Vercel with in-memory
// better-sqlite3 在 Vercel serverless 上不可用，自动降级到内存模式

type Store = {
  id: string; slug: string; name: string; nameZh: string; description: string;
  descriptionZh: string; logo: string; website: string; affiliateUrl: string;
  category: string; categoryZh: string; tags: string; featured: number;
  active: number; sortOrder: number; clickCount: number; conversionRate: number;
  createdAt: string; updatedAt: string;
};

type Coupon = {
  id: string; storeId: string; storeName: string; code: string | null;
  title: string; titleZh: string; description: string; descriptionZh: string;
  discount: string; discountType: string; type: string; affiliateUrl: string;
  startDate: string; endDate: string | null; featured: number; active: number;
  verified: number; clickCount: number; useCount: number;
  createdAt: string; updatedAt: string;
};

type ShortLink = {
  id: string; code: string; originalUrl: string; shortUrl: string;
  storeId: string; storeName: string; couponId: string; clicks: number;
  uniqueClicks: number; createdAt: string; lastClickedAt: string | null;
};

type ClickLog = {
  id: string; shortCode: string; storeId: string; couponId: string;
  ip: string; userAgent: string; referer: string; country: string;
  device: string; timestamp: string;
};

type Category = { id: string; name: string; nameZh: string; icon: string; sortOrder: number };

type SeoPage = {
  id: string; slug: string; title: string; content: string; metaDesc: string;
  keywords: string; pageType: string; storeId: string; views: number;
  aiGenerated: number; createdAt: string; updatedAt: string;
};

type Favorite = { id: string; userId: string; itemType: string; itemId: string; createdAt: string };
type Notification = { id: string; userId: string; email: string; type: string; storeId: string; keyword: string; active: number; createdAt: string };

// Try to load better-sqlite3 (only available locally, not on Vercel)
// Use eval to avoid Turbopack static analysis
const dynamicRequire = eval('require') as NodeRequire;
let dbType: 'sqlite' | 'memory' = 'memory';
let sqliteDb: any = null;

try {
  const Database = dynamicRequire('better-sqlite3');
  const path = dynamicRequire('path');
  const fs = dynamicRequire('fs');
  
  const DB_PATH = path.join(process.cwd(), 'data', 'happysave.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  dbType = 'sqlite';
  console.log('✅ SQLite database connected:', DB_PATH);
} catch {
  console.log('📦 better-sqlite3 not available, using in-memory storage (Vercel)');
}

// ============================================================
// In-Memory Storage (for Vercel / when SQLite not available)
// ============================================================
const memory = {
  stores: [] as Store[],
  coupons: [] as Coupon[],
  shortLinks: [] as ShortLink[],
  clickLogs: [] as ClickLog[],
  categories: [] as Category[],
  seoPages: [] as SeoPage[],
  favorites: [] as Favorite[],
  notifications: [] as Notification[],
};

// ============================================================
// Seed Data - Auto-populate on Vercel (in-memory mode)
// ============================================================
const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Shopping', nameZh: '综合购物', icon: '🛒', sortOrder: 1 },
  { id: 'cat-2', name: 'Fashion', nameZh: '时尚服饰', icon: '👗', sortOrder: 2 },
  { id: 'cat-3', name: 'Electronics', nameZh: '电子产品', icon: '📱', sortOrder: 3 },
  { id: 'cat-4', name: 'AI Tools', nameZh: 'AI工具', icon: '🤖', sortOrder: 4 },
  { id: 'cat-5', name: 'Hosting', nameZh: '主机服务', icon: '🖥️', sortOrder: 5 },
  { id: 'cat-6', name: 'Beauty', nameZh: '美妆个护', icon: '💄', sortOrder: 6 },
  { id: 'cat-7', name: 'Travel', nameZh: '旅行酒店', icon: '✈️', sortOrder: 7 },
  { id: 'cat-8', name: 'Food', nameZh: '食品生鲜', icon: '🍔', sortOrder: 8 },
  { id: 'cat-9', name: 'Education', nameZh: '在线教育', icon: '📚', sortOrder: 9 },
];

const SEED_STORES = [
  { name: 'Temu', slug: 'temu', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/temu.com', web: 'https://www.temu.com', featured: true, clicks: 15234, desc: 'Shop like a billionaire' },
  { name: 'SHEIN', slug: 'shein', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/shein.com', web: 'https://www.shein.com', featured: true, clicks: 12456, desc: 'Online fashion retailer' },
  { name: 'AliExpress', slug: 'aliexpress', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/aliexpress.com', web: 'https://www.aliexpress.com', featured: true, clicks: 9876, desc: 'Global online marketplace' },
  { name: 'ChatGPT Plus', slug: 'chatgpt-plus', cat: 'ai', catZh: 'AI工具', logo: 'https://logo.clearbit.com/openai.com', web: 'https://chat.openai.com', featured: true, clicks: 8765, desc: 'AI-powered assistant' },
  { name: 'Nike', slug: 'nike', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/nike.com', web: 'https://www.nike.com', featured: true, clicks: 7654, desc: 'Athletic footwear and apparel' },
  { name: 'Amazon', slug: 'amazon', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/amazon.com', web: 'https://www.amazon.com', featured: true, clicks: 6543, desc: 'Earth\'s most customer-centric company' },
  { name: 'Anker', slug: 'anker', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/anker.com', web: 'https://www.anker.com', featured: false, clicks: 5432, desc: 'Charging technology leader' },
  { name: 'Adidas', slug: 'adidas', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/adidas.com', web: 'https://www.adidas.com', featured: true, clicks: 4321, desc: 'Sportswear and athletic gear' },
  { name: 'Hostinger', slug: 'hostinger', cat: 'hosting', catZh: '主机服务', logo: 'https://logo.clearbit.com/hostinger.com', web: 'https://www.hostinger.com', featured: false, clicks: 3210, desc: 'Web hosting made easy' },
  { name: 'Walmart', slug: 'walmart', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/walmart.com', web: 'https://www.walmart.com', featured: false, clicks: 2100, desc: 'Save money. Live better.' },
  { name: 'eBay', slug: 'ebay', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/ebay.com', web: 'https://www.ebay.com', featured: false, clicks: 1980, desc: 'The world\'s online marketplace' },
  { name: 'Target', slug: 'target', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/target.com', web: 'https://www.target.com', featured: false, clicks: 1850, desc: 'Expect more. Pay less.' },
  { name: 'Costco', slug: 'costco', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/costco.com', web: 'https://www.costco.com', featured: false, clicks: 1720, desc: 'Wholesale warehouse club' },
  { name: 'IKEA', slug: 'ikea', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/ikea.com', web: 'https://www.ikea.com', featured: false, clicks: 1650, desc: 'Furniture and home accessories' },
  { name: 'Zara', slug: 'zara', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/zara.com', web: 'https://www.zara.com', featured: false, clicks: 1580, desc: 'Fast fashion retailer' },
  { name: 'Uniqlo', slug: 'uniqlo', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/uniqlo.com', web: 'https://www.uniqlo.com', featured: false, clicks: 1500, desc: 'Japanese casual wear designer' },
  { name: 'Ray-Ban', slug: 'rayban', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/ray-ban.com', web: 'https://www.ray-ban.com', featured: false, clicks: 1420, desc: 'Iconic eyewear brand' },
  { name: 'Bluehost', slug: 'bluehost', cat: 'hosting', catZh: '主机服务', logo: 'https://logo.clearbit.com/bluehost.com', web: 'https://www.bluehost.com', featured: false, clicks: 1350, desc: 'Web hosting solutions' },
  { name: 'Namecheap', slug: 'namecheap', cat: 'hosting', catZh: '主机服务', logo: 'https://logo.clearbit.com/namecheap.com', web: 'https://www.namecheap.com', featured: false, clicks: 1280, desc: 'Domain names and web hosting' },
  { name: 'Runway', slug: 'runway', cat: 'ai', catZh: 'AI工具', logo: 'https://logo.clearbit.com/runway.ml', web: 'https://runway.ml', featured: false, clicks: 1200, desc: 'AI video generation platform' },
  { name: 'ElevenLabs', slug: 'elevenlabs', cat: 'ai', catZh: 'AI工具', logo: 'https://logo.clearbit.com/elevenlabs.io', web: 'https://elevenlabs.io', featured: false, clicks: 1150, desc: 'AI voice generation' },
  { name: 'Copy.ai', slug: 'copyai', cat: 'ai', catZh: 'AI工具', logo: 'https://logo.clearbit.com/copy.ai', web: 'https://www.copy.ai', featured: false, clicks: 1080, desc: 'AI copywriting tool' },
  { name: 'Glossier', slug: 'glossier', cat: 'beauty', catZh: '美妆个护', logo: 'https://logo.clearbit.com/glossier.com', web: 'https://www.glossier.com', featured: false, clicks: 950, desc: 'Beauty inspired by real life' },
  { name: 'Sephora', slug: 'sephora', cat: 'beauty', catZh: '美妆个护', logo: 'https://logo.clearbit.com/sephora.com', web: 'https://www.sephora.com', featured: false, clicks: 920, desc: 'Beauty retailer' },
  { name: 'Booking.com', slug: 'booking', cat: 'travel', catZh: '旅行酒店', logo: 'https://logo.clearbit.com/booking.com', web: 'https://www.booking.com', featured: false, clicks: 880, desc: 'Hotel and travel deals' },
  { name: 'Airbnb', slug: 'airbnb', cat: 'travel', catZh: '旅行酒店', logo: 'https://logo.clearbit.com/airbnb.com', web: 'https://www.airbnb.com', featured: false, clicks: 850, desc: 'Unique stays and experiences' },
  { name: 'Grubhub', slug: 'grubhub', cat: 'food', catZh: '食品生鲜', logo: 'https://logo.clearbit.com/grubhub.com', web: 'https://www.grubhub.com', featured: false, clicks: 780, desc: 'Food delivery service' },
  { name: 'MasterClass', slug: 'masterclass', cat: 'education', catZh: '在线教育', logo: 'https://logo.clearbit.com/masterclass.com', web: 'https://www.masterclass.com', featured: false, clicks: 720, desc: 'Learn from the best' },
  { name: 'Udemy', slug: 'udemy', cat: 'education', catZh: '在线教育', logo: 'https://logo.clearbit.com/udemy.com', web: 'https://www.udemy.com', featured: false, clicks: 680, desc: 'Online courses marketplace' },
  { name: 'Coursera', slug: 'coursera', cat: 'education', catZh: '在线教育', logo: 'https://logo.clearbit.com/coursera.org', web: 'https://www.coursera.org', featured: false, clicks: 650, desc: 'Learn without limits' },
  { name: 'Samsung', slug: 'samsung', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/samsung.com', web: 'https://www.samsung.com', featured: false, clicks: 620, desc: 'Technology leader' },
  { name: 'LG', slug: 'lg', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/lg.com', web: 'https://www.lg.com', featured: false, clicks: 580, desc: 'Life\'s Good' },
  { name: 'Sony', slug: 'sony', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/sony.com', web: 'https://www.sony.com', featured: false, clicks: 550, desc: 'Electronics and entertainment' },
  { name: 'Dell', slug: 'dell', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/dell.com', web: 'https://www.dell.com', featured: false, clicks: 520, desc: 'Technology solutions' },
  { name: 'HP', slug: 'hp', cat: 'electronics', catZh: '电子产品', logo: 'https://logo.clearbit.com/hp.com', web: 'https://www.hp.com', featured: false, clicks: 490, desc: 'Innovation that makes a difference' },
  { name: 'Gymshark', slug: 'gymshark', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/gymshark.com', web: 'https://www.gymshark.com', featured: false, clicks: 460, desc: 'Fitness apparel' },
  { name: 'Lululemon', slug: 'lululemon', cat: 'fashion', catZh: '时尚服饰', logo: 'https://logo.clearbit.com/lululemon.com', web: 'https://www.lululemon.com', featured: false, clicks: 440, desc: 'Athletic apparel' },
  { name: 'Chewy', slug: 'chewy', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/chewy.com', web: 'https://www.chewy.com', featured: false, clicks: 420, desc: 'Pet supplies' },
  { name: 'Wayfair', slug: 'wayfair', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/wayfair.com', web: 'https://www.wayfair.com', featured: false, clicks: 400, desc: 'Home goods and furniture' },
  { name: 'Etsy', slug: 'etsy', cat: 'shopping', catZh: '综合购物', logo: 'https://logo.clearbit.com/etsy.com', web: 'https://www.etsy.com', featured: false, clicks: 380, desc: 'Handmade and vintage items' },
];

// Seed coupons - generates 2-3 coupons per store
const COUPON_TEMPLATES = [
  { title: 'Welcome Discount', titleZh: '新用户专享', discount: '10%', type: 'code', prefix: 'WELCOME' },
  { title: 'Season Sale', titleZh: '季节大促', discount: '15%', type: 'code', prefix: 'SEASON' },
  { title: 'Flash Deal', titleZh: '限时特惠', discount: '20%', type: 'code', prefix: 'FLASH' },
  { title: 'Free Shipping', titleZh: '免运费', discount: 'Free Shipping', type: 'deal', prefix: '' },
  { title: 'Bundle Offer', titleZh: '组合优惠', discount: '25%', type: 'deal', prefix: '' },
  { title: 'VIP Exclusive', titleZh: '会员专享', discount: '30%', type: 'code', prefix: 'VIP' },
  { title: 'Student Discount', titleZh: '学生优惠', discount: '20%', type: 'code', prefix: 'STUDENT' },
  { title: 'First Order Deal', titleZh: '首单优惠', discount: '$10 Off', type: 'deal', prefix: '' },
];

function seedData() {
  if (memory.stores.length > 0) return; // Already seeded
  
  // Seed categories
  memory.categories = [...SEED_CATEGORIES];
  
  // Seed stores and coupons
  for (let i = 0; i < SEED_STORES.length; i++) {
    const s = SEED_STORES[i];
    const storeId = `store-${i + 1}`;
    const now = new Date().toISOString();
    
    memory.stores.push({
      id: storeId, slug: s.slug, name: s.name, nameZh: s.name,
      description: s.desc, descriptionZh: '',
      logo: s.logo, website: s.web, affiliateUrl: `${s.web}?ref=happysave`,
      category: s.cat, categoryZh: s.catZh,
      tags: JSON.stringify([s.cat]), featured: s.featured ? 1 : 0, active: 1,
      sortOrder: i, clickCount: s.clicks, conversionRate: Math.round(Math.random() * 500) / 100,
      createdAt: now, updatedAt: now,
    });
    
    // Generate 2-3 coupons per store
    const numCoupons = 2 + Math.floor(Math.random() * 2);
    const templates = [...COUPON_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, numCoupons);
    
    for (let j = 0; j < templates.length; j++) {
      const t = templates[j];
      const code = t.prefix ? `${t.prefix}${Math.random().toString(36).substring(2, 5).toUpperCase()}` : null;
      const id = `coupon-${i}-${j}`;
      
      memory.coupons.push({
        id, storeId, storeName: s.name, code,
        title: `${t.title} - ${s.name}`, titleZh: `${s.name} ${t.titleZh}`,
        description: `${t.discount} off at ${s.name}`, descriptionZh: `${s.name} ${t.titleZh}，${t.discount}优惠`,
        discount: t.discount, discountType: 'percentage', type: t.type,
        affiliateUrl: `${s.web}?ref=happysave${code ? `&cpn=${code}` : ''}`,
        startDate: now, endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        featured: i < 5 && j === 0 ? 1 : 0, active: 1, verified: 1,
        clickCount: Math.floor(Math.random() * 500) + 50, useCount: Math.floor(Math.random() * 200) + 10,
        createdAt: now, updatedAt: now,
      });
    }
  }
  
  console.log(`🌱 Seeded: ${memory.stores.length} stores, ${memory.coupons.length} coupons, ${memory.categories.length} categories`);
}

// Auto-seed when in memory mode
if (dbType === 'memory') {
  seedData();
}

// ============================================================
// Shared Utilities
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
// SQLite Schema Init
// ============================================================
if (dbType === 'sqlite' && sqliteDb) {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      nameZh TEXT DEFAULT '', description TEXT DEFAULT '', descriptionZh TEXT DEFAULT '',
      logo TEXT DEFAULT '', website TEXT DEFAULT '', affiliateUrl TEXT DEFAULT '',
      category TEXT DEFAULT '', categoryZh TEXT DEFAULT '', tags TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0,
      clickCount INTEGER DEFAULT 0, conversionRate REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY, storeId TEXT NOT NULL, storeName TEXT DEFAULT '',
      code TEXT, title TEXT NOT NULL, titleZh TEXT DEFAULT '',
      description TEXT DEFAULT '', descriptionZh TEXT DEFAULT '',
      discount TEXT DEFAULT '', discountType TEXT DEFAULT 'percentage',
      type TEXT DEFAULT 'code', affiliateUrl TEXT DEFAULT '',
      startDate TEXT, endDate TEXT, featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1, verified INTEGER DEFAULT 0,
      clickCount INTEGER DEFAULT 0, useCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, originalUrl TEXT NOT NULL,
      shortUrl TEXT DEFAULT '', storeId TEXT, storeName TEXT DEFAULT '',
      couponId TEXT, clicks INTEGER DEFAULT 0, uniqueClicks INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')), lastClickedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS click_logs (
      id TEXT PRIMARY KEY, shortCode TEXT, storeId TEXT, couponId TEXT,
      ip TEXT DEFAULT '', userAgent TEXT DEFAULT '', referer TEXT DEFAULT '',
      country TEXT DEFAULT '', device TEXT DEFAULT '', timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, nameZh TEXT DEFAULT '',
      icon TEXT DEFAULT '🏷️', sortOrder INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS seo_pages (
      id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      content TEXT DEFAULT '', metaDesc TEXT DEFAULT '', keywords TEXT DEFAULT '',
      pageType TEXT DEFAULT 'store', storeId TEXT, views INTEGER DEFAULT 0,
      aiGenerated INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL, itemType TEXT NOT NULL,
      itemId TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, itemType, itemId)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, userId TEXT DEFAULT '', email TEXT DEFAULT '',
      type TEXT DEFAULT 'coupon_alert', storeId TEXT DEFAULT '',
      keyword TEXT DEFAULT '', active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ============================================================
// Database API
// ============================================================
export const database = {
  // ===== Stores =====
  getStores(params?: { category?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    if (dbType === 'sqlite') {
      let where = 'WHERE 1=1';
      const args: any[] = [];
      if (params?.category) { where += ' AND category = ?'; args.push(params.category); }
      if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured ? 1 : 0); }
      if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active ? 1 : 0); }
      if (params?.search) { where += ' AND (name LIKE ? OR description LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }

      const total = sqliteDb.prepare(`SELECT COUNT(*) as c FROM stores ${where}`).get(...args).c;
      const data = sqliteDb.prepare(`SELECT * FROM stores ${where} ORDER BY sortOrder ASC, clickCount DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
      return { data: data.map((s: Store) => ({ ...s, tags: parseTags(s.tags), featured: !!s.featured, active: !!s.active })), total, page, limit };
    }

    // In-memory
    let filtered = [...memory.stores];
    if (params?.category) filtered = filtered.filter(s => s.category === params.category);
    if (params?.featured !== undefined) filtered = filtered.filter(s => !!s.featured === params.featured);
    if (params?.active !== undefined) filtered = filtered.filter(s => !!s.active === params.active);
    if (params?.search) { const q = params.search.toLowerCase(); filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)); }
    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit).map(s => ({ ...s, tags: parseTags(s.tags), featured: !!s.featured, active: !!s.active }));
    return { data, total, page, limit };
  },

  getStoreById(id: string) {
    const store = dbType === 'sqlite'
      ? sqliteDb.prepare('SELECT * FROM stores WHERE id = ?').get(id)
      : memory.stores.find(s => s.id === id);
    return store ? { ...store, tags: parseTags(store.tags), featured: !!store.featured, active: !!store.active } : null;
  },

  getStoreBySlug(slug: string) {
    const store = dbType === 'sqlite'
      ? sqliteDb.prepare('SELECT * FROM stores WHERE slug = ? AND active = 1').get(slug)
      : memory.stores.find(s => s.slug === slug && s.active);
    return store ? { ...store, tags: parseTags(store.tags), featured: !!store.featured, active: !!store.active } : null;
  },

  createStore(data: any) {
    const id = genId();
    const now = new Date().toISOString();
    const store: Store = {
      id, slug: data.slug, name: data.name, nameZh: data.nameZh || '',
      description: data.description || '', descriptionZh: data.descriptionZh || '',
      logo: data.logo || '', website: data.website || '', affiliateUrl: data.affiliateUrl || '',
      category: data.category || '', categoryZh: data.categoryZh || '',
      tags: JSON.stringify(data.tags || []), featured: data.featured ? 1 : 0,
      active: data.active !== false ? 1 : 0, sortOrder: data.sortOrder || 0,
      clickCount: 0, conversionRate: 0, createdAt: now, updatedAt: now,
    };

    if (dbType === 'sqlite') {
      sqliteDb.prepare(`INSERT INTO stores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        store.id, store.slug, store.name, store.nameZh, store.description, store.descriptionZh,
        store.logo, store.website, store.affiliateUrl, store.category, store.categoryZh,
        store.tags, store.featured, store.active, store.sortOrder, store.clickCount, store.conversionRate,
        store.createdAt, store.updatedAt
      );
    } else {
      memory.stores.push(store);
    }
    return database.getStoreById(id);
  },

  updateStore(id: string, data: any) {
    const existing = database.getStoreById(id);
    if (!existing) return null;
    if (dbType === 'sqlite') {
      const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
      for (const [k, v] of fields) {
        const val = k === 'tags' ? JSON.stringify(v) : k === 'featured' || k === 'active' ? (v ? 1 : 0) : v;
        sqliteDb.prepare(`UPDATE stores SET "${k}" = ?, updatedAt = datetime('now') WHERE id = ?`).run(val, id);
      }
    } else {
      const idx = memory.stores.findIndex(s => s.id === id);
      if (idx >= 0) Object.assign(memory.stores[idx], data, { updatedAt: new Date().toISOString() });
    }
    return database.getStoreById(id);
  },

  deleteStore(id: string) {
    if (dbType === 'sqlite') sqliteDb.prepare('DELETE FROM stores WHERE id = ?').run(id);
    else memory.stores = memory.stores.filter(s => s.id !== id);
    return true;
  },

  // ===== Coupons =====
  getCoupons(params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    if (dbType === 'sqlite') {
      let where = 'WHERE 1=1';
      const args: any[] = [];
      if (params?.storeId) { where += ' AND storeId = ?'; args.push(params.storeId); }
      if (params?.type) { where += ' AND type = ?'; args.push(params.type); }
      if (params?.featured !== undefined) { where += ' AND featured = ?'; args.push(params.featured ? 1 : 0); }
      if (params?.active !== undefined) { where += ' AND active = ?'; args.push(params.active ? 1 : 0); }
      if (params?.search) { where += ' AND (title LIKE ? OR code LIKE ?)'; args.push(`%${params.search}%`, `%${params.search}%`); }
      const total = sqliteDb.prepare(`SELECT COUNT(*) as c FROM coupons ${where}`).get(...args).c;
      const data = sqliteDb.prepare(`SELECT * FROM coupons ${where} ORDER BY featured DESC, clickCount DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
      return { data: data.map((c: Coupon) => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified })), total, page, limit };
    }

    let filtered = [...memory.coupons];
    if (params?.storeId) filtered = filtered.filter(c => c.storeId === params.storeId);
    if (params?.type) filtered = filtered.filter(c => c.type === params.type);
    if (params?.featured !== undefined) filtered = filtered.filter(c => !!c.featured === params.featured);
    if (params?.active !== undefined) filtered = filtered.filter(c => !!c.active === params.active);
    if (params?.search) { const q = params.search.toLowerCase(); filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)); }
    const total = filtered.length;
    return { data: filtered.slice(offset, offset + limit).map(c => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified })), total, page, limit };
  },

  getCouponById(id: string) {
    const coupon = dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM coupons WHERE id = ?').get(id) : memory.coupons.find(c => c.id === id);
    return coupon ? { ...coupon, featured: !!coupon.featured, active: !!coupon.active, verified: !!coupon.verified } : null;
  },

  getCouponsByStoreSlug(slug: string) {
    const store = database.getStoreBySlug(slug);
    if (!store) return [];
    if (dbType === 'sqlite') {
      return sqliteDb.prepare('SELECT * FROM coupons WHERE storeId = ? AND active = 1 ORDER BY featured DESC').all(store.id)
        .map((c: Coupon) => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified }));
    }
    return memory.coupons.filter(c => c.storeId === store.id && c.active).map(c => ({ ...c, featured: !!c.featured, active: !!c.active, verified: !!c.verified }));
  },

  createCoupon(data: any) {
    const id = genId();
    const now = new Date().toISOString();
    const coupon: Coupon = {
      id, storeId: data.storeId, storeName: data.storeName || '', code: data.code || null,
      title: data.title, titleZh: data.titleZh || '', description: data.description || '',
      descriptionZh: data.descriptionZh || '', discount: data.discount || '',
      discountType: data.discountType || 'percentage', type: data.type || 'code',
      affiliateUrl: data.affiliateUrl || '', startDate: data.startDate || now,
      endDate: data.endDate || null, featured: data.featured ? 1 : 0,
      active: data.active !== false ? 1 : 0, verified: data.verified ? 1 : 0,
      clickCount: 0, useCount: 0, createdAt: now, updatedAt: now,
    };

    if (dbType === 'sqlite') {
      sqliteDb.prepare(`INSERT INTO coupons VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        coupon.id, coupon.storeId, coupon.storeName, coupon.code, coupon.title, coupon.titleZh,
        coupon.description, coupon.descriptionZh, coupon.discount, coupon.discountType, coupon.type,
        coupon.affiliateUrl, coupon.startDate, coupon.endDate, coupon.featured, coupon.active,
        coupon.verified, coupon.clickCount, coupon.useCount, coupon.createdAt, coupon.updatedAt
      );
    } else {
      memory.coupons.push(coupon);
    }
    return database.getCouponById(id);
  },

  updateCoupon(id: string, data: any) {
    const existing = database.getCouponById(id);
    if (!existing) return null;
    if (dbType === 'sqlite') {
      const fields = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
      for (const [k, v] of fields) {
        const val = k === 'featured' || k === 'active' || k === 'verified' ? (v ? 1 : 0) : v;
        sqliteDb.prepare(`UPDATE coupons SET "${k}" = ?, updatedAt = datetime('now') WHERE id = ?`).run(val, id);
      }
    } else {
      const idx = memory.coupons.findIndex(c => c.id === id);
      if (idx >= 0) Object.assign(memory.coupons[idx], data, { updatedAt: new Date().toISOString() });
    }
    return database.getCouponById(id);
  },

  deleteCoupon(id: string) {
    if (dbType === 'sqlite') sqliteDb.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    else memory.coupons = memory.coupons.filter(c => c.id !== id);
    return true;
  },

  incrementCouponClick(id: string) {
    if (dbType === 'sqlite') sqliteDb.prepare('UPDATE coupons SET clickCount = clickCount + 1, useCount = useCount + 1 WHERE id = ?').run(id);
    else { const c = memory.coupons.find(c => c.id === id); if (c) { c.clickCount++; c.useCount++; } }
  },

  // ===== Short Links =====
  createShortLink(data: { originalUrl: string; storeId?: string; couponId?: string }) {
    const id = genId();
    const code = genCode();
    const now = new Date().toISOString();
    let storeName = '';
    if (data.storeId) { const s = database.getStoreById(data.storeId); if (s) storeName = s.name; }

    const link: ShortLink = {
      id, code, originalUrl: data.originalUrl, shortUrl: `/s/${code}`,
      storeId: data.storeId || '', storeName, couponId: data.couponId || '',
      clicks: 0, uniqueClicks: 0, createdAt: now, lastClickedAt: null,
    };

    if (dbType === 'sqlite') {
      sqliteDb.prepare('INSERT INTO short_links VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
        link.id, link.code, link.originalUrl, link.shortUrl, link.storeId,
        link.storeName, link.couponId, link.clicks, link.uniqueClicks, link.createdAt, link.lastClickedAt
      );
    } else {
      memory.shortLinks.push(link);
    }
    return link;
  },

  getShortLinkByCode(code: string) {
    return dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM short_links WHERE code = ?').get(code) : memory.shortLinks.find(l => l.code === code) || null;
  },

  getShortLinks() {
    const data = dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM short_links ORDER BY createdAt DESC').all() : [...memory.shortLinks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { data, total: data.length };
  },

  incrementLinkClick(code: string) {
    const now = new Date().toISOString();
    if (dbType === 'sqlite') sqliteDb.prepare('UPDATE short_links SET clicks = clicks + 1, lastClickedAt = ? WHERE code = ?').run(now, code);
    else { const l = memory.shortLinks.find(l => l.code === code); if (l) { l.clicks++; l.lastClickedAt = now; } }
  },

  // ===== Click Logs =====
  logClick(data: any) {
    const id = genId();
    const now = new Date().toISOString();
    const device = /mobile/i.test(data.userAgent || '') ? 'mobile' : /tablet/i.test(data.userAgent || '') ? 'tablet' : 'desktop';
    const log: ClickLog = { id, shortCode: data.shortCode || '', storeId: data.storeId || '', couponId: data.couponId || '', ip: data.ip || '', userAgent: data.userAgent || '', referer: data.referer || '', country: data.country || '', device, timestamp: now };

    if (dbType === 'sqlite') {
      sqliteDb.prepare('INSERT INTO click_logs VALUES (?,?,?,?,?,?,?,?,?,?)').run(log.id, log.shortCode, log.storeId, log.couponId, log.ip, log.userAgent, log.referer, log.country, log.device, log.timestamp);
      if (data.storeId) sqliteDb.prepare('UPDATE stores SET clickCount = clickCount + 1 WHERE id = ?').run(data.storeId);
    } else {
      memory.clickLogs.push(log);
      if (data.storeId) { const s = memory.stores.find(s => s.id === data.storeId); if (s) s.clickCount++; }
    }
    return id;
  },

  // ===== Categories =====
  getCategories() {
    return dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM categories ORDER BY sortOrder ASC').all() : [...memory.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  // ===== SEO Pages =====
  createSeoPage(data: any) {
    const id = genId();
    const now = new Date().toISOString();
    const page: SeoPage = { id, slug: data.slug, title: data.title, content: data.content || '', metaDesc: data.metaDesc || '', keywords: data.keywords || '', pageType: data.pageType || 'store', storeId: data.storeId || '', views: 0, aiGenerated: 1, createdAt: now, updatedAt: now };
    if (dbType === 'sqlite') sqliteDb.prepare('INSERT INTO seo_pages VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(page.id, page.slug, page.title, page.content, page.metaDesc, page.keywords, page.pageType, page.storeId, page.views, page.aiGenerated, page.createdAt, page.updatedAt);
    else memory.seoPages.push(page);
    return page;
  },

  getSeoPageBySlug(slug: string) {
    return dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM seo_pages WHERE slug = ?').get(slug) : memory.seoPages.find(p => p.slug === slug) || null;
  },

  getSeoPages() {
    const data = dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM seo_pages ORDER BY createdAt DESC').all() : [...memory.seoPages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { data, total: data.length };
  },

  incrementPageView(slug: string) {
    if (dbType === 'sqlite') sqliteDb.prepare('UPDATE seo_pages SET views = views + 1 WHERE slug = ?').run(slug);
    else { const p = memory.seoPages.find(p => p.slug === slug); if (p) p.views++; }
  },

  // ===== Favorites =====
  toggleFavorite(userId: string, itemType: string, itemId: string) {
    if (dbType === 'sqlite') {
      const existing = sqliteDb.prepare('SELECT * FROM favorites WHERE userId = ? AND itemType = ? AND itemId = ?').get(userId, itemType, itemId);
      if (existing) { sqliteDb.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id); return { favorited: false }; }
      else { sqliteDb.prepare('INSERT INTO favorites VALUES (?,?,?,?,datetime(\'now\'))').run(genId(), userId, itemType, itemId); return { favorited: true }; }
    }
    const idx = memory.favorites.findIndex(f => f.userId === userId && f.itemType === itemType && f.itemId === itemId);
    if (idx >= 0) { memory.favorites.splice(idx, 1); return { favorited: false }; }
    memory.favorites.push({ id: genId(), userId, itemType, itemId, createdAt: new Date().toISOString() });
    return { favorited: true };
  },

  getFavorites(userId: string) {
    return dbType === 'sqlite' ? sqliteDb.prepare('SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC').all(userId) : memory.favorites.filter(f => f.userId === userId);
  },

  // ===== Notifications =====
  createNotification(data: any) {
    const id = genId();
    const now = new Date().toISOString();
    const notif: Notification = { id, userId: data.userId || '', email: data.email || '', type: data.type || 'coupon_alert', storeId: data.storeId || '', keyword: data.keyword || '', active: 1, createdAt: now };
    if (dbType === 'sqlite') sqliteDb.prepare('INSERT INTO notifications VALUES (?,?,?,?,?,?,?,?)').run(notif.id, notif.userId, notif.email, notif.type, notif.storeId, notif.keyword, notif.active, notif.createdAt);
    else memory.notifications.push(notif);
    return id;
  },

  // ===== Dashboard =====
  getDashboardStats() {
    if (dbType === 'sqlite') {
      return {
        totalStores: sqliteDb.prepare('SELECT COUNT(*) as c FROM stores WHERE active = 1').get().c,
        totalCoupons: sqliteDb.prepare('SELECT COUNT(*) as c FROM coupons WHERE active = 1').get().c,
        totalClicks: sqliteDb.prepare('SELECT COALESCE(SUM(clickCount), 0) as c FROM stores').get().c,
        totalLinks: sqliteDb.prepare('SELECT COUNT(*) as c FROM short_links').get().c,
        totalSeoPages: sqliteDb.prepare('SELECT COUNT(*) as c FROM seo_pages').get().c,
        topStores: sqliteDb.prepare('SELECT name, slug, clickCount as clicks, conversionRate FROM stores WHERE active = 1 ORDER BY clickCount DESC LIMIT 5').all(),
        featuredCoupons: sqliteDb.prepare('SELECT * FROM coupons WHERE featured = 1 AND active = 1').all(),
        recentCoupons: sqliteDb.prepare('SELECT * FROM coupons WHERE active = 1 ORDER BY createdAt DESC LIMIT 5').all(),
        storeStats: sqliteDb.prepare("SELECT name, slug, (SELECT COUNT(*) FROM coupons WHERE storeId = stores.id) as couponCount FROM stores WHERE active = 1").all(),
      };
    }
    return {
      totalStores: memory.stores.filter(s => s.active).length,
      totalCoupons: memory.coupons.filter(c => c.active).length,
      totalClicks: memory.stores.reduce((s, st) => s + st.clickCount, 0),
      totalLinks: memory.shortLinks.length,
      totalSeoPages: memory.seoPages.length,
      topStores: memory.stores.filter(s => s.active).sort((a, b) => b.clickCount - a.clickCount).slice(0, 5).map(s => ({ name: s.name, slug: s.slug, clicks: s.clickCount, conversionRate: s.conversionRate })),
      featuredCoupons: memory.coupons.filter(c => c.featured && c.active),
      recentCoupons: memory.coupons.filter(c => c.active).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      storeStats: memory.stores.filter(s => s.active).map(s => ({ name: s.name, slug: s.slug, couponCount: memory.coupons.filter(c => c.storeId === s.id).length })),
    };
  },

  raw: () => sqliteDb,
  type: () => dbType,

  // Delete notification/task
  deleteNotification(id: string) {
    if (dbType === 'sqlite') sqliteDb.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    else memory.notifications = memory.notifications.filter(n => n.id !== id);
    return true;
  },

  // Update notification/task
  updateNotification(id: string, data: any) {
    if (dbType === 'sqlite') {
      if (data.active !== undefined) sqliteDb.prepare('UPDATE notifications SET active = ? WHERE id = ?').run(data.active ? 1 : 0, id);
    } else {
      const n = memory.notifications.find(n => n.id === id);
      if (n) Object.assign(n, data);
    }
    return true;
  },
};
