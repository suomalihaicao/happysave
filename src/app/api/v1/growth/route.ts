// 增长变现API - /api/v1/growth
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    success: true,
    features: [
      { id: 'seo_pages', name: '自动生成SEO落地页', status: 'ready', revenue: '搜索流量→联盟佣金' },
      { id: 'top_coupons', name: '高佣金优惠码优先展示', status: 'ready', revenue: '提高转化率和佣金' },
      { id: 'referral_links', name: '推荐链接生成器', status: 'ready', revenue: '用户裂变推广' },
      { id: 'conversion_stats', name: '转化率分析', status: 'ready', revenue: '优化高转化商家' },
      { id: 'auto_submit', name: '搜索引擎自动提交', status: 'ready', revenue: '加速收录' },
    ],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action;

  // 1. 生成SEO落地页 - 每个商家+分类组合自动生成页面
  if (action === 'generate_seo_pages') {
    const stores = await db.getStores({ active: true, limit: 50 });
    const categories = await db.getCategories();
    const pages: any[] = [];
    
    const storeList = stores.data as any[];
    const catList = categories.data as any[];
    
    // 为每个商家生成落地页
    for (const store of storeList) {
      pages.push({
        url: `/store/${store.slug}`,
        type: 'store',
        title: `${store.name} 优惠码 ${new Date().getFullYear()} | 最新${store.nameZh}折扣码`,
        h1: `${store.name} 优惠码与促销`,
        keywords: [`${store.name}优惠码`, `${store.name}折扣`, `${store.name}promo code`, `${store.nameZh}优惠`],
        priority: store.featured ? 0.8 : 0.6,
      });
    }
    
    // 为每个分类生成落地页
    for (const cat of catList) {
      pages.push({
        url: `/category/${cat.name}`,
        type: 'category',
        title: `${cat.nameZh}优惠码大全 | ${cat.name} Coupons ${new Date().getFullYear()}`,
        h1: `${cat.nameZh}商家优惠码合集`,
        keywords: [`${cat.nameZh}优惠码`, `${cat.name}coupons`, `海淘${cat.nameZh}折扣`],
        priority: 0.7,
      });
    }
    
    // 长尾词页面
    const longTail = [
      { kw: '海淘优惠码2026', title: '2026最新海淘优惠码大全 | 每日更新' },
      { kw: '美国购物折扣码', title: '美国购物折扣码汇总 | Nike/Apple/Amazon' },
      { kw: '黑五优惠码', title: '黑五优惠码提前购 | 黑色星期五折扣' },
      { kw: '返校季优惠', title: '返校季优惠码 | 学生专属折扣' },
      { kw: '圣诞促销码', title: '圣诞促销码 | Holiday Deals' },
    ];
    
    for (const lt of longTail) {
      pages.push({
        url: `/deals/${lt.kw}`,
        type: 'landing',
        title: lt.title,
        h1: lt.title.split('|')[0].trim(),
        keywords: [lt.kw, lt.kw + '最新', lt.kw + '推荐'],
        priority: 0.5,
      });
    }
    
    return NextResponse.json({ success: true, data: { pages, total: pages.length } });
  }

  // 2. 高佣金优惠码优先展示 - 根据点击率和转化率排序
  if (action === 'top_coupons') {
    const coupons = await db.getCoupons({ limit: 100 });
    const clickStats = await db.getClickStats();
    
    // 计算每个优惠码的"价值分数"
    const scored = (coupons.data as any[]).map(c => {
      const clicks = (clickStats as any[]).find((s: any) => s.couponId === c.id);
      const clickRate = clicks?.count || c.clickCount || 0;
      const useRate = clicks?.uses || c.useCount || 0;
      
      // 价值分数 = 使用次数 * 3 + 点击次数 + 有代码的加50分
      const score = useRate * 3 + clickRate + (c.code ? 50 : 0);
      
      return { ...c, score, clickRate, useRate };
    }).sort((a: any, b: any) => b.score - a.score);
    
    return NextResponse.json({
      success: true,
      data: {
        topCoupons: scored.slice(0, 20).map((c: any) => ({
          id: c.id, title: c.title, storeId: c.storeId, score: c.score,
          clickRate: c.clickRate, useRate: c.useRate,
        })),
        total: coupons.total,
      },
    });
  }

  // 3. 转化率分析 - 哪些商家/优惠码效果最好
  if (action === 'conversion_stats') {
    const stores = await db.getStores({ active: true, limit: 50 });
    const coupons = await db.getCoupons({ limit: 100 });
    
    const analysis = (stores.data as any[]).map(store => {
      const storeCoupons = (coupons.data as any[]).filter(c => c.storeId === store.id);
      const totalClicks = storeCoupons.reduce((sum, c) => sum + (c.clickCount || 0), 0);
      const totalUses = storeCoupons.reduce((sum, c) => sum + (c.useCount || 0), 0);
      const conversionRate = totalClicks > 0 ? ((totalUses / totalClicks) * 100).toFixed(1) : '0';
      
      return {
        store: store.name,
        category: store.categoryZh,
        coupons: storeCoupons.length,
        clicks: totalClicks,
        uses: totalUses,
        conversionRate: conversionRate + '%',
        featured: store.featured,
      };
    }).sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
    
    return NextResponse.json({ success: true, data: analysis });
  }

  // 4. 推荐链接生成器 - 生成带追踪参数的推广链接
  if (action === 'referral_links') {
    const stores = await db.getStores({ active: true, limit: 20 });
    const refCode = body.refCode || 'default';
    
    const links = (stores.data as any[]).map(store => ({
      store: store.name,
      url: `https://happysave.vercel.app/store/${store.slug}?utm_source=referral&utm_medium=${refCode}&utm_campaign=share`,
      shortUrl: `https://happysave.vercel.app/s/${store.slug}?r=${refCode}`,
    }));
    
    return NextResponse.json({ success: true, data: links });
  }

  // 5. 搜索引擎自动提交 - 把新URL提交给百度和Google
  if (action === 'submit_urls') {
    const stores = await db.getStores({ active: true, limit: 50 });
    const urls = (stores.data as any[]).map(s => `https://happysave.vercel.app/store/${s.slug}`);
    urls.unshift('https://happysave.vercel.app/');
    
    // 返回URL列表，可用于手动提交或Ping服务
    return NextResponse.json({
      success: true,
      data: {
        urls,
        total: urls.length,
        baiduPing: `http://data.zz.baidu.com/urls?site=happysave.vercel.app&token=YOUR_TOKEN`,
        googlePing: '通过 Google Search Console API 提交',
        instructions: [
          '百度：打开 https://ziyuan.baidu.com/linksubmit/url 提交URL',
          'Google：打开 https://search.google.com/search-console 提交sitemap',
          'Bing：打开 https://www.bing.com/webmasters 提交sitemap',
        ],
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}
