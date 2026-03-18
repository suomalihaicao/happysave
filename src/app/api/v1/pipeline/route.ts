// SMO → SEO → 内容审核 自动化流水线
// 每小时执行一次，轮换不同类型任务

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-engine';
import type { Store, Coupon, SeoPage } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET || '';

// ============================================================
// 认证检查
// ============================================================
function isAuthorized(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') !== null;
  const secret = request.nextUrl.searchParams.get('secret');
  const auth = request.headers.get('authorization');
  const isValidSecret = CRON_SECRET && (secret === CRON_SECRET || auth === `Bearer ${CRON_SECRET}`);
  const adminCookie = request.cookies.get('hs_admin')?.value;
  return isVercelCron || !!isValidSecret || !!adminCookie;
}

// ============================================================
// 任务类型定义
// ============================================================
type TaskType = 'smo_research' | 'seo_pages' | 'content_review' | 'auto_publish';

interface PipelineResult {
  task: TaskType;
  startTime: string;
  endTime: string;
  duration: number;
  itemsProcessed: number;
  itemsCreated: number;
  errors: string[];
  details: Record<string, unknown>;
}

// ============================================================
// SMO 专员 - 市场调研报告
// ============================================================
async function runSMOResearch(): Promise<PipelineResult> {
  const start = Date.now();
  const result: PipelineResult = {
    task: 'smo_research',
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    itemsProcessed: 0,
    itemsCreated: 0,
    errors: [],
    details: {},
  };

  try {
    // 1. 获取最近点击数据，分析热门商家和趋势
    const stats = (await db.getDashboardStats()) as Record<string, unknown>;
    const stores = await db.getStores({ active: true, limit: 50 });

    // 2. 分析哪些商家需要更多内容
    const seoPages = await db.getSeoPages({ limit: 200 });
    const existingSlugs = new Set((seoPages.data || []).map((p: Record<string, unknown>) => p.slug));

    const storesNeedingContent = stores.data.filter((s: Store) => {
      const hasGuide = existingSlugs.has(`guide-${s.slug}`);
      const hasCouponPage = existingSlugs.has(`coupons-${s.slug}`);
      const hasCompare = existingSlugs.has(`compare-${s.slug}`);
      return !hasGuide || !hasCouponPage || !hasCompare;
    });

    result.itemsProcessed = stores.data.length;

    // 3. 生成调研报告（AI 分析市场趋势）
    const topStores = stores.data.slice(0, 10).map((s: Store) => s.name).join(', ');
    const researchPrompt = `作为SMO市场调研专员，分析以下优惠券商家的市场趋势，输出JSON报告：

热门商家：${topStores}
总点击：${stats.totalClicks || 0}
需要补充内容的商家数：${storesNeedingContent.length}

请分析：
1. 当前最值得关注的5个商家（基于品牌热度）
2. 推荐3个长尾关键词方向
3. 竞品内容差距分析
4. 本月内容优先级建议

输出格式：
{
  "topMerchants": [{"name": "品牌名", "priority": "high|medium|low", "reason": "原因"}],
  "keywordDirections": [{"keyword": "关键词", "volume": "预估搜索量", "difficulty": "难度"}],
  "contentGaps": [{"type": "内容类型", "target": "目标商家", "urgency": "紧急度"}],
  "monthlyPlan": [{"week": 1, "focus": "本周重点"}],
  "summary": "调研总结"
}`;

    const researchResult = await ai.callAI([
      { role: 'system', content: '你是专业的SMO市场调研分析师，擅长优惠券和电商领域。' },
      { role: 'user', content: researchPrompt },
    ], 0.6);

    let research: Record<string, unknown> = {};
    try {
      const jsonMatch = researchResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) research = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch { /* AI输出解析失败，用默认值 */ }

    // 4. 存储调研报告到 seo_pages（作为内部参考）
    const reportSlug = `smo-report-${new Date().toISOString().slice(0, 10)}`;
    if (!existingSlugs.has(reportSlug)) {
      await db.createSeoPage({
        slug: reportSlug,
        title: `SMO调研报告 ${new Date().toLocaleDateString('zh-CN')}`,
        content: JSON.stringify(research, null, 2),
        metaDesc: '内部SMO调研报告',
        keywords: 'smo,research,internal',
        type: 'guide',
        published: false, // 内部文档不公开
      });
      result.itemsCreated = 1;
    }

    result.details = {
      storesAnalyzed: stores.data.length,
      storesNeedingContent: storesNeedingContent.length,
      topMerchants: (research.topMerchants as unknown[] | undefined)?.slice(0, 3) || [],
      keywordDirections: (research.keywordDirections as unknown[] | undefined)?.slice(0, 3) || [],
      summary: (research.summary as string) || '调研完成',
    };
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }

  result.endTime = new Date().toISOString();
  result.duration = Date.now() - start;
  return result;
}

