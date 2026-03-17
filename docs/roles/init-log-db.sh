#!/bin/bash
# 初始化日志数据库 + 固化现有数据
# 用法: bash init-log-db.sh

DB_PATH="/root/workspace/happysave/docs/roles/happysave-logs.db"
SCHEMA_PATH="/root/workspace/happysave/docs/roles/log-schema.sql"

echo "📦 初始化日志数据库..."

# 创建数据库 + 建表
sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
echo "✅ 数据库表结构创建完成"

# 固化现有技术日志数据
sqlite3 "$DB_PATH" << 'SQL'
-- 技术日志
INSERT OR IGNORE INTO tech_logs (date, title, content, status, priority, tags) VALUES
('2026-03-17', 'SSR BAIL OUT 白屏排查', '商家详情页打开空白，HTML 200 正常，RSC 数据完整，定位为 Next.js SSR 崩溃', 'active', 'P0', '["ssr","bug","critical"]'),
('2026-03-17', '数据库连接验证', 'SQLite 正常运行，API 返回完整数据，数据库实际无问题', 'resolved', 'P1', '["database","sqlite"]'),
('2026-03-17', '技术主管手册创建', '建立 docs/roles/技术部门主管.md，定义 KPI 基准', 'resolved', 'P2', '["docs","roles"]');

-- 故障记录
INSERT OR IGNORE INTO incidents (id, date, severity, scope, description, root_cause, status) VALUES
('INC-001', '2026-03-17', 'P0', '所有商家详情页', '用户打开 store/temu 看到空白页面', 'Next.js SSR 渲染失败，降级到 CSR', 'investigating');

-- 技术决策
INSERT OR IGNORE INTO tech_decisions (id, date, title, decision, reasoning, status) VALUES
('DEC-001', '2026-03-15', '数据库架构选择', 'SQLite(开发) + TiDB(生产) + 降级机制', '本地开发轻量，生产可扩展，失败自动降级', 'accepted'),
('DEC-002', '2026-03-16', '缓存策略', 'SWR 三层缓存 (内存5min + ISR 1h + CDN 1d)', '平衡新鲜度和性能', 'accepted'),
('DEC-003', '2026-03-16', '安全架构', 'Middleware 限流 + Cookie鉴权 + 安全头', '防爬虫/未授权访问/XSS点击劫持', 'accepted'),
('DEC-004', '2026-03-17', 'SSR vs CSR', '减少客户端渲染依赖，关键内容 Server Component 直出', '修复 BAIL OUT 白屏问题', 'proposed');

-- 营销日志
INSERT OR IGNORE INTO marketing_logs (date, title, content, channel) VALUES
('2026-03-17', '营销主管手册创建', '建立 docs/roles/营销主管.md，定义增长策略和 KPI', 'seo'),
('2026-03-17', 'SEO 基础设施完善', 'Sitemap + Robots.txt + JSON-LD + OG 图片全部就绪', 'seo');

-- 营销活动
INSERT OR IGNORE INTO campaigns (id, date, name, channels, budget, target, status) VALUES
('CAM-001', '2026-03-17', '站点首发推广', '["seo","social","email"]', 0, '首月 1000 UV', 'planned');

-- 数据快照 (基线)
INSERT OR IGNORE INTO daily_snapshots (date, total_stores, total_coupons) VALUES
('2026-03-17', 47, 95);

-- KPI 基线
INSERT OR IGNORE INTO kpi_history (date, category, metric, value, target) VALUES
('2026-03-17', 'tech', 'build_time_seconds', 20.8, 30),
('2026-03-17', 'tech', 'typescript_errors', 0, 0),
('2026-03-17', 'tech', 'any_type_count', 1, 20),
('2026-03-17', 'tech', 'api_routes', 25, 25),
('2026-03-17', 'business', 'total_stores', 47, 100),
('2026-03-17', 'business', 'total_coupons', 95, 500);

SQL

echo "✅ 现有数据固化完成"

# 验证
echo ""
echo "📊 数据库统计:"
sqlite3 "$DB_PATH" << 'SQL'
.mode column
.headers on
SELECT 'tech_logs' as table_name, COUNT(*) as rows FROM tech_logs
UNION ALL SELECT 'incidents', COUNT(*) FROM incidents
UNION ALL SELECT 'tech_decisions', COUNT(*) FROM tech_decisions
UNION ALL SELECT 'marketing_logs', COUNT(*) FROM marketing_logs
UNION ALL SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL SELECT 'daily_snapshots', COUNT(*) FROM daily_snapshots
UNION ALL SELECT 'kpi_history', COUNT(*) FROM kpi_history;
SQL

echo ""
echo "📁 数据库位置: $DB_PATH"
echo "🎉 日志数据库初始化完成！"
