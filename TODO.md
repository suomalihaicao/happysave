# happysave 改进 TODO

## ✅ 已完成
- [x] 添加 Vercel Speed Insights
- [x] 移除已弃用的 @vercel/postgres 依赖
- [x] Admin API 加鉴权保护 (middleware)
- [x] next.config.ts 加安全头 + 图片域名白名单
- [x] CRON Secret 改用环境变量 + x-vercel-cron header
- [x] 清理冗余数据库适配器 (db-adapter.ts, universal-db.ts)
- [x] Admin 密码要求环境变量配置 (production 环境)
- [x] Robots.txt 禁止爬取 admin/API
- [x] 分类页 generateStaticParams 预渲染
- [x] PWA 支持 (manifest + SW + icons + 注册)
- [x] 修复 pnpm Turbopack 构建问题 (.npmrc shamefully-hoist)

## 🔧 进行中
- [ ] Store 页改造为 Server Component (支持预渲染/ISR)
- [ ] 错误监控 (Sentry)
