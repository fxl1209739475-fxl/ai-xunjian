// 一键准备示例工程：生成演示视频 + 拷贝 GSAP + 首次渲染预览页
// 用法：npm run setup
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEMO = path.join(ROOT, "episodes/demo");
const FFMPEG = process.env.XUNJIAN_FFMPEG || "ffmpeg";

const step = (msg) => console.log("▸ " + msg);

// 1. 检查 ffmpeg
const ff = spawnSync(FFMPEG, ["-version"], { encoding: "utf8" });
if (ff.status !== 0) {
  console.error("✗ 找不到 ffmpeg。请先安装（macOS: brew install ffmpeg），或设置环境变量 XUNJIAN_FFMPEG 指向可执行文件。");
  process.exit(1);
}
step("ffmpeg OK");

// 2. 生成 24 秒竖屏演示视频（渐变底 + 静音音轨，代替真人口播原片）
fs.mkdirSync(path.join(DEMO, "hf/assets"), { recursive: true });
fs.mkdirSync(path.join(DEMO, "assets"), { recursive: true });
const cam = path.join(DEMO, "hf/assets/cam-demo.mp4");
if (!fs.existsSync(cam)) {
  step("生成演示视频（24s 1080x1920）…");
  const r = spawnSync(FFMPEG, [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "gradients=s=1080x1920:c0=#0b1020:c1=#14325e:n=2:speed=0.015:d=24",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-t", "24", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "15",
    "-c:a", "aac", "-shortest", cam,
  ], { stdio: "inherit" });
  if (r.status !== 0) { console.error("✗ 演示视频生成失败"); process.exit(1); }
} else {
  step("演示视频已存在，跳过");
}

// 3. 从 node_modules 拷贝 GSAP（渲染页依赖，本地加载不走 CDN）
const gsapSrc = path.join(ROOT, "node_modules/gsap/dist/gsap.min.js");
const gsapDst = path.join(DEMO, "hf/assets/gsap.min.js");
if (fs.existsSync(gsapSrc)) {
  fs.copyFileSync(gsapSrc, gsapDst);
  step("GSAP 已就位");
} else {
  console.error("✗ 未找到 node_modules/gsap，请先 npm install");
  process.exit(1);
}

// 4. 首次生成预览页（gen.js 读取 timeline.json 产出 hf/index.html）
step("首次渲染预览页…");
const g = spawnSync("node", ["gen.js"], { cwd: DEMO, env: { ...process.env, FULL: "1" }, stdio: "inherit" });
if (g.status !== 0) { console.error("✗ gen.js 执行失败"); process.exit(1); }

console.log("\n✅ 示例工程就绪！运行 npm run dev，然后打开 http://127.0.0.1:5178/editor.html");
console.log("   （中文字幕字体：编辑器保存时会尝试用本机系统字体自动子集化；未安装 uv 时回退系统字体，不影响使用）");
