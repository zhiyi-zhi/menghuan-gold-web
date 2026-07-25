-- 梦幻西游金币管家 · D1 数据库结构

-- 账号表（一个角色 = 一条记录）
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,          -- 账号名称，如"主号-大唐官府"
  server TEXT DEFAULT '',             -- 服务器名
  role TEXT DEFAULT '',               -- 角色名
  note TEXT DEFAULT '',               -- 备注
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 金币记录表（每天每条记录 = 一条）
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,        -- 关联 accounts.id
  gold INTEGER NOT NULL DEFAULT 0,    -- 金币数量
  record_date TEXT NOT NULL,          -- 记录日期 YYYY-MM-DD
  note TEXT DEFAULT '',               -- 备注
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 索引：按账号 + 日期快速查询
CREATE INDEX IF NOT EXISTS idx_records_account ON records(account_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date);

-- 视图：账号 + 最新金币 + 日期（方便图表）
CREATE VIEW IF NOT EXISTS v_latest_records AS
SELECT r.*
FROM records r
INNER JOIN (
  SELECT account_id, MAX(record_date) AS max_date
  FROM records
  GROUP BY account_id
) t ON r.account_id = t.account_id AND r.record_date = t.max_date;
