# 梦幻西游 · 金币管家 — Cloudflare Pages 后端

## 项目结构

```
gold-keeper/
├── public/                    # 前端静态文件（放你的 index.html）
│   └── index.html
├── functions/                 # Cloudflare Pages Functions（API 接口）
│   ├── _middleware.js         # CORS + 错误处理中间件
│   ├── api/
│   │   ├── accounts.js        # GET 列表 / POST 新增账号
│   │   ├── accounts/
│   │   │   └── [id].js       # PUT 更新 / DELETE 删除账号
│   │   ├── records.js         # GET 记录列表（按账号/日期过滤）/ POST 新增记录
│   │   └── records/
│   │       └── [id].js        # PUT 更新 / DELETE 删除记录
├── schema.sql                 # 数据库建表 SQL
├── wrangler.toml              # Cloudflare Pages 配置文件
└── README.md
```

## 快速开始

### 1. 安装 Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 D1 数据库
```bash
wrangler d1 create gold-keeper-db
```
记下输出的 `database_id`，填到 `wrangler.toml` 里。

### 3. 初始化表结构（远程 + 本地）
```bash
# 远程（生产）
wrangler d1 execute gold-keeper-db --remote --file=./schema.sql

# 本地开发
wrangler d1 execute gold-keeper-db --local --file=./schema.sql
```

### 4. 本地开发
```bash
wrangler pages dev public --d1=DB=gold-keeper-db
```
访问 http://localhost:8788

### 5. 部署
```bash
# 方式一：连 GitHub，自动部署（推荐）
# 把整个文件夹 push 到 GitHub，在 Cloudflare Pages 面板导入即可

# 方式二：命令行
wrangler pages deploy public
```

## 数据库绑定名
绑定名统一为 `DB`，前端 fetch 路径统一为 `/api/...`
