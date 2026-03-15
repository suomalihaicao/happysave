// SEO 优化配置 - meta tags, Open Graph, etc.
import type { Metadata } from 'next';

const BASE_URL = 'https://happysave.com';
const SITE_NAME = '快乐省省 HappySave';
const DEFAULT_DESC = '全球优惠券聚合平台 - 找到最好的优惠码和折扣，省钱从未如此简单';

export function generateStoreMetadata(store: any): Metadata {
  const title = `${store.name} 优惠码 & 折扣 (${new Date().getFullYear()}) | ${SITE_NAME}`;
  const desc = `获取 ${store.name} 最新优惠码和折扣信息。${store.descriptionZh} 立即查看并省钱！`;
  
  return {
    title,
    description: desc,
    keywords: `${store.name}, 优惠码, 折扣, coupon, promo code, ${store.categoryZh}`,
    openGraph: {
      title,
      description: desc,
      url: `${BASE_URL}/store/${store.slug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${BASE_URL}/og/${store.slug}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
    alternates: {
      canonical: `${BASE_URL}/store/${store.slug}`,
    },
  };
}

export function generateCategoryMetadata(category: string, categoryZh: string): Metadata {
  const title = `${categoryZh} 优惠码大全 | ${SITE_NAME}`;
  const desc = `精选 ${categoryZh} 类别的所有优惠码和折扣信息。来自全球知名品牌，帮你省钱。`;
  
  return {
    title,
    description: desc,
    keywords: `${categoryZh}, 优惠码, 折扣, coupon, deals`,
    openGraph: {
      title,
      description: desc,
      url: `${BASE_URL}/?category=${category}`,
      siteName: SITE_NAME,
    },
  };
}

export const defaultMetadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESC,
  keywords: '优惠码, coupon, promo code, 折扣, deals, 省钱, 促销',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console 验证 (填入你的验证码)
    google: 'your-google-verification-code',
  },
};
