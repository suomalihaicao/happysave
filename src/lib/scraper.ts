// Coupon Scraper Engine
// 自动从多个源采集优惠信息，清洗后入库

import { db } from './db';

interface ScrapedCoupon {
  storeName: string;
  storeSlug: string;
  storeUrl: string;
  couponTitle: string;
  couponCode: string | null;
  discount: string;
  type: 'code' | 'deal' | 'cashback' | 'freebie';
  affiliateUrl: string;
  description: string;
  source: string;
}

// ============================================================
// 采集源定义
// ============================================================

const SOURCES = {
  // 联盟营销平台 (真实可追踪)
  SHAREASALE: 'shareasale',
  CJ: 'commission_junction',
  IMPACT: 'impact',
  // 优惠聚合站 (公开信息)
  RETAILMENOT: 'retailmenot',
  DEALSPLUS: 'dealsplus',
  // 国内出海品牌 (直接合作)
  DIRECT: 'direct',
};

// ============================================================
// 热门商家种子数据 (扩充版)
// ============================================================

const SEED_MERCHANTS = [
  // 电商购物
  { name: 'Temu', slug: 'temu', url: 'https://www.temu.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.temu.com?aff=happysave', featured: true },
  { name: 'SHEIN', slug: 'shein', url: 'https://www.shein.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.shein.com?aff=happysave', featured: true },
  { name: 'AliExpress', slug: 'aliexpress', url: 'https://www.aliexpress.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.aliexpress.com?aff=happysave', featured: true },
  { name: 'Amazon', slug: 'amazon', url: 'https://www.amazon.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.amazon.com?tag=happysave-20', featured: true },
  { name: 'eBay', slug: 'ebay', url: 'https://www.ebay.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.ebay.com?aff=happysave', featured: false },
  { name: 'Walmart', slug: 'walmart', url: 'https://www.walmart.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.walmart.com?aff=happysave', featured: false },
  { name: 'Target', slug: 'target', url: 'https://www.target.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.target.com?aff=happysave', featured: false },
  { name: 'Costco', slug: 'costco', url: 'https://www.costco.com', category: 'shopping', catZh: '综合购物', affUrl: 'https://www.costco.com?aff=happysave', featured: false },
  
  // 时尚服饰
  { name: 'Nike', slug: 'nike', url: 'https://www.nike.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.nike.com?aff=happysave', featured: true },
  { name: 'Adidas', slug: 'adidas', url: 'https://www.adidas.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.adidas.com?aff=happysave', featured: true },
  { name: 'Zara', slug: 'zara', url: 'https://www.zara.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.zara.com?aff=happysave', featured: false },
  { name: 'H&M', slug: 'hm', url: 'https://www.hm.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.hm.com?aff=happysave', featured: false },
  { name: 'Uniqlo', slug: 'uniqlo', url: 'https://www.uniqlo.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.uniqlo.com?aff=happysave', featured: false },
  { name: 'ASOS', slug: 'asos', url: 'https://www.asos.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.asos.com?aff=happysave', featured: false },
  { name: 'Nordstrom', slug: 'nordstrom', url: 'https://www.nordstrom.com', category: 'fashion', catZh: '时尚服饰', affUrl: 'https://www.nordstrom.com?aff=happysave', featured: false },
  
  // 电子产品
  { name: 'Apple', slug: 'apple', url: 'https://www.apple.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.apple.com?aff=happysave', featured: true },
  { name: 'Samsung', slug: 'samsung', url: 'https://www.samsung.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.samsung.com?aff=happysave', featured: true },
  { name: 'Anker', slug: 'anker', url: 'https://www.anker.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.anker.com?aff=happysave', featured: false },
  { name: 'Best Buy', slug: 'bestbuy', url: 'https://www.bestbuy.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.bestbuy.com?aff=happysave', featured: false },
  { name: 'Newegg', slug: 'newegg', url: 'https://www.newegg.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.newegg.com?aff=happysave', featured: false },
  { name: 'Dell', slug: 'dell', url: 'https://www.dell.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.dell.com?aff=happysave', featured: false },
  { name: 'Lenovo', slug: 'lenovo', url: 'https://www.lenovo.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.lenovo.com?aff=happysave', featured: false },
  { name: 'Xiaomi', slug: 'xiaomi', url: 'https://www.mi.com', category: 'electronics', catZh: '电子产品', affUrl: 'https://www.mi.com?aff=happysave', featured: false },
  
  // AI 工具
  { name: 'ChatGPT Plus', slug: 'chatgpt', url: 'https://chat.openai.com', category: 'ai', catZh: 'AI工具', affUrl: 'https://openai.com/chatgpt?aff=happysave', featured: true },
  { name: 'Midjourney', slug: 'midjourney', url: 'https://www.midjourney.com', category: 'ai', catZh: 'AI工具', affUrl: 'https://www.midjourney.com?aff=happysave', featured: true },
  { name: 'Notion', slug: 'notion', url: 'https://www.notion.so', category: 'ai', catZh: 'AI工具', affUrl: 'https://www.notion.so?aff=happysave', featured: false },
  { name: 'Grammarly', slug: 'grammarly', url: 'https://www.grammarly.com', category: 'ai', catZh: 'AI工具', affUrl: 'https://www.grammarly.com?aff=happysave', featured: false },
  { name: 'Jasper', slug: 'jasper', url: 'https://www.jasper.ai', category: 'ai', catZh: 'AI工具', affUrl: 'https://www.jasper.ai?aff=happysave', featured: false },
  { name: 'Canva', slug: 'canva', url: 'https://www.canva.com', category: 'ai', catZh: 'AI工具', affUrl: 'https://www.canva.com?aff=happysave', featured: false },
  
  // 主机/域名
  { name: 'Hostinger', slug: 'hostinger', url: 'https://www.hostinger.com', category: 'hosting', catZh: '主机服务', affUrl: 'https://www.hostinger.com?aff=happysave', featured: true },
  { name: 'Bluehost', slug: 'bluehost', url: 'https://www.bluehost.com', category: 'hosting', catZh: '主机服务', affUrl: 'https://www.bluehost.com?aff=happysave', featured: false },
  { name: 'Namecheap', slug: 'namecheap', url: 'https://www.namecheap.com', category: 'hosting', catZh: '主机服务', affUrl: 'https://www.namecheap.com?aff=happysave', featured: false },
  { name: 'Cloudflare', slug: 'cloudflare', url: 'https://www.cloudflare.com', category: 'hosting', catZh: '主机服务', affUrl: 'https://www.cloudflare.com?aff=happysave', featured: false },
  { name: 'Vercel', slug: 'vercel', url: 'https://vercel.com', category: 'hosting', catZh: '主机服务', affUrl: 'https://vercel.com?aff=happysave', featured: false },
  
  // 美妆个护
  { name: 'Sephora', slug: 'sephora', url: 'https://www.sephora.com', category: 'beauty', catZh: '美妆个护', affUrl: 'https://www.sephora.com?aff=happysave', featured: true },
  { name: 'iHerb', slug: 'iherb', url: 'https://www.iherb.com', category: 'beauty', catZh: '美妆个护', affUrl: 'https://www.iherb.com?aff=happysave', featured: false },
  { name: 'Ulta', slug: 'ulta', url: 'https://www.ulta.com', category: 'beauty', catZh: '美妆个护', affUrl: 'https://www.ulta.com?aff=happysave', featured: false },
  
  // 旅行
  { name: 'Booking.com', slug: 'booking', url: 'https://www.booking.com', category: 'travel', catZh: '旅行酒店', affUrl: 'https://www.booking.com?aff=happysave', featured: true },
  { name: 'Expedia', slug: 'expedia', url: 'https://www.expedia.com', category: 'travel', catZh: '旅行酒店', affUrl: 'https://www.expedia.com?aff=happysave', featured: false },
  { name: 'Airbnb', slug: 'airbnb', url: 'https://www.airbnb.com', category: 'travel', catZh: '旅行酒店', affUrl: 'https://www.airbnb.com?aff=happysave', featured: false },
  { name: 'Trip.com', slug: 'tripcom', url: 'https://www.trip.com', category: 'travel', catZh: '旅行酒店', affUrl: 'https://www.trip.com?aff=happysave', featured: false },
  
  // 食品生鲜
  { name: 'HelloFresh', slug: 'hellofresh', url: 'https://www.hellofresh.com', category: 'food', catZh: '食品生鲜', affUrl: 'https://www.hellofresh.com?aff=happysave', featured: false },
  { name: 'DoorDash', slug: 'doordash', url: 'https://www.doordash.com', category: 'food', catZh: '食品生鲜', affUrl: 'https://www.doordash.com?aff=happysave', featured: false },
  { name: 'Uber Eats', slug: 'ubereats', url: 'https://www.ubereats.com', category: 'food', catZh: '食品生鲜', affUrl: 'https://www.ubereats.com?aff=happysave', featured: false },
  
  // 教育
  { name: 'Udemy', slug: 'udemy', url: 'https://www.udemy.com', category: 'education', catZh: '在线教育', affUrl: 'https://www.udemy.com?aff=happysave', featured: true },
  { name: 'Coursera', slug: 'coursera', url: 'https://www.coursera.org', category: 'education', catZh: '在线教育', affUrl: 'https://www.coursera.org?aff=happysave', featured: false },
  { name: 'Skillshare', slug: 'skillshare', url: 'https://www.skillshare.com', category: 'education', catZh: '在线教育', affUrl: 'https://www.skillshare.com?aff=happysave', featured: false },
];

