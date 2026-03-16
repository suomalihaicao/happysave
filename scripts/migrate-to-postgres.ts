// 数据迁移脚本: SQLite → PostgreSQL
// 用法: DATABASE_URL=postgres://... node -r ts-node/register scripts/migrate-to-postgres.ts

import { database as sqliteDb } from '../src/lib/sqlite-db';
import { postgres, initPostgres } from '../src/lib/db-postgres';

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    console.error('   DATABASE_URL=postgres://user:pass@host:5432/dbname tsx scripts/migrate-to-postgres.ts');
    process.exit(1);
  }

  console.log('🔄 开始数据迁移: SQLite → PostgreSQL\n');

  // 1. 初始化 PostgreSQL 表结构
  console.log('📋 初始化 PostgreSQL 表结构...');
  await initPostgres();

  // 2. 迁移 Stores
  console.log('\n🏪 迁移商家数据...');
  const stores = await sqliteDb.getStores({ limit: 1000 });
  let storeCount = 0;
  for (const store of stores.data) {
    try {
      await postgres.createStore(store);
      storeCount++;
    } catch (err: any) {
      if (err.code === '23505') {
        console.log(`  ⏭️ 跳过已存在: ${store.name}`);
      } else {
        console.error(`  ❌ ${store.name}: ${err.message}`);
      }
    }
  }
  console.log(`  ✅ 迁移 ${storeCount}/${stores.total} 个商家`);

  // 3. 迁移 Coupons
  console.log('\n🎫 迁移优惠码数据...');
  const coupons = await sqliteDb.getCoupons({ limit: 1000 });
  let couponCount = 0;
  for (const coupon of coupons.data) {
    try {
      await postgres.createCoupon(coupon);
      couponCount++;
    } catch (err: any) {
      if (err.code === '23505') {
        console.log(`  ⏭️ 跳过已存在: ${coupon.title}`);
      } else {
        console.error(`  ❌ ${coupon.title}: ${err.message}`);
      }
    }
  }
  console.log(`  ✅ 迁移 ${couponCount}/${coupons.total} 个优惠码`);

  // 4. 迁移 Categories
  console.log('\n📂 迁移分类数据...');
  const categories = await sqliteDb.getCategories();
  let catCount = 0;
  for (const cat of categories) {
    try {
      await postgres.createCategory(cat);
      catCount++;
    } catch (err: any) {
      console.log(`  ⏭️ 跳过已存在: ${cat.name}`);
    }
  }
  console.log(`  ✅ 迁移 ${catCount} 个分类`);

  // 5. 迁移 SEO Pages
  console.log('\n📝 迁移 SEO 文章...');
  const seoPages = sqliteDb.getSeoPages();
  let seoCount = 0;
  for (const page of seoPages.data) {
    try {
      await postgres.createSeoPage(page);
      seoCount++;
    } catch (err: any) {
      console.log(`  ⏭️ 跳过已存在: ${page.title}`);
    }
  }
  console.log(`  ✅ 迁移 ${seoCount}/${seoPages.total} 篇文章`);

  // 6. 迁移 Notifications
  console.log('\n🔔 迁移通知数据...');
  console.log(`  ⏭️ 跳过 (通知为运行时数据，无需迁移)`);

  console.log('\n🎉 数据迁移完成！');
  console.log(`   商家: ${storeCount}`);
  console.log(`   优惠码: ${couponCount}`);
  console.log(`   分类: ${catCount}`);
  console.log(`   文章: ${seoCount}`);
}

migrate().catch(err => {
  console.error('❌ 迁移失败:', err);
  process.exit(1);
});
