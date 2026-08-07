const state = {
  items: [],
  selected: null,
  selectedContent: null,
  paused: false,
  view: "styles",
};

const labels = {
  status: {
    production: "生产已锁定",
    stable: "稳定库",
    experimental: "视觉实验",
    legacy: "历史版本",
  },
  kind: {
    "editing-style": "剪辑方案",
    "full-screen": "全画幅动画",
    atlas: "动画分类库",
    lookdev: "视觉方案",
    engine: "渲染引擎",
    algorithm: "算法参数",
  },
  sharing: {
    "owner-only": "私有",
    "shareable-core": "可共享核心",
    "reference-only": "仅作参考",
    "not-for-transfer": "暂不移交",
  },
};

const elements = {
  grid: document.querySelector("#assetGrid"),
  search: document.querySelector("#searchInput"),
  status: document.querySelector("#statusFilter"),
  kind: document.querySelector("#kindFilter"),
  count: document.querySelector("#visibleCount"),
  pause: document.querySelector("#pauseAll"),
  previewKicker: document.querySelector("#previewKicker"),
  previewTitle: document.querySelector("#previewTitle"),
  previewStage: document.querySelector("#previewStage"),
  previewMeta: document.querySelector("#previewMeta"),
  assetContents: document.querySelector("#assetContents"),
  contentsTitle: document.querySelector("#contentsTitle"),
  contentsHint: document.querySelector("#contentsHint"),
  contentsList: document.querySelector("#contentsList"),
  reveal: document.querySelector("#revealSource"),
  dialog: document.querySelector("#assetDialog"),
  add: document.querySelector("#addAsset"),
  close: document.querySelector("#closeDialog"),
  form: document.querySelector("#assetForm"),
  formError: document.querySelector("#formError"),
  tabs: [...document.querySelectorAll(".view-tab")],
  counts: [...document.querySelectorAll("[data-count]")],
  toolbar: document.querySelector("#libraryToolbar"),
  library: document.querySelector("#libraryWorkspace"),
  workbench: document.querySelector("#workbenchView"),
  workbenchFrame: document.querySelector("#workbenchFrame"),
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function filteredItems() {
  const query = elements.search.value.trim().toLowerCase();
  const status = elements.status.value;
  const kind = elements.kind.value;
  return state.items.filter((item) => {
    const haystack = [
      item.name,
      item.version,
      item.summary,
      item.kind,
      item.invocation,
      item.track,
      ...(item.derivedFrom || []),
      ...(item.tags || []),
      ...(item.contents || []).flatMap((content) => [content.name, content.id]),
    ]
      .join(" ")
      .toLowerCase();
    return (
      item.section === state.view &&
      (!query || haystack.includes(query)) &&
      (!status || item.status === status) &&
      (!kind || item.kind === kind)
    );
  });
}

function renderGrid() {
  if (state.view === "workbench") return;
  const items = filteredItems();
  elements.count.textContent = String(items.length);
  elements.grid.innerHTML = items
    .map(
      (item) => `
        <button class="asset-card ${item.exists ? "" : "missing"} ${state.selected?.id === item.id ? "active" : ""}"
          type="button" data-id="${escapeHtml(item.id)}" title="${escapeHtml(item.summary)}">
          <div class="card-top">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="status ${escapeHtml(item.status)}">${escapeHtml(labels.status[item.status] || item.status)}</span>
          </div>
          <p class="summary">${escapeHtml(item.summary)}</p>
          <div class="card-foot">
            <span class="version">V ${escapeHtml(item.version)}</span>
            <span class="kind">${escapeHtml(labels.kind[item.kind] || item.kind)}</span>
            ${item.exists ? "" : '<span class="missing-note">真源未找到</span>'}
          </div>
        </button>
      `,
    )
    .join("");

  elements.grid.querySelectorAll(".asset-card").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.items.find((candidate) => candidate.id === button.dataset.id);
      if (item) selectItem(item);
    });
  });
}

