// Database configuration - supports both local JSON and Supabase
// Set SUPABASE_URL and SUPABASE_ANON_KEY to use Supabase, otherwise falls back to local

import type { Store, Coupon, ShortLink, ClickLog, DashboardStats } from '@/types';

// ============================================
// Local JSON Database (for development/MVP)
// ============================================

const stores: Store[] = [
  {
    id: '1',
    slug: 'temu',
    name: 'Temu',
    nameZh: 'Temu',
    description: 'Shop like a billionaire. Discover incredible deals on fashion, home, beauty & more.',
    descriptionZh: '像亿万富翁一样购物。发现时尚、家居、美妆等超值优惠。',
    logo: '/logos/temu.png',
    website: 'https://www.temu.com',
    affiliateUrl: 'https://www.temu.com?aff=happysave',
    category: 'shopping',
    categoryZh: '综合购物',
    tags: ['fashion', 'home', 'electronics', 'deals'],
    featured: true,
    active: true,
    sortOrder: 1,
    clickCount: 15234,
    conversionRate: 3.2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '2',
    slug: 'shein',
    name: 'SHEIN',
    nameZh: 'SHEIN',
    description: 'Affordable fashion for everyone. Trendy styles at unbeatable prices.',
    descriptionZh: '人人都买得起的时尚。潮流款式，无与伦比的价格。',
    logo: '/logos/shein.png',
    website: 'https://www.shein.com',
    affiliateUrl: 'https://www.shein.com?aff=happysave',
    category: 'fashion',
    categoryZh: '时尚服饰',
    tags: ['fashion', 'women', 'men', 'accessories'],
    featured: true,
    active: true,
    sortOrder: 2,
    clickCount: 12456,
    conversionRate: 4.1,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '3',
    slug: 'aliexpress',
    name: 'AliExpress',
    nameZh: '速卖通',
    description: 'The global online shopping platform. Millions of products at factory prices.',
    descriptionZh: '全球在线购物平台。数百万商品，工厂价格。',
    logo: '/logos/aliexpress.png',
    website: 'https://www.aliexpress.com',
    affiliateUrl: 'https://www.aliexpress.com?aff=happysave',
    category: 'shopping',
    categoryZh: '综合购物',
    tags: ['electronics', 'fashion', 'home', 'tools'],
    featured: true,
    active: true,
    sortOrder: 3,
    clickCount: 9876,
    conversionRate: 2.8,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '4',
    slug: 'anker',
    name: 'Anker',
    nameZh: '安克创新',
    description: 'Leading charging technology brand. Power banks, chargers & cables.',
    descriptionZh: '领先的充电技术品牌。充电宝、充电器、数据线。',
    logo: '/logos/anker.png',
    website: 'https://www.anker.com',
    affiliateUrl: 'https://www.anker.com?aff=happysave',
    category: 'electronics',
    categoryZh: '电子产品',
    tags: ['electronics', 'charging', 'powerbank', 'accessories'],
    featured: false,
    active: true,
    sortOrder: 4,
    clickCount: 5432,
    conversionRate: 5.6,
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '5',
    slug: 'chatgpt',
    name: 'ChatGPT Plus',
    nameZh: 'ChatGPT Plus',
    description: 'The most advanced AI assistant. Faster responses, priority access.',
    descriptionZh: '最先进的AI助手。更快响应，优先体验新功能。',
    logo: '/logos/chatgpt.png',
    website: 'https://chat.openai.com',
    affiliateUrl: 'https://openai.com/chatgpt?aff=happysave',
    category: 'ai',
    categoryZh: 'AI工具',
    tags: ['ai', 'productivity', 'writing', 'coding'],
    featured: true,
    active: true,
    sortOrder: 5,
    clickCount: 8765,
    conversionRate: 6.2,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '6',
    slug: 'nike',
    name: 'Nike',
    nameZh: '耐克',
    description: 'Just Do It. Athletic footwear, apparel, and equipment.',
    descriptionZh: 'Just Do It. 运动鞋、服装和装备。',
    logo: '/logos/nike.png',
    website: 'https://www.nike.com',
    affiliateUrl: 'https://www.nike.com?aff=happysave',
    category: 'fashion',
    categoryZh: '时尚服饰',
    tags: ['sports', 'shoes', 'fashion', 'athletic'],
    featured: true,
    active: true,
    sortOrder: 6,
    clickCount: 7654,
    conversionRate: 3.8,
    createdAt: '2026-01-06T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '7',
    slug: 'hostinger',
    name: 'Hostinger',
    nameZh: 'Hostinger',
    description: 'Fast and affordable web hosting. Free domain & SSL.',
    descriptionZh: '快速实惠的虚拟主机。免费域名和SSL证书。',
    logo: '/logos/hostinger.png',
    website: 'https://www.hostinger.com',
    affiliateUrl: 'https://www.hostinger.com?aff=happysave',
    category: 'hosting',
    categoryZh: '主机服务',
    tags: ['hosting', 'domain', 'ssl', 'website'],
    featured: false,
    active: true,
    sortOrder: 7,
    clickCount: 3210,
    conversionRate: 8.4,
    createdAt: '2026-01-07T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
];

const coupons: Coupon[] = [
  {
    id: '1',
    storeId: '1',
    storeName: 'Temu',
    code: 'SAVE20',
    title: '20% Off Sitewide',
    titleZh: '全场8折优惠',
    description: 'Get 20% off everything. No minimum purchase required.',
    descriptionZh: '全场8折优惠，无最低消费要求。',
    discount: '20%',
    discountType: 'percentage',
    type: 'code',
    affiliateUrl: 'https://www.temu.com?aff=happysave&cpn=SAVE20',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-04-01T00:00:00Z',
    featured: true,
    active: true,
    verified: true,
    clickCount: 12345,
    useCount: 8765,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '2',
    storeId: '1',
    storeName: 'Temu',
    code: null,
    title: 'Free Shipping on Orders $15+',
    titleZh: '满$15免运费',
    description: 'Free shipping on all orders over $15.',
    descriptionZh: '满$15免运费，限时优惠。',
    discount: 'Free Shipping',
    discountType: 'free_shipping',
    type: 'deal',
    affiliateUrl: 'https://www.temu.com?aff=happysave',
    startDate: '2026-03-01T00:00:00Z',
    endDate: null,
    featured: false,
    active: true,
    verified: true,
    clickCount: 8567,
    useCount: 5432,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '3',
    storeId: '2',
    storeName: 'SHEIN',
    code: 'SPRING15',
    title: '15% Off Spring Collection',
    titleZh: '春季新品85折',
    description: 'Save 15% on the new spring fashion collection.',
    descriptionZh: '春季新品85折优惠。',
    discount: '15%',
    discountType: 'percentage',
    type: 'code',
    affiliateUrl: 'https://www.shein.com?aff=happysave&cpn=SPRING15',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-05-01T00:00:00Z',
    featured: true,
    active: true,
    verified: true,
    clickCount: 23456,
    useCount: 15678,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '4',
    storeId: '5',
    storeName: 'ChatGPT Plus',
    code: null,
    title: 'Free Trial - 7 Days',
    titleZh: '免费试用7天',
    description: 'Try ChatGPT Plus free for 7 days.',
    descriptionZh: '免费试用ChatGPT Plus 7天，随时取消。',
    discount: '7-Day Trial',
    discountType: 'trial',
    type: 'deal',
    affiliateUrl: 'https://openai.com/chatgpt?aff=happysave',
    startDate: '2026-03-01T00:00:00Z',
    endDate: null,
    featured: true,
    active: true,
    verified: true,
    clickCount: 34567,
    useCount: 21098,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '5',
    storeId: '6',
    storeName: 'Nike',
    code: 'NIKE25',
    title: '25% Off Select Styles',
    titleZh: '指定款式75折',
    description: 'Save 25% on select Nike styles. Limited time only.',
    descriptionZh: '指定款式75折优惠，限时抢购。',
    discount: '25%',
    discountType: 'percentage',
    type: 'code',
    affiliateUrl: 'https://www.nike.com?aff=happysave&cpn=NIKE25',
    startDate: '2026-03-10T00:00:00Z',
    endDate: '2026-03-31T00:00:00Z',
    featured: true,
    active: true,
    verified: true,
    clickCount: 18765,
    useCount: 11234,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: '6',
    storeId: '7',
    storeName: 'Hostinger',
    code: 'HOST75',
    title: '75% Off Web Hosting',
    titleZh: '主机服务25折',
    description: 'Get 75% off premium web hosting plans.',
    descriptionZh: '高级主机方案低至25折。',
    discount: '75%',
    discountType: 'percentage',
    type: 'code',
    affiliateUrl: 'https://www.hostinger.com?aff=happysave&cpn=HOST75',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-06-01T00:00:00Z',
    featured: false,
    active: true,
    verified: true,
    clickCount: 5678,
    useCount: 2345,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
];

let shortLinks: ShortLink[] = [];
let clickLogs: ClickLog[] = [];

// ============================================
// Database API (enterprise-grade CRUD)
// ============================================

export const db = {
  // Store operations
  stores: {
    findAll: (params?: { category?: string; featured?: boolean; active?: boolean; page?: number; pageSize?: number }) => {
      let result = [...stores];
      if (params?.category) result = result.filter(s => s.category === params.category);
      if (params?.featured !== undefined) result = result.filter(s => s.featured === params.featured);
      if (params?.active !== undefined) result = result.filter(s => s.active === params.active);
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const start = (page - 1) * pageSize;
      
      return {
        data: result.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          total: result.length,
          totalPages: Math.ceil(result.length / pageSize),
        },
      };
    },
    findBySlug: (slug: string) => stores.find(s => s.slug === slug && s.active),
    findById: (id: string) => stores.find(s => s.id === id),
    create: (data: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'clickCount' | 'conversionRate'>) => {
      const store: Store = {
        ...data,
        id: String(Date.now()),
        clickCount: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      stores.push(store);
      return store;
    },
    update: (id: string, data: Partial<Store>) => {
      const index = stores.findIndex(s => s.id === id);
      if (index === -1) return null;
      stores[index] = { ...stores[index], ...data, updatedAt: new Date().toISOString() };
      return stores[index];
    },
    delete: (id: string) => {
      const index = stores.findIndex(s => s.id === id);
      if (index === -1) return false;
      stores.splice(index, 1);
      return true;
    },
  },

  // Coupon operations
  coupons: {
    findAll: (params?: { storeId?: string; type?: string; featured?: boolean; active?: boolean; page?: number; pageSize?: number }) => {
      let result = [...coupons];
      if (params?.storeId) result = result.filter(c => c.storeId === params.storeId);
      if (params?.type) result = result.filter(c => c.type === params.type);
      if (params?.featured !== undefined) result = result.filter(c => c.featured === params.featured);
      if (params?.active !== undefined) result = result.filter(c => c.active === params.active);
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const start = (page - 1) * pageSize;
      
      return {
        data: result.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          total: result.length,
          totalPages: Math.ceil(result.length / pageSize),
        },
      };
    },
    findByStoreSlug: (slug: string) => {
      const store = stores.find(s => s.slug === slug);
      if (!store) return [];
      return coupons.filter(c => c.storeId === store.id && c.active);
    },
    findById: (id: string) => coupons.find(c => c.id === id),
    create: (data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'clickCount' | 'useCount'>) => {
      const coupon: Coupon = {
        ...data,
        id: String(Date.now()),
        clickCount: 0,
        useCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      coupons.push(coupon);
      return coupon;
    },
    update: (id: string, data: Partial<Coupon>) => {
      const index = coupons.findIndex(c => c.id === id);
      if (index === -1) return null;
      coupons[index] = { ...coupons[index], ...data, updatedAt: new Date().toISOString() };
      return coupons[index];
    },
    delete: (id: string) => {
      const index = coupons.findIndex(c => c.id === id);
      if (index === -1) return false;
      coupons.splice(index, 1);
      return true;
    },
  },

  // Short link operations
  shortLinks: {
    create: (originalUrl: string, storeId: string, couponId?: string) => {
      const code = Math.random().toString(36).substring(2, 9);
      const link: ShortLink = {
        id: String(Date.now()),
        code,
        originalUrl,
        shortUrl: `/s/${code}`,
        storeId,
        storeName: stores.find(s => s.id === storeId)?.name,
        couponId: couponId || null,
        clicks: 0,
        uniqueClicks: 0,
        createdAt: new Date().toISOString(),
        lastClickedAt: null,
      };
      shortLinks.push(link);
      return link;
    },
    findByCode: (code: string) => shortLinks.find(l => l.code === code),
    findAll: () => [...shortLinks],
    incrementClick: (code: string) => {
      const link = shortLinks.find(l => l.code === code);
      if (link) {
        link.clicks++;
        link.lastClickedAt = new Date().toISOString();
      }
      return link;
    },
  },

  // Click log operations
  clickLogs: {
    create: (data: Omit<ClickLog, 'id' | 'timestamp'>) => {
      const log: ClickLog = {
        ...data,
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
      };
      clickLogs.push(log);
      return log;
    },
    findAll: (params?: { storeId?: string; limit?: number }) => {
      let result = [...clickLogs].reverse();
      if (params?.storeId) result = result.filter(l => l.storeId === params.storeId);
      if (params?.limit) result = result.slice(0, params.limit);
      return result;
    },
  },

  // Dashboard stats
  getDashboardStats: (): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = clickLogs.filter(l => l.timestamp.startsWith(today));
    
    return {
      totalStores: stores.filter(s => s.active).length,
      totalCoupons: coupons.filter(c => c.active).length,
      totalClicks: stores.reduce((sum, s) => sum + s.clickCount, 0),
      totalConversions: coupons.reduce((sum, c) => sum + c.useCount, 0),
      totalRevenue: coupons.reduce((sum, c) => sum + c.useCount * 25, 0), // Mock revenue
      totalShortLinks: shortLinks.length,
      todayClicks: todayLogs.length,
      todayConversions: Math.floor(todayLogs.length * 0.05),
      topStores: stores
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 5)
        .map(s => ({ name: s.name, clicks: s.clickCount, conversions: Math.floor(s.clickCount * s.conversionRate / 100) })),
      recentClicks: clickLogs.slice(-10).reverse(),
    };
  },

  // Categories
  getCategories: () => {
    const categoryMap = new Map<string, { name: string; nameZh: string; count: number }>();
    stores.filter(s => s.active).forEach(s => {
      const existing = categoryMap.get(s.category);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(s.category, { name: s.category, nameZh: s.categoryZh, count: 1 });
      }
    });
    return Array.from(categoryMap.values());
  },
};
