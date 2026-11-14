#!/bin/bash
# ==============================================================================
# 清敬雅和 · 微信公众号 AI 仿写与视觉排版工作台 — macOS 双击一键安装与启动器
# 适用系统：macOS (Apple Silicon M1/M2/M3/M4 & Intel)
# 使用方式：在 Mac 上双击此文件（或在终端运行 bash install-mac.command）
# ==============================================================================

set -e

cd "$(dirname "$0")"
APP_DIR="$(pwd)"

clear
echo "=================================================================="
echo "  清敬雅和 · 微信公众号 AI 仿写与视觉排版工作台 (macOS 快捷安装器)"
echo "=================================================================="
echo ""

# 1. 检测并引导安装 Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "⚠️  未检测到 Node.js 运行环境。"
  if command -v brew >/dev/null 2>&1; then
    echo "⏳ 正在通过 Homebrew 自动安装 Node.js..."
    brew install node
  else
    echo "👉 请先安装 Node.js (推荐 LTS 版本 v20+)，正在为您打开官方下载页..."
    open "https://nodejs.org/zh-cn/download/prebuilt-installer"
    echo "安装完 Node.js 后，再次双击本脚本即可自动完成！"
    read -p "按回车键退出..."
    exit 1
  fi
fi

echo "✅ 已检测到 Node.js 版本: $(node -v)"

# 2. 初始化 .env 配置文件（若不存在）
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# 可在此填入默认 Gemini API Key，也可启动后直接在网页端「API 设置」界面中随时修改与切换
GEMINI_API_KEY=""
EOF
  echo "✅ 已初始化本地 .env 配置文件（支持在网页界面直接调整 API Key 与模型）"
fi

# 3. 安装项目依赖
echo "⏳ 正在安装工作台依赖包（首次安装约需 20~40 秒）..."
npm install --no-fund --no-audit

# 4. 生成 macOS 桌面快捷启动图标
DESKTOP_SHORTCUT="$HOME/Desktop/启动-清敬雅和公众号工作台.command"
cat > "$DESKTOP_SHORTCUT" << EOF
#!/bin/bash
cd "$APP_DIR"
echo "正在启动「清敬雅和 · 公众号 AI 视觉排版工作台」..."
(sleep 2 && open "http://localhost:3000") &
npm run dev
EOF
chmod +x "$DESKTOP_SHORTCUT"
chmod +x "$APP_DIR/start-mac.command" 2>/dev/null || true

echo ""
echo "🎉 安装完成！已在您的 Mac 桌面生成快捷启动器："
echo "   👉 桌面图标：「启动-清敬雅和公众号工作台.command」"
echo "   （以后只需双击桌面图标即可直接打开工作台，并在网页右上角「API 设置」中调整密钥与模型）"
echo ""
echo "🚀 正在为您启动工作台并自动打开浏览器 (http://localhost:3000)..."
(sleep 2 && open "http://localhost:3000") &
npm run dev
