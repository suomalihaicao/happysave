// 首页 - 服务端数据获取 + SEO
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { SEO_CONFIG, getFAQJsonLd } from '@/lib/seo';
import { AntdProvider } from '@/providers/AntdProvider';
import HomePageContent from './HomePageContent';

// ISR: 每30分钟重新验证
export const revalidate = 1800;

export const metadata: Metadata = {
  title: SEO_CONFIG.defaultTitle,
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.keywords,
  openGraph: {
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.baseUrl,
    siteName: SEO_CONFIG.siteName,
    images: [{ url: `${SEO_CONFIG.baseUrl}/og-image`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: SEO_CONFIG.baseUrl,
  },
};

export default async function HomePage() {
  // 服务端获取数据
  let stores: any[] = [];
  let coupons: any[] = [];
  let categories: any[] = [];

  try {
    const [s, c, cat] = await Promise.all([
      db.getStores({ active: true, limit: 100 }),
      db.getCoupons({ active: true, limit: 200 }),
      db.getCategories(),
    ]);
    stores = (s.data as any[]) || [];
    coupons = (c.data as any[]) || [];
    categories = (cat as any[]) || [];
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  const faqJsonLd = getFAQJsonLd();

  return (
    <AntdProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomePageContent
        initialStores={stores}
        initialCoupons={coupons}
        initialCategories={categories}
      />
    </AntdProvider>
  );
}