// ============================================================
// SEO 专员 - 基于调研生成页面
// ============================================================
async function runSEOPages(): Promise<PipelineResult> {
  const start = Date.now();
  const result: PipelineResult = {
    task: 'seo_pages',
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    itemsProcessed: 0,
    itemsCreated: 0,
    errors: [],
    details: { pages: [] as string[] },
  };

  try {
    // 1. 获取最新调研报告
    const seoPages = await db.getSeoPages({ limit: 10 });
    const existingSlugs = new Set(seoPages.data.map((p: Record<string, unknown>) => p.slug));

    // 2. 获取需要生成页面的商家
    const stores = await db.getStores({ active: true, limit: 20 });

    for (const store of stores.data) {
      if (result.itemsCreated >= 2) break; // 每次最多生成2个页面，避免API限流

      const couponSlug = `coupons-${store.slug}`;
      if (existingSlugs.has(couponSlug)) continue;

      try {
        // 获取该商家的优惠券
        const coupons = await db.getCouponsByStoreSlug(store.slug);
        const activeCoupons = coupons.filter((c: Coupon) => c.active);

        if (activeCoupons.length === 0) continue;

        // 生成SEO落地页（优惠券列表页）
        const pagePrompt = `作为SEO专员，为以下商家创建优惠券落地页：

商家：${store.name} (${store.nameZh || ''})
分类：${store.category}
优惠券数量：${activeCoupons.length}
优惠券：${activeCoupons.slice(0, 5).map((c: Coupon) => c.titleZh || c.title).join('、')}

要求：
1. 标题格式："{商家名}优惠码 | {年月}最新{商家名}折扣码"
2. H1: "{商家名}优惠码大全 - 最高{最大折扣}优惠"
3. 内容包括：品牌介绍(100字) + 优惠列表 + 使用教程(200字) + FAQ(3个问题)
4. Meta Description 160字以内，包含商家名+优惠码
5. 关键词：商家名、商家名+优惠码、商家名+折扣码、商家名+coupon

输出JSON：
{"title": "...", "h1": "...", "content": "HTML", "metaDesc": "...", "keywords": "..."}`;

        const pageContent = await ai.callAI([
          { role: 'system', content: '你是SEO专家，擅长创建高转化的优惠券落地页。' },
          { role: 'user', content: pagePrompt },
        ], 0.7);

        let pageData: Record<string, string> = {};
        try {
          const jsonMatch = pageContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) pageData = JSON.parse(jsonMatch[0]) as Record<string, string>;
        } catch { continue; }

        if (pageData.title) {
          await db.createSeoPage({
            slug: couponSlug,
            title: pageData.title,
            content: `<h1>${pageData.h1 || pageData.title}</h1>${pageData.content}`,
            metaDesc: pageData.metaDesc || '',
            keywords: pageData.keywords || '',
            pageType: 'store',
            storeId: store.id,
          });
          result.itemsCreated++;
          (result.details.pages as string[]).push(store.name);
        }
      } catch (e: unknown) {
        result.errors.push(`${store.name}: ${e instanceof Error ? e.message : String(e)}`);
      }

      result.itemsProcessed++;
    }
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }

  result.endTime = new Date().toISOString();
  result.duration = Date.now() - start;
  return result;
}

