// 分类页面 - /category/[slug]
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cached } from '@/lib/cache';
import type { Store } from '@/types';

// ISR: 每小时重新验证
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

const CATEGORY_NAMES: Record<string, { zh: string; icon: string; desc: string }> = {
  shopping: { zh: '综合购物', icon: '🛒', desc: '全球综合购物平台优惠码' },
  fashion: { zh: '时尚服饰', icon: '👗', desc: '时尚品牌服饰折扣信息' },
  electronics: { zh: '电子产品', icon: '📱', desc: '电子产品和数码配件优惠' },
  ai: { zh: 'AI工具', icon: '🤖', desc: 'AI工具和服务优惠码' },
  hosting: { zh: '主机服务', icon: '🌐', desc: '网站主机和域名优惠' },
  beauty: { zh: '美妆个护', icon: '💄', desc: '美妆护肤品牌折扣' },
  travel: { zh: '旅行酒店', icon: '✈️', desc: '旅行酒店预订优惠' },
  food: { zh: '食品生鲜', icon: '🍔', desc: '食品外卖和生鲜优惠' },
  education: { zh: '在线教育', icon: '📚', desc: '在线教育平台优惠码' },
};

const CATEGORY_SLUGS = Object.keys(CATEGORY_NAMES);

export function generateStaticParams() {
  return CATEGORY_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORY_NAMES[slug];
  if (!cat) return { title: '分类不存在' };
  
  return {
    title: `${cat.zh} 优惠码大全`,
    description: cat.desc,
    keywords: `${cat.zh}, 优惠码, 折扣, coupon, deals`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = CATEGORY_NAMES[slug];
  if (!cat) notFound();

  // 分类页获取商家 (配合客户端加载更多)
  const stores = await cached.getStores({ category: slug, active: true, limit: 50 });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 24, fontSize: 14, color: '#666' }}>
        <a href="/" style={{ color: '#ff6b35', textDecoration: 'none' }}>🏠 首页</a>
        {' > '}
        <span>{cat.icon} {cat.zh}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>
          {cat.icon} {cat.zh} 优惠码
        </h1>
        <p style={{ color: '#666', fontSize: 16 }}>{cat.desc}</p>
        <p style={{ color: '#999', fontSize: 14 }}>共 {stores.total} 家商家</p>
      </div>

      {/* Store Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {(stores.data as Store[]).map(store => (
          <a
            key={store.id}
            href={`/store/${store.slug}`}
            style={{
              display: 'block',
              padding: 20,
              background: 'white',
              border: '1px solid #eee',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: '#fff2e8', color: '#ff6b35',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 'bold',
              }}>
                {store.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{store.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{store.description?.substring(0, 40)}...</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              👆 {store.clickCount?.toLocaleString()} 次点击
              {store.featured && <span style={{ marginLeft: 8 }}>⭐ 推荐</span>}
            </div>
          </a>
        ))}
      </div>

      {stores.data.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>该分类暂无商家</p>
        </div>
      )}
    </div>
  );
}
