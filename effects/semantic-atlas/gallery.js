(function () {
  const scenes = window.MotionAtlas.scenes;
  const list = document.getElementById("scene-list");
  const frame = document.getElementById("preview");
  const phone = document.querySelector(".phone");
  const progress = document.getElementById("progress");
  const loopToggle = document.getElementById("loop-toggle");
  const search = document.getElementById("scene-search");
  const familyFilter = document.getElementById("family-filter");

  let currentId = "mask-reveal";
  let activeKind = "all";
  let speed = 1;
  let playing = true;
  let duration = 5.6;

  function currentScene() {
    return scenes.find((scene) => scene.id === currentId) || scenes[0];
  }

  function currentIndex() {
    return scenes.findIndex((scene) => scene.id === currentId);
  }

  function post(type, value) {
    frame.contentWindow?.postMessage({ source: "motion-atlas-control", type, value }, "*");
  }

  function scalePreview() {
    const scale = phone.clientWidth / 1080;
    frame.style.transform = `scale(${scale})`;
  }

  function updatePlayButton() {
    const button = document.getElementById("play-toggle");
    button.querySelector("span").textContent = playing ? "Ⅱ" : "▶";
    button.querySelector("b").textContent = playing ? "暂停" : "继续";
    button.title = playing ? "暂停动画" : "继续动画";
    button.setAttribute("aria-label", button.title);
  }

  function updateIdentity() {
    const scene = currentScene();
    document.getElementById("current-number").textContent = scene.number;
    document.getElementById("current-title").textContent = scene.title;
    document.getElementById("current-meta").textContent = `${scene.family} · ${scene.kind === "atomic" ? "原子语法" : "复合叙事"}`;
    document.getElementById("current-use").textContent = scene.use;
  }

  function renderList() {
    const query = search.value.trim().toLowerCase();
    const family = familyFilter.value;
    const visible = scenes.filter((scene) => {
      const kindMatch = activeKind === "all" || scene.kind === activeKind;
      const familyMatch = family === "all" || scene.family === family;
      const queryMatch = !query || `${scene.title}${scene.family}${scene.use}`.toLowerCase().includes(query);
      return kindMatch && familyMatch && queryMatch;
    });

    list.innerHTML = visible.map((scene) => `
      <button class="scene-item ${scene.id === currentId ? "on" : ""}" data-scene="${scene.id}">
        <span>${scene.number}</span>
        <div><b>${scene.title}</b><small>${scene.use}</small></div>
      </button>
    `).join("");

    list.querySelectorAll("[data-scene]").forEach((button) => {
      button.addEventListener("click", () => select(button.dataset.scene));
    });
  }

  function select(id) {
    currentId = id;
    playing = true;
    progress.value = 0;
    updateIdentity();
    updatePlayButton();
    renderList();
    frame.src = `index.html?scene=${encodeURIComponent(id)}&autoplay=1&loop=${loopToggle.checked ? 1 : 0}&speed=${speed}`;
  }

  function step(delta) {
    const nextIndex = (currentIndex() + delta + scenes.length) % scenes.length;
    select(scenes[nextIndex].id);
  }

  document.querySelectorAll("[data-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-kind]").forEach((item) => item.classList.remove("on"));
      button.classList.add("on");
      activeKind = button.dataset.kind;
      renderList();
    });
  });

  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-speed]").forEach((item) => item.classList.remove("on"));
      button.classList.add("on");
      speed = Number(button.dataset.speed);
      post("setSpeed", speed);
    });
  });

  document.getElementById("previous").addEventListener("click", () => step(-1));
  document.getElementById("next").addEventListener("click", () => step(1));
  document.getElementById("restart").addEventListener("click", () => {
    playing = true;
    updatePlayButton();
    post("restart");
  });
  document.getElementById("play-toggle").addEventListener("click", () => {
    playing = !playing;
    updatePlayButton();
    post(playing ? "play" : "pause");
  });
  loopToggle.addEventListener("change", () => post("setLoop", loopToggle.checked));
  familyFilter.addEventListener("change", renderList);
  search.addEventListener("input", renderList);
  progress.addEventListener("input", () => {
    playing = false;
    updatePlayButton();
    post("seek", Number(progress.value) / 1000 * duration);
  });

  window.addEventListener("message", (event) => {
    const message = event.data || {};
    if (message.source !== "motion-atlas" || message.sceneId !== currentId) return;
    playing = Boolean(message.playing);
    duration = Number(message.duration) || 5.6;
    progress.value = Math.round((Number(message.progress) || 0) * 1000);
    document.getElementById("current-time").textContent = (Number(message.time) || 0).toFixed(1);
    document.getElementById("total-time").textContent = duration.toFixed(1);
    updatePlayButton();
  });

  frame.addEventListener("load", () => post("getState"));
  new ResizeObserver(scalePreview).observe(phone);
  scalePreview();
  updateIdentity();
  updatePlayButton();
  renderList();
})();
