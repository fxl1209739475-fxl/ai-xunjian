import fs from "node:fs/promises";
import fscore from "node:fs";
import path from "node:path";
import {spawn, spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import react from "@vitejs/plugin-react";
import {defineConfig, type Plugin} from "vite";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(projectDir, "style-config.json");
// style-lab 在 episodes/douyin-fde-motion-reference/work/style-lab → episodes 根 = ../../..
const episodesRoot = process.env.XUNJIAN_EPISODES || path.resolve(projectDir, "episodes");
const FFMPEG = process.env.XUNJIAN_FFMPEG || "ffmpeg";
const IS_WIN = process.platform === "win32";
// 中文字体(字幕/动效字形子集化用):按平台取系统自带,找不到就跳过子集化退回系统字体,不阻断渲染
const HSGB = process.env.XUNJIAN_CJK_FONT || (
  process.platform === "darwin" ? "/System/Library/Fonts/Hiragino Sans GB.ttc"
  : IS_WIN ? "C:\\Windows\\Fonts\\msyh.ttc" // 微软雅黑
  : "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc");

// Windows 下 cmd.exe 参数引号
const winq = (x: string) => (/[\s&|<>^"]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x);

// 调用户的 LLM CLI:提示词一律走 stdin(跨平台安全——Windows 的 cmd.exe 塞不下多行长参数);
// npm 装的 claude 在 Windows 是 claude.cmd,新版 Node 不经 shell 拉不起来,故 win32 走 shell
const LLM_BIN = process.env.XUNJIAN_CLAUDE || "claude";
function spawnLlm(extra: string[], prompt: string) {
  const args = ["-p", ...extra, "--output-format", "text"];
  const child = IS_WIN
    ? spawn([LLM_BIN, ...args].map(winq).join(" "), {shell: true, env: {...process.env}})
    : spawn(LLM_BIN, args, {env: {...process.env}});
  child.stdin?.write(prompt);
  child.stdin?.end();
  return child;
}

// 跨平台逐条执行命令序列(替代原来的 bash -lc "a && b && c",Windows 没有 bash)
type Step = {cmd: string; args: string[]; cwd?: string; env?: NodeJS.ProcessEnv; optional?: boolean; winShell?: boolean};
function runSteps(steps: Step[], onLog: (s: string) => void, after: (ok: boolean) => void) {
  let i = 0;
  const next = () => {
    if (i >= steps.length) return after(true);
    const s = steps[i++];
    const opts = {cwd: s.cwd, env: s.env ? {...process.env, ...s.env} : process.env};
    const child = IS_WIN && s.winShell
      ? spawn([s.cmd, ...s.args].map(winq).join(" "), {...opts, shell: true})
      : spawn(s.cmd, s.args, opts);
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok || s.optional) next();
      else after(false);
    };
    child.stdout?.on("data", (d) => onLog(d.toString()));
    child.stderr?.on("data", (d) => onLog(d.toString()));
    child.on("error", (e) => { onLog(`\n✗ ${s.cmd} 启动失败: ${e}\n`); settle(false); });
    child.on("close", (code) => { if (code !== 0) onLog(`\n${s.optional ? "⚠️(可选步骤失败,继续)" : "✗"} ${s.cmd} 退出码 ${code}\n`); settle(code === 0); });
  };
  next();
}

const localConfigApi = (): Plugin => ({
  name: "local-style-config-api",
  configureServer(server) {
    server.middlewares.use("/api/config", async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      if (request.method === "GET") {
        try {
          response.end(await fs.readFile(configPath, "utf8"));
        } catch {
          response.statusCode = 404;
          response.end(JSON.stringify({error: "config-not-found"}));
        }
        return;
      }

      if (request.method === "POST") {
        const chunks: Buffer[] = [];
        request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        request.on("end", async () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            await fs.writeFile(configPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
            response.end(JSON.stringify({ok: true, path: configPath}));
          } catch (error) {
            response.statusCode = 400;
            response.end(JSON.stringify({error: String(error)}));
          }
        });
        return;
      }

      response.statusCode = 405;
      response.end(JSON.stringify({error: "method-not-allowed"}));
    });
  }
});

