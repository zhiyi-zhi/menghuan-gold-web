-- 梦幻西游金币管家 - 数据库初始化脚本
-- 在 Cloudflare D1 控制台中执行此文件

-- 1. 账号表
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  server TEXT,
  role TEXT,
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. 金币记录表
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  gold INTEGER NOT NULL,
  date TEXT NOT NULL,
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(account_id, date),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 3. 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_records_account_date ON records(account_id, date);
CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);

-- 4. 视图：每个账号最新一条记录
CREATE VIEW IF NOT EXISTS v_latest_records AS
SELECT r.*
FROM records r
JOIN (
  SELECT account_id, MAX(date) AS max_date
  FROM records
  GROUP BY account_id
) latest ON r.account_id = latest.account_id AND r.date = latest.max_date;
