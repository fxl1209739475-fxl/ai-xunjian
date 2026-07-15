// 2.0 V1 生成器 —— 数据驱动版:所有内容/时间/位置来自 timeline.json(可用版式调节器编辑)
const fs=require('fs');
const TL=JSON.parse(fs.readFileSync(__dirname+'/timeline.json','utf8'));
const allcaps=JSON.parse(fs.readFileSync(__dirname+'/'+TL.meta.capsFile,'utf8'));
const DIR=__dirname+'/hf';
const PREVIEW=process.env.FULL?false:true;
const DUR=PREVIEW?TL.meta.durPreview:TL.meta.dur;
const CAM=PREVIEW?TL.meta.cam.preview:TL.meta.cam.full;
const B=TL.boxes;
const caps=allcaps.filter(c=>c.s<DUR-0.2);
const TITLE=TL.meta.title;
const COLORS={cyan:'var(--cyan)',amber:'#ffb020',coral:'#ff7a59',gold:'#f5b93d',red:'#f04438',green:'#3ddc84',blue:'#4c8dff'};
const col=c=>COLORS[c]||c;
const CY=COLORS.cyan,CO=COLORS.coral;
const chapters=TL.chapters.filter(c=>c.s<DUR);
const pops=TL.pops.map(p=>({...p,c:col(p.c)})).filter(p=>p.s<DUR);
const cards=TL.cards.filter(c=>c.s<DUR);
const CHIP_T=PREVIEW?null:TL.chipT;
const kw=(zh,c)=>zh.replace(/\|([^|]+)\|/g,`<em class="kw" style="color:${c}">$1</em>`);
const HASEN=TL.chapters.some(c=>c.en);
const chapHTML=()=>`  <div class="chap">`+chapters.map(c=>`<div class="cseg" style="flex:${(Math.min(c.e,DUR)-c.s).toFixed(0)}"><span class="cn">${c.n} ${c.lab}</span>${c.en?`<span class="cen">${c.en}</span>`:''}<i class="cfill" id="cf-${c.n}"></i></div>`).join('')+`</div>`;
const popHTML=()=>pops.map((b,i)=>{
 const pos=(b.x!=null||b.y!=null)?` style="${b.x!=null?`left:${b.x}px;`:''}${b.y!=null?`top:${b.y}px;`:''}"`:'';
 const sz=b.size?` style="font-size:${b.size}px"`:'';
 return `  <div class="beat clip" id="pop${i}" data-start="${b.s}" data-duration="${(Math.min(b.e,DUR)-b.s).toFixed(2)}" data-track-index="${60+i}"${pos}>
    <div class="blab" style="--c:${b.c}">${b.lab}</div><div class="bzh"${sz}>${kw(b.zh,b.c)}</div><div class="bu" style="--c:${b.c}"></div></div>`;}).join('\n');
