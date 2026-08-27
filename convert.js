#!/usr/bin/env node
/**
 * convert.js — 旧站数据 → 新站结构化数据（三语翻译清洗）
 * 读取 ../old-site/products.js，输出 data/products.json
 */
const fs = require('fs');
const path = require('path');

const OLD = path.join(__dirname, '..', 'old-site', 'products.js');
if (!fs.existsSync(OLD)) { console.error('找不到 old-site/products.js'); process.exit(1); }

const src = fs.readFileSync(OLD, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
eval(src.replace('var CATALOG', 'globalThis.CATALOG'));
const C = globalThis.CATALOG;

// ================= 颜色 =================
const COLOR_PAIRS_EN = { '黄黑':'Yellow-Black','黑白':'Black-White','白紫':'White-Purple','黑银':'Black-Silver','钛银':'Titanium Silver','透明':'Transparent','咖啡':'Coffee' };
const COLOR_PAIRS_ID = { '黄黑':'Kuning-Hitam','黑白':'Hitam-Putih','白紫':'Putih-Ungu','黑银':'Hitam-Perak','钛银':'Titanium Silver','透明':'Transparan','咖啡':'Kopi' };
const COLOR_EN = { '黑':'Black','白':'White','蓝':'Blue','紫':'Purple','橙':'Orange','绿':'Green','黄':'Yellow','银':'Silver','棕':'Brown','茶':'Brown','钛':'Titanium','色':'' };
const COLOR_ID = { '黑':'Hitam','白':'Putih','蓝':'Biru','紫':'Ungu','橙':'Oranye','绿':'Hijau','黄':'Kuning','银':'Perak','棕':'Coklat','茶':'Coklat','钛':'Titanium','色':'' };

const zhColorEn = (s) => { for (const [k,v] of Object.entries(COLOR_PAIRS_EN)) s = s.split(k).join(v); return s.split('').map(ch => COLOR_EN[ch] !== undefined ? COLOR_EN[ch] : ch).join(''); };
const zhColorId = (s) => { for (const [k,v] of Object.entries(COLOR_PAIRS_ID)) s = s.split(k).join(v); return s.split('').map(ch => COLOR_ID[ch] !== undefined ? COLOR_ID[ch] : ch).join(''); };

// ================= 名称翻译 =================
function nameEn(name) {
  let n = name.trim().replace(/  +/g, ' ');
  const exact = {
    '6.8寸音响': '6.8" Speaker', '15寸音响': '15" Speaker', '太阳能灯': 'Solar Light',
    '面包灯': 'Bread Light', '伸缩头灯': 'Extendable Headlamp', '熨斗': 'Handheld Iron',
  };
  if (exact[n]) return exact[n];
  let m;
  if ((m = n.match(/^(\d+(?:\.\d+)?)寸音响\s*款式([A-F])$/))) return `${m[1]}" Speaker Model ${m[2]}`;
  if ((m = n.match(/^(\d+(?:\.\d+)?)寸音响$/))) return `${m[1]}" Speaker`;
  if ((m = n.match(/^三角形音响\s*([黑绿橙白]+)色?$/))) return `Triangle Speaker ${zhColorEn(m[1])}`;
  if ((m = n.match(/^Sing-e (\S+) 风扇音箱$/))) return `Sing-e ${m[1]} Fan Speaker`;
  if ((m = n.match(/^Sing-e (\S+) 迷你音箱$/))) return `Sing-e ${m[1]} Mini Speaker`;
  if ((m = n.match(/^Sing-e (\S+) 便携式蓝牙音箱$/))) return `Sing-e ${m[1]} Portable Bluetooth Speaker`;
  if ((m = n.match(/^Sing-e (\S+) 蓝牙音箱$/))) return `Sing-e ${m[1]} Bluetooth Speaker`;
  if ((m = n.match(/^Type-C to Type-C 数据线 (\S+) (黑色|白色)$/))) return `Type-C to Type-C Cable ${m[1]} ${zhColorEn(m[2])}`;
  if ((m = n.match(/^数据线充电线(黑|紫|蓝|橙)色[（(](.+?)[）)]$/))) return `Charging Data Cable ${zhColorEn(m[1])} (${m[2]})`;
  if ((m = n.match(/^10口 USB 充电器 (\S+) Type-A (白色)$/))) return `10-Port USB Charger ${m[1]} Type-A ${zhColorEn(m[2])}`;
  if ((m = n.match(/^Type-C 充电器 (\S+) (白色)$/))) return `Type-C Charger ${m[1]} ${zhColorEn(m[2])}`;
  if ((m = n.match(/^充电头 (\S+) (.+)$/))) return `Charger ${m[1]} ${zhColorEn(m[2])}`;
  if ((m = n.match(/^(\d+)w头灯$/))) return `${m[1]}W Headlamp`;
  if ((m = n.match(/^水泵折叠单钮$/))) return 'Foldable Water Pump (Single Button)';
  if ((m = n.match(/^水泵双按钮$/))) return 'Water Pump (Dual Button)';
  if ((m = n.match(/^水泵双钮(白色)$/))) return `Water Pump (Dual Button) ${zhColorEn(m[1])}`;
  if ((m = n.match(/^水泵 (.+)$/))) return `Water Pump ${zhColorEn(m[1])}`;
  if ((m = n.match(/^纸巾盒 (.+)$/))) return `Tissue Box ${zhColorEn(m[1])}`;
  if ((m = n.match(/^头灯 (.+)$/))) return `Headlamp ${zhColorEn(m[1])}`;
  return n;
}

function nameIdFix(name_id) {
  let n = (name_id || '').trim().replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/  +/g, ' ');
  n = n.replace(/(\d+(?:\.\d+)?)\s*[Ii]nciSpeaker/g, 'Speaker $1 Inci');
  n = n.replace(/款式([A-F])/g, 'Model $1');
  n = n.replace(/Speaker Segitiga\s+([绿橙白黑]+)/g, (_, c) => 'Speaker Segitiga ' + zhColorId(c));
  n = n.replace(/(Kabel Data Charger|Charger)([黑蓝紫橙白]+)/g, (_, a, c) => a + ' ' + zhColorId(c));
  n = n.replace(/(\d+)wLampu Kepala/g, 'Lampu Kepala $1W');
  n = n.replace(/Pompa AirLipat/g, 'Pompa Air Lipat');
  n = n.replace(/Pompa AirTombol Ganda(Putih)?/g, (_, w) => 'Pompa Air Tombol Ganda' + (w ? ' Putih' : ''));
  n = n.replace(/(Speaker|Charger|Kabel|Lampu|Pompa|Setrika|Kotak) ([黑蓝紫橙白绿]+)/g, (_, a, c) => a + ' ' + zhColorId(c));
  n = n.replace(/(Charger|Speaker|Kabel|Pompa|Setrika|Kotak)(Hitam|Putih|Biru|Ungu|Oranye|Hijau|Kuning|Merah)/g, '$1 $2');
  return n;
}

