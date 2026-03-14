// Universal Database Layer - Works on Vercel (in-memory) and locally (SQLite)
import type { Store, Coupon, ShortLink } from '@/types';

// ============================================================
// In-Memory Store (works everywhere including Vercel)
// ============================================================
// Pre-seed data matching Store type
const makeStore = (o: Partial<Store> & { id: string; name: string; slug: string; website: string; category: string }): Store => ({
  nameZh: o.name, descriptionZh: o.description || '', affiliateUrl: o.website, categoryZh: o.category,
  tags: [], active: true, sortOrder: 0, couponCount: 0, clickCount: 0,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
} as Store);

const stores: Store[] = [
  makeStore({ id: '1', name: 'Temu', slug: 'temu', logo: '', description: '全球购物平台，百万商品超低价', website: 'https://www.temu.com', category: 'shopping', featured: true }),
  makeStore({ id: '2', name: 'SHEIN', slug: 'shein', logo: '', description: '时尚女装，每日上新', website: 'https://www.shein.com', category: 'fashion', featured: true }),
  makeStore({ id: '3', name: 'AliExpress', slug: 'aliexpress', logo: '', description: '阿里巴巴旗下跨境购物平台', website: 'https://www.aliexpress.com', category: 'shopping', featured: true }),
  makeStore({ id: '4', name: 'Anker', slug: 'anker', logo: '', description: '全球充电专家', website: 'https://www.anker.com', category: 'electronics', featured: false }),
  makeStore({ id: '5', name: 'ChatGPT Plus', slug: 'chatgpt', logo: '', description: 'AI 智能助手', website: 'https://chat.openai.com', category: 'ai', featured: true }),
  makeStore({ id: '6', name: 'Nike', slug: 'nike', logo: '', description: '运动装备领导者', website: 'https://www.nike.com', category: 'fashion', featured: false }),
  makeStore({ id: '7', name: 'Hostinger', slug: 'hostinger', logo: '', description: '全球主机服务', website: 'https://www.hostinger.com', category: 'hosting', featured: false }),
];

const makeCoupon = (o: Partial<Coupon> & { id: string; storeId: string; title: string; code: string | null }): Coupon => ({
  titleZh: o.title, description: o.title, descriptionZh: o.title, discount: '0', discountType: 'fixed',
  type: 'code', affiliateUrl: '', startDate: new Date().toISOString(), endDate: null,
  featured: false, active: true, verified: false, clickCount: 0, useCount: 0,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
} as Coupon);

const coupons: Coupon[] = [
  makeCoupon({ id: '1', storeId: '1', storeName: 'Temu', title: '新用户首单立减 $10', code: 'NEWUSER10', discount: '10', discountType: 'fixed', type: 'code', featured: true, verified: true, clickCount: 1520 }),
  makeCoupon({ id: '2', storeId: '2', storeName: 'SHEIN', title: '全场 85 折优惠', code: 'SHEIN15', discount: '15', discountType: 'percentage', type: 'code', featured: true, verified: true, clickCount: 2340 }),
  makeCoupon({ id: '3', storeId: '3', storeName: 'AliExpress', title: '满 $20 减 $3', code: 'SAVE3', discount: '3', discountType: 'fixed', type: 'code', featured: false, verified: true, clickCount: 890 }),
  makeCoupon({ id: '4', storeId: '5', storeName: 'ChatGPT Plus', title: '首月免费试用', code: null, discount: '0', discountType: 'trial', type: 'deal', featured: true, verified: true, clickCount: 3210 }),
  makeCoupon({ id: '5', storeId: '7', storeName: 'Hostinger', title: '虚拟主机低至 $1.99/月', code: 'HAPPYSAVE', discount: '80', discountType: 'percentage', type: 'code', featured: true, verified: true, clickCount: 1100 }),
  makeCoupon({ id: '6', storeId: '6', storeName: 'Nike', title: '会员专享 9 折', code: 'NIKE10', discount: '10', discountType: 'percentage', type: 'code', featured: false, verified: false, clickCount: 670 }),
];

const shortLinks: ShortLink[] = [];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// ============================================================
// Export unified API (compatible with sqlite-db interface)
// ============================================================
export const db = {
  // Stores
  getStores: (params?: { category?: string; featured?: boolean; search?: string; page?: number; limit?: number }) => {
    let filtered = [...stores];
    if (params?.category) filtered = filtered.filter(s => s.category === params.category);
    if (params?.featured) filtered = filtered.filter(s => s.featured);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  },
  getStoreById: (id: string) => stores.find(s => s.id === id) || null,
  getStoreBySlug: (slug: string) => stores.find(s => s.slug === slug) || null,
  createStore: (data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    const store: Store = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    stores.push(store);
    return store;
  },

  // Coupons
  getCoupons: (params?: { storeId?: string; type?: string; featured?: boolean; search?: string; page?: number; limit?: number }) => {
    let filtered = [...coupons];
    if (params?.storeId) filtered = filtered.filter(c => c.storeId === params.storeId);
    if (params?.type) filtered = filtered.filter(c => c.type === params.type);
    if (params?.featured) filtered = filtered.filter(c => c.featured);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)));
    }
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  },
  getCouponById: (id: string) => coupons.find(c => c.id === id) || null,
  createCoupon: (data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>) => {
    const coupon: Coupon = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    coupons.push(coupon);
    return coupon;
  },

  // Short Links
  createShortLink: (data: { originalUrl: string; storeId?: string; couponId?: string }) => {
    const store = data.storeId ? stores.find(s => s.id === data.storeId) : null;
    const code = generateCode();
    const link: ShortLink = {
      id: generateId(), code, originalUrl: data.originalUrl, shortUrl: `/s/${code}`,
      storeId: data.storeId || '', storeName: store?.name, couponId: data.couponId || null,
      clicks: 0, uniqueClicks: 0, createdAt: new Date().toISOString(), lastClickedAt: null,
    };
    shortLinks.push(link);
    return link;
  },
  getShortLinkByCode: (code: string) => shortLinks.find(l => l.code === code) || null,
  incrementClicks: (code: string) => {
    const link = shortLinks.find(l => l.code === code);
    if (link) link.clicks++;
    return link;
  },
  getShortLinks: () => ({ data: shortLinks, total: shortLinks.length }),

  // Stats
  getDashboardStats: () => ({
    totalStores: stores.length,
    totalCoupons: coupons.length,
    totalClicks: coupons.reduce((sum, c) => sum + c.clickCount, 0),
    totalLinks: shortLinks.length,
    featuredCoupons: coupons.filter(c => c.featured),
    recentCoupons: coupons.slice(0, 5),
    storeStats: stores.map(s => ({ name: s.name, slug: s.slug, couponCount: coupons.filter(c => c.storeId === s.id).length })),
  }),
};
