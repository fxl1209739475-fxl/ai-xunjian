(function () {
  const A = window.MotionAtlas;

  function add(meta, body, verdict, animate) {
    const normalized = { ...meta, kind: "composite", family: "复合叙事" };
    A.register({
      ...normalized,
      html: () => A.shell(normalized, body, verdict),
      animate
    });
  }

  add(
    {
      id: "comic-panels",
      number: "17",
      title: "漫画分格",
      theme: "comic",
      headline: "多个视角，<em>同时撞进一个结论</em>",
      subline: "分格、错版与碰撞把并行信息编成一场戏。",
      use: "多角色、多模块、并行观点"
    },
    `
      <div class="comic-stage">
        <div class="comic-panel cp1"><small>01</small><b>内容</b><span>表达</span></div>
        <div class="comic-panel cp2"><small>02</small><b>视觉</b><span>呈现</span></div>
        <div class="comic-panel cp3"><small>03</small><b>产品</b><span>交付</span></div>
        <div class="comic-panel cp4"><small>04</small><b>技术</b><span>实现</span></div>
        <svg class="comic-links" viewBox="0 0 900 900" aria-hidden="true">
          <path class="comic-link" d="M366 376L310 320"/>
          <path class="comic-link" d="M534 376L590 320"/>
          <path class="comic-link" d="M366 544L310 600"/>
          <path class="comic-link" d="M534 544L590 600"/>
        </svg>
        <div class="comic-core"><small>ONE PERSON</small><b>组合能力</b></div>
      </div>
    `,
    "复合逻辑：<b>分格 + 碰撞 + 中心落版。</b>",
    (tl) => {
      tl.from(".cp1", { x: -650, y: -280, rotation: -18, duration: 0.62, ease: "back.out(1.5)" }, 0.9);
      tl.from(".cp2", { x: 650, y: -280, rotation: 18, duration: 0.62, ease: "back.out(1.5)" }, 1.05);
      tl.from(".cp3", { x: -650, y: 280, rotation: -16, duration: 0.62, ease: "back.out(1.5)" }, 1.2);
      tl.from(".cp4", { x: 650, y: 280, rotation: 16, duration: 0.62, ease: "back.out(1.5)" }, 1.35);
      tl.from(".comic-panel b", { scale: 0.2, opacity: 0, stagger: 0.09, duration: 0.34, ease: "back.out(2.5)" }, 1.66);
      tl.from(".comic-link", { strokeDashoffset: 90, stagger: 0.06, duration: 0.3, ease: "power3.out" }, 2.05);
      tl.from(".comic-core", { scale: 2.5, rotation: 18, opacity: 0, duration: 0.42, ease: "power4.in" }, 2.28);
      tl.to(".comic-panel", { scale: 0.94, stagger: 0.04, duration: 0.16, yoyo: true, repeat: 1 }, 2.72);
      tl.to(".comic-core", { rotation: -3, duration: 0.2, ease: "back.out(3)" }, 2.72);
    }
  );

  add(
    {
      id: "speed-tunnel",
      number: "18",
      title: "速度隧道",
      theme: "night",
      headline: "同一段路，<em>成本会越来越高</em>",
      subline: "透视、路径与阻力叠加，表现速度和边际成本。",
      use: "效率差、边际收益、机会成本"
    },
    `
      <div class="tunnel-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="tunnel-ray" d="M450 80L50 850M450 80L180 850M450 80L310 850M450 80L450 850M450 80L590 850M450 80L720 850M450 80L850 850"/>
          <path class="tunnel-gate tg1" d="M310 360H590"/><path class="tunnel-gate tg2" d="M190 600H710"/><path class="tunnel-gate tg3" d="M70 825H830"/>
        </svg>
        <div class="tunnel-chip tc1"><small>0 → 70</small><b>快</b></div>
        <div class="tunnel-chip tc2"><small>70 → 90</small><b>慢</b></div>
        <span class="tunnel-cost cost1">+2h</span><span class="tunnel-cost cost2">+4h</span><span class="tunnel-cost cost3">+8h</span>
      </div>
    `,
    "复合逻辑：<b>镜头纵深 + 路径跟随 + 阈值阻挡。</b>",
    (tl) => {
      tl.from(".tunnel-ray, .tunnel-gate", { strokeDashoffset: 1600, stagger: 0.03, duration: 0.78, ease: "power2.out" }, 0.88);
      tl.fromTo(".tc1", { x: -360, y: 360, scale: 0.35, opacity: 0 }, { x: 300, y: -350, scale: 1, opacity: 1, duration: 0.85, ease: "expo.out" }, 1.22);
      tl.fromTo(".tc2", { x: -350, y: 390, scale: 0.4, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power3.out" }, 1.72);
      tl.from(".tunnel-cost", { scale: 2.2, opacity: 0, stagger: 0.26, duration: 0.28, ease: "power4.in" }, 2.18);
      tl.to(".tc2", { x: -28, duration: 0.1, yoyo: true, repeat: 9, ease: "none" }, 2.78);
      tl.to(".tunnel-gate", { stroke: "#ffcc45", strokeWidth: 18, stagger: 0.08, duration: 0.2 }, 3.08);
    }
  );

  add(
    {
      id: "magnet-merge",
      number: "19",
      title: "磁力汇聚",
      theme: "paper",
      headline: "能力不是并排，<em>而是互相吸附</em>",
      subline: "路径、吸力和缩放共同表达组合后的放大效应。",
      use: "能力交叉、资源整合、组合壁垒"
    },
    `
      <div class="magnet-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="magnet-path mp1" d="M120 140C280 210 310 330 450 450"/>
          <path class="magnet-path mp2" d="M780 140C620 210 590 330 450 450"/>
          <path class="magnet-path mp3" d="M120 760C280 690 310 570 450 450"/>
          <path class="magnet-path mp4" d="M780 760C620 690 590 570 450 450"/>
        </svg>
        <div class="magnet-orb mo1">内容</div><div class="magnet-orb mo2">视觉</div>
        <div class="magnet-orb mo3">产品</div><div class="magnet-orb mo4">技术</div>
        <div class="magnet-core"><small>COMPOUND</small><b>组合壁垒</b></div>
        <i class="magnet-ring mr1"></i><i class="magnet-ring mr2"></i>
      </div>
    `,
    "复合逻辑：<b>分支回流 + 聚集 + 缩放脉冲。</b>",
    (tl) => {
      tl.from(".magnet-path", { strokeDashoffset: 900, stagger: 0.08, duration: 0.82, ease: "power2.out" }, 0.9);
      tl.from(".magnet-orb", { scale: 0.2, opacity: 0, stagger: 0.14, duration: 0.4, ease: "back.out(2.3)" }, 1.12);
      tl.to(".mo1", { x: 255, y: 255, scale: 0.45, duration: 0.72, ease: "power3.in" }, 1.86);
      tl.to(".mo2", { x: -255, y: 255, scale: 0.45, duration: 0.72, ease: "power3.in" }, 1.92);
      tl.to(".mo3", { x: 255, y: -255, scale: 0.45, duration: 0.72, ease: "power3.in" }, 1.98);
      tl.to(".mo4", { x: -255, y: -255, scale: 0.45, duration: 0.72, ease: "power3.in" }, 2.04);
      tl.from(".magnet-core", { scale: 0.08, opacity: 0, rotation: -18, duration: 0.5, ease: "back.out(2.8)" }, 2.48);
      tl.fromTo(".magnet-ring", { scale: 0.1, opacity: 0.9 }, { scale: 1.7, opacity: 0, stagger: 0.12, duration: 0.75 }, 2.62);
    }
  );

  add(
    {
      id: "pressure-stack",
      number: "20",
      title: "压力堆叠",
      theme: "coral",
      headline: "输入不断增加，<em>容量并没有变大</em>",
      subline: "堆积、碰撞和阈值共同表达系统过载。",
      use: "信息过载、需求拥堵、资源瓶颈"
    },
    `
      <div class="pressure-stage">
        <div class="pressure-vessel"><div class="pressure-capacity"><b>46</b><small>容量</small></div><i></i></div>
        <span class="pressure-token pt1">观点</span><span class="pressure-token pt2">数据</span>
        <span class="pressure-token pt3">案例</span><span class="pressure-token pt4">工具</span>
        <span class="pressure-token pt5">链接</span><span class="pressure-token pt6">方法</span>
        <div class="pressure-meter"><i></i><b>94%</b></div>
        <div class="pressure-alert">开始抗拒</div>
      </div>
    `,
    "复合逻辑：<b>聚集 + 碰撞回弹 + 阈值超载。</b>",
    (tl) => {
      tl.from(".pressure-vessel", { x: 420, scale: 0.65, duration: 0.58, ease: "back.out(1.8)" }, 0.9);
      tl.from(".pressure-token", { x: -760, opacity: 0, stagger: 0.11, duration: 0.48, ease: "power3.out" }, 1.12);
      tl.to(".pressure-token", { x: (i) => 330 - (i % 2) * 25, rotation: (i) => i % 2 ? 3 : -3, stagger: 0.12, duration: 0.62, ease: "power3.in" }, 1.82);
      tl.to(".pressure-vessel", { x: 15, rotation: 1.5, duration: 0.08, yoyo: true, repeat: 9 }, 2.58);
      tl.from(".pressure-meter", { y: 90, opacity: 0, duration: 0.4, ease: "back.out(2)" }, 2.86);
      tl.from(".pressure-meter i", { scaleX: 0, transformOrigin: "left", duration: 0.72, ease: "power2.out" }, 3.02);
      tl.from(".pressure-alert", { scale: 2.4, opacity: 0, rotation: 12, duration: 0.3, ease: "power4.in" }, 3.48);
    }
  );

  add(
    {
      id: "fork-path",
      number: "21",
      title: "路径分叉",
      theme: "mint",
      headline: "同样的时间，<em>会走向不同结果</em>",
      subline: "分支、路径跟随和比较共同表达选择代价。",
      use: "机会成本、策略选择、A/B 路线"
    },
    `
      <div class="fork-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="fork-road fr1" d="M450 820V560C450 450 210 430 160 160"/>
          <path class="fork-road fr2" d="M450 820V560C450 450 690 430 740 160"/>
          <path class="fork-live" d="M450 820V560C450 450 690 430 740 160"/>
        </svg>
        <div class="fork-start">10h</div><div class="fork-runner">▲</div>
        <div class="fork-result fbad"><small>A</small><b>细节 +1</b></div>
        <div class="fork-result fgood"><small>B</small><b>真实反馈</b></div>
        <div class="fork-tags ft1"><span>再改一版</span><span>继续打磨</span></div>
        <div class="fork-tags ft2"><span>发布</span><span>验证</span></div>
      </div>
    `,
    "复合逻辑：<b>分支 + 路径跟随 + 对齐比较。</b>",
    (tl) => {
      tl.from(".fork-road", { strokeDashoffset: 1700, stagger: 0.08, duration: 0.88, ease: "power2.out" }, 0.9);
      tl.from(".fork-start", { scale: 0.1, opacity: 0, duration: 0.42, ease: "back.out(2.4)" }, 1.12);
      tl.from(".fork-tags>*", { x: (i) => i % 2 ? 230 : -230, opacity: 0, stagger: 0.12, duration: 0.4, ease: "expo.out" }, 1.52);
      tl.to(".fork-live", { strokeDashoffset: 0, duration: 1.35, ease: "power2.inOut" }, 1.75);
      tl.to(".fork-runner", { x: 290, y: -610, rotation: 52, duration: 1.35, ease: "power2.inOut" }, 1.75);
      tl.from(".fork-result", { scale: 0.2, opacity: 0, rotation: (i) => i ? 8 : -8, stagger: 0.2, duration: 0.4, ease: "back.out(2.2)" }, 2.86);
      tl.to(".fgood", { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1 }, 3.38);
    }
  );

  add(
    {
      id: "ripple-feedback",
      number: "22",
      title: "波纹反馈",
      theme: "night",
      headline: "一次行动，<em>会带动整个系统</em>",
      subline: "波纹、网络和回流共同表达因果扩散。",
      use: "连锁反应、反馈闭环、系统协同"
    },
    `
      <div class="ripple-stage">
        <i class="ripple-wave rw1"></i><i class="ripple-wave rw2"></i><i class="ripple-wave rw3"></i>
        <div class="ripple-core"><small>START</small><b>行动</b></div>
        <span class="ripple-node rn1">内容</span><span class="ripple-node rn2">产品</span>
        <span class="ripple-node rn3">渠道</span><span class="ripple-node rn4">反馈</span>
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="ripple-line rl1" d="M450 450C300 250 220 220 100 210"/>
          <path class="ripple-line rl2" d="M450 450C650 300 730 210 820 140"/>
          <path class="ripple-line rl3" d="M450 450C650 610 730 710 830 790"/>
          <path class="ripple-line rl4" d="M450 450C280 650 210 740 100 810"/>
        </svg>
        <div class="ripple-return">回到下一轮</div>
      </div>
    `,
    "复合逻辑：<b>缩放脉冲 + 网络扩散 + 闭环回流。</b>",
    (tl) => {
      tl.from(".ripple-core", { scale: 0.08, opacity: 0, rotation: -20, duration: 0.5, ease: "back.out(2.7)" }, 0.9);
      tl.fromTo(".ripple-wave", { scale: 0.1, opacity: 0.9 }, { scale: 1.65, opacity: 0, stagger: 0.16, duration: 0.86, ease: "power2.out" }, 1.3);
      tl.from(".ripple-line", { strokeDashoffset: 1000, stagger: 0.09, duration: 0.72, ease: "power2.out" }, 1.55);
      tl.from(".ripple-node", { scale: 0.2, opacity: 0, stagger: 0.14, duration: 0.38, ease: "back.out(2.3)" }, 1.86);
      tl.to(".ripple-node", { scale: 1.08, stagger: 0.08, duration: 0.18, yoyo: true, repeat: 1 }, 2.62);
      tl.from(".ripple-return", { scale: 1.8, opacity: 0, rotation: 8, duration: 0.3, ease: "power4.in" }, 3.0);
      tl.to(".ripple-core", { rotation: 360, duration: 0.85, ease: "power3.inOut" }, 3.18);
    }
  );

  add(
    {
      id: "network-cascade",
      number: "23",
      title: "网络级联",
      theme: "cobalt",
      headline: "一个节点变化，<em>网络会逐层响应</em>",
      subline: "节点、连线和错峰激活表现系统传播。",
      use: "组织协同、传播网络、依赖关系"
    },
    `
      <div class="network-stage">
        <svg viewBox="0 0 900 900" aria-hidden="true">
          <path class="network-edge ne1" d="M450 450L190 230"/><path class="network-edge ne2" d="M450 450L710 230"/>
          <path class="network-edge ne3" d="M450 450L160 670"/><path class="network-edge ne4" d="M450 450L740 670"/>
          <path class="network-edge ne5" d="M190 230L710 230"/><path class="network-edge ne6" d="M160 670L740 670"/>
          <path class="network-edge ne7" d="M190 230L160 670"/><path class="network-edge ne8" d="M710 230L740 670"/>
        </svg>
        <div class="network-node nn0"><small>00</small><b>核心</b></div>
        <div class="network-node nn1">内容</div><div class="network-node nn2">产品</div>
        <div class="network-node nn3">渠道</div><div class="network-node nn4">用户</div>
        <i class="network-signal ns1"></i><i class="network-signal ns2"></i><i class="network-signal ns3"></i><i class="network-signal ns4"></i>
      </div>
    `,
    "复合逻辑：<b>级联序列 + 路径传播 + 群体响应。</b>",
    (tl) => {
      tl.from(".network-edge", { strokeDashoffset: 900, stagger: 0.05, duration: 0.62, ease: "power2.out" }, 0.88);
      tl.from(".network-node", { scale: 0.1, opacity: 0, stagger: 0.14, duration: 0.36, ease: "back.out(2.4)" }, 1.18);
      tl.fromTo(".network-signal", { scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.16, duration: 0.32 }, 1.8);
      tl.to(".ns1", { x: -260, y: -220, duration: 0.62, ease: "power2.inOut" }, 2.0);
      tl.to(".ns2", { x: 260, y: -220, duration: 0.62, ease: "power2.inOut" }, 2.08);
      tl.to(".ns3", { x: -290, y: 220, duration: 0.62, ease: "power2.inOut" }, 2.16);
      tl.to(".ns4", { x: 290, y: 220, duration: 0.62, ease: "power2.inOut" }, 2.24);
      tl.to(".network-node:not(.nn0)", { scale: 1.12, stagger: 0.11, duration: 0.18, yoyo: true, repeat: 1 }, 2.68);
      tl.to(".network-edge", { stroke: "#ffcc45", stagger: 0.05, duration: 0.18 }, 3.22);
    }
  );

  add(
    {
      id: "deconstruct-rebuild",
      number: "24",
      title: "拆解重组",
      theme: "violet",
      headline: "旧结构被拆开，<em>才能重组出新系统</em>",
      subline: "碎片化、位移和形态变化共同表达重构。",
      use: "流程改造、组织升级、产品重构"
    },
    `
      <div class="rebuild-stage">
        <div class="old-system">
          <i class="rebuild-tile rt1"></i><i class="rebuild-tile rt2"></i><i class="rebuild-tile rt3"></i>
          <i class="rebuild-tile rt4"></i><i class="rebuild-tile rt5"></i><i class="rebuild-tile rt6"></i>
          <i class="rebuild-tile rt7"></i><i class="rebuild-tile rt8"></i><i class="rebuild-tile rt9"></i>
          <b>旧流程</b>
        </div>
        <div class="new-system"><small>REBUILT</small><b>新系统</b><span>可见 · 可复用 · 可协同</span></div>
        <i class="rebuild-path rp1"></i><i class="rebuild-path rp2"></i><i class="rebuild-path rp3"></i>
      </div>
    `,
    "复合逻辑：<b>分裂 + 空间路径 + 形态重组。</b>",
    (tl) => {
      tl.from(".old-system", { scale: 0.2, opacity: 0, rotation: -10, duration: 0.55, ease: "back.out(2.2)" }, 0.88);
      tl.from(".rebuild-tile", { scale: 0.1, opacity: 0, stagger: 0.05, duration: 0.3 }, 1.15);
      tl.to(".rebuild-tile", { x: () => gsap.utils.random(-420, 420), y: () => gsap.utils.random(-380, 380), rotation: () => gsap.utils.random(-80, 80), scale: 0.55, stagger: 0.025, duration: 0.7, ease: "expo.out" }, 1.8);
      tl.to(".old-system b", { opacity: 0, scale: 0.5, duration: 0.3 }, 1.86);
      tl.from(".rebuild-path", { scaleY: 0, transformOrigin: "top", stagger: 0.08, duration: 0.42 }, 2.15);
      tl.to(".rebuild-tile", { x: 0, y: 0, rotation: 0, scale: 0.12, opacity: 0, stagger: 0.025, duration: 0.62, ease: "power3.in" }, 2.56);
      tl.from(".new-system", { scale: 0.1, opacity: 0, rotation: 14, duration: 0.55, ease: "back.out(2.6)" }, 3.02);
      tl.from(".new-system>*", { y: 55, opacity: 0, stagger: 0.1, duration: 0.3 }, 3.32);
    }
  );
})();
