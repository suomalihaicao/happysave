// 数据迁移 API - SQLite → PostgreSQL
// POST /api/v1/migrate  (需要 Admin 鉴权)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface MigrationStep {
  step: string;
  status?: string;
  total?: number;
  migrated?: number;
  skipped?: number;
}

interface MigrationResults {
  steps: MigrationStep[];
  success?: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  // Admin 鉴权
  if (!auth.verify(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgres')) {
    return NextResponse.json({ success: false, message: 'DATABASE_URL 不是 PostgreSQL' }, { status: 400 });
  }

  const results: MigrationResults = { steps: [] };

  try {
    // 动态导入（避免非 PostgreSQL 环境加载 pg）
    const { database: sqliteDb } = await import('@/lib/sqlite-db');
    const { postgres, initPostgres } = await import('@/lib/db-postgres');

    // 1. 初始化表结构
    results.steps.push({ step: 'init', status: 'start' });
    await initPostgres();
    results.steps[results.steps.length - 1].status = 'done';

    // 2. 迁移商家
    const stores = await sqliteDb.getStores({ limit: 1000 });
    let storeOk = 0, storeSkip = 0;
    for (const s of stores.data) {
      try {
        await postgres.createStore(s);
        storeOk++;
      } catch { storeSkip++; }
    }
    results.steps.push({ step: 'stores', total: stores.total, migrated: storeOk, skipped: storeSkip });

    // 3. 迁移优惠码
    const coupons = await sqliteDb.getCoupons({ limit: 1000 });
    let couponOk = 0, couponSkip = 0;
    for (const c of coupons.data) {
      try {
        await postgres.createCoupon(c);
        couponOk++;
      } catch { couponSkip++; }
    }
    results.steps.push({ step: 'coupons', total: coupons.total, migrated: couponOk, skipped: couponSkip });

    // 4. 迁移分类
    const cats = await sqliteDb.getCategories();
    let catOk = 0;
    for (const c of cats) {
      try { await postgres.createCategory(c); catOk++; } catch {}
    }
    results.steps.push({ step: 'categories', total: cats.length, migrated: catOk });

    // 5. 迁移 SEO 文章
    const seoPages = sqliteDb.getSeoPages();
    let seoOk = 0;
    for (const p of seoPages.data) {
      try { await postgres.createSeoPage(p); seoOk++; } catch {}
    }
    results.steps.push({ step: 'seo_pages', total: seoPages.total, migrated: seoOk });

    results.success = true;
    results.message = `迁移完成: 商家${storeOk} 优惠码${couponOk} 分类${catOk} 文章${seoOk}`;

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message,
      steps: results.steps,
    }, { status: 500 });
  }
}
