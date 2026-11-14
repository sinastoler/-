# 清敬雅和 · 微信公众号 AI 仿写 + 真实感配图 + 排版导出工作台

一站式微信公众号深度图文创作与视觉排版系统（React + TypeScript + Tailwind CSS + `@google/genai`）。内置可调节 API 引擎配置与 macOS 桌面快捷安装器。

---

## 一、 给他人 Mac 电脑快捷安装指南（两种零门槛方式）

### 方式 A：GitHub Release 一键下载双击安装（推荐）
1. 在本仓库右侧 **Releases** 下载最新版 `QingJingYaHe-WeChat-Studio-macOS.zip` 并解压。
2. 双击文件夹内的 **`install-mac.command`**。
3. 脚本将自动检测环境、安装依赖，并在 **Mac 桌面生成 `启动-清敬雅和公众号工作台.command` 快捷图标**，随后自动在浏览器打开 `http://localhost:3000`。
   - *提示：若 macOS 弹窗提示安全拦截，请在「访达 (Finder)」中按住 `Control` 键点击 `install-mac.command` 选择「打开」，或在终端执行 `xattr -cr . && ./install-mac.command`。*

### 方式 B：Mac 终端一行命令极速安装
在对方的 Mac 上打开「终端 (Terminal)」，复制粘贴以下一行命令即可自动下载到桌面、生成快捷方式并启动（请将 `<OWNER>/<REPO>` 替换为您的 GitHub 仓库路径）：

```bash
cd ~/Desktop && curl -L -o studio.zip https://github.com/<OWNER>/<REPO>/releases/latest/download/QingJingYaHe-WeChat-Studio-macOS.zip && unzip -q -o studio.zip && cd QingJingYaHe-WeChat-Studio-macOS && chmod +x install-mac.command && ./install-mac.command
```

---

## 二、 在网页内随时调整 API 与模型（无需改代码）

启动应用后，点击顶部导航栏或左侧面板的 **「API 引擎设置」**，即可可视化调整：
- **API 密钥切换**：支持「使用环境变量默认密钥」或「在界面内直接输入自定义 Gemini API Key」（自动加密保存在该台 Mac 的本地浏览器存储中，支持随时从免费 Key 切换为付费 Key）。
- **API 接入地址 (Base URL)**：默认使用 Google 官方地址，也支持填入自定义反向代理地址以便国内网络直连。
- **文本模型自由切换**：支持切换 `gemini-4-hydrogen`（高速/免费层友好）、`gemini-4-argon`（深度文学推理）、`gemini-3.1-flash-lite`（极速轻量）或自定义模型名。
- **配图引擎自由切换**：支持 `gemini-3.1-flash-lite-image`、`gemini-nano-banana-2.1`、`gemini-3-pro-image`，或一键开启 **「免生图 API 消耗 · 东方美学实景图库模式」**（纯免费层 Key 亦可 100% 流畅走完图文生成与导出全流程）。
- **一键连通性测试**：内置「测试 API 连通性」按钮，实时检测当前 Key 延迟与可用状态。

---

## 三、 如何将本项目上传到您的 GitHub 并自动生成 Release

1. 在 GitHub 新建一个空仓库（例如 `https://github.com/yourname/wechat-oriental-studio.git`）。
2. 在项目根目录执行内置的一键发版脚本：
   ```bash
   bash scripts/publish-github-release.sh https://github.com/yourname/wechat-oriental-studio.git v1.0.0
   ```
3. 推送后，仓库内置的 GitHub Actions (`.github/workflows/release-mac.yml`) 会自动打包生成 `QingJingYaHe-WeChat-Studio-macOS.zip` 并挂载到 GitHub Releases 页面，直接把 Release 链接发给朋友即可在 Mac 上一键安装。
