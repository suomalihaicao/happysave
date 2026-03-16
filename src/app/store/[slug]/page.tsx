// Store Detail - 服务端数据获取 + 客户端交互
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { AntdProvider } from '@/providers/AntdProvider';
import StoreDetailContent from './StoreDetailContent';

// ISR: 每小时重新验证
export const revalidate = 3600;

// 静态预渲染已知商家
export async function generateStaticParams() {
  try {
    const { data: stores } = await db.getStores({ active: true, limit: 100 });
    return (stores as any[]).map((store) => ({ slug: store.slug }));
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({ params }: Props) {
  const { slug } = await params;

  // 服务端获取数据
  let store: any = null;
  let coupons: any[] = [];
  
  try {
    store = await db.getStoreBySlug(slug);
    if (store) {
      coupons = await db.getCouponsByStoreSlug(slug);
    }
  } catch (err) {
    console.error('Failed to fetch store data:', err);
  }

  if (!store) notFound();

  return (
    <AntdProvider>
      <StoreDetailContent initialData={{ store, coupons }} />
    </AntdProvider>
  );
}
