# AIHCN · 智衡 — 部署清单

> 版本：v1.1（2026-08） · 按顺序执行，每步完成后勾选

## 架构

- **静态站点**：`build/` 中英双语页面，GitHub Actions 推送 Cloudflare Pages（项目 `aihcn-website`）
- **表单接口**：Pages Functions（`build/functions/api/`），与站点同域 `/api/contact`、`/api/newsletter`，数据存 D1
- **语言跳转**：根域名 `build/index.html` 按浏览器语言自动跳转 `/zh/` 或 `/en/`
- **安全头**：`_headers`

## 部署步骤

### 1. Cloudflare 与域名（约 10 分钟）
- [ ] 将 aihcn.com 的 DNS 托管到 Cloudflare（修改注册商 NS 指向 Cloudflare 分配的 NS）
- [ ] 在 Cloudflare Dashboard 创建 Pages 项目：名称 `aihcn-website`

### 2. GitHub 仓库与自动部署
- [ ] 推送本仓库到 GitHub
- [ ] 配置 Secrets（Settings → Secrets and variables → Actions）：
  - `CLOUDFLARE_API_TOKEN`：Cloudflare「我的个人资料 → API 令牌 → 创建令牌」自定义令牌，
    权限至少：账号·Cloudflare Pages·编辑 + 账号·账户设置·读取 + 区域·区域·读取（绑定自定义域名时需要）；
    资源范围选对应账号
  - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 首页右侧 Account ID，必须与 Token 所属账号一致
- [ ] 令牌本地验证（返回 `"success":true` 才有效，403 说明令牌无效或权限不足）：
  ```bash
  curl -s https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer <TOKEN>"
  ```
- [ ] 推送 `master` 触发 `.github/workflows/deploy.yml`，确认 Actions 通过
- [ ] Pages 项目 → Custom domains → 添加 `aihcn.com`（确认 DNS 已指向 Pages）

### 3. D1 数据库与表单接口
- [ ] 创建 D1 数据库（如 `aihcn-db`）
- [ ] 在 D1 控制台执行 `database/init.sql`（创建 `leads` / `subscribers` 表）
- [ ] Pages 项目 → Settings → Functions → D1 数据库绑定，绑定名填 **`DB`**（必须与代码一致）
- [ ] 重新部署后验证接口：
  ```bash
  curl -X POST https://aihcn.com/api/newsletter -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'
  # 期望返回 {"ok":true,...}
  ```
- [ ] 如 `/api/*` 返回 404（Functions 未生效），回退方案：将 `worker.js` 部署为独立 Worker，
      在 Pages 项目加路由 `aihcn.com/api/*` → Worker，并绑定同名 D1（变量 `DB`）

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
- [ ] 404 页、移动端布局、安全响应头正常
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
