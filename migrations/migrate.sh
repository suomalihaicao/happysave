#!/bin/bash
# 🗄️ 数据库迁移管理器
# 用法:
#   bash migrate.sh status              # 查看迁移状态
#   bash migrate.sh apply <version>     # 应用迁移
#   bash migrate.sh new <名称>          # 创建新迁移文件
#   bash migrate.sh diff                # 对比本地 vs 生产差异

MIGRATIONS_DIR="/root/workspace/happysave/migrations"
DB_PATH="/root/workspace/happysave/docs/roles/happysave-logs.db"
PROJECT_DIR="/root/workspace/happysave"

case "$1" in
    status)
        echo "📊 迁移状态"
        echo ""
        echo "📁 本地迁移文件:"
        ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | while read f; do
            echo "  $(basename $f)"
        done
        echo ""
        echo "🗄️ 本地数据库 (SQLite):"
        sqlite3 "$PROJECT_DIR/happysave.db" ".tables" 2>/dev/null || echo "  (数据库不存在)"
        echo ""
        echo "⚠️ 生产数据库 (PostgreSQL):"
        echo "  需要通过 Vercel 环境变量 DATABASE_URL 连接"
        ;;

    new)
        # 获取下一个版本号
        LAST=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | tail -1 | grep -o '[0-9]\+' | head -1)
        NEXT=$(printf "%03d" $((10#$LAST + 1)))
        NAME="${2:-new_migration}"
        FILE="$MIGRATIONS_DIR/${NEXT}_${NAME}.sql"

        cat > "$FILE" << EOF
-- ============================================
-- v${NEXT}: $(date +%Y-%m-%d)
-- 说明: ${NAME}
-- ============================================

-- 本地 (SQLite):
-- sqlite3 happysave.db < migrations/${NEXT}_${NAME}.sql

-- 生产 (PostgreSQL):
-- 通过 API 或 Vercel 环境执行对应的 PostgreSQL 语句

-- === 在此添加迁移 SQL ===


-- === 迁移结束 ===

-- PostgreSQL 对应语句 (如果不同):
-- 注意: SQLite 和 PostgreSQL 语法差异:
--   - TEXT → VARCHAR(255) 或 TEXT
--   - INTEGER → INTEGER 或 SERIAL
--   - datetime('now') → NOW()
--   - AUTOINCREMENT → SERIAL
EOF

        echo "✅ 创建迁移文件: $FILE"
        echo "📝 请编辑该文件添加迁移 SQL"
        ;;

    apply)
        VERSION="$2"
        if [ -z "$VERSION" ]; then
            echo "用法: bash migrate.sh apply <版本号|all>"
            exit 1
        fi

        if [ "$VERSION" = "all" ]; then
            echo "🔄 应用所有迁移..."
            for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
                echo "  执行: $(basename $f)"
                sqlite3 "$PROJECT_DIR/happysave.db" < "$f" 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "  ✅ 成功"
                else
                    echo "  ⚠️ 跳过 (可能已存在)"
                fi
            done
        else
            FILE=$(ls "$MIGRATIONS_DIR"/${VERSION}*.sql 2>/dev/null | head -1)
            if [ -z "$FILE" ]; then
                echo "❌ 找不到迁移文件: $VERSION"
                exit 1
            fi
            echo "🔄 执行: $(basename $FILE)"
            sqlite3 "$PROJECT_DIR/happysave.db" < "$FILE"
            echo "✅ 完成"
        fi
        ;;

    diff)
        echo "🔍 本地 SQLite vs 生产 PostgreSQL 差异分析"
        echo ""
        echo "⚠️ 需要手动对比:"
        echo ""
        echo "本地表结构:"
        sqlite3 "$PROJECT_DIR/happysave.db" ".schema" 2>/dev/null | head -30
        echo ""
        echo "生产表结构: 通过 Vercel API 查询 DATABASE_URL 对应的 PostgreSQL"
        ;;

    pg)
        # 生成 PostgreSQL 版本的迁移
        VERSION="$2"
        if [ -z "$VERSION" ]; then
            echo "用法: bash migrate.sh pg <版本号>"
            exit 1
        fi

        FILE=$(ls "$MIGRATIONS_DIR"/${VERSION}*.sql 2>/dev/null | head -1)
        PG_FILE="${FILE%.sql}_pg.sql"

        echo "🔄 生成 PostgreSQL 版本..."
        echo "-- PostgreSQL 版本" > "$PG_FILE"
        echo "-- 原始: $(basename $FILE)" >> "$PG_FILE"
        echo "" >> "$PG_FILE"

        # 自动转换常见差异
        cat "$FILE" | \
            sed "s/datetime('now')/NOW()/g" | \
            sed "s/AUTOINCREMENT/SERIAL/g" | \
            sed "s/INTEGER DEFAULT 0/SERIAL DEFAULT 0/g" >> "$PG_FILE"

        echo "✅ 生成: $(basename $PG_FILE)"
        echo "📝 请检查并手动调整 PostgreSQL 特定语法"
        ;;

    *)
        echo "🗄️ HappySave 数据库迁移管理器"
        echo ""
        echo "用法: bash migrate.sh <命令> [参数]"
        echo ""
        echo "命令:"
        echo "  status          查看迁移状态"
        echo "  new <名称>      创建新迁移文件"
        echo "  apply <版本>    应用迁移 (本地 SQLite)"
        echo "  apply all       应用所有迁移"
        echo "  diff            对比本地 vs 生产"
        echo "  pg <版本>       生成 PostgreSQL 版本"
        echo ""
        echo "流程:"
        echo "  1. bash migrate.sh new add_user_table"
        echo "  2. 编辑 migrations/XXX_add_user_table.sql"
        echo "  3. bash migrate.sh apply all (本地测试)"
        echo "  4. bash migrate.sh pg XXX (生成 PG 版本)"
        echo "  5. 手动执行 PG 版本到生产数据库"
        ;;
esac
