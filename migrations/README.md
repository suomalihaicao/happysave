# 🗄️ 数据库迁移 (Migrations)

## 重要规则
- **本地:** SQLite (happysave.db)
- **生产:** PostgreSQL (Vercel DATABASE_URL) / TiDB
- **新增字段/改表:** 必须创建迁移文件，同时准备 SQLite + PostgreSQL 版本

## 目录结构
```
migrations/
├── 001_init_schema.sql      ← 初始表结构 (SQLite)
├── 001_init_schema_pg.sql   ← 初始表结构 (PostgreSQL)
├── 002_xxx.sql              ← 迁移脚本
└── migrate.sh               ← 迁移管理器
```

## 工作流

### 1. 新增字段/改表
```bash
# 创建迁移文件
bash migrate.sh new add_user_avatar

# 编辑 migrations/002_add_user_avatar.sql
# 写入:
# ALTER TABLE users ADD COLUMN avatar TEXT;

# 本地测试
bash migrate.sh apply all

# 生成 PostgreSQL 版本
bash migrate.sh pg 002

# 检查并修正 PG 语法差异
# 手动执行到生产数据库
```

### 2. 常见语法差异

| SQLite | PostgreSQL |
|--------|------------|
| `datetime('now')` | `NOW()` |
| `AUTOINCREMENT` | `SERIAL` |
| `TEXT` | `TEXT` 或 `VARCHAR(255)` |
| `INTEGER PRIMARY KEY` | `SERIAL PRIMARY KEY` |
| `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| `INSERT OR REPLACE` | `ON CONFLICT DO UPDATE` |
| `LIMIT -1` | 不支持 |
| `JSON_EXTRACT` | `->>` 操作符 |

### 3. 迁移状态
```bash
bash migrate.sh status
```

## 注意事项
1. 每次改表前先创建迁移文件
2. SQLite 和 PostgreSQL 语法不同，需要两个版本
3. 生产迁移通过 Vercel API 或手动执行
4. 迁移前备份数据库
5. 测试环境先验证迁移脚本
