// 初剪引擎 —— 原片进，带动效的初剪工程出
// 用法: node firstcut/run.mjs <原片.mp4> [--name 工程名] [--speed 1.2] [--no-ai]
// 流程: 探测(含旋转) → 剪气口 → 提速 → 响度归一 → 转写字幕 → AI 初剪(可选) → 生成预览 → 去编辑器定剪
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FFMPEG = process.env.XUNJIAN_FFMPEG || "ffmpeg";
const FFPROBE = FFMPEG.replace(/ffmpeg(?=[^/\\]*$)/, "ffprobe");
const LLM = process.env.XUNJIAN_CLAUDE || "claude";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input || !fs.existsSync(input)) {
  console.error("用法: node firstcut/run.mjs <原片.mp4> [--name 工程名] [--speed 1.2] [--no-ai]");
  process.exit(1);
}
const getOpt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const NAME = getOpt("--name", path.basename(input).replace(/\.[^.]+$/, "").replace(/[^\w一-龥-]/g, "-"));
const SPEED = Number(getOpt("--speed", "1.2"));
const NO_AI = args.includes("--no-ai");
const EP = path.join(ROOT, "episodes", NAME);
const step = (m) => console.log("\n▸ " + m);
const run = (cmd, a, opts = {}) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 64e6, ...opts });
const die = (m) => { console.error("✗ " + m); process.exit(1); };

// ── 1. 探测（旋转元数据决定横竖）──
step("探测原片");
const probe = run(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries",
  "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", input]);
if (probe.status !== 0) die("ffprobe 失败，请确认已安装 ffmpeg");
const pj = JSON.parse(probe.stdout);
const st = pj.streams?.[0] || {};
const rot = Math.abs(Number((st.side_data_list || []).find((d) => d.rotation != null)?.rotation || 0));
const vertical = rot === 90 || rot === 270 ? st.width > st.height : st.height > st.width;
const rawDur = Number(pj.format?.duration || 0);
console.log(`  ${st.width}x${st.height} rotation=${rot} → ${vertical ? "竖屏 ✓" : "⚠️ 横屏(编辑器默认竖屏版式,建议竖屏素材)"} · ${rawDur.toFixed(1)}s`);

// ── 2. 剪气口（静音检测 → trim/concat）──
step("检测气口/无声段");
const sd = run(FFMPEG, ["-i", input, "-af", "silencedetect=noise=-38dB:d=0.6", "-f", "null", "-"]);
const log = sd.stderr || "";
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
const PAD = 0.25;
let segs = [], cur = 0;
for (let i = 0; i < starts.length; i++) {
  const s0 = Math.min(starts[i] + PAD, rawDur), e0 = Math.max((ends[i] ?? rawDur) - PAD, 0);
  if (s0 - cur > 0.2) segs.push([cur, s0]);
  cur = Math.max(cur, e0);
}
if (rawDur - cur > 0.2) segs.push([cur, rawDur]);
if (!segs.length || segs.reduce((a, [s, e]) => a + e - s, 0) < 1) { segs = [[0, rawDur]]; console.log("  几乎无有效人声分段，保留全片"); }
else console.log(`  保留 ${segs.length} 段，剪掉 ${(rawDur - segs.reduce((a, [s, e]) => a + e - s, 0)).toFixed(1)}s 气口`);