// 卡片内容全部来自 timeline.json(可在真片编辑器里改)
function cardInner(c){
 if(c.type==='list'||c.type==='scene'||c.type==='pain'){
  const tc=col(c.tc||'cyan');
  const rows=(c.rows||[]).map(r=>`<div class="prow"><span class="px${r.i==='ok'?' ok':''}">${r.i==='ok'?'✓':'✕'}</span>${r.t}</div>`).join('\n   ');
  return `<div class="ptitle">${kw(c.title||'',tc)}</div>
   <div class="prows">
   ${rows}</div>`;
 }
 if(c.type==='tool'){
  const chips=(c.chips||[]).map((t,i)=>`<span class="chip${i===c.chipHl?' hl':''}">${t}</span>`).join('<span class="plus">+</span>');
  return `<div class="tlab">${c.lab||''}</div>
   <div class="tbig">${kw(c.big||'',CY)}</div>
   <div class="tswap">${chips}</div>
   <div class="tsub">${(c.sub||'').replace(/\|([^|]+)\|/g,'<b>$1</b>')}</div>`;
 }
 if(c.type==='quote')return `<div class="qmark">“</div><div class="qtext">${kw(c.text||'',col(c.tc||'cyan'))}</div>${c.by?`<div class="qby">— ${c.by}</div>`:''}`;
 if(c.type==='stat'){const R=(2*Math.PI*86).toFixed(1);return `<div class="statwrap"><svg class="ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="16"/><circle class="statc" cx="100" cy="100" r="86" fill="none" stroke="${CY}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${R}" stroke-dashoffset="${R}" transform="rotate(-90 100 100)"/></svg><div class="statn"><b class="statnum" style="color:${CY}">0</b><span>${c.unit||''}</span></div></div><div class="statcap">${kw(c.cap||'',CY)}</div>`;}
 if(c.type==='compare'){const win=c.winner||'right';return `<div class="cmpwrap"><div class="cmpcol cmpl${win==='left'?' winner':''}"><div class="cmpt">${c.ltitle||''}</div>${(c.lrows||[]).map(t=>`<div class="cmprow">${t}</div>`).join('')}${win==='left'?'<div class="cmpwin">推荐</div>':''}</div><div class="cmpvs">VS</div><div class="cmpcol cmprr${win==='right'?' winner':''}"><div class="cmpt" style="color:${CY}">${c.rtitle||''}</div>${(c.rrows||[]).map(t=>`<div class="cmprow">${t}</div>`).join('')}${win==='right'?'<div class="cmpwin">推荐</div>':''}</div></div>`;}
 if(c.type==='alert')return `<div class="alwrap"><div class="alico">⚠</div><div class="albody"><div class="alt">${kw(c.title||'',CO)}</div><div class="alx">${c.text||''}</div></div></div>`;
 if(c.type==='tags')return `<div class="tagwrap">${(c.chips||[]).map((t,i)=>`<span class="tag${i===c.chipHl?' hl':''}">${t}</span>`).join('')}</div>${c.cap?`<div class="tagcap">${c.cap}</div>`:''}`;
 if(c.type==='line')return `<div class="c1lab">${kw(c.cap||'',CY)}</div><svg class="lc" viewBox="0 0 700 340"><polyline class="lcp" points="${c.pts||'20,300 180,260 340,280 500,170 660,60'}" fill="none" stroke="${CY}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1400" stroke-dashoffset="1400"/></svg>`;

 if(c.type==='stamp')return `<div class="stampwrap"><div class="stamp" style="color:${col(c.tc||'red')}">${c.text||''}${c.sub?`<span>${c.sub}</span>`:''}</div></div>`;
 if(c.type==='formula')return `<div class="fwrap">${(c.parts||[]).map((p,i)=>`${i>0?`<span class="fop o${i}">${(i===(c.parts.length-1))?'=':'×'}</span>`:''}<span class="fpart p${i}" style="color:${col(p.c||'#fff')}">${p.t}</span>`).join('')}</div>`;
 if(c.type==='strike')return `<div class="sk-old">“${c.old||''}”<i class="sk-line"></i></div><div class="sk-new">${kw(c.next||'',col(c.tc||'blue'))}</div>`;
 if(c.type==='dots'){const n=Math.min(Number(c.count)||100,160);const dc=col(c.tc||'cyan');return `<div class="dotswrap"><div class="dlabel">${kw(c.label||'',dc)}</div><div class="dgrid">${Array.from({length:n},()=>`<i style="background:${dc};box-shadow:0 0 6px ${dc}"></i>`).join('')}</div>${c.flipLabel?`<div class="dlabel dflip">${kw(c.flipLabel,col(c.flipTc||'red'))}</div>`:''}</div>`;}
 if(c.type==='bignum')return `<div class="bnwrap"><div class="bnrow">${c.prefix?`<span class="bnpre" style="color:${col(c.tc||'cyan')}">${c.prefix}</span>`:''}<span class="bnnum bncnt">0</span><span class="bnunit">${c.unit||''}</span></div>${c.note?`<div class="bnnote">${c.note}</div>`:''}</div>`;
 if(c.type==='chain')return `<div class="chwrap">${(c.items||[]).map((t,i)=>`${i>0?`<span class="charr">${c.arrow||'→'}</span>`:''}<span class="chitem${i===c.chipHl?' hl':''}">${t}</span>`).join('')}</div>`;

 if(c.type==='highlight')return `<div class="hlwrap">${c.title?`<div class="hlt">${kw(c.title,col(c.tc||'gold'))}</div>`:''}${(c.lines||[]).map((l,i)=>`<div class="hlline"><i class="hlbar hb${i}"></i><span>${l}</span></div>`).join('')}</div>`;
 if(c.type==='wall'){const cols=Number(c.cols)||3;return `<div class="wallgrid" style="grid-template-columns:repeat(${cols},1fr)">${(c.items||[]).slice(0,24).map(t=>`<span class="wcard"><i></i>${t}</span>`).join('')}</div>`;}
 if(c.type==='progress'){const pc=col(c.tc||'green');return `<div class="pgwrap"><div class="pglabel">${kw(c.label||'',pc)}</div><div class="pgbar"><div class="pgfill" style="background:${pc};color:${pc}"></div></div>${(c.tags||[]).length?`<div class="pgtags">${(c.tags||[]).map(t=>`<span class="pgtag">${t}</span>`).join('')}</div>`:''}</div>`;
 }
 if(c.type==='roadmap')return `<div class="rmwrap"><i class="rmline"></i>${(c.items||[]).map((t,i)=>`<div class="rmnode${i===c.chipHl?' hl':''}"><i></i><span>${t}</span></div>`).join('')}</div>`;
 // ===== 柱子哥最新 10 条增量组件(2026-07-10) =====
 if(c.type==='curveplot'){
  const series=(c.series||[]).slice(0,3).filter(s=>Array.isArray(s.values)&&s.values.length>1);
  const values=series.flatMap(s=>s.values.map(Number).filter(Number.isFinite));const lo=Math.min(...values,0),hi=Math.max(...values,1);const span=Math.max(1,hi-lo);
  const pointStr=v=>v.map((n,i)=>`${28+i*(704/Math.max(1,v.length-1))},${292-(Number(n)-lo)/span*242}`).join(' ');
  const labels=c.labels||[];
  return `<div class="cptop"><div><small>${c.kicker||'TREND'}</small><b>${kw(c.title||'趋势正在分化',CY)}</b></div><div class="cplegend">${series.map((s,i)=>`<span style="--sc:${col(s.color||['cyan','coral','gold'][i])}"><i></i>${s.name||`趋势${i+1}`}</span>`).join('')}</div></div><svg class="cpsvg" viewBox="0 0 760 330"><g class="cpgrid"><path d="M28 50H732M28 131H732M28 212H732M28 293H732"/></g>${series.map((s,i)=>{const color=col(s.color||['cyan','coral','gold'][i]);const pts=pointStr(s.values);return `<g class="cpseries s${i}" style="--sc:${color}"><polyline class="cpline" points="${pts}"/><g class="cpnodes">${pts.split(' ').map((p,j)=>{const [x,y]=p.split(',');return `<circle class="cpnode n${j}" cx="${x}" cy="${y}" r="8"/>`;}).join('')}</g></g>`;}).join('')}<g class="cplabels">${labels.map((t,i)=>`<text x="${28+i*(704/Math.max(1,labels.length-1))}" y="323">${t}</text>`).join('')}</g></svg>${c.note?`<div class="cpnote">${kw(c.note,col(c.tc||'gold'))}</div>`:''}`;
 }
 if(c.type==='flywheel'){
  const nodes=(c.nodes||[]).slice(0,8);const r=38;
  return `<div class="fwtitle"><small>${c.kicker||'DATA FLYWHEEL'}</small><b>${kw(c.title||'越用越强',CY)}</b></div><div class="fwstage"><svg class="fwsvg" viewBox="0 0 500 500"><circle class="fwring" cx="250" cy="250" r="176"/><path class="fwarrow" d="M410 178l26 12-24 16"/></svg><div class="fwcore"><span>${c.center||'AI'}</span><small>${c.centerSub||'持续进化'}</small></div>${nodes.map((t,i)=>{const a=-Math.PI/2+i*2*Math.PI/nodes.length;return `<div class="fwnode n${i}" style="left:${50+Math.cos(a)*r}%;top:${50+Math.sin(a)*r}%"><i>${String(i+1).padStart(2,'0')}</i><span>${t}</span></div>`;}).join('')}</div>${c.cap?`<div class="fwcap">${kw(c.cap,col(c.tc||'green'))}</div>`:''}`;
 }
 if(c.type==='criteria'){
  const rows=(c.rows||[]).slice(0,6);const ico={pass:'✓',warn:'!',fail:'×'};
  return `<div class="crhead"><small>${c.kicker||'DECISION FILTER'}</small><b>${kw(c.title||'判断标准',CY)}</b></div><div class="crrows">${rows.map((r,i)=>`<div class="crrow ${r.state||'pass'}"><i>${ico[r.state]||'•'}</i><b>${r.label||''}</b><span>${r.note||''}</span></div>`).join('')}</div>${c.verdict?`<div class="crverdict ${c.verdictState||'pass'}">${c.verdict}</div>`:''}`;
 }
 if(c.type==='evidencefocus'){
  const src=c.src?(String(c.src).startsWith('assets/')?c.src:`assets/${c.src}`):'';const focus=(c.focus||[]).slice(0,5);
  return `<div class="efhead"><small>${c.kicker||'SOURCE'}</small><b>${kw(c.title||'原文证据',CY)}</b></div><div class="efstage">${src?`<img class="efimg" src="${src}"/>`:`<div class="efdoc"><i></i><i></i><i></i><i></i><i></i><i></i></div>`}<div class="efshade"></div>${focus.map((f,i)=>`<div class="effocus f${i}" style="left:${Number(f.x)||8}%;top:${Number(f.y)||12}%;width:${Number(f.w)||70}%;height:${Number(f.h)||12}%"><span>${f.label||'重点'}</span></div>`).join('')}</div>${c.source?`<div class="efsource">${c.source}</div>`:''}`;
 }
 // ===== 自建 UI 复刻组件(gpt56-0710:档位滑条/模式切换器/聊天变网页/推文卡) =====
 if(c.type==='uislider')return `<div class="uslab-row"><div class="uslab">${c.lab||'高级'} ›</div><div class="usbolt">⚡</div></div><div class="ustrack"><div class="usfill"></div><div class="usknob"></div></div><div class="usticks">${(c.ticks||[]).map(t=>`<span class="ustick">${t}</span>`).join('')}</div><div class="usval">${kw(c.val||'',col(c.tc||'#e8703d'))}</div>`;
 if(c.type==='uiswitch')return `<div class="uswt"><b>${c.title||'ChatGPT'}</b><span class="uswt2">${c.title2||''}</span><span class="uswcar">▾</span></div>${(c.items||[]).map((it,i)=>`<div class="uswrow r${i}"><span class="uswhl"></span><span class="uswcol"><span class="uswname">${it.t}</span><span class="uswsub">${it.sub||''}</span></span><span class="uswck">✓</span></div>`).join('')}`;
 if(c.type==='uisite')return `<div class="stbub">${c.bubble||'聊好的需求'}</div><div class="starr">→</div><div class="stbrow"><div class="stchrome"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><div class="sturl">${c.url||'chatgpt.com/sites'}</div></div><div class="stbody"><div class="sblk sb-nav"></div><div class="sblk sb-hero"></div><div class="sblk sb-l1"></div><div class="sblk sb-l2"></div><div class="sb-btns"><div class="sblk sb-btn"></div><div class="sblk sb-btn ghost"></div></div></div></div>`;
 if(c.type==='tweet')return `<div class="twhead"><div class="twav">${c.avatar||'C'}</div><div class="twnames"><span class="twname">${c.name||''}<span class="twbadge">✓</span></span><span class="twhandle">${c.handle||''}</span></div></div><div class="twbody">${c.text||''}</div>${c.zh?`<div class="twzh">${c.zh}</div>`:''}${c.foot?`<div class="twfoot">${c.foot}</div>`:''}`;
 // ===== 内容生产流水线专属组件（参数全部来自 timeline.json） =====
 if(c.type==='pipeline')return `<div class="plowner"><span>● REC</span><b>${c.owner||'我只负责拍'}</b></div><div class="plrail"><i></i>${(c.steps||[]).map((t,i)=>`<div class="plstep ps${i}"><span>${String(i+1).padStart(2,'0')}</span><b>${t}</b></div>`).join('')}</div>${c.cap?`<div class="plcap">${kw(c.cap,CY)}</div>`:''}`;
 if(c.type==='ingest')return `<div class="igrow"><div class="igbox igsrc"><small>INPUT</small><b>${c.input||'拍摄原片'}</b></div><div class="igarr">→</div><div class="igcore">AI</div><div class="igarr">→</div><div class="igbox igout"><small>OUTPUT</small><b>${c.output||'可剪时间线'}</b></div></div><div class="igwave">${Array.from({length:28},(_,i)=>`<i style="height:${22+(i*17%76)}px"></i>`).join('')}</div><div class="igtags">${(c.tags||[]).map(t=>`<span>${t}</span>`).join('')}</div>`;
 if(c.type==='matcher')return `<div class="mtgrid"><div class="mtside mtleft">${(c.materials||[]).map(t=>`<span>${t}</span>`).join('')}</div><div class="mtcore"><b>AI</b><small>${c.core||'语义理解'}</small><i></i></div><div class="mtside mtright">${(c.slots||[]).map((t,i)=>`<span><em>${String(i+1).padStart(2,'0')}</em>${t}</span>`).join('')}</div></div>${c.cap?`<div class="mtcap">${c.cap}</div>`:''}`;
 if(c.type==='coverfan')return `<div class="cvstage">${(c.images||[]).map((src,i)=>`<div class="cvcard cv${i}"><img src="assets/${src}"/><span>方案 ${i+1}</span></div>`).join('')}</div><div class="cvcap">${kw(c.cap||'一次生成 |3 版封面|',CY)}</div>`;
 if(c.type==='publishmatrix')return `<div class="pmcmd">“${c.command||'你去发'}”</div><div class="pmhub">AI<i></i></div><div class="pmgrid">${(c.platforms||[]).map(t=>`<span>${t}</span>`).join('')}</div>${c.cap?`<div class="pmcap">${kw(c.cap,CY)}</div>`:''}`;
 if(c.type==='industrysplit')return `<div class="iscols"><div class="isside isold"><small>${c.oldLab||'旧方式'}</small><b>${c.old||'还在憋视频'}</b><div class="isbar"><i></i></div><em>${c.oldSub||'慢 / 重 / 人工'}</em></div><div class="isvs">VS</div><div class="isside isnew"><small>${c.newLab||'新方式'}</small><b>${c.newer||'已经量产内容'}</b><div class="isbar"><i></i></div><em>${c.newSub||'快 / 轻 / 自动'}</em></div></div>`;
 return '';
 return '';
}
const cardHTML=()=>cards.map((c,i)=>{const pos=(c.x!=null||c.y!=null||c.w!=null||c.h!=null)?` style="${c.x!=null?`left:${c.x}px;`:''}${c.y!=null?`top:${c.y}px;`:''}${c.w!=null?`width:${c.w}px;`:''}${c.h!=null?`height:${c.h}px;`:''}"`:'';return `  <div id="${c.id}" class="fcard ${c.type}${c.bare?' bare':''} clip" data-start="${c.s}" data-duration="${(Math.min(c.e,DUR)-c.s).toFixed(2)}" data-track-index="${30+i}"${pos}>${cardInner(c)}</div>`;}).join('\n');
// 媒体元素(插图/插视频):wrapper 和内层视频都是 clip,同时出现消失(防 wrapper 留黑)
const media=(TL.media||[]).map(m=>({...m})).filter(m=>m.s<DUR);
const mediaHTML=()=>media.map((m,i)=>{
 const dur=(Math.min(m.e,DUR)-m.s).toFixed(2);
 const inner=m.type==='video'
  ?`<video id="mdv${i}" class="clip" data-start="${m.s}" data-duration="${dur}" data-track-index="${201+2*i}" src="${m.src}" muted playsinline></video>`
  :`<img src="${m.src}" alt=""/>`;
 const tilt=m.tilt?`transform:rotate(${m.tilt}deg);`:'';
 // 视频型 media:外框不做计时元素(渲染器不支持嵌套计时媒体,会冻结),可见性由 GSAP set 控制
 const timed=m.type==='video'?'':` data-start="${m.s}" data-duration="${dur}" data-track-index="${200+2*i}"`;
 return `  <div id="md${i}" class="mframe f-${m.frame||'none'}${m.scroll?' mscroll':''}${m.type==='video'?'':' clip'}"${timed} style="left:${m.x}px;top:${m.y}px;width:${m.w}px;height:${m.h}px;${tilt}">${inner}</div>`;
}).join('\n');
const capInner=z=>[...z].map(ch=>`<span class="cc">${ch}</span>`).join('');
const capHTML=()=>caps.map((c,i)=>`  <div class="cap clip" id="cap-${i}" data-start="${c.s}" data-duration="${(Math.min(c.e,DUR)-c.s).toFixed(2)}" data-track-index="${100+i}"><div class="ct">${capInner(c.z)}</div></div>`).join('\n');

