// SEO 配置 - 中文搜索引擎优化
export const BASE_URL = 'https://happysave.cn';

export const SEO_CONFIG = {
  siteName: '快乐省省',
  siteNameEn: 'HappySave',
  baseUrl: BASE_URL,
  defaultTitle: '快乐省省 - 全球优惠券聚合平台 | 海淘省钱必备',
  defaultTitleEn: 'HappySave - Global Coupons & Deals Platform',
  defaultDescription: '发现全球品牌独家优惠码和折扣信息。Temu、SHEIN、Nike、Amazon等50+热门商家最新优惠券，海淘省钱一站搞定。',
  defaultDescriptionEn: 'Find exclusive coupon codes and deals from global brands. Save money on Temu, SHEIN, Nike, Amazon and more.',
  keywords: [
    '优惠券', '优惠码', '折扣码', '海淘', '省钱',
    'Temu优惠券', 'SHEIN折扣码', 'Nike优惠码', 'Amazon折扣',
    '全球购物', '海外购物', '跨境电商', '省钱攻略',
    'coupons', 'promo codes', 'deals', 'discounts',
  ],
  ogImage: `${BASE_URL}/og-image.png`,
  twitterHandle: '@happysave_cn',
  baiduVerify: '', // 百度站长验证
  googleVerify: '', // Google Search Console 验证
};

// 生成页面标题
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  return `${pageTitle} - ${SEO_CONFIG.siteName} | 全球优惠券`;
}

// 生成页面描述
export function generateDescription(desc?: string): string {
  return desc || SEO_CONFIG.defaultDescription;
}

// 结构化数据 - 网站信息
export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    alternateName: SEO_CONFIG.siteNameEn,
    url: SEO_CONFIG.baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SEO_CONFIG.baseUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// 结构化数据 - 商家页面
export function getStoreJsonLd(store: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.descriptionZh || store.description,
    url: `${SEO_CONFIG.baseUrl}/store/${store.slug}`,
    image: store.logo,
    aggregateRating: store.clickCount > 1000 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: Math.floor(store.clickCount / 100),
    } : undefined,
  };
}

// 结构化数据 - 优惠码列表
export function getCouponListJsonLd(coupons: any[], storeName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${storeName} 优惠码`,
    numberOfItems: coupons.length,
    itemListElement: coupons.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: c.title,
        description: c.description,
        price: '0',
        priceCurrency: 'USD',
        availability: c.active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    })),
  };
}

// 结构化数据 - FAQ
export function getFAQJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '如何使用优惠码？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '在快乐省省找到想要的优惠码，点击复制后前往商家官网，在结账时粘贴优惠码即可享受折扣。',
        },
      },
      {
        '@type': 'Question',
        name: '优惠码是免费的吗？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '是的！快乐省省提供的所有优惠码完全免费使用。',
        },
      },
      {
        '@type': 'Question',
        name: '优惠码过期了怎么办？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '我们会定期更新优惠码。如果某个优惠码失效，请查看该商家页面获取最新优惠。',
        },
      },
    ],
  };
}

// 结构化数据 - BreadcrumbList
export function getBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
