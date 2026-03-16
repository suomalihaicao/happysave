# happysave 持续迭代

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