// ================= 规格翻译词表 =================
const KEY_EN = {
  '材质':'Material','材料':'Material','喇叭':'Speaker','功率':'Power','电池':'Battery','功能':'Functions',
  '充电':'Charging','充电方式':'Charging','配件':'Accessories','彩盒尺寸':'Box Size','外箱尺寸':'Carton Size',
  '装箱数':'Pcs per Carton','颜色':'Color','外箱重量':'Carton Weight','蓝牙版本':'Bluetooth Version',
  '承受电流':'Max Current','输出功率':'Output Power','重量':'Weight','流量':'Flow Rate','特点':'Features',
  '适用':'Suitable for','尺寸':'Size','水箱容量':'Water Tank','温度档位':'Temperature Levels',
  '端口':'Ports','接口':'Ports','输入':'Input','输出电压':'Output Voltage','电流':'Current',
  '认证':'Certification','输入电压':'Input Voltage','线长':'Cable Length','长度':'Length','宽度':'Width',
  '高度':'Height','容量':'Capacity','速度':'Speed','模式':'Mode','档位':'Levels','电压':'Voltage',
  '充电时间':'Charging Time','使用时间':'Usage Time','灯珠':'LED Beads','亮度':'Brightness','续航':'Battery Life','电量显示':'Battery Indicator',
  '防水':'Waterproof','射程':'Beam Range','40HQ':'40HQ Load','彩盒尺寸':'Box Size','包装':'Packaging',
  '装箱规格':'Packing','净重':'Net Weight','毛重':'Gross Weight','灯光模式':'Lighting Modes',
  '防水等级':'Waterproof Rating','感应模式':'Sensor Mode','伸缩范围':'Extension Range',
};
const KEY_ID = {
  '材质':'Bahan','材料':'Bahan','喇叭':'Speaker','功率':'Daya','电池':'Baterai','功能':'Fungsi',
  '充电':'Pengisian','充电方式':'Pengisian','配件':'Aksesoris','彩盒尺寸':'Ukuran Kotak','外箱尺寸':'Ukuran Karton',
  '装箱数':'Jumlah Per Karton','颜色':'Warna','外箱重量':'Berat Karton','蓝牙版本':'Versi Bluetooth',
  '承受电流':'Arus Maks','输出功率':'Daya Output','重量':'Berat','流量':'Debit','特点':'Fitur',
  '适用':'Cocok untuk','尺寸':'Ukuran','水箱容量':'Kapasitas Air','温度档位':'Level Suhu',
  '端口':'Port','接口':'Port','输入':'Input','输出电压':'Tegangan Output','电流':'Arus',
  '认证':'Sertifikasi','线长':'Panjang Kabel','容量':'Kapasitas','充电时间':'Waktu Pengisian',
  '使用时间':'Waktu Pemakaian','灯珠':'Lampu LED','亮度':'Kecerahan','续航':'Daya Tahan','防水':'Tahan Air',
  '射程':'Jarak Sinar','档位':'Mode','电压':'Tegangan','速度':'Kecepatan','模式':'Mode','40HQ':'40HQ',
  '包装':'Kemasan','净重':'Berat Bersih','毛重':'Berat Kotor','灯光模式':'Mode Cahaya',
  '防水等级':'Tingkat Tahan Air','感应模式':'Mode Sensor','伸缩范围':'Rentang Teleskopik',
};

