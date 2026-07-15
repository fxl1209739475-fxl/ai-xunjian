import React, {useEffect, useRef, useState, useCallback} from "react";
import {createRoot} from "react-dom/client";
import "./editor.css";

type Pop = {s: number; e: number; c: string; lab: string; zh: string; x?: number; y?: number; size?: number; entrance?: string};
type CardRow = {i: string; t: string};
type Card = {id: string; s: number; e: number; type: string; tc?: string; title?: string; rows?: CardRow[]; lab?: string; big?: string; chips?: string[]; chipHl?: number; sub?: string; x?: number; y?: number; w?: number; h?: number};
type Media = {s: number; e: number; type: string; src: string; x: number; y: number; w: number; h: number; entrance?: string; exit?: string; frame?: string; tilt?: number};
type Chapter = {n: string; lab: string; s: number; e: number};
type Cap = {s: number; e: number; z: string};
type Timeline = {
  meta: {episode: string; name: string; layout: string; title: string; dur: number; durPreview: number; cam: any; capsFile: string};
  boxes: Record<string, Record<string, number>>;
  chapters: Chapter[];
  pops: Pop[];
  cards: Card[];
  media?: Media[];
  chipT?: number[];
};
type EpInfo = {ep: string; name: string; dur: number};
type Asset = {name: string; size: number; kind: string};
type Presets = {entrances: {key: string; label: string}[]; exits: {key: string; label: string}[]; frames: {key: string; label: string}[]};
type SelKind = "pop" | "card" | "chapter" | "cap" | "media";
type Sel = {kind: SelKind; i: number} | null;

const COLOR_OPTS = [
  {v: "cyan", label: "青"},
  {v: "amber", label: "琥珀"},
  {v: "coral", label: "珊瑚"},
  {v: "gold", label: "金·观点"},
  {v: "red", label: "红·警示"},
  {v: "green", label: "绿·安心"},
  {v: "blue", label: "蓝·事实"}
];
const POP_ENTRANCE = [
  {v: "pop", label: "弹出(默认)"},
  {v: "slide", label: "左滑入"},
  {v: "fade", label: "淡入"},
  {v: "glitch", label: "故障闪现"},
  {v: "drop", label: "下落弹跳"},
  {v: "flip", label: "翻转"},
  {v: "stampin", label: "盖章落定"}
];
const BOX_VIS: Record<string, {label: string; color: string; fakeH?: number}> = {
  cam: {label: "人像", color: "#5ba3ff"},
  title: {label: "标题", color: "#ffb020", fakeH: 80},
  chap: {label: "章节条", color: "#8aa0b0", fakeH: 40},
  beat: {label: "观点弹字", color: "#2ee6d6", fakeH: 190},
  cap: {label: "字幕", color: "#ff7a59", fakeH: 70},
  card: {label: "底部卡片", color: "#b58cff"}
};
const TRACKS: {kind: SelKind; label: string; color: string}[] = [
  {kind: "chapter", label: "章节", color: "#8aa0b0"},
  {kind: "pop", label: "弹字", color: "#2ee6d6"},
  {kind: "card", label: "卡片", color: "#b58cff"},
  {kind: "media", label: "插图/视频", color: "#ffb020"},
  {kind: "cap", label: "字幕", color: "#ff7a59"}
];
const r1 = (x: number) => Math.round(x * 10) / 10;
const COMP_TYPES = [
  {v: "quote", label: "💬 观点金句", cat: "文字观点"},
  {v: "stamp", label: "🔴 印章判词", cat: "文字观点"},
  {v: "strike", label: "✏️ 划线纠错", cat: "文字观点"},
  {v: "formula", label: "🧮 逐词公式", cat: "文字观点"},
  {v: "highlight", label: "🖍 荧光批注", cat: "文字观点"},
  {v: "tags", label: "🏷 关键词标签", cat: "文字观点"},
  {v: "bignum", label: "💥 巨字数字", cat: "数字数据"},
  {v: "stat", label: "🔢 计数环", cat: "数字数据"},
  {v: "dots", label: "🔵 点阵计数", cat: "数字数据"},
  {v: "line", label: "📈 增长曲线", cat: "数字数据"},
  {v: "progress", label: "🟩 进度条", cat: "数字数据"},
  {v: "list", label: "📋 要点清单", cat: "结构列表"},
  {v: "compare", label: "⚖️ 左右对比", cat: "结构列表"},
  {v: "alert", label: "⚠️ 避坑警告", cat: "结构列表"},
  {v: "chain", label: "🔗 流程链", cat: "结构列表"},
  {v: "roadmap", label: "🛣 时间轴节点", cat: "结构列表"},
  {v: "wall", label: "🧱 卡片墙", cat: "结构列表"},
  {v: "tool", label: "🧩 标签矩阵", cat: "结构列表"},
  {v: "curveplot", label: "📉 多曲线趋势", cat: "最新迭代"},
  {v: "flywheel", label: "♻️ 数据飞轮", cat: "最新迭代"},
  {v: "criteria", label: "🚦 结论判定矩阵", cat: "最新迭代"},
  {v: "evidencefocus", label: "🔎 证据聚焦", cat: "最新迭代"}
];
const COMP_CATS = ["最新迭代", "文字观点", "数字数据", "结构列表"];
// 组件迷你预览(纯CSS小样,给"图像模式"用)
const COMP_MINI: Record<string, React.ReactNode> = {
  list: <div className="pvcard"><i className="pvt" /><span className="pvrow">✓ ───</span><span className="pvrow">✓ ──</span></div>,
  quote: <div className="pvcard"><b className="pvq">“</b><i className="pvt long" /><span className="pvby">— 作者</span></div>,
  stat: <div className="pvcard pvcenter"><span className="pvring"><b>39</b></span></div>,
  compare: <div className="pvcard pvsplit"><i /><em>VS</em><i /></div>,
  alert: <div className="pvcard pvalert"><span>⚠</span><i className="pvt" /></div>,
  tags: <div className="pvcard pvtags"><span className="hl">词</span><span>词</span><span>词</span></div>,
  tool: <div className="pvcard pvtags"><span>A</span><b>+</b><span className="hl">B</span></div>,
  line: <div className="pvcard pvcenter"><svg width="52" height="26" viewBox="0 0 52 26"><polyline points="2,22 16,16 30,18 50,4" fill="none" stroke="#2ee6d6" strokeWidth="3" strokeLinecap="round" /></svg></div>,
  stamp: <div className="pvcard pvcenter"><span className="pvstamp">被夸大</span></div>,
  strike: <div className="pvcard pvcenter pvsk"><s>旧词</s><b>新词</b></div>,
  formula: <div className="pvcard pvcenter pvfm"><i>A</i>×<i>B</i>=<em>C</em></div>,
  dots: <div className="pvcard pvdots">{Array.from({length: 18}, (_, i) => <i key={i} className={i > 12 ? "r" : ""} />)}</div>,
  bignum: <div className="pvcard pvcenter"><b className="pvbn">750</b></div>,
  chain: <div className="pvcard pvcenter pvch"><span>A</span>→<span>B</span>→<span className="hl">C</span></div>,
  highlight: <div className="pvcard pvhl"><span className="on">划过的重点</span><span>普通一行</span></div>,
  wall: <div className="pvcard pvwall">{Array.from({length: 6}, (_, i) => <i key={i} />)}</div>,
  progress: <div className="pvcard pvcenter"><div className="pvpg"><i /></div></div>,
  roadmap: <div className="pvcard pvcenter pvrm"><i /><i /><i className="hl" /></div>,
  curveplot: <div className="pvcard pvcenter pvcurves"><svg width="54" height="34" viewBox="0 0 54 34"><polyline points="2,28 14,20 27,23 40,10 52,6"/><polyline className="b" points="2,8 14,14 27,12 40,22 52,25"/></svg></div>,
  flywheel: <div className="pvcard pvcenter pvfly"><i /><span>A</span><span>B</span><span>C</span><span>D</span></div>,
  criteria: <div className="pvcard pvcriteria"><span className="ok">✓ 存活</span><span className="no">× 淘汰</span><span className="ok">✓ 闭环</span></div>,
  evidencefocus: <div className="pvcard pvevidence"><i /><i /><i /><b>重点</b></div>
};
const CARD_DEFAULTS: Record<string, any> = {
  list: {tc: "cyan", title: "要点|清单|", rows: [{i: "ok", t: "第一点"}, {i: "ok", t: "第二点"}]},
  tool: {lab: "组合", big: "核心 |组合|", chips: ["A", "B", "C"], chipHl: 2, sub: "|一句结论|"},
  quote: {tc: "cyan", text: "一句|金句|放这里", by: "作者"},
  stat: {num: 39, unit: "题", cap: "配一句|说明|"},
  compare: {ltitle: "以前", lrows: ["慢", "贵"], rtitle: "现在", rrows: ["快", "省"], winner: "right"},
  alert: {title: "避坑|提醒|", text: "这里写要注意什么"},
  tags: {chips: ["关键词1", "关键词2", "关键词3"], chipHl: 0, cap: ""},
  line: {cap: "越用越|好|"},
  stamp: {tc: "red", text: "被夸大", sub: "MOSTLY FALSE"},
  strike: {old: "智能体", next: "工作流|打包|", tc: "blue", strikeAt: 1.4},
  formula: {parts: [{t: "极小数", c: "#fff"}, {t: "最坏假设", c: "gold"}, {t: "全人类", c: "coral"}, {t: "恐怖大数", c: "red"}]},
  dots: {label: "100万 |TOKEN|", count: 100, tc: "cyan", flipTc: "red"},
  bignum: {prefix: "≈", num: 750, unit: "次", note: "才追平一瓶可乐", tc: "cyan"},
  chain: {items: ["一人跑通", "批量定制", "再扩团队"], arrow: "→", chipHl: 2},
  highlight: {title: "划|重点|", lines: ["第一句重点内容", "第二句重点内容"], tc: "gold"},
  wall: {items: ["需求 A", "需求 B", "需求 C", "需求 D", "需求 E", "需求 F"], cols: 3},
  progress: {label: "样本库 ↑ 越用越|准|", pct: 76, tc: "green", tags: ["自主学习", "数据迭代"]},
  roadmap: {items: ["2026", "2028", "2030"], chipHl: 2},
  curveplot: {kicker: "NEXT 5 YEARS", title: "趋势正在|分化|", labels: ["现在", "1年", "3年", "5年"], series: [{name: "能力", color: "cyan", values: [18, 35, 64, 92]}, {name: "成本", color: "coral", values: [82, 63, 41, 24]}], note: "拐点比结果更重要"},
  flywheel: {kicker: "DATA FLYWHEEL", title: "数据|越用越强|", center: "AI", centerSub: "持续进化", nodes: ["采集", "理解", "执行", "反馈", "沉淀"], cap: "每一轮都形成新的|护城河|"},
  criteria: {kicker: "DECISION FILTER", title: "什么样的应用|能活下来|", rows: [{label: "有真数据", note: "持续更新", state: "pass"}, {label: "有权限", note: "能做动作", state: "pass"}, {label: "只套壳", note: "随时替代", state: "fail"}, {label: "无闭环", note: "越用不变", state: "warn"}], verdict: "满足 3 条再投入", verdictState: "pass"},
  evidencefocus: {kicker: "SOURCE", title: "原文证据|逐段聚焦|", src: "", source: "官方资料 / 原文截图", focus: [{x: 8, y: 20, w: 70, h: 15, label: "关键结论"}, {x: 18, y: 58, w: 72, h: 13, label: "数据口径"}]}
};
const lsNum = (k: string, d: number) => { const v = +(localStorage.getItem(k) || ""); return isNaN(v) || !v ? d : v; };

