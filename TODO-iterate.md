# happysave 持续迭代

## ✅ 第4轮完成 (2026-03-17) - 性能优化 (CTO审计)
- [x] HomePageContent: 优惠码计数 O(n*m) → O(n) 预计算 Map
- [x] middleware: 限流 Map 内存泄漏防护 (>10000条自动清理)
- [x] 首页添加 Suspense 骨架屏支持流式SSR
- [x] TiDB getDashboardStats: 修复 Promise.all 内误用 await (串行→并行)
- [x] TiDB getClickStats: 6个顺序查询改为 Promise.all 并行 (~5-6x)

## ✅ 第3轮完成 (2026-03-16) - 性能优化
- [x] 修复 TiDB init bug (tidb.init() → initTiDB())
- [x] db.ts TiDB连接失败优雅降级 (try-catch)
- [x] SWR 数据缓存层 (cache.ts)
- [x] 所有页面数据获取改用 cached 代理
- [x] 新增 getStoreWithCoupons() 联合查询 (4次查询→1次)
- [x] CDN 缓存头 (/store/* 1h, /category/* 1h, /guide/* 6h)
- [x] Layout revalidate=3600 保持ISR一致性

## 📋 可持续优化
- [ ] 搜索功能增强 (全文搜索/模糊匹配)
- [ ] 多语言 SEO (hreflang 标签完善)
- [ ] 联盟平台数据拉取 (ShareASale/CJ)
- [ ] 用户系统 (收藏同步/订阅管理)
- [ ] PWA 离线体验优化
- [ ] antd 按需加载优化 (Tree-shaking / babel-plugin-import)
- [ ] 图片使用 next/image 组件 (自动WebP/AVIF + 懒加载)
