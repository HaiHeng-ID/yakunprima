/* ============================================================
   YAKUN 官网前端交互 — 三语切换 / 询价单 / 筛选搜索 / 表单
   ============================================================ */
(function () {
  'use strict';
  const D = window.YAKUN_DATA;
  if (!D) return;
  const I18N = D.i18n || {};
  const B = D.base || '';
  const CART_KEY = 'yakun_quote_v1';
  const LANG_KEY = 'yakun_lang';
  const WA = D.brand ? D.brand.wa : '';

  // ============ 语言 ============
  let lang = 'id';
  try { lang = localStorage.getItem(LANG_KEY) || 'id'; } catch (e) {}
  if (!I18N[lang]) lang = 'id';
  const t = k => (I18N[lang] && I18N[lang][k] !== undefined) ? I18N[lang][k] : (I18N.id && I18N.id[k] !== undefined ? I18N.id[k] : k);

  // ============ 产品数据 ============
  const prods = {};
  (D.products || []).forEach(p => { prods[p.sku] = p; });
  if (D.product) prods[D.product.sku] = D.product;
  const catById = id => (D.cats || []).find(c => c.id === id);

  // ============ 工具 ============
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const rupiah = n => (n ? 'Rp ' + Number(n).toLocaleString('id-ID') : '');
  const pName = p => (p.name[lang] || p.name.id || p.sku);

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ============ 询价单 ============
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];
  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
  function cartCount() { return cart.reduce((s, i) => s + (Number(i.qty) || 0), 0); }

  function addToCart(sku, qty) {
    const item = cart.find(i => i.sku === sku);
    if (item) item.qty += Number(qty) || 1;
    else cart.push({ sku, qty: Number(qty) || 1 });
    saveCart();
    renderCart();
    openCart();
    flashQuoteBtn(sku);
  }

  function flashQuoteBtn(sku) {
    $$(`[data-addquote="${sku}"]`).forEach(b => {
      const orig = b.textContent;
      b.textContent = '✓ ' + t('inQuote');
      b.classList.add('added');
      setTimeout(() => { b.classList.remove('added'); applyLang(); }, 1200);
    });
  }

  function renderCart() {
    const body = $('#cartBody');
    if (!body) return;
    updateBadge();
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">🛒 ${esc(t('quoteEmpty'))}<a class="btn btn-orange btn-sm" href="${B}products.html">${esc(t('ctaBrowse'))} →</a></div>`;
      return;
    }
    body.innerHTML = cart.map(item => {
      const p = prods[item.sku];
      const img = p && p.img ? B + 'assets/img/' + p.img : '';
      const name = p ? pName(p) : item.sku;
      return `
      <div class="cart-item" data-cart-item="${esc(item.sku)}">
        ${img ? `<img src="${esc(img)}" alt="${esc(name)}" onerror="this.style.visibility='hidden'">` : ''}
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(name)}</div>
          <div class="cart-item-sku">${esc(item.sku)}</div>
          <div class="cart-qty">
            <button data-cart-dec="${esc(item.sku)}" aria-label="-">−</button>
            <input class="cart-qty-input" type="number" min="1" step="1" inputmode="numeric" value="${item.qty}" data-cart-input="${esc(item.sku)}" aria-label="qty">
            <button data-cart-inc="${esc(item.sku)}" aria-label="+">+</button>
          </div>
        </div>
        <button class="cart-item-rm" data-cart-rm="${esc(item.sku)}" aria-label="remove">🗑</button>
      </div>`;
    }).join('');
    const total = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    body.insertAdjacentHTML('beforeend', `<div class="cart-total">${esc(t('quoteTotal'))}: ${total} pcs</div>`);
  }

  function updateBadge() {
    const badge = $('#cartBadge');
    if (!badge) return;
    const n = cart.length;
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function cartMessage() {
    const lines = cart.map((item, i) => {
      const p = prods[item.sku];
      return `${i + 1}. ${item.sku} — ${p ? pName(p) : ''} × ${item.qty}`;
    });
    return '【官网·询价单】' + t('quoteMsg') + '\n' + lines.join('\n');
  }

  function sendCartWA() {
    if (!cart.length) return;
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(cartMessage()), '_blank');
  }

  function copyCart() {
    if (!cart.length) return;
    const text = cartMessage();
    const done = () => {
      const btn = $('#cartCopy');
      if (btn) { const o = btn.textContent; btn.textContent = t('quoteCopied'); setTimeout(() => applyLang(), 1500); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function openCart() { $('#cartPanel').classList.add('open'); $('#cartOverlay').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeCart() { $('#cartPanel').classList.remove('open'); $('#cartOverlay').hidden = true; document.body.style.overflow = ''; }

  // ============ 卡片渲染（JS 侧） ============
  function cardHTML(p) {
    const img = p.img || '';
    const priceHtml = p.price
      ? `<span class="price">${rupiah(p.price)}</span>`
      : `<span class="price price-na">${esc(t('quoteNow'))}</span>`;
    const labelTxt = { new: t('labelNew'), hot: t('labelHot'), best: t('labelBest') };
    const label = p.label ? `<span class="chip label-${esc(p.label)}">${esc(labelTxt[p.label] || p.label.toUpperCase())}</span>` : '';
    return `
    <div class="p-card" data-pcard data-sku="${esc(p.sku)}">
      <a class="p-card-img" href="${B}products/${esc(p.slug)}.html">
        ${label}
        <img src="${B}assets/img/${esc(img)}" alt="${esc(pName(p))}" loading="lazy" onerror="this.src='${B}assets/img/fallback.svg'">
        <span class="stock-chip ${p.stock}" data-i18n="${p.stock}">${esc(p.stock === 'ready' ? t('ready') : t('preorder'))}</span>
      </a>
      <div class="p-card-body">
        <div class="p-card-top"><span class="sku">${esc(p.sku)}</span></div>
        <a class="p-name" href="${B}products/${esc(p.slug)}.html" data-sku="${esc(p.sku)}">${esc(pName(p))}</a>
        <div class="p-meta">
          ${p.qty ? `<span class="packing">📦 <b>${p.qty}</b> pcs/karton</span>` : ''}
          ${p.moq ? `<span class="moq">${esc(t('moq'))}: <b>${p.moq}</b></span>` : ''}
        </div>
        <div class="p-price-row">${priceHtml}</div>
        <div class="p-actions">
          <a class="btn btn-wa btn-sm" href="https://wa.me/${WA}?text=${encodeURIComponent('【官网·产品卡】Halo, saya tertarik dengan ' + p.sku + '. Mohon info harga grosir.')}" target="_blank" rel="noopener">💬 ${esc(t('waInquiry'))}</a>
          <button class="btn btn-quote btn-sm" data-addquote="${esc(p.sku)}" data-qty="${p.qty || p.moq || 1}">+ ${esc(t('addQuote'))}</button>
        </div>
      </div>
    </div>`;
  }

  // ============ 语言切换 ============
  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { /* placeholder 单独处理 */ }
      else el.textContent = t(k);
    });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $$('[data-sku]').forEach(el => {
      const p = prods[el.getAttribute('data-sku')];
      if (p && p.name) el.textContent = p.name[lang] || p.name.id;
    });
    $$('[data-cat]').forEach(el => {
      const c = catById(el.getAttribute('data-cat'));
      if (c) el.textContent = c.name[lang] || c.name.id;
    });
    $$('[data-cat-badge]').forEach(el => {
      const c = catById(el.getAttribute('data-cat-badge'));
      if (c) el.textContent = (c.badge && (c.badge[lang] || c.badge.id)) || '';
    });
    $$('[data-cat-desc]').forEach(el => {
      const c = catById(el.getAttribute('data-cat-desc'));
      if (c) el.textContent = (c.desc && (c.desc[lang] || c.desc.id)) || '';
    });
    $$('[data-faq-q]').forEach(el => {
      const f = (D.faq || [])[+el.getAttribute('data-faq-q')];
      if (f) el.textContent = f.q[lang] || f.q.id;
    });
    $$('[data-faq-a]').forEach(el => {
      const f = (D.faq || [])[+el.getAttribute('data-faq-a')];
      if (f) el.textContent = f.a[lang] || f.a.id;
    });
    $$('[data-step-i18n]').forEach(el => {
      const s = (D.steps || [])[+el.getAttribute('data-step-i18n')];
      if (!s) return;
      if (el.hasAttribute('data-step-t')) el.textContent = s[lang] || s.id;
      else el.textContent = (s.d && (s.d[lang] || s.d.id)) || '';
    });
    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === lang));
    // 动态区块
    if (D.page === 'home') renderFeatured();
    if (D.page === 'catalog' || D.page === 'category') renderResults();
    if (D.page === 'detail') renderSpecs();
    renderCart();
    // 变体按钮文字
    $$('.v-btn').forEach(b => {
      let lbl = null;
      try { lbl = JSON.parse(b.getAttribute('data-var-label') || 'null'); } catch (e) {}
      if (lbl && lbl[lang]) b.textContent = lbl[lang];
    });
  }

  // ============ 公告轮播 ============
  const annEl = $('[data-announce]');
  const anns = D.announcements || [];
  if (annEl && anns.length) {
    let ai = 0;
    const showAnn = () => {
      const a = anns[ai];
      annEl.style.opacity = 0;
      setTimeout(() => {
        annEl.textContent = (a && (a[lang] || a.id)) || '';
        annEl.style.opacity = 1;
      }, 350);
      ai = (ai + 1) % anns.length;
    };
    showAnn();
    setInterval(showAnn, 5000);
  }

  // ============ 首页精选 ============
  let featTab = 'new';
  function renderFeatured() {
    const grid = $('#featGrid');
    if (!grid) return;
    const items = (D.featured || []).filter(p => p.label === featTab);
    grid.innerHTML = items.length ? items.map(cardHTML).join('') : `<p style="grid-column:1/-1;text-align:center;color:var(--muted)">—</p>`;
  }

  // ============ 目录筛选 ============
  let catFilter = 'all';
  let stockFilter = 'all';
  let sortMode = 'default';
  let searchText = '';

  function renderResults() {
    const grid = $('#pGrid');
    if (!grid) return;
    let list = (D.products || []).filter(p => {
      if (D.page === 'category') { if (p.category !== D.catId) return false; }
      else if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (stockFilter !== 'all' && p.stock !== stockFilter) return false;
      if (searchText) {
        const hay = [p.sku, p.name.zh, p.name.en, p.name.id, p.category,
                     p.specText || ''].join(' ').toLowerCase();
        if (!hay.includes(searchText)) return false;
      }
      return true;
    });
    if (sortMode === 'asc') list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    else if (sortMode === 'desc') list.sort((a, b) => (b.price || -1) - (a.price || -1));
    const rc = $('#resultCount');
    if (rc) rc.textContent = list.length;
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px 0">${esc(t('noResult'))}</p>`;
  }

  // ============ 详情页 ============
  function renderSpecs() {
    const tb = $('#specsTable tbody');
    if (!tb || !D.product || !D.product.specs) return;
    const lines = D.product.specs[lang] || D.product.specs.id || [];
    tb.innerHTML = lines.map(line => {
      const m = line.match(/^([^:]+):\s*(.*)$/);
      if (m) return `<tr><td class="spec-k">${esc(m[1])}</td><td>${esc(m[2])}</td></tr>`;
      return `<tr><td colspan="2">${esc(line)}</td></tr>`;
    }).join('');
  }

  // ============ 表单 ============
  const form = $('#inquiryForm');
  if (form) {
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const fd = new FormData(form);
      const nama = fd.get('nama') || '';
      const kontak = fd.get('kontak') || '';
      const pesan = fd.get('pesan') || '';
      const status = $('#formStatus');
      const show = (msg, ok) => { status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); };
      if (D.formspree) {
        fetch('https://formspree.io/f/' + D.formspree, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ nama, kontak, pesan, lang }),
        }).then(r => {
          if (r.ok) { form.classList.remove('form-error'); show('✅ ' + t('formSuccess'), true); form.reset(); }
          else { form.classList.add('form-error'); show('⚠️ ' + t('formError'), false); }
        }).catch(() => { form.classList.add('form-error'); show('⚠️ ' + t('formError'), false); });
      } else {
        const text = `【官网·表单】Halo, saya ${nama} (${kontak}).\n${pesan}`;
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank');
        show('✅ ' + t('formSuccess'), true);
        form.reset();
      }
    });
  }

  // ============ 事件绑定 ============
  document.addEventListener('click', ev => {
    const add = ev.target.closest('[data-addquote]');
    if (add) { addToCart(add.getAttribute('data-addquote'), add.getAttribute('data-qty') || 1); return; }
    const langBtn = ev.target.closest('.lang-btn');
    if (langBtn) {
      lang = langBtn.getAttribute('data-lang');
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      applyLang();
      return;
    }
    const cartBtn = ev.target.closest('#cartFloat');
    if (cartBtn) { openCart(); return; }
    const close = ev.target.closest('#cartClose') || (ev.target === $('#cartOverlay') && $('#cartOverlay'));
    if (close) { closeCart(); return; }
    const dec = ev.target.closest('[data-cart-dec]');
    if (dec) { const it = cart.find(i => i.sku === dec.getAttribute('data-cart-dec')); if (it) { it.qty = Math.max(1, it.qty - 1); saveCart(); renderCart(); } return; }
    const inc = ev.target.closest('[data-cart-inc]');
    if (inc) { const it = cart.find(i => i.sku === inc.getAttribute('data-cart-inc')); if (it) { it.qty += 1; saveCart(); renderCart(); } return; }
    const rm = ev.target.closest('[data-cart-rm]');
    if (rm) { cart = cart.filter(i => i.sku !== rm.getAttribute('data-cart-rm')); saveCart(); renderCart(); return; }
    const tab = ev.target.closest('.feat-tab');
    if (tab) { featTab = tab.getAttribute('data-feat'); $$('.feat-tab').forEach(x => x.classList.toggle('active', x === tab)); renderFeatured(); return; }
    const chipCat = ev.target.closest('[data-catfilter]');
    if (chipCat) {
      catFilter = chipCat.getAttribute('data-catfilter');
      $$('[data-catfilter]').forEach(x => x.classList.toggle('chip-active', x === chipCat));
      renderResults(); return;
    }
    const chipStock = ev.target.closest('[data-stockfilter]');
    if (chipStock) {
      stockFilter = chipStock.getAttribute('data-stockfilter');
      $$('[data-stockfilter]').forEach(x => x.classList.toggle('chip-active', x === chipStock));
      renderResults(); return;
    }
    const thumb = ev.target.closest('.thumb');
    if (thumb) {
      const img = thumb.getAttribute('data-img');
      const main = $('#mainImg');
      if (main) main.src = B + 'assets/img/' + img;
      $$('.thumb').forEach(x => x.classList.toggle('active', x === thumb));
      return;
    }
    const vbtn = ev.target.closest('.v-btn');
    if (vbtn) {
      $$('.v-btn').forEach(x => x.classList.toggle('active', x === vbtn));
      const img = vbtn.getAttribute('data-var-img');
      const main = $('#mainImg');
      if (main && img) { main.onerror = () => { main.src = B + 'assets/img/fallback.svg'; }; main.src = B + 'assets/img/' + img; }
      const qty = vbtn.getAttribute('data-var-qty');
      const addBtn = $('[data-addquote]');
      if (addBtn && qty) addBtn.setAttribute('data-qty', qty);
      const dQty = $('#dQty');
      if (dQty && qty) dQty.textContent = qty + ' pcs';
      const price = +vbtn.getAttribute('data-var-price') || 0;
      const priceEl = $('#dPrice');
      if (priceEl) {
        if (price > 0) { priceEl.textContent = rupiah(price); priceEl.classList.remove('price-na'); }
        else { priceEl.textContent = t('quoteNow'); priceEl.classList.add('price-na'); }
      }
      return;
    }
  });

  // 数量输入框：实时更新购物车数据（不重渲染，避免丢焦点）
  document.addEventListener('input', ev => {
    const inp = ev.target.closest('[data-cart-input]');
    if (!inp) return;
    const it = cart.find(i => i.sku === inp.getAttribute('data-cart-input'));
    if (!it) return;
    const v = parseInt(inp.value, 10);
    it.qty = (isNaN(v) || v < 1) ? 1 : v;
    saveCart();
    updateBadge();
  });
  // 离开输入框时归一化显示
  document.addEventListener('change', ev => {
    const inp = ev.target.closest('[data-cart-input]');
    if (!inp) return;
    inp.value = Math.max(1, parseInt(inp.value, 10) || 1);
    renderCart();
  });

  const menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', () => $('#nav').classList.toggle('open'));

  // ============ 打印报价单（在线报价表导出原型） ============
  function printQuote() {
    if (!cart.length) return;
    const rows = cart.map((item, i) => {
      const p = prods[item.sku];
      const price = (p && p.price) || 0;
      const subtotal = price ? price * item.qty : 0;
      return { no: i + 1, sku: item.sku, name: p ? pName(p) : item.sku, qty: item.qty, price, subtotal };
    });
    const total = rows.reduce((s, r) => s + r.subtotal, 0);
    const totalQty = rows.reduce((s, r) => s + r.qty, 0);
    const today = new Date().toISOString().slice(0, 10);
    const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID');
    const escQ = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const brand = D.brand || {};
    const body = rows.map(r => `<tr>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center">${r.no}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1">${escQ(r.sku)}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1">${escQ(r.name)}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center">${r.qty}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:right">${r.price ? fmt(r.price) : ''}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:right">${r.subtotal ? fmt(r.subtotal) : ''}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escQ(t('quoteDocTitle'))}</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;color:#0f172a;margin:0;padding:32px}@media print{body{padding:0}}
.h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0b2447;padding-bottom:14px}
.h h1{font-size:22px;margin:0;color:#0b2447}.h .sub{font-size:12px;color:#64748b;margin-top:4px}
.info{display:flex;gap:40px;margin:16px 0;font-size:13px;color:#334155}
.info b{color:#0b2447}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:10px}
th{background:#0b2447;color:#fff;padding:8px 10px;border:1px solid #0b2447;text-align:left;font-size:12px}
.tfoot td{font-weight:700;background:#fff3e8;border:1px solid #cbd5e1}
.note{font-size:11px;color:#94a3b8;margin-top:14px;line-height:1.6}
</style></head><body>
<div class="h"><div><h1>${escQ(brand.fullName || '')}</h1><div class="sub">${escQ(t('quoteDocTitle'))}</div></div>
<div style="text-align:right;font-size:12px;color:#334155"><div><b>${escQ(t('quoteDocDate'))}:</b> ${today}</div>
<div style="margin-top:6px">WhatsApp: ${escQ(brand.waDisplay || '')}</div></div></div>
<div class="info"><div><b>${escQ(t('quoteDocCustomer'))}:</b> ______________________</div></div>
<table><thead><tr>
<th style="text-align:center">NO</th><th>SKU</th><th>${escQ(t('detailSpecs'))}</th><th style="text-align:center">${escQ(t('quoteDocTotalQty'))}</th>
<th style="text-align:right">${escQ(t('unitPrice'))}</th><th style="text-align:right">${escQ(t('quoteDocTotal'))}</th>
</tr></thead><tbody>${body}</tbody>
<tfoot><tr class="tfoot"><td colspan="4" style="text-align:right;font-weight:700">${escQ(t('quoteDocTotal'))}</td>
<td style="text-align:center;font-weight:700">${totalQty}</td><td style="text-align:right;font-weight:700">${fmt(total)}</td></tr></tfoot></table>
<div class="note">${escQ(t('quoteNote'))} · ${escQ(brand.waDisplay || '')}</div>
<script>setTimeout(function(){window.print()},400)<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert(t('quotePrint') + ': 请允许弹出窗口'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  const sendBtn = $('#cartSend');
  if (sendBtn) sendBtn.addEventListener('click', sendCartWA);
  const copyBtn = $('#cartCopy');
  if (copyBtn) copyBtn.addEventListener('click', copyCart);
  const printBtn = $('#cartPrint');
  if (printBtn) printBtn.addEventListener('click', printQuote);
  const clearBtn = $('#cartClear');
  if (clearBtn) clearBtn.addEventListener('click', () => { cart = []; saveCart(); renderCart(); });

  const searchInput = $('#searchInput');
  if (searchInput) searchInput.addEventListener('input', ev => { searchText = ev.target.value.trim().toLowerCase(); renderResults(); });
  const sortSelect = $('#sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', ev => { sortMode = ev.target.value; renderResults(); });

  // ============ 入场动画 ============
  document.body.classList.add('js');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -30px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // ============ 数字滚动 ============
  function countUp(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (!target || isNaN(target)) return;
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1100;
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const statsIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { countUp(en.target); statsIO.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  $$('[data-count]').forEach(el => statsIO.observe(el));

  // ============ 初始化 ============
  applyLang();
  updateBadge();
  if (D.page === 'home') renderFeatured();
  if (D.page === 'catalog' || D.page === 'category') renderResults();
  if (D.page === 'detail') renderSpecs();
})();