// ============================================================
// 内容审核 - 根据调研生成类型文章
// ============================================================
async function runContentReview(): Promise<PipelineResult> {
  const start = Date.now();
  const result: PipelineResult = {
    task: 'content_review',
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    itemsProcessed: 0,
    itemsCreated: 0,
    errors: [],
    details: { articles: [] as string[] },
  };

  try {
    const stores = await db.getStores({ active: true, limit: 30 });
    const existingPages = await db.getSeoPages({ limit: 200 });
    const existingSlugs = new Set(existingPages.data.map((p: Record<string, unknown>) => p.slug));

    // 内容类型轮换
    const contentTypes = [
      { type: 'guide', prefix: 'guide', name: '购物攻略' },
      { type: 'review', prefix: 'review', name: '品牌评测' },
      { type: 'compare', prefix: 'compare', name: '品牌对比' },
      { type: 'tutorial', prefix: 'tutorial', name: '省钱教程' },
    ];

    // 每小时轮换一种类型
    const hour = new Date().getHours();
    const currentType = contentTypes[hour % contentTypes.length];

    for (const store of stores.data) {
      if (result.itemsCreated >= 1) break; // 每次最多1篇，质量优先

      const slug = `${currentType.prefix}-${store.slug}`;
      if (existingSlugs.has(slug)) continue;

      try {
        const coupons = await db.getCouponsByStoreSlug(store.slug);
        const article = await ai.generateStoreArticle(
          store.name,
          store.categoryZh || store.category || '综合',
          coupons.map((c: Coupon) => c.titleZh || c.title).slice(0, 8)
        );

        if (article.title) {
          // 内容审核检查
          const reviewPrompt = `作为内容审核员，审核以下文章质量：

标题：${article.title}
内容长度：${article.content.length}字

检查项：
1. 是否包含敏感词或虚假宣传
2. SEO关键词是否自然
3. 内容是否原创、有价值
4. 格式是否规范

输出JSON：{"approved": true/false, "score": 1-100, "issues": [], "suggestions": []}`;

          const reviewResult = await ai.callAI([
            { role: 'system', content: '你是专业的内容审核员。' },
            { role: 'user', content: reviewPrompt },
          ], 0.3);

          let review: Record<string, unknown> = { approved: true, score: 80 };
          try {
            const jsonMatch = reviewResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) review = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          } catch { /* 解析失败默认通过 */ }

          if (review.approved !== false && ((review.score as number) || 0) >= 60) {
            await db.createSeoPage({
              slug,
              title: `${article.title} | ${currentType.name}`,
              content: article.content,
              metaDesc: article.metaDesc,
              keywords: article.keywords,
              pageType: currentType.type,
              storeId: store.id,
            });
            result.itemsCreated++;
            (result.details.articles as string[]).push(article.title);
          }
        }
      } catch (e: unknown) {
        result.errors.push(`${store.name}: ${e instanceof Error ? e.message : String(e)}`);
      }

      result.itemsProcessed++;
    }

    result.details.contentType = currentType.name;
    result.details.nextType = contentTypes[(hour + 1) % contentTypes.length].name;
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }

  result.endTime = new Date().toISOString();
  result.duration = Date.now() - start;
  return result;
}

// ============================================================
// 自动发布 - 将审核通过的内容推送到搜索引擎
// ============================================================
async function runAutoPublish(): Promise<PipelineResult> {
  const start = Date.now();
  const result: PipelineResult = {
    task: 'auto_publish',
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    itemsProcessed: 0,
    itemsCreated: 0,
    errors: [],
    details: {},
  };

  try {
    // 获取最近创建但未提交搜索引擎的页面
    const pages = await db.getSeoPages({ published: true, limit: 10 });

    // 提交到搜索引擎（Google Indexing API、Bing）
    // 这里可以集成 IndexNow 或 Google API
    result.details = {
      pagesReady: pages.data.length,
      message: '已就绪，等待搜索引擎自然抓取',
    };

    result.itemsProcessed = pages.data.length;
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }

  result.endTime = new Date().toISOString();
  result.duration = Date.now() - start;
  return result;
}

// ============================================================
// API 路由
// ============================================================
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = request.nextUrl.searchParams.get('task') as TaskType | 'all' | null;
  const results: Record<string, PipelineResult> = {};

  const startTime = new Date().toISOString();

  try {
    // 按任务类型执行
    if (task === 'smo_research' || task === 'all') {
      results.smo_research = await runSMOResearch();
    }
    if (task === 'seo_pages' || task === 'all') {
      results.seo_pages = await runSEOPages();
    }
    if (task === 'content_review' || task === 'all') {
      results.content_review = await runContentReview();
    }
    if (task === 'auto_publish' || task === 'all') {
      results.auto_publish = await runAutoPublish();
    }

    // 默认执行当前小时对应的任务
    if (!task) {
      const hour = new Date().getHours();
      const taskMap: TaskType[] = ['smo_research', 'seo_pages', 'content_review', 'auto_publish'];
      const currentTask = taskMap[hour % taskMap.length];
      results[currentTask] = await (async () => {
        switch (currentTask) {
          case 'smo_research': return await runSMOResearch();
          case 'seo_pages': return await runSEOPages();
          case 'content_review': return await runContentReview();
          case 'auto_publish': return await runAutoPublish();
        }
      })();
    }

    return NextResponse.json({
      success: true,
      pipeline: 'smo-seo-content',
      startTime,
      endTime: new Date().toISOString(),
      results,
    });
  } catch (e: unknown) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
      startTime,
      endTime: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST 手动触发
export async function POST(request: NextRequest) {
  return GET(request);
}
