import Link from 'next/link';
// Store Detail — Server Component 直出可见内容
import { notFound } from 'next/navigation';
import { cached } from '@/lib/cache';
import type { Store, Coupon } from '@/types';
import StoreDetailInteractive from './StoreDetailInteractive';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const { data: stores } = await cached.getStores({ active: true, limit: 100 });
    return stores.map((store: Store) => ({ slug: store.slug }));
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
  let relatedStores: Store[] = [];

  try {
    const result = await cached.getStoreWithCoupons(slug);
    store = result.store;
    coupons = result.coupons;

    // 同类商家推荐
    if (store?.category) {
      const related = await cached.getStores({ category: store.category, active: true, limit: 5 });
      relatedStores = (related.data || []).filter((s: Store) => s.slug !== slug).slice(0, 4);
    }
  } catch (err) {
    console.error('[StorePage] Failed to fetch store data:', err);
  }

  if (!store) notFound();

  // Server Component 直出可见 HTML（SEO + 首屏内容）
  return (
    <div className="page-content" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
        {/* 面包屑 */}
        <nav style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          <Link href="/" style={{ color: '#ff6b35', textDecoration: 'none' }}>🏠 首页</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{store.name}</span>
        </nav>

        {/* 商家头部 — Server Component 直出 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#fff2e8',
              color: '#ff6b35', fontSize: 36, fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {store.name.charAt(0)}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold', color: '#111' }}>{store.name}</h1>
              <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
                {store.descriptionZh || store.description}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(typeof store.tags === 'string' ? JSON.parse(store.tags || '[]') : store.tags || []).map((tag: string) => (
                  <span key={tag} style={{
                    background: '#f5f5f5', borderRadius: 6, padding: '2px 12px', fontSize: 12, color: '#666',
                  }}>#{tag}</span>
                ))}
                <span style={{
                  background: '#fff2e8', color: '#ff6b35', borderRadius: 6, padding: '2px 12px', fontSize: 12,
                }}>{store.categoryZh || store.category}</span>
                <span style={{
                  background: '#f0f5ff', color: '#1677ff', borderRadius: 6, padding: '2px 12px', fontSize: 12,
                }}>👆 {store.clickCount?.toLocaleString() || 0} 次点击</span>
              </div>
            </div>
          </div>
        </div>

        {/* 优惠券列表 — Server Component 直出 */}
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111' }}>
          可用优惠 ({coupons.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {coupons.map((coupon) => (
            <div key={coupon.id} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              borderLeft: '4px solid #ff6b35',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      background: '#fff2e8', color: '#ff6b35', fontSize: 18, fontWeight: 'bold',
                      padding: '2px 12px', borderRadius: 6,
                    }}>{coupon.discount}</span>
                    <span style={{
                      background: coupon.type === 'code' ? '#e6f4ff' : '#f6ffed',
                      color: coupon.type === 'code' ? '#1677ff' : '#52c41a',
                      padding: '2px 8px', borderRadius: 4, fontSize: 12,
                    }}>
                      {coupon.type === 'code' ? '优惠码' : coupon.type === 'deal' ? '促销' : '免费'}
                    </span>
                    {coupon.verified ? (
                      <span style={{ color: '#52c41a', fontSize: 12 }}>✅ 已验证</span>
                    ) : (
                      <span style={{ color: '#faad14', fontSize: 12 }}>⏳ 待验证</span>
                    )}
                  </div>

                  <h3 style={{ margin: '8px 0', fontSize: 16, fontWeight: 'bold' }}>
                    {coupon.titleZh || coupon.title}
                  </h3>
                  <p style={{ color: '#666', margin: '4px 0', fontSize: 14 }}>
                    {coupon.descriptionZh || coupon.description}
                  </p>

                  <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                    🕐 有效期至 {coupon.endDate
                      ? `${new Date(coupon.endDate).getFullYear()}/${new Date(coupon.endDate).getMonth() + 1}/${new Date(coupon.endDate).getDate()}`
                      : '长期有效'}
                    <span style={{ marginLeft: 16 }}>
                      👆 {coupon.clickCount?.toLocaleString() || 0} · ✅ {coupon.useCount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* 优惠码 — 服务端直出 */}
              {coupon.code && (
                <div style={{
                  marginTop: 16, background: '#f6ffed', border: '2px dashed #52c41a',
                  borderRadius: 8, padding: '12px 16px', textAlign: 'center',
                  fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold',
                  color: '#52c41a', letterSpacing: 2,
                }}>
                  {coupon.code}
                </div>
              )}

              {/* 操作按钮 — 交互组件 */}
              <StoreDetailInteractive
                store={store!}
                coupon={coupon}
              />
            </div>
          ))}
        </div>

        {coupons.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
            <p style={{ color: '#666' }}>暂无可用优惠，请稍后再来查看</p>
          </div>
        )}

        {/* 相关商家推荐 */}
        {relatedStores.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111' }}>
              🔥 同类商家推荐
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {relatedStores.map((s: Store) => (
                <a key={s.id} href={`/store/${s.slug}`} style={{
                  background: '#fff', borderRadius: 12, padding: 16,
                  textDecoration: 'none', color: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'box-shadow 0.2s',
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#fff2e8', color: '#ff6b35', fontSize: 20, fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#111',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {s.categoryZh || s.category} · 👆 {s.clickCount?.toLocaleString() || 0}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 底部 SEO 文字 */}
        <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#bbb' }}>
            © 2026 快乐省省 — 全球优惠券聚合平台 · 发现更多省钱机会
          </p>
        </div>
      </div>
    </div>
  );
}
