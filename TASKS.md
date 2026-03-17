# TASKS.md - 技术审计记录

## 2026-03-17 01:30 UTC — 方向0: 代码质量

### 检查项
- ✅ TypeScript 类型检查 (`tsc --noEmit`) — 0 错误
- ✅ ESLint 未使用导入检查 — 0 警告
- ✅ 大文件分析 (>200行)
- ✅ `: any` / `as any` 残留分析
- ✅ Next.js 构建通过

### 发现的问题
- 无新增问题！代码质量状态良好。

### 类型安全进展
| 指标 | 上轮 (00:30) | 本轮 | 变化 |
|------|-------------|------|------|
| `: any` | 25 | 12 | ↓52% |
| `as any` | 31 | 9 | ↓71% |
| TS 错误 | 0 | 0 | 持平 |

### 剩余 `any` 分析 (12处 `: any` + 9处 `as any`)
**合理保留 (无需修复):**
- `sqlite-db.ts:62` — SQLite 实例动态引用
- `sqlite-db.ts:490-590` — Proxy 模式字段访问，SQLite 返回类型不确定
- `db-tidb.ts:191,371` — SQL 执行结果类型转换
- `migrate/route.ts:17` — 聚合结果对象
- `scraper.ts:53`, `data-growth.ts:280-281` — 带类型断言的运行时兼容

**可优化 (下轮目标):**
- `db-postgres.ts` 6处方法参数: `trackClick`/`getClickStats`/`getSeoPages`/`createSeoPage`/`updateSeoPage`/`createSubscriber`/`addFavorite`/`createNotification` 可新增对应 Input 接口

### 代码状态汇总
| 项目 | 状态 |
|------|------|
| TypeScript 编译 | ✅ 0 错误 |
| ESLint 检查 | ✅ 0 警告 |
| 未使用导入 | ✅ 无 |
| Next.js 构建 | ✅ 通过 |
| 类型安全覆盖率 | 🟡 ~85% (any 持续下降中) |

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

## 2026-03-17 01:00 UTC — 方向1: 安全审计

### 检查项
- ✅ 密钥泄露扫描 (硬编码/API key/.env git追踪)
- ✅ API鉴权机制 (middleware保护/公开路由/CRON保护)
- ✅ Cookie安全 (Secure/HttpOnly/SameSite)
- ✅ 依赖漏洞 (pnpm audit)
- ✅ SQL注入风险 (字符串拼接列名)
- ✅ 安全头配置

### 发现的问题
1. **SQL注入 (中风险)** — `sqlite-db.ts` 的 `updateStore`/`updateCoupon` 使用 `"${k}"` 直接拼接列名，无白名单过滤。攻击者可通过构造恶意key执行注入。
2. **开发环境默认密码 (低风险)** — `auth.ts` 在非production环境默认 `admin123`，仅影响本地开发。
3. **.env文件 (已确认安全)** — `.env` 含 `OPENAI_API_KEY`，但已在 `.gitignore` 中且未被 git 追踪。

### 已修复
- ✅ `sqlite-db.ts`: 新增 `ALLOWED_STORE_COLUMNS` (16列) 和 `ALLOWED_COUPON_COLUMNS` (18列) 白名单
- ✅ `updateStore`/`updateCoupon`: 添加 `.filter(([, , k]) => ALLOWED_XXX_COLUMNS.has(k))` 过滤
- ✅ TypeScript 编译通过 + Next.js 构建通过
- ✅ pnpm audit: 451个依赖, 0个漏洞
- ✅ git push → `0275961`

### 安全状态汇总
| 项目 | 状态 |
|------|------|
| 硬编码密钥 | ✅ 无 |
| API鉴权 | ✅ 中间件保护16个路由 |
| CRON保护 | ✅ 3种认证方式 |
| Cookie安全 | ✅ HttpOnly+SameSite+Secure(prod) |
| 安全头 | ✅ X-Frame-Options/X-Content-Type-Options等 |
| 依赖漏洞 | ✅ 0 critical/high/moderate |
| SQL注入 | ✅ 已修复 (白名单) |
| 限流 | ✅ 60次/分钟/IP |

### 下次轮次
方向2: 性能分析 — Bundle大小、查询次数、缓存命中率、ISR状态
