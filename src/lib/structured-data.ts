// 结构化数据 (JSON-LD) - 让搜索引擎展示富片段
import { db } from '@/lib/db';

export function generateStoreSchema(store: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.descriptionZh || store.description,
    url: store.website,
    image: store.logo,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (store.conversionRate / 2).toFixed(1),
      bestRating: '5',
      ratingCount: store.clickCount,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '999',
      offerCount: '10',
    },
  };
}

export function generateCouponSchema(coupon: any, storeName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: coupon.titleZh || coupon.title,
    description: coupon.descriptionZh || coupon.description,
    url: coupon.affiliateUrl,
    price: '0',
    priceCurrency: 'USD',
    seller: {
      '@type': 'Organization',
      name: storeName,
    },
    validFrom: coupon.startDate,
    validThrough: coupon.endDate,
    discount: coupon.discount,
    couponCode: coupon.code || undefined,
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
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

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '快乐省省 HappySave',
    description: '全球优惠券聚合平台 - 找到最好的优惠码和折扣',
    url: 'https://happysave.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://happysave.vercel.app/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
