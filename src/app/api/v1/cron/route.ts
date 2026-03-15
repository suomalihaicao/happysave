// Cron API - 自动化定时任务
// Vercel Cron Jobs 可以调用这个端点
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-engine';
import { autoDiscover } from '@/lib/auto-discover';

// 验证 cron secret（防止外部调用）
const CRON_SECRET = process.env.CRON_SECRET || 'happysave-cron-2026';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const secret = request.nextUrl.searchParams.get('secret');

  // 简单验证
  if (secret !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = request.nextUrl.searchParams.get('task') || 'all';
  const results: any = {};

  try {
    // 任务 1: 每日生成 SEO 文章（为还没有文章的商家）
    if (task === 'seo' || task === 'all') {
      const stores = db.getStores({ active: true, limit: 100 });
      const seoPages = db.getSeoPages();
      const existingSlugs = new Set(seoPages.data.map((p: any) => p.slug));
      
      let generated = 0;
      for (const store of stores.data as any[]) {
        const slug = `guide-${store.slug}`;
        if (!existingSlugs.has(slug)) {
          const coupons = db.getCouponsByStoreSlug(store.slug);
          const article = await ai.generateStoreArticle(
            store.name,
            store.categoryZh || store.category,
            coupons.map((c: any) => c.titleZh || c.title)
          );
          if (article.title) {
            db.createSeoPage({
              slug,
              title: article.title,
              content: article.content,
              metaDesc: article.metaDesc,
              keywords: article.keywords,
              pageType: 'store',
              storeId: store.id,
            });
            generated++;
          }
          await new Promise(r => setTimeout(r, 2000)); // Rate limit
        }
      }
      results.seo = { generated };
    }

    // 任务 2: 每日运营报告
    if (task === 'report' || task === 'all') {
      const stats = db.getDashboardStats();
      const report = await ai.generateDailyReport({
        totalClicks: stats.totalClicks,
        newCoupons: 0,
        topStores: (stats.topStores as any[]).map((s: any) => ({ name: s.name, clicks: s.clicks })),
        conversions: 0,
      });
      results.report = report;
    }

    // 任务 4: 自动发现新商家和优惠码
    if (task === 'discover' || task === 'all') {
      const stores = autoDiscover.discoverNewStores(3);
      const coupons = autoDiscover.discoverNewCoupons(10);
      results.discover = { newStores: stores.added, newCoupons: coupons.added };
    }

    // 任务 3: 社交媒体文案生成
    if (task === 'social' || task === 'all') {
      const coupons = db.getCoupons({ featured: true, active: true, limit: 3 });
      const posts = [];
      for (const coupon of coupons.data as any[]) {
        const store = db.getStoreById(coupon.storeId);
        if (store) {
          const post = await ai.generateSocialPost(
            (store as any).name,
            coupon.discount,
            coupon.code || undefined
          );
          posts.push({ store: (store as any).name, ...post });
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      results.social = posts;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      task,
      results,
    });
  } catch (e: any) {
    console.error('Cron error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