function App() {
  const [tab, setTab] = useState<"edit" | "style">("edit");
  const [eps, setEps] = useState<EpInfo[]>([]);
  const [ep, setEp] = useState<string>("");
  const [tl, setTl] = useState<Timeline | null>(null);
  const [caps, setCaps] = useState<Cap[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [presets, setPresets] = useState<Presets>({entrances: [], exits: [], frames: []});
  const [inbox, setInbox] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [capsDirty, setCapsDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [fpsMode, setFpsMode] = useState("30");
  const [previewMode, setPreviewMode] = useState<"live" | "film">("live");
  const [liveKey, setLiveKey] = useState(1);
  const [filmKey, setFilmKey] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [showBoxes, setShowBoxes] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [inboxNote, setInboxNote] = useState("");
  const [libPreview, setLibPreview] = useState(() => localStorage.getItem("ed.libPreview") === "1");
  useEffect(() => { localStorage.setItem("ed.libPreview", libPreview ? "1" : "0"); }, [libPreview]);
  // 可调布局:时间轴缩放(⌘滚轮)/左栏宽/时间轴高,都记住偏好
  const [pps, setPps] = useState(() => lsNum("ed.pps", 22));
  const [leftW, setLeftW] = useState(() => lsNum("ed.leftW", 270));
  const [tlH, setTlH] = useState(() => lsNum("ed.tlH", 205));
  const [centerW, setCenterW] = useState(() => lsNum("ed.centerW", 380));
  // 预览自适应:测量预览容器实际宽高,宽/高哪个先到顶就按哪个缩,保证视频完整可见
  const pvRef = useRef<HTMLDivElement>(null);
  const [pvSize, setPvSize] = useState({w: 346, h: 640});
  useEffect(() => {
    const el = pvRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPvSize({w: el.clientWidth, h: el.clientHeight}));
    ro.observe(el);
    setPvSize({w: el.clientWidth, h: el.clientHeight});
    return () => ro.disconnect();
  }, [tab, tl !== null]);
  const videoW = Math.max(180, Math.min(pvSize.w - 6, (pvSize.h - 6) * 1080 / 1920, 640));
  const scale = videoW / 1080;
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { localStorage.setItem("ed.centerW", String(centerW)); }, [centerW]);
  const ppsRef = useRef(pps);
  useEffect(() => { ppsRef.current = pps; localStorage.setItem("ed.pps", String(pps)); }, [pps]);
  useEffect(() => { localStorage.setItem("ed.leftW", String(leftW)); }, [leftW]);
  useEffect(() => { localStorage.setItem("ed.tlH", String(tlH)); }, [tlH]);
  const trackH = Math.max(24, Math.min(56, Math.floor((tlH - 62) / 5)));

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const playheadRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const sliderDragRef = useRef(false);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<any>(null);
  const tlRef = useRef<Timeline | null>(null);
  const capsRef = useRef<Cap[] | null>(null);
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const saveTimerRef = useRef<any>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const undoRef = useRef<{tl: Timeline | null; caps: Cap[] | null}[]>([]);
  const redoRef = useRef<{tl: Timeline | null; caps: Cap[] | null}[]>([]);

  const dur = tl?.meta.dur || 0;
  const tickStep = pps >= 45 ? 1 : pps >= 14 ? 5 : 10;
  useEffect(() => { tlRef.current = tl; }, [tl]);
  useEffect(() => { capsRef.current = caps; }, [caps]);

  // ⌘/Ctrl+滚轮(含触控板捏合)缩放时间轴,以鼠标位置为锚点
  const tlScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tlScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const old = ppsRef.current;
      const next = Math.max(6, Math.min(90, old * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (Math.abs(next - old) < 0.01) return;
      const rect = el.getBoundingClientRect();
      const cursor = e.clientX - rect.left;
      const tAt = (el.scrollLeft + cursor - 60) / old;
      setPps(next);
      requestAnimationFrame(() => { el.scrollLeft = Math.max(0, tAt * next + 60 - cursor); });
    };
    el.addEventListener("wheel", onWheel, {passive: false});
    return () => el.removeEventListener("wheel", onWheel);
  }, [tab, tl !== null]);
  useEffect(() => { if (playheadRef.current) playheadRef.current.style.transform = `translateX(${timeRef.current * pps}px)`; }, [pps]);

  // 分界线拖拽(左栏宽 / 时间轴高)
  const onDivDown = (kind: "v" | "h" | "v2", e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {divider: kind, x0: e.clientX, y0: e.clientY, w0: leftW, h0: tlH, c0: centerW};
  };
  const onDivMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.divider) return;
    if (d.divider === "v") setLeftW(Math.max(170, Math.min(480, d.w0 + (e.clientX - d.x0))));
    else if (d.divider === "v2") setCenterW(Math.max(280, Math.min(680, d.c0 + (e.clientX - d.x0))));
    else setTlH(Math.max(130, Math.min(480, d.h0 + (d.y0 - e.clientY))));
  };

  // ---------- 数据 ----------
  useEffect(() => {
    fetch("/api/episodes").then((r) => r.json()).then((list: EpInfo[]) => {
      setEps(list);
      if (list.length) setEp((cur) => cur || list[0].ep);
    });
    fetch("/api/presets").then((r) => r.json()).then(setPresets).catch(() => {});
    fetch("/api/inbox").then((r) => r.json()).then(setInbox).catch(() => {});
  }, []);

  const loadAssets = useCallback(() => {
    if (!ep) return;
    fetch(`/api/assets?ep=${ep}`).then((r) => r.json()).then((a) => setAssets(Array.isArray(a) ? a : [])).catch(() => setAssets([]));
  }, [ep]);

  useEffect(() => {
    if (!ep) return;
    fetch(`/api/timeline?ep=${ep}`).then((r) => r.json()).then((data) => { setTl(data); setDirty(false); setSel(null); });
    fetch(`/api/caps?ep=${ep}`).then((r) => r.json()).then((data) => { setCaps(Array.isArray(data) ? data : null); setCapsDirty(false); }).catch(() => setCaps(null));
    loadAssets();
  }, [ep, loadAssets]);

  // 撤销快照(Cmd+Z);拖动过程中每次 move 都 patch,只在"新一轮操作"时压栈
  const snapUndo = useCallback(() => {
    const last = undoRef.current[undoRef.current.length - 1];
    const cur = JSON.stringify({t: tlRef.current, c: capsRef.current});
    if (last && JSON.stringify({t: last.tl, c: last.caps}) === cur) return;
    undoRef.current.push({tl: JSON.parse(JSON.stringify(tlRef.current)), caps: capsRef.current ? JSON.parse(JSON.stringify(capsRef.current)) : null});
    if (undoRef.current.length > 30) undoRef.current.shift();
    redoRef.current = [];
  }, []);

  const patch = useCallback((fn: (t: Timeline) => void) => {
    if (!dragRef.current) snapUndo();
    setTl((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Timeline;
      fn(next);
      return next;
    });
    setDirty(true);
    scheduleAutosave();
  }, []);
  const patchCaps = useCallback((fn: (c: Cap[]) => void) => {
    if (!dragRef.current) snapUndo();
    setCaps((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Cap[];
      fn(next);
      return next;
    });
    setCapsDirty(true);
    scheduleAutosave();
  }, []);

  const undo = useCallback(() => {
    const snap = undoRef.current.pop();
    if (!snap) { setMsg("没有可撤销的了"); return; }
    redoRef.current.push({tl: JSON.parse(JSON.stringify(tlRef.current)), caps: capsRef.current ? JSON.parse(JSON.stringify(capsRef.current)) : null});
    if (snap.tl) setTl(snap.tl);
    if (snap.caps) setCaps(snap.caps);
    setDirty(true); setCapsDirty(true);
    scheduleAutosave();
    setMsg("↩︎ 已撤销");
  }, []);
  const redo = useCallback(() => {
    const snap = redoRef.current.pop();
    if (!snap) { setMsg("没有可重做的了"); return; }
    undoRef.current.push({tl: JSON.parse(JSON.stringify(tlRef.current)), caps: capsRef.current ? JSON.parse(JSON.stringify(capsRef.current)) : null});
    if (snap.tl) setTl(snap.tl);
    if (snap.caps) setCaps(snap.caps);
    setDirty(true); setCapsDirty(true);
    scheduleAutosave();
    setMsg("↪︎ 已重做");
  }, []);

  // ---------- 实时预览引擎 ----------
  const ifWin = () => iframeRef.current?.contentWindow as any;
  const syncFrame = useCallback(() => {
    const a = audioRef.current; const w = ifWin();
    if (!a || !w) return;
    const t = Math.min(a.currentTime, dur || 9999);
    timeRef.current = t;
    try {
      const gtl = w.__timelines?.main;
      if (gtl) { gtl.pause(); gtl.time(t); }
      const cam = w.document?.getElementById("cam") as HTMLVideoElement | null;
      if (cam && Math.abs(cam.currentTime - t) > 0.18) cam.currentTime = t;
    } catch {}
    if (playheadRef.current) playheadRef.current.style.transform = `translateX(${t * ppsRef.current}px)`;
    if (timeLabelRef.current) {
      const f = (x: number) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, "0")}`;
      timeLabelRef.current.textContent = `${f(t)} / ${f(tlRef.current?.meta.dur || 0)}`;
    }
    // 进度条跟随播放(只在用户按住拖动的瞬间不抢)
    if (sliderRef.current && !sliderDragRef.current) sliderRef.current.value = String(t);
  }, [dur]);

  const loop = useCallback(() => {
    syncFrame();
    const a = audioRef.current;
    if (a && !a.paused) rafRef.current = requestAnimationFrame(loop);
  }, [syncFrame]);

  const play = useCallback(() => {
    const a = audioRef.current; const w = ifWin();
    if (!a) return;
    if (a.currentTime >= (tlRef.current?.meta.dur || 0) - 0.05) a.currentTime = 0;
    a.play();
    try { (w?.document?.getElementById("cam") as HTMLVideoElement | null)?.play(); } catch {}
    setPlaying(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);
  const pause = useCallback(() => {
    audioRef.current?.pause();
    try { (ifWin()?.document?.getElementById("cam") as HTMLVideoElement | null)?.pause(); } catch {}
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);
  const seek = useCallback((t: number) => {
    const d = tlRef.current?.meta.dur || 0;
    const a = audioRef.current;
    const tt = Math.max(0, Math.min(t, d));
    if (a) a.currentTime = tt;
    try {
      const cam = ifWin()?.document?.getElementById("cam") as HTMLVideoElement | null;
      if (cam) cam.currentTime = tt;
    } catch {}
    syncFrame();
    if (filmRef.current) filmRef.current.currentTime = tt;
  }, [syncFrame]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  });

  // ---------- 快捷键(剪映式):空格播放/暂停 · Delete删除选中 · ←→微移(Shift=1s) ----------
  const deleteSel = useCallback(() => {
    setSel((cur) => {
      if (!cur) return cur;
      if (cur.kind === "pop") patch((t) => { t.pops.splice(cur.i, 1); });
      else if (cur.kind === "media") patch((t) => { t.media?.splice(cur.i, 1); });
      else if (cur.kind === "card") patch((t) => { t.cards.splice(cur.i, 1); });
      else if (cur.kind === "cap") patchCaps((c) => { c.splice(cur.i, 1); });
      else return cur; // 章节不给键删
      return null;
    });
  }, [patch, patchCaps]);

  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        playing ? pause() : play();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (sel) { e.preventDefault(); deleteSel(); }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); seek(timeRef.current - (e.shiftKey ? 1 : 0.1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault(); seek(timeRef.current + (e.shiftKey ? 1 : 0.1));
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
  }, [playing, sel, pause, play, seek, deleteSel, undo, redo]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // iframe 加载后:恢复播放头 + 画面直选 + 快捷键透传
  const onIframeLoad = () => {
    setTimeout(() => {
      seek(timeRef.current);
      let doc: Document | null = null;
      try { doc = iframeRef.current?.contentDocument || null; } catch {}
      if (!doc) return;
      doc.addEventListener("click", (e: any) => {
        const el = (e.target as HTMLElement).closest?.(".beat,.fcard,.cap,.mframe");
        if (!el) return;
        const id = el.id || "";
        if (id.startsWith("pop")) setSel({kind: "pop", i: +id.slice(3)});
        else if (id.startsWith("cap-")) setSel({kind: "cap", i: +id.slice(4)});
        else if (id.startsWith("md")) setSel({kind: "media", i: +id.slice(2)});
        else setSel({kind: "card", i: (tlRef.current?.cards || []).findIndex((c) => c.id === id)});
      });
      doc.addEventListener("keydown", (e: any) => keyRef.current(e));
    }, 120);
  };

  // ---------- 自动保存(改完≈1秒自动写盘+刷新实时预览,像剪映一样没有"保存"心智) ----------
  const epRef = useRef("");
  useEffect(() => { epRef.current = ep; clearTimeout(saveTimerRef.current); }, [ep]);

  const doAutoSave = useCallback(async () => {
    if (savingRef.current) { pendingRef.current = true; return; }
    const t = tlRef.current;
    if (!t) return;
    savingRef.current = true;
    try {
      const r = await fetch(`/api/timeline?ep=${epRef.current}`, {method: "PUT", body: JSON.stringify(t)}).then((x) => x.json()).catch(() => ({ok: false}));
      let ok = r.ok;
      if (capsRef.current) {
        const r2 = await fetch(`/api/caps?ep=${epRef.current}`, {method: "PUT", body: JSON.stringify(capsRef.current)}).then((x) => x.json()).catch(() => ({ok: false}));
        ok = ok && r2.ok;
      }
      if (ok) {
        setDirty(false); setCapsDirty(false);
        const g = await fetch(`/api/genlive?ep=${epRef.current}`, {method: "POST"}).then((x) => x.json()).catch(() => ({ok: false}));
        if (g.ok) { setLiveKey((k) => k + 1); setErr(false); setMsg("✓ 已自动保存 · 预览已刷新"); }
        else { setErr(true); setMsg("已保存但预览生成失败:\n" + (g.log || "")); }
      } else { setErr(true); setMsg("自动保存失败"); }
    } finally {
      savingRef.current = false;
      if (pendingRef.current) { pendingRef.current = false; doAutoSave(); }
    }
  }, []);
  const scheduleAutosave = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doAutoSave, 900);
  }, [doAutoSave]);

  const save = async (_silent = false) => {
    clearTimeout(saveTimerRef.current);
    await doAutoSave();
    return true;
  };
  const saveTemplate = async () => {
    if (!tl) return;
    const j = await fetch(`/api/template`, {method: "PUT", body: JSON.stringify({from: ep, boxes: tl.boxes})}).then((r) => r.json());
    setErr(!j.ok);
    setMsg(j.ok ? "✓ 已存为新片默认版式" : "存模板失败: " + j.error);
  };
  const render = async () => {
    if (dirty || capsDirty) await save(true);
    const q = fpsMode === "final" ? "mode=final" : `fps=${fpsMode}`;
    const j = await fetch(`/api/render?ep=${ep}&${q}`, {method: "POST"}).then((r) => r.json());
    if (!j.ok) { setErr(true); setMsg("渲染没启动: " + (j.error || "")); return; }
    setRendering(true); setErr(false);
    setMsg(fpsMode === "final" ? "⏳ 正式版渲染中…高清+BGM,约 3-4 分钟,完成后自动在访达弹出" : fpsMode === "15" ? "⏳ 快查渲染中…约 1 分钟" : "⏳ 草稿渲染中…约 2 分钟");
  };
  useEffect(() => {
    if (!rendering) return;
    const t = setInterval(async () => {
      const st = await fetch(`/api/render?ep=${ep}`).then((r) => r.json());
      if (!st.running) {
        clearInterval(t);
        setRendering(false);
        if (st.exitCode === 0) {
          setErr(false);
          setMsg(st.mode === "final" ? "✅ 正式版已导出并归档:\n" + (st.out || "") + "\n(访达已弹出,可直接发布)" : "✅ 草稿成片渲染完成");
          setFilmKey((k) => k + 1); setPreviewMode("film");
        }
        else { setErr(true); setMsg("❌ 渲染失败\n" + (st.log || "").slice(-600)); }
      }
    }, 3000);
    return () => clearInterval(t);
  }, [rendering, ep]);

  // ---------- 时间轴 ----------
  const itemsOf = (kind: SelKind): {s: number; e: number; label: string}[] => {
    if (!tl) return [];
    if (kind === "pop") return tl.pops.map((p) => ({s: p.s, e: p.e, label: p.zh.replace(/\|/g, "")}));
    if (kind === "card") return tl.cards.map((c: any) => ({s: c.s, e: c.e, label: (c.title || c.big || c.text || c.cap || c.ltitle || c.type || c.id).replace?.(/\|/g, "") || c.id}));
    if (kind === "chapter") return tl.chapters.map((c) => ({s: c.s, e: c.e, label: c.n + " " + c.lab}));
    if (kind === "media") return (tl.media || []).map((m) => ({s: m.s, e: m.e, label: (m.type === "video" ? "🎞 " : "🖼 ") + m.src.split("/").pop()}));
    if (kind === "cap") return (caps || []).map((c) => ({s: c.s, e: c.e, label: c.z}));
    return [];
  };
  const setItemTime = (kind: SelKind, i: number, s: number, e: number) => {
    s = r1(Math.max(0, s)); e = r1(Math.min(dur, Math.max(s + 0.3, e)));
    if (kind === "cap") { patchCaps((c) => { c[i].s = s; c[i].e = e; }); return; }
    patch((t) => {
      const arr: any = kind === "pop" ? t.pops : kind === "card" ? t.cards : kind === "chapter" ? t.chapters : t.media;
      if (arr && arr[i]) { arr[i].s = s; arr[i].e = e; }
    });
  };
  const onBlockDown = (kind: SelKind, i: number, mode: "move" | "resize" | "resize-l", e: React.PointerEvent) => {
    e.stopPropagation();
    snapUndo(); // 一轮拖动只留一个撤销点
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const it = itemsOf(kind)[i];
    dragRef.current = {kind, i, mode, x0: e.clientX, s0: it.s, e0: it.e, moved: false};
  };
  const onBlockMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.box) return;
    const dt = (e.clientX - d.x0) / ppsRef.current;
    if (Math.abs(e.clientX - d.x0) > 3) d.moved = true;
    if (!d.moved) return;
    if (d.mode === "move") setItemTime(d.kind, d.i, d.s0 + dt, d.e0 + dt);
    else if (d.mode === "resize-l") setItemTime(d.kind, d.i, Math.min(d.s0 + dt, d.e0 - 0.3), d.e0);
    else setItemTime(d.kind, d.i, d.s0, d.e0 + dt);
  };
  const onBlockUp = (kind: SelKind, i: number) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) { setSel({kind, i}); seek(itemsOf(kind)[i]?.s ?? 0); }
  };

  // ---------- 素材 / 添加 ----------
  const uploadFiles = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      await fetch(`/api/assets?ep=${ep}&name=${encodeURIComponent(f.name)}`, {method: "POST", body: f});
    }
    loadAssets();
    setMsg(`✓ 已入库 ${files.length} 个素材`);
  };
  const insertMedia = (a: Asset) => {
    const t = r1(timeRef.current);
    const n = tl?.media?.length || 0;
    patch((x) => {
      x.media = x.media || [];
      x.media.push({s: t, e: r1(Math.min(dur, t + 4)), type: a.kind === "video" ? "video" : "image", src: `assets/${a.name}`, x: 90, y: 1150, w: 900, h: 520, entrance: "pop", exit: "fade", frame: "glass"});
    });
    setSel({kind: "media", i: n});
    seek(Math.min(t + 0.6, dur));
    setMsg("✓ 已插入 · 1 秒后预览里就能看到它");
  };
  const newCardId = () => {
    let k = 1;
    while ((tl?.cards || []).some((c) => c.id === "cx" + k)) k++;
    return "cx" + k;
  };
  const addCard = (type: string, content?: any) => {
    const t = r1(timeRef.current);
    const n = tl?.cards.length || 0;
    const id = newCardId();
    patch((x) => x.cards.push({id, s: t, e: r1(Math.min(dur, t + 6)), ...(content || CARD_DEFAULTS[type] || {}), type}));
    setSel({kind: "card", i: n});
  };
  const [aiBusy, setAiBusy] = useState(false);
  const aiFill = async () => {
    const t = r1(timeRef.current);
    setAiBusy(true); setErr(false);
    setMsg("🤖 AI 正在听 " + t + "s 附近的口播,挑动效+填内容…(约10-30秒)");
    try {
      const j = await fetch(`/api/ai-fill?ep=${ep}&t=${t}`, {method: "POST"}).then((r) => r.json());
      if (!j.ok) { setErr(true); setMsg("AI 动效失败: " + (j.error || "")); return; }
      const {type, ...content} = j.card;
      addCard(type, content);
      setMsg(`✨ AI 听到「${j.heard}…」→ 插入了「${COMP_TYPES.find((c) => c.v === type)?.label || type}」,右栏可微调`);
    } finally { setAiBusy(false); }
  };
  const addPop = () => {
    const t = r1(timeRef.current);
    const n = tl?.pops.length || 0;
    patch((x) => x.pops.push({s: t, e: r1(Math.min(dur, t + 4)), c: "cyan", lab: "新标签", zh: "新弹字，|关键词|"}));
    setSel({kind: "pop", i: n});
  };
  const addCap = () => {
    if (!caps) return;
    const t = r1(timeRef.current);
    patchCaps((c) => { c.push({s: t, e: r1(Math.min(dur, t + 2)), z: "新字幕"}); c.sort((a, b) => a.s - b.s); });
  };
  const sendInbox = async (files?: FileList) => {
    if (files && files.length) {
      for (const f of Array.from(files)) {
        await fetch(`/api/inbox?name=${encodeURIComponent(f.name)}&note=${encodeURIComponent(inboxNote)}`, {method: "POST", body: f});
      }
    } else if (inboxNote.trim()) {
      await fetch(`/api/inbox?note=${encodeURIComponent(inboxNote)}`, {method: "POST"});
    }
    setInboxNote("");
    fetch("/api/inbox").then((r) => r.json()).then(setInbox);
    setMsg("✓ 已进收集箱——叫 Claude/Codex「把收集箱里的效果复刻成预设」即可");
  };

  // ---------- 选中面板 ----------
  const num = (v: number | undefined, on: (n: number) => void, ph = "-") => (
    <input type="number" step={0.1} placeholder={ph} value={v ?? ""} onChange={(e) => on(+e.target.value)} />
  );
  const selPanel = () => {
    if (!tl || !sel) return <div className="hint">点<b>画面里的元素</b>或<b>时间轴色块</b>选中后,这里出参数。<br/><br/>⌨️ 快捷键:空格=播放/暂停 · Delete=删除选中 · ←→=±0.1s(Shift=±1s)</div>;
    const del = (fn: () => void) => <button className="danger" onClick={() => { fn(); setSel(null); }}>🗑 删除</button>;
    if (sel.kind === "pop") {
      const p = tl.pops[sel.i];
      if (!p) return null;
      return (
        <div className="selbody">
          <div className="bar"><b style={{color: "#2ee6d6"}}>观点弹字 #{sel.i + 1}</b>{del(() => patch((t) => { t.pops.splice(sel.i, 1); }))}</div>
          <div className="bar"><label>开始</label>{num(p.s, (n) => patch((t) => { t.pops[sel.i].s = n; }))}<label>结束</label>{num(p.e, (n) => patch((t) => { t.pops[sel.i].e = n; }))}</div>
          <div className="bar"><label>颜色</label><select value={p.c} onChange={(e) => patch((t) => { t.pops[sel.i].c = e.target.value; })}>{COLOR_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
            <label>入场</label><select value={p.entrance ?? "pop"} onChange={(e) => patch((t) => { t.pops[sel.i].entrance = e.target.value; })}>{POP_ENTRANCE.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></div>
          <div className="bar"><label>小标签</label><input style={{width: 170}} value={p.lab} onChange={(e) => patch((t) => { t.pops[sel.i].lab = e.target.value; })} /></div>
          <div className="bar"><label>大字</label><input style={{width: 240}} value={p.zh} onChange={(e) => patch((t) => { t.pops[sel.i].zh = e.target.value; })} /></div>
          <div className="hint">|词|=放大变色关键词</div>
          <div className="bar"><label>x</label>{num(p.x, (n) => patch((t) => { t.pops[sel.i].x = n; }))}<label>y</label>{num(p.y, (n) => patch((t) => { t.pops[sel.i].y = n; }))}
            <label>字号</label>{num(p.size, (n) => patch((t) => { t.pops[sel.i].size = n; }), "74")}</div>
          <div className="hint">x/y/字号留空 = 用全局「观点弹字」盒子</div>
        </div>
      );
    }
    if (sel.kind === "media") {
      const m = (tl.media || [])[sel.i];
      if (!m) return null;
      return (
        <div className="selbody">
          <div className="bar"><b style={{color: "#ffb020"}}>插图/视频</b>{del(() => patch((t) => { t.media!.splice(sel.i, 1); }))}</div>
          <div className="bar"><label>素材</label><select value={m.src} onChange={(e) => patch((t) => { t.media![sel.i].src = e.target.value; })}>{assets.filter((a) => a.kind === "image" || a.kind === "video").map((a) => <option key={a.name} value={`assets/${a.name}`}>{a.name}</option>)}</select></div>
          <div className="bar"><label>开始</label>{num(m.s, (n) => patch((t) => { t.media![sel.i].s = n; }))}<label>结束</label>{num(m.e, (n) => patch((t) => { t.media![sel.i].e = n; }))}</div>
          <div className="bar"><label>入场</label><select value={m.entrance ?? "pop"} onChange={(e) => patch((t) => { t.media![sel.i].entrance = e.target.value; })}>{presets.entrances.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
            <label>退场</label><select value={m.exit ?? "fade"} onChange={(e) => patch((t) => { t.media![sel.i].exit = e.target.value; })}>{presets.exits.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
          <div className="bar"><label>边框</label><select value={m.frame ?? "none"} onChange={(e) => patch((t) => { t.media![sel.i].frame = e.target.value; })}>{presets.frames.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
            <label>倾斜°</label>{num(m.tilt, (n) => patch((t) => { t.media![sel.i].tilt = n; }), "0")}</div>
          <div className="bar"><label>x</label>{num(m.x, (n) => patch((t) => { t.media![sel.i].x = n; }))}<label>y</label>{num(m.y, (n) => patch((t) => { t.media![sel.i].y = n; }))}
            <label>宽</label>{num(m.w, (n) => patch((t) => { t.media![sel.i].w = n; }))}<label>高</label>{num(m.h, (n) => patch((t) => { t.media![sel.i].h = n; }))}</div>
          <div className="bar">
            <label><input type="checkbox" checked={!!(m as any).scroll} onChange={(e) => patch((t) => { (t.media![sel.i] as any).scroll = e.target.checked || undefined; })} /> 长图自动滚动(截图证据)</label>
            <label><input type="checkbox" checked={!!(m as any).kenburns} onChange={(e) => patch((t) => { (t.media![sel.i] as any).kenburns = e.target.checked || undefined; })} /> 缓推镜头(放大镜巡游感)</label>
          </div>
        </div>
      );
    }
    if (sel.kind === "card") {
      const c = tl.cards[sel.i];
      if (!c) return null;
      return (
        <div className="selbody">
          <div className="bar"><b style={{color: "#b58cff"}}>底部卡片 {c.id} · {c.type}</b>{del(() => patch((t) => { t.cards.splice(sel.i, 1); }))}</div>
          <div className="bar"><label>开始</label>{num(c.s, (n) => patch((t) => { t.cards[sel.i].s = n; }))}<label>结束</label>{num(c.e, (n) => patch((t) => { t.cards[sel.i].e = n; }))}
            {c.type === "list" && <><label>高亮色</label><select value={c.tc ?? "cyan"} onChange={(e) => patch((t) => { t.cards[sel.i].tc = e.target.value; })}>{COLOR_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></>}</div>
          <div className="bar"><label>x</label>{num(c.x, (n) => patch((t) => { t.cards[sel.i].x = n; }))}<label>y</label>{num(c.y, (n) => patch((t) => { t.cards[sel.i].y = n; }))}
            <label>宽</label>{num(c.w, (n) => patch((t) => { t.cards[sel.i].w = n; }))}<label>高</label>{num(c.h, (n) => patch((t) => { t.cards[sel.i].h = n; }))}
            <button className="mini" onClick={() => patch((t) => { const cc = t.cards[sel.i]; delete cc.x; delete cc.y; delete cc.w; delete cc.h; })}>还原全局位置</button>
            <label><input type="checkbox" checked={!!(c as any).bare} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).bare = e.target.checked || undefined; })} /> 无底框(融入画面)</label></div>
          <div className="hint">留空=用全局「底部卡片」盒子;也可以直接在画面上拖这张卡</div>
          {c.type === "list" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 260}} value={c.title ?? ""} onChange={(e) => patch((t) => { t.cards[sel.i].title = e.target.value; })} />
                <button className="mini" onClick={() => patch((t) => { (t.cards[sel.i].rows = t.cards[sel.i].rows || []).push({i: "ok", t: "新条目"}); })}>＋条目</button></div>
              {(c.rows || []).map((r, ri) => (
                <div className="bar" key={ri} style={{marginLeft: 12}}>
                  <button className="mini" onClick={() => patch((t) => { t.cards[sel.i].rows![ri].i = r.i === "ok" ? "x" : "ok"; })}>{r.i === "ok" ? "✓" : "✕"}</button>
                  <input style={{width: 240}} value={r.t} onChange={(e) => patch((t) => { t.cards[sel.i].rows![ri].t = e.target.value; })} />
                  <button className="danger mini" onClick={() => patch((t) => { t.cards[sel.i].rows!.splice(ri, 1); })}>✕</button>
                </div>
              ))}
            </>
          )}
          {c.type === "tool" && (
            <>
              <div className="bar"><label>小标签</label><input style={{width: 120}} value={c.lab ?? ""} onChange={(e) => patch((t) => { t.cards[sel.i].lab = e.target.value; })} /></div>
              <div className="bar"><label>大字</label><input style={{width: 240}} value={c.big ?? ""} onChange={(e) => patch((t) => { t.cards[sel.i].big = e.target.value; })} /></div>
              <div className="bar"><label>标签块</label><input style={{width: 160}} value={(c.chips || []).join(",")} onChange={(e) => patch((t) => { t.cards[sel.i].chips = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} />
                <label>高亮#</label>{num(c.chipHl, (n) => patch((t) => { t.cards[sel.i].chipHl = n; }), "0")}</div>
              <div className="bar"><label>结论行</label><input style={{width: 240}} value={c.sub ?? ""} onChange={(e) => patch((t) => { t.cards[sel.i].sub = e.target.value; })} /></div>
            </>
          )}
          {c.type === "quote" && (
            <>
              <div className="bar"><label>金句</label><input style={{width: 300}} value={(c as any).text ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).text = e.target.value; })} />
                <label>署名</label><input style={{width: 90}} value={(c as any).by ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).by = e.target.value; })} /></div>
            </>
          )}
          {c.type === "stat" && (
            <div className="bar"><label>数字</label>{num((c as any).num, (n) => patch((t) => { (t.cards[sel.i] as any).num = n; }))}
              <label>单位</label><input style={{width: 60}} value={(c as any).unit ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).unit = e.target.value; })} />
              <label>说明</label><input style={{width: 200}} value={(c as any).cap ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).cap = e.target.value; })} /></div>
          )}
          {c.type === "compare" && (
            <>
              <div className="bar"><label>左标题</label><input style={{width: 100}} value={(c as any).ltitle ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).ltitle = e.target.value; })} />
                <label>左条目(逗号)</label><input style={{width: 200}} value={((c as any).lrows || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).lrows = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
              <div className="bar"><label>右标题</label><input style={{width: 100}} value={(c as any).rtitle ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).rtitle = e.target.value; })} />
                <label>右条目(逗号)</label><input style={{width: 200}} value={((c as any).rrows || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).rrows = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
              <div className="bar"><label>胜者</label><select value={(c as any).winner ?? "right"} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).winner = e.target.value; })}><option value="left">左侧</option><option value="right">右侧</option><option value="none">不标</option></select></div>
            </>
          )}
          {c.type === "alert" && (
            <div className="bar"><label>警告标题</label><input style={{width: 180}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} />
              <label>说明</label><input style={{width: 240}} value={(c as any).text ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).text = e.target.value; })} /></div>
          )}
          {c.type === "tags" && (
            <div className="bar"><label>标签(逗号)</label><input style={{width: 240}} value={((c as any).chips || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).chips = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} />
              <label>高亮#</label>{num(c.chipHl, (n) => patch((t) => { t.cards[sel.i].chipHl = n; }), "0")}</div>
          )}
          {c.type === "line" && (
            <div className="bar"><label>说明</label><input style={{width: 240}} value={(c as any).cap ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).cap = e.target.value; })} /></div>
          )}
          {c.type === "stamp" && (
            <div className="bar"><label>判词</label><input style={{width: 140}} value={(c as any).text ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).text = e.target.value; })} />
              <label>英文小字</label><input style={{width: 140}} value={(c as any).sub ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).sub = e.target.value; })} />
              <label>颜色</label><select value={c.tc ?? "red"} onChange={(e) => patch((t) => { t.cards[sel.i].tc = e.target.value; })}>{COLOR_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></div>
          )}
          {c.type === "strike" && (
            <>
              <div className="bar"><label>划掉的旧词</label><input style={{width: 140}} value={(c as any).old ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).old = e.target.value; })} />
                <label>新词(| |高亮)</label><input style={{width: 180}} value={(c as any).next ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).next = e.target.value; })} /></div>
              <div className="bar"><label>划线时刻(卡内秒)</label>{num((c as any).strikeAt, (n) => patch((t) => { (t.cards[sel.i] as any).strikeAt = n; }), "1.4")}
                <label>高亮色</label><select value={c.tc ?? "blue"} onChange={(e) => patch((t) => { t.cards[sel.i].tc = e.target.value; })}>{COLOR_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></div>
            </>
          )}
          {c.type === "formula" && (
            <>
              <div className="bar"><label>公式词(词|颜色,逗号分隔)</label>
                <input style={{width: 340}} value={((c as any).parts || []).map((p: any) => p.t + "|" + (p.c || "#fff")).join(",")}
                  onChange={(e) => patch((t) => { (t.cards[sel.i] as any).parts = e.target.value.split(",").map((x) => { const [tt, cc] = x.split("|"); return {t: (tt || "").trim(), c: (cc || "#fff").trim()}; }).filter((p: any) => p.t); })} /></div>
              <div className="hint">最后一个词前自动用 = ,其余用 × ;颜色可用 red/gold/green/blue/cyan 或 #hex</div>
            </>
          )}
          {c.type === "dots" && (
            <div className="bar"><label>标签</label><input style={{width: 170}} value={(c as any).label ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).label = e.target.value; })} />
              <label>点数</label>{num((c as any).count, (n) => patch((t) => { (t.cards[sel.i] as any).count = n; }), "100")}
              <label>变色时刻(绝对秒)</label>{num((c as any).flipT, (n) => patch((t) => { (t.cards[sel.i] as any).flipT = n; }))}
              <label>变色后标签</label><input style={{width: 150}} value={(c as any).flipLabel ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).flipLabel = e.target.value; })} /></div>
          )}
          {c.type === "bignum" && (
            <div className="bar"><label>前缀</label><input style={{width: 50}} value={(c as any).prefix ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).prefix = e.target.value; })} />
              <label>数字</label>{num((c as any).num, (n) => patch((t) => { (t.cards[sel.i] as any).num = n; }))}
              <label>单位</label><input style={{width: 60}} value={(c as any).unit ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).unit = e.target.value; })} />
              <label>注释胶囊</label><input style={{width: 180}} value={(c as any).note ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).note = e.target.value; })} /></div>
          )}
          {c.type === "highlight" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 180}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} /></div>
              <div className="bar"><label>逐句(逗号分隔)</label><input style={{width: 340}} value={((c as any).lines || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).lines = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
              <div className="hint">每句会被荧光笔按顺序扫亮(默认间隔1.3s);要卡口播可填 at:[绝对秒] (让 Claude 改)</div>
            </>
          )}
          {c.type === "wall" && (
            <div className="bar"><label>卡片(逗号,≤24)</label><input style={{width: 320}} value={((c as any).items || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).items = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} />
              <label>列数</label>{num((c as any).cols, (n) => patch((t) => { (t.cards[sel.i] as any).cols = n; }), "3")}</div>
          )}
          {c.type === "progress" && (
            <div className="bar"><label>标签</label><input style={{width: 200}} value={(c as any).label ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).label = e.target.value; })} />
              <label>百分比</label>{num((c as any).pct, (n) => patch((t) => { (t.cards[sel.i] as any).pct = n; }), "76")}
              <label>小胶囊(逗号)</label><input style={{width: 160}} value={((c as any).tags || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).tags = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
          )}
          {c.type === "roadmap" && (
            <div className="bar"><label>节点(逗号)</label><input style={{width: 240}} value={((c as any).items || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).items = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} />
              <label>高亮#</label>{num(c.chipHl, (n) => patch((t) => { t.cards[sel.i].chipHl = n; }), "-")}</div>
          )}
          {c.type === "chain" && (
            <div className="bar"><label>步骤(逗号)</label><input style={{width: 240}} value={((c as any).items || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).items = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} />
              <label>箭头</label><select value={(c as any).arrow ?? "→"} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).arrow = e.target.value; })}><option value="→">→</option><option value="⇄">⇄</option><option value="+">+</option></select>
              <label>高亮#</label>{num(c.chipHl, (n) => patch((t) => { t.cards[sel.i].chipHl = n; }), "-")}</div>
          )}
          {c.type === "curveplot" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 210}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} /><label>横轴</label><input style={{width: 180}} value={((c as any).labels || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).labels = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
              <div className="bar"><label>曲线A</label><input style={{width: 92}} value={(c as any).series?.[0]?.name ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).series[0].name = e.target.value; })} /><input style={{width: 170}} value={((c as any).series?.[0]?.values || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).series[0].values = e.target.value.split(",").map(Number).filter((x) => !isNaN(x)); })} /></div>
              <div className="bar"><label>曲线B</label><input style={{width: 92}} value={(c as any).series?.[1]?.name ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).series[1].name = e.target.value; })} /><input style={{width: 170}} value={((c as any).series?.[1]?.values || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).series[1].values = e.target.value.split(",").map(Number).filter((x) => !isNaN(x)); })} /></div>
              <div className="bar"><label>结论</label><input style={{width: 300}} value={(c as any).note ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).note = e.target.value; })} /></div>
            </>
          )}
          {c.type === "flywheel" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 220}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} /><label>中心</label><input style={{width: 80}} value={(c as any).center ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).center = e.target.value; })} /></div>
              <div className="bar"><label>环节</label><input style={{width: 320}} value={((c as any).nodes || []).join(",")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).nodes = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })} /></div>
              <div className="bar"><label>结论</label><input style={{width: 300}} value={(c as any).cap ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).cap = e.target.value; })} /></div>
            </>
          )}
          {c.type === "criteria" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 280}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} /></div>
              <div className="bar"><label>条件</label><textarea style={{width: 330, minHeight: 70}} value={((c as any).rows || []).map((r: any) => `${r.label}|${r.note}|${r.state}`).join("\n")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).rows = e.target.value.split("\n").map((x) => { const [label, note, state] = x.split("|"); return {label: (label || "").trim(), note: (note || "").trim(), state: (state || "pass").trim()}; }).filter((r) => r.label); })} /></div>
              <div className="bar"><label>结论</label><input style={{width: 220}} value={(c as any).verdict ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).verdict = e.target.value; })} /><select value={(c as any).verdictState ?? "pass"} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).verdictState = e.target.value; })}><option value="pass">通过</option><option value="warn">观察</option><option value="fail">淘汰</option></select></div>
            </>
          )}
          {c.type === "evidencefocus" && (
            <>
              <div className="bar"><label>标题</label><input style={{width: 250}} value={(c as any).title ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).title = e.target.value; })} /></div>
              <div className="bar"><label>截图</label><select style={{width: 260}} value={(c as any).src ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).src = e.target.value; })}><option value="">文档示意</option>{assets.filter((a) => a.kind === "image").map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}</select></div>
              <div className="bar"><label>聚焦框</label><textarea style={{width: 330, minHeight: 64}} value={((c as any).focus || []).map((f: any) => `${f.x},${f.y},${f.w},${f.h},${f.label || "重点"}`).join("\n")} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).focus = e.target.value.split("\n").map((x) => { const [xx, yy, w, h, label] = x.split(","); return {x: Number(xx), y: Number(yy), w: Number(w), h: Number(h), label: (label || "重点").trim()}; }).filter((f) => [f.x, f.y, f.w, f.h].every(Number.isFinite)); })} /></div>
              <div className="bar"><label>来源</label><input style={{width: 280}} value={(c as any).source ?? ""} onChange={(e) => patch((t) => { (t.cards[sel.i] as any).source = e.target.value; })} /></div>
            </>
          )}
        </div>
      );
    }
    if (sel.kind === "chapter") {
      const c = tl.chapters[sel.i];
      if (!c) return null;
      return (
        <div className="selbody">
          <div className="bar"><b style={{color: "#8aa0b0"}}>章节 {c.n}</b></div>
          <div className="bar"><label>标签</label><input style={{width: 140}} value={c.lab} onChange={(e) => patch((t) => { t.chapters[sel.i].lab = e.target.value; })} /></div>
          <div className="bar"><label>开始</label>{num(c.s, (n) => patch((t) => { t.chapters[sel.i].s = n; }))}<label>结束</label>{num(c.e, (n) => patch((t) => { t.chapters[sel.i].e = n; }))}</div>
        </div>
      );
    }
    if (sel.kind === "cap" && caps) {
      const c = caps[sel.i];
      if (!c) return null;
      return (
        <div className="selbody">
          <div className="bar"><b style={{color: "#ff7a59"}}>字幕 #{sel.i + 1}</b>{del(() => patchCaps((cc) => { cc.splice(sel.i, 1); }))}</div>
          <div className="bar"><label>开始</label>{num(c.s, (n) => patchCaps((cc) => { cc[sel.i].s = n; }))}<label>结束</label>{num(c.e, (n) => patchCaps((cc) => { cc[sel.i].e = n; }))}</div>
          <div className="bar"><label>文本</label><input style={{width: 260}} value={c.z} onChange={(e) => patchCaps((cc) => { cc[sel.i].z = e.target.value; })} /></div>
        </div>
      );
    }
    return null;
  };

  // ---------- 版式框 ----------
  const onBoxDown = (key: string, e: React.PointerEvent) => {
    if (!tl) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {box: key, x0: e.clientX, y0: e.clientY, ox: tl.boxes[key].x ?? 0, oy: tl.boxes[key].y ?? 0};
  };
  const onBoxMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.box) return;
    patch((t) => {
      const b = t.boxes[d.box];
      if ("x" in b) b.x = Math.round(Math.max(0, Math.min(1080, d.ox + (e.clientX - d.x0) / scaleRef.current)));
      b.y = Math.round(Math.max(0, Math.min(1920, d.oy + (e.clientY - d.y0) / scaleRef.current)));
    });
  };
  const boxRect = (key: string) => {
    if (!tl) return null;
    const b = tl.boxes[key];
    if (!b) return null;
    return {x: (b.x ?? 0) * scale, y: (b.y ?? 0) * scale, w: (b.w ?? 1080) * scale, h: (b.h ?? BOX_VIS[key].fakeH ?? 100) * scale};
  };

  // ---------- 选中媒体:画面上直接拖动/拖角缩放 ----------
  const onMediaDown = (mode: "move" | "size", e: React.PointerEvent) => {
    if (!tl || !sel || sel.kind !== "media") return;
    const m = (tl.media || [])[sel.i];
    if (!m) return;
    e.preventDefault(); e.stopPropagation();
    snapUndo();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {mediaSel: true, mode, i: sel.i, x0: e.clientX, y0: e.clientY, ox: m.x, oy: m.y, ow: m.w, oh: m.h};
  };
  const onMediaMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.mediaSel) return;
    const dx = (e.clientX - d.x0) / scaleRef.current;
    const dy = (e.clientY - d.y0) / scaleRef.current;
    patch((t) => {
      const m = t.media![d.i];
      if (!m) return;
      if (d.mode === "move") {
        m.x = Math.round(Math.max(-200, Math.min(1080, d.ox + dx)));
        m.y = Math.round(Math.max(-200, Math.min(1920, d.oy + dy)));
      } else {
        m.w = Math.round(Math.max(80, d.ow + dx));
        m.h = Math.round(Math.max(80, d.oh + dy));
      }
    });
  };

  // ---------- 选中卡片:画面上拖动/拖角缩放(没覆盖过就从全局盒子起步) ----------
  const cardRect = (c: Card) => {
    const gb = tl?.boxes.card || {x: 38, y: 1108, w: 1004, h: 560};
    return {x: c.x ?? gb.x, y: c.y ?? gb.y, w: c.w ?? gb.w, h: c.h ?? gb.h};
  };
  const onCardBoxDown = (mode: "move" | "size", e: React.PointerEvent) => {
    if (!tl || !sel || sel.kind !== "card") return;
    const c = tl.cards[sel.i];
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    snapUndo();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const r = cardRect(c);
    dragRef.current = {cardSel: true, mode, i: sel.i, x0: e.clientX, y0: e.clientY, ox: r.x, oy: r.y, ow: r.w, oh: r.h};
  };
  const onCardBoxMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.cardSel) return;
    const dx = (e.clientX - d.x0) / scaleRef.current;
    const dy = (e.clientY - d.y0) / scaleRef.current;
    patch((t) => {
      const c = t.cards[d.i];
      if (!c) return;
      if (d.mode === "move") {
        c.x = Math.round(Math.max(-200, Math.min(1080, d.ox + dx)));
        c.y = Math.round(Math.max(-200, Math.min(1920, d.oy + dy)));
      } else {
        c.w = Math.round(Math.max(200, d.ow + dx));
        c.h = Math.round(Math.max(140, d.oh + dy));
      }
    });
  };

  // ---------- 时间轴整区 scrub(随点随拖) ----------
  const tlInnerRef = useRef<HTMLDivElement>(null);
  const scrubTo = (e: React.PointerEvent) => {
    const el = tlInnerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    seek((e.clientX - rect.left - 60) / ppsRef.current);
  };

  if (!tl && tab === "edit") return <div style={{padding: 20}}>加载中…</div>;

  return (
    <div className="shell">
      <div className="tabs">
        <button className={tab === "edit" ? "tab on" : "tab"} onClick={() => setTab("edit")}>🎬 真片编辑</button>
        <button className={tab === "style" ? "tab on" : "tab"} onClick={() => setTab("style")}>🎨 版式模板(实验室)</button>
        <span className="tabhint">改动自动保存(≈1秒生效) · 空格=播放 · Delete=删除 · ⌘Z=撤销 · ←→=微移</span>
      </div>

      {tab === "style" && <iframe className="styleframe" src="/" title="版式模板" />}

      {tab === "edit" && tl && (
        <div className="editcol">
          <div className="toprow">
            {/* ===== 左栏:素材与添加(剪映式) ===== */}
            <div className="leftbar" style={{width: leftW}}>
              <div className="bar">
                <select style={{flex: 1}} value={ep} onChange={(e) => setEp(e.target.value)}>
                  {eps.map((x) => <option key={x.ep} value={x.ep}>{x.name}({x.dur}s)</option>)}
                </select>
              </div>
              <h2 style={{marginTop: 8}}>➕ 添加元素</h2>
              <div className="bar">
                <button onClick={addPop}>💬 弹字</button>
                {caps && <button onClick={addCap}>📝 字幕</button>}
                <span className="hint">加在播放头</span>
              </div>
              <div className="bar">
                <select id="compsel" defaultValue="list">
                  {COMP_CATS.map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {COMP_TYPES.filter((c) => c.cat === cat).map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button onClick={() => addCard((document.getElementById("compsel") as HTMLSelectElement).value)}>＋动效</button>
              </div>
              <div className="bar">
                <button className="ai" onClick={aiFill} disabled={aiBusy}>{aiBusy ? "🤖 AI思考中…" : "✨ AI动效(按此刻口播)"}</button>
                <button className={libPreview ? "mini on" : "mini"} onClick={() => setLibPreview(!libPreview)}>{libPreview ? "🎬 收起预览" : "🎬 图像预览"}</button>
              </div>
              <div className="hint">把播放头停在某句话上点✨,AI 会按语义挑组件并用口播原话填好内容</div>
              {libPreview && (
                <div className="libpv">
                  <div className="libupdate">
                    <b>2026-07-10 · 最新 10 条增量</b>
                    <span>新增 4 个表达型组件，左右对比已升级为错峰落版</span>
                  </div>
                  {COMP_CATS.map((cat) => (
                    <React.Fragment key={cat}>
                      <div className="libgroup">{cat} · 点小样即插入播放头</div>
                      <div className="pvgrid">
                        {COMP_TYPES.filter((c) => c.cat === cat).map((c) => (
                          <div className="pvtile" key={c.v} onClick={() => addCard(c.v)} title={c.label}>
                            {COMP_MINI[c.v]}
                            <span className="pvlabel">{c.label.replace(/^\S+ /, "")}</span>
                          </div>
                        ))}
                      </div>
                    </React.Fragment>
                  ))}
                  <div className="libgroup">入场动画 · 选中插图后点击应用</div>
                  <div className="pvgrid">
                    {presets.entrances.map((o) => (
                      <div className="pvtile" key={o.key} title={o.label}
                        onClick={() => { if (sel?.kind === "media") { patch((t) => { t.media![sel.i].entrance = o.key; }); setMsg(`✓ 入场 → ${o.label}`); } else setMsg("先选中一个插图/视频,再点入场动画"); }}>
                        <div className="pvstage"><div className={"pvbox ent-" + o.key} /></div>
                        <span className="pvlabel">{o.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="libgroup">边框样式 · 选中插图后点击应用</div>
                  <div className="pvgrid">
                    {presets.frames.map((o) => (
                      <div className="pvtile" key={o.key} title={o.label}
                        onClick={() => { if (sel?.kind === "media") { patch((t) => { t.media![sel.i].frame = o.key; }); setMsg(`✓ 边框 → ${o.label}`); } else setMsg("先选中一个插图/视频,再点边框"); }}>
                        <div className="pvstage"><div className={"pvfr fr-" + o.key} /></div>
                        <span className="pvlabel">{o.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h2>📦 素材库 <label className="mini upbtn">＋传<input type="file" multiple style={{display: "none"}} onChange={(e) => e.target.files && uploadFiles(e.target.files)} /></label>
                <button className="ai mini" disabled={aiBusy} onClick={async () => {
                  setAiBusy(true); setErr(false);
                  setMsg("🪄 AI 正在看每个素材、对照口播排片…(约1-3分钟)");
                  try {
                    const j = await fetch(`/api/ai-media?ep=${ep}`, {method: "POST"}).then((r) => r.json());
                    if (!j.ok) { setErr(true); setMsg("AI排素材失败: " + (j.error || "")); return; }
                    const tlNew = await fetch(`/api/timeline?ep=${ep}`).then((r) => r.json());
                    setTl(tlNew); setDirty(false); setLiveKey((k) => k + 1);
                    setMsg(`🪄 已排 ${j.placed.length} 个素材:\n` + j.placed.map((p: any) => `· ${p.src.replace("assets/", "")} → ${p.s}-${p.e}s(${p.why})`).join("\n") + (j.skipped?.length ? `\n跳过 ${j.skipped.length} 个:\n` + j.skipped.map((x: any) => `· ${x.src.replace("assets/", "")}(${x.why})`).join("\n") : ""));
                  } finally { setAiBusy(false); }
                }}>{aiBusy ? "🪄…" : "🪄AI排素材"}</button></h2>
              <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}>
                拖图片/视频/字体到这里
              </div>
              <div className="assetgrid">
                {assets.map((a) => (
                  <div className="asset" key={a.name}>
                    {a.kind === "image" ? <img src={`/live/${ep}/hf/assets/${a.name}`} alt="" /> : <div className="assetph">{a.kind === "video" ? "🎞" : a.kind === "font" ? "🔤" : "📄"}</div>}
                    <div className="assetname" title={a.name}>{a.name}</div>
                    {(a.kind === "image" || a.kind === "video") && <button className="mini" onClick={() => insertMedia(a)}>插入▶</button>}
                  </div>
                ))}
                {!assets.length && <div className="hint">还没有素材</div>}
              </div>
              <h2>✨ 效果收集箱</h2>
              <div className="bar">
                <input style={{flex: 1, minWidth: 0}} placeholder="链接/描述" value={inboxNote} onChange={(e) => setInboxNote(e.target.value)} />
                <button className="mini" onClick={() => sendInbox()}>存</button>
                <label className="mini upbtn">＋文件<input type="file" multiple style={{display: "none"}} onChange={(e) => e.target.files && sendInbox(e.target.files)} /></label>
              </div>
              <div className="hint">丢参考进来 → 叫 Claude/Codex 复刻成预设(现有 {inbox.filter((x) => x !== "_收集笔记.md").length} 个)</div>
            </div>

            <div className="vdivider" onPointerDown={(e) => onDivDown("v", e)} onPointerMove={onDivMove} onPointerUp={() => { dragRef.current = null; }} />

            {/* ===== 中栏:剪辑区域 ===== */}
            <div className="center" style={{width: centerW}}>
              <div className="bar">
                <button className="primary" onClick={() => save()}>保存{(dirty || capsDirty) ? " ●" : ""}</button>
                <button className="mini" title="撤销 ⌘Z" onClick={undo}>↺</button>
                <button className="mini" title="重做 ⇧⌘Z" onClick={redo}>↻</button>
                <button className={previewMode === "live" ? "mini on" : "mini"} onClick={() => setPreviewMode("live")}>⚡实时</button>
                <button className={previewMode === "film" ? "mini on" : "mini"} onClick={() => setPreviewMode("film")}>🎞成片</button>
                <button onClick={render} disabled={rendering}>{rendering ? "渲染中…" : "⏫导出"}</button>
                <select value={fpsMode} onChange={(e) => setFpsMode(e.target.value)}>
                  <option value="15">快查 15fps·1分钟</option>
                  <option value="30">草稿 30fps·2分钟</option>
                  <option value="final">正式版·高清+BGM+归档</option>
                </select>
              </div>

              <div className="pvwrap" ref={pvRef}>
              {previewMode === "live" ? (
                <div className="videobox" style={{width: videoW, height: videoW * 1920 / 1080}}>
                  <div className="iframeScale" style={{transform: `scale(${scale})`}}>
                    <iframe key={liveKey} ref={iframeRef} src={`/live/${ep}/hf/index.html?v=${liveKey}`} onLoad={onIframeLoad} title="live" width={1080} height={1920} />
                  </div>
                  {showBoxes && Object.keys(BOX_VIS).map((key) => {
                    const r = boxRect(key);
                    if (!r) return null;
                    const draggable = tl.boxes[key] && ("y" in tl.boxes[key]);
                    return (
                      <div key={key} className="obox" style={{left: r.x, top: r.y, width: r.w, height: r.h, borderColor: BOX_VIS[key].color, cursor: draggable ? "move" : "default"}}
                        onPointerDown={(e) => draggable && onBoxDown(key, e)} onPointerMove={onBoxMove} onPointerUp={() => { dragRef.current = null; }}>
                        <span style={{background: BOX_VIS[key].color}}>{BOX_VIS[key].label}</span>
                      </div>
                    );
                  })}
                  {sel?.kind === "card" && tl.cards[sel.i] && (() => {
                    const r = cardRect(tl.cards[sel.i]);
                    return (
                      <div className="mbox cardbox" style={{left: r.x * scale, top: r.y * scale, width: r.w * scale, height: r.h * scale}}
                        onPointerDown={(e) => onCardBoxDown("move", e)} onPointerMove={onCardBoxMove} onPointerUp={() => { dragRef.current = null; }}>
                        <span>拖我挪动效位置</span>
                        <i className="mresize" onPointerDown={(e) => onCardBoxDown("size", e)} onPointerMove={onCardBoxMove} onPointerUp={() => { dragRef.current = null; }} />
                      </div>
                    );
                  })()}
                  {sel?.kind === "media" && (tl.media || [])[sel.i] && (() => {
                    const m = tl.media![sel.i];
                    return (
                      <div className="mbox" style={{left: m.x * scale, top: m.y * scale, width: m.w * scale, height: m.h * scale}}
                        onPointerDown={(e) => onMediaDown("move", e)} onPointerMove={onMediaMove} onPointerUp={() => { dragRef.current = null; }}>
                        <span>拖我挪位置</span>
                        <i className="mresize" onPointerDown={(e) => onMediaDown("size", e)} onPointerMove={onMediaMove} onPointerUp={() => { dragRef.current = null; }} />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <video key={filmKey} ref={filmRef} className="filmvideo" src={`/api/video?ep=${ep}&v=${filmKey}`} controls style={{width: videoW}} />
              )}
              </div>

              {previewMode === "live" && (
                <div className="bar transport">
                  <button className="primary" onClick={playing ? pause : play}>{playing ? "⏸" : "▶"}</button>
                  <input ref={sliderRef} type="range" min={0} max={dur} step={0.05} defaultValue={0} style={{flex: 1}}
                    onPointerDown={() => { sliderDragRef.current = true; }}
                    onPointerUp={(e) => { sliderDragRef.current = false; (e.target as HTMLInputElement).blur(); }}
                    onInput={(e) => seek(+(e.target as HTMLInputElement).value)} />
                  <span ref={timeLabelRef} style={{width: 92, color: "#8aa0b0", fontVariantNumeric: "tabular-nums"}}>0:00.0 / 0:00.0</span>
                </div>
              )}
              <div className={"status" + (err ? " err" : "")}>{msg}</div>
            </div>

            <div className="vdivider" onPointerDown={(e) => onDivDown("v2", e)} onPointerMove={onDivMove} onPointerUp={() => { dragRef.current = null; }} />

            {/* ===== 右栏:参数设计 ===== */}
            <div className="rightbar">
              <h2 style={{marginTop: 0}}>✏️ 参数</h2>
              {selPanel()}
              <details className="acc">
                <summary>📋 工程信息</summary>
                <div className="infogrid">
                  <span>工程名</span><b>{tl.meta.name}</b>
                  <span>版式</span><b>{tl.meta.layout}</b>
                  <span>时长</span><b>{tl.meta.dur}s · 30帧/秒 · 1080×1920</b>
                  <span>元素</span><b>{tl.pops.length}弹字 · {tl.cards.length}卡片 · {(tl.media || []).length}插图 · {(caps || []).length}字幕</b>
                  <span>位置</span><b style={{wordBreak: "break-all"}}>episodes/{ep}/</b>
                </div>
              </details>
              <details className="acc">
                <summary>🌐 全局设置(版式盒子/标题)</summary>
                <div className="bar" style={{margin: "8px 0"}}>
                  <button className="mini" onClick={() => setShowBoxes(!showBoxes)}>{showBoxes ? "隐藏版式框" : "画面上显示版式框(可拖)"}</button>
                  <button className="mini" onClick={saveTemplate}>📌存为新片默认版式</button>
                </div>
                <div className="boxgrid">
                  {Object.entries(tl.boxes).map(([key, box]) => (
                    <div className="boxcard" key={key}>
                      <b style={{color: BOX_VIS[key]?.color}}>{BOX_VIS[key]?.label || key}</b>
                      {Object.entries(box).map(([k, v]) => (
                        <span key={k}>
                          <label>{k}</label>
                          <input type="number" value={v} onChange={(e) => patch((t) => { t.boxes[key][k] = +e.target.value; })} />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="bar" style={{marginTop: 8}}>
                  <label>大标题</label>
                  <input style={{flex: 1}} value={tl.meta.title} onChange={(e) => patch((t) => { t.meta.title = e.target.value; })} />
                </div>
                {tl.chipT && (
                  <div className="bar" style={{marginTop: 8}}>
                    <label>chip时间</label>
                    <input style={{width: 200}} value={tl.chipT.join(",")} onChange={(e) => patch((t) => { t.chipT = e.target.value.split(",").map((x) => +x.trim()).filter((x) => !isNaN(x)); })} />
                  </div>
                )}
              </details>
            </div>
          </div>

          {/* ===== 时间轴 ===== */}
          <div className="hdivider" onPointerDown={(e) => onDivDown("h", e)} onPointerMove={onDivMove} onPointerUp={() => { dragRef.current = null; }} />
          <div className="tlwrap" style={{height: tlH}}>
            <div className="tlscroll" ref={tlScrollRef}>
              <div className="tlinner" ref={tlInnerRef} style={{width: dur * pps + 60}}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest(".block")) return;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragRef.current = {scrub: true};
                  scrubTo(e);
                }}
                onPointerMove={(e) => { if (dragRef.current?.scrub) scrubTo(e); }}
                onPointerUp={() => { if (dragRef.current?.scrub) dragRef.current = null; }}>
                <div className="ruler">
                  {Array.from({length: Math.ceil(dur / tickStep) + 1}, (_, i) => (
                    <span key={i} className="tick" style={{left: i * tickStep * pps}}>{i * tickStep}s</span>
                  ))}
                </div>
                {TRACKS.map((tr) => (
                  <div className="track" key={tr.kind} style={{height: trackH}}>
                    <span className="trlabel" style={{color: tr.color, top: Math.max(4, (trackH - 16) / 2)}}>{tr.label}</span>
                    {itemsOf(tr.kind).map((it, i) => (
                      <div key={i}
                        className={"block" + (sel && sel.kind === tr.kind && sel.i === i ? " selon" : "")}
                        style={{left: it.s * pps, width: Math.max(6, (it.e - it.s) * pps), height: trackH - 2, background: tr.color + "33", borderColor: tr.color}}
                        onPointerDown={(e) => {
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const mode = e.clientX > r.right - 9 ? "resize" : (e.clientX < r.left + 9 && r.width > 24) ? "resize-l" : "move";
                          onBlockDown(tr.kind, i, mode, e);
                        }}
                        onPointerMove={onBlockMove}
                        onPointerUp={() => onBlockUp(tr.kind, i)}>
                        <i className="lhandle" />
                        <span style={{fontSize: trackH >= 34 ? 13 : 10}}>{it.label}</span>
                        <i className="rhandle" />
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={playheadRef} className="playhead" />
              </div>
            </div>
            <div className="tlbar">
              <span className="hint" style={{margin: 0}}>拖色块=挪时间 · 拖两端=改起止 · 点块=选中 · 改完≈1秒自动生效 · ⌘Z撤销/⇧⌘Z重做</span>
              <span style={{flex: 1}} />
              <button className="mini" onClick={() => setPps(Math.max(6, pps / 1.3))}>－</button>
              <input type="range" min={6} max={90} value={pps} style={{width: 120}} onChange={(e) => setPps(+e.target.value)} title="时间轴缩放(⌘+滚轮同款)" />
              <button className="mini" onClick={() => setPps(Math.min(90, pps * 1.3))}>＋</button>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src={ep ? `/api/voice?ep=${ep}` : undefined} preload="auto" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