// 内容清单点击 → 活预览:动画库的 index.html 支持 ?scene= 深链(开源版不带渲染视频,预览就是动画本体)
function contentPreviewUrl(item, content) {
  const base = item.previewUrl?.replace(/[^/]+(?:\?.*)?$/, "") || `/${item.sourcePath}/`;
  return `${base}index.html?scene=${encodeURIComponent(content.id)}&autoplay=1&loop=1`;
}

function previewMarkup(item, content = state.selectedContent) {
  if (!item.exists) {
    return '<div class="empty-preview"><span>!</span><p>本机没有找到这项资产的真源</p></div>';
  }
  if (content) {
    return `<iframe src="${escapeHtml(contentPreviewUrl(item, content))}" title="${escapeHtml(content.name)}" loading="eager"></iframe>`;
  }
  if (!item.previewUrl || !item.preview) {
    return '<div class="empty-preview"><span>&lt;/&gt;</span><p>这是代码或参数资产，请打开真源查看</p></div>';
  }
  if (item.preview.type === "html") {
    return `<iframe src="${escapeHtml(item.previewUrl)}" title="${escapeHtml(item.name)}" loading="eager"></iframe>`;
  }
  if (item.preview.type === "video") {
    return `<video src="${escapeHtml(item.previewUrl)}" controls playsinline preload="metadata"></video>`;
  }
  if (item.preview.type === "image") {
    return `<img src="${escapeHtml(item.previewUrl)}" alt="${escapeHtml(item.name)}" />`;
  }
  return '<div class="empty-preview"><span>?</span><p>暂不支持这种预览格式</p></div>';
}

function renderContents(item) {
  const contents = item.contents || [];
  elements.assetContents.hidden = contents.length === 0;
  if (!contents.length) {
    elements.contentsList.innerHTML = "";
    return;
  }

  elements.contentsTitle.textContent = item.contentsTitle || `${contents.length} 项内容`;
  elements.contentsHint.textContent = "单层清单";
  elements.contentsList.innerHTML = contents
    .map(
      (content) => `
        <button class="content-item ${state.selectedContent?.id === content.id ? "active" : ""}"
          type="button" data-content-id="${escapeHtml(content.id)}" title="播放${escapeHtml(content.name)}">
          <span>${escapeHtml(content.number)}</span><strong>${escapeHtml(content.name)}</strong>
        </button>
      `,
    )
    .join("");

  elements.contentsList.querySelectorAll(".content-item").forEach((button) => {
    button.addEventListener("click", () => {
      const content = contents.find((candidate) => candidate.id === button.dataset.contentId);
      if (content) selectContent(content);
    });
  });
}

function selectContent(content) {
  if (!state.selected) return;
  state.selectedContent = content;
  state.paused = false;
  elements.pause.textContent = "Ⅱ";
  elements.pause.title = "暂停当前预览";
  elements.previewTitle.textContent = `${state.selected.name} · ${content.name}`;
  elements.previewStage.innerHTML = previewMarkup(state.selected, content);
  renderContents(state.selected);
}

function selectItem(item) {
  state.selected = item;
  state.selectedContent = item.contents?.[0] || null;
  state.paused = false;
  elements.pause.textContent = "Ⅱ";
  elements.pause.title = "暂停当前预览";
  elements.previewKicker.textContent = `${labels.status[item.status] || item.status} / ${labels.kind[item.kind] || item.kind}`;
  elements.previewTitle.textContent = state.selectedContent ? `${item.name} · ${state.selectedContent.name}` : item.name;
  elements.previewStage.innerHTML = previewMarkup(item, state.selectedContent);
  elements.reveal.disabled = !item.exists;
  elements.previewMeta.innerHTML = `
    <div class="meta-strip">
      <span>V ${escapeHtml(item.version)}</span>
      <span>${escapeHtml(labels.status[item.status] || item.status)}</span>
      <code title="稳定 ID">${escapeHtml(item.id)}</code>
      <span class="meta-source" title="${escapeHtml(item.sourceLabel)}">${escapeHtml(item.sourceLabel)}</span>
      <div class="meta-actions">
        ${item.invocation ? '<button class="copy-invocation" type="button" title="复制调用口令">复制口令</button>' : ""}
      </div>
    </div>
  `;
  const copyButton = elements.previewMeta.querySelector(".copy-invocation");
  copyButton?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(item.invocation);
    const original = copyButton.textContent;
    copyButton.textContent = "已复制调用口令";
    window.setTimeout(() => {
      copyButton.textContent = original;
    }, 1400);
  });
  renderContents(item);
  renderGrid();
}

