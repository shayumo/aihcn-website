# AIHCN · 智衡 — 部署清单

> 版本：v2.0（2026-08） · 按顺序执行，每步完成后勾选

## 架构

- **站点形态**：静态资源（`build/` 中英双语页面）+ Worker 接口（`worker.js`），部署为 Cloudflare Workers 项目 `aihcn-website`（已存在，自定义域 `aihcn.com` 已绑定）
- **部署方式**：GitHub Actions 用 `wrangler-action` 推送，配置见 `wrangler.toml`；静态资源由 `[assets]` 托管，`/api/*` 由 `worker.js` 处理，数据存 D1
- **语言跳转**：根域名 `build/index.html` 按浏览器语言自动跳转 `/zh/` 或 `/en/`；404 由 `build/404.html` 同样按语言跳转
- **安全头**：`build/_headers`

## 部署步骤

### 1. Cloudflare 项目与域名（已完成，确认即可）
- [x] 确认 Workers 项目 `aihcn-website` 存在（Dashboard → Workers & Pages），自定义域 `aihcn.com` 已绑定
- [ ] 若该项目还连着旧 GitHub 集成（项目页显示「shayumo/aihcn-website」来源），建议在项目 Settings 中断开 Git 连接，避免旧构建配置覆盖新站点（部署改由 Actions 负责）

### 2. GitHub 仓库与自动部署
- [ ] 配置 Secrets（Settings → Secrets and variables → Actions）：
  - `CLOUDFLARE_API_TOKEN`：Cloudflare「我的个人资料 → API 令牌 → 创建令牌」自定义令牌，
    权限至少：账号·Workers Scripts·编辑 + 账号·D1·编辑 + 账号·账户设置·读取；资源范围选对应账号
  - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 首页右侧 Account ID（`f454e7665de1f9b49f25336db68f39ff`），必须与 Token 所属账号一致
- [ ] 令牌本地验证（返回 `"success":true` 才有效，403 说明令牌无效或权限不足）：
  ```bash
  curl -s https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer <TOKEN>"
  ```
- [ ] 推送 `master` 触发 `.github/workflows/deploy.yml`，确认 Actions 通过
- [ ] 验证 `https://aihcn.com/` 语言跳转、`/zh/`、`/en/` 正常（临时域名 `https://aihcn-website.410291479.workers.dev`）

### 3. D1 数据库与表单接口
- [ ] 创建 D1 数据库（名称建议 `aihcn-db`）：
  ```bash
  wrangler d1 create aihcn-db
  ```
- [ ] 在 D1 控制台执行 `database/init.sql`（创建 `leads` / `subscribers` 表）
- [ ] 在 `wrangler.toml` 取消注释 D1 绑定，填入实际 `database_id`
- [ ] 重新部署后验证接口（正常应返回 `{"ok":true,...}`；未绑定 D1 时返回 503 提示是正常的，按上一步补齐即可）：
  ```bash
  curl -X POST https://aihcn.com/api/newsletter -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'
  ```

### 4. 域名邮箱（可选，免费）
- [ ] Cloudflare → Email Routing → 添加 `hello@aihcn.com`，转发到你的个人邮箱
- [ ] 站内所有 `hello@aihcn.com` 即可直接收信

### 5. 收款（上线前）
- [ ] 国内：办理个体工商户，开通支付宝/微信商户（未办好前可用 Paddle 兜底）
- [ ] 海外：注册 Paddle / Lemon Squeezy（merchant of record）

### 6. 上线验证清单
- [ ] `https://aihcn.com/` 按语言跳转正确，兜底按钮可用
- [ ] 中英各页导航、语言切换、政策链接可用
- [ ] 联系表单与订阅表单可提交、D1 有记录、蜜罐拦截生效
- [ ] 404 兜底页按语言跳转、移动端布局、安全响应头正常（`build/_headers` 生效）
- [ ] 政策页生效日期与内容已复核

## 本地预览

```bash
python3 -m http.server 8080 --directory build
# 中文：http://localhost:8080/zh/ · 英文：http://localhost:8080/en/
# 本地预览下 /api 不可用属正常（前端会提示直连邮箱）
```

## 常见错误排查

### Actions 报 403 Authentication error（code 10000）
说明 Cloudflare API 拒绝了 Token，与 Node 版本/工作流代码无关。按顺序排查：

1. **本地验证 Token 本身**（命令见上方第 2 步）：
   - 返回 403/401 → Token 无效：过期 / 复制漏了字符 / 被撤销 → 在 Cloudflare 重建 Token，更新 Secret
   - 返回 `"success":true` → Token 有效，问题在 Secret 或账号配置，继续下一步
2. **确认两个 Secret 都存在于正确仓库**（`shayumo/aihcn-website`），且名字完全一致（大小写敏感）：
   `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
3. **确认 Account ID 与 Token 所属账号一致**：Token 在账号 A 创建、Secret 却填账号 B 的 ID，同样会 403
4. 修好后在 Actions 对失败运行 **Re-run all jobs**，或推一个新提交触发

### Actions 报 404 Project not found
说明部署目标用错了产品：`aihcn-website` 是 **Workers 项目**（子域为 `*.workers.dev`），不是 Pages 项目（`*.pages.dev`）。旧工作流用的 `cloudflare/pages-action` 只认 Pages 项目，因此 404。
- 当前仓库已改用 `wrangler-action` + `wrangler.toml` 部署 Workers，不再需要 Pages 项目
- 若仍想用 Pages：需先在 Dashboard 创建同名 Pages 项目，并先解除自定义域与现有 Worker 的绑定（会有一段时间域名不可用，不推荐）
