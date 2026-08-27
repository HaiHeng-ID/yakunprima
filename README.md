# YAKUN 官网（yakunprima.com）

PT YAKUN PRIMA INDONESIA — 印尼电子产品现货批发目录站。
静态 SSG 架构：数据驱动，构建期生成全站 HTML，SEO 友好，GitHub Pages 免费部署。

## 目录结构

```
yakun-site/
├── data/
│   ├── products.json    # 产品数据（唯一数据源，改产品改这里）
│   └── site.json        # 站点配置：品牌、公告、流程、FAQ、三语界面文案
├── assets/
│   ├── css/style.css    # 设计系统
│   ├── js/app.js        # 交互：语言切换/询价单/筛选/表单
│   └── img/             # 产品图（按 SKU 命名）
├── convert.js           # 旧站数据 → products.json（一次性迁移工具）
├── build.js             # 构建脚本：data → public/
└── public/              # 构建产物（git 忽略，由 CI 生成）
```

## 如何更新产品

1. 编辑 `data/products.json`（或让 AI 助手改）
2. 产品图丢进 `assets/img/`，文件名 = SKU（如 `HEKV-661A.jpg`）
3. 提交并 push → GitHub Actions 自动构建部署

产品数据结构（新增产品照着写）：
```json
{
  "sku": "HEKV-661A",
  "slug": "hekv-661a",
  "category": "speaker",
  "name": { "zh": "6.5寸音响 款式A", "en": "6.5\" Speaker Model A", "id": "Speaker 6.5 Inci" },
  "price": 75600,
  "moq": 16,
  "qty": 16,
  "weight": "0.9095kg",
  "stock": "ready",
  "label": "hot",
  "specs": { "zh": ["材质：塑胶+铁网"], "en": ["Material: Plastic+Iron Mesh"], "id": ["Bahan: Plastik + Jaring Besi"] },
  "images": ["HEKV-661A.jpg"]
}
```

多图：`images` 数组加文件名即可。多规格：加 `variants` 数组（参考 HEDS/HEDY）。

## 本地开发

```bash
node build.js          # 构建
npm run serve          # 本地预览 http://localhost:8899
```

## 部署 / 域名

- 托管：GitHub Pages（免费），仓库 `yakunprima`
- 域名：yakunprima.com（构建自动生成 CNAME 文件）
- DNS：域名解析到 GitHub Pages 后，在仓库 Settings → Pages 绑定域名、勾选 Enforce HTTPS

## 待办数据（缺数据，需补充）

- 缺装箱量 moq/qty：HEKV-881D、SPHED-B/K/O/W、HED-020、HED-030、HED-050
- 缺价格：HED-030、HEDS（太阳能灯）、HEDY（面包灯）
- 询盘表单 Formspree ID：填到 data/site.json 的 brand.formspree（留空则表单走 WhatsApp）
