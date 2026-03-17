// 首页 - 服务端数据获取 + SEO
import { Metadata } from 'next';
import { SEO_CONFIG, getFAQJsonLd } from '@/lib/seo';
import { cached } from '@/lib/cache';
import { Store, Coupon, Category } from '@/types';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 首页内容动态加载 (antd 内部自行处理)
const HomePageContent = dynamic(() => import('./HomePageContent'), {
  loading: () => <div style={{ minHeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div>加载中...</div></div>,
});

// 骨架屏
function HomeSkeleton() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ height: 200, background: 'linear-gradient(135deg, #FFF5F0, #FFE8DB)', borderRadius: 16, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: 100, background: '#F3F4F6', borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  // 服务端获取数据（通过缓存层）
  let stores: Store[] = [];
  let coupons: Coupon[] = [];
  let categories: Category[] = [];

  try {
    const [s, c, cat] = await Promise.all([
      cached.getStores({ active: true, limit: 100 }),
      cached.getCoupons({ active: true, limit: 200 }),
      cached.getCategories(),
    ]);
    stores = (s.data as Store[]) || [];
    coupons = (c.data as Coupon[]) || [];
    categories = (cat as Category[]) || [];
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  const faqJsonLd = getFAQJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense fallback={<HomeSkeleton />}>
        <HomePageContent
          initialStores={stores}
          initialCoupons={coupons}
          initialCategories={categories}
        />
      </Suspense>
    </>
  );
}