function togglePreview() {
  state.paused = !state.paused;
  const video = elements.previewStage.querySelector("video");
  const frame = elements.previewStage.querySelector("iframe");

  if (video) {
    if (state.paused) video.pause();
    else video.play().catch(() => {});
  }

  if (frame) {
    try {
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      if (doc) {
        let style = doc.querySelector("#asset-library-pause-style");
        if (state.paused && !style) {
          style = doc.createElement("style");
          style.id = "asset-library-pause-style";
          style.textContent = "* { animation-play-state: paused !important; }";
          doc.head.appendChild(style);
        } else if (!state.paused && style) {
          style.remove();
        }
      }
      const timelines = win?.__timelines || {};
      Object.values(timelines).forEach((timeline) => {
        if (state.paused) timeline.pause?.();
        else timeline.play?.();
      });
    } catch (error) {
      console.warn("Unable to control iframe animation", error);
    }
  }

  elements.pause.textContent = state.paused ? "▶" : "Ⅱ";
  elements.pause.title = state.paused ? "继续当前预览" : "暂停当前预览";
}

async function revealSource() {
  if (!state.selected) return;
  await fetch(`/api/reveal?id=${encodeURIComponent(state.selected.id)}`, {
    method: "POST",
  });
}

async function submitAsset(event) {
  event.preventDefault();
  elements.formError.textContent = "";
  const data = Object.fromEntries(new FormData(elements.form).entries());
  const response = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    elements.formError.textContent = result.error || "登记失败";
    return;
  }
  elements.dialog.close();
  elements.form.reset();
  await loadCatalog();
  const item = state.items.find((candidate) => candidate.id === result.item.id);
  if (item) selectItem(item);
}

async function loadCatalog() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  const data = await response.json();
  state.items = data.items;
  elements.counts.forEach((node) => {
    const section = node.dataset.count;
    node.textContent = String(state.items.filter((item) => item.section === section).length);
  });
  renderGrid();
  if (!state.selected && filteredItems().length) {
    selectItem(filteredItems()[0]);
  }
}

function setView(view) {
  state.view = view;
  state.selected = null;
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  const isWorkbench = view === "workbench";
  elements.toolbar.hidden = isWorkbench;
  elements.library.hidden = isWorkbench;
  elements.workbench.hidden = !isWorkbench;
  elements.pause.hidden = isWorkbench;
  elements.add.hidden = isWorkbench;

  if (isWorkbench) {
    if (!elements.workbenchFrame.src) {
      elements.workbenchFrame.src = "/editor.html?embedded=1";
    }
    return;
  }

  renderGrid();
  const first = filteredItems()[0];
  if (first) selectItem(first);
}

[elements.search, elements.status, elements.kind].forEach((control) => {
  control.addEventListener("input", renderGrid);
});
elements.pause.addEventListener("click", togglePreview);
elements.reveal.addEventListener("click", revealSource);
elements.add.addEventListener("click", () => elements.dialog.showModal());
elements.close.addEventListener("click", () => elements.dialog.close());
elements.form.addEventListener("submit", submitAsset);
elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

loadCatalog().catch((error) => {
  elements.grid.innerHTML = `<p>本地资产库读取失败：${escapeHtml(error.message)}</p>`;
});
