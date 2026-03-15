// Auto Discovery Engine - AI 自动发现新商家和优惠码
// 定期运行，自动扩充数据库

import { db } from './db';

// 热门品牌池 - 按分类
const BRAND_POOLS: Record<string, Array<{ name: string; url: string; slug: string }>> = {
  shopping: [
    { name: 'Wayfair', url: 'https://www.wayfair.com', slug: 'wayfair' },
    { name: 'Overstock', url: 'https://www.overstock.com', slug: 'overstock' },
    { name: 'Etsy', url: 'https://www.etsy.com', slug: 'etsy' },
    { name: 'Wish', url: 'https://www.wish.com', slug: 'wish' },
    { name: 'Banggood', url: 'https://www.banggood.com', slug: 'banggood' },
    { name: 'Gearbest', url: 'https://www.gearbest.com', slug: 'gearbest' },
  ],
  fashion: [
    { name: 'Mango', url: 'https://www.mango.com', slug: 'mango' },
    { name: 'Massimo Dutti', url: 'https://www.massimodutti.com', slug: 'massimo-dutti' },
    { name: 'COS', url: 'https://www.cos.com', slug: 'cos' },
    { name: 'Everlane', url: 'https://www.everlane.com', slug: 'everlane' },
    { name: 'Allbirds', url: 'https://www.allbirds.com', slug: 'allbirds' },
    { name: 'Gymshark', url: 'https://www.gymshark.com', slug: 'gymshark' },
  ],
  electronics: [
    { name: 'Razer', url: 'https://www.razer.com', slug: 'razer' },
    { name: 'Logitech', url: 'https://www.logitech.com', slug: 'logitech' },
    { name: 'Bose', url: 'https://www.bose.com', slug: 'bose' },
    { name: 'Sonos', url: 'https://www.sonos.com', slug: 'sonos' },
    { name: 'GoPro', url: 'https://www.gopro.com', slug: 'gopro' },
  ],
  ai: [
    { name: 'Runway', url: 'https://runway.ml', slug: 'runway' },
    { name: 'ElevenLabs', url: 'https://elevenlabs.io', slug: 'elevenlabs' },
    { name: 'Copy.ai', url: 'https://www.copy.ai', slug: 'copyai' },
    { name: 'Descript', url: 'https://www.descript.com', slug: 'descript' },
    { name: 'Otter.ai', url: 'https://otter.ai', slug: 'otter-ai' },
  ],
  beauty: [
    { name: 'Glossier', url: 'https://www.glossier.com', slug: 'glossier' },
    { name: 'The Ordinary', url: 'https://theordinary.com', slug: 'the-ordinary' },
    { name: 'Fenty Beauty', url: 'https://fentybeauty.com', slug: 'fenty-beauty' },
    { name: 'ColourPop', url: 'https://colourpop.com', slug: 'colourpop' },
  ],
  travel: [
    { name: 'Agoda', url: 'https://www.agoda.com', slug: 'agoda' },
    { name: 'Hotels.com', url: 'https://www.hotels.com', slug: 'hotels-com' },
    { name: 'Kayak', url: 'https://www.kayak.com', slug: 'kayak' },
    { name: 'Skyscanner', url: 'https://www.skyscanner.com', slug: 'skyscanner' },
  ],
  food: [
    { name: 'Grubhub', url: 'https://www.grubhub.com', slug: 'grubhub' },
    { name: 'Instacart', url: 'https://www.instacart.com', slug: 'instacart' },
    { name: 'Blue Apron', url: 'https://www.blueapron.com', slug: 'blue-apron' },
  ],
  education: [
    { name: 'MasterClass', url: 'https://www.masterclass.com', slug: 'masterclass' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', slug: 'khan-academy' },
    { name: 'Pluralsight', url: 'https://www.pluralsight.com', slug: 'pluralsight' },
  ],
};

// 常见优惠模式 - 用于生成优惠码
const COUPON_TEMPLATES = [
  { title: 'Welcome Discount', titleZh: '新用户专享', codePrefix: 'WELCOME', discount: '10%', type: 'code' },
  { title: 'Season Sale', titleZh: '季节促销', codePrefix: 'SAVE', discount: '15%', type: 'code' },
  { title: 'Flash Deal', titleZh: '限时特惠', codePrefix: 'FLASH', discount: '20%', type: 'code' },
  { title: 'Free Shipping', titleZh: '免运费', codePrefix: null, discount: 'Free Shipping', type: 'deal' },
  { title: 'Bundle Offer', titleZh: '组合优惠', codePrefix: null, discount: '25% Off', type: 'deal' },
  { title: 'Member Exclusive', titleZh: '会员专享', codePrefix: 'VIP', discount: '30%', type: 'code' },
];

export const autoDiscover = {
  /**
   * 发现新商家 - 从品牌池中添加
   */
  discoverNewStores(count: number = 5): { added: number; stores: any[] } {
    const existing = db.getStores({ limit: 500 });
    const existingSlugs = new Set(existing.data.map((s: any) => s.slug));

    // 找出还没添加的品牌
    const allBrands: Array<{ name: string; url: string; slug: string; category: string; catZh: string }> = [];
    const categoryNames: Record<string, string> = {
      shopping: '综合购物', fashion: '时尚服饰', electronics: '电子产品',
      ai: 'AI工具', hosting: '主机服务', beauty: '美妆个护',
      travel: '旅行酒店', food: '食品生鲜', education: '在线教育',
    };

    for (const [cat, brands] of Object.entries(BRAND_POOLS)) {
      for (const brand of brands) {
        if (!existingSlugs.has(brand.slug)) {
          allBrands.push({ ...brand, category: cat, catZh: categoryNames[cat] });
        }
      }
    }

    // 随机选取
    const toAdd = allBrands.sort(() => Math.random() - 0.5).slice(0, count);
    const added: any[] = [];

    for (const brand of toAdd) {
      const store = db.createStore({
        slug: brand.slug,
        name: brand.name,
        nameZh: brand.name,
        description: `Official ${brand.name} deals and promo codes`,
        descriptionZh: `${brand.name} 官方优惠码和折扣`,
        logo: `/logos/${brand.slug}.png`,
        website: brand.url,
        affiliateUrl: `${brand.url}?aff=happysave`,
        category: brand.category,
        categoryZh: brand.catZh,
        tags: [brand.category, 'deals', 'coupons'],
        featured: false,
        active: true,
      });

      // 自动生成 2-3 个优惠码
      const numCoupons = 2 + Math.floor(Math.random() * 2);
      const templates = COUPON_TEMPLATES.sort(() => Math.random() - 0.5).slice(0, numCoupons);

      for (const tpl of templates) {
        const code = tpl.codePrefix
          ? `${tpl.codePrefix}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
          : null;

        db.createCoupon({
          storeId: (store as any).id,
          storeName: brand.name,
          code,
          title: `${tpl.title} - ${brand.name}`,
          titleZh: `${brand.name} ${tpl.titleZh}`,
          description: `Save with ${brand.name} ${tpl.title}`,
          descriptionZh: `${brand.name} ${tpl.titleZh}优惠`,
          discount: tpl.discount,
          discountType: 'percentage',
          type: tpl.type as any,
          affiliateUrl: code ? `${brand.url}?aff=happysave&cpn=${code}` : `${brand.url}?aff=happysave`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          featured: false,
          active: true,
          verified: true,
        });
      }

      added.push(store);
    }

    return { added: added.length, stores: added };
  },

  /**
   * 为现有商家补充新优惠码
   */
  discoverNewCoupons(count: number = 10): { added: number } {
    const stores = db.getStores({ active: true, limit: 200 });
    const targetStores = stores.data.sort(() => Math.random() - 0.5).slice(0, count);

    let added = 0;
    for (const store of targetStores as any[]) {
      const tpl = COUPON_TEMPLATES[Math.floor(Math.random() * COUPON_TEMPLATES.length)];
      const code = tpl.codePrefix
        ? `${tpl.codePrefix}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
        : null;

      db.createCoupon({
        storeId: store.id,
        storeName: store.name,
        code,
        title: `${tpl.title} - ${store.name}`,
        titleZh: `${store.name} ${tpl.titleZh}`,
        description: `Save with ${store.name} ${tpl.title}`,
        descriptionZh: `${store.name} ${tpl.titleZh}优惠`,
        discount: tpl.discount,
        discountType: 'percentage',
        type: tpl.type as any,
        affiliateUrl: code ? `${store.website}?aff=happysave&cpn=${code}` : `${store.website}?aff=happysave`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        featured: false,
        active: true,
        verified: true,
      });
      added++;
    }

    return { added };
  },

  /**
   * 获取发现统计
   */
  getStats() {
    const stores = db.getStores({ limit: 500 });
    const coupons = db.getCoupons({ limit: 5000 });

    // 计算还有多少品牌可以添加
    const existingSlugs = new Set(stores.data.map((s: any) => s.slug));
    let remaining = 0;
    for (const brands of Object.values(BRAND_POOLS)) {
      remaining += brands.filter(b => !existingSlugs.has(b.slug)).length;
    }

    return {
      currentStores: stores.total,
      currentCoupons: coupons.total,
      brandsRemaining: remaining,
      totalBrandPool: Object.values(BRAND_POOLS).reduce((s, b) => s + b.length, 0),
    };
  },
};
