// Store Detail - 服务端数据获取 + 客户端交互
import { notFound } from 'next/navigation';
import { cached } from '@/lib/cache';
import dynamic from 'next/dynamic';
import { AntdProvider } from '@/providers/AntdProvider';

const StoreDetailContent = dynamic(() => import('./StoreDetailContent'), {
  ssr: true,
  loading: () => <div style={{ minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="animate-pulse">加载中...</div></div>,
});

// ISR: 每小时重新验证
export const revalidate = 3600;

// 静态预渲染已知商家
export async function generateStaticParams() {
  try {
    const { data: stores } = await cached.getStores({ active: true, limit: 100 });
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

  // 一次查询获取商家+优惠码
  let store: any = null;
  let coupons: any[] = [];
  
  try {
    const result = await cached.getStoreWithCoupons(slug);
    store = result.store;
    coupons = result.coupons;
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
