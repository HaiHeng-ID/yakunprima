#!/usr/bin/env python3
"""
product-status.py — 产品上下架管理
用法:
  python3 product-status.py hide SKU1 SKU2 ...   # 下架（网站不展示）
  python3 product-status.py show SKU1 SKU2 ...   # 恢复上架
  python3 product-status.py list                 # 查看当前下架清单
"""
import json, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, '..', 'data', 'products.json')

def load():
    return json.load(open(DATA, encoding='utf-8'))

def save(d):
    json.dump(d, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

def find(d, sku):
    for p in d['products']:
        if p['sku'].lower() == sku.lower():
            return p
    return None

cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
skus = sys.argv[2:]
d = load()

if cmd == 'list':
    hid = [p['sku'] + ' | ' + p['name']['zh'] for p in d['products'] if p.get('hidden')]
    print(f'已下架 {len(hid)} 款:' if hid else '当前没有下架的产品')
    for h in hid: print('  -', h)
elif cmd in ('hide', 'show'):
    if not skus:
        print('请提供 SKU，例如: python3 product-status.py hide HEKV-881D SPHED-B'); sys.exit(1)
    done, missing = [], []
    for sku in skus:
        p = find(d, sku)
        if not p: missing.append(sku); continue
        if cmd == 'hide': p['hidden'] = True
        else: p.pop('hidden', None)
        done.append(f'{p["sku"]} ({p["name"]["zh"]})')
    save(d)
    print(f'✅ {cmd} 完成 {len(done)} 款:' if cmd == 'hide' else f'✅ 恢复上架 {len(done)} 款:')
    for x in done: print('  -', x)
    if missing: print('⚠️ 未找到:', ', '.join(missing))
else:
    print(__doc__)
