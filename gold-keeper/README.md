# 梦幻西游 · 金币管家

一个基于 Cloudflare Pages + D1 数据库的梦幻西游金币记录工具。

## 功能特性

- ⚡ 快捷录入金币（支持补录任意日期）
- 📊 多账号金币趋势图表
- 📋 记录管理（增删改查）
- 🔄 同一账号同一天自动覆盖更新
- 📱 移动端友好

## 部署步骤

### 1. 克隆仓库到 GitHub

```bash
git clone <your-repo-url> gold-keeper
cd gold-keeper
```

### 2. 在 Cloudflare Pages 中创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → **Create a project** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 构建设置：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `public`

### 3. 创建 D1 数据库

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages** → **D1**
2. 点击 **Create database**
3. 数据库名称：`gold-keeper-db`
4. 记下数据库 ID

### 4. 绑定 D1 到 Pages 项目

1. 进入你的 Pages 项目 → **Settings** → **Functions**
2. 在 **D1 bindings** 部分：
   - Variable name: `DB`
   - D1 database: 选择刚创建的 `gold-keeper-db`

### 5. 初始化数据库

在 Cloudflare D1 控制台中执行 `schema.sql` 的内容：

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  server TEXT,
  role TEXT,
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

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

CREATE INDEX IF NOT EXISTS idx_records_account_date ON records(account_id, date);

CREATE VIEW IF NOT EXISTS v_latest_records AS
SELECT r.*
FROM records r
JOIN (
  SELECT account_id, MAX(date) AS max_date
  FROM records
  GROUP BY account_id
) latest ON r.account_id = latest.account_id AND r.date = latest.max_date;
```

### 6. 部署

每次推送到 `main` 分支，Cloudflare Pages 会自动部署。

## 项目结构

```
gold-keeper/
├── public/
│   └── index.html          # 前端页面
├── functions/
│   ├── api/
│   │   ├── accounts.js     # 账号 API
│   │   └── records.js      # 记录 API（含 UPSERT）
│   └── _middleware.js      # 中间件
├── schema.sql              # 数据库建表语句
├── wrangler.toml           # Cloudflare 配置
└── README.md
```

## 技术栈

- **前端**: HTML + Tailwind CSS + Chart.js
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages
