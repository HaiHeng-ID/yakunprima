#!/usr/bin/env node
/**
 * build.js — 数据 → 静态站点（SSG）
 * 生成 public/：首页、目录页、7 品类页、91 详情页、sitemap、robots、404、CNAME、CSV 目录
 */
const fs = require('fs');
const path = require('path');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
const SITE = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'site.json'), 'utf8'));
const cats = DATA.categories;
const products = DATA.products;
const brand = SITE.brand;
const DOMAIN = 'https://yakunprima.com';
const OUT = path.join(__dirname, 'public');

// ============ WhatsApp 来源标记（询盘归因） ============
const WA_SRC = {
  hero: '【官网·首页】',
  float: '【官网·悬浮按钮】',
  card: '【官网·产品卡】',
  cat: '【官网·品类页】',
  detail: '【官网·详情页】',
};
const waMsg = (src, text) => WA_SRC[src] + ' ' + text;

// ============ utils ============
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rp = n => (n ? 'Rp ' + n.toLocaleString('id-ID') : '');
const catById = id => cats.find(c => c.id === id);
const catName = (c, l) => (c.name[l] || c.name.id);
const pName = (p, l) => (p.name[l] || p.name.id);
const pImg = p => (p.images && p.images[0]) || p.sku + '.jpg';
const prodUrl = p => 'products/' + p.slug + '.html';
const catUrl = c => 'kategori/' + c.id + '.html';
const readyCount = products.filter(p => p.stock === 'ready').length;
const L = s => s; // placeholder

const LABEL_CLS = { new: 'label-new', hot: 'label-hot', best: 'label-best' };

function labelChip(p) {
  if (!p.label) return '';
  const key = 'label' + p.label[0].toUpperCase() + p.label.slice(1);
  return `<span class="chip ${LABEL_CLS[p.label] || ''}" data-i18n="${key}">${['new', 'hot', 'best'].includes(p.label) ? p.label.toUpperCase() : esc(p.label)}</span>`;
}

// ============ 产品卡片（默认渲染印尼语） ============
function productCard(p, base) {
  const img = pImg(p);
  const priceHtml = p.price ? `<span class="price">${rp(p.price)}</span>` : `<span class="price price-na" data-i18n="quoteNow">Minta Penawaran</span>`;
  const stockTxt = p.stock === 'ready' ? 'ready' : 'preorder';
  return `
  <div class="p-card" data-pcard data-sku="${esc(p.sku)}">
    <a class="p-card-img" href="${base}${prodUrl(p)}">
      ${labelChip(p)}
      <img src="${base}assets/img/${esc(img)}" alt="${esc(pName(p, 'id'))}" loading="lazy" onerror="this.src='${base}assets/img/fallback.svg'">
      <span class="stock-chip ${p.stock}" data-i18n="${stockTxt}">${p.stock === 'ready' ? 'Ready' : 'Pre-order'}</span>
    </a>
    <div class="p-card-body">
      <div class="p-card-top">
        <span class="sku">${esc(p.sku)}</span>
      </div>
      <a class="p-name" href="${base}${prodUrl(p)}" data-sku="${esc(p.sku)}">${esc(pName(p, 'id'))}</a>
      <div class="p-meta">
        ${p.qty ? `<span class="packing">📦 <b>${p.qty}</b> pcs/karton</span>` : ''}
        ${p.moq ? `<span class="moq" data-i18n="moq">Min. Order</span>: <b>${p.moq}</b>` : ''}
      </div>
      <div class="p-price-row">${priceHtml}</div>
      <div class="p-actions">
        <a class="btn btn-wa btn-sm" href="https://wa.me/${brand.wa}?text=${encodeURIComponent(waMsg('card', 'Halo, saya tertarik dengan ' + p.sku + '. Mohon info harga grosir.'))}" target="_blank" rel="noopener">💬 <span data-i18n="waInquiry">WhatsApp</span></a>
        <button class="btn btn-quote btn-sm" data-addquote="${esc(p.sku)}" data-qty="${p.qty || p.moq || 1}">+ <span data-i18n="addQuote">Tambah ke Daftar</span></button>
      </div>
    </div>
  </div>`;
}

// ============ 页面骨架 ============
function head(title, desc, canonical, jsonld, base) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${esc(brand.fullName)}">
<meta name="theme-color" content="#0b2447">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230b2447'/><text x='50' y='68' font-size='52' font-family='Arial' font-weight='bold' fill='%23ff6b1a' text-anchor='middle'>Y</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/css/style.css">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>`;
}

function header(base, active) {
  return `
<div class="announce" id="announce"><div class="announce-inner" data-announce></div></div>
<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="${base}index.html">YAKUN<span class="logo-dot">.</span></a>
    <nav class="nav" id="nav">
      <a href="${base}index.html" class="${active === 'home' ? 'active' : ''}" data-i18n="navHome">Beranda</a>
      <a href="${base}products.html" class="${active === 'products' ? 'active' : ''}" data-i18n="navProducts">Semua Produk</a>
      <a href="${base}index.html#faq" data-i18n="navFAQ">FAQ</a>
      <a href="${base}index.html#kontak" data-i18n="navContact">Kontak</a>
    </nav>
    <div class="header-right">
      <div class="lang-switch" role="group" aria-label="Language">
        <button class="lang-btn" data-lang="zh" title="中文"><span class="flag">🇨🇳</span><span class="lang-name">中文</span></button>
        <button class="lang-btn" data-lang="en" title="English"><span class="flag">🇬🇧</span><span class="lang-name">EN</span></button>
        <button class="lang-btn" data-lang="id" title="Bahasa"><span class="flag">🇮🇩</span><span class="lang-name">ID</span></button>
      </div>
      <button class="menu-btn" id="menuBtn" aria-label="Menu">☰</button>
    </div>
  </div>
</header>`;
}

