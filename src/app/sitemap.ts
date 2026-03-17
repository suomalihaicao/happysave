// sitemap.ts - Next.js Metadata API
import type { MetadataRoute } from 'next';
import { cached } from '@/lib/cache';
import type { Store, SeoPage } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.happysave.cn';
  const now = new Date();

  const stores = await cached.getStores({ active: true, limit: 200 });
  const seoPages = await cached.getSeoPages();

  const urls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/advertise`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // 分类页
    ...['shopping', 'fashion', 'electronics', 'ai', 'hosting', 'beauty', 'travel', 'food', 'education'].map(slug => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...(stores.data as unknown as Store[]).map(store => ({
      url: `${baseUrl}/store/${store.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...(seoPages.data as unknown as SeoPage[]).map(page => ({
      url: `${baseUrl}/guide/${page.slug}`,
      lastModified: new Date(page.updatedAt || now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return urls;
}
// sitemap cache bust Sun Mar 15 06:57:22 PM CST 2026
