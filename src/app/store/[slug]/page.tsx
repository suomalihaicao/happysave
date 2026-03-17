// Store Detail — Server Component 直出关键内容 + Client 交互懒加载
import { notFound } from 'next/navigation';
import { cached } from '@/lib/cache';
import type { Store, Coupon } from '@/types';
import StoreDetailClient from './StoreDetailClient';

// ISR: 每小时重新验证
export const revalidate = 3600;

// 静态预渲染已知商家
export async function generateStaticParams() {
  try {
    const { data: stores } = await cached.getStores({ active: true, limit: 100 });
    return stores.map((store) => ({ slug: store.slug }));
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({ params }: Props) {
  const { slug } = await params;

  let store: Store | null = null;
  let coupons: Coupon[] = [];

  try {
    const result = await cached.getStoreWithCoupons(slug);
    store = result.store;
    coupons = result.coupons;
  } catch (err) {
    console.error('Failed to fetch store data:', err);
  }

  if (!store) notFound();

  // Server Component 直出关键内容 (SEO + 首屏), 交互功能走 Client Component
  return (
    <StoreDetailClient store={store} coupons={coupons} />
  );
}