const html=`<!doctype html>
<html lang="zh"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:"HSGB";font-weight:100 550;src:url("fonts/hsgb-w3.woff2") format("woff2");font-display:block}
@font-face{font-family:"HSGB";font-weight:551 900;src:url("fonts/hsgb-w6.woff2") format("woff2");font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#0a0e16;font-family:"HSGB","PingFang SC","Hiragino Sans GB",sans-serif;-webkit-font-smoothing:antialiased}
:root{--ink:#eef4f7;--muted:#9fb2c0;--cyan:#2ee6d6}
#cam{position:absolute;left:0;top:${B.cam.y}px;width:1080px;height:${B.cam.h}px;object-fit:cover;z-index:1}
.scrim-t{position:absolute;left:0;top:0;width:1080px;height:320px;background:linear-gradient(180deg,rgba(8,11,17,.97),rgba(8,11,17,.4) 60%,transparent);z-index:2}
.scrim-b{position:absolute;left:0;top:${B.cam.y+B.cam.h-200}px;width:1080px;height:200px;background:linear-gradient(0deg,rgba(8,11,17,.92),transparent);z-index:2}
.botband{position:absolute;left:0;top:${B.cam.y+B.cam.h}px;width:1080px;height:${1920-(B.cam.y+B.cam.h)}px;background:#070a10;z-index:3}
.chap{position:absolute;top:${B.chap.y}px;left:40px;width:1000px;height:${HASEN?56:40}px;z-index:62;display:flex;gap:8px}
.cseg{position:relative;height:${HASEN?56:40}px;border-radius:9px;background:rgba(255,255,255,.10);overflow:hidden}
.cseg .cen{position:absolute;left:15px;top:32px;z-index:2;color:rgba(255,255,255,.45);font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;white-space:nowrap}
.cseg .cn{position:absolute;left:14px;top:7px;z-index:2;color:rgba(255,255,255,.78);font-size:22px;font-weight:800;white-space:nowrap}
.cseg .cfill{position:absolute;inset:0;background:linear-gradient(90deg,rgba(46,230,214,.55),rgba(122,247,236,.55));transform:scaleX(0);transform-origin:left;box-shadow:0 0 10px rgba(46,230,214,.5)}
.title{position:absolute;top:${B.title.y}px;left:0;width:1080px;text-align:center;z-index:60;color:#fff;font-size:60px;font-weight:900;letter-spacing:1px;text-shadow:0 3px 14px rgba(0,0,0,.85)}
.title em{color:var(--cyan);font-style:normal}
.beat{position:absolute;left:${B.beat.x}px;top:${B.beat.y}px;width:${B.beat.w}px;z-index:40}
.beat .blab{color:var(--c);font-size:34px;font-weight:800;letter-spacing:1px;text-shadow:0 2px 10px rgba(0,0,0,.95)}
.beat .bzh{margin-top:6px;color:#fff;font-size:74px;font-weight:900;line-height:1.08;text-shadow:0 3px 16px rgba(0,0,0,.95)}
.beat .bzh .kw{display:inline-block;font-size:1.1em;font-style:normal}
.beat .bu{margin-top:12px;width:120px;height:7px;border-radius:4px;background:var(--c);box-shadow:0 0 12px var(--c)}
.cap{position:absolute;left:0;top:${B.cap.y}px;width:1080px;z-index:50;text-align:center}
.cap .ct{display:inline-block;padding:9px 26px;border-radius:14px;background:rgba(8,11,17,.82);color:#fff;font-size:46px;font-weight:900;line-height:1.2;text-shadow:0 2px 10px rgba(0,0,0,.9)}
.cap .cc{display:inline-block}
.fcard{position:absolute;left:${B.card.x}px;top:${B.card.y}px;width:${B.card.w}px;height:${B.card.h}px;border-radius:26px;z-index:14;background:linear-gradient(180deg,rgba(14,20,30,.97),rgba(9,13,20,.99));box-shadow:0 -6px 44px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08);padding:52px 62px;display:flex;flex-direction:column;justify-content:center;gap:26px;overflow:hidden}
.fcard .ptitle{font-size:64px;font-weight:900;color:#fff}.fcard .ptitle em{font-style:normal}
.fcard .prows{display:flex;flex-direction:column;gap:28px;margin-top:6px}
.fcard .prow{display:flex;align-items:center;gap:24px;font-size:46px;font-weight:800;color:var(--ink)}
.fcard .px{flex:none;width:58px;height:58px;border-radius:14px;background:rgba(255,122,89,.16);color:${CO};font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center}
.fcard .px.ok{background:rgba(46,230,214,.14);color:var(--cyan)}
.fcard.tool{align-items:flex-start}
.fcard.tool .tlab{color:var(--cyan);font-size:36px;font-weight:800;letter-spacing:2px}
.fcard.tool .tbig{font-size:96px;font-weight:900;color:#fff;line-height:1}.fcard.tool .tbig em{font-style:normal}
.fcard.tool .tswap{display:flex;align-items:center;gap:20px;margin-top:10px}
.fcard.tool .chip{padding:14px 34px;border:2px solid rgba(255,255,255,.2);border-radius:16px;font-size:44px;font-weight:900;color:var(--ink)}
.fcard.tool .chip.hl{background:var(--cyan);color:#06201d;border-color:var(--cyan)}
.fcard.tool .plus{font-size:44px;font-weight:900;color:var(--muted)}
.fcard.tool .tsub{font-size:42px;font-weight:800;color:var(--muted)}.fcard.tool .tsub b{color:#fff}
.fcard .qmark{font-size:110px;line-height:.6;color:var(--cyan);font-weight:900}
.fcard .qtext{font-size:60px;font-weight:900;color:#fff;line-height:1.32}
.fcard .qby{font-size:36px;font-weight:700;color:var(--muted)}
.statwrap{display:flex;align-items:center;gap:36px;position:relative}
.statwrap .ring{width:250px;height:250px;flex:none}
.statwrap .statn{position:absolute;left:0;width:250px;text-align:center;top:82px}
.statwrap .statn b{font-size:100px;font-weight:900}.statwrap .statn span{font-size:38px;font-weight:800;color:var(--ink)}
.statcap{font-size:50px;font-weight:900;color:#fff;margin-top:8px}
.cmpwrap{display:flex;align-items:stretch;gap:22px;width:100%}
.cmpcol{flex:1;display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.04);border-radius:18px;padding:24px}
.cmpcol{position:relative;border:2px solid transparent;transition:border-color .2s,box-shadow .2s}
.cmpcol.winner{border-color:rgba(46,230,214,.7);box-shadow:0 0 26px rgba(46,230,214,.18);background:rgba(46,230,214,.08)}
.cmpwin{position:absolute;right:16px;top:-18px;padding:7px 16px;border-radius:999px;background:var(--cyan);color:#06201d;font-size:24px;font-weight:900;box-shadow:0 0 14px rgba(46,230,214,.5)}
.cmpt{font-size:42px;font-weight:900;color:var(--muted)}
.cmprow{font-size:36px;font-weight:700;color:var(--ink)}
.cmpvs{align-self:center;font-size:42px;font-weight:900;color:var(--cyan)}
.alwrap{display:flex;gap:24px;align-items:flex-start;border-left:10px solid #ff7a59;background:rgba(255,122,89,.10);border-radius:0 18px 18px 0;padding:28px 32px}
.alico{font-size:60px}
.alt{font-size:50px;font-weight:900;color:#fff}
.alx{font-size:36px;font-weight:700;color:var(--muted);margin-top:8px;line-height:1.4}
.tagwrap{display:flex;flex-wrap:wrap;gap:18px}
.tag{padding:14px 28px;border:2px solid rgba(255,255,255,.2);border-radius:999px;font-size:38px;font-weight:900;color:var(--ink)}
.tag.hl{background:var(--cyan);color:#06201d;border-color:var(--cyan)}
.tagcap{font-size:36px;color:var(--muted);font-weight:700;margin-top:6px}
.fcard .c1lab{color:var(--cyan);font-size:38px;font-weight:800;letter-spacing:2px;align-self:flex-start}
.fcard .lc{width:740px;height:320px}
.mframe{position:absolute;z-index:30;overflow:hidden;border-radius:6px}
.mframe img,.mframe video{width:100%;height:100%;object-fit:cover;display:block}
.mframe.f-glass{border-radius:22px;border:2px solid rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(46,230,214,.25),0 14px 40px rgba(0,0,0,.5),0 0 24px rgba(46,230,214,.18);background:rgba(14,20,30,.4)}
.mframe.f-polaroid{border-radius:8px;border:14px solid #f5f2ea;border-bottom-width:44px;box-shadow:0 16px 44px rgba(0,0,0,.55)}
.mframe.f-round{border-radius:28px;border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 36px rgba(0,0,0,.5)}
.mframe.f-glow{border-radius:18px;border:2px solid rgba(46,230,214,.75);box-shadow:0 0 18px rgba(46,230,214,.45),0 0 44px rgba(46,230,214,.2)}
.mframe.f-stroke{border-radius:12px;border:2px solid rgba(255,255,255,.55)}
/* ===== 柱子哥系预设(2026-07-07 对标拆解移植) ===== */
.stampwrap{display:flex;align-items:center;justify-content:center;width:100%}
.stamp{transform:rotate(-8deg);border:6px solid currentColor;border-radius:14px;padding:18px 44px;font-size:76px;font-weight:900;letter-spacing:4px;text-align:center;opacity:.94}
.stamp span{display:block;font-size:26px;letter-spacing:6px;margin-top:6px;opacity:.85}
.fwrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px;width:100%}
.fpart{font-size:62px;font-weight:900;text-shadow:0 3px 14px rgba(0,0,0,.6)}
.fop{font-size:52px;font-weight:900;color:var(--muted)}
.sk-old{font-size:60px;font-weight:900;color:#fff;position:relative;display:inline-block;align-self:flex-start}
.sk-line{position:absolute;left:-4%;top:52%;width:108%;height:7px;background:#f04438;border-radius:4px;transform:scaleX(0);transform-origin:left center;box-shadow:0 0 10px rgba(240,68,56,.6)}
.sk-new{font-size:76px;font-weight:900;color:#fff;margin-top:14px;align-self:flex-start}
.dotswrap{display:flex;flex-direction:column;gap:20px;width:100%}
.dlabel{font-size:54px;font-weight:900;color:#fff}
.dgrid{display:flex;flex-wrap:wrap;gap:10px;width:100%}
.dgrid i{width:24px;height:24px;border-radius:50%}
.dflip{opacity:0}
.bnwrap{display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.bnrow{display:flex;align-items:baseline;gap:12px}
.bnpre{font-size:66px;font-weight:900}
.bnnum{font-size:145px;font-weight:900;line-height:1;color:#fff;text-shadow:0 0 24px rgba(255,255,255,.25)}
.bnunit{font-size:50px;font-weight:800;color:var(--muted)}
.bnnote{padding:10px 24px;border-radius:999px;background:rgba(255,255,255,.08);font-size:32px;font-weight:700;color:var(--ink)}
.chwrap{display:flex;align-items:center;flex-wrap:wrap;gap:16px;width:100%;justify-content:center}
.chitem{padding:16px 28px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.18);border-radius:16px;font-size:40px;font-weight:900;color:var(--ink)}
.chitem.hl{background:var(--cyan);color:#06201d;border-color:var(--cyan)}
.charr{font-size:42px;font-weight:900;color:var(--muted)}
.mframe.f-white{border-radius:16px;border:10px solid #fff;box-shadow:0 18px 50px rgba(0,0,0,.55)}
.mframe.f-redbox{border-radius:14px;border:4px solid #f04438;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.hlwrap{display:flex;flex-direction:column;gap:16px;width:100%}
.hlt{font-size:52px;font-weight:900;color:#fff}
.hlline{position:relative;font-size:42px;font-weight:800;color:#fff;padding:8px 14px;line-height:1.35}
.hlline .hlbar{position:absolute;left:0;top:8%;height:84%;width:100%;background:rgba(245,197,66,.45);transform:scaleX(0);transform-origin:left center;border-radius:8px}
.hlline span{position:relative}
.wallgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%}
.wcard{background:#f7f7f9;color:#141414;border-radius:10px;padding:14px 16px;font-size:28px;font-weight:700;display:flex;gap:10px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.wcard i{flex:none;width:14px;height:14px;border-radius:4px}
.wcard:nth-child(4n+1) i{background:#f5913d}.wcard:nth-child(4n+2) i{background:#3ddc84}.wcard:nth-child(4n+3) i{background:#8f7bff}.wcard:nth-child(4n) i{background:#4c8dff}
.pgwrap{display:flex;flex-direction:column;gap:18px;width:100%}
.pglabel{font-size:48px;font-weight:900;color:#fff}
.pgbar{width:100%;height:22px;border-radius:12px;background:rgba(255,255,255,.10);overflow:hidden}
.pgfill{height:100%;border-radius:12px;transform:scaleX(0);transform-origin:left center;box-shadow:0 0 14px currentColor}
.pgtags{display:flex;gap:14px}
.pgtag{padding:8px 20px;border-radius:999px;background:rgba(255,255,255,.08);font-size:28px;font-weight:700;color:var(--ink)}
.rmwrap{position:relative;display:flex;justify-content:space-between;width:100%;padding:10px 8px 0}
.rmwrap .rmline{position:absolute;left:4%;right:4%;top:26px;height:5px;background:rgba(255,255,255,.15);border-radius:3px;transform:scaleX(0);transform-origin:left center}
.rmnode{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.rmnode i{width:26px;height:26px;border-radius:50%;background:#8aa0b0;box-shadow:0 0 10px rgba(255,255,255,.2)}
.rmnode.hl i{background:#f5b93d;box-shadow:0 0 16px rgba(245,185,61,.7)}
.rmnode span{font-size:36px;font-weight:800;color:var(--ink)}
.rmnode.hl span{color:#f5b93d}
/* ===== 柱子哥最新 10 条增量组件(2026-07-10) ===== */
.fcard.curveplot,.fcard.flywheel,.fcard.criteria,.fcard.evidencefocus{padding:38px 48px;gap:14px}
.cptop,.crhead,.efhead{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.cptop>div:first-child,.crhead,.efhead{flex-direction:column}
.cptop small,.fwtitle small,.crhead small,.efhead small{display:block;color:#7e98a8;font-size:23px;font-weight:900;letter-spacing:2px}.cptop b,.fwtitle b,.crhead b,.efhead b{display:block;margin-top:5px;color:#fff;font-size:48px;line-height:1.08}.cptop b em,.fwtitle b em,.crhead b em,.efhead b em{font-style:normal}
.cplegend{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px 16px;max-width:46%}.cplegend span{display:flex;align-items:center;gap:8px;color:#c8d4da;font-size:24px;font-weight:800}.cplegend i{width:18px;height:6px;border-radius:3px;background:var(--sc);box-shadow:0 0 8px var(--sc)}
.cpsvg{width:100%;height:325px;overflow:visible}.cpgrid path{fill:none;stroke:rgba(255,255,255,.10);stroke-width:2}.cpline{fill:none;stroke:var(--sc);stroke-width:8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1600;stroke-dashoffset:1600;filter:drop-shadow(0 0 7px var(--sc))}.cpnode{fill:#0d131d;stroke:var(--sc);stroke-width:5;opacity:0}.cplabels text{fill:#7e98a8;font-size:20px;font-weight:700;text-anchor:middle}.cpnote{align-self:flex-end;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.07);color:#fff;font-size:26px;font-weight:800}.cpnote em{font-style:normal}
.fcard.flywheel{padding:28px 44px}.fwtitle{text-align:center}.fwstage{position:relative;width:520px;height:300px;align-self:center}.fwsvg{position:absolute;left:110px;top:0;width:300px;height:300px;overflow:visible}.fwring{fill:none;stroke:rgba(46,230,214,.35);stroke-width:5;stroke-dasharray:18 12;stroke-dashoffset:900}.fwarrow{fill:none;stroke:var(--cyan);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}.fwcore{position:absolute;left:50%;top:50%;width:118px;height:118px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#51f1e3,#0e726a 72%);box-shadow:0 0 45px rgba(46,230,214,.45);color:#041a18}.fwcore span{font-size:43px;font-weight:1000}.fwcore small{font-size:17px;font-weight:900}.fwnode{position:absolute;min-width:116px;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:12px;background:rgba(10,15,23,.94);border:2px solid rgba(255,255,255,.14);box-shadow:0 8px 22px rgba(0,0,0,.4)}.fwnode i{font-style:normal;color:var(--cyan);font-size:17px;font-weight:900}.fwnode span{white-space:nowrap;color:#fff;font-size:23px;font-weight:900}.fwnode.active{border-color:var(--cyan);box-shadow:0 0 22px rgba(46,230,214,.45)}.fwcap{text-align:center;color:#fff;font-size:29px;font-weight:900}.fwcap em{font-style:normal}
.crhead{display:flex}.crrows{display:grid;grid-template-columns:1fr 1fr;gap:14px}.crrow{display:grid;grid-template-columns:48px 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center;padding:16px 18px;border-radius:13px;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.10)}.crrow i{grid-row:1/3;width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:28px;font-weight:1000}.crrow b{color:#fff;font-size:29px}.crrow span{color:#879aa7;font-size:21px;font-weight:700}.crrow.pass{border-color:rgba(61,220,132,.42)}.crrow.pass i{background:rgba(61,220,132,.18);color:#3ddc84}.crrow.warn{border-color:rgba(245,185,61,.42)}.crrow.warn i{background:rgba(245,185,61,.18);color:#f5b93d}.crrow.fail{border-color:rgba(240,68,56,.42)}.crrow.fail i{background:rgba(240,68,56,.18);color:#f04438}.crverdict{align-self:flex-end;padding:9px 24px;border-radius:999px;font-size:29px;font-weight:1000}.crverdict.pass{background:#3ddc84;color:#062016}.crverdict.warn{background:#f5b93d;color:#2b1e04}.crverdict.fail{background:#f04438;color:#fff}
.efstage{position:relative;flex:1;min-height:310px;overflow:hidden;border-radius:14px;background:#eef1f3;box-shadow:0 14px 34px rgba(0,0,0,.38)}.efimg{width:100%;height:100%;object-fit:contain;display:block;background:#eef1f3}.efdoc{position:absolute;inset:0;padding:34px;background:#f5f5f2;display:flex;flex-direction:column;gap:24px}.efdoc i{height:18px;border-radius:4px;background:#b7c0c6}.efdoc i:nth-child(1){width:48%;height:28px;background:#6f7a82}.efdoc i:nth-child(3){width:82%}.efdoc i:nth-child(4){width:91%}.efdoc i:nth-child(5){width:68%}.efshade{position:absolute;inset:0;background:rgba(4,8,12,.42)}.effocus{position:absolute;border:5px solid #f5d442;border-radius:8px;box-shadow:0 0 0 999px rgba(4,8,12,.38),0 0 18px rgba(245,212,66,.6);opacity:0}.effocus span{position:absolute;right:-3px;top:-36px;padding:6px 12px;border-radius:6px;background:#f5d442;color:#251f02;font-size:20px;font-weight:1000;white-space:nowrap}.efsource{align-self:flex-end;color:#8496a4;font-size:22px;font-weight:800}
.mframe.mscroll img{height:auto;object-fit:unset}
/* ===== 自建 UI 复刻组件(gpt56-0710) ===== */
.fcard.uislider{background:#f7f3ec;box-shadow:0 18px 50px rgba(0,0,0,.55);color:#2a2118;gap:26px;justify-content:center;padding:44px 56px}
.uslab-row{display:flex;justify-content:space-between;align-items:center}
.uslab{font-size:40px;font-weight:800;color:#5d5348}
.usbolt{width:64px;height:64px;border-radius:18px;background:#f0e6d8;display:flex;align-items:center;justify-content:center;font-size:34px}
.ustrack{position:relative;width:100%;height:76px;border-radius:40px;background:#eadfce;overflow:hidden}
.usfill{position:absolute;inset:0;border-radius:40px;transform-origin:left center;background:radial-gradient(circle at 16% 38%,rgba(255,255,255,.55) 2.5px,transparent 3.5px),radial-gradient(circle at 37% 68%,rgba(255,255,255,.45) 2px,transparent 3px),radial-gradient(circle at 58% 30%,rgba(255,255,255,.5) 2px,transparent 3px),radial-gradient(circle at 78% 62%,rgba(255,255,255,.4) 2.5px,transparent 3.5px),radial-gradient(circle at 92% 42%,rgba(255,255,255,.5) 2px,transparent 3px),linear-gradient(90deg,#e0a184,#b4643f 60%,#8d4526)}
.usknob{position:absolute;top:7px;width:62px;height:62px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);left:1.5%}
.usticks{display:flex;justify-content:space-between;padding:0 6px}
.ustick{display:inline-block;font-size:34px;font-weight:800;color:#a1907c}
.usval{align-self:center;display:flex;align-items:center;gap:10px;padding:14px 36px;border-radius:999px;background:#2a2118;color:#fff;font-size:42px;font-weight:900}
.usval em{font-style:normal}
.fcard.uiswitch{background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.55);color:#1c1c1e;gap:16px;justify-content:center;padding:40px 48px}
.uswt{display:flex;gap:14px;align-items:center;font-size:40px;font-weight:800;color:#1c1c1e}
.uswt b{font-weight:900}
.uswt2{color:#7c3aed;font-weight:900}
.uswcar{color:#8e8e93;font-size:32px}
.uswrow{display:flex;align-items:center;gap:22px;padding:22px 28px;border-radius:18px;position:relative}
.uswhl{position:absolute;inset:0;border-radius:18px;background:#f2f2f7;opacity:0}
.uswcol{position:relative;display:flex;flex-direction:column;gap:4px}
.uswname{font-size:46px;font-weight:900}
.uswsub{font-size:32px;color:#8e8e93;font-weight:700}
.uswck{position:relative;margin-left:auto;font-size:44px;font-weight:900;color:#7c3aed;opacity:0}
.fcard.uisite{background:transparent;box-shadow:none;flex-direction:row;align-items:center;gap:22px;overflow:visible;padding:10px}
.stbub{flex:none;max-width:340px;background:rgba(76,141,255,.94);color:#fff;border-radius:26px 26px 26px 8px;padding:24px 30px;font-size:36px;font-weight:800;line-height:1.3;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.starr{flex:none;font-size:52px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.85)}
.stbrow{flex:1;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.55)}
.stchrome{display:flex;align-items:center;gap:10px;background:#ececf1;padding:14px 18px}
.stchrome i{width:16px;height:16px;border-radius:50%}
.sturl{flex:1;background:#fff;border-radius:999px;padding:6px 20px;font-size:24px;color:#6e6e73;font-weight:700}
.stbody{padding:22px 24px;display:flex;flex-direction:column;gap:14px}
.sblk{border-radius:10px;transform-origin:left center}
.sb-nav{height:24px;width:58%;background:#d8dbe2}
.sb-hero{height:104px;width:100%;background:linear-gradient(120deg,#4c8dff,#7c3aed);border-radius:14px}
.sb-l1{height:18px;width:88%;background:#e3e5ea}
.sb-l2{height:18px;width:70%;background:#e3e5ea}
.sb-btns{display:flex;gap:12px}
.sb-btn{height:40px;width:150px;border-radius:10px;background:#2ee6d6}
.sb-btn.ghost{background:#eef0f4;border:2px solid #d5d8df}
.fcard.tweet{background:#fff;color:#0f1419;box-shadow:0 18px 50px rgba(0,0,0,.55);gap:20px;justify-content:flex-start;padding:44px 52px}
.twhead{display:flex;align-items:center;gap:20px}
.twav{flex:none;width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#d97757,#8a4a2f);color:#fff;font-size:40px;font-weight:900;display:flex;align-items:center;justify-content:center}
.twnames{display:flex;flex-direction:column;gap:2px}
.twname{font-size:38px;font-weight:900;display:flex;align-items:center;gap:10px}
.twbadge{width:30px;height:30px;border-radius:50%;background:#1d9bf0;color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center}
.twhandle{font-size:30px;color:#536471;font-weight:700}
.twbody{font-size:42px;font-weight:800;line-height:1.35}
.twzh{font-size:36px;font-weight:700;color:#536471;line-height:1.4}
.twfoot{font-size:28px;color:#536471;font-weight:700;border-top:2px solid #eff3f4;padding-top:16px}
/* 内容生产流水线专属组件 */
.fcard.pipeline{padding:34px 42px;gap:22px;background:linear-gradient(145deg,rgba(8,17,26,.96),rgba(7,11,18,.98));border:1px solid rgba(46,230,214,.2)}
.plowner{display:flex;align-items:center;gap:18px}.plowner span{padding:9px 16px;border-radius:999px;background:rgba(240,68,56,.16);color:#ff6b61;font-size:24px;font-weight:900;letter-spacing:1px}.plowner b{font-size:50px;color:#fff}.plrail{position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;padding-top:28px}.plrail>i{position:absolute;left:5%;right:5%;top:11px;height:4px;background:linear-gradient(90deg,#ff7a59,#ffb020,#2ee6d6);transform:scaleX(0);transform-origin:left}.plstep{position:relative;padding:18px 10px;border-radius:16px;background:rgba(255,255,255,.07);text-align:center;border:1px solid rgba(255,255,255,.08)}.plstep:before{content:"";position:absolute;width:14px;height:14px;border-radius:50%;background:var(--cyan);top:-25px;left:50%;transform:translateX(-50%);box-shadow:0 0 16px rgba(46,230,214,.8)}.plstep span{display:block;color:var(--cyan);font-size:19px;font-weight:900}.plstep b{display:block;margin-top:4px;color:#fff;font-size:29px;white-space:nowrap}.plcap{font-size:34px;font-weight:900;color:#c8d6df;text-align:center}.plcap em{font-style:normal}
.fcard.ingest{padding:34px 42px;gap:24px}.igrow{display:grid;grid-template-columns:1fr 52px 100px 52px 1fr;align-items:center;gap:8px}.igbox{padding:22px 20px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);text-align:center}.igbox small{display:block;color:#90a5b5;font-size:20px;letter-spacing:2px}.igbox b{display:block;margin-top:6px;color:#fff;font-size:34px}.igcore{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--cyan);color:#06201d;font-size:38px;font-weight:900;box-shadow:0 0 28px rgba(46,230,214,.5)}.igarr{font-size:40px;color:#6f8799;text-align:center}.igwave{height:94px;display:flex;align-items:center;justify-content:center;gap:8px}.igwave i{width:12px;border-radius:8px;background:linear-gradient(180deg,#2ee6d6,#4c8dff);transform:scaleY(.08);transform-origin:center}.igtags{display:flex;justify-content:center;gap:14px}.igtags span{padding:9px 18px;border-radius:999px;background:rgba(76,141,255,.14);border:1px solid rgba(76,141,255,.34);color:#dbe8ff;font-size:27px;font-weight:800}
.fcard.matcher{padding:30px 38px;gap:18px}.mtgrid{display:grid;grid-template-columns:1fr 150px 1fr;gap:24px;align-items:center}.mtside{display:flex;flex-direction:column;gap:12px}.mtside span{padding:14px 18px;border-radius:14px;background:rgba(255,255,255,.07);color:#fff;font-size:29px;font-weight:800;border:1px solid rgba(255,255,255,.09)}.mtright span{display:flex;align-items:center;gap:12px}.mtright em{font-style:normal;color:var(--cyan);font-size:20px}.mtcore{position:relative;height:150px;border-radius:75px;background:radial-gradient(circle at 35% 30%,#7af7ec,#2ee6d6 45%,#157c78);display:flex;flex-direction:column;justify-content:center;align-items:center;color:#06201d;box-shadow:0 0 35px rgba(46,230,214,.45)}.mtcore b{font-size:46px}.mtcore small{font-size:22px;font-weight:900}.mtcore i{position:absolute;inset:-12px;border:2px solid rgba(46,230,214,.45);border-radius:50%;transform:scale(.7);opacity:0}.mtcap{text-align:center;color:#c8d6df;font-size:32px;font-weight:900}
.fcard.coverfan{padding:24px 34px 28px;overflow:visible}.cvstage{position:relative;height:344px}.cvcard{position:absolute;left:50%;top:0;width:205px;height:318px;padding:7px 7px 34px;border-radius:20px;background:#fff;box-shadow:0 18px 42px rgba(0,0,0,.55);transform-origin:center bottom}.cvcard img{width:100%;height:100%;object-fit:cover;border-radius:14px}.cvcard span{position:absolute;left:0;right:0;bottom:6px;text-align:center;color:#111827;font-size:20px;font-weight:900}.cv0{margin-left:-285px;transform:rotate(-8deg)}.cv1{margin-left:-102px;z-index:2}.cv2{margin-left:82px;transform:rotate(8deg)}.cvcap{text-align:center;color:#fff;font-size:38px;font-weight:900}.cvcap em{font-style:normal}
.fcard.publishmatrix{padding:24px 36px;gap:14px;background:radial-gradient(circle at 50% 38%,rgba(46,230,214,.15),rgba(8,12,18,.98) 58%)}.pmcmd{align-self:center;padding:11px 30px;border-radius:18px;background:#fff;color:#111827;font-size:34px;font-weight:900;box-shadow:0 12px 30px rgba(0,0,0,.4)}.pmhub{position:relative;align-self:center;width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--cyan);color:#06201d;font-size:38px;font-weight:900;box-shadow:0 0 32px rgba(46,230,214,.6)}.pmhub i{position:absolute;inset:-12px;border:2px solid rgba(46,230,214,.38);border-radius:50%}.pmgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.pmgrid span{padding:10px 8px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:24px;font-weight:800;text-align:center}.pmcap{text-align:center;color:#c8d6df;font-size:29px;font-weight:900}.pmcap em{font-style:normal}
.fcard.industrysplit{padding:36px 38px}.iscols{display:grid;grid-template-columns:1fr 74px 1fr;gap:18px;align-items:center}.isside{height:300px;padding:28px 24px;border-radius:22px;display:flex;flex-direction:column;justify-content:center;gap:16px}.isold{background:rgba(240,68,56,.12);border:1px solid rgba(240,68,56,.3)}.isnew{background:rgba(46,230,214,.12);border:1px solid rgba(46,230,214,.3)}.isside small{font-size:24px;font-weight:900;letter-spacing:2px}.isold small{color:#ff7a70}.isnew small{color:var(--cyan)}.isside b{font-size:40px;color:#fff;line-height:1.15}.isside em{font-style:normal;color:#9fb2c0;font-size:25px;font-weight:800}.isbar{height:14px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden}.isbar i{display:block;height:100%;border-radius:99px;transform:scaleX(0);transform-origin:left}.isold .isbar i{width:28%;background:#f04438}.isnew .isbar i{width:94%;background:var(--cyan)}.isvs{text-align:center;color:#fff;font-size:38px;font-weight:900}
/* bare 无底框模式:纯文字融入画面 */
/* bare 化：去掉大黑底盘（用户 2026-07-10 定），内部小芯片保留可读底 */
.fcard.pipeline.bare,.fcard.publishmatrix.bare,.fcard.ingest.bare,.fcard.matcher.bare,.fcard.coverfan.bare,.fcard.industrysplit.bare{background:transparent;border:none;box-shadow:none}
.fcard.bare .plowner b,.fcard.bare .plcap,.fcard.bare .mtcap,.fcard.bare .pmcap,.fcard.bare .cvcap,.fcard.bare .igarr{text-shadow:0 3px 16px rgba(0,0,0,.95),0 1px 4px rgba(0,0,0,.8)}
.fcard.bare .plstep,.fcard.bare .igbox,.fcard.bare .mtside span,.fcard.bare .pmgrid span{background:rgba(8,12,18,.6);backdrop-filter:blur(2px)}
.fcard.bare .isold{background:rgba(240,68,56,.16)}.fcard.bare .isnew{background:rgba(46,230,214,.16)}
/* bare 无底框模式:纯文字融入画面 */
.fcard.bare{background:transparent;box-shadow:none;padding:20px 26px;overflow:visible}
.fcard.bare .ptitle,.fcard.bare .hlt,.fcard.bare .fpart,.fcard.bare .fop,.fcard.bare .tlab,.fcard.bare .tbig,.fcard.bare .tsub,.fcard.bare .dlabel,.fcard.bare .pglabel,.fcard.bare .qtext,.fcard.bare .qby,.fcard.bare .sk-old,.fcard.bare .sk-new,.fcard.bare .prow,.fcard.bare .rmnode span,.fcard.bare .statcap,.fcard.bare .bnnum,.fcard.bare .bnunit,.fcard.bare .alt,.fcard.bare .alx{text-shadow:0 3px 16px rgba(0,0,0,.95),0 1px 4px rgba(0,0,0,.8)}
.fcard.bare .hlline{text-shadow:0 2px 10px rgba(0,0,0,.9)}
.fcard.bare .chip,.fcard.bare .chitem{background:rgba(8,12,18,.55);backdrop-filter:blur(2px)}
.fcard.bare .chip.hl,.fcard.bare .chitem.hl{background:var(--cyan);color:#06201d;text-shadow:none}
.fcard.bare .tsub b{text-shadow:0 2px 10px rgba(0,0,0,.9)}
.fcard.bare .bnnote,.fcard.bare .pgtag,.fcard.bare .tagcap{background:rgba(8,12,18,.55)}
.fcard.bare .alwrap{background:rgba(240,68,56,.13);backdrop-filter:blur(2px)}
.fcard.bare .cmpcol{background:rgba(8,12,18,.5);backdrop-filter:blur(2px)}
.fcard.bare .wcard{box-shadow:0 8px 22px rgba(0,0,0,.5)}
.fcard.bare .stamp{background:rgba(8,12,18,.6);backdrop-filter:blur(3px);box-shadow:0 0 24px rgba(240,68,56,.35),0 8px 30px rgba(0,0,0,.5)}
.scrim-t,.scrim-b,.botband{pointer-events:none}
.vignette{position:absolute;inset:0;z-index:55;pointer-events:none;background:radial-gradient(120% 78% at 50% 40%,transparent 56%,rgba(0,0,0,.42) 100%)}
.grain{position:absolute;inset:0;z-index:56;pointer-events:none;opacity:.06;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1080" data-height="1920">
  <video id="cam" class="clip" data-start="0" data-duration="${DUR}" data-track-index="0" src="assets/${CAM}" muted playsinline></video>
  <div class="scrim-t"></div><div class="scrim-b"></div><div class="botband"></div>
${chapHTML()}
  <div class="title">${kw(TITLE,'').replace(/<em class="kw" style="color:">/g,'<em>')}</div>
${popHTML()}
${cardHTML()}
${mediaHTML()}
${capHTML()}
  <div class="vignette"></div><div class="grain"></div>
</div>
<script>
window.__timelines=window.__timelines||{};
const tl=gsap.timeline({paused:true});const DUR=${DUR};
${chapters.map(c=>`tl.fromTo("#cf-${c.n}",{scaleX:0},{scaleX:1,duration:${(Math.min(c.e,DUR)-c.s).toFixed(1)},ease:"none"},${c.s});`).join('\n')}
tl.from(".title",{opacity:0,y:14,duration:.5},0);
tl.from("#cam",{opacity:0,duration:.5},0);
${pops.map((b,i)=>{
 const end=Math.min(b.e,DUR);
 let a='';
 const ent=b.entrance||'pop';
 if(ent==='fade')a=`tl.from("#pop${i}",{opacity:0,duration:.5,ease:"power1.out"},${b.s});`;
 else if(ent==='drop')a=`tl.from("#pop${i}",{opacity:0,y:-90,duration:.55,ease:"bounce.out"},${b.s});tl.from("#pop${i} .bu",{scaleX:0,transformOrigin:"left",duration:.3},${(b.s+0.45).toFixed(2)});`;
 else if(ent==='flip')a=`tl.from("#pop${i}",{opacity:0,rotationY:-75,transformPerspective:900,duration:.55,ease:"power3.out"},${b.s});tl.from("#pop${i} .bu",{scaleX:0,transformOrigin:"left",duration:.3},${(b.s+0.4).toFixed(2)});`;
 else if(ent==='stampin')a=`tl.from("#pop${i}",{opacity:0,scale:1.7,rotation:3,duration:.22,ease:"power3.in"},${b.s});tl.from("#pop${i} .bu",{scaleX:0,transformOrigin:"left",duration:.3},${(b.s+0.25).toFixed(2)});`;
 else if(ent==='glitch')a=`tl.from("#pop${i}",{opacity:0,duration:.04},${b.s});tl.to("#pop${i} .bzh",{keyframes:[{x:-5,textShadow:"-6px 0 rgba(240,68,56,.85), 6px 0 rgba(76,141,255,.85)",duration:.07},{x:4,textShadow:"5px 0 rgba(240,68,56,.85), -5px 0 rgba(76,141,255,.85)",duration:.07},{x:-2,textShadow:"-3px 0 rgba(240,68,56,.6), 3px 0 rgba(76,141,255,.6)",duration:.06},{x:0,textShadow:"0 0 0 rgba(0,0,0,0)",duration:.12}]},${(b.s+0.04).toFixed(2)});tl.from("#pop${i} .blab",{opacity:0,duration:.3},${(b.s+0.15).toFixed(2)});tl.from("#pop${i} .bu",{scaleX:0,transformOrigin:"left",duration:.3},${(b.s+0.3).toFixed(2)});`;
 else if(ent==='slide')a=`tl.from("#pop${i}",{opacity:0,x:-80,duration:.45,ease:"power3.out"},${b.s});`;
 else a=`tl.from("#pop${i} .blab",{opacity:0,x:-24,duration:.35},${b.s});tl.from("#pop${i} .bzh",{opacity:0,y:20,duration:.45,ease:"power3.out"},${(b.s+0.08).toFixed(2)});tl.from("#pop${i} .bzh .kw",{scale:.5,opacity:0,duration:.5,ease:"back.out(2.5)",transformOrigin:"left center"},${(b.s+0.2).toFixed(2)});tl.from("#pop${i} .bu",{scaleX:0,transformOrigin:"left",duration:.35},${(b.s+0.4).toFixed(2)});`;
 a+=`tl.to("#pop${i}",{opacity:0,duration:.35,ease:"power1.in"},${(end-0.4).toFixed(2)});tl.set("#pop${i}",{autoAlpha:0},${end.toFixed(2)});`;
 return a;}).join('\n')}
${cards.map(c=>{let a=`tl.from("#${c.id}",{opacity:0,y:50,duration:.5,ease:"power3.out"},${c.s});`;
 if(c.type==='list'||c.type==='scene'||c.type==='pain')a+=`tl.from("#${c.id} .ptitle",{opacity:0,y:16,duration:.4},${(c.s+0.25).toFixed(2)});tl.from("#${c.id} .prow",{opacity:0,x:-30,stagger:.25,duration:.45,ease:"power3.out"},${(c.s+0.6).toFixed(2)});`;
 if(c.type==='tool'){a+=`tl.from("#${c.id} .tbig",{opacity:0,scale:.7,duration:.55,ease:"back.out(2)"},${(c.s+0.3).toFixed(2)});`;
  const n=(c.chips||[]).length;
  if(CHIP_T&&CHIP_T.length>=n+1){const q=`#${c.id} .tswap > *`;
   for(let i=0;i<n;i++){const sel=i===0?`${q}:nth-child(1)`:`${q}:nth-child(${2*i}), ${q}:nth-child(${2*i+1})`;a+=`tl.from("${sel}",{opacity:0,y:20,duration:.4,ease:"back.out(2)"},${CHIP_T[i]});`;}
   a+=`tl.from("#${c.id} .tsub",{opacity:0,y:14,duration:.4},${CHIP_T[n]});`;}
  else a+=`tl.from("#${c.id} .chip, #${c.id} .plus",{opacity:0,y:20,stagger:.12,duration:.4,ease:"power3.out"},${(c.s+0.8).toFixed(2)});tl.from("#${c.id} .tsub",{opacity:0,y:14,duration:.4},${(c.s+1.5).toFixed(2)});`;}
 if(c.type==='quote')a+=`tl.from("#${c.id} .qmark",{opacity:0,scale:.4,duration:.5,ease:"back.out(2)"},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .qtext",{opacity:0,y:24,duration:.5,ease:"power3.out"},${(c.s+0.35).toFixed(2)});tl.from("#${c.id} .qby",{opacity:0,duration:.4},${(c.s+0.9).toFixed(2)});`;
 if(c.type==='stat'){const R=2*Math.PI*86;a+=`tl.fromTo("#${c.id} .statc",{strokeDashoffset:${R.toFixed(1)}},{strokeDashoffset:${(R*0.15).toFixed(1)},duration:1.3,ease:"power2.out"},${(c.s+0.3).toFixed(2)});{const o={n:0};tl.to(o,{n:${Number(c.num)||0},duration:1.3,ease:"power2.out",onUpdate:()=>{const el=document.querySelector("#${c.id} .statnum");if(el)el.textContent=Math.round(o.n);}},${(c.s+0.3).toFixed(2)});}tl.from("#${c.id} .statcap",{opacity:0,y:14,duration:.4},${(c.s+1.2).toFixed(2)});`;}
 if(c.type==='compare'){const first=c.winner==='left'?'.cmprr':'.cmpl';const second=c.winner==='left'?'.cmpl':'.cmprr';a+=`tl.from("#${c.id} ${first}",{opacity:0,x:${first==='.cmpl'?-46:46},duration:.45,ease:"power3.out"},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} ${first} .cmprow",{opacity:0,y:12,stagger:.12,duration:.25},${(c.s+0.45).toFixed(2)});tl.from("#${c.id} .cmpvs",{opacity:0,scale:.4,duration:.4,ease:"back.out(2.5)"},${(c.s+0.9).toFixed(2)});tl.from("#${c.id} ${second}",{opacity:0,x:${second==='.cmpl'?-46:46},duration:.48,ease:"back.out(1.45)"},${(c.s+1.15).toFixed(2)});tl.from("#${c.id} ${second} .cmprow",{opacity:0,y:12,stagger:.12,duration:.25},${(c.s+1.42).toFixed(2)});tl.from("#${c.id} .cmpwin",{opacity:0,scale:.35,duration:.35,ease:"back.out(2.8)"},${(c.s+1.9).toFixed(2)});`;}
 if(c.type==='alert')a+=`tl.from("#${c.id} .alico",{opacity:0,scale:.3,duration:.45,ease:"back.out(3)"},${(c.s+0.25).toFixed(2)});tl.from("#${c.id} .albody",{opacity:0,x:-24,duration:.45},${(c.s+0.4).toFixed(2)});`;
 if(c.type==='tags')a+=`tl.from("#${c.id} .tag",{opacity:0,y:18,scale:.7,stagger:.08,duration:.4,ease:"back.out(2)"},${(c.s+0.3).toFixed(2)});`;
 if(c.type==='line')a+=`tl.fromTo("#${c.id} .lcp",{strokeDashoffset:1400},{strokeDashoffset:0,duration:1.5,ease:"power2.inOut"},${(c.s+0.3).toFixed(2)});`;
 if(c.type==='stamp')a+=`tl.from("#${c.id} .stamp",{opacity:0,scale:1.7,rotation:4,duration:.2,ease:"power3.in"},${(c.s+0.15).toFixed(2)});`;
 if(c.type==='formula'){(c.parts||[]).forEach((p,i)=>{const t=(c.partT&&c.partT[i]!=null)?Number(c.partT[i]):c.s+0.3+i*0.9;a+=`tl.from("#${c.id} .p${i}",{opacity:0,scale:.5,duration:.35,ease:"back.out(2.5)"},${t.toFixed(2)});`;if(i>0)a+=`tl.from("#${c.id} .o${i}",{opacity:0,duration:.2},${(t-0.08).toFixed(2)});`;});}
 if(c.type==='strike'){const st=c.s+(Number(c.strikeAt)||1.4);a+=`tl.from("#${c.id} .sk-old",{opacity:0,duration:.3},${(c.s+0.2).toFixed(2)});tl.to("#${c.id} .sk-line",{scaleX:1,duration:.25,ease:"power3.in"},${st.toFixed(2)});tl.from("#${c.id} .sk-new",{opacity:0,y:22,duration:.35,ease:"power3.out"},${(st+0.25).toFixed(2)});`;}
 if(c.type==='dots'){const n=Math.min(Number(c.count)||100,160);a+=`tl.from("#${c.id} .dlabel",{opacity:0,y:14,duration:.35},${(c.s+0.15).toFixed(2)});tl.from("#${c.id} .dgrid i",{opacity:0,scale:.3,stagger:${Math.min(1.2/n,0.02).toFixed(4)},duration:.2},${(c.s+0.4).toFixed(2)});`;if(c.flipT){const fc=col(c.flipTc||'red');a+=`tl.to("#${c.id} .dgrid i",{backgroundColor:"${fc}",boxShadow:"0 0 6px ${fc}",duration:.35,stagger:.002},${Number(c.flipT).toFixed(2)});`;if(c.flipLabel)a+=`tl.to("#${c.id} .dflip",{opacity:1,duration:.3},${Number(c.flipT).toFixed(2)});`;}}
 if(c.type==='bignum'){a+=`tl.from("#${c.id} .bnrow",{opacity:0,scale:.6,duration:.35,ease:"back.out(2)"},${(c.s+0.2).toFixed(2)});{const o={n:0};tl.to(o,{n:${Number(c.num)||0},duration:${(Number(c.countDur)||1.2).toFixed(1)},ease:"power2.out",onUpdate:()=>{const el=document.querySelector("#${c.id} .bncnt");if(el)el.textContent=Math.round(o.n).toLocaleString();}},${(c.s+0.25).toFixed(2)});}`;if(c.note)a+=`tl.from("#${c.id} .bnnote",{opacity:0,y:12,duration:.3},${(c.s+1.1).toFixed(2)});`;}
 if(c.type==='chain'){a+=`tl.from("#${c.id} .chitem",{opacity:0,scale:.5,stagger:.45,duration:.3,ease:"back.out(2.5)"},${(c.s+0.3).toFixed(2)});tl.from("#${c.id} .charr",{opacity:0,stagger:.45,duration:.2},${(c.s+0.55).toFixed(2)});`;}
 if(c.type==='highlight'){a+=`tl.from("#${c.id} .hlt, #${c.id} .hlline",{opacity:0,y:14,stagger:.12,duration:.3},${(c.s+0.15).toFixed(2)});`;(c.lines||[]).forEach((l,i)=>{const t=(c.at&&c.at[i]!=null)?Number(c.at[i]):c.s+0.9+i*1.3;a+=`tl.to("#${c.id} .hb${i}",{scaleX:1,duration:.35,ease:"power2.out"},${t.toFixed(2)});`;});}
 if(c.type==='wall')a+=`tl.from("#${c.id} .wcard",{opacity:0,scale:.6,stagger:{each:.07,from:"random"},duration:.3,ease:"power2.out"},${(c.s+0.2).toFixed(2)});`;
 if(c.type==='progress'){a+=`tl.from("#${c.id} .pglabel",{opacity:0,y:12,duration:.3},${(c.s+0.15).toFixed(2)});tl.to("#${c.id} .pgfill",{scaleX:${((Math.min(Number(c.pct)||70,100))/100).toFixed(2)},duration:1.1,ease:"power2.out"},${(c.s+0.4).toFixed(2)});`;if((c.tags||[]).length)a+=`tl.from("#${c.id} .pgtag",{opacity:0,y:10,stagger:.2,duration:.3},${(c.s+1.2).toFixed(2)});`;}
 if(c.type==='roadmap')a+=`tl.to("#${c.id} .rmline",{scaleX:1,duration:.8,ease:"power2.inOut"},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .rmnode",{opacity:0,scale:.4,stagger:.4,duration:.35,ease:"back.out(2.5)"},${(c.s+0.35).toFixed(2)});`;
 if(c.type==='curveplot')a+=`tl.from("#${c.id} .cptop",{opacity:0,y:12,duration:.35},${(c.s+0.15).toFixed(2)});tl.to("#${c.id} .cpline",{strokeDashoffset:0,stagger:.35,duration:1.6,ease:"power2.inOut"},${(c.s+0.45).toFixed(2)});tl.to("#${c.id} .cpnode",{opacity:1,stagger:{each:.08,from:"start"},duration:.22,ease:"back.out(2)"},${(c.s+1.15).toFixed(2)});tl.from("#${c.id} .cpnote",{opacity:0,scale:.7,duration:.35,ease:"back.out(2)"},${(c.s+2.25).toFixed(2)});`;
 if(c.type==='flywheel'){a+=`tl.from("#${c.id} .fwtitle",{opacity:0,y:12,duration:.35},${(c.s+0.15).toFixed(2)});tl.to("#${c.id} .fwring",{strokeDashoffset:0,duration:1.15,ease:"power2.out"},${(c.s+0.35).toFixed(2)});tl.from("#${c.id} .fwcore",{opacity:0,scale:.35,duration:.5,ease:"back.out(2.6)"},${(c.s+0.65).toFixed(2)});tl.from("#${c.id} .fwnode",{opacity:0,scale:.45,stagger:.3,duration:.32,ease:"back.out(2.4)"},${(c.s+1.0).toFixed(2)});`;(c.nodes||[]).slice(0,8).forEach((_,i)=>{a+=`tl.to("#${c.id} .fwnode.n${i}",{className:"fwnode n${i} active",scale:1.08,duration:.2},${(c.s+1.0+i*.3).toFixed(2)});tl.to("#${c.id} .fwnode.n${i}",{className:"fwnode n${i}",scale:1,duration:.25},${(c.s+1.23+i*.3).toFixed(2)});`;});a+=`tl.from("#${c.id} .fwcap",{opacity:0,y:10,duration:.35},${(c.s+2.4).toFixed(2)});`;}
 if(c.type==='criteria')a+=`tl.from("#${c.id} .crhead",{opacity:0,y:12,duration:.35},${(c.s+0.15).toFixed(2)});tl.from("#${c.id} .crrow",{opacity:0,x:-28,stagger:.28,duration:.38,ease:"power3.out"},${(c.s+0.5).toFixed(2)});tl.from("#${c.id} .crrow i",{scale:.3,stagger:.28,duration:.3,ease:"back.out(2.8)"},${(c.s+0.68).toFixed(2)});tl.from("#${c.id} .crverdict",{opacity:0,scale:1.55,rotation:3,duration:.24,ease:"power3.in"},${(c.s+2.25).toFixed(2)});`;
 if(c.type==='evidencefocus'){a+=`tl.from("#${c.id} .efhead",{opacity:0,y:10,duration:.3},${(c.s+0.12).toFixed(2)});tl.from("#${c.id} .efstage",{opacity:0,x:42,duration:.48,ease:"power3.out"},${(c.s+0.35).toFixed(2)});`;const fs=c.focus||[];fs.slice(0,5).forEach((f,i)=>{const t=f.at!=null?Number(f.at):c.s+1.0+i*1.0;a+=`tl.to("#${c.id} .effocus.f${i}",{opacity:1,duration:.22,ease:"power2.out"},${t.toFixed(2)});`;if(i>0)a+=`tl.to("#${c.id} .effocus.f${i-1}",{opacity:0,duration:.18},${(t-.06).toFixed(2)});`;});a+=`tl.from("#${c.id} .efsource",{opacity:0,duration:.3},${(c.s+1.1).toFixed(2)});`;}
 if(c.type==='uislider'){const sd=Number(c.slideDur)||4.6;const t0=(c.slideT!=null?Number(c.slideT):c.s+0.5);
  a+=`tl.from("#${c.id} .uslab-row",{opacity:0,y:12,duration:.35},${(c.s+0.2).toFixed(2)});`;
  a+=`tl.fromTo("#${c.id} .usknob",{left:"1.5%"},{left:"87.5%",duration:${sd.toFixed(2)},ease:"power1.inOut"},${t0.toFixed(2)});`;
  a+=`tl.fromTo("#${c.id} .usfill",{scaleX:.08},{scaleX:1,duration:${sd.toFixed(2)},ease:"power1.inOut",transformOrigin:"left center"},${t0.toFixed(2)});`;
  (c.tickT||[]).forEach((t,i)=>{a+=`tl.to("#${c.id} .ustick:nth-child(${i+1})",{color:"#8d4526",scale:1.15,duration:.3,ease:"back.out(2)"},${Number(t).toFixed(2)});`;});
  if(c.valT!=null)a+=`tl.from("#${c.id} .usval",{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"},${Number(c.valT).toFixed(2)});`;}
 if(c.type==='uiswitch'){a+=`tl.from("#${c.id} .uswt",{opacity:0,y:10,duration:.3},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .uswrow",{opacity:0,x:-26,stagger:.2,duration:.4,ease:"power3.out"},${(c.s+0.45).toFixed(2)});`;
  const hl=c.hlT||[];
  if(hl[0]!=null)a+=`tl.to("#${c.id} .r0 .uswhl",{opacity:1,duration:.25},${Number(hl[0]).toFixed(2)});tl.fromTo("#${c.id} .r0 .uswck",{scale:.4},{opacity:1,scale:1,duration:.3,ease:"back.out(2.5)"},${Number(hl[0]).toFixed(2)});`;
  if(hl[1]!=null)a+=`tl.to("#${c.id} .r0 .uswhl, #${c.id} .r0 .uswck",{opacity:0,duration:.2},${Number(hl[1]).toFixed(2)});tl.to("#${c.id} .r1 .uswhl",{opacity:1,duration:.25},${Number(hl[1]).toFixed(2)});tl.fromTo("#${c.id} .r1 .uswck",{scale:.4},{opacity:1,scale:1,duration:.3,ease:"back.out(2.5)"},${Number(hl[1]).toFixed(2)});`;}
 if(c.type==='uisite')a+=`tl.from("#${c.id} .stbub",{opacity:0,scale:.5,duration:.45,ease:"back.out(2)"},${(c.s+0.25).toFixed(2)});tl.from("#${c.id} .starr",{opacity:0,x:-20,duration:.35},${(c.s+0.85).toFixed(2)});tl.from("#${c.id} .stbrow",{opacity:0,scale:.8,duration:.5,ease:"back.out(1.6)"},${(c.s+1.15).toFixed(2)});tl.from("#${c.id} .sblk",{scaleX:0,opacity:0,stagger:.3,duration:.4,ease:"power2.out",transformOrigin:"left center"},${(c.s+1.7).toFixed(2)});`;
 if(c.type==='tweet')a+=`tl.from("#${c.id} .twhead",{opacity:0,x:-20,duration:.4},${(c.s+0.25).toFixed(2)});tl.from("#${c.id} .twbody",{opacity:0,y:16,duration:.45,ease:"power3.out"},${(c.s+0.5).toFixed(2)});tl.from("#${c.id} .twzh",{opacity:0,y:12,duration:.4},${(c.s+0.95).toFixed(2)});tl.from("#${c.id} .twfoot",{opacity:0,duration:.4},${(c.s+1.3).toFixed(2)});`;
 if(c.type==='pipeline')a+=`tl.from("#${c.id} .plowner",{opacity:0,y:16,duration:.4},${(c.s+0.15).toFixed(2)});tl.to("#${c.id} .plrail>i",{scaleX:1,duration:1,ease:"power2.inOut"},${(c.s+0.45).toFixed(2)});tl.from("#${c.id} .plstep",{opacity:0,y:24,scale:.75,stagger:.3,duration:.35,ease:"back.out(2)"},${(c.s+0.65).toFixed(2)});tl.from("#${c.id} .plcap",{opacity:0,y:10,duration:.35},${(c.s+2.15).toFixed(2)});`;
 if(c.type==='ingest')a+=`tl.from("#${c.id} .igsrc",{opacity:0,x:-30,duration:.4},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .igcore",{opacity:0,scale:.35,duration:.45,ease:"back.out(2.7)"},${(c.s+0.65).toFixed(2)});tl.from("#${c.id} .igout",{opacity:0,x:30,duration:.4},${(c.s+1.05).toFixed(2)});tl.from("#${c.id} .igarr",{opacity:0,scale:.4,stagger:.3,duration:.25},${(c.s+0.55).toFixed(2)});tl.to("#${c.id} .igwave i",{scaleY:1,stagger:{each:.035,from:"center"},duration:.22,ease:"power2.out"},${(c.s+1.35).toFixed(2)});tl.from("#${c.id} .igtags span",{opacity:0,y:12,stagger:.18,duration:.3},${(c.s+2.1).toFixed(2)});`;
 if(c.type==='matcher')a+=`tl.from("#${c.id} .mtleft span",{opacity:0,x:-35,stagger:.22,duration:.35},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .mtcore",{opacity:0,scale:.4,duration:.5,ease:"back.out(2.4)"},${(c.s+0.7).toFixed(2)});tl.to("#${c.id} .mtcore i",{opacity:1,scale:1.25,duration:1.2,ease:"power2.out"},${(c.s+1.05).toFixed(2)});tl.from("#${c.id} .mtright span",{opacity:0,x:35,stagger:.28,duration:.35},${(c.s+1.3).toFixed(2)});tl.from("#${c.id} .mtcap",{opacity:0,y:12,duration:.3},${(c.s+2.5).toFixed(2)});`;
 if(c.type==='coverfan')a+=`tl.from("#${c.id} .cvcard",{opacity:0,y:90,scale:.45,rotation:0,stagger:.35,duration:.55,ease:"back.out(2.1)"},${(c.s+0.15).toFixed(2)});tl.from("#${c.id} .cvcap",{opacity:0,y:14,duration:.4},${(c.s+1.45).toFixed(2)});`;
 if(c.type==='publishmatrix')a+=`tl.from("#${c.id} .pmcmd",{opacity:0,scale:.55,duration:.4,ease:"back.out(2.4)"},${(c.s+0.15).toFixed(2)});tl.from("#${c.id} .pmhub",{opacity:0,scale:.25,duration:.45,ease:"back.out(2.8)"},${(c.s+0.55).toFixed(2)});tl.from("#${c.id} .pmgrid span",{opacity:0,scale:.45,stagger:{each:.09,from:"random"},duration:.28,ease:"back.out(2)"},${(c.s+0.95).toFixed(2)});tl.from("#${c.id} .pmcap",{opacity:0,y:10,duration:.35},${(c.s+2.1).toFixed(2)});`;
 if(c.type==='industrysplit')a+=`tl.from("#${c.id} .isold",{opacity:0,x:-45,duration:.5,ease:"power3.out"},${(c.s+0.2).toFixed(2)});tl.from("#${c.id} .isnew",{opacity:0,x:45,duration:.5,ease:"power3.out"},${(c.s+0.55).toFixed(2)});tl.from("#${c.id} .isvs",{opacity:0,scale:.3,duration:.4,ease:"back.out(2.5)"},${(c.s+0.8).toFixed(2)});tl.to("#${c.id} .isbar i",{scaleX:1,stagger:.25,duration:1.1,ease:"power2.out"},${(c.s+1.05).toFixed(2)});`;
 {const ce=Math.min(c.e,DUR);a+=`tl.to("#${c.id}",{autoAlpha:0,duration:.25},${(ce-0.25).toFixed(2)});tl.set("#${c.id}",{autoAlpha:0},${ce.toFixed(2)});`;}
 return a;}).join('\n')}