// ---- 真片编辑 API:episode 的 timeline.json 读写 / 视频串流 / 一键重渲 ----
type RenderState = {running: boolean; startedAt: number; exitCode: number | null; log: string; mode?: string; out?: string};
const DEFAULT_BGM = process.env.XUNJIAN_BGM || "";
const ARCHIVE_ROOT = process.env.XUNJIAN_ARCHIVE || path.join(process.cwd(), "exports");
const renderStates: Record<string, RenderState> = {};

const safeEp = (ep: string | null): string | null => {
  if (!ep || !/^[\w.-]+$/.test(ep)) return null; // 防路径穿越
  const dir = path.join(episodesRoot, ep);
  return fscore.existsSync(path.join(dir, "timeline.json")) ? dir : null;
};

const readBody = (request: any): Promise<string> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

const readBodyRaw = (request: any): Promise<Buffer> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
  });

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".wav": "audio/wav", ".m4a": "audio/mp4",
  ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json"
};

// 带 Range 的文件响应(视频/音频拖动必需)
const serveFile = (req: any, res: any, file: string) => {
  const size = fscore.statSync(file).size;
  const ext = path.extname(file).toLowerCase();
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    res.statusCode = 206;
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", String(end - start + 1));
    fscore.createReadStream(file, {start, end}).pipe(res);
  } else {
    res.setHeader("Content-Length", String(size));
    fscore.createReadStream(file).pipe(res);
  }
};

