// SEO Guide Pages - AI 生成的商家攻略
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.getSeoPageBySlug(slug);
  if (!page) return { title: 'Not Found' };
  
  return {
    title: (page as any).title,
    description: (page as any).metaDesc || (page as any).title,
    keywords: (page as any).keywords,
    openGraph: {
      title: (page as any).title,
      description: (page as any).metaDesc,
      type: 'article',
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const page = await db.getSeoPageBySlug(slug);
  
  if (!page) notFound();

  // Increment view count
  await db.incrementPageView(slug);

  const p = page as any;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 24, fontSize: 14, color: '#666' }}>
        <a href="/" style={{ color: '#ff6b35', textDecoration: 'none' }}>快乐省省</a>
        {' > '}
        <a href={`/store/${p.slug?.replace('guide-', '')}`} style={{ color: '#ff6b35', textDecoration: 'none' }}>
          商家页
        </a>
        {' > '}
        <span>{p.title}</span>
      </nav>

      {/* Article */}
      <article>
        <h1 style={{ fontSize: 28, marginBottom: 16, lineHeight: 1.4 }}>{p.title}</h1>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>
          👁️ {p.views} 次阅读 · 🤖 AI 生成内容 · 最后更新：{new Date(p.updatedAt).toLocaleDateString('zh-CN')}
        </div>
        
        <div 
          style={{ lineHeight: 1.8, fontSize: 16, color: '#333' }}
          dangerouslySetInnerHTML={{ __html: p.content }}
        />
      </article>

      {/* Back to store */}
      <div style={{ marginTop: 48, padding: 24, background: '#f5f5f5', borderRadius: 12, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, fontSize: 18 }}>🎉 查看最新优惠码</p>
        <a 
          href={`/store/${p.slug?.replace('guide-', '')}`}
          style={{
            display: 'inline-block', padding: '12px 32px',
            background: '#ff6b35', color: 'white', borderRadius: 8,
            textDecoration: 'none', fontWeight: 'bold',
          }}
        >
          查看优惠 →
        </a>
      </div>
    </div>
  );
}
