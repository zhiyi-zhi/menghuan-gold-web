# 梦幻西游 · 金币管家

一个轻量、美观、纯前端的**多账号金币记录工具**，数据存于 Cloudflare D1 数据库。

## ✨ 功能

- 📊 **多账号管理** — 随时切换角色，独立记录
- ⚡ **快捷录入** — 选账号 → 填金币 → 保存，3 秒搞定
- 📈 **趋势图表** — Chart.js 折线图，Y 轴自动换算"万"
- 📝 **历史记录** — 表格展示，支持编辑/删除
- 📱 **手机适配** — 响应式布局，图表高度自适应
- 🔒 **数据安全** — 服务端 UPSERT，无竞态条件

## 🏗 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML/CSS/JS + Chart.js 4.4 |
| 后端 | Cloudflare Pages Functions (ESM) |
| 数据库 | Cloudflare D1 (SQLite) |
| 部署 | Cloudflare Pages |

## 📁 项目结构

```
gold-keeper/
├── public/
│   └── index.html          ← 全部前端（单文件）
├── functions/
│   ├── _middleware.js      ← CORS + 统一错误处理
│   └── api/
│       ├── accounts.js     ← GET/POST 账号
│       ├── accounts/
│       │   └── [id].js    ← PUT/DELETE 账号
│       ├── records.js      ← GET/POST 记录
│       └── records/
│           └── [id].js    ← PUT/DELETE 记录
├── schema.sql              ← D1 建表 + 视图
├── wrangler.toml           ← D1 绑定配置
├── package.json
├── README.md
└── DEPLOY.md               ← 详细部署步骤
```

## 🚀 快速开始

详见 [DEPLOY.md](./DEPLOY.md)，5 步上线：

1. 建 D1 数据库 → 跑 `schema.sql`
2. 配 `wrangler.toml` 绑定
3. 推 GitHub → 连 Cloudflare Pages
4. 访问域名 → 录入第一条金币

## 💡 设计说明

- **前端无状态** — 不依赖 localStorage，纯 API 驱动
- **UPSERT 语义** — 同一天重复录入自动覆盖，不报错
- **账号级隔离** — 每个账号独立折线，可单独查看
- **零依赖构建** — 无 npm install，无打包步骤

## 📄 License

MIT
