(function () {
  const scenes = [];

  function register(scene) {
    scenes.push(scene);
  }

  function shell(meta, body, verdict) {
    return `
      <article class="scene theme-${meta.theme}" data-scene-id="${meta.id}">
        <div class="grain"></div>
        <header class="scene-head">
          <div class="scene-number">${meta.number}</div>
          <div class="scene-label">${meta.kind === "atomic" ? "ATOMIC MOTION" : "COMPOSITE MOTION"} / ${meta.family}</div>
          <h1>${meta.headline}</h1>
          <p>${meta.subline}</p>
        </header>
        <div class="scene-body">${body}</div>
        <footer class="scene-verdict">${verdict}</footer>
      </article>
    `;
  }

  function svgPath(path, className = "") {
    return `<svg class="atlas-svg ${className}" viewBox="0 0 900 900" aria-hidden="true"><path d="${path}"/></svg>`;
  }

  window.MotionAtlas = {
    scenes,
    register,
    shell,
    svgPath,
    get(id) {
      return scenes.find((scene) => scene.id === id) || scenes[0];
    }
  };
})();
