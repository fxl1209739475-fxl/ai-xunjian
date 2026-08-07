(function () {
  const A = window.MotionAtlas;
  const numbers = Array.from({ length: 48 }, (_, index) => index);

  function add(meta, body, verdict, animate) {
    const normalized = { ...meta, kind: "atomic" };
    A.register({
      ...normalized,
      html: () => A.shell(normalized, body, verdict),
      animate
    });
  }

  add(
    {
      id: "mask-reveal",
      number: "01",
      title: "遮罩揭示",
      family: "形态状态",
      theme: "paper",
      headline: "先隐藏，<em>再让重点出现</em>",
      subline: "用遮挡与揭示控制观众先看什么、后看什么。",
      use: "证据揭示、答案公布、重点聚焦"
    },
    `
      <div class="mask-stage">
        <div class="mask-window">
          <div class="mask-answer"><small>REVEAL</small><b>真正的瓶颈</b><span>不是速度，而是判断</span></div>
          <i class="mask-shutter ms1"></i>
          <i class="mask-shutter ms2"></i>
          <i class="mask-shutter ms3"></i>
        </div>
        <div class="mask-cue"><span>表象</span><i></i><b>本质</b></div>
      </div>
    `,
    "遮罩的价值不是炫技，<b>是安排注意力顺序。</b>",
    (tl) => {
      tl.from(".mask-window", { scale: 0.75, rotation: -3, opacity: 0, duration: 0.55, ease: "back.out(1.8)" }, 0.85);
      tl.from(".mask-shutter", { scaleX: 0, transformOrigin: "left", stagger: 0.12, duration: 0.42, ease: "power3.out" }, 1.15);
      tl.to(".ms1", { xPercent: -108, duration: 0.62, ease: "expo.inOut" }, 2.0);
      tl.to(".ms2", { xPercent: 108, duration: 0.62, ease: "expo.inOut" }, 2.16);
      tl.to(".ms3", { yPercent: 108, duration: 0.62, ease: "expo.inOut" }, 2.32);
      tl.from(".mask-answer>*", { y: 70, opacity: 0, stagger: 0.12, duration: 0.36, ease: "back.out(2)" }, 2.78);
      tl.from(".mask-cue>*", { scale: 0.2, opacity: 0, stagger: 0.12, duration: 0.3, ease: "back.out(2.5)" }, 3.42);
    }
  );

  add(
    {
      id: "path-follow",
      number: "02",
      title: "路径跟随",
      family: "空间拓扑",
      theme: "night",
      headline: "过程不是跳转，<em>而是一条路径</em>",
      subline: "让对象沿真实路线移动，观众能看见过程。",
      use: "用户旅程、业务流程、信息传递"
    },
    `
      <div class="path-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="path-ghost" d="M90 710C210 520 245 180 460 210C680 240 570 640 810 690"/>
          <path class="path-live" d="M90 710C210 520 245 180 460 210C680 240 570 640 810 690"/>
        </svg>
        <div class="path-runner"><i></i><b>信号</b></div>
        <span class="path-node pn1">输入</span><span class="path-node pn2">判断</span><span class="path-node pn3">执行</span>
      </div>
    `,
    "路径动画适合回答：<b>它到底是怎么走到结果的？</b>",
    (tl) => {
      tl.from(".path-live", { strokeDashoffset: 1800, duration: 1.15, ease: "power2.out" }, 0.92);
      tl.from(".path-node", { scale: 0.2, opacity: 0, stagger: 0.32, duration: 0.35, ease: "back.out(2.4)" }, 1.08);
      tl.fromTo(".path-runner", { offsetDistance: "0%", opacity: 0 }, { offsetDistance: "100%", opacity: 1, duration: 2.4, ease: "power1.inOut" }, 1.12);
      tl.to(".path-node", { boxShadow: "0 0 0 18px rgba(57,226,202,.18)", stagger: 0.42, duration: 0.16, yoyo: true, repeat: 1 }, 1.55);
    }
  );

  add(
    {
      id: "scale-pulse",
      number: "03",
      title: "缩放脉冲",
      family: "形态状态",
      theme: "cobalt",
      headline: "重要性，<em>可以被放大看见</em>",
      subline: "尺度变化用于表达权重、影响范围与优先级。",
      use: "核心观点、影响扩大、优先级变化"
    },
    `
      <div class="pulse-stage">
        <i class="pulse-ring pr1"></i><i class="pulse-ring pr2"></i><i class="pulse-ring pr3"></i>
        <div class="pulse-core"><small>PRIORITY</small><b>核心</b></div>
        <span class="pulse-chip pc1">影响</span><span class="pulse-chip pc2">范围</span><span class="pulse-chip pc3">权重</span>
      </div>
    `,
    "缩放不是推近镜头，<b>而是在声明谁更重要。</b>",
    (tl) => {
      tl.from(".pulse-core", { scale: 0.05, rotation: -30, opacity: 0, duration: 0.58, ease: "back.out(2.8)" }, 0.9);
      tl.fromTo(".pulse-ring", { scale: 0.15, opacity: 0.9 }, { scale: 1.65, opacity: 0, stagger: 0.18, duration: 0.9, ease: "power2.out" }, 1.35);
      tl.from(".pulse-chip", { scale: 0.2, opacity: 0, stagger: 0.18, duration: 0.38, ease: "back.out(2.3)" }, 2.12);
      tl.to(".pulse-core", { scale: 1.12, duration: 0.22, yoyo: true, repeat: 3, ease: "sine.inOut" }, 2.76);
      tl.to(".pulse-chip", { scale: 1.08, stagger: 0.12, duration: 0.18, yoyo: true, repeat: 1 }, 3.24);
    }
  );

  add(
    {
      id: "orbit-rotate",
      number: "04",
      title: "轨道旋转",
      family: "空间拓扑",
      theme: "violet",
      headline: "多个角色，<em>围绕同一核心运转</em>",
      subline: "旋转与轨道适合表现稳定关系、依赖和协同。",
      use: "生态系统、角色协同、围绕核心"
    },
    `
      <div class="orbit-stage">
        <div class="orbit-system">
          <i class="orbit-line ol1"></i><i class="orbit-line ol2"></i>
          <div class="orbit-core"><small>CORE</small><b>目标</b></div>
          <span class="satellite s1">内容</span><span class="satellite s2">产品</span>
          <span class="satellite s3">渠道</span><span class="satellite s4">反馈</span>
        </div>
      </div>
    `,
    "轨道关系强调：<b>每个角色独立，但不能脱离核心。</b>",
    (tl) => {
      tl.from(".orbit-line", { scale: 0.1, opacity: 0, stagger: 0.14, duration: 0.5, ease: "back.out(1.8)" }, 0.9);
      tl.from(".orbit-core", { scale: 0.1, opacity: 0, duration: 0.46, ease: "back.out(2.4)" }, 1.08);
      tl.from(".satellite", { scale: 0.1, opacity: 0, stagger: 0.15, duration: 0.36, ease: "back.out(2.3)" }, 1.28);
      tl.to(".orbit-system", { rotation: 360, duration: 2.6, ease: "power2.inOut" }, 1.72);
      tl.to(".satellite", { rotation: -360, duration: 2.6, ease: "power2.inOut" }, 1.72);
      tl.to(".orbit-core", { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 }, 3.9);
    }
  );

  add(
    {
      id: "morph-state",
      number: "05",
      title: "形态变换",
      family: "形态状态",
      theme: "mint",
      headline: "同一个对象，<em>可以进入不同状态</em>",
      subline: "形态连续变化，适合表达升级、适配与身份转换。",
      use: "前后状态、产品升级、角色转变"
    },
    `
      <div class="morph-stage">
        <div class="morph-shape"><b class="morph-label ml1">原料</b><b class="morph-label ml2">模块</b><b class="morph-label ml3">产品</b></div>
        <div class="morph-track"><span>输入</span><i></i><span>产品</span></div>
        <div class="morph-echo me1"></div><div class="morph-echo me2"></div>
      </div>
    `,
    "形态变换回答的是：<b>它还是它，但已经不再一样。</b>",
    (tl) => {
      tl.from(".morph-shape", { scale: 0.1, opacity: 0, rotation: -90, duration: 0.58, ease: "back.out(2.6)" }, 0.9);
      tl.from(".morph-echo", { scale: 0.2, opacity: 0, stagger: 0.12, duration: 0.45 }, 1.2);
      tl.to(".morph-shape", { width: 430, height: 250, borderRadius: 30, rotation: 90, backgroundColor: "#ffcb45", duration: 0.75, ease: "expo.inOut" }, 1.72);
      tl.to(".ml1", { rotation: -90, opacity: 0, duration: 0.3 }, 1.88);
      tl.to(".ml2", { rotation: -90, opacity: 1, duration: 0.3 }, 2.06);
      tl.to(".morph-shape", { width: 520, height: 520, borderRadius: 90, rotation: 180, backgroundColor: "#4868ff", duration: 0.78, ease: "expo.inOut" }, 2.68);
      tl.to(".ml2", { rotation: -180, opacity: 0, duration: 0.3 }, 2.84);
      tl.to(".ml3", { rotation: -180, opacity: 1, color: "#fff", duration: 0.3 }, 3.02);
      tl.from(".morph-track>*", { y: 40, opacity: 0, stagger: 0.12, duration: 0.3 }, 3.52);
    }
  );

  add(
    {
      id: "split-merge",
      number: "06",
      title: "分裂合并",
      family: "空间拓扑",
      theme: "coral",
      headline: "一个问题，<em>拆开才能重新组合</em>",
      subline: "分裂展示组成，合并展示新的整体。",
      use: "模块拆解、团队分工、结构重组"
    },
    `
      <div class="split-stage">
        <div class="split-core"><b>任务</b></div>
        <div class="split-piece sp1">理解</div><div class="split-piece sp2">生成</div>
        <div class="split-piece sp3">验证</div><div class="split-piece sp4">交付</div>
        <div class="split-result"><small>REASSEMBLED</small><b>工作流</b></div>
      </div>
    `,
    "先拆结构，再合系统：<b>分工不等于割裂。</b>",
    (tl) => {
      tl.from(".split-core", { scale: 0.1, opacity: 0, duration: 0.5, ease: "back.out(2.6)" }, 0.9);
      tl.from(".split-piece", { x: 0, y: 0, scale: 0.25, opacity: 0, stagger: 0.1, duration: 0.42, ease: "back.out(2.2)" }, 1.28);
      tl.to(".split-core", { scale: 0, rotation: 30, opacity: 0, duration: 0.32 }, 1.45);
      tl.to(".sp1", { x: -260, y: -240, duration: 0.65, ease: "expo.out" }, 1.55);
      tl.to(".sp2", { x: 260, y: -240, duration: 0.65, ease: "expo.out" }, 1.62);
      tl.to(".sp3", { x: -260, y: 250, duration: 0.65, ease: "expo.out" }, 1.69);
      tl.to(".sp4", { x: 260, y: 250, duration: 0.65, ease: "expo.out" }, 1.76);
      tl.to(".split-piece", { x: 0, y: 0, scale: 0.5, opacity: 0, stagger: 0.05, duration: 0.58, ease: "power3.in" }, 2.75);
      tl.from(".split-result", { scale: 0.15, opacity: 0, rotation: -12, duration: 0.52, ease: "back.out(2.6)" }, 3.12);
    }
  );

  add(
    {
      id: "accumulate-disperse",
      number: "07",
      title: "聚集扩散",
      family: "物理群体",
      theme: "night",
      headline: "先聚成势，<em>再扩散到各处</em>",
      subline: "群体的聚散适合表达资源、注意力和影响力。",
      use: "流量汇聚、资源分发、影响扩散"
    },
    `
      <div class="gather-stage">
        ${numbers.slice(0, 24).map((n) => `<i class="gather-dot gd${n + 1}"></i>`).join("")}
        <div class="gather-core"><small>POOL</small><b>资源池</b></div>
        <span class="gather-zone gz1">内容</span><span class="gather-zone gz2">产品</span><span class="gather-zone gz3">渠道</span>
      </div>
    `,
    "聚散动画让人看见：<b>资源从哪里来，又去了哪里。</b>",
    (tl) => {
      tl.from(".gather-core", { scale: 0.1, opacity: 0, duration: 0.5, ease: "back.out(2.5)" }, 0.88);
      tl.from(".gather-dot", { x: () => gsap.utils.random(-520, 520), y: () => gsap.utils.random(-520, 520), opacity: 0, stagger: 0.025, duration: 0.62, ease: "power3.out" }, 1.12);
      tl.to(".gather-dot", { x: 0, y: 0, scale: 0.45, stagger: 0.018, duration: 0.64, ease: "power3.in" }, 2.02);
      tl.to(".gather-core", { scale: 1.16, duration: 0.18, yoyo: true, repeat: 1 }, 2.62);
      tl.from(".gather-zone", { scale: 0.2, opacity: 0, stagger: 0.16, duration: 0.36, ease: "back.out(2.2)" }, 2.78);
      tl.to(".gather-dot:nth-of-type(3n+1)", { x: -330, y: 290, scale: 0.75, duration: 0.7, ease: "expo.out" }, 3.0);
      tl.to(".gather-dot:nth-of-type(3n+2)", { x: 0, y: 365, scale: 0.75, duration: 0.7, ease: "expo.out" }, 3.06);
      tl.to(".gather-dot:nth-of-type(3n)", { x: 330, y: 290, scale: 0.75, duration: 0.7, ease: "expo.out" }, 3.12);
    }
  );

  add(
    {
      id: "cascade-sequence",
      number: "08",
      title: "级联序列",
      family: "时间编排",
      theme: "paper",
      headline: "不是同时发生，<em>而是依次触发</em>",
      subline: "错峰与级联让先后顺序一眼可见。",
      use: "步骤、因果链、审批流、自动化"
    },
    `
      <div class="cascade-stage">
        <div class="cascade-line"></div>
        <div class="cascade-card cc1"><small>01</small><b>输入</b></div>
        <div class="cascade-card cc2"><small>02</small><b>判断</b></div>
        <div class="cascade-card cc3"><small>03</small><b>执行</b></div>
        <div class="cascade-card cc4"><small>04</small><b>回执</b></div>
      </div>
    `,
    "级联序列强调：<b>前一步是后一步的触发器。</b>",
    (tl) => {
      tl.from(".cascade-line", { scaleX: 0, transformOrigin: "left", duration: 0.8, ease: "power2.out" }, 0.92);
      tl.from(".cascade-card", { y: -270, rotation: -22, opacity: 0, stagger: 0.33, duration: 0.5, ease: "bounce.out" }, 1.12);
      tl.to(".cascade-card", { rotationX: 62, transformOrigin: "bottom", stagger: 0.34, duration: 0.28, yoyo: true, repeat: 1, ease: "power2.inOut" }, 2.65);
      tl.to(".cascade-card", { boxShadow: "12px 14px 0 #39dbc8", stagger: 0.18, duration: 0.2 }, 3.52);
    }
  );

  add(
    {
      id: "branch-converge",
      number: "09",
      title: "分支回流",
      family: "空间拓扑",
      theme: "cobalt",
      headline: "路径可以分开，<em>结果仍能回到一起</em>",
      subline: "分支与回流用于表达并行处理和统一收口。",
      use: "多代理、并行任务、渠道汇总"
    },
    `
      <div class="branch-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="branch-line bl1" d="M450 790C450 610 170 590 170 350C170 220 330 205 450 110"/>
          <path class="branch-line bl2" d="M450 790C450 610 730 590 730 350C730 220 570 205 450 110"/>
        </svg>
        <div class="branch-source">任务</div><div class="branch-target">结果</div>
        <div class="branch-packet bp1">A</div><div class="branch-packet bp2">B</div>
        <span class="branch-worker bw1">分析</span><span class="branch-worker bw2">制作</span>
      </div>
    `,
    "并行不是失控：<b>关键是最后能否统一回流。</b>",
    (tl) => {
      tl.from(".branch-line", { strokeDashoffset: 1900, stagger: 0.12, duration: 1.1, ease: "power2.out" }, 0.9);
      tl.from(".branch-source, .branch-target", { scale: 0.1, opacity: 0, stagger: 0.22, duration: 0.4, ease: "back.out(2.3)" }, 1.12);
      tl.from(".branch-worker", { x: (i) => i ? 260 : -260, opacity: 0, duration: 0.48, ease: "expo.out" }, 1.52);
      tl.fromTo(".bp1", { offsetDistance: "0%", opacity: 0 }, { offsetDistance: "100%", opacity: 1, duration: 2.15, ease: "power1.inOut" }, 1.45);
      tl.fromTo(".bp2", { offsetDistance: "0%", opacity: 0 }, { offsetDistance: "100%", opacity: 1, duration: 2.15, ease: "power1.inOut" }, 1.56);
      tl.to(".branch-target", { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1 }, 3.62);
    }
  );

  add(
    {
      id: "loop-feedback",
      number: "10",
      title: "闭环循环",
      family: "时间编排",
      theme: "mint",
      headline: "结果不是终点，<em>还会回到下一轮</em>",
      subline: "循环用于表达复盘、迭代与持续优化。",
      use: "增长飞轮、反馈闭环、学习迭代"
    },
    `
      <div class="loop-stage">
        <div class="loop-wheel">
          <i class="loop-arrow la1">➜</i><i class="loop-arrow la2">➜</i><i class="loop-arrow la3">➜</i><i class="loop-arrow la4">➜</i>
          <span class="loop-node ln1">行动</span><span class="loop-node ln2">结果</span>
          <span class="loop-node ln3">反馈</span><span class="loop-node ln4">调整</span>
          <div class="loop-core">迭代</div>
        </div>
      </div>
    `,
    "闭环的重点不是转圈，<b>而是每一轮都带回新信息。</b>",
    (tl) => {
      tl.from(".loop-wheel", { scale: 0.25, opacity: 0, rotation: -45, duration: 0.62, ease: "back.out(2.1)" }, 0.88);
      tl.from(".loop-node", { scale: 0.1, opacity: 0, stagger: 0.18, duration: 0.34, ease: "back.out(2.4)" }, 1.15);
      tl.from(".loop-arrow", { opacity: 0, scale: 0.2, stagger: 0.16, duration: 0.3 }, 1.45);
      tl.to(".loop-wheel", { rotation: 360, duration: 2.2, ease: "power2.inOut" }, 1.8);
      tl.to(".loop-node", { rotation: -360, duration: 2.2, ease: "power2.inOut" }, 1.8);
      tl.to(".loop-core", { scale: 1.13, duration: 0.2, yoyo: true, repeat: 2 }, 3.35);
    }
  );

  add(
    {
      id: "compare-align",
      number: "11",
      title: "对齐比较",
      family: "时间编排",
      theme: "coral",
      headline: "比较之前，<em>先把标准对齐</em>",
      subline: "同一基线上的长度、位置与节奏才有比较意义。",
      use: "A/B 对比、差距展示、标准统一"
    },
    `
      <div class="compare-stage">
        <i class="compare-axis"></i>
        <div class="compare-row cr1"><span>A 方案</span><i></i><b>62</b></div>
        <div class="compare-row cr2"><span>B 方案</span><i></i><b>84</b></div>
        <div class="compare-row cr3"><span>目标线</span><i></i><b>80</b></div>
        <div class="compare-gap"><small>GAP</small><b>+22</b></div>
      </div>
    `,
    "比较动画必须告诉观众：<b>差距在哪里，标准又在哪里。</b>",
    (tl) => {
      tl.from(".compare-axis", { scaleY: 0, transformOrigin: "bottom", duration: 0.62, ease: "power2.out" }, 0.88);
      tl.from(".compare-row", { x: -720, opacity: 0, stagger: 0.18, duration: 0.5, ease: "expo.out" }, 1.12);
      tl.from(".compare-row i", { scaleX: 0, transformOrigin: "left", stagger: 0.18, duration: 0.74, ease: "power2.out" }, 1.72);
      tl.from(".compare-row b", { scale: 0.1, opacity: 0, stagger: 0.18, duration: 0.32, ease: "back.out(2.4)" }, 2.18);
      tl.from(".compare-gap", { scale: 2.2, opacity: 0, rotation: 8, duration: 0.35, ease: "power4.in" }, 2.95);
      tl.to(".cr2", { scale: 1.05, duration: 0.18, yoyo: true, repeat: 1 }, 3.35);
    }
  );

  add(
    {
      id: "threshold-filter",
      number: "12",
      title: "阈值筛选",
      family: "物理群体",
      theme: "paper",
      headline: "不是全部通过，<em>而是按标准筛选</em>",
      subline: "门槛、漏斗与筛网可以直观表达规则。",
      use: "合规筛选、入选淘汰、质量门槛"
    },
    `
      <div class="filter-stage">
        <div class="filter-gate"><small>THRESHOLD</small><b>70</b><i></i></div>
        <div class="filter-item fi1 good">86</div><div class="filter-item fi2 bad">42</div>
        <div class="filter-item fi3 good">77</div><div class="filter-item fi4 bad">58</div>
        <div class="filter-item fi5 good">91</div><div class="filter-item fi6 bad">36</div>
        <div class="filter-bin pass">通过</div><div class="filter-bin reject">淘汰</div>
      </div>
    `,
    "阈值动画把规则说清楚：<b>为什么有人通过，有人被挡下。</b>",
    (tl) => {
      tl.from(".filter-gate", { scaleY: 0.1, opacity: 0, duration: 0.52, ease: "back.out(1.8)" }, 0.88);
      tl.from(".filter-item", { x: -660, opacity: 0, stagger: 0.1, duration: 0.46, ease: "power3.out" }, 1.18);
      tl.to(".filter-item.good", { x: 670, stagger: 0.12, duration: 0.78, ease: "power2.inOut" }, 2.0);
      tl.to(".filter-item.bad", { x: 310, y: 360, rotation: 25, stagger: 0.12, duration: 0.72, ease: "bounce.out" }, 2.08);
      tl.from(".filter-bin", { y: 180, opacity: 0, stagger: 0.14, duration: 0.42, ease: "back.out(2.2)" }, 2.72);
      tl.to(".filter-gate", { boxShadow: "0 0 0 24px rgba(255,194,49,.22)", duration: 0.2, yoyo: true, repeat: 1 }, 3.34);
    }
  );

  add(
    {
      id: "collision-spring",
      number: "13",
      title: "碰撞回弹",
      family: "物理群体",
      theme: "night",
      headline: "两个力量相遇，<em>系统会产生反馈</em>",
      subline: "碰撞、压缩与回弹适合表现冲突和缓冲。",
      use: "观点冲突、供需博弈、系统缓冲"
    },
    `
      <div class="collision-stage">
        <div class="collision-ball cb1"><b>需求</b></div>
        <div class="collision-spring"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="collision-ball cb2"><b>供给</b></div>
        <div class="collision-shock cs1"></div><div class="collision-shock cs2"></div>
        <div class="collision-result">新平衡</div>
      </div>
    `,
    "碰撞不是为了热闹，<b>而是让冲突后的新平衡可见。</b>",
    (tl) => {
      tl.from(".collision-spring", { scaleX: 0.2, opacity: 0, duration: 0.45 }, 0.9);
      tl.from(".cb1", { x: -620, rotation: -80, duration: 0.72, ease: "power3.in" }, 1.15);
      tl.from(".cb2", { x: 620, rotation: 80, duration: 0.72, ease: "power3.in" }, 1.15);
      tl.to(".cb1", { x: 250, duration: 0.32, ease: "power4.in" }, 1.78);
      tl.to(".cb2", { x: -250, duration: 0.32, ease: "power4.in" }, 1.78);
      tl.to(".collision-spring", { scaleX: 0.42, duration: 0.18, ease: "power4.in" }, 1.86);
      tl.fromTo(".collision-shock", { scale: 0.1, opacity: 0.9 }, { scale: 2.1, opacity: 0, stagger: 0.12, duration: 0.6 }, 1.9);
      tl.to(".cb1", { x: -20, duration: 0.52, ease: "back.out(2.4)" }, 2.05);
      tl.to(".cb2", { x: 20, duration: 0.52, ease: "back.out(2.4)" }, 2.05);
      tl.to(".collision-spring", { scaleX: 1, duration: 0.62, ease: "elastic.out(1, .35)" }, 2.12);
      tl.from(".collision-result", { y: 120, scale: 0.3, opacity: 0, duration: 0.4, ease: "back.out(2.4)" }, 2.9);
    }
  );

  add(
    {
      id: "particle-field",
      number: "14",
      title: "粒子场",
      family: "物理群体",
      theme: "violet",
      headline: "个体会被场影响，<em>形成群体方向</em>",
      subline: "粒子场用于表达趋势、共识和无形力量。",
      use: "趋势形成、舆论聚集、群体行为"
    },
    `
      <div class="particle-stage">
        ${numbers.map((n) => `<i class="particle p${n + 1}" style="left:${35 + (n % 8) * 108}px;top:${60 + Math.floor(n / 8) * 132}px"></i>`).join("")}
        <div class="field-core"><small>FIELD</small><b>趋势</b></div>
        <svg viewBox="0 0 900 900" aria-hidden="true"><path class="field-arrow" d="M130 720C260 570 340 310 760 180"/></svg>
      </div>
    `,
    "粒子场表达的是：<b>没有谁命令，但大家开始朝同一方向移动。</b>",
    (tl) => {
      tl.from(".particle", { x: () => gsap.utils.random(-420, 420), y: () => gsap.utils.random(-420, 420), opacity: 0, stagger: 0.012, duration: 0.62, ease: "power2.out" }, 0.88);
      tl.from(".field-core", { scale: 0.1, opacity: 0, duration: 0.45, ease: "back.out(2.4)" }, 1.26);
      tl.from(".field-arrow", { strokeDashoffset: 1500, duration: 0.85, ease: "power2.out" }, 1.52);
      tl.to(".particle", { x: (i) => 180 + (i % 8) * 25, y: (i) => -240 + Math.floor(i / 8) * 58, scale: (i) => 0.75 + (i % 3) * 0.15, stagger: 0.012, duration: 1.15, ease: "power2.inOut" }, 2.05);
      tl.to(".field-core", { x: 250, y: -210, duration: 1.05, ease: "power2.inOut" }, 2.12);
    }
  );

  add(
    {
      id: "camera-depth",
      number: "15",
      title: "镜头纵深",
      family: "空间拓扑",
      theme: "cobalt",
      headline: "不是放大，<em>而是穿过层级</em>",
      subline: "纵深与视差让抽象层级变成可进入的空间。",
      use: "从宏观到细节、层级钻取、认知深入"
    },
    `
      <div class="depth-stage">
        <div class="depth-layer dl1"><b>行业</b></div>
        <div class="depth-layer dl2"><b>业务</b></div>
        <div class="depth-layer dl3"><b>流程</b></div>
        <div class="depth-layer dl4"><b>动作</b></div>
        <div class="depth-target">关键一步</div>
      </div>
    `,
    "镜头纵深适合回答：<b>大问题里，真正该看的细节在哪里？</b>",
    (tl) => {
      tl.from(".depth-layer", { scale: 0.25, opacity: 0, stagger: 0.12, duration: 0.45, ease: "back.out(1.8)" }, 0.88);
      tl.to(".dl1", { scale: 3.5, opacity: 0, duration: 0.72, ease: "power3.in" }, 1.55);
      tl.to(".dl2", { scale: 3.5, opacity: 0, duration: 0.72, ease: "power3.in" }, 1.9);
      tl.to(".dl3", { scale: 3.5, opacity: 0, duration: 0.72, ease: "power3.in" }, 2.25);
      tl.to(".dl4", { scale: 3.5, opacity: 0, duration: 0.72, ease: "power3.in" }, 2.6);
      tl.from(".depth-target", { scale: 0.1, opacity: 0, rotation: -12, duration: 0.55, ease: "back.out(2.5)" }, 3.02);
      tl.to(".depth-target", { scale: 1.1, duration: 0.22, yoyo: true, repeat: 1 }, 3.58);
    }
  );

  add(
    {
      id: "kinetic-type",
      number: "16",
      title: "动态文字",
      family: "时间编排",
      theme: "paper",
      headline: "文字本身，<em>也可以承担动作</em>",
      subline: "字重、位置、节奏和断行共同表达语气。",
      use: "观点强调、反差、金句、情绪转折"
    },
    `
      <div class="type-stage">
        <span class="type-word tw1">更快</span>
        <span class="type-word tw2">更多</span>
        <span class="type-word tw3">更强</span>
        <div class="type-pivot">但真正稀缺的是</div>
        <strong class="type-answer">判断</strong>
        <i class="type-underline"></i>
      </div>
    `,
    "动态文字的最高标准：<b>静音时也能听见语气。</b>",
    (tl) => {
      tl.set(".type-pivot, .type-answer, .type-underline", { autoAlpha: 0 }, 0);
      tl.from(".tw1", { x: -880, skewX: -12, duration: 0.55, ease: "expo.out" }, 0.88);
      tl.from(".tw2", { x: 880, skewX: 12, duration: 0.55, ease: "expo.out" }, 1.18);
      tl.from(".tw3", { scale: 2.8, opacity: 0, duration: 0.38, ease: "power4.in" }, 1.48);
      tl.to(".type-word", { y: -180, scale: 0.62, opacity: 0.42, stagger: 0.08, duration: 0.52, ease: "power3.inOut" }, 2.12);
      tl.fromTo(".type-pivot", { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "expo.out" }, 2.5);
      tl.fromTo(".type-answer", { scaleX: 0.08, autoAlpha: 0, transformOrigin: "left" }, { scaleX: 1, autoAlpha: 1, duration: 0.58, ease: "back.out(1.9)" }, 2.82);
      tl.fromTo(".type-underline", { scaleX: 0, autoAlpha: 0, transformOrigin: "left" }, { scaleX: 1, autoAlpha: 1, duration: 0.48, ease: "power3.out" }, 3.26);
      tl.to(".type-answer", { letterSpacing: 18, duration: 0.38, ease: "power2.inOut" }, 3.62);
    }
  );
})();