const episodeApi = (): Plugin => ({
  name: "episode-timeline-api",
  configureServer(server) {
    // 列出所有带 timeline.json 的工程
    server.middlewares.use("/api/episodes", async (_req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const out: {ep: string; name: string; dur: number}[] = [];
      for (const d of await fs.readdir(episodesRoot)) {
        try {
          const tl = JSON.parse(await fs.readFile(path.join(episodesRoot, d, "timeline.json"), "utf8"));
          out.push({ep: d, name: tl.meta?.name || d, dur: tl.meta?.dur || 0});
        } catch {/* 没有 timeline.json 的目录跳过 */}
      }
      res.end(JSON.stringify(out));
    });

    // timeline 读写
    server.middlewares.use("/api/timeline", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      const file = path.join(dir, "timeline.json");
      if (req.method === "GET") { res.end(await fs.readFile(file, "utf8")); return; }
      if (req.method === "PUT" || req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req));
          if (!payload.meta || !Array.isArray(payload.pops)) throw new Error("invalid timeline: need meta + pops[]");
          await fs.copyFile(file, file.replace(/\.json$/, ".backup.json"));
          await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
          res.end(JSON.stringify({ok: true}));
        } catch (e) { res.statusCode = 400; res.end(JSON.stringify({error: String(e)})); }
        return;
      }
      res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"}));
    });

    // 视频串流(带 Range,优先 editor-preview 其次 full)
    server.middlewares.use("/api/video", async (req, res) => {
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(); return; }
      const candidates = ["hf/renders/editor-preview.mp4", "hf/renders/full.mp4", "hf/renders/test-prev.mp4"];
      const file = candidates.map((c) => path.join(dir, c)).find((f) => fscore.existsSync(f));
      if (!file) { res.statusCode = 404; res.end(); return; }
      const size = fscore.statSync(file).size;
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        const start = m ? parseInt(m[1], 10) : 0;
        const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", String(end - start + 1));
        res.setHeader("Content-Type", "video/mp4");
        fscore.createReadStream(file, {start, end}).pipe(res);
      } else {
        res.setHeader("Content-Length", String(size));
        res.setHeader("Content-Type", "video/mp4");
        fscore.createReadStream(file).pipe(res);
      }
    });

    // 实时预览:把 episode 目录当静态站点(/live/<ep>/hf/index.html 即 gen 出来的动效页)
    server.middlewares.use("/live", (req, res, next) => {
      const u = decodeURIComponent((req.url || "").split("?")[0]);
      const seg = u.split("/").filter(Boolean);
      const dir = safeEp(seg[0] || null);
      if (!dir) { res.statusCode = 404; res.end(); return; }
      const rel = seg.slice(1).join("/");
      const file = path.resolve(dir, rel);
      if (!file.startsWith(path.resolve(dir)) || !fscore.existsSync(file) || fscore.statSync(file).isDirectory()) { res.statusCode = 404; res.end(); return; }
      serveFile(req, res, file);
    });

    // 人声(实时预览的时钟主轴)
    server.middlewares.use("/api/voice", (req, res) => {
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(); return; }
      const f = ["work/voice-norm.wav", "work/voice-full.wav", "work/voice.wav"].map((c) => path.join(dir, c)).find((x) => fscore.existsSync(x));
      if (!f) { res.statusCode = 404; res.end(); return; }
      serveFile(req, res, f);
    });

    // 秒级重新生成(只跑 node gen.js,不渲染) —— 实时预览的刷新键
    server.middlewares.use("/api/genlive", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      const child = spawn(process.execPath, ["gen.js"], {cwd: dir, env: {...process.env, FULL: "1"}});
      let log = "";
      child.stdout.on("data", (d) => { log += d.toString(); });
      child.stderr.on("data", (d) => { log += d.toString(); });
      child.on("close", (code) => res.end(JSON.stringify({ok: code === 0, log: log.slice(-500)})));
    });

    // 素材库:列出 / 上传(raw body + ?name=)
    server.middlewares.use("/api/assets", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      const assetsDir = path.join(dir, "hf/assets");
      if (req.method === "GET") {
        const out: {name: string; size: number; kind: string}[] = [];
        for (const f of await fs.readdir(assetsDir)) {
          const ext = path.extname(f).toLowerCase();
          const kind = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext) ? "image" : [".mp4", ".mov"].includes(ext) ? "video" : [".woff2", ".ttf", ".otf"].includes(ext) ? "font" : "other";
          out.push({name: f, size: fscore.statSync(path.join(assetsDir, f)).size, kind});
        }
        res.end(JSON.stringify(out));
        return;
      }
      if (req.method === "POST") {
        const name = (url.searchParams.get("name") || "").replace(/[^\w.一-龥-]/g, "_");
        if (!name || name.startsWith(".")) { res.statusCode = 400; res.end(JSON.stringify({error: "bad-name"})); return; }
        const buf = await readBodyRaw(req);
        await fs.writeFile(path.join(assetsDir, name), buf);
        res.end(JSON.stringify({ok: true, name, size: buf.length}));
        return;
      }
      res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"}));
    });

    // 特效预设包(真源在 shared-skills)
    const presetsPath = path.join(process.cwd(), "assets/effect-presets.json");
    server.middlewares.use("/api/presets", async (_req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      try { res.end(await fs.readFile(presetsPath, "utf8")); }
      catch { res.end(JSON.stringify({entrances: [], exits: [], frames: []})); }
    });

    // 收集箱:看到好效果丢进来,由 AI 复刻成预设
    const inboxDir = path.join(process.cwd(), "effects-inbox");
    server.middlewares.use("/api/inbox", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      await fs.mkdir(inboxDir, {recursive: true});
      const url = new URL(req.url || "", "http://x");
      if (req.method === "GET") {
        const items = (await fs.readdir(inboxDir)).filter((f) => !f.startsWith("."));
        res.end(JSON.stringify(items));
        return;
      }
      if (req.method === "POST") {
        const note = url.searchParams.get("note") || "";
        const name = (url.searchParams.get("name") || "").replace(/[^\w.一-龥-]/g, "_");
        if (name) {
          const buf = await readBodyRaw(req);
          await fs.writeFile(path.join(inboxDir, name), buf);
          if (note) await fs.appendFile(path.join(inboxDir, "_收集笔记.md"), `\n- **${name}**: ${note}(${new Date().toISOString().slice(0, 10)})`);
        } else if (note) {
          await fs.appendFile(path.join(inboxDir, "_收集笔记.md"), `\n- ${note}(${new Date().toISOString().slice(0, 10)})`);
        }
        res.end(JSON.stringify({ok: true}));
        return;
      }
      res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"}));
    });

    // ✨AI 语义动效:读播放头附近的口播,让 claude 挑组件类型并用原话填内容
    server.middlewares.use("/api/ai-fill", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"})); return; }
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      const t = Number(url.searchParams.get("t") || 0);
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      try {
        const tlData = JSON.parse(await fs.readFile(path.join(dir, "timeline.json"), "utf8"));
        const capsFile = path.join(dir, String(tlData.meta?.capsFile || "work/caps-full.json").replace(/\.\./g, ""));
        const caps = JSON.parse(await fs.readFile(capsFile, "utf8"));
        const win = caps.filter((c: any) => c.e > t - 6 && c.s < t + 9).map((c: any) => c.z).join("，");
        if (!win) { res.end(JSON.stringify({ok: false, error: "这个时间点附近没有口播内容"})); return; }
        const prompt = `你是短视频动效编导。视频 ${t.toFixed(1)}s 附近的口播原话是:「${win}」。
从下列组件里选一个最贴合这段话的,并把内容填好。要求:内容必须来自或忠实概括口播原话,不得编造;中文;标题/金句里用 |词| 标一个高亮关键词;文字精炼(标题≤12字,条目≤10字)。
组件清单(JSON schema):
- 要点清单 {"type":"list","tc":"cyan","title":"…","rows":[{"i":"ok","t":"…"},{"i":"x","t":"…"}]} (讲了2-3个并列要点/坑时用;正面用ok负面用x)
- 观点金句 {"type":"quote","tc":"cyan","text":"…","by":"兴龙"} (讲了一句核心观点/判断时用)
- 数字强调 {"type":"stat","num":39,"unit":"题","cap":"…"} (口播里真的出现了具体数字才用)
- 左右对比 {"type":"compare","ltitle":"…","lrows":["…"],"rtitle":"…","rrows":["…"],"winner":"right"} (讲了新旧/好坏对比时用;winner填left/right/none,胜者会延迟落版)
- 避坑警告 {"type":"alert","title":"…","text":"…"} (讲了注意事项/坑时用)
- 关键词标签 {"type":"tags","chips":["…","…","…"],"chipHl":0} (列举了几个名词/工具时用)
- 印章判词 {"type":"stamp","tc":"red","text":"被夸大","sub":"MOSTLY FALSE"} (口播对某说法下了强判断/定性时用;tc可选red/green/gold)
- 划线纠错 {"type":"strike","old":"旧说法","next":"新说法|关键词|","tc":"blue"} (口播说"不是A,是B"这种纠正句式时用)
- 逐词公式 {"type":"formula","parts":[{"t":"词1","c":"#fff"},{"t":"词2","c":"gold"},{"t":"结论词","c":"red"}]} (口播把几个因素连成一个结论时用;最后一词自动接=)
- 巨字数字 {"type":"bignum","prefix":"≈","num":750,"unit":"次","note":"一句注释","tc":"cyan"} (口播强调一个大数字时用,数字会滚动)
- 流程链 {"type":"chain","items":["步骤1","步骤2","步骤3"],"arrow":"→","chipHl":2} (口播讲先后步骤/路径时用)
- 荧光批注 {"type":"highlight","title":"…","lines":["句1","句2"],"tc":"gold"} (口播逐句强调原文/引用时用,荧光笔逐句扫亮)
- 进度条 {"type":"progress","label":"…","pct":76,"tc":"green","tags":["…"]} (口播讲成长/完成度/比例时用)
- 时间轴 {"type":"roadmap","items":["2026","2028","2030"],"chipHl":2} (口播讲时间节点/阶段时用)
- 卡片墙 {"type":"wall","items":["…","…","…","…","…","…"],"cols":3} (口播讲"需求/例子多到数不清"时用,一堆小白卡铺屏)
- 多曲线趋势 {"type":"curveplot","title":"…","labels":["现在","1年","3年","5年"],"series":[{"name":"增长","color":"cyan","values":[10,30,60,90]},{"name":"成本","color":"coral","values":[90,65,42,20]}],"note":"…"} (口播讲两条趋势、增长与下降、交叉拐点时用)
- 数据飞轮 {"type":"flywheel","title":"…","center":"AI","nodes":["采集","理解","执行","反馈","沉淀"],"cap":"…"} (口播讲闭环、循环、越用越强时用)
- 结论判定矩阵 {"type":"criteria","title":"…","rows":[{"label":"条件","note":"说明","state":"pass"},{"label":"风险","note":"说明","state":"fail"}],"verdict":"…","verdictState":"pass"} (口播讲筛选标准、能活/淘汰、满足哪些条件时用;state可pass/warn/fail)
- 证据聚焦 {"type":"evidencefocus","title":"…","source":"官方资料","focus":[{"x":8,"y":20,"w":70,"h":15,"label":"关键结论"}]} (已有原文截图且口播正在引用关键句时用;src由素材库后配,不要编造文件名)
只输出一个 JSON 对象,格式 {"card":{...}},不要解释,不要代码块围栏。`;
        const child = spawnLlm([], prompt);
        let out = "";
        let done = false;
        const timer = setTimeout(() => { if (!done) { child.kill(); res.end(JSON.stringify({ok: false, error: "AI 超时(90s)"})); done = true; } }, 90000);
        child.stdout.on("data", (d) => { out += d.toString(); });
        child.on("close", () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          try {
            const m = out.match(/\{[\s\S]*\}/);
            if (!m) throw new Error("AI 没返回 JSON: " + out.slice(0, 200));
            const j = JSON.parse(m[0]);
            const card = j.card || j;
            if (!card.type) throw new Error("缺 type");
            res.end(JSON.stringify({ok: true, card, heard: win.slice(0, 80)}));
          } catch (e) { res.end(JSON.stringify({ok: false, error: String(e)})); }
        });
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({error: String(e)})); }
    });

    // 🪄 AI 排素材:AI 亲眼看素材库里的图/视频,对照口播转写,自动决定放哪/放多久/怎么进场
    server.middlewares.use("/api/ai-media", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"})); return; }
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      try {
        const tlData = JSON.parse(await fs.readFile(path.join(dir, "timeline.json"), "utf8"));
        const durTotal = Number(tlData.meta?.dur || 0);
        const assetsDir = path.join(dir, "hf/assets");
        const IMG = [".png", ".jpg", ".jpeg", ".webp"];
        const VID = [".mp4", ".mov"];
        const files = (await fs.readdir(assetsDir)).filter((f) => {
          const e = path.extname(f).toLowerCase();
          return !/^(cam-|bgm|sfx)/i.test(f) && !f.startsWith(".") && (IMG.includes(e) || VID.includes(e));
        });
        if (!files.length) { res.end(JSON.stringify({ok: false, error: "素材库里没有可排的图片/视频(cam/bgm 不算素材)"})); return; }
        // 视频抽帧给 AI 看
        const probeDir = path.join(dir, "work/probe");
        fscore.mkdirSync(probeDir, {recursive: true});
        const descs: string[] = [];
        for (const f of files) {
          const abs = path.join(assetsDir, f);
          if (VID.includes(path.extname(f).toLowerCase())) {
            const pr = spawnSync(FFMPEG.replace("ffmpeg", "ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", abs]);
            const vd = parseFloat(pr.stdout.toString()) || 5;
            const frames: string[] = [];
            for (const pct of [0.1, 0.5, 0.9]) {
              const fp = path.join(probeDir, `${f}-${Math.round(pct * 100)}.jpg`);
              spawnSync(FFMPEG, ["-y", "-ss", String(vd * pct), "-i", abs, "-frames:v", "1", "-vf", "scale=480:-1", fp]);
              if (fscore.existsSync(fp)) frames.push(fp);
            }
            descs.push(`- 视频素材 "assets/${f}" (时长${vd.toFixed(1)}s) → 抽帧看这些: ${frames.join(" , ")}`);
          } else {
            descs.push(`- 图片素材 "assets/${f}" → 看这个文件: ${abs}`);
          }
        }
        const caps = JSON.parse(await fs.readFile(path.join(dir, String(tlData.meta?.capsFile || "work/caps-full.json").replace(/\.\./g, "")), "utf8"));
        const script = caps.map((c: any) => `${c.s.toFixed(1)}-${c.e.toFixed(1)}s ${c.z}`).join("\n");
        const busy = [...(tlData.cards || []).map((c: any) => `卡片${c.type} ${c.s}-${c.e}s 在y=${c.y ?? tlData.boxes?.card?.y ?? 1120}`), ...(tlData.media || []).map((m: any) => `已有素材 ${m.s}-${m.e}s 在y=${m.y}`)].join("; ") || "无";
        const prompt = `你是短视频素材编导。一条竖版口播视频(1080x1920,总长${durTotal}s,人脸居中大占屏),要把素材库里的图片/视频插到口播语义最贴合的时刻。

第一步:用 Read 工具逐个查看下面每个素材(视频看它的抽帧图),搞清每个素材的内容:
${descs.join("\n")}

第二步:通读口播逐字稿(带秒数):
${script}

第三步:输出排片决定。规则:
1. **只放语义相关的素材**——素材内容和口播那一刻说的事必须对得上;对不上的放进 skipped,宁缺毋滥。
2. 每个素材最多用一次;图片放3-6秒;视频放4-10秒(会静音播放)。
3. 时间选口播正说到相关内容的那几秒;不同素材时间错开;也尽量避开已占用区(${busy})或换位置。
4. 位置:横图/视频 x:90,y:230,w:900,h:560;竖图 x:290,y:230,w:500,h:750;别盖住底部字幕区(y>1350不放)。
5. entrance 从 pop/slide-left/slide-right/slide-up/zoom/drop/fade 选;frame 从 white(白卡证据)/glass/round/glow/none 选;照片类证据可加 "kenburns":true(缓推)。
只输出一个 JSON,不要解释不要围栏:
{"placements":[{"src":"assets/文件名","type":"image或video","s":秒,"e":秒,"x":..,"y":..,"w":..,"h":..,"entrance":"..","frame":"..","kenburns":false,"why":"一句匹配原因"}],"skipped":[{"src":"assets/文件名","why":"一句跳过原因"}]}`;
        const child = spawnLlm(["--allowedTools", "Read"], prompt);
        let out = "";
        let done = false;
        const timer = setTimeout(() => { if (!done) { child.kill(); res.end(JSON.stringify({ok: false, error: "AI 超时(240s)"})); done = true; } }, 240000);
        child.stdout.on("data", (d) => { out += d.toString(); });
        child.on("close", async () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          try {
            const m = out.match(/\{[\s\S]*\}/);
            if (!m) throw new Error("AI 没返回 JSON: " + out.slice(0, 300));
            const j = JSON.parse(m[0]);
            const good = (j.placements || []).filter((p: any) => p.src && fscore.existsSync(path.join(assetsDir, path.basename(p.src))) && p.e > p.s);
            for (const p of good) {
              tlData.media = tlData.media || [];
              tlData.media.push({
                s: Math.max(0, Math.round(p.s * 10) / 10),
                e: Math.min(durTotal, Math.round(p.e * 10) / 10),
                type: p.type === "video" ? "video" : "image",
                src: "assets/" + path.basename(p.src),
                x: p.x ?? 90, y: p.y ?? 230, w: p.w ?? 900, h: p.h ?? 560,
                entrance: p.entrance || "pop", exit: "fade", frame: p.frame || "white",
                ...(p.kenburns ? {kenburns: true} : {}), ...(p.scroll ? {scroll: true} : {})
              });
            }
            const file = path.join(dir, "timeline.json");
            await fs.copyFile(file, file.replace(/\.json$/, ".backup.json"));
            await fs.writeFile(file, `${JSON.stringify(tlData, null, 2)}\n`, "utf8");
            const g = spawn(process.execPath, ["gen.js"], {cwd: dir, env: {...process.env, FULL: "1"}});
            g.on("close", () => res.end(JSON.stringify({ok: true, placed: good, skipped: j.skipped || []})));
          } catch (e) { res.end(JSON.stringify({ok: false, error: String(e)})); }
        });
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({error: String(e)})); }
    });

    // 字幕读写(文件位置由 timeline.meta.capsFile 决定)
    server.middlewares.use("/api/caps", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const url = new URL(req.url || "", "http://x");
      const dir = safeEp(url.searchParams.get("ep"));
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      const tl = JSON.parse(await fs.readFile(path.join(dir, "timeline.json"), "utf8"));
      const rel = String(tl.meta?.capsFile || "work/caps-full.json").replace(/\.\./g, "");
      const file = path.join(dir, rel);
      if (req.method === "GET") { res.end(await fs.readFile(file, "utf8")); return; }
      if (req.method === "PUT" || req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req));
          if (!Array.isArray(payload)) throw new Error("caps must be an array");
          await fs.copyFile(file, file.replace(/\.json$/, ".backup.json")).catch(() => {});
          await fs.writeFile(file, JSON.stringify(payload), "utf8");
          res.end(JSON.stringify({ok: true}));
        } catch (e) { res.statusCode = 400; res.end(JSON.stringify({error: String(e)})); }
        return;
      }
      res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"}));
    });

    // 新片默认版式模板(全局,存在 2.0 skill 真源里)
    const templatePath = path.join(process.cwd(), "assets/timeline-template.json");
    server.middlewares.use("/api/template", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      if (req.method === "GET") {
        try { res.end(await fs.readFile(templatePath, "utf8")); }
        catch { res.end(JSON.stringify({})); }
        return;
      }
      if (req.method === "PUT" || req.method === "POST") {
        try {
          const payload = JSON.parse(await readBody(req));
          await fs.writeFile(templatePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
          res.end(JSON.stringify({ok: true, path: templatePath}));
        } catch (e) { res.statusCode = 400; res.end(JSON.stringify({error: String(e)})); }
        return;
      }
      res.statusCode = 405; res.end(JSON.stringify({error: "method-not-allowed"}));
    });

    // 一键重渲(gen → 字体子集 → hyperframes draft → 混人声) 后台跑,状态可查;fps=15 快查模式
    server.middlewares.use("/api/render", async (req, res) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const url = new URL(req.url || "", "http://x");
      const ep = url.searchParams.get("ep") || "";
      const fps = url.searchParams.get("fps") === "15" ? 15 : 30;
      const dir = safeEp(ep);
      if (!dir) { res.statusCode = 404; res.end(JSON.stringify({error: "episode-not-found"})); return; }
      if (req.method !== "POST") {
        // GET = 查状态
        res.end(JSON.stringify(renderStates[ep] || {running: false, exitCode: null, log: "", startedAt: 0}));
        return;
      }
      if (renderStates[ep]?.running) { res.end(JSON.stringify({ok: false, error: "already-running"})); return; }
      const mode = url.searchParams.get("mode") === "final" ? "final" : "draft";
      const st: RenderState = {running: true, startedAt: Date.now(), exitCode: null, log: "", mode};
      renderStates[ep] = st;
      const onLog = (s: string) => { st.log = (st.log + s).slice(-4000); };
      // 公共前段:重生成动效页 + 字幕字体子集化(缺字体/uv 时跳过,退回系统字体,不阻断)
      const steps: Step[] = [{cmd: process.execPath, args: ["gen.js"], cwd: dir, env: {FULL: "1"}}];
      if (fscore.existsSync(HSGB)) {
        for (const fn of ["0", "2"]) steps.push({
          cmd: "uv", args: ["run", "--with", "fonttools", "--with", "brotli", "pyftsubset", HSGB,
            `--font-number=${fn}`, "--text-file=work/glyphs.txt", "--flavor=woff2",
            `--output-file=hf/fonts/hsgb-w${fn === "0" ? "3" : "6"}.woff2`, "--no-hinting", "--desubroutinize"],
          cwd: dir, optional: true,
        });
      } else onLog(`⚠️ 未找到中文字体 ${HSGB},跳过字形子集化(可设 XUNJIAN_CJK_FONT 指向本地中文字体)\n`);
      let outFile = "";
      if (mode === "final") {
        // 正式版:standard 高清 → BGM 混音 → 兼容编码 → 归档 → 文件管理器里弹出定位
        const tlData = JSON.parse(fscore.readFileSync(path.join(dir, "timeline.json"), "utf8"));
        const name = String(tlData.meta?.name || ep).replace(/[/\\:*?"<>|]/g, "_");
        const dur = Number(tlData.meta?.dur || 0);
        const outDir = path.join(ARCHIVE_ROOT, name);
        fscore.mkdirSync(outDir, {recursive: true});
        outFile = path.join(outDir, `成片-${name}.mp4`);
        if (fscore.existsSync(outFile)) {
          const t = new Date();
          outFile = path.join(outDir, `成片-${name}-${String(t.getHours()).padStart(2, "0")}${String(t.getMinutes()).padStart(2, "0")}.mp4`);
        }
        st.out = outFile;
        const bgm = fscore.existsSync(path.join(dir, "hf/assets/bgm.m4a")) ? path.join(dir, "hf/assets/bgm.m4a") : DEFAULT_BGM;
        steps.push({cmd: "npx", args: ["hyperframes@0.6.64", "render", "-q", "standard", "-f", "30", "-o", "renders/editor-raw.mp4", "--workers", "2"], cwd: path.join(dir, "hf"), winShell: true});
        steps.push({cmd: FFMPEG, args: ["-y", "-i", "hf/renders/editor-raw.mp4", "-i", "work/voice-norm.wav", "-stream_loop", "-1", "-i", bgm,
          "-filter_complex", "[2:a]volume=0.30[bg];[1:a][bg]amix=inputs=2:duration=first:normalize=0[a]",
          "-map", "0:v", "-map", "[a]", "-t", String(dur), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
          "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", outFile], cwd: dir});
      } else {
        steps.push({cmd: "npx", args: ["hyperframes@0.6.64", "render", "-q", "draft", "-f", String(fps), "-o", "renders/editor-raw.mp4", "--workers", "2"], cwd: path.join(dir, "hf"), winShell: true});
        steps.push({cmd: FFMPEG, args: ["-y", "-i", "hf/renders/editor-raw.mp4", "-i", "work/voice-norm.wav",
          "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "hf/renders/editor-preview.mp4"], cwd: dir});
      }
      runSteps(steps, onLog, (ok) => {
        if (ok && mode === "final" && outFile) {
          try { fscore.copyFileSync(outFile, path.join(dir, "hf/renders/editor-preview.mp4")); } catch (e) { onLog("\n⚠️ 预览副本拷贝失败: " + e + "\n"); }
          // 在文件管理器里定位成片:mac 访达 / Windows 资源管理器 / Linux 打开目录(失败不影响成片)
          try {
            if (process.platform === "darwin") spawn("open", ["-R", outFile]);
            else if (IS_WIN) spawn("explorer", [`/select,${outFile}`]);
            else spawn("xdg-open", [path.dirname(outFile)]);
          } catch {}
        }
        st.running = false;
        st.exitCode = ok ? 0 : 1;
      });
      res.end(JSON.stringify({ok: true, started: true, mode, fps}));
    });
  }
});

export default defineConfig({
  plugins: [react(), localConfigApi(), episodeApi()],
  server: {
    host: "127.0.0.1"
  }
});
