#!/bin/bash
# ⏰ 每日自动快照 — 建议加入 crontab: 0 23 * * * bash /path/to/daily-cron.sh
# 自动采集站点数据并写入数据库

DB_PATH="/root/workspace/happysave/docs/roles/happysave-logs.db"
LOG_SH="/root/workspace/happysave/docs/roles/log.sh"
TODAY=$(date +%Y-%m-%d)

echo "⏰ 每日自动快照 — $TODAY"

# 1. 采集站点 API 数据
echo "📡 采集站点数据..."
SITE_DATA=$(curl -s "https://www.happysave.cn/api/v1/search?q=" 2>/dev/null)

if [ -n "$SITE_DATA" ]; then
    # 解析商家数和优惠码数 (简单 grep)
    STORES=$(echo "$SITE_DATA" | grep -o '"storesTotal":[0-9]*' | grep -o '[0-9]*' | head -1)
    COUPONS=$(echo "$SITE_DATA" | grep -o '"couponsTotal":[0-9]*' | grep -o '[0-9]*' | head -1)

    STORES=${STORES:-0}
    COUPONS=${COUPONS:-0}

    # 写入快照
    bash "$LOG_SH" snapshot 0 0 "$STORES" "$COUPONS"

    # 记录 KPI
    bash "$LOG_SH" kpi business "total_stores" "$STORES" 100
    bash "$LOG_SH" kpi business "total_coupons" "$COUPONS" 500
else
    echo "⚠️  无法连接站点，写入基础快照"
    bash "$LOG_SH" snapshot
fi

# 2. 检查数据库健康
echo "🔍 数据库健康检查..."
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
DB_RECORDS=$(sqlite3 "$DB_PATH" "SELECT (SELECT COUNT(*) FROM tech_logs) + (SELECT COUNT(*) FROM marketing_logs) + (SELECT COUNT(*) FROM kpi_history);")

echo "📦 数据库大小: $DB_SIZE"
echo "📊 总记录数: $DB_RECORDS"

# 3. 导出 Markdown 备份
echo "📝 导出 Markdown 备份..."
bash "/root/workspace/happysave/docs/roles/sync.sh" pull

echo ""
echo "✅ 每日快照完成 — $TODAY"

# Crontab 设置说明:
# 1. 运行 crontab -e
# 2. 添加: 0 23 * * * bash /root/workspace/happysave/docs/roles/daily-cron.sh >> /root/workspace/happysave/docs/roles/cron.log 2>&1
# 3. 保存退出
