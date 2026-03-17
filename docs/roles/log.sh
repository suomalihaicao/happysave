#!/bin/bash
# 📝 实时日志记录 CLI — 任何角色随时写入数据库
# 用法: bash log.sh <类型> <参数...>
#
# 示例:
#   bash log.sh tech "修复SSR白屏" "改动page.tsx移除dynamic" "P0"
#   bash log.sh marketing "发布推文" "关于Temu优惠码" "social"
#   bash log.sh incident INC-002 "P1" "API超时" "数据库连接池满"
#   bash log.sh decision DEC-005 "切换到Next.js App Router" "更好的SSR支持"
#   bash log.sh snapshot 1500 5000 47 100
#   bash log.sh kpi tech "api_response_ms" 250 500

DB_PATH="/root/workspace/happysave/docs/roles/happysave-logs.db"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +"%Y-%m-%d %H:%M:%S")

# 确保数据库存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库不存在，请先运行: bash init-log-db.sh"
    exit 1
fi

case "$1" in
    tech)
        # 添加技术日志: bash log.sh tech "标题" "内容" "优先级(P0-P3)"
        TITLE="$2"
        CONTENT="$3"
        PRIORITY="${4:-P2}"
        sqlite3 "$DB_PATH" "INSERT INTO tech_logs (date, title, content, priority, created_at) VALUES ('$TODAY', '$TITLE', '$CONTENT', '$PRIORITY', '$NOW');"
        echo "✅ [技术] $TODAY | $PRIORITY | $TITLE"
        ;;

    marketing)
        # 添加营销日志: bash log.sh marketing "标题" "内容" "渠道"
        TITLE="$2"
        CONTENT="$3"
        CHANNEL="${4:-general}"
        sqlite3 "$DB_PATH" "INSERT INTO marketing_logs (date, title, content, channel, created_at) VALUES ('$TODAY', '$TITLE', '$CONTENT', '$CHANNEL', '$NOW');"
        echo "✅ [营销] $TODAY | $CHANNEL | $TITLE"
        ;;

    incident)
        # 添加故障: bash log.sh incident INC-002 "P1" "描述" "根因"
        INC_ID="$2"
        SEVERITY="$3"
        DESC="$4"
        ROOT_CAUSE="$5"
        sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO incidents (id, date, severity, description, root_cause, status, created_at) VALUES ('$INC_ID', '$TODAY', '$SEVERITY', '$DESC', '$ROOT_CAUSE', 'investigating', '$NOW');"
        echo "🚨 [故障] $INC_ID | $SEVERITY | $DESC"
        ;;

    resolve)
        # 解决故障: bash log.sh resolve INC-001 "修复方案说明"
        INC_ID="$2"
        RESOLUTION="$3"
        sqlite3 "$DB_PATH" "UPDATE incidents SET status='resolved', resolution='$RESOLUTION', resolved_at='$NOW' WHERE id='$INC_ID';"
        echo "✅ [解决] $INC_ID | $RESOLUTION"
        ;;

    decision)
        # 添加决策: bash log.sh decision DEC-005 "决策标题" "决策内容" "理由"
        DEC_ID="$2"
        TITLE="$3"
        DECISION="$4"
        REASONING="$5"
        sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO tech_decisions (id, date, title, decision, reasoning, status, created_at) VALUES ('$DEC_ID', '$TODAY', '$TITLE', '$DECISION', '$REASONING', 'accepted', '$NOW');"
        echo "🧠 [决策] $DEC_ID | $TITLE"
        ;;

    snapshot)
        # 数据快照: bash log.sh snapshot <uv> <pv> <stores> <coupons>
        UV="${2:-0}"
        PV="${3:-0}"
        STORES="${4:-47}"
        COUPONS="${5:-95}"
        sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO daily_snapshots (date, uv, pv, total_stores, total_coupons) VALUES ('$TODAY', $UV, $PV, $STORES, $COUPONS);"
        echo "📊 [快照] $TODAY | UV:$UV PV:$PV | 商家:$STORES 优惠码:$COUPONS"
        ;;

    kpi)
        # 记录KPI: bash log.sh kpi <类别> <指标名> <值> <目标值>
        CATEGORY="$2"
        METRIC="$3"
        VALUE="$4"
        TARGET="$5"
        sqlite3 "$DB_PATH" "INSERT INTO kpi_history (date, category, metric, value, target) VALUES ('$TODAY', '$CATEGORY', '$METRIC', $VALUE, $TARGET);"
        echo "📈 [KPI] $CATEGORY.$METRIC = $VALUE (目标: $TARGET)"
        ;;

    campaign)
        # 添加活动: bash log.sh campaign CAM-002 "活动名" "渠道" "预算" "目标"
        CAM_ID="$2"
        NAME="$3"
        CHANNELS="$4"
        BUDGET="${5:-0}"
        TARGET="$6"
        sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO campaigns (id, date, name, channels, budget, target, status, created_at) VALUES ('$CAM_ID', '$TODAY', '$NAME', '$CHANNELS', $BUDGET, '$TARGET', 'active', '$NOW');"
        echo "📣 [活动] $CAM_ID | $NAME | 预算:$BUDGET"
        ;;

    query)
        # 快捷查询
        case "$2" in
            today)
                echo "=== 今日技术日志 ==="
                sqlite3 "$DB_PATH" -header -column "SELECT id, priority, title, status FROM tech_logs WHERE date='$TODAY';"
                echo ""
                echo "=== 今日营销日志 ==="
                sqlite3 "$DB_PATH" -header -column "SELECT id, title, channel FROM marketing_logs WHERE date='$TODAY';"
                echo ""
                echo "=== 活跃故障 ==="
                sqlite3 "$DB_PATH" -header -column "SELECT id, severity, description, status FROM incidents WHERE status='investigating';"
                ;;
            kpi)
                echo "=== 最新 KPI ==="
                sqlite3 "$DB_PATH" -header -column "SELECT category, metric, value, target FROM kpi_history WHERE date=(SELECT MAX(date) FROM kpi_history);"
                ;;
            incidents)
                sqlite3 "$DB_PATH" -header -column "SELECT * FROM incidents ORDER BY date DESC LIMIT 10;"
                ;;
            *)
                echo "查询选项: today | kpi | incidents"
                ;;
        esac
        ;;

    *)
        echo "📝 HappySave 日志 CLI"
        echo ""
        echo "用法: bash log.sh <命令> [参数...]"
        echo ""
        echo "写入命令:"
        echo "  tech      <标题> <内容> [优先级]         添加技术日志"
        echo "  marketing <标题> <内容> [渠道]           添加营销日志"
        echo "  incident  <ID> <级别> <描述> <根因>     添加故障"
        echo "  resolve   <ID> <修复说明>                解决故障"
        echo "  decision  <ID> <标题> <决策> <理由>     添加技术决策"
        echo "  snapshot  [UV] [PV] [商家数] [优惠码数]  记录数据快照"
        echo "  kpi       <类别> <指标> <值> [目标值]   记录KPI"
        echo "  campaign  <ID> <名称> <渠道> [预算] <目标>"
        echo ""
        echo "查询命令:"
        echo "  query today      查看今日日志"
        echo "  query kpi        查看最新KPI"
        echo "  query incidents  查看故障列表"
        ;;
esac
