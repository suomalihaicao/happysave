# 📂 HappySave 角色工作区

## 目录结构
```
docs/roles/
├── README.md                    ← 本文件
├── 技术部门主管.md               ← CTO工作手册
├── 营销主管.md                   ← CMO工作手册
├── happysave-logs.db            ← SQLite 日志数据库 (永久固化)
├── log.sh                       ← 实时记录CLI ⭐ 主要写入工具
├── sync.sh                      ← 数据库状态/导出工具
├── daily-cron.sh                ← 每日自动快照脚本
├── log-schema.sql               ← 建表语句 (备份)
├── init-log-db.sh               ← 初始化脚本 (首次使用)
├── tech-logs/
│   ├── 2026-03-17.md
│   ├── incidents.md
│   └── decisions.md
└── marketing-logs/
    ├── 2026-03-17.md
    ├── campaigns.md
    └── analytics.md
```

## ⭐ 实时写入 (核心功能)

### 技术日志
```bash
bash log.sh tech "修复SSR白屏" "改动page.tsx" "P0"
```

### 营销日志
```bash
bash log.sh marketing "发布推文" "Temu优惠码介绍" "social"
```

### 故障记录
```bash
bash log.sh incident INC-002 "P1" "API超时" "连接池满"
bash log.sh resolve INC-002 "扩容连接池到20"
```

### 技术决策
```bash
bash log.sh decision DEC-005 "用App Router" "更好的SSR"
```

### KPI 记录
```bash
bash log.sh kpi tech "build_time" 20.8 30
bash log.sh kpi business "daily_uv" 150 1000
```

### 营销活动
```bash
bash log.sh campaign CAM-002 "春节促销" "social,email" 500 "5000 UV"
```

### 数据快照
```bash
bash log.sh snapshot 1500 5000 47 100
```

## 📊 查询数据

```bash
bash log.sh query today       # 今日日志 + 活跃故障
bash log.sh query kpi         # 最新 KPI
bash log.sh query incidents   # 故障列表

bash sync.sh status           # 数据库统计
bash sync.sh pull             # 导出 Markdown 备份
```

## ⏰ 自动快照

设置 crontab 每晚 23:00 自动快照:
```bash
crontab -e
# 添加:
0 23 * * * bash /root/workspace/happysave/docs/roles/daily-cron.sh >> /root/workspace/happysave/docs/roles/cron.log 2>&1
```

## 📐 数据库表结构

| 表名 | 用途 | 主键 |
|------|------|------|
| tech_logs | 技术工作日志 | auto ID |
| incidents | 故障记录 | INC-XXX |
| tech_decisions | 技术决策 | DEC-XXX |
| marketing_logs | 营销日志 | auto ID |
| campaigns | 营销活动 | CAM-XXX |
| daily_snapshots | 每日数据快照 | date |
| kpi_history | KPI 历史追踪 | auto ID |

---

*最后更新: 2026-03-17*
