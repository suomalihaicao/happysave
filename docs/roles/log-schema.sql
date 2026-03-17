-- HappySave 日志数据库 (本地 SQLite)
-- 用于存储所有角色的工作日志、故障、决策、活动、分析数据

-- 技术日志
CREATE TABLE IF NOT EXISTS tech_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'active', -- active/resolved/archived
  priority TEXT DEFAULT 'P2', -- P0/P1/P2/P3
  tags TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 故障记录
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY, -- INC-XXX
  date TEXT NOT NULL,
  severity TEXT NOT NULL, -- P0/P1/P2/P3
  scope TEXT, -- 影响范围
  description TEXT,
  root_cause TEXT,
  resolution TEXT,
  status TEXT DEFAULT 'investigating', -- investigating/identified/resolved/closed
  assignee TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- 技术决策
CREATE TABLE IF NOT EXISTS tech_decisions (
  id TEXT PRIMARY KEY, -- DEC-XXX
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT,
  alternatives TEXT, -- JSON array of considered alternatives
  status TEXT DEFAULT 'proposed', -- proposed/accepted/deprecated/superseded
  created_at TEXT DEFAULT (datetime('now'))
);

-- 营销日志
CREATE TABLE IF NOT EXISTS marketing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  channel TEXT, -- seo/social/email/ads
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 营销活动
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY, -- CAM-XXX
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  channels TEXT, -- JSON array
  budget REAL DEFAULT 0,
  target TEXT,
  results TEXT, -- JSON object
  status TEXT DEFAULT 'planned', -- planned/active/paused/completed
  created_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT
);

-- 数据快照 (每日自动记录)
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  -- 流量数据
  uv INTEGER DEFAULT 0,
  pv INTEGER DEFAULT 0,
  bounce_rate REAL,
  avg_duration REAL,
  -- 业务数据
  total_stores INTEGER DEFAULT 0,
  total_coupons INTEGER DEFAULT 0,
  coupon_clicks INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  subscribers INTEGER DEFAULT 0,
  -- 技术数据
  avg_response_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  cache_hit_rate REAL,
  -- SEO 数据
  indexed_pages INTEGER DEFAULT 0,
  organic_traffic INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- KPI 追踪
CREATE TABLE IF NOT EXISTS kpi_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category TEXT NOT NULL, -- tech/marketing/business
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  target REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tech_logs_date ON tech_logs(date);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_marketing_logs_date ON marketing_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_kpi_history_date ON kpi_history(date);
CREATE INDEX IF NOT EXISTS idx_kpi_history_metric ON kpi_history(category, metric);