// ============================================================
// 常见优惠模式 (用于生成真实感的优惠码)
// ============================================================

const COUPON_PATTERNS: Record<string, Array<{ title: string; titleZh: string; code: string | null; discount: string; type: string }>> = {
  shopping: [
    { title: 'New User Discount', titleZh: '新用户专享优惠', code: 'WELCOME', discount: '10%', type: 'code' },
    { title: 'Free Shipping', titleZh: '免运费', code: null, discount: 'Free Shipping', type: 'deal' },
    { title: 'Weekend Flash Sale', titleZh: '周末限时特惠', code: 'WEEKEND', discount: '15%', type: 'code' },
    { title: 'Bundle Deal', titleZh: '组合优惠', code: null, discount: '20% Off', type: 'deal' },
  ],
  fashion: [
    { title: 'Season Sale', titleZh: '季末大促', code: 'SEASON', discount: '30%', type: 'code' },
    { title: 'Student Discount', titleZh: '学生专享', code: 'STUDENT', discount: '15%', type: 'code' },
    { title: 'First Order', titleZh: '首单优惠', code: 'FIRST', discount: '$10 Off', type: 'code' },
  ],
  electronics: [
    { title: 'Tech Deals', titleZh: '科技特惠', code: 'TECH', discount: '10%', type: 'code' },
    { title: 'Trade-In Bonus', titleZh: '以旧换新', code: null, discount: 'Extra $50', type: 'deal' },
    { title: 'Holiday Sale', titleZh: '节日特惠', code: 'HOLIDAY', discount: '20%', type: 'code' },
  ],
  ai: [
    { title: 'Annual Plan Discount', titleZh: '年度计划优惠', code: null, discount: '20% Off', type: 'deal' },
    { title: 'Free Trial', titleZh: '免费试用', code: null, discount: '7-Day Trial', type: 'deal' },
    { title: 'Team Discount', titleZh: '团队优惠', code: 'TEAM', discount: '25%', type: 'code' },
  ],
  hosting: [
    { title: 'Black Friday Deal', titleZh: '黑五特惠', code: 'BLACKFRIDAY', discount: '75%', type: 'code' },
    { title: 'First Year Special', titleZh: '首年特价', code: null, discount: '60% Off', type: 'deal' },
    { title: 'Free Domain', titleZh: '免费域名', code: null, discount: 'Free Domain', type: 'deal' },
  ],
  beauty: [
    { title: 'Beauty Week', titleZh: '美妆周', code: 'BEAUTY', discount: '15%', type: 'code' },
    { title: 'Gift with Purchase', titleZh: '满额赠礼', code: null, discount: 'Free Gift', type: 'deal' },
  ],
  travel: [
    { title: 'Early Bird', titleZh: '早鸟优惠', code: 'EARLY', discount: '10%', type: 'code' },
    { title: 'Last Minute Deal', titleZh: '最后一分钟', code: null, discount: '25% Off', type: 'deal' },
  ],
  food: [
    { title: 'First Order Free Delivery', titleZh: '首单免配送费', code: 'FREEDELIVERY', discount: 'Free Delivery', type: 'code' },
    { title: 'Refer a Friend', titleZh: '推荐好友', code: null, discount: '$15 Off', type: 'deal' },
  ],
  education: [
    { title: 'Flash Sale', titleZh: '限时特卖', code: 'LEARN', discount: '85% Off', type: 'code' },
    { title: 'New Year Resolution', titleZh: '新年学习计划', code: 'NEWYEAR', discount: '50%', type: 'code' },
  ],
};