// 值词表：需要与相邻英文粘连的词用前导空格
const VAL_EN = {
  // 长词
  '挥手感应开关':'Motion Sensor Switch','充电宝功能':'Power Bank Function','360°旋转':'360° Rotation',
  'USB带5V升压':'USB with 5V Boost','带幻彩灯':'with RGB Light','带彩灯':'with Color Light',
  '碳仟维':'Carbon Fiber','碳纤维':'Carbon Fiber','马卡龙':'Macaron','小胖子':'Chubby','小弧':'Curved',
  '草莓':'Strawberry','钻石':'Diamond','贴片母座':'SMT Port','原母座':'Original Port','欧规外观':'EU Design',
  '欧规':' EU','带灯线':'Light-up Cable','一体麦克风':'Integrated Mic','有线麦克风':'Wired Mic',
  '带通话功能':'with Call Function','带风扇':'with Fan','照明':'Lighting','报复铝':'Aluminum-coated ',
  '无磁钢':'Non-magnetic Steel ','常规PD':'Standard PD','常规PD17':'Standard PD17','单U':'Single USB',
  '电池组':'Battery Pack','TF卡':'TF Card','Type-c座':'Type-C Port','40HQ':'40HQ Load','5V升压':'5V Boost',
  '钛银':'Titanium Silver','黄黑色':'Yellow-Black','黑白色':'Black-White','白紫色':'White-Purple',
  '黑银色':'Black-Silver','透明可视':'Transparent Window','硅胶水管':'Silicone Hose',
  '陶瓷底板':'Ceramic Soleplate','干湿两用':'Dry & Steam','量杯':'Measuring Cup','防尘设计':'Dust-proof',
  '顶部抽取':'Top Dispensing','标准纸巾':'Standard Tissue','大流量':'High Flow','自动关停':'Auto Shut-off',
  '电量显示':'Battery Indicator','多兼容':'Multi-compatible','双喇叭':'Dual Speakers',
  '铅酸电池':'Lead-acid Battery','拉杆+轮子':'Handle + Wheels','短路保护':'Short-circuit Protection',
  '过流保护':'Overcurrent Protection','过压保护':'Overvoltage Protection','过热保护':'Overheat Protection',
  '氮化镓':'GaN','快充':'Fast Charging','指示灯':'LED Indicator','幻彩灯':'RGB Light',
  '有线话筒':'Wired Mic','无线话筒':'Wireless Mic','充电线':' Charging Cable','充电适配器':'Charging Adapter',
  '说明书':'Manual','遥控器':'Remote','背带':'Shoulder Strap','卡拉OK':'Karaoke','木箱':'Wooden Box',
  '铁网':'Iron Mesh','塑胶':'Plastic','折叠':' Foldable ','伸缩':' Extendable ','手持':' Handheld ',
  '便携':' Portable ','迷你':' Mini ','双钮':'Dual Button','单钮':'Single Button','桶装水':'Gallon',
  '电动':'Electric','抽水':'Water Dispensing','太阳能':'Solar','头灯':'Headlamp','转接头':'Adapter',
  '白色':'White','黑色':'Black','棕色':'Brown','茶色':'Brown','黄色':'Yellow','蓝色':'Blue','紫色':'Purple',
  '橙色':'Orange','绿色':'Green','透明':'Transparent','咖啡色':'Coffee','全兼容':'Full-compatible',
  '扩展':'Extension','单拉':'Single Pull','渐变':'Gradient','强光':'Strong Light','弱光':'Weak Light',
  '爆闪':'Strobe','五芯':'5-core ','录音':' Recording','幻彩':' RGB','适配器':' Adapter','适配':' Adapter',
  '头带':'Headband','收纳盒':'Storage Case','收纳袋':'Storage Bag','合金':'Alloy','侧灯COB':'Side Light COB','侧灯':'Side Light',
  '数字显示':' Digital Display','输出':' Output','设计':' Design','磁吸头':'Magnetic Head','单按钮':'Single Button',
  '双按钮':'Dual Button','操作':' Operation','约':'~','外壳':' Shell','防粘涂层':'Non-stick Coating',
  '约':'~','灯':' Light',
  // 短词（前后空格防粘连）
  '蓝牙':' Bluetooth ','收音':' Radio ','遥控':' Remote ','升压':' Boost ','充电':' Charging ',
  '电池':' Battery ','麦克风':' Mic ','带':' with ','线':' Cable ','编':' braided ','铝':' Aluminum ',
  '支':' pcs ','台':' pcs ','件':' ctn ','个':' pcs ','米':' m ','寸':'"','款':' model ','档':' level ',
  '格':' Grid ','壳':' Shell ','座':' Port ','口':' port ','器':'','色':' ','数据':' Data ',
  '白':'White','黑':'Black','蓝':'Blue','紫':'Purple','橙':'Orange','绿':'Green','黄':'Yellow',
  '银':'Silver','棕':'Brown','茶':'Brown','钛':'Titanium',
};
const VAL_ID = {
  '挥手感应开关':'Sensor Gerakan','充电宝功能':'Fungsi Power Bank','360°旋转':'Rotasi 360°',
  'USB带5V升压':'USB dengan Boost 5V','带幻彩灯':'dengan Lampu RGB','带彩灯':'dengan Lampu Warna',
  '碳仟维':'Carbon Fiber','碳纤维':'Carbon Fiber','马卡龙':'Macaron','小胖子':'Gendut','小弧':'Lengkung',
  '草莓':'Strawberry','钻石':'Diamond','贴片母座':'Port SMT','原母座':'Port Original','欧规外观':'Desain EU',
  '欧规':'Standar EU','带灯线':'Kabel dengan Lampu','一体麦克风':'Mikrofon Kabel','有线麦克风':'Mikrofon Kabel',
  '带通话功能':'dengan Fungsi Panggilan','带风扇':'dengan Kipas','照明':'Penerangan','报复铝':'Aluminium Coated ',
  '无磁钢':'Baja Non-magnetik ','常规PD':'Standar PD','常规PD17':'Standar PD17','单U':'Single USB',
  '电池组':'Paket Baterai','TF卡':'Kartu TF','Type-c座':'Port Type-C','40HQ':'40HQ','5V升压':'Boost 5V',
  '钛银':'Titanium Silver','黄黑色':'Kuning-Hitam','黑白色':'Hitam-Putih','白紫色':'Putih-Ungu',
  '黑银色':'Hitam-Perak','透明可视':'Jendela Transparan','硅胶水管':'Selang Silikon',
  '陶瓷底板':'Plat Keramik','干湿两用':'Kering & Uap','量杯':'Gelas Ukur','防尘设计':'Anti Debu',
  '顶部抽取':'Ambil dari Atas','标准纸巾':'Tisu Standar','大流量':'Debit Tinggi','自动关停':'Mati Otomatis',
  '电量显示':'Indikator Baterai','多兼容':'Multi-Kompatibel','双喇叭':'Dual Speaker','铅酸电池':'Baterai Aki',
  '拉杆+轮子':'Gagang + Roda','短路保护':'Proteksi Korsleting','过流保护':'Proteksi Arus Lebih',
  '过压保护':'Proteksi Tegangan Lebih','过热保护':'Proteksi Panas Berlebih','氮化镓':'GaN',
  '快充':'Fast Charging','指示灯':'Indikator LED','幻彩灯':'Lampu RGB','有线话筒':'Mikrofon Kabel',
  '无线话筒':'Mikrofon Nirkabel','充电线':' Kabel Charger','充电适配器':'Adaptor Charger',
  '说明书':'Manual','遥控器':'Remote','背带':'Tali Punggung','卡拉OK':'Karaoke','木箱':'Kotak Kayu',
  '铁网':'Jaring Besi','塑胶':'Plastik','折叠':' Lipat ','伸缩':' Teleskopik ','手持':' Tangan ',
  '便携':' Portabel ','迷你':' Mini ','双钮':'Tombol Ganda','单钮':'Tombol Tunggal','桶装水':'Galon',
  '电动':'Elektrik','抽水':'Penyedot Air','太阳能':'Tenaga Surya','头灯':'Lampu Kepala','转接头':'Adaptor',
  '白色':'Putih','黑色':'Hitam','棕色':'Coklat','茶色':'Coklat','黄色':'Kuning','蓝色':'Biru','紫色':'Ungu',
  '橙色':'Oranye','绿色':'Hijau','透明':'Transparan','咖啡色':'Kopi','全兼容':'Full-compatible',
  '扩展':'Ekstensi','单拉':'Single Pull','渐变':'Gradasi','强光':'Cahaya Kuat','弱光':'Cahaya Lemah',
  '爆闪':'Strobe','五芯':'5-inti ','录音':' Rekam','幻彩':' RGB','适配器':' Adaptor','适配':' Adaptor',
  '头带':'Ikat Kepala','收纳盒':'Kotak Penyimpanan','收纳袋':'Kantong Penyimpanan','合金':'Paduan',
  '侧灯':'Lampu Samping','数字显示':' Tampilan Digital','输出':' Output','设计':' Desain','磁吸头':'Kepala Magnetik',
  '单按钮':'Tombol Tunggal','双按钮':'Tombol Ganda','操作':' Operasi','约':'~','外壳':' Cangkang',
  '防粘涂层':'Lapisan Anti Lengket','灯':' Lampu',
  // 短词（前后空格防粘连）
  '蓝牙':' Bluetooth ','收音':' Radio ','遥控':' Remote ','升压':' Boost ','充电':' Pengisian ',
  '电池':' Baterai ','麦克风':' Mikrofon ','带':' dengan ','线':' Kabel ','编':' braided ',
  '铝':' Aluminium ','支':' pcs ','台':' pcs ','件':' karton ','个':' pcs ','米':' m ','寸':'"',
  '款':' model ','档':' level ','格':' Grid ','壳':' Cangkang ','座':' Port ','口':' port ','器':'',
  '色':' ','数据':' Data ','白':'Putih','黑':'Hitam','蓝':'Biru','紫':'Ungu','橙':'Oranye',
  '绿':'Hijau','黄':'Kuning','银':'Perak','棕':'Coklat','茶':'Coklat','钛':'Titanium',
};