function footer(base) {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="f-col f-brand">
      <div class="logo logo-footer">YAKUN<span class="logo-dot">.</span></div>
      <p class="f-fullname">${esc(brand.fullName)}</p>
      <p data-i18n="footerDesc">Supplier grosir elektronik Indonesia dengan gudang sendiri di Jakarta.</p>
    </div>
    <div class="f-col">
      <h4 data-i18n="footerLinks">Tautan Cepat</h4>
      <a href="${base}index.html" data-i18n="navHome">Beranda</a>
      <a href="${base}products.html" data-i18n="navProducts">Semua Produk</a>
      <a href="${base}index.html#faq" data-i18n="navFAQ">FAQ</a>
      <a href="${base}downloads/catalog.csv" download="YAKUN-catalog.csv" data-i18n="downloadBtn">⬇ Unduh Katalog (CSV)</a>
    </div>
    <div class="f-col">
      <h4 data-i18n="footerContact">Kontak</h4>
      <a href="https://wa.me/${brand.wa}" target="_blank" rel="noopener">💬 WhatsApp: ${esc(brand.waDisplay)}</a>
      <p data-i18n="footerWarehouse">Gudang</p>
      <p>📍 ${esc(brand.warehouse.id)}</p>
      <p>🕐 ${esc(brand.hours.id)}</p>
    </div>
  </div>
  <div class="f-bottom">© ${new Date().getFullYear()} ${esc(brand.fullName)} — <span data-i18n="footerRights">Hak cipta dilindungi.</span></div>
</footer>`;
}

function floatBtns() {
  return `
<a class="wa-float" href="https://wa.me/${brand.wa}?text=${encodeURIComponent(waMsg('float', 'Halo, saya ingin bertanya tentang produk Anda.'))}" target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 32 32" width="26" height="26"><path fill="#fff" d="M16 3C9.4 3 4 8.4 4 15c0 2.6.9 5.1 2.3 7L4 29l7.2-2.3c1.5.8 3.1 1.3 4.8 1.3 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-4.3 1.4 1.4-4.2-.2-.3c-.9-1.4-1.4-3-1.4-4.6 0-5 4.1-9.2 9.2-9.2s9.2 4.1 9.2 9.2-4.1 9.1-9.2 9.1zm5-6.9c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>
  <span class="wa-tip" data-i18n="waFloat">WhatsApp</span>
</a>
<button class="cart-float" id="cartFloat" aria-label="Daftar Penawaran">
  🛒<span class="cart-badge" id="cartBadge" hidden>0</span>
</button>`;
}

function cartPanel() {
  return `
<div class="cart-overlay" id="cartOverlay" hidden></div>
<aside class="cart-panel" id="cartPanel" aria-label="Daftar Penawaran">
  <div class="cart-head">
    <h3>🛒 <span data-i18n="quoteTitle">Daftar Penawaran</span></h3>
    <button class="cart-close" id="cartClose">✕</button>
  </div>
  <div class="cart-body" id="cartBody"></div>
  <div class="cart-foot">
    <button class="btn btn-wa" id="cartSend">💬 <span data-i18n="quoteSend">Kirim via WhatsApp</span></button>
    <div class="cart-foot-row">
      <button class="btn btn-ghost btn-sm" id="cartCopy" data-i18n="quoteCopy">Salin daftar</button>
      <button class="btn btn-ghost btn-sm" id="cartClear" data-i18n="quoteClear">Hapus</button>
    </div>
    <p class="cart-note" data-i18n="quoteNote">Dihitung per isi karton; harga sesuai penawaran</p>
  </div>
</aside>`;
}

function pageData(extra) {
  return Object.assign({
    i18n: SITE.i18n,
    brand: { wa: brand.wa, waDisplay: brand.waDisplay, fullName: brand.fullName },
    announcements: SITE.announcements,
    formspree: brand.formspree || '',
    cats: cats.map(c => ({ id: c.id, icon: c.icon, name: c.name, badge: c.badge })),
  }, extra || {});
}

function scripts(data, base) {
  return `<script>window.YAKUN_DATA = ${JSON.stringify(data)};</script>
<script src="${base}assets/js/app.js" defer></script>`;
}

// ============ 首页 ============
function buildIndex() {
  const base = '';
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Organization',
    name: brand.fullName, url: DOMAIN + '/',
    contactPoint: { '@type': 'ContactPoint', telephone: '+' + brand.wa, contactType: 'sales', availableLanguage: ['Indonesian', 'English', 'Chinese'] },
  });
  let html = head(`${brand.name} — Grosir Elektronik Ready Stock Jakarta | ${brand.fullName}`,
    `Supplier grosir elektronik ready stock di Jakarta: speaker, kabel data, charger, lampu kepala, pompa air, kotak tisu, setrika. ${products.length}+ SKU ready, grosir campuran & dropship. WhatsApp ${brand.waDisplay}.`,
    DOMAIN + '/', jsonld, base) + '<body>';
  html += header(base, 'home');
  html += `
<main>
  <section class="hero">
    <a class="hero-anchor" href="${base}products/hekv-661a.html">
      <span class="hero-anchor-hot">🔥 HOT</span>
      <span class="hero-anchor-inner">
        <img src="${base}assets/img/HEKV-661A.jpg" alt="6.5 inch speaker" loading="lazy">
        <span class="hero-anchor-info">
          <span class="sku">HEKV-661A</span>
          <span class="hero-anchor-name" data-sku="HEKV-661A">Speaker 6.5 Inci</span>
          <span class="price">Rp 75.600</span>
        </span>
      </span>
    </a>
    <div class="hero-inner">
      <div class="hero-badge" data-i18n="heroBadge">Supplier Grosir Indonesia</div>
      <h1><span data-i18n="heroTitle">Elektronik Ready Stock</span><br><span class="hero-accent" data-i18n="heroTitleAccent">Grosir</span></h1>
      <p class="hero-sub" data-i18n="heroSubtitle">Speaker · Kabel · Charger · Lampu Kepala · Pompa · Kotak Tisu · Setrika</p>
      <p class="hero-value" data-i18n="heroValue">Grosir campuran & dropship · Melayani kota-kota di Indonesia</p>
      <div class="hero-cta">
        <a class="btn btn-wa btn-lg" href="https://wa.me/${brand.wa}?text=${encodeURIComponent(waMsg('hero', 'Halo, saya ingin minta daftar harga grosir.'))}" target="_blank" rel="noopener" data-i18n="ctaQuote">💬 WhatsApp Penawaran</a>
        <a class="btn btn-outline btn-lg" href="${base}products.html" data-i18n="ctaBrowse">Lihat Semua Produk</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><div class="stat-num" data-count="${products.length}" data-suffix="+">${products.length}+</div><div class="stat-lbl" data-i18n="statSKU">SKU Produk</div></div>
        <div class="stat"><div class="stat-num" data-count="${cats.length}">${cats.length}</div><div class="stat-lbl" data-i18n="statCategory">Kategori</div></div>
        <div class="stat"><div class="stat-num" data-count="${readyCount}" data-suffix="+">${readyCount}+</div><div class="stat-lbl" data-i18n="statReady">Ready Stock</div></div>
        <div class="stat"><div class="stat-num">📍</div><div class="stat-lbl" data-i18n="statWarehouse">Gudang</div></div>
      </div>
    </div>
    <div class="hero-marquee">
      <div class="marquee-track">
        ${(() => {
          const MQ = ['HEKV-661A','CQS-CX08','CQS-C19','HED-080','PG-WHT-02B','TBOX-PL','YH-333','HEKV-661B','HEKV-661C','HEKV-661D','HEKV-661E','HEKV-661F'];
          const items = MQ.concat(MQ).map(sku => `<a class="mq-item" href="${base}products/${sku.toLowerCase()}.html" title="${sku}"><img src="${base}assets/img/${sku}.jpg" alt="${sku}" loading="lazy"></a>`);
          return items.join('');
        })()}
      </div>
    </div>
  </section>

  <section class="trust reveal">
    <div class="trust-inner">
      <div class="trust-item"><div class="trust-ic">📦</div><h4 data-i18n="trust1t">Stok Nyata</h4><p data-i18n="trust1d">79+ SKU ready di gudang Jakarta</p></div>
      <div class="trust-item"><div class="trust-ic">🧺</div><h4 data-i18n="trust2t">Grosir Campuran</h4><p data-i18n="trust2d">Campur kategori, kurangi risiko stok</p></div>
      <div class="trust-item"><div class="trust-ic">🚀</div><h4 data-i18n="trust3t">Kirim Cepat</h4><p data-i18n="trust3d">Hari ini / besok dari Jakarta</p></div>
      <div class="trust-item"><div class="trust-ic">🔁</div><h4 data-i18n="trust4t">Dropship</h4><p data-i18n="trust4d">Kemasan netral + layanan dropship</p></div>
    </div>
  </section>

  <section class="steps reveal">
    <h2 class="section-title" data-i18n="stepsTitle">Cara Order — 4 Langkah</h2>
    <div class="steps-inner">
      ${SITE.steps.map((s, i) => `<div class="step"><div class="step-num">${i + 1}</div><h4 data-step-t="stepT${i}" data-step-i18n="${i}">${esc(s.id)}</h4><p data-step-d="stepD${i}" data-step-i18n="${i}">${esc(s.d.id)}</p></div>`).join('')}
    </div>
  </section>

  <section class="cats reveal">
    <h2 class="section-title" data-i18n="catsTitle">Belanja per Kategori</h2>
    <p class="section-sub" data-i18n="catsSub">7 kategori · 90+ produk</p>
    <div class="cats-grid">
      ${cats.map(c => {
        const n = products.filter(p => p.category === c.id).length;
        return `<a class="cat-card" href="${base}${catUrl(c)}">
          <div class="cat-ic">${c.icon}</div>
          <h3 data-cat="${c.id}">${esc(catName(c, 'id'))}</h3>
          <span class="cat-count">${n} SKU</span>
          <span class="cat-badge" data-cat-badge="${c.id}">${esc(c.badge.id || '')}</span>
        </a>`;
      }).join('')}
    </div>
  </section>

  <section class="featured reveal">
    <h2 class="section-title" data-i18n="featTitle">Pilihan Unggulan</h2>
    <div class="feat-tabs" role="tablist">
      <button class="feat-tab active" data-feat="new" data-i18n="tabNew">🆕 Baru</button>
      <button class="feat-tab" data-feat="hot" data-i18n="tabHot">🔥 Laris</button>
      <button class="feat-tab" data-feat="best" data-i18n="tabBest">⭐ Terbaik</button>
    </div>
    <div class="feat-grid" id="featGrid"></div>
    <a class="feat-more" href="${base}products.html" data-i18n="featViewAll">Lihat semua produk →</a>
  </section>

  <section class="download-banner reveal">
    <div class="dl-inner">
      <div>
        <h3 data-i18n="downloadTitle">Unduh Katalog</h3>
        <p data-i18n="downloadDesc">Daftar produk lengkap (bisa dibuka di Excel)</p>
      </div>
      <a class="btn btn-orange btn-lg" href="${base}downloads/catalog.csv" download="YAKUN-catalog.csv" data-i18n="downloadBtn">⬇ Unduh Katalog (CSV)</a>
    </div>
  </section>

  <section class="faq reveal" id="faq">
    <h2 class="section-title" data-i18n="faqTitle">Pertanyaan Umum</h2>
    <div class="faq-list">
      ${SITE.faq.map((f, i) => `<details class="faq-item"><summary data-faq-q="${i}">${esc(f.q.id)}</summary><p data-faq-a="${i}">${esc(f.a.id)}</p></details>`).join('')}
    </div>
  </section>

  <section class="contact-form reveal" id="kontak">
    <h2 class="section-title" data-i18n="formTitle">Kirim Pertanyaan</h2>
    <p class="section-sub" data-i18n="formSub">Tinggalkan kontak Anda, kami balas dalam 24 jam (atau langsung WhatsApp)</p>
    <form class="form" id="inquiryForm">
      <div class="form-row">
        <input type="text" name="nama" required data-i18n-ph="formName" placeholder="Nama Anda">
        <input type="text" name="kontak" required data-i18n-ph="formPhone" placeholder="WhatsApp / Telepon">
      </div>
      <textarea name="pesan" rows="4" data-i18n-ph="formMsg" placeholder="Apa yang Anda cari?"></textarea>
      <button type="submit" class="btn btn-orange" data-i18n="formSubmit">Kirim</button>
      <p class="form-status" id="formStatus"></p>
    </form>
  </section>
</main>`;
  html += footer(base) + floatBtns() + cartPanel();
  const featured = products.filter(p => p.label).map(p => ({
    sku: p.sku, slug: p.slug, name: p.name, price: p.price, qty: p.qty, moq: p.moq,
    stock: p.stock, label: p.label, img: pImg(p), category: p.category,
  }));
  html += scripts(pageData({ steps: SITE.steps, faq: SITE.faq, featured, page: 'home' }), base);
  html += '</body></html>';
  return html;
}

// ============ 目录页 ============
function buildCatalog() {
  const base = '';
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Semua Produk', url: DOMAIN + '/products.html' });
  let html = head(`${brand.name} — Semua Produk | Katalog Grosir`, `Katalog lengkap ${products.length}+ SKU elektronik ready stock: speaker, kabel, charger, lampu kepala, pompa air, kotak tisu, setrika.`, DOMAIN + '/products.html', jsonld, base) + '<body>';
  html += header(base, 'products');
  html += `
<main class="catalog">
  <div class="catalog-head">
    <h1 data-i18n="navProducts">Semua Produk</h1>
    <p><span id="resultCount">${products.length}</span> <span data-i18n="resultCount">produk</span></p>
  </div>
  <div class="toolbar">
    <div class="search-box">
      <input type="search" id="searchInput" data-i18n-ph="searchPh" placeholder="Cari nama / SKU / spesifikasi…">
    </div>
    <div class="chip-row" id="catChips">
      <button class="chip chip-active" data-catfilter="all" data-i18n="filterAll">Semua</button>
      ${cats.map(c => `<button class="chip" data-catfilter="${c.id}">${c.icon} ${esc(catName(c, 'id'))}</button>`).join('')}
    </div>
    <div class="toolbar-row">
      <div class="chip-row">
        <button class="chip chip-active" data-stockfilter="all" data-i18n="filterAll">Semua</button>
        <button class="chip" data-stockfilter="ready" data-i18n="filterReady">Ready</button>
        <button class="chip" data-stockfilter="preorder" data-i18n="filterPreorder">Pre-order</button>
      </div>
      <select id="sortSelect">
        <option value="default" data-i18n="sortDefault">Default</option>
        <option value="asc" data-i18n="sortPriceAsc">Harga rendah→tinggi</option>
        <option value="desc" data-i18n="sortPriceDesc">Harga tinggi→rendah</option>
      </select>
    </div>
  </div>
  <div class="p-grid reveal" id="pGrid"></div>
</main>`;
  html += footer(base) + floatBtns() + cartPanel();
  const minis = products.map(p => ({
    sku: p.sku, slug: p.slug, name: p.name, price: p.price, qty: p.qty, moq: p.moq,
    stock: p.stock, label: p.label, img: pImg(p), category: p.category,
  }));
  html += scripts(pageData({ products: minis, page: 'catalog', base: '' }), base);
  html += '</body></html>';
  return html;
}

// ============ 品类页 ============
function buildCategory(c) {
  const base = '../';
  const prods = products.filter(p => p.category === c.id);
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: catName(c, 'id'), url: `${DOMAIN}/${catUrl(c)}` });
  let html = head(`${catName(c, 'id')} — ${brand.name}`, `${catName(c, 'id')} ready stock Jakarta — ${prods.length} SKU grosir. ${esc(c.desc.id || '')}`, `${DOMAIN}/${catUrl(c)}`, jsonld, base) + '<body>';
  html += header(base, '');
  html += `
<main class="catalog">
  <div class="cat-banner">
    <div class="cat-ic-lg">${c.icon}</div>
    <div>
      <h1 data-cat="${c.id}">${esc(catName(c, 'id'))}</h1>
      <p data-cat-desc="${c.id}">${esc(c.desc.id || '')}</p>
    </div>
    <a class="btn btn-wa" href="https://wa.me/${brand.wa}?text=${encodeURIComponent(waMsg('cat', 'Halo, saya tertarik dengan ' + catName(c, 'id') + '. Mohon penawaran grosir.'))}" target="_blank" rel="noopener">💬 <span data-i18n="waInquiry">WhatsApp</span></a>
  </div>
  <div class="toolbar">
    <div class="search-box"><input type="search" id="searchInput" data-i18n-ph="searchPh" placeholder="Cari nama / SKU / spesifikasi…"></div>
    <div class="toolbar-row">
      <div class="chip-row">
        <button class="chip chip-active" data-stockfilter="all" data-i18n="filterAll">Semua</button>
        <button class="chip" data-stockfilter="ready" data-i18n="filterReady">Ready</button>
        <button class="chip" data-stockfilter="preorder" data-i18n="filterPreorder">Pre-order</button>
      </div>
      <select id="sortSelect">
        <option value="default" data-i18n="sortDefault">Default</option>
        <option value="asc" data-i18n="sortPriceAsc">Harga rendah→tinggi</option>
        <option value="desc" data-i18n="sortPriceDesc">Harga tinggi→rendah</option>
      </select>
    </div>
  </div>
  <div class="p-grid reveal" id="pGrid"></div>
  <a class="back-link" href="${base}products.html" data-i18n="backCatalog">← Kembali ke katalog</a>
</main>`;
  html += footer(base) + floatBtns() + cartPanel();
  const minis = prods.map(p => ({
    sku: p.sku, slug: p.slug, name: p.name, price: p.price, qty: p.qty, moq: p.moq,
    stock: p.stock, label: p.label, img: pImg(p), category: p.category,
  }));
  html += scripts(pageData({ products: minis, page: 'category', catId: c.id, base: '../' }), base);
  html += '</body></html>';
  return html;
}

// ============ 详情页 ============
function buildDetail(p) {
  const base = '../';
  const c = catById(p.category);
  const related = products.filter(x => x.category === p.category && x.sku !== p.sku).slice(0, 4);
  const offers = {
    '@type': 'Offer', priceCurrency: 'IDR',
    availability: p.stock === 'ready' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
  };
  if (p.price) offers.price = p.price;
  const jsonld = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'Product', name: pName(p, 'id'), sku: p.sku, image: p.images.map(i => DOMAIN + '/assets/img/' + i), brand: { '@type': 'Brand', name: brand.name }, offers },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: catName(c, 'id'), item: DOMAIN + '/' + catUrl(c) },
      { '@type': 'ListItem', position: 3, name: pName(p, 'id'), item: DOMAIN + '/' + prodUrl(p) },
    ] },
  ]);
  let html = head(`${pName(p, 'id')} — ${p.sku} | ${brand.name}`, `${pName(p, 'id')} (${p.sku}) ready stock Jakarta. ${esc((p.specs.id[0] || '').slice(0, 120))}`, `${DOMAIN}/${prodUrl(p)}`, jsonld, base) + '<body>';
  html += header(base, '');
  html += `
<main class="detail">
  <nav class="crumbs">
    <a href="${base}index.html" data-i18n="crumbHome">Beranda</a> /
    <a href="${base}${catUrl(c)}" data-cat="${c.id}">${esc(catName(c, 'id'))}</a> /
    <span>${esc(p.sku)}</span>
  </nav>
  <div class="detail-layout reveal">
    <div class="gallery">
      <div class="gallery-main">
        ${labelChip(p)}
        <img id="mainImg" src="${base}assets/img/${esc(pImg(p))}" alt="${esc(pName(p, 'id'))}" onerror="this.src='${base}assets/img/fallback.svg'">
      </div>
      ${p.images.length > 1 ? `<div class="gallery-thumbs">${p.images.map((im, i) => `<button class="thumb ${i === 0 ? 'active' : ''}" data-img="${esc(im)}"><img src="${base}assets/img/${esc(im)}" alt=""></button>`).join('')}</div>` : ''}
    </div>
    <div class="detail-info">
      <div class="d-top">
        <span class="sku">${esc(p.sku)}</span>
        ${labelChip(p)}
        <span class="stock-chip ${p.stock}" data-i18n="${p.stock}">${p.stock === 'ready' ? 'Ready' : 'Pre-order'}</span>
      </div>
      <h1 data-sku="${esc(p.sku)}">${esc(pName(p, 'id'))}</h1>
      <div class="d-price">
        ${p.price ? `<span class="price">${rp(p.price)}</span><span class="price-note" data-i18n="priceNote">Harga grosir ref.</span>` : `<span class="price price-na" data-i18n="quoteNow">Minta Penawaran</span>`}
      </div>
      <div class="d-facts">
        ${p.qty ? `<div class="fact"><span data-i18n="packing">Isi Karton</span><b>${p.qty} pcs</b></div>` : ''}
        ${p.moq ? `<div class="fact"><span data-i18n="moq">Min. Order</span><b>${p.moq} pcs</b></div>` : ''}
        ${p.weight ? `<div class="fact"><span data-i18n="weight">Berat</span><b>${esc(p.weight)}</b></div>` : ''}
      </div>
      ${p.variants ? `
      <div class="d-variants">
        <span class="v-label">Varian</span>
        <div class="v-btns">
          ${p.variants.map((v, i) => `<button class="v-btn ${i === 0 ? 'active' : ''}" data-var-img="${esc(v.image)}" data-var-qty="${v.qty}" data-var-label='${JSON.stringify(v.label)}'>${esc(v.label.id)}</button>`).join('')}
        </div>
      </div>` : ''}
      <div class="d-cta">
        <a class="btn btn-wa btn-lg" href="https://wa.me/${brand.wa}?text=${encodeURIComponent(waMsg('detail', 'Halo, saya tertarik dengan ' + p.sku + ' (' + pName(p, 'id') + '). Mohon info harga grosir.'))}" target="_blank" rel="noopener">💬 <span data-i18n="waInquiry">WhatsApp</span> — <span data-i18n="quoteNow">Minta Penawaran</span></a>
        <button class="btn btn-quote btn-lg" data-addquote="${esc(p.sku)}" data-qty="${p.qty || p.moq || 1}">+ <span data-i18n="addQuote">Tambah ke Daftar</span></button>
      </div>
    </div>
  </div>
  <section class="specs-section reveal">
    <h2 data-i18n="detailSpecs">Spesifikasi</h2>
    <table class="specs-table" id="specsTable"><tbody></tbody></table>
  </section>
  ${related.length ? `
  <section class="related-section reveal">
    <h2 data-i18n="detailRelated">Produk Terkait</h2>
    <div class="p-grid p-grid-sm">
      ${related.map(r => productCard(r, base)).join('')}
    </div>
  </section>` : ''}
</main>`;
  html += footer(base) + floatBtns() + cartPanel();
  const mini = {
    sku: p.sku, slug: p.slug, name: p.name, price: p.price, qty: p.qty, moq: p.moq,
    stock: p.stock, label: p.label, img: pImg(p), category: p.category,
    specs: p.specs, images: p.images, variants: p.variants || null, weight: p.weight,
  };
  html += scripts(pageData({ product: mini, page: 'detail', base: '../' }), base);
  html += '</body></html>';
  return html;
}

// ============ 其他文件 ============
function buildMisc() {
  const mk = (dir) => fs.mkdirSync(path.join(OUT, dir), { recursive: true });

  // sitemap
  let urls = [DOMAIN + '/', DOMAIN + '/products.html'];
  cats.forEach(c => urls.push(`${DOMAIN}/${catUrl(c)}`));
  products.forEach(p => urls.push(`${DOMAIN}/${prodUrl(p)}`));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n');

  // robots
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`);

  // CNAME
  fs.writeFileSync(path.join(OUT, 'CNAME'), 'yakunprima.com\n');

  // 404
  fs.writeFileSync(path.join(OUT, '404.html'), `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 — ${brand.name}</title><link rel="stylesheet" href="assets/css/style.css"></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;background:var(--bg)"><div><h1 style="font-size:4em;color:var(--navy)">404</h1><p style="margin:12px 0 24px;color:var(--muted)">Halaman tidak ditemukan / Page not found / 页面不存在</p><a class="btn btn-orange" href="index.html">← Kembali ke Beranda</a></div></body></html>`);

  // CSV 目录
  const headerCsv = ['SKU', 'Nama (ID)', 'Name (EN)', '名称 (ZH)', 'Kategori', 'Harga (IDR)', 'MOQ', 'Isi Karton', 'Stok', 'Label'];
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = products.map(p => [
    p.sku, p.name.id, p.name.en, p.name.zh, catById(p.category).name.id,
    p.price || '', p.moq || '', p.qty || '', p.stock === 'ready' ? 'Ready' : 'Pre-order', (p.label || '').toUpperCase(),
  ].map(q).join(','));
  mk('downloads');
  fs.writeFileSync(path.join(OUT, 'downloads', 'catalog.csv'), '\uFEFF' + headerCsv.map(q).join(',') + '\n' + rows.join('\n') + '\n');

  // fallback 图
  fs.writeFileSync(path.join(OUT, 'assets', 'img', 'fallback.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#eef2f7"/><text x="200" y="200" font-size="20" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">No Image</text></svg>`);
}

// ============ 构建 ============
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(__dirname, 'assets'), path.join(OUT, 'assets'), { recursive: true });

fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex());
fs.writeFileSync(path.join(OUT, 'products.html'), buildCatalog());
fs.mkdirSync(path.join(OUT, 'kategori'), { recursive: true });
cats.forEach(c => fs.writeFileSync(path.join(OUT, 'kategori', c.id + '.html'), buildCategory(c)));
fs.mkdirSync(path.join(OUT, 'products'), { recursive: true });
products.forEach(p => fs.writeFileSync(path.join(OUT, 'products', p.slug + '.html'), buildDetail(p)));
buildMisc();

const total = 2 + cats.length + products.length + 5;
console.log(`✅ 构建完成 → public/（${total} 个文件）`);
console.log(`   首页 / 目录页 / 品类页×${cats.length} / 详情页×${products.length} / sitemap / robots / 404 / CNAME / CSV`);
