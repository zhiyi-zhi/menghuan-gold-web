# 梦幻西游金币管家 - 完整部署指南

## 一、项目结构

```
menghuan-gold-web/
├── .gitignore
├── README.md
├── DEPLOY.md              # 本文件
├── package.json
├── wrangler.toml          # Cloudflare 配置
├── schema.sql              # 数据库初始化 SQL
├── public/
│   └── index.html          # 前端页面（唯一入口）
└── functions/
    ├── _middleware.js      # 全局中间件（CORS + 日志）
    └── api/
        ├── accounts.js     # 账号 CRUD API
        └── records.js      # 金币记录 API（UPSERT）
```

## 二、一键部署流程（推荐）

### 方式 A：GitHub + Cloudflare Pages（最推荐）

#### Step 1：推送到 GitHub
```bash
cd menghuan-gold-web
git init
git add .
git commit -m "初始化梦幻西游金币管家项目"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gold-keeper.git
git push -u origin main
```

#### Step 2：Cloudflare Pages 绑定
1. 登录 https://dash.cloudflare.com/
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择 `gold-keeper` 仓库
4. 构建设置：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `public`
5. 点击 **Save and Deploy**

#### Step 3：创建并绑定 D1 数据库
1. **Workers & Pages** → **D1** → **Create database**
2. 名称：`gold-keeper-db`
3. 在 D1 控制台中执行 `schema.sql` 的内容（复制粘贴即可）
4. 回到 Pages 项目 → **Settings** → **Functions** → **D1 bindings**
5. 添加绑定：
   - Variable name: `DB`
   - Database: `gold-keeper-db`
6. 点击 **Save**

#### Step 4：完成！
访问你的 Pages 域名即可使用。

---

### 方式 B：使用 Wrangler CLI 本地开发

```bash
# 安装依赖
npm install

# 本地开发（需要先在 wrangler.toml 中填入 D1 数据库 ID）
npm run dev

# 本地数据库初始化
npm run init-db

# 部署到生产
npm run deploy
```

---

## 三、数据库初始化（重要）

在 Cloudflare D1 控制台中执行以下 SQL：

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

## 四、API 接口文档

### 账号 API (`/api/accounts`)

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/accounts` | 获取所有账号 | - |
| POST | `/api/accounts` | 新增账号 | `{name, server?, role?, remark?}` |
| PUT | `/api/accounts/:id` | 修改账号 | `{name, server?, role?, remark?}` |
| DELETE | `/api/accounts/:id` | 删除账号 | - |

### 记录 API (`/api/records`)

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/records` | 获取所有记录（含账号名） | - |
| GET | `/api/records?account_id=1` | 获取指定账号记录 | - |
| GET | `/api/records?account_id=1&start=2024-01-01&end=2024-12-31` | 按日期范围查询 | - |
| POST | `/api/records` | 新增/覆盖记录（UPSERT） | `{account_id, gold, date, remark?}` |
| PUT | `/api/records/:id` | 修改记录 | `{gold, date, remark?}` |
| DELETE | `/api/records/:id` | 删除记录 | - |

## 五、功能说明

### 快捷录入
- 点击右上角「⚡ 快捷录入」按钮
- 选择账号 → 输入金币 → 选择日期 → 确认
- 同一天重复录入 = 自动覆盖更新
- 可以随时补录过去任意日期

### 趋势图表
- 自动显示所有账号的金币变化曲线
- 可以多选账号对比
- Y 轴自动格式化为"万"单位

### 记录管理
- 按账号筛选
- 编辑/删除任意记录
- 表格形式清晰展示

### 账号管理
- 新增/编辑/删除账号
- 删除账号时级联删除其所有记录

## 六、常见问题

**Q: 录入时报错 "D1_ERROR: no such column"？**
A: 检查 `schema.sql` 是否已完整执行，确认字段名是 `date` 不是 `record_date`，是 `remark` 不是 `note`。

**Q: 同一天录了两次，出现两条记录？**
A: 检查 `records` 表的 `UNIQUE(account_id, date)` 约束是否存在。如果不存在，执行 schema.sql 重建。

**Q: 图表不显示数据？**
A: 打开浏览器控制台（F12）查看 API 请求是否成功，确认 D1 绑定是否正确。

**Q: 本地开发如何调试？**
A: 使用 `npm run dev`，访问 http://localhost:8788

## 七、技术栈

- 前端：HTML + Tailwind CSS + Chart.js + Font Awesome
- 后端：Cloudflare Pages Functions (JavaScript)
- 数据库：Cloudflare D1 (SQLite)
- 部署：Cloudflare Pages（自动从 GitHub 构建）