function replaceAll(val, table) {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const k of keys) val = val.split(k).join(table[k]);
  return val.replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/，/g, ',').replace(/；/g, ';').replace(/  +/g, ' ').trim();
}

// 键值配对：ZQS 系列 "键 | 值" 被 split 后成两行
function pairKV(lines, keyMap) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].trim().replace(/[：:]\s*$/, '');
    const next = i + 1 < lines.length ? lines[i + 1].trim().replace(/[：:]\s*$/, '') : null;
    if (keyMap[k] && next !== null && !keyMap[next]) { out.push(`${k}: ${next}`); i++; }
    else out.push(lines[i]);
  }
  return out;
}

function zhSpecToEn(line) {
  let l = line.trim();
  let m, key = null, val = l;
  if ((m = l.match(/^([^：:|]+)[：:]\s*(.*)$/))) { key = m[1].trim(); val = m[2].trim(); }
  else if ((m = l.match(/^([^：:|]+)\s*\|\s*(.*)$/))) { key = m[1].trim(); val = m[2].trim(); }
  const enKey = key && KEY_EN[key] ? KEY_EN[key] : (key || '');
  let enVal = replaceAll(val, VAL_EN);
  return enKey ? `${enKey}: ${enVal}` : enVal;
}

function idSpecClean(line) {
  let l = line.trim();
  let m, key = null, val = l;
  if ((m = l.match(/^([^：:|]+)[：:]\s*(.*)$/))) { key = m[1].trim(); val = m[2].trim(); }
  else if ((m = l.match(/^([^：:|]+)\s*\|\s*(.*)$/))) { key = m[1].trim(); val = m[2].trim(); }
  const idKey = key && KEY_ID[key] ? KEY_ID[key] : (key || '');
  let idVal = replaceAll(val, VAL_ID);
  idVal = idVal.replace(/48 braided/gi, '48-braided');
  return idKey ? `${idKey}: ${idVal}` : idVal;
}

