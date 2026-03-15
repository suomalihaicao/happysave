// 全自动运营API - /api/v1/auto
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      tasks: [
        { id: 'content_gen', name: 'AI推广文案生成', status: 'ready', description: '为热门商家生成推广帖文' },
        { id: 'seo_pages', name: 'SEO文章页生成', status: 'ready', description: '为每个商家生成SEO优化页面' },
        { id: 'coupon_check', name: '优惠码过期检测', status: 'ready', description: '自动检测并替换过期优惠码' },
        { id: 'social_post', name: '多平台帖文生成', status: 'ready', description: '生成知乎/小红书/微博推广内容' },
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action;

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENAI_MODEL || 'openrouter/auto';

  if (action === 'generate_content') {
    const stores = await db.getStores({ active: true, limit: 5 });
    const coupons = await db.getCoupons({ limit: 20 });
    
    const storeList = (stores.data as any[]).map(s => `${s.name} (${s.categoryZh})`).join('、');
    const topCoupons = (coupons.data as any[]).slice(0, 10).map(c => `${c.title}: ${c.discount} ${c.code ? `码:${c.code}` : ''}`).join('\n');

    const prompts: Record<string, string> = {
      zhihu: `请写一篇知乎风格的海淘省钱攻略文章（800字），推荐以下商家和优惠码：\n商家：${storeList}\n优惠码：\n${topCoupons}\n\n要求：专业实用，文末引导访问 happysave.vercel.app`,
      xiaohongshu: `请写3条小红书风格种草笔记（每条150字），推荐海淘优惠码：\n${topCoupons}\n\n要求：带emoji，口语化，#海淘优惠码 #省钱攻略`,
      weibo: `请写5条微博短帖（每条140字内），推广海淘优惠码：\n${topCoupons}\n\n要求：带话题标签`,
    };

    const results: Record<string, string> = {};
    
    if (apiKey) {
      for (const [platform, prompt] of Object.entries(prompts)) {
        try {
          const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1500 }),
          });
          const data = await res.json();
          results[platform] = data.choices?.[0]?.message?.content || '生成失败';
        } catch (e: any) {
          results[platform] = `错误: ${e.message}`;
        }
      }
    } else {
      results.zhihu = `【海淘省钱攻略】最新优惠码合集！\n\n${topCoupons}\n\n更多优惠码见 happysave.vercel.app`;
      results.xiaohongshu = `🔥海淘必看！最新优惠码合集\n\n${topCoupons.slice(0, 500)}\n\n#海淘优惠码 #省钱攻略`;
      results.weibo = `📢 海淘优惠码更新！${storeList}最新折扣 👉 happysave.vercel.app #海淘省钱#`;
    }

    return NextResponse.json({ success: true, data: results });
  }

  if (action === 'check_coupons') {
    const coupons = await db.getCoupons({ limit: 100 });
    const now = new Date();
    const expired = (coupons.data as any[]).filter(c => c.endDate && new Date(c.endDate) < now);
    const noCode = (coupons.data as any[]).filter(c => !c.code && c.active);
    
    return NextResponse.json({
      success: true,
      data: { total: coupons.total, expired: expired.length, noCode: noCode.length, expiredList: expired.slice(0, 5) },
    });
  }

  if (action === 'generate_seo') {
    const stores = await db.getStores({ active: true, limit: 50 });
    const pages = (stores.data as any[]).map(store => ({
      store: store.name,
      slug: store.slug,
      title: `${store.name} 优惠码 | ${store.nameZh} 折扣码 | 快乐省省`,
      metaDesc: `${store.name} 最新优惠码和折扣信息。使用快乐省省独家${store.name}优惠码，享受${store.categoryZh}品类最高50%折扣。`,
      h1: `${store.name} 优惠码与折扣`,
    }));
    
    return NextResponse.json({ success: true, data: { pages, count: pages.length } });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}
