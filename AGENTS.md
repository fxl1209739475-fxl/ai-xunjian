# AGENTS.md — 给 AI 编程助手的仓库说明

> 你（Codex / Claude Code / Cursor 等 AI 助手）在这个仓库里最常见的任务：**帮用户把环境装好、跑通示例工程、初剪他的第一条视频**。用户可能完全不懂命令行——你来动手，他来确认。

## 这个项目是什么

AI驯剪（ai-xunjian）：开源 AI 短视频剪辑系统。两个模块：

- `firstcut/` **初剪引擎**——`node firstcut/run.mjs 原片.mp4` 一条命令：剪气口 → 剪重说口误 → 提速 → 响度归一 → 转写字幕 → AI 初剪 → 出工程
- **AI 视频编辑器**（`npm run dev` → http://127.0.0.1:5178/editor.html）——AI 剪辑决定全躺在 `episodes/<工程>/timeline.json`，五轨时间轴可视化改，改完导出成片
- **动效工作台**（同服务 → http://127.0.0.1:5178/workbench.html）——剪辑方案 / 动画库（`effects/`，含语义动画库 16 种 + 丰富度扩展 6 种，`catalog.json` 为总库索引）/ 引擎参数的资产管理器，编辑器嵌在「真片编辑」tab 里

## 环境自检与安装（你的首要任务）

按顺序检查，缺什么装什么。**动手前先把"要装的清单"列给用户看一眼**；一律用官方源。

| 工具 | 检查命令 | 必需？ | 安装方法 |
|---|---|---|---|
| Node.js ≥ 20 | `node -v` | ✅ 必装 | macOS: `brew install node`；Windows: `winget install OpenJS.NodeJS.LTS`；Linux: 发行版包管理器或 nvm |
| ffmpeg | `ffmpeg -version` | ✅ 必装 | macOS: `brew install ffmpeg`；Windows: `winget install Gyan.FFmpeg`（或 `choco install ffmpeg`）；Linux: `sudo apt install ffmpeg` |
| uv | `uv --version` | 推荐（转写字幕、剪重说、字幕字体子集化都靠它） | macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh \| sh`；Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"` |
| LLM CLI | `claude --version` | 推荐（AI 初剪 / ✨AI 动效 / 🪄AI 排素材） | `npm install -g @anthropic-ai/claude-code` 后 `claude` 登录；已有其它兼容 CLI 可设 `XUNJIAN_CLAUDE` 指向它 |
| 中文字体 | 无需检查 | 自动 | macOS（冬青黑体）/ Windows（微软雅黑）系统自带自动用；Linux: `sudo apt install fonts-noto-cjk` 或设 `XUNJIAN_CJK_FONT=/path/字体.ttc` |

⚠️ Windows 装完工具后 PATH 不会立刻生效——提醒用户**重开终端**（或你重新起一个 shell）再验证。

## 装完后的验证序列（逐条跑，全绿才算完）

```bash
npm install          # 装编辑器依赖
npm run setup        # 生成示例工程（同时验证 ffmpeg + Node 链路）
npm run dev          # 起编辑器 → 让用户打开 http://127.0.0.1:5178/editor.html 看到「示例工程」
node firstcut/run.mjs 用户的原片.mp4   # 用户有素材就直接初剪第一条（没有可先跳过）
```

## 缺了某个可选工具会怎样（降级行为，别当成 bug）

| 缺什么 | 表现 |
|---|---|
| 缺 uv | 转写跳过（无字幕）、剪重说跳过、字幕字体退回系统字体——机械剪辑照常 |
| 缺 LLM CLI | AI 初剪落回"骨架工程"（无动效），编辑器里 ✨/🪄 按钮不可用——手动剪辑照常 |
| 缺 ffmpeg | 一切都跑不了，必装（脚本会明确报错） |
| 正式导出时无网络 | `npx hyperframes` 首次要联网下载渲染器，失败就重试或换网络 |

## 平台支持

- **macOS / Linux**：全功能。
- **Windows（原生）**：初剪引擎、编辑器、实时预览、AI 功能均支持；**正式导出（HyperFrames 无头渲染）在原生 Windows 属实验性**——如遇渲染问题，推荐在 WSL2 里跑本仓库（全功能等同 Linux）。

## 改代码时的约定

- 跨平台铁律：起子进程不用 `bash -lc`（Windows 没有）——用 `spawn(process.execPath, …)` 跑 node 脚本、参数数组直调 ffmpeg/uv；调 LLM CLI 走 `spawnLlm`/`runCli`（提示词经 stdin，Windows 经 shell 拉 `.cmd`）
- `timeline.json` 是唯一事实源：初剪引擎写它、编辑器读写它、渲染读它——别绕开它另立状态
- 改完初剪逻辑，用一条几十秒的测试片跑 `node firstcut/run.mjs … --no-ai` 验证全链路
