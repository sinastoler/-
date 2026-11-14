import React, { useState } from 'react';
import {
  X,
  Terminal,
  Download,
  Copy,
  Check,
  Laptop,
  PackageCheck,
} from 'lucide-react';

interface MacReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const MAC_INSTALL_SCRIPT_CONTENT = `#!/bin/bash
# ==============================================================================
# 清敬雅和 · 微信公众号 AI 仿写与视觉排版工作台 — macOS 双击一键安装与启动器
# ==============================================================================
set -e
cd "$(dirname "$0")"
APP_DIR="$(pwd)"

clear
echo "=================================================================="
echo "  清敬雅和 · 微信公众号 AI 仿写与视觉排版工作台 (macOS 快捷安装器)"
echo "=================================================================="

if ! command -v node >/dev/null 2>&1; then
  echo "⚠️  未检测到 Node.js 运行环境。"
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    open "https://nodejs.org/zh-cn/download/prebuilt-installer"
    read -p "请先安装 Node.js 后再次双击本文件，按回车键退出..."
    exit 1
  fi
fi

if [ ! -f ".env" ]; then
  echo 'GEMINI_API_KEY=""' > .env
fi

echo "⏳ 正在安装依赖包..."
npm install --no-fund --no-audit

DESKTOP_SHORTCUT="$HOME/Desktop/启动-清敬雅和公众号工作台.command"
cat > "$DESKTOP_SHORTCUT" << EOF
#!/bin/bash
cd "$APP_DIR"
(sleep 2 && open "http://localhost:3000") &
npm run dev
EOF
chmod +x "$DESKTOP_SHORTCUT"

echo "🎉 安装完成！已在 Mac 桌面生成「启动-清敬雅和公众号工作台.command」"
(sleep 2 && open "http://localhost:3000") &
npm run dev
`;