${media.map((m,i)=>{
 const end=Math.min(m.e,DUR);const ent=m.entrance||'pop';const ex=m.exit||'fade';
 const E={
  'pop':`{opacity:0,scale:.72,duration:.55,ease:"back.out(2)"}`,
  'mask':`{clipPath:"inset(0 100% 0 0)",duration:.55,ease:"power3.out"}`,
  'slide-left':`{opacity:0,x:-90,duration:.5,ease:"power3.out"}`,
  'slide-right':`{opacity:0,x:90,duration:.5,ease:"power3.out"}`,
  'slide-up':`{opacity:0,y:70,duration:.5,ease:"power3.out"}`,
  'zoom':`{opacity:0,scale:1.18,duration:.55,ease:"power2.out"}`,
  'flip':`{opacity:0,rotationY:-72,transformPerspective:900,duration:.6,ease:"power3.out"}`,
  'fade':`{opacity:0,duration:.5,ease:"power1.out"}`,
  'stamp':`{opacity:0,scale:1.5,rotation:5,duration:.22,ease:"power3.in"}`,
  'drop':`{opacity:0,y:-90,duration:.55,ease:"bounce.out"}`,
 }[ent]||`{opacity:0,duration:.5}`;
 const X={
  'fade':`{opacity:0,duration:.35,ease:"power1.in"}`,
  'slide-down':`{opacity:0,y:60,duration:.4,ease:"power2.in"}`,
  'shrink':`{opacity:0,scale:.82,duration:.4,ease:"power2.in"}`,
 }[ex]||`{opacity:0,duration:.35}`;
 return `${m.type==='video'?`tl.set("#md${i}",{autoAlpha:0},0);tl.set("#md${i}",{autoAlpha:1},${(m.s-0.01).toFixed(2)});`:''}tl.from("#md${i}",${E},${m.s});tl.to("#md${i}",${X},${(end-0.4).toFixed(2)});tl.set("#md${i}",{autoAlpha:0},${end.toFixed(2)});${m.scroll?`tl.fromTo("#md${i} img",{yPercent:0},{yPercent:-${Number(m.scrollAmt)||55},duration:${Math.max(end-m.s-1,1).toFixed(1)},ease:"none"},${(m.s+0.7).toFixed(2)});`:''}${m.kenburns?`tl.fromTo("#md${i} img, #md${i} video",{scale:1},{scale:1.16,x:-12,y:-10,duration:${Math.max(end-m.s,1).toFixed(1)},ease:"none"},${m.s});`:''}`;
}).join('\n')}
${caps.map((c,i)=>{const n=[...c.z].length;const span=Math.max(0.018,Math.min(0.05,((c.e-c.s)*0.5)/n));const end=Math.min(c.e,DUR);return `tl.fromTo("#cap-${i}",{autoAlpha:0},{autoAlpha:1,duration:.04},${c.s});tl.from("#cap-${i} .cc",{opacity:0,y:8,duration:.13,stagger:${span.toFixed(3)},ease:"power1.out"},${c.s});tl.to("#cap-${i}",{autoAlpha:0,duration:.06},${(end-0.06).toFixed(2)});tl.set("#cap-${i}",{autoAlpha:0},${end.toFixed(2)});`;}).join('\n')}
window.__timelines["main"]=tl;
</script>
</body></html>`;
fs.writeFileSync(DIR+'/index.html',html);
let txt=caps.map(c=>c.z).join('')+pops.map(b=>b.lab+b.zh.replace(/\|/g,'')).join('')+TITLE.replace(/\|/g,'')+chapters.map(c=>c.lab+c.n).join('');
// 卡片文字从数据里自动收集(改了文案不用再手动补字形)
txt+=JSON.stringify(TL.cards);
txt=txt.replace(/\|/g,'').replace(/<[^>]+>/g,'');
const set=new Set([...txt].filter(c=>c.trim()));'，。、·✓✕+：；？！0123456789'.split('').forEach(c=>set.add(c));'AI'.split('').forEach(c=>set.add(c));
fs.writeFileSync(__dirname+'/work/glyphs.txt',[...set].join(''));
console.log((PREVIEW?'预览':'全片')+'生成OK; DUR',DUR,'章节',chapters.length,'字幕',caps.length,'短弹',pops.length,'卡',cards.length,'字形',set.size);
