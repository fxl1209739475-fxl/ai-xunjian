// 重说口误检测 —— 找出"说错→停顿→重说"里作废的前一遍，交给剪切列表剪掉
// 判定原则(保守优先,宁漏勿误剪):
//   ① 只比较时间上紧挨着的句子(间隔≤8s、往后最多看3句)——隔很远的相似句多半是刻意呼应,不动
//   ② 两种命中: 整句高相似(说错个别词重说) / 前句是后句的开头(半句卡壳重来)
//   ③ 命中永远剪"前一遍"保"后一遍"——重说的那遍才是想要的
// 纯算法零依赖,--no-ai 模式同样可用

const norm = (z) => String(z || "").replace(/[\s，。、？！；：""''…—·,.?!;:'"()（）]/g, "");

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const simRatio = (a, b) => { const L = Math.max(a.length, b.length); return L ? 1 - lev(a, b) / L : 0; };

/**
 * @param segments  whisper 原始句段 [{s,e,z}] (原片时间轴,未拆行)
 * @param opts      { sim: 整句相似阈值(默认0.8), gap: 最大间隔秒(默认8), minChars: 参与比较的最短字数(默认5) }
 * @returns { cuts: [[s,e],...] 待剪区间(已合并), report: [{s,e,cut,kept}] 剪除清单 }
 */
export function detectRetakes(segments, opts = {}) {
  const SIM = opts.sim ?? 0.8, GAP = opts.gap ?? 8, MIN = opts.minChars ?? 5;
  const segs = (segments || []).filter((x) => x && x.z != null && x.e > x.s);
  const removed = new Set(), report = [];
  for (let i = 0; i < segs.length; i++) {
    if (removed.has(i)) continue;
    const ni = norm(segs[i].z);
    if (ni.length < MIN) continue;
    for (let j = i + 1; j <= Math.min(i + 3, segs.length - 1); j++) {
      if (removed.has(j)) continue;
      if (segs[j].s - segs[i].e > GAP) break;
      const nj = norm(segs[j].z);
      if (nj.length < MIN) continue;
      // 整句高相似(重说时说对了个别词)
      const full = simRatio(ni, nj);
      // 半句卡壳重来: 前句 ≈ 后句的开头(后句至少不短于前句才算"接着把话说完")
      const prefix = nj.length >= ni.length ? simRatio(ni, nj.slice(0, ni.length)) : 0;
      if (full >= SIM || prefix >= Math.max(SIM, 0.85)) {
        removed.add(i);
        report.push({ s: segs[i].s, e: segs[i].e, cut: segs[i].z.trim(), kept: segs[j].z.trim() });
        break; // i 已判废,不再往后配对
      }
    }
  }
  // 汇成剪切区间:边缘各留 0.05s 呼吸,太碎的(<0.3s)不值得动刀
  let cuts = report
    .map((r) => [Math.max(0, r.s - 0.05), r.e + 0.05])
    .filter(([s, e]) => e - s >= 0.3)
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const c of cuts) {
    const last = merged[merged.length - 1];
    if (last && c[0] <= last[1] + 0.1) last[1] = Math.max(last[1], c[1]);
    else merged.push(c);
  }
  return { cuts: merged, report };
}

/** 从保留区间列表里挖掉待剪区间: subtractRanges([[0,60]], [[10,12]]) → [[0,10],[12,60]] */
export function subtractRanges(keep, cuts) {
  let out = keep.map((x) => [...x]);
  for (const [cs, ce] of cuts) {
    const next = [];
    for (const [s, e] of out) {
      if (ce <= s || cs >= e) { next.push([s, e]); continue; }
      if (cs > s) next.push([s, cs]);
      if (ce < e) next.push([ce, e]);
    }
    out = next;
  }
  return out.filter(([s, e]) => e - s >= 0.2);
}