export const MacReleaseModal: React.FC<MacReleaseModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [githubRepo, setGithubRepo] = useState(
    'your-username/wechat-oriental-studio'
  );
  const [releaseVersion, setReleaseVersion] = useState('v1.0.0');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanRepo =
    githubRepo
      .trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '') || 'your-username/wechat-oriental-studio';

  const publishCmd = `bash scripts/publish-github-release.sh https://github.com/${cleanRepo}.git ${releaseVersion}`;

  const oneLineMacInstallCmd = `cd ~/Desktop && curl -L -o studio.zip https://github.com/${cleanRepo}/releases/latest/download/QingJingYaHe-WeChat-Studio-macOS.zip && unzip -q -o studio.zip && cd QingJingYaHe-WeChat-Studio-macOS && chmod +x install-mac.command && ./install-mac.command`;

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify(`已复制${label}`, 'success');
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      onNotify('复制失败，请手动选中复制', 'error');
    }
  };

  const handleDownloadMacInstaller = () => {
    const blob = new Blob([MAC_INSTALL_SCRIPT_CONTENT], {
      type: 'text/x-shellscript;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install-mac.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('已下载 macOS 双击安装脚本 install-mac.command', 'success');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mac-release-modal-title"
      className="fixed inset-0 z-50 bg-[#181816]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div className="bg-[#FAF9F6] border border-[#DEDBD2] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E6E4DD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-[#181816]" />
            <h2
              id="mac-release-modal-title"
              className="text-base font-semibold text-[#181816] font-editorial"
            >
              macOS 快捷交付 & GitHub Release 自动打包中心
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭弹窗"
            className="p-1.5 text-[#78756E] hover:text-[#181816] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#262522]">
          {/* Repo Configurator */}
          <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#181816] whitespace-nowrap">
                01. 配置目标 GitHub 仓库路径（自动生成发版与 Mac 安装指令）
              </span>
              <span className="text-[#78756E] font-mono text-[11px] whitespace-nowrap">
                内置 .github/workflows/release-mac.yml
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="gh-repo-input"
                  className="block text-[11px] text-[#78756E] mb-1"
                >
                  GitHub 用户名/仓库名
                </label>
                <input
                  id="gh-repo-input"
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="例如：zhangsan/wechat-oriental-studio"
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816] focus:outline-none focus:border-[#181816]"
                />
              </div>
              <div>
                <label
                  htmlFor="gh-version-input"
                  className="block text-[11px] text-[#78756E] mb-1"
                >
                  Release 版本号
                </label>
                <input
                  id="gh-version-input"
                  type="text"
                  value={releaseVersion}
                  onChange={(e) => setReleaseVersion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816] focus:outline-none focus:border-[#181816]"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Upload to GitHub & Trigger Automatic Release */}
          <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#181816] flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#233129]" />
                02. 一键推送到 GitHub 并自动发布 Release 快捷安装包
              </span>
            </div>
            <p className="text-[#57544E] leading-relaxed">
              项目已内置全套工作流文件：<code className="font-mono text-[#181816]">install-mac.command</code>、<code className="font-mono text-[#181816]">start-mac.command</code> 以及 <code className="font-mono text-[#181816]">.github/workflows/release-mac.yml</code>。您只需通过右上角导出至 GitHub（或在本地终端执行下方一键发版命令），GitHub Actions 就会自动打包生成 <code className="font-mono text-[#181816]">QingJingYaHe-WeChat-Studio-macOS.zip</code> 并挂载到仓库的 <strong>Releases</strong> 页面。
            </p>

            <div className="p-3 bg-[#181816] text-[#F4F2EC] rounded-lg font-mono text-[11px] flex items-center justify-between gap-3">
              <code className="break-all leading-relaxed">{publishCmd}</code>
              <button
                type="button"
                onClick={() =>
                  handleCopy(publishCmd, 'publish', ' GitHub 一键发版命令')
                }
                className="px-2.5 py-1.5 bg-[#2E2D29] hover:bg-[#3F3E39] text-white rounded-md inline-flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {copiedKey === 'publish' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制发版命令</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 3: How the other person installs on their Mac */}
          <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#181816] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#233129]" />
                03. 给对方的 Mac 电脑快捷安装（发给对方即可）
              </span>
              <button
                type="button"
                onClick={handleDownloadMacInstaller}
                className="px-3 py-1.5 bg-[#F2F0EA] hover:bg-[#E5E2D9] text-[#181816] rounded-md inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 install-mac.command</span>
              </button>
            </div>

            <div className="space-y-2 text-[#57544E] leading-relaxed">
              <p>
                <strong>方式一（双击安装 · 零命令）：</strong>
                对方从您的 GitHub Release 下载解压后，直接双击文件夹里的{' '}
                <code className="font-mono text-[#181816]">
                  install-mac.command
                </code>
                ，脚本会自动配置环境并在其 <strong>Mac 桌面生成「启动-清敬雅和公众号工作台.command」图标</strong>，以后双击桌面图标即可直接打开网页并在界面中配置 API。
              </p>
              <p>
                <strong>方式二（Mac 终端一行命令全自动安装到桌面）：</strong>
                把下方命令发给对方，在 Mac「终端」粘贴回车即可全自动下载、生成桌面图标并打开工作台：
              </p>
            </div>

            <div className="p-3 bg-[#181816] text-[#F4F2EC] rounded-lg font-mono text-[11px] flex items-center justify-between gap-3">
              <code className="break-all leading-relaxed">
                {oneLineMacInstallCmd}
              </code>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    oneLineMacInstallCmd,
                    'mac-cmd',
                    ' Mac 终端一键安装命令'
                  )
                }
                className="px-2.5 py-1.5 bg-[#233129] hover:bg-[#2F4237] text-white rounded-md inline-flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {copiedKey === 'mac-cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制 Mac 安装命令</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E6E4DD] flex items-center justify-between">
          <span className="text-xs text-[#78756E]">
            提示：对方安装后可在界面左侧「API 设置」随时填入或更换自己的免费/付费 API Key
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#181816] hover:bg-[#2E2D29] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
