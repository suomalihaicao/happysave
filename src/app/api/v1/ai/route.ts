// REST API - AI 自动运营
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-engine';

// POST /api/v1/ai - AI 运营操作
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      // AI 生成商家 SEO 文章
      case 'generate_article': {
        const store = db.getStoreById(body.storeId) || db.getStoreBySlug(body.slug || '');
        if (!store) return NextResponse.json({ success: false, message: '商家不存在' }, { status: 404 });
        
        const coupons = db.getCouponsByStoreSlug((store as any).slug);
        const couponTitles = coupons.map((c: any) => c.titleZh || c.title);
        
        const article = await ai.generateStoreArticle(
          (store as any).name,
          (store as any).categoryZh || (store as any).category,
          couponTitles
        );

        if (article.title) {
          const seoPage = db.createSeoPage({
            slug: `guide-${(store as any).slug}`,
            title: article.title,
            content: article.content,
            metaDesc: article.metaDesc,
            keywords: article.keywords,
            pageType: 'store',
            storeId: (store as any).id,
          });
          return NextResponse.json({ success: true, data: { article, page: seoPage } });
        }
        return NextResponse.json({ success: false, message: 'AI 生成失败' }, { status: 500 });
      }

      // AI 推荐新优惠码
      case 'suggest_coupons': {
        const stores = db.getStores({ active: true, limit: 100 });
        const storeNames = stores.data.map((s: any) => s.name);
        const suggestions = await ai.suggestNewCoupons(storeNames, body.category);
        return NextResponse.json({ success: true, data: suggestions });
      }

      // AI 翻译优惠码
      case 'translate_coupon': {
        const coupon = db.getCouponById(body.couponId);
        if (!coupon) return NextResponse.json({ success: false, message: '优惠码不存在' }, { status: 404 });
        
        const translated = await ai.translateCoupon(
          (coupon as any).title,
          (coupon as any).description
        );

        if (translated.titleZh) {
          db.updateCoupon((coupon as any).id, {
            titleZh: translated.titleZh,
            descriptionZh: translated.descriptionZh,
          });
        }
        return NextResponse.json({ success: true, data: translated });
      }

      // AI 生成每日报告
      case 'daily_report': {
        const stats = db.getDashboardStats();
        const report = await ai.generateDailyReport({
          totalClicks: stats.totalClicks,
          newCoupons: 0, // TODO: count today's new coupons
          topStores: (stats.topStores as any[]).map((s: any) => ({ name: s.name, clicks: s.clicks })),
          conversions: 0,
        });
        return NextResponse.json({ success: true, data: { report } });
      }

      // AI 生成社交媒体文案
      case 'social_post': {
        const store = db.getStoreById(body.storeId);
        const coupon = body.couponId ? db.getCouponById(body.couponId) : null;
        const post = await ai.generateSocialPost(
          (store as any)?.name || '',
          (coupon as any)?.discount || '独家优惠',
          (coupon as any)?.code || undefined
        );
        return NextResponse.json({ success: true, data: post });
      }

      // AI 批量生成所有商家 SEO 文章
      case 'generate_all_seo': {
        const stores = db.getStores({ active: true, limit: 100 });
        const results = [];
        for (const store of stores.data as any[]) {
          const coupons = db.getCouponsByStoreSlug(store.slug);
          const article = await ai.generateStoreArticle(
            store.name,
            store.categoryZh || store.category,
            coupons.map((c: any) => c.titleZh || c.title)
          );
          if (article.title) {
            const page = db.createSeoPage({
              slug: `guide-${store.slug}`,
              title: article.title,
              content: article.content,
              metaDesc: article.metaDesc,
              keywords: article.keywords,
              pageType: 'store',
              storeId: store.id,
            });
            results.push({ store: store.name, page: (page as any)?.id });
          }
          // Avoid rate limiting
          await new Promise(r => setTimeout(r, 1000));
        }
        return NextResponse.json({ success: true, data: { generated: results.length, results } });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error('AI action error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
