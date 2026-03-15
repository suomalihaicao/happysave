// sitemap.ts - Next.js Metadata API
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://happysave.vercel.app';
  const now = new Date();

  const stores = await db.getStores({ active: true, limit: 200 });
  const seoPages = await db.getSeoPages();

  const urls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...(stores.data as any[]).map(store => ({
      url: `${baseUrl}/store/${store.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...(seoPages.data as any[]).map(page => ({
      url: `${baseUrl}/guide/${page.slug}`,
      lastModified: new Date(page.updatedAt || now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return urls;
}
// sitemap cache bust Sun Mar 15 06:57:22 PM CST 2026
