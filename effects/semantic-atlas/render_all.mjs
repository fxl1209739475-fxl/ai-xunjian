import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scenes = [
  ["01", "mask-reveal", "遮罩揭示"],
  ["02", "path-follow", "路径跟随"],
  ["03", "scale-pulse", "缩放脉冲"],
  ["04", "orbit-rotate", "轨道旋转"],
  ["05", "morph-state", "形态变换"],
  ["06", "split-merge", "分裂合并"],
  ["07", "accumulate-disperse", "聚集扩散"],
  ["08", "cascade-sequence", "级联序列"],
  ["09", "branch-converge", "分支回流"],
  ["10", "loop-feedback", "闭环循环"],
  ["11", "compare-align", "对齐比较"],
  ["12", "threshold-filter", "阈值筛选"],
  ["13", "collision-spring", "碰撞回弹"],
  ["14", "particle-field", "粒子场"],
  ["15", "camera-depth", "镜头纵深"],
  ["16", "kinetic-type", "动态文字"],
  ["17", "comic-panels", "漫画分格"],
  ["18", "speed-tunnel", "速度隧道"],
  ["19", "magnet-merge", "磁力汇聚"],
  ["20", "pressure-stack", "压力堆叠"],
  ["21", "fork-path", "路径分叉"],
  ["22", "ripple-feedback", "波纹反馈"],
  ["23", "network-cascade", "网络级联"],
  ["24", "deconstruct-rebuild", "拆解重组"]
];

const root = fileURLToPath(new URL(".", import.meta.url));
const renderDir = resolve(root, "renders");
mkdirSync(renderDir, { recursive: true });

for (const [number, id, title] of scenes) {
  const output = resolve(renderDir, `${number}-${id}.mp4`);
  if (existsSync(output) && statSync(output).size > 100_000) {
    process.stdout.write(`[skip] ${number} ${title}\n`);
    continue;
  }

  process.stdout.write(`[render] ${number} ${title}\n`);
  const result = spawnSync(
    "npx",
    [
      "hyperframes@0.6.64",
      "render",
      ".",
      "--variables",
      JSON.stringify({ sceneId: id }),
      "--strict-variables",
      "--output",
      output,
      "--fps",
      "30",
      "--quality",
      "standard",
      "--workers",
      "1",
      "--strict-all"
    ],
    { cwd: root, stdio: "inherit" }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const expected = {
  codec_name: "h264",
  width: 1080,
  height: 1920,
  pix_fmt: "yuv420p",
  r_frame_rate: "30/1",
  duration: 6
};

const manifest = scenes.map(([number, id, title]) => {
  const filename = `${number}-${id}.mp4`;
  const output = resolve(renderDir, filename);
  const raw = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_name,width,height,pix_fmt,r_frame_rate",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      output
    ],
    { encoding: "utf8" }
  );
  const probe = JSON.parse(raw);
  const stream = probe.streams[0];
  const format = probe.format;
  const actual = {
    codec_name: stream.codec_name,
    width: stream.width,
    height: stream.height,
    pix_fmt: stream.pix_fmt,
    r_frame_rate: stream.r_frame_rate,
    duration: Number(format.duration),
    size: Number(format.size)
  };
  const valid =
    actual.codec_name === expected.codec_name &&
    actual.width === expected.width &&
    actual.height === expected.height &&
    actual.pix_fmt === expected.pix_fmt &&
    actual.r_frame_rate === expected.r_frame_rate &&
    Math.abs(actual.duration - expected.duration) < 0.01;

  return { number, id, title, filename, valid, ...actual };
});

const report = {
  generatedAt: new Date().toISOString(),
  expected,
  count: manifest.length,
  validCount: manifest.filter((item) => item.valid).length,
  scenes: manifest
};

writeFileSync(
  resolve(renderDir, "index.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

if (report.validCount !== report.count) {
  process.stderr.write(`Validation failed: ${report.validCount}/${report.count}\n`);
  process.exit(1);
}

process.stdout.write(`Validated ${report.validCount}/${report.count} renders.\n`);