function splitSpecs(s) { return (s || '').split('|').map(x => x.trim()).filter(Boolean); }

// ================= 转换 =================
const cats = C.categories.map((c, i) => ({
  id: c.id, icon: c.icon, order: i + 1,
  name: { zh: c.name, en: c.name_en, id: c.name_id },
  badge: { zh: c.badge, en: c.badge_en, id: c.badge_id },
  desc: { zh: c.desc || '', en: c.desc_en || '', id: c.desc_id || '' },
}));

const problems = { nameEn: [], nameId: [], specsId: [], specsEn: [], zeroPrice: [], zeroMoq: [] };

const products = C.products.map((p) => {
  const zhName = (p.name || '').trim();
  const enName = nameEn(zhName);
  const idName = nameIdFix(p.name_id);
  if (/[\u4e00-\u9fa5]/.test(enName)) problems.nameEn.push(p.sku + ' → ' + enName);
  if (/[\u4e00-\u9fa5]/.test(idName)) problems.nameId.push(p.sku + ' → ' + idName);

  const specsZhRaw = splitSpecs(p.specs);
  const specsZh = pairKV(specsZhRaw, KEY_EN).map(s => s.trim());
  const specsEn = specsZh.map(zhSpecToEn);
  const specsIdRaw = splitSpecs(p.specs_id);
  const idKeySet = new Set(Object.values(KEY_ID));
  const specsId = pairKV(specsIdRaw, idKeySet).map(idSpecClean);
  if (specsId.join(' ').match(/[\u4e00-\u9fa5]/)) problems.specsId.push(p.sku);
  if (specsEn.join(' ').match(/[\u4e00-\u9fa5]/)) problems.specsEn.push(p.sku);

  const price = parseInt(String(p.price || '0').replace(/[^\d]/g, ''), 10) || 0;
  if (price === 0) problems.zeroPrice.push(p.sku);
  if (!p.moq) problems.zeroMoq.push(p.sku + '(moq:' + p.moq + ')');

  const prod = {
    sku: p.sku, slug: p.sku.toLowerCase(), category: p.category,
    name: { zh: zhName, en: enName, id: idName },
    price, moq: p.moq || 0, qty: p.qty || 0, weight: p.weight || '',
    stock: (p.stock || '').toLowerCase() === 'ready' ? 'ready' : 'preorder',
    label: p.label || '',
    specs: { zh: specsZh, en: specsEn, id: specsId },
    images: [`${p.sku}.jpg`],
  };
  if (p.hasVariants && Array.isArray(p.variants)) {
    prod.variants = p.variants.map(v => ({
      sku: v.sku,
      label: { zh: v.label || '', en: v.label_en || v.label || '', id: v.label_id || v.label || '' },
      qty: v.qty || 0, weight: v.weight || '', image: `${v.img}.jpg`,
    }));
  }
  return prod;
});