// ── 3. 剪切 + 提速 + 转码（编辑器友好的密集关键帧）──
step(`剪切并提速 ${SPEED}x`);
fs.mkdirSync(path.join(EP, "work"), { recursive: true });
fs.mkdirSync(path.join(EP, "hf/assets"), { recursive: true });
const fc = segs.map(([s, e], i) =>
  `[0:v]trim=${s}:${e},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${s}:${e},asetpts=PTS-STARTPTS[a${i}];`).join("\n")
  + segs.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${segs.length}:v=1:a=1[vc][ac];\n`
  + `[vc]setpts=PTS/${SPEED}[vf];[ac]atempo=${SPEED}[af]`;
const fcPath = path.join(EP, "work/cutfc.txt");
fs.writeFileSync(fcPath, fc);
const camName = "cam-" + NAME + ".mp4";
const cam = path.join(EP, "hf/assets", camName);
let r = run(FFMPEG, ["-y", "-v", "error", "-i", input, "-filter_complex_script", fcPath,
  "-map", "[vf]", "-map", "[af]", "-c:v", "libx264", "-crf", "18", "-preset", "fast",
  "-pix_fmt", "yuv420p", "-g", "15", "-c:a", "aac", "-b:a", "192k", cam]);
if (r.status !== 0) die("剪切失败: " + r.stderr?.slice(-300));

step("响度归一 (loudnorm 单独一步)");
const voice = path.join(EP, "work/voice-norm.wav");
r = run(FFMPEG, ["-y", "-v", "error", "-i", cam, "-vn", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", voice]);
if (r.status !== 0) die("loudnorm 失败");
const dur = Number(run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", cam]).stdout.trim());
console.log(`  成片素材 ${dur.toFixed(1)}s → ${path.relative(ROOT, cam)}`);

// ── 4. 转写字幕（uv + faster-whisper，缺环境则跳过）──
step("转写逐字字幕");
const capsPath = path.join(EP, "work/caps-full.json");
const asrIn = path.join(EP, "work/asr-in.wav");
run(FFMPEG, ["-y", "-v", "error", "-i", voice, "-ac", "1", "-ar", "16000", asrIn]);
const asr = run("uv", ["run", "--with", "faster-whisper", "python",
  path.join(ROOT, "firstcut/asr_and_caps.py"), asrIn, capsPath]);
let caps = [];
if (asr.status === 0 && fs.existsSync(capsPath)) {
  caps = JSON.parse(fs.readFileSync(capsPath, "utf8"));
  console.log("  " + (asr.stdout.trim().split("\n").pop() || `${caps.length} 行字幕`));
} else {
  fs.writeFileSync(capsPath, "[]");
  console.log("  ⚠️ 转写跳过（需要安装 uv: https://docs.astral.sh/uv/ ）——字幕可稍后在编辑器补");
}

// ── 5. 渲染器与依赖就位 ──
fs.copyFileSync(path.join(ROOT, "episodes/demo/gen.js"), path.join(EP, "gen.js"));
fs.copyFileSync(path.join(ROOT, "episodes/demo/package.json"), path.join(EP, "package.json"));
const gsap = path.join(ROOT, "episodes/demo/hf/assets/gsap.min.js");
if (fs.existsSync(gsap)) fs.copyFileSync(gsap, path.join(EP, "hf/assets/gsap.min.js"));

// ── 6. timeline：AI 初剪 或 骨架 ──
const boxes = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/timeline-template.json"), "utf8")).boxes ||
  { cam: { y: 0, h: 1920 }, chap: { y: 100 }, title: { y: 170 }, beat: { x: 76, y: 1020, w: 860 }, cap: { y: 1400 }, card: { x: 56, y: 260, w: 968, h: 470 } };
const skeleton = () => ({
  meta: { episode: NAME, name: NAME, layout: "V0-fx", title: "待定|标题|", dur: +dur.toFixed(2), durPreview: +dur.toFixed(2), cam: { full: camName, preview: camName }, capsFile: "work/caps-full.json" },
  boxes, chapters: [{ n: "01", lab: "全片", en: "ROUGH CUT", s: 0, e: +dur.toFixed(2) }], pops: [], cards: [], media: [], chipT: null,
});
let timeline = skeleton();
if (!NO_AI && caps.length) {
  step(`AI 初剪（调用 ${LLM}，约 1-2 分钟）`);
  const prompt = fs.readFileSync(path.join(ROOT, "firstcut/ai-cut-prompt.md"), "utf8")
    .replaceAll("{{DUR}}", dur.toFixed(2)).replaceAll("{{EPISODE}}", NAME).replaceAll("{{CAM}}", camName)
    .replaceAll("{{BOXES}}", JSON.stringify(boxes)).replaceAll("{{CAPTIONS}}", JSON.stringify(caps));
  const ai = run(LLM, ["-p", prompt, "--output-format", "text"], { timeout: 300000 });
  const out = ai.stdout || "";
  const j0 = out.indexOf("{"), j1 = out.lastIndexOf("}");
  try {
    const t = JSON.parse(out.slice(j0, j1 + 1));
    (t.cards || []).forEach((c, i) => { if (!c.id) c.id = "cx" + (i + 1); });
    (t.pops || []).forEach((p, i) => { if (!p.id) p.id = "p" + (i + 1); });
    t.meta = { ...skeleton().meta, ...t.meta, cam: { full: camName, preview: camName }, capsFile: "work/caps-full.json" };
    t.boxes = t.boxes || boxes;
    timeline = t;
    console.log(`  ✓ AI 初剪完成：${(t.chapters || []).length} 章节 / ${(t.pops || []).length} 弹字 / ${(t.cards || []).length} 卡片`);
  } catch {
    console.log("  ⚠️ AI 输出解析失败，落回骨架工程（编辑器里可用 ✨AI动效 逐段补）");
  }
} else if (!NO_AI) {
  console.log("  无字幕可供 AI 初剪，生成骨架工程");
}
fs.writeFileSync(path.join(EP, "timeline.json"), JSON.stringify(timeline, null, 1));

// ── 7. 生成预览页 ──
step("生成预览页");
r = run("node", ["gen.js"], { cwd: EP, env: { ...process.env, FULL: "1" } });
if (r.status !== 0) die("gen.js 失败: " + (r.stderr || r.stdout)?.slice(-300));
console.log("  " + (r.stdout || "").trim().split("\n").pop());

console.log(`\n✅ 初剪完成！接下来去定剪：
   npm run dev
   打开 http://127.0.0.1:5178/editor.html → 左上角选「${NAME}」
   （AI 剪的每个元素都在时间轴上，拖谁改谁——你说了算）`);
