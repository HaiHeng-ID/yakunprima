#!/bin/bash
# deploy.sh — 安全部署脚本：构建 → 推 gh-pages（防止手动操作失误）
# 用法: bash scripts/deploy.sh ["提交说明"]
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
MSG=${1:-"deploy: $(date '+%F %H:%M')"}

echo "① 构建站点..."
node "$ROOT/build.js"

WORK=$(mktemp -d /tmp/yakun-gh-pages.XXXXXX)
trap 'git -C "$ROOT" worktree remove --force "$WORK" 2>/dev/null || true; rm -rf "$WORK"' EXIT

echo "② 准备部署工作树..."
git -C "$ROOT" worktree prune
# 释放可能残留的 gh-pages worktree
for W in $(git -C "$ROOT" worktree list --porcelain | grep '^worktree ' | cut -d' ' -f2); do
  if [ "$W" != "$ROOT" ] && git -C "$W" rev-parse --abbrev-ref HEAD 2>/dev/null | grep -q '^gh-pages$'; then
    git -C "$ROOT" worktree remove --force "$W" 2>/dev/null || true
  fi
done
git -C "$ROOT" worktree add "$WORK" gh-pages > /dev/null

echo "③ 同步构建产物..."
git -C "$WORK" rm -rq . || true
cp -r "$ROOT/public/." "$WORK"
# 域名绑定前不部署 CNAME（避免临时地址 301）；域名上线后注释此行并推送
rm -f "$WORK/CNAME"

echo "④ 提交并推送..."
git -C "$WORK" add -A
git -C "$WORK" commit -q -m "$MSG" || { echo "无变更，跳过"; exit 0; }
git -C "$WORK" push -q origin gh-pages

echo "✅ 部署完成（GitHub Pages 1-2 分钟后生效）"
