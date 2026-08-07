(function () {
  const params = new URLSearchParams(window.location.search);
  const variables = window.__hfVariables || {};
  const requestedId = variables.sceneId || params.get("scene") || "mask-reveal";
  const scene = window.MotionAtlas.get(requestedId);
  const mount = document.getElementById("atlas-scene");

  mount.innerHTML = scene.html();
  document.title = `${scene.number} ${scene.title} · 语义动画实验室`;

  const tl = gsap.timeline({ paused: true });
  tl.from(".scene-number", { y: -45, opacity: 0, duration: 0.28, ease: "power3.out" }, 0.05);
  tl.from(".scene-label", { x: 90, opacity: 0, duration: 0.32, ease: "power3.out" }, 0.12);
  tl.from(".scene-head h1", { x: -940, skewX: -6, duration: 0.58, ease: "expo.out" }, 0.18);
  tl.from(".scene-head h1 em", { x: 940, duration: 0.58, ease: "expo.out" }, 0.34);
  tl.from(".scene-head p", { y: 50, opacity: 0, duration: 0.36, ease: "power3.out" }, 0.5);
  scene.animate(tl);
  tl.from(".scene-verdict", { y: 100, opacity: 0, duration: 0.44, ease: "expo.out" }, Math.max(3.75, tl.duration() - 0.15));

  if (tl.duration() < 5.6) {
    tl.to({}, { duration: 5.6 - tl.duration() });
  }

  window.__timelines = window.__timelines || {};
  window.__timelines.main = tl;

  let loop = params.get("loop") === "1";
  let speed = Number(params.get("speed") || 1);
  let stateTick = 0;

  function notify(force = false) {
    const now = performance.now();
    if (!force && now - stateTick < 90) return;
    stateTick = now;
    window.parent.postMessage({
      source: "motion-atlas",
      type: "state",
      sceneId: scene.id,
      playing: tl.isActive() && !tl.paused(),
      progress: tl.progress(),
      time: tl.time(),
      duration: tl.duration(),
      loop,
      speed
    }, "*");
  }

  function play() {
    if (tl.progress() >= 0.999) tl.restart();
    else tl.play();
    notify(true);
  }

  function pause() {
    tl.pause();
    notify(true);
  }

  function restart() {
    tl.restart();
    notify(true);
  }

  tl.timeScale(speed);
  tl.eventCallback("onUpdate", () => notify(false));
  tl.eventCallback("onComplete", () => {
    if (loop) tl.restart();
    else pause();
  });

  window.addEventListener("message", (event) => {
    const message = event.data || {};
    if (message.source !== "motion-atlas-control") return;

    if (message.type === "play") play();
    if (message.type === "pause") pause();
    if (message.type === "restart") restart();
    if (message.type === "setLoop") {
      loop = Boolean(message.value);
      notify(true);
    }
    if (message.type === "setSpeed") {
      speed = Math.max(0.5, Math.min(2, Number(message.value) || 1));
      tl.timeScale(speed);
      notify(true);
    }
    if (message.type === "seek") {
      tl.pause(Math.max(0, Math.min(tl.duration(), Number(message.value) || 0)));
      notify(true);
    }
    if (message.type === "getState") notify(true);
  });

  window.__atlas = { scene, timeline: tl, play, pause, restart };
  document.documentElement.dataset.ready = "true";

  if (params.get("autoplay") === "1") play();
  else {
    tl.seek(Math.min(0.9, tl.duration()));
    pause();
  }
})();
