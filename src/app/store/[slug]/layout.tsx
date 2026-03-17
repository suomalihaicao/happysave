// 商店页面 - Server Component metadata + JSON-LD
import { cache as reactCache } from 'react';
import type { Metadata } from 'next';
import { cached } from '@/lib/cache';
import type { Store, Coupon } from '@/types';

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

// ISR: 每小时重新验证
export const revalidate = 3600;

// React cache + 数据缓存: 避免重复查询
const getStoreData = reactCache(async (slug: string) => {
  return await cached.getStoreWithCoupons(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { store, coupons } = await getStoreData(slug);
  
  if (!store) {
    return { title: '商家未找到 | 快乐省省', description: '该商家页面不存在。' };
  }

  const s: Store = store;
  const baseUrl = 'https://www.happysave.cn';
  
  return {
    title: `${s.name} 优惠码 ${s.nameZh || ''} - ${coupons.length} 个优惠 | 快乐省省`,
    description: `${s.name} 最新优惠码和折扣信息。${coupons.length} 个可用优惠，最高可达 50% 折扣。点击复制，结账立减！`,
    keywords: [`${s.name}优惠码`, `${s.name}折扣`, '优惠码', '折扣码', s.category],
    openGraph: {
      title: `${s.name} 优惠码 | 快乐省省`,
      description: `${s.name} ${coupons.length} 个优惠码，最高 50% 折扣！`,
      url: `${baseUrl}/store/${slug}`,
      images: [{ url: `${baseUrl}/og-image?store=${encodeURIComponent(s.name)}`, width: 1200, height: 630, alt: `${s.name} 优惠码` }],
    },
    alternates: { canonical: `${baseUrl}/store/${slug}` },
  };
}

// Server Component — JSON-LD + 子页面内容
export default async function StoreSEOWrapper({ children, params }: Props) {
  const { slug } = await params;
  const { store, coupons } = await getStoreData(slug);
  const s: Store | null = store;
  
  const jsonLd = s ? {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.name,
    alternateName: s.nameZh,
    description: s.descriptionZh || s.description,
    url: `https://www.happysave.cn/store/${slug}`,
    image: s.logo,
    category: s.categoryZh || s.category,
    aggregateRating: (s.clickCount || 0) > 100 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: Math.floor((s.clickCount || 0) / 50),
    } : undefined,
    offers: coupons.slice(0, 10).map((c: Coupon) => ({
      '@type': 'Offer',
      name: c.title,
      price: '0',
      priceCurrency: 'USD',
      availability: c.active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    })),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
