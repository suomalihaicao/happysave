# 🎉 快乐省省 HappySave

全球优惠券平台 - Enterprise Coupon Platform

## 技术栈
- Next.js 16 (App Router)
- Ant Design 5 (企业级 UI)
- SQLite (本地) / Supabase (生产)
- TypeScript + TailwindCSS

## 本地运行
```bash
npm install
npm run dev
```
访问 http://localhost:3000

## 部署到 Vercel

### 方法1: 一键部署
1. 推送到 GitHub
2. 访问 https://vercel.com/new
3. Import 你的仓库
4. 点击 Deploy

### 方法2: CLI 部署
```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

## API 文档
- GET/POST /api/v1/stores - 商家管理
- GET/POST /api/v1/coupons - 优惠码管理
- GET/POST /api/v1/links - 短链接管理
- GET /api/v1/qr?url=xxx - 二维码生成

## 管理后台
访问 /admin 查看数据概览、商家管理、优惠码管理

## 项目结构
```
src/
├── app/           # Next.js App Router 页面
├── components/    # React 组件
├── lib/           # 工具库 (数据库/二维码)
├── providers/     # Ant Design Provider
└── types/         # TypeScript 类型定义
```