const catByName = {}; C.categories.forEach(c => { catByName[c.name] = c.id; });
products.forEach(p => { p.category = catByName[p.category] || p.category; });

const hedy = products.find(p => p.sku === 'HEDY');
if (hedy) hedy.images.push('面包灯图片.jpg');

const pumpMap = {
  'PG-WHT-04B': { zh: '便携式抽水泵 黑色', en: 'Portable Water Pump Black', id: 'Pompa Air Portabel Hitam' },
  'PG-WHT-04W': { zh: '便携式抽水泵 白色', en: 'Portable Water Pump White', id: 'Pompa Air Portabel Putih' },
};
products.forEach(p => { if (pumpMap[p.sku]) p.name = pumpMap[p.sku]; });

const out = { meta: { generated: new Date().toISOString(), skuCount: products.length, categoryCount: cats.length }, categories: cats, products };
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data', 'products.json'), JSON.stringify(out, null, 1), 'utf8');

console.log('✅ data/products.json 已生成');
console.log('   产品:', products.length, '| 品类:', cats.length);
console.log('--- 问题报告 ---');
console.log('name_en 残留中文:', problems.nameEn.length, problems.nameEn.join(' | ') || '无');
console.log('name_id 残留中文:', problems.nameId.length, problems.nameId.join(' | ') || '无');
console.log('specs_id 残留中文:', problems.specsId.length, problems.specsId.join(', ') || '无');
console.log('specs_en 残留中文:', problems.specsEn.length, problems.specsEn.join(', ') || '无');
console.log('价格为0:', problems.zeroPrice.join(', ') || '无');
console.log('moq为0:', problems.zeroMoq.join(', ') || '无');
