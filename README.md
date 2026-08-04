# AIHCN · 智衡 — 面向创作者的实用 AI 工具

> 中文：实用的 AI 工具，省下的时间远超订阅价。
> English: Practical AI tools that pay for themselves.

aihcn.com 的品牌官网仓库（中英并重双市场策略）。智衡 AIHCN 为视频创作者与独立制作者做小而实用的 AI 工具（转写 / 切片 / 文案），订阅制，中国与海外市场并行。

## 品牌与商业（中文文档，供你决策）

| 文档 | 内容 |
|---|---|
| [docs/brand.md](docs/brand.md) | 品牌战略 v3：双市场定位、命名、收款与合规 |
| [docs/business-plan.md](docs/business-plan.md) | 商业模式 v3：中英双市场收入模型与路径 |
| [docs/roadmap.md](docs/roadmap.md) | 上线路线图：W1-W25 里程碑 |
| [docs/deploy.md](docs/deploy.md) | 部署说明（Workers + D1） |

## 目录结构

```
build/
  index.html            # 根域名：按浏览器语言自动跳转 /zh/ 或 /en/
  zh/                   # 中文站（智衡 AIHCN，¥ 定价，支付宝/微信）
    index.html tools.html blog.html about.html contact.html 404.html
    privacy.html terms.html refund.html   # 政策页
  en/                   # 英文站（AIHCN，$ 定价，Paddle）
    index.html tools.html blog.html about.html contact.html 404.html
    privacy.html terms.html refund.html   # policy pages
  assets/               # 共享设计系统与资源
    css/style.css       # 宣纸白/墨/青金石蓝/朱砂 + 像素 A + 终端风格
    js/main.js          # 像素 A 动画、表单、导航、滚动显现
    img/                # 标识、favicon、OG 封面
  404.html              # 未命中页面：按浏览器语言跳转对应语言 404
  _headers              # 安全响应头
worker.js               # Worker 表单接口：/api/contact、/api/newsletter（数据存 D1）
database/init.sql       # D1 建表（leads / subscribers）
wrangler.toml           # Workers 部署配置（静态资源 + D1 绑定）
.github/workflows/deploy.yml  # 推送 master 自动部署到 Cloudflare Workers
```

## 本地预览

```bash
python3 -m http.server 8080 --directory build
# 中文：http://localhost:8080/zh/
# 英文：http://localhost:8080/en/
```

## 状态说明（诚实原则）

- **已交付**：双语官网 20 页（含隐私/条款/退款政策）+ 语言跳转 + Worker 表单接口（/api/*）+ 首篇中文博客 + 部署配置
- **开发中**：转写工坊 Transcriptor（视频 → 可搜索字幕）
- **调研中**：切片工坊 ClipLab、文案工坊 MetaForge
- **待配置**：域名邮箱、Cloudflare 域名绑定、D1、国内/海外收款、政策页（见 docs/）

## 技术栈

纯静态 HTML/CSS/JS（零构建依赖）+ Cloudflare Workers 托管（静态资源 + Worker 接口）+ D1 存储。
