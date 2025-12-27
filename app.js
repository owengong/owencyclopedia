/* Owencyclopedia — Fractal MVP v2 (focus lens) */

(() => {
  const DATA = window.OWEN_MVP;
  if (!DATA || !Array.isArray(DATA.nodes)) {
    // eslint-disable-next-line no-console
    console.error("[owencyclopedia] Missing window.OWEN_MVP data.");
    return;
  }

  const byId = new Map();
  for (const n of DATA.nodes) byId.set(n.id, n);

  const parentById = new Map(); // childId -> parentId
  for (const n of DATA.nodes) {
    const kids = Array.isArray(n.children) ? n.children : [];
    for (const childId of kids) {
      if (!parentById.has(childId)) parentById.set(childId, n.id);
    }
  }

  const TOP_COLORS = {
    health: "#2f855a",
    relationships: "#9f1239",
    mastery: "#5b21b6",
    wealth: "#a16207",
    work: "#1d4ed8",
    purpose: "#be185d",
    play: "#0e7490",
  };

  function validateData() {
    const missing = new Set();
    const dupes = [];
    const seen = new Set();
    for (const n of DATA.nodes) {
      if (seen.has(n.id)) dupes.push(n.id);
      seen.add(n.id);
      for (const cid of n.children || []) if (!byId.has(cid)) missing.add(cid);
      for (const rid of n.related || []) if (!byId.has(rid)) missing.add(rid);
    }
    if (dupes.length) {
      // eslint-disable-next-line no-console
      console.warn("[owencyclopedia] Duplicate node ids:", dupes);
    }
    if (missing.size) {
      // eslint-disable-next-line no-console
      console.warn("[owencyclopedia] Missing referenced node ids:", Array.from(missing));
    }
  }
  validateData();

  function getNode(id) {
    return byId.get(id) || null;
  }

  function getChildren(id) {
    const n = getNode(id);
    const kids = n && Array.isArray(n.children) ? n.children : [];
    return kids.map(getNode).filter(Boolean);
  }

  function getRelated(id) {
    const n = getNode(id);
    const rel = n && Array.isArray(n.related) ? n.related : [];
    return rel.map(getNode).filter(Boolean);
  }

  function getPathIds(id) {
    const path = [];
    let cur = id;
    const guard = new Set();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      path.push(cur);
      cur = parentById.get(cur);
    }
    return path.reverse();
  }

  function getTopLevelId(id) {
    const path = getPathIds(id);
    if (path.length >= 2 && path[0] === DATA.rootId) return path[1];
    return path[0] || DATA.rootId;
  }

  const descMemo = new Map();
  function countDescendants(id) {
    if (descMemo.has(id)) return descMemo.get(id);
    const n = getNode(id);
    if (!n || !Array.isArray(n.children) || n.children.length === 0) {
      descMemo.set(id, 0);
      return 0;
    }
    let total = 0;
    for (const cid of n.children) {
      total += 1 + countDescendants(cid);
    }
    descMemo.set(id, total);
    return total;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseHashId() {
    const h = (window.location.hash || "").replace(/^#/, "");
    if (!h) return null;
    if (h.startsWith("id=")) return decodeURIComponent(h.slice(3));
    return decodeURIComponent(h);
  }

  function setHashId(id) {
    window.location.hash = `id=${encodeURIComponent(id)}`;
  }

  const elApp = document.getElementById("app");
  const elCrumbs = document.getElementById("crumbs");
  const elOutline = document.getElementById("outline");
  const elOutlineTree = document.getElementById("outlineTree");
  const elToggleOutline = document.getElementById("toggleOutline");
  const elToggleMap = document.getElementById("toggleMap");
  const elGoHome = document.getElementById("goHome");
  const elSearchInput = document.getElementById("searchInput");
  const elSearchResults = document.getElementById("searchResults");

  const elLensSurface = document.getElementById("lensSurface");
  const elLensSvg = document.getElementById("lensSvg");
  const elEdges = document.getElementById("lensEdges");
  const elNodes = document.getElementById("lensNodes");

  const elPanelKicker = document.getElementById("panelKicker");
  const elPanelTitle = document.getElementById("panelTitle");
  const elPanelBlurb = document.getElementById("panelBlurb");
  const elPanelContent = document.getElementById("panelContent");
  const elPanelChildren = document.getElementById("panelChildren");
  const elPanelRelated = document.getElementById("panelRelated");

  const state = {
    focusId: DATA.rootId,
    outlineOpen: true,
    mapOpen: true,
    search: {
      open: false,
      query: "",
      results: [],
      activeIndex: 0,
    },
  };

  function setOutlineOpen(open) {
    state.outlineOpen = Boolean(open);
    elToggleOutline.setAttribute("aria-pressed", String(state.outlineOpen));
    elApp.classList.toggle("outline-open", state.outlineOpen);
  }

  function setMapOpen(open) {
    state.mapOpen = Boolean(open);
    if (elToggleMap) elToggleMap.setAttribute("aria-pressed", String(state.mapOpen));
    elApp.classList.toggle("map-closed", !state.mapOpen);
  }

  function setFocus(id, { fromHash = false } = {}) {
    if (!id || !byId.has(id)) id = DATA.rootId;
    if (state.focusId === id) return;
    state.focusId = id;
    if (!fromHash) setHashId(id);

    // Keep navigation snappy: when you change focus, re-center the map lens.
    resetMapView({ keepZoom: true });
    renderAll();
  }

  // Map zoom/pan (bounded)
  const map = {
    base: { x: -600, y: -420, w: 1200, h: 840 },
    zoom: 1.2,
    minZoom: 0.85,
    maxZoom: 2.2,
    cx: 0,
    cy: 0,
    isPanning: false,
    captureSet: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startCx: 0,
    startCy: 0,
    moved: false,
    suppressClick: false,
    panLimit: 520, // in svg/world units; prevents “infinite” drift
  };

  function parseViewBox(vb) {
    const parts = String(vb || "").trim().split(/[,\s]+/).map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
    return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
  }

  function clampMapPan() {
    map.cx = clamp(map.cx, -map.panLimit, map.panLimit);
    map.cy = clamp(map.cy, -map.panLimit, map.panLimit);
  }

  function currentViewBox() {
    const w = map.base.w / map.zoom;
    const h = map.base.h / map.zoom;
    return { x: map.cx - w / 2, y: map.cy - h / 2, w, h };
  }

  function applyMapViewBox() {
    if (!elLensSvg) return;
    clampMapPan();
    const vb = currentViewBox();
    elLensSvg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function resetMapView({ keepZoom } = { keepZoom: true }) {
    if (!keepZoom) map.zoom = 1.2;
    map.cx = 0;
    map.cy = 0;
    applyMapViewBox();
  }

  function zoomAtClientPoint(nextZoom, clientX, clientY) {
    if (!elLensSvg) return;
    const rect = elLensSvg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const vb0 = currentViewBox();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;

    const worldX = vb0.x + nx * vb0.w;
    const worldY = vb0.y + ny * vb0.h;

    map.zoom = nextZoom;
    const vb1w = map.base.w / map.zoom;
    const vb1h = map.base.h / map.zoom;
    const vb1x = worldX - nx * vb1w;
    const vb1y = worldY - ny * vb1h;

    map.cx = vb1x + vb1w / 2;
    map.cy = vb1y + vb1h / 2;
    applyMapViewBox();
  }

  function renderRichText(text) {
    const raw = String(text || "").replaceAll("\r\n", "\n");
    const lines = raw.split("\n");

    let out = "";
    let inList = false;

    function closeList() {
      if (inList) {
        out += "</ul>";
        inList = false;
      }
    }

    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        closeList();
        continue;
      }

      if (t.startsWith("### ")) {
        closeList();
        out += `<h3>${escapeHtml(t.slice(4))}</h3>`;
        continue;
      }
      if (t.startsWith("## ")) {
        closeList();
        out += `<h2>${escapeHtml(t.slice(3))}</h2>`;
        continue;
      }
      if (t.startsWith("# ")) {
        closeList();
        out += `<h2>${escapeHtml(t.slice(2))}</h2>`;
        continue;
      }
      if (t.startsWith("- ")) {
        if (!inList) {
          out += "<ul>";
          inList = true;
        }
        out += `<li>${escapeHtml(t.slice(2))}</li>`;
        continue;
      }

      closeList();
      out += `<p>${escapeHtml(t)}</p>`;
    }

    closeList();
    return out;
  }

  function renderBreadcrumbs() {
    const pathIds = getPathIds(state.focusId);
    const parts = [];
    for (let i = 0; i < pathIds.length; i++) {
      const nid = pathIds[i];
      const n = getNode(nid);
      if (!n) continue;
      const isLast = i === pathIds.length - 1;
      parts.push(
        `<button class="crumb" type="button" data-focus="${escapeHtml(nid)}" ${
          isLast ? 'aria-current="page"' : ""
        }>
          <span class="crumb__label">${escapeHtml(n.title)}</span>
        </button>`
      );
      if (!isLast) parts.push(`<span class="crumb__sep">›</span>`);
    }
    elCrumbs.innerHTML = parts.join("");
  }

  function layoutChildrenRadial(children, hasParent = false) {
    const n = children.length;
    if (n === 0) return { radius: 0, positions: [] };
    const r = clamp(170 + n * 10, 190, 320);
    // If we also show a parent node above the focus, offset children so none sits exactly at the top.
    const start = -Math.PI / 2 + (hasParent ? Math.PI / n : 0);
    const positions = children.map((child, idx) => {
      const a = start + (idx / n) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      return { id: child.id, x, y };
    });
    return { radius: r, positions };
  }

  function nodeRadius(id, { isFocus }) {
    if (isFocus) return 98;
    const d = countDescendants(id);
    const base = 46;
    const bump = Math.log(d + 1) * 10;
    return clamp(base + bump, 40, 78);
  }

  function renderLens() {
    const focus = getNode(state.focusId);
    if (!focus) return;

    const children = getChildren(focus.id);
    const parentId = parentById.get(focus.id) || null;
    // We don't need to show the root "Owencyclopedia" as the parent for top-level categories.
    const parent = parentId && parentId !== DATA.rootId ? getNode(parentId) : null;
    const { radius: childRadius, positions } = layoutChildrenRadial(children, Boolean(parent));
    const parentPos = parent ? { id: parent.id, x: 0, y: -clamp((childRadius || 220) * 0.62, 120, 210) } : null;

    elEdges.innerHTML = "";
    elNodes.innerHTML = "";

    // Parent edge (distinct)
    if (parentPos) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", String(parentPos.x));
      line.setAttribute("y2", String(parentPos.y));
      line.setAttribute("class", "edge edge--parent");
      line.setAttribute("marker-end", "url(#arrowInk)");
      elEdges.appendChild(line);
    }

    // Parent-child edges
    for (const p of positions) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", String(p.x));
      line.setAttribute("y2", String(p.y));
      line.setAttribute("class", "edge");
      elEdges.appendChild(line);
    }

    // Related edges (only if both endpoints are visible in current lens set)
    const visibleIds = new Set([focus.id, ...children.map((c) => c.id)]);
    if (parentPos) visibleIds.add(parentPos.id);
    const relatedPairs = [];
    for (const aId of visibleIds) {
      const rel = getRelated(aId);
      for (const b of rel) {
        if (visibleIds.has(b.id) && aId < b.id) relatedPairs.push([aId, b.id]);
      }
    }
    if (relatedPairs.length) {
      const posById = new Map();
      posById.set(focus.id, { x: 0, y: 0 });
      if (parentPos) posById.set(parentPos.id, { x: parentPos.x, y: parentPos.y });
      for (const p of positions) posById.set(p.id, { x: p.x, y: p.y });
      for (const [aId, bId] of relatedPairs) {
        const a = posById.get(aId);
        const b = posById.get(bId);
        if (!a || !b) continue;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y));
        line.setAttribute("class", "edge edge--related");
        elEdges.appendChild(line);
      }
    }

    function addNode({ id, x, y, role }) {
      const n = getNode(id);
      if (!n) return;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const top = getTopLevelId(id);
      const accent = TOP_COLORS[top] || "#22d3ee";
      g.setAttribute("class", `node node--${role} is-entering`);
      g.setAttribute("data-id", id);
      g.style.setProperty("--nodeAccent", accent);
      g.setAttribute("transform", `translate(${x} ${y})`);

      const isFocus = role === "focus";
      const baseR = nodeRadius(id, { isFocus });
      const r = role === "parent" ? clamp(baseR * 0.72, 34, 58) : baseR;
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", String(r));
      circle.setAttribute("class", "node__circle");
      g.appendChild(circle);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "node__label");
      label.setAttribute("y", isFocus ? "-8" : role === "parent" ? "-6" : "-6");
      label.textContent = n.title;
      g.appendChild(label);

      const meta = document.createElementNS("http://www.w3.org/2000/svg", "text");
      meta.setAttribute("class", "node__meta");
      meta.setAttribute("y", isFocus ? "18" : role === "parent" ? "14" : "16");
      const kids = (n.children || []).length;
      if (role === "parent") meta.textContent = "Parent";
      else meta.textContent = kids ? `${kids} subpages` : "page";
      g.appendChild(meta);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      if (role === "parent") title.textContent = `Parent: ${n.title}`;
      else title.textContent = n.blurb ? `${n.title} — ${n.blurb}` : n.title;
      g.appendChild(title);

      elNodes.appendChild(g);
      requestAnimationFrame(() => g.classList.remove("is-entering"));
    }

    if (parentPos) addNode({ id: parentPos.id, x: parentPos.x, y: parentPos.y, role: "parent" });
    addNode({ id: focus.id, x: 0, y: 0, role: "focus" });
    for (const p of positions) addNode({ id: p.id, x: p.x, y: p.y, role: "child" });
  }

  function renderPanel() {
    const n = getNode(state.focusId);
    if (!n) return;

    const path = getPathIds(n.id)
      .map((id) => getNode(id))
      .filter(Boolean)
      .map((x) => x.title);

    elPanelKicker.textContent = path.length ? path.slice(0, -1).join(" / ") || " " : " ";
    elPanelTitle.textContent = n.title;
    elPanelBlurb.textContent = n.blurb || "";

    const children = getChildren(n.id);

    if (elPanelContent) {
      const content =
        typeof n.content === "string" && n.content.trim()
          ? n.content
          : `# ${n.title}\n\nWrite your notes here in \`data.js\` by adding a \`content\` field.\n\n## Prompts\n- What is this page for?\n- What are my current rules / principles?\n- What changed recently?\n- Links / references\n`;
      elPanelContent.innerHTML = renderRichText(content);
    }

    if (!children.length) {
      elPanelChildren.innerHTML = `<div class="chip is-empty" aria-disabled="true">No children yet</div>`;
    } else {
      elPanelChildren.innerHTML = children
        .map(
          (c) =>
            `<button class="chip" type="button" data-focus="${escapeHtml(c.id)}">${escapeHtml(
              c.title
            )}</button>`
        )
        .join("");
    }

    const related = getRelated(n.id);
    if (!related.length) {
      elPanelRelated.innerHTML = `<div class="chip is-empty" aria-disabled="true">None (by design)</div>`;
    } else {
      elPanelRelated.innerHTML = related
        .map(
          (r) =>
            `<button class="chip" type="button" data-focus="${escapeHtml(r.id)}">${escapeHtml(
              r.title
            )}</button>`
        )
        .join("");
    }
  }

  function renderOutline() {
    const openSet = new Set(getPathIds(state.focusId));

    function nodeHtml(id) {
      const n = getNode(id);
      if (!n) return "";
      const kids = Array.isArray(n.children) ? n.children : [];
      const activeClass = id === state.focusId ? "is-active" : "";

      if (!kids.length) {
        return `<div class="outline__leaf">
          <button type="button" class="outline__btn ${activeClass}" data-focus="${escapeHtml(
            id
          )}">${escapeHtml(n.title)}</button>
        </div>`;
      }

      const isOpen = openSet.has(id);
      return `<details class="outline__branch" ${isOpen ? "open" : ""}>
        <summary>
          <span class="outline__caret" aria-hidden="true"></span>
          <button type="button" class="outline__btn ${activeClass}" data-focus="${escapeHtml(
            id
          )}">${escapeHtml(n.title)}</button>
        </summary>
        <div class="outline__children">
          ${kids.map(nodeHtml).join("")}
        </div>
      </details>`;
    }

    elOutlineTree.innerHTML = nodeHtml(DATA.rootId);
  }

  function scoreMatch(query, node) {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    const title = (node.title || "").toLowerCase();
    const aliases = Array.isArray(node.aliases) ? node.aliases : [];
    const pool = [title, ...aliases.map((a) => String(a).toLowerCase())];

    let best = 0;
    for (const t of pool) {
      if (!t) continue;
      if (t === q) best = Math.max(best, 100);
      else if (t.startsWith(q)) best = Math.max(best, 85);
      else if (t.includes(q)) best = Math.max(best, 65);
    }
    // Light preference for more “specific” nodes when searching common terms
    best += clamp(Math.log(countDescendants(node.id) + 1) * 2, 0, 8);
    return best;
  }

  function searchNodes(query) {
    const q = query.trim();
    if (!q) return [];
    const scored = [];
    for (const n of DATA.nodes) {
      const s = scoreMatch(q, n);
      if (s > 0) scored.push({ n, s });
    }
    scored.sort((a, b) => b.s - a.s || a.n.title.localeCompare(b.n.title));
    return scored.slice(0, 9).map((x) => x.n);
  }

  function openSearchResults(results) {
    state.search.open = true;
    state.search.results = results;
    state.search.activeIndex = 0;
    renderSearchResults();
  }

  function closeSearchResults() {
    state.search.open = false;
    state.search.results = [];
    state.search.activeIndex = 0;
    elSearchResults.classList.remove("is-open");
    elSearchResults.innerHTML = "";
  }

  function renderSearchResults() {
    const results = state.search.results;
    if (!state.search.open || !results.length) {
      closeSearchResults();
      return;
    }

    const html = results
      .map((n, idx) => {
        const path = getPathIds(n.id)
          .map((id) => getNode(id))
          .filter(Boolean)
          .map((x) => x.title)
          .slice(1) // hide the "Owencyclopedia" label
          .join(" / ");
        const active = idx === state.search.activeIndex ? "is-active" : "";
        return `<div class="search__item ${active}" role="option" aria-selected="${
          idx === state.search.activeIndex
        }" data-index="${idx}" data-focus="${escapeHtml(n.id)}">
          <div class="search__titleRow">
            <div class="search__title">${escapeHtml(n.title)}</div>
            <div class="search__path">${escapeHtml(path)}</div>
          </div>
        </div>`;
      })
      .join("");

    elSearchResults.innerHTML = html;
    elSearchResults.classList.add("is-open");
  }

  function pickSearchIndex(idx) {
    const r = state.search.results[idx];
    if (!r) return;
    elSearchInput.value = "";
    closeSearchResults();
    setFocus(r.id);
  }

  function renderAll() {
    renderBreadcrumbs();
    renderLens();
    renderPanel();
    renderOutline();
  }

  // Event wiring (delegation)
  elCrumbs.addEventListener("click", (e) => {
    const t = e.target.closest("[data-focus]");
    if (!t) return;
    setFocus(t.getAttribute("data-focus"));
  });

  elNodes.addEventListener("click", (e) => {
    if (map.suppressClick) {
      map.suppressClick = false;
      return;
    }
    const g = e.target.closest("g[data-id]");
    if (!g) return;
    setFocus(g.getAttribute("data-id"));
  });

  elOutlineTree.addEventListener("click", (e) => {
    const t = e.target.closest("[data-focus]");
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    setFocus(t.getAttribute("data-focus"));
  });

  const elDoc = document.querySelector(".doc");
  elDoc.addEventListener("click", (e) => {
    const t = e.target.closest("[data-focus]");
    if (!t) return;
    setFocus(t.getAttribute("data-focus"));
  });

  elToggleOutline.addEventListener("click", () => {
    setOutlineOpen(!state.outlineOpen);
  });

  if (elToggleMap) {
    elToggleMap.addEventListener("click", () => {
      setMapOpen(!state.mapOpen);
    });
  }

  elGoHome.addEventListener("click", () => setFocus(DATA.rootId));

  elSearchInput.addEventListener("input", (e) => {
    const q = e.target.value || "";
    state.search.query = q;
    const results = searchNodes(q);
    if (!q.trim() || results.length === 0) {
      closeSearchResults();
      return;
    }
    openSearchResults(results);
  });

  elSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      elSearchInput.value = "";
      closeSearchResults();
      return;
    }
    if (!state.search.open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.search.activeIndex = clamp(state.search.activeIndex + 1, 0, state.search.results.length - 1);
      renderSearchResults();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      state.search.activeIndex = clamp(state.search.activeIndex - 1, 0, state.search.results.length - 1);
      renderSearchResults();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      pickSearchIndex(state.search.activeIndex);
    }
  });

  elSearchResults.addEventListener("click", (e) => {
    const t = e.target.closest("[data-index]");
    if (!t) return;
    pickSearchIndex(Number(t.getAttribute("data-index")));
  });

  document.addEventListener("click", (e) => {
    const inSearch = e.target.closest(".search");
    if (!inSearch) closeSearchResults();
  });

  window.addEventListener("hashchange", () => {
    const id = parseHashId();
    if (id && byId.has(id)) setFocus(id, { fromHash: true });
  });

  // Boot
  const startId = parseHashId();
  state.focusId = startId && byId.has(startId) ? startId : DATA.rootId;
  setOutlineOpen(true);
  setMapOpen(true);
  renderAll();
  if (!startId) setHashId(state.focusId);

  // Initialize map viewBox from the SVG's authored viewBox (source of truth)
  if (elLensSvg) {
    const base = parseViewBox(elLensSvg.getAttribute("viewBox"));
    if (base) {
      map.base = base;
      map.cx = base.x + base.w / 2;
      map.cy = base.y + base.h / 2;
    }
    // Start slightly zoomed-in for readability.
    applyMapViewBox();
  }

  // Map wheel zoom (bounded)
  if (elLensSvg) {
    elLensSvg.addEventListener(
      "wheel",
      (e) => {
        // Keep the interaction confined to the map panel.
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.12 : 1 / 1.12;
        const next = clamp(map.zoom * factor, map.minZoom, map.maxZoom);
        if (next === map.zoom) return;
        zoomAtClientPoint(next, e.clientX, e.clientY);
      },
      { passive: false }
    );

    elLensSvg.addEventListener("dblclick", (e) => {
      e.preventDefault();
      resetMapView({ keepZoom: false });
    });
  }

  // Map drag pan (bounded; click-to-focus still works)
  if (elLensSurface && elLensSvg) {
    elLensSurface.addEventListener("pointerdown", (e) => {
      // Ignore secondary buttons.
      if (typeof e.button === "number" && e.button !== 0) return;
      // Don't let suppression leak into the next click.
      map.suppressClick = false;
      map.isPanning = true;
      map.captureSet = false;
      map.pointerId = e.pointerId;
      map.startClientX = e.clientX;
      map.startClientY = e.clientY;
      map.startCx = map.cx;
      map.startCy = map.cy;
      map.moved = false;
    });

    elLensSurface.addEventListener("pointermove", (e) => {
      if (!map.isPanning || e.pointerId !== map.pointerId) return;
      const rect = elLensSvg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const vb = currentViewBox();
      const dxPx = e.clientX - map.startClientX;
      const dyPx = e.clientY - map.startClientY;

      // Only begin panning after a real drag gesture. This keeps node clicks reliable.
      if (!map.moved) {
        if (Math.abs(dxPx) <= 6 && Math.abs(dyPx) <= 6) return;
        map.moved = true;
        elLensSurface.classList.add("is-panning");
        try {
          elLensSurface.setPointerCapture(e.pointerId);
          map.captureSet = true;
        } catch {
          map.captureSet = false;
        }
      }

      const dxWorld = (dxPx / rect.width) * vb.w;
      const dyWorld = (dyPx / rect.height) * vb.h;

      // Dragging right should move content right => window center moves left.
      map.cx = map.startCx - dxWorld;
      map.cy = map.startCy - dyWorld;
      applyMapViewBox();
    });

    elLensSurface.addEventListener("pointerup", (e) => {
      if (e.pointerId !== map.pointerId) return;
      map.isPanning = false;
      map.pointerId = null;
      if (map.captureSet) {
        try {
          elLensSurface.releasePointerCapture(e.pointerId);
        } catch {
          // no-op
        }
      }
      map.captureSet = false;
      elLensSurface.classList.remove("is-panning");
      if (map.moved) {
        // Suppress the click event generated by a drag gesture (if any),
        // but don't let it stick around and kill the next real click.
        map.suppressClick = true;
        setTimeout(() => {
          map.suppressClick = false;
        }, 0);
      }
    });

    elLensSurface.addEventListener("pointercancel", (e) => {
      if (e.pointerId !== map.pointerId) return;
      map.isPanning = false;
      map.pointerId = null;
      map.captureSet = false;
      elLensSurface.classList.remove("is-panning");
    });
  }
})();


