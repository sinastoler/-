#!/bin/bash
# ==============================================================================
# 一键上传至 GitHub 并自动触发 Release 快捷安装包发布脚本
# 用法：bash scripts/publish-github-release.sh https://github.com/您的用户名/仓库名.git v1.0.0
# ==============================================================================

set -e

REPO_URL="$1"
VERSION="${2:-v1.0.0}"

if [ -z "$REPO_URL" ]; then
  echo "用法: bash scripts/publish-github-release.sh <GitHub仓库地址> [版本号，默认 v1.0.0]"
  echo "示例: bash scripts/publish-github-release.sh https://github.com/yourname/wechat-oriental-studio.git v1.0.0"
  exit 1
fi

chmod +x install-mac.command start-mac.command

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git add .
git commit -m "feat: release ${VERSION} with macOS quick installer and adjustable API engine" || true
git push -u origin main --force

git tag -f "$VERSION"
git push origin "$VERSION" --force

echo ""
echo "✅ 已成功推送到 GitHub 仓库并打上标签 ${VERSION}！"
echo "🎉 GitHub Actions 正在后台自动打包 macOS Release 安装包，约 1 分钟后即可在仓库的 Releases 页面看到："
echo "   ${REPO_URL%.git}/releases"