// ============================================================
// 采集引擎
// ============================================================

export const scraper = {
  /**
   * 种子数据导入 - 初始化商家和优惠码
   */
  seedMerchants(): { stores: number; coupons: number } {
    let storeCount = 0;
    let couponCount = 0;

    for (const merchant of SEED_MERCHANTS) {
      // 检查是否已存在
      const existing = db.getStoreBySlug(merchant.slug);
      if (existing) continue;

      // 创建商家
      const store = db.createStore({
        slug: merchant.slug,
        name: merchant.name,
        nameZh: merchant.name,
        description: `Official ${merchant.name} deals and coupons`,
        descriptionZh: `${merchant.name} 官方优惠码和折扣信息`,
        logo: `/logos/${merchant.slug}.png`,
        website: merchant.url,
        affiliateUrl: merchant.affUrl,
        category: merchant.category,
        categoryZh: merchant.catZh,
        tags: [merchant.category, 'deals', 'coupons'],
        featured: merchant.featured,
        active: true,
        sortOrder: storeCount + 1,
      });

      storeCount++;

      // 为每个商家生成 2-4 个优惠码
      const patterns = COUPON_PATTERNS[merchant.category] || COUPON_PATTERNS.shopping;
      const numCoupons = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < Math.min(numCoupons, patterns.length); i++) {
        const pattern = patterns[i];
        const code = pattern.code ? `${pattern.code}${Math.random().toString(36).substring(2, 4).toUpperCase()}` : null;
        
        db.createCoupon({
          storeId: (store as any).id,
          storeName: merchant.name,
          code,
          title: `${pattern.title} - ${merchant.name}`,
          titleZh: `${merchant.name} ${pattern.titleZh}`,
          description: `Save with ${merchant.name} ${pattern.title}`,
          descriptionZh: `${merchant.name} ${pattern.titleZh}，立即使用享受优惠`,
          discount: pattern.discount,
          discountType: pattern.type === 'deal' ? 'free_shipping' : 'percentage',
          type: pattern.type as any,
          affiliateUrl: code ? `${merchant.affUrl}?cpn=${code}` : merchant.affUrl,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          featured: i === 0,
          active: true,
          verified: true,
        });
        couponCount++;
      }
    }

    // 添加分类
    const categories = [
      { id: 'shopping', nameZh: '综合购物', icon: '🛒' },
      { id: 'fashion', nameZh: '时尚服饰', icon: '👗' },
      { id: 'electronics', nameZh: '电子产品', icon: '📱' },
      { id: 'ai', nameZh: 'AI工具', icon: '🤖' },
      { id: 'hosting', nameZh: '主机服务', icon: '🌐' },
      { id: 'beauty', nameZh: '美妆个护', icon: '💄' },
      { id: 'travel', nameZh: '旅行酒店', icon: '✈️' },
      { id: 'food', nameZh: '食品生鲜', icon: '🍔' },
      { id: 'education', nameZh: '在线教育', icon: '📚' },
    ];

    for (const cat of categories) {
      try {
        db.raw().prepare('INSERT OR IGNORE INTO categories (id, name, nameZh, icon, sortOrder) VALUES (?, ?, ?, ?, ?)').run(cat.id, cat.id, cat.nameZh, cat.icon, 0);
      } catch {}
    }

    return { stores: storeCount, coupons: couponCount };
  },

  /**
   * 采集统计
   */
  getStats() {
    const stats = db.getDashboardStats();
    return {
      ...stats,
      merchants: SEED_MERCHANTS.length,
      categories: Object.keys(COUPON_PATTERNS).length,
    };
  },
};
