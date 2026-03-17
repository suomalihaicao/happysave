#!/bin/bash
# 🔄 Markdown ↔ SQLite 双向同步
# 用法: bash sync.sh [pull|push]
#   pull: 从数据库导出到 Markdown (数据库 → 文件)
#   push: 从 Markdown 解析到数据库 (文件 → 数据库)

DB_PATH="/root/workspace/happysave/docs/roles/happysave-logs.db"
ROLES_DIR="/root/workspace/happysave/docs/roles"
TODAY=$(date +%Y-%m-%d)

case "$1" in
    push)
        echo "📤 推送 Markdown → 数据库..."
        echo "⚠️  注意: Markdown 日志为辅助记录，主要写入方式为 log.sh CLI"
        echo "   建议使用: bash log.sh tech/marketing/..."
        ;;

    pull)
        echo "📥 导出 数据库 → Markdown..."

        # 导出技术日志为 Markdown
        TECH_LOG="$ROLES_DIR/tech-logs/db-export-$TODAY.md"
        echo "# 技术日志导出 — $TODAY" > "$TECH_LOG"
        echo "" >> "$TECH_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT date, priority, title, status, created_at FROM tech_logs ORDER BY date DESC, id DESC LIMIT 50;" >> "$TECH_LOG"
        echo "" >> "$TECH_LOG"
        echo "## 故障记录" >> "$TECH_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT id, date, severity, description, status FROM incidents ORDER BY date DESC;" >> "$TECH_LOG"
        echo "" >> "$TECH_LOG"
        echo "## 技术决策" >> "$TECH_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT id, date, title, status FROM tech_decisions ORDER BY date DESC;" >> "$TECH_LOG"
        echo "✅ 技术日志导出: $TECH_LOG"

        # 导出营销日志为 Markdown
        MKT_LOG="$ROLES_DIR/marketing-logs/db-export-$TODAY.md"
        echo "# 营销日志导出 — $TODAY" > "$MKT_LOG"
        echo "" >> "$MKT_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT date, title, channel, created_at FROM marketing_logs ORDER BY date DESC, id DESC LIMIT 50;" >> "$MKT_LOG"
        echo "" >> "$MKT_LOG"
        echo "## 营销活动" >> "$MKT_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT id, date, name, budget, status FROM campaigns ORDER BY date DESC;" >> "$MKT_LOG"
        echo "" >> "$MKT_LOG"
        echo "## KPI 趋势" >> "$MKT_LOG"
        sqlite3 "$DB_PATH" -header -column "SELECT date, category, metric, value, target FROM kpi_history ORDER BY date DESC LIMIT 30;" >> "$MKT_LOG"
        echo "✅ 营销日志导出: $MKT_LOG"
        ;;

    status)
        echo "📊 数据库状态:"
        echo ""
        sqlite3 "$DB_PATH" << 'SQL'
.mode column
.headers on
SELECT 'tech_logs' as 表名, COUNT(*) as 记录数, MAX(date) as 最新日期 FROM tech_logs
UNION ALL SELECT 'incidents', COUNT(*), MAX(date) FROM incidents
UNION ALL SELECT 'tech_decisions', COUNT(*), MAX(date) FROM tech_decisions
UNION ALL SELECT 'marketing_logs', COUNT(*), MAX(date) FROM marketing_logs
UNION ALL SELECT 'campaigns', COUNT(*), MAX(date) FROM campaigns
UNION ALL SELECT 'daily_snapshots', COUNT(*), MAX(date) FROM daily_snapshots
UNION ALL SELECT 'kpi_history', COUNT(*), MAX(date) FROM kpi_history;
SQL
        echo ""
        echo "🔴 活跃故障:"
        sqlite3 "$DB_PATH" -header -column "SELECT id, severity, description FROM incidents WHERE status='investigating';"
        ;;

    *)
        echo "🔄 HappySave 日志同步工具"
        echo ""
        echo "用法: bash sync.sh <命令>"
        echo ""
        echo "  push    Markdown → 数据库 (手动解析)"
        echo "  pull    数据库 → Markdown (导出备份)"
        echo "  status  查看数据库状态"
        echo ""
        echo "💡 推荐写入方式: bash log.sh <类型> <参数...>"
        ;;
esac
