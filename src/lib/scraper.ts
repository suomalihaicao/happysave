import { db } from './sqlite-db';

interface Merchant {
  name: string;
  slug: string;
  url: string;
  affUrl: string;
  category: string;
  catZh: string;
  logo: string;
  desc: string;
}

const SEED_MERCHANTS: Merchant[] = [
  { name: 'Temu', slug: 'temu', url: 'https://www.temu.com', affUrl: 'https://www.temu.com?ref=happysave', category: 'shopping', catZh: '综合购物', logo: '/logos/temu.png', desc: 'Shop like a billionaire' },
  { name: 'SHEIN', slug: 'shein', url: 'https://www.shein.com', affUrl: 'https://www.shein.com?ref=happysave', category: 'fashion', catZh: '时尚服饰', logo: '/logos/shein.png', desc: 'Online fashion retailer' },
  { name: 'AliExpress', slug: 'aliexpress', url: 'https://www.aliexpress.com', affUrl: 'https://www.aliexpress.com?ref=happysave', category: 'shopping', catZh: '综合购物', logo: '/logos/aliexpress.png', desc: 'Global marketplace' },
  { name: 'ChatGPT Plus', slug: 'chatgpt-plus', url: 'https://chat.openai.com', affUrl: 'https://chat.openai.com?ref=happysave', category: 'ai', catZh: 'AI工具', logo: '/logos/chatgpt.png', desc: 'AI assistant' },
  { name: 'Nike', slug: 'nike', url: 'https://www.nike.com', affUrl: 'https://www.nike.com?ref=happysave', category: 'fashion', catZh: '时尚服饰', logo: '/logos/nike.png', desc: 'Athletic apparel' },
  { name: 'Amazon', slug: 'amazon', url: 'https://www.amazon.com', affUrl: 'https://www.amazon.com?ref=happysave', category: 'shopping', catZh: '综合购物', logo: '/logos/amazon.png', desc: 'Online marketplace' },
  { name: 'Anker', slug: 'anker', url: 'https://www.anker.com', affUrl: 'https://www.anker.com?ref=happysave', category: 'electronics', catZh: '电子产品', logo: '/logos/anker.png', desc: 'Charging technology' },
  { name: 'Adidas', slug: 'adidas', url: 'https://www.adidas.com', affUrl: 'https://www.adidas.com?ref=happysave', category: 'fashion', catZh: '时尚服饰', logo: '/logos/adidas.png', desc: 'Sportswear' },
  { name: 'Hostinger', slug: 'hostinger', url: 'https://www.hostinger.com', affUrl: 'https://www.hostinger.com?ref=happysave', category: 'hosting', catZh: '主机服务', logo: '/logos/hostinger.png', desc: 'Web hosting' },
  { name: 'Walmart', slug: 'walmart', url: 'https://www.walmart.com', affUrl: 'https://www.walmart.com?ref=happysave', category: 'shopping', catZh: '综合购物', logo: '/logos/walmart.png', desc: 'Save money' },
];

const COUPON_TEMPLATES = [
  { title: 'Welcome Discount', titleZh: '新用户专享', codePrefix: 'WELCOME', discount: '10%', type: 'code' },
  { title: 'Season Sale', titleZh: '季节大促', codePrefix: 'SEASON', discount: '15%', type: 'code' },
  { title: 'Flash Deal', titleZh: '限时特惠', codePrefix: 'FLASH', discount: '20%', type: 'code' },
  { title: 'Free Shipping', titleZh: '免运费', codePrefix: null as string | null, discount: 'Free Shipping', type: 'deal' },
  { title: 'VIP Exclusive', titleZh: '会员专享', codePrefix: 'VIP', discount: '30%', type: 'code' },
];

export const scraper = {
  async seedMerchants() {
    let storeCount = 0;
    let couponCount = 0;

    for (const merchant of SEED_MERCHANTS) {
      const existing = await db.getStoreBySlug(merchant.slug);
      if (existing) continue;

      const store = await db.createStore({
        slug: merchant.slug, name: merchant.name, nameZh: merchant.name,
        description: `Official ${merchant.name} deals and coupons`,
        descriptionZh: `${merchant.name} 官方优惠码和折扣信息`,
        logo: merchant.logo, website: merchant.url, affiliateUrl: merchant.affUrl,
        category: merchant.category, categoryZh: merchant.catZh,
        tags: [merchant.category, 'deals'], featured: true, active: true,
      });
      storeCount++;

      for (const tpl of COUPON_TEMPLATES.slice(0, 3)) {
        const code = tpl.codePrefix ? `${tpl.codePrefix}${Math.random().toString(36).substring(2, 5).toUpperCase()}` : null;
        await db.createCoupon({
          storeId: (store as { id: string | number }).id, storeName: merchant.name, code,
          title: `${tpl.title} - ${merchant.name}`, titleZh: `${merchant.name} ${tpl.titleZh}`,
          description: `${tpl.discount} off at ${merchant.name}`,
          descriptionZh: `${merchant.name} ${tpl.titleZh}，${tpl.discount}优惠`,
          discount: tpl.discount, discountType: 'percentage', type: tpl.type,
          affiliateUrl: `${merchant.affUrl}${code ? `&cpn=${code}` : ''}`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          featured: true, active: true, verified: true,
        });
        couponCount++;
      }
    }

    return { stores: storeCount, coupons: couponCount };
  },

  async getStats() {
    const stores = await db.getStores({ limit: 500 });
    const coupons = await db.getCoupons({ limit: 5000 });
    return {
      totalStores: stores.total,
      totalCoupons: coupons.total,
      merchantPool: SEED_MERCHANTS.length,
    };
  },
};
