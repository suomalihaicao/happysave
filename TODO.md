# happysave 改进 TODO

## ✅ 已完成
- [x] 添加 Vercel Speed Insights
- [x] 移除已弃用的 @vercel/postgres 依赖
- [x] Admin API 加鉴权保护 (middleware)
- [x] next.config.ts 加安全头 + 图片域名白名单
- [x] CRON Secret 改用环境变量 + x-vercel-cron header

## 🔧 进行中
- [ ] 5. 清理冗余数据库适配器文件
- [ ] 6. Admin 密码改用环境变量
- [ ] 7. Robots.txt 禁止爬取 admin/API
- [ ] 8. 预渲染热门页面 (generateStaticParams)
- [ ] 9. PWA 支持
- [ ] 10. 错误监控 (Sentry)
