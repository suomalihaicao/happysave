// REST API - AI 自动运营
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-engine';
import type { Store, Coupon } from '@/types';

// POST /api/v1/ai - AI 运营操作
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      // AI 生成商家 SEO 文章
      case 'generate_article': {
        const store: Store | null = await db.getStoreById(body.storeId) || await db.getStoreBySlug(body.slug || '');
        if (!store) return NextResponse.json({ success: false, message: '商家不存在' }, { status: 404 });
        
        const coupons: Coupon[] = await db.getCouponsByStoreSlug(store.slug);
        const couponTitles = coupons.map((c) => c.titleZh || c.title);
        
        const article = await ai.generateStoreArticle(
          store.name,
          store.categoryZh || store.category,
          couponTitles
        );

        if (article.title) {
          const seoPage = await db.createSeoPage({
            slug: `guide-${store.slug}`,
            title: article.title,
            content: article.content,
            metaDesc: article.metaDesc,
            keywords: article.keywords,
            pageType: 'store',
            storeId: store.id,
          });
          return NextResponse.json({ success: true, data: { article, page: seoPage } });
        }
        return NextResponse.json({ success: false, message: 'AI 生成失败' }, { status: 500 });
      }

      // AI 推荐新优惠码
      case 'suggest_coupons': {
        const { data: storeData } = await db.getStores({ active: true, limit: 100 });
        const stores = storeData as import('@/types').Store[];
        const storeNames = stores.map((s) => s.name);
        const suggestions = await ai.suggestNewCoupons(storeNames, body.category);
        return NextResponse.json({ success: true, data: suggestions });
      }

      // AI 翻译优惠码
      case 'translate_coupon': {
        const coupon: Coupon | null = await db.getCouponById(body.couponId);
        if (!coupon) return NextResponse.json({ success: false, message: '优惠码不存在' }, { status: 404 });
        
        const translated = await ai.translateCoupon(
          coupon.title,
          coupon.description
        );

        if (translated.titleZh) {
          await db.updateCoupon(coupon.id, {
            titleZh: translated.titleZh,
            descriptionZh: translated.descriptionZh,
          });
        }
        return NextResponse.json({ success: true, data: translated });
      }

      // AI 生成每日报告
      case 'daily_report': {
        const stats = await db.getDashboardStats() as import('@/types').DashboardStats;
        const report = await ai.generateDailyReport({
          totalClicks: stats.totalClicks,
          newCoupons: 0,
          topStores: stats.topStores.map((s) => ({ name: s.name, clicks: s.clicks })),
          conversions: 0,
        });
        return NextResponse.json({ success: true, data: { report } });
      }

      // AI 生成社交媒体文案
      case 'social_post': {
        const store: Store | null = await db.getStoreById(body.storeId);
        const coupon: Coupon | null = body.couponId ? await db.getCouponById(body.couponId) : null;
        const post = await ai.generateSocialPost(
          store?.name || '',
          coupon?.discount || '独家优惠',
          coupon?.code || undefined
        );
        return NextResponse.json({ success: true, data: post });
      }

      // AI 批量生成所有商家 SEO 文章
      case 'generate_all_seo': {
        const stores = await db.getStores({ active: true, limit: 100 });
        const results = [];
        for (const store of stores.data) {
          const coupons: Coupon[] = await db.getCouponsByStoreSlug(store.slug);
          const article = await ai.generateStoreArticle(
            store.name,
            store.categoryZh || store.category,
            coupons.map((c) => c.titleZh || c.title)
          );
          if (article.title) {
            const page = await db.createSeoPage({
              slug: `guide-${store.slug}`,
              title: article.title,
              content: article.content,
              metaDesc: article.metaDesc,
              keywords: article.keywords,
              pageType: 'store',
              storeId: store.id,
            });
            results.push({ store: store.name, page: page?.id });
          }
          // Avoid rate limiting
          await new Promise(r => setTimeout(r, 1000));
        }
        return NextResponse.json({ success: true, data: { generated: results.length, results } });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('AI action error:', e);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
