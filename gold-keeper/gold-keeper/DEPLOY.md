# 部署指南

## 步骤 1：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **存储与数据库** → **D1**
3. 点击 **创建数据库**
4. 名称填：`gold-keeper-db`
5. 创建完成后，进入数据库 → **Console** 标签
6. 打开本项目的 `schema.sql` 文件，复制全部内容
7. 粘贴到 D1 Console 的输入框，点击 **Run**
8. 确认返回 "此查询已成功执行"

## 步骤 2：获取数据库 ID

1. 在 D1 数据库页面 → 右侧 **设置** 标签
2. 复制 **数据库 ID**（一串长字符）

## 步骤 3：配置 wrangler.toml

编辑项目根目录的 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gold-keeper-db"
database_id = "粘贴你的数据库ID"
```

## 步骤 4：部署到 Cloudflare Pages

1. 打开 [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. 点击 **创建项目** → **连接到 Git**
3. 选择你的 GitHub 仓库
4. 构建设置：
   - **框架预设**：None
   - **构建命令**：留空
   - **构建输出目录**：`public`
5. 环境变量（重要！）：
   - 在 **环境变量** 部分添加 `DB` 绑定到刚才的 D1 数据库
6. 点击 **保存并部署**

## 步骤 5：本地开发

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 本地启动（会模拟 D1 + Pages）
wrangler pages dev public --d1=DB
```

打开 `http://localhost:8788` 即可本地预览。

## 步骤 6：验证

部署完成后，访问你的域名：

1. ✅ 页面能打开，深色背景，标题「梦幻西游 · 金币管家」
2. ✅ 顶部统计卡片显示数据
3. ✅ 点账号栏切换不同角色
4. ✅ 切到 **📝 记录金币**，录入一条金币 → 提示成功
5. ✅ 切到 **📈 变化趋势**，看到折线图（Y 轴自动显示为"万"）
6. ✅ F12 → Network → 看 `/api/records` 返回 JSON 数据
7. ✅ 手机浏览器打开，图表自适应高度，不溢出

## API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/accounts` | 获取所有账号（含最新金币、记录数） |
| POST | `/api/accounts` | 新增账号 |
| PUT | `/api/accounts/:id` | 修改账号信息 |
| DELETE | `/api/accounts/:id` | 删除账号（级联删除记录） |
| GET | `/api/records?account_id=1` | 查询记录，支持日期范围 |
| POST | `/api/records` | 新增/覆盖金币记录（UPSERT） |
| PUT | `/api/records/:id` | 修改一条记录 |
| DELETE | `/api/records/:id` | 删除一条记录 |

## 常见问题

| 问题 | 解决 |
|------|------|
| `D1_ERROR: no such column` | `schema.sql` 没执行，去 D1 Console 跑一遍 |
| `D1_ERROR: database not bound` | `wrangler.toml` 的 `database_id` 没填对 |
| 折线图空白 | F12 看 Console 红字，Network 里 `/api/records` 是否返回数据 |
| 折线图没线只有点 | 数据只有 1 条，至少录 2 天数据才有线段 |
| CDN 资源加载失败 | 检查网络，或换国内镜像 |
| 修改记录报错 | 确认 `records/[id].js` 用的是 `date` 和 `remark` |
| 手机端图表被挤扁 | 确认 canvas 父容器有 `position:relative` + 固定高度 |
