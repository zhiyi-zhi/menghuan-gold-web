# 梦幻西游 · 金币管家

> 每日记录金币变化、多账号管理、趋势图表可视化  
> 基于 Cloudflare Pages + D1 的零成本部署方案

## 功能

- ⚡ 快捷录入（选择账号 → 输金币 → 选日期 → 保存）
- 📊 趋势图表（多账号折线对比，category 轴，无需额外依赖）
- 📋 记录管理（筛选、编辑、删除）
- 👥 账号管理（增删改查，级联删除记录）
- 📱 移动端适配

## 部署

### 1. 准备数据库

在 Cloudflare Dashboard → D1 创建数据库 `gold-keeper-db`，然后在 Console 执行 `schema.sql` 的内容。

### 2. 绑定数据库

编辑 `wrangler.toml`，把 `<DATABASE_ID>` 替换为你的真实数据库 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gold-keeper-db"
database_id = "你的真实ID"
```

### 3. 推送代码

```bash
git add .
git commit -m "初始化金币管家"
git push
```

在 Cloudflare Pages 连接 GitHub 仓库，构建输出目录填 `public`。

## 项目结构

```
gold-keeper/
├── functions/
│   ├── _middleware.js          # CORS + 统一错误处理
│   └── api/
│       ├── accounts.js         # 账号 CRUD
│       ├── accounts/[id].js    # 账号 PUT/DELETE
│       ├── records.js          # 记录 UPSERT + 查询
│       └── records/[id].js     # 记录 PUT/DELETE
├── public/
│   └── index.html              # 全部前端（HTML + CSS + JS）
├── schema.sql                  # 数据库建表
├── wrangler.toml               # Cloudflare 配置
└── package.json
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/accounts` | 获取所有账号 |
| POST | `/api/accounts` | 新增账号 |
| PUT | `/api/accounts/:id` | 更新账号 |
| DELETE | `/api/accounts/:id` | 删除账号 |
| GET | `/api/records?account_id=` | 查询记录 |
| POST | `/api/records` | 新增/覆盖记录（UPSERT） |
| PUT | `/api/records/:id` | 更新记录 |
| DELETE | `/api/records/:id` | 删除记录 |
