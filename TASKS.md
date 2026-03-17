# TASKS.md - 技术审计记录

## 2026-03-17 00:30 UTC — 方向0: 代码质量

### 检查项
- ✅ TypeScript 类型检查 (`tsc --noEmit`)
- ✅ 大文件分析 (>200行)
- ✅ 未使用导出检查 (`ts-prune`)

### 发现的问题
1. **TS2352 (×2)** — `SeoPage[]` 类型强转：`guide/[slug]/page.tsx` 和 `sitemap.ts` 直接将 `Record<string, unknown>[]` 断言为 `SeoPage[]`，缺少中间 `unknown` 步骤
2. **TS7053 (×4)** — `db-postgres.ts` 中 `StoreUpdate`/`CouponUpdate` 缺少索引签名，`data[key]` 动态访问报错
3. **TS2345 (×2)** — `db-postgres.ts` 中 params 数组类型过窄，无法接受 `null` 值

### 已修复
- ✅ `db-postgres.ts`: `StoreInput`/`CouponInput` 增加 `[key: string]: unknown` 索引签名
- ✅ `db-postgres.ts`: params 数组类型扩展为 `(string | number | boolean | null)[]`
- ✅ `db-postgres.ts`: `data[key]` 添加显式类型断言
- ✅ `guide/[slug]/page.tsx` 和 `sitemap.ts`: 通过 `unknown` 中转完成类型转换
- ✅ git push → `ac7e5f7`

### 待观察（大文件）
| 文件 | 行数 | 评估 |
|------|------|------|
| `sqlite-db.ts` | 732 | 遗留适配器，可后续移除 |
| `db-tidb.ts` | 643 | 按需保留 |
| `db-postgres.ts` | 632 | 主数据库层，合理 |
| `admin/page.tsx` | 472 | 可拆分为子组件 |
| `marketing/route.ts` | 336 | 可拆分 handler |

### 下次轮次
方向1: 安全审计 — 密钥泄露、API鉴权、Cookie安全、依赖漏洞
