// 商店页面 - Server Component metadata
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await db.getStoreBySlug(slug);
  
  if (!store) {
    return { title: '商家未找到 | 快乐省省', description: '该商家页面不存在。' };
  }

  const s = store as any;
  const coupons = await db.getCouponsByStoreSlug(slug);
  const baseUrl = 'https://happysave.cn';
  
  return {
    title: `${s.name} 优惠码 ${s.nameZh || ''} - ${coupons.length} 个优惠 | 快乐省省`,
    description: `${s.name} 最新优惠码和折扣信息。${coupons.length} 个可用优惠，最高可达 50% 折扣。点击复制，结账立减！`,
    keywords: [`${s.name}优惠码`, `${s.name}折扣`, '优惠码', '折扣码', s.category],
    openGraph: {
      title: `${s.name} 优惠码 | 快乐省省`,
      description: `${s.name} ${coupons.length} 个优惠码，最高 50% 折扣！`,
      url: `${baseUrl}/store/${slug}`,
      images: [{ url: `${baseUrl}/og-image?store=${slug}`, width: 1200, height: 630, alt: `${s.name} 优惠码` }],
    },
    alternates: { canonical: `${baseUrl}/store/${slug}` },
  };
}

// Server Component - 仅渲染 JSON-LD 结构化数据
export default async function StoreSEOWrapper({ params }: Props) {
  const { slug } = await params;
  const store = await db.getStoreBySlug(slug);
  const coupons = store ? await db.getCouponsByStoreSlug(slug) : [];
  const s = store as any;
  
  if (!s) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.name,
    alternateName: s.nameZh,
    description: s.descriptionZh || s.description,
    url: `https://happysave.cn/store/${slug}`,
    image: s.logo,
    category: s.categoryZh || s.category,
    aggregateRating: (s.clickCount || 0) > 100 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: Math.floor((s.clickCount || 0) / 50),
    } : undefined,
    offers: coupons.slice(0, 10).map((c: any) => ({
      '@type': 'Offer',
      name: c.title,
      price: '0',
      priceCurrency: 'USD',
      availability: c.active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
