const STORAGE_KEY = "teachToday.studentDisplayPayload.v1";
const CHANNEL_NAME = "teachTodayStudentDisplay.v1";
const INK_STORAGE_KEY = "teachToday.studentStageInk.v1";
const TOOL_STORAGE_KEY = "teachToday.studentStageTool.v1";
const COLOR_STORAGE_KEY = "teachToday.studentStageColor.v1";
const SIZE_STORAGE_KEY = "teachToday.studentStageSize.v1";
const root = document.getElementById("studentDisplay");

let currentPayload = null;
let currentInkKey = "waiting";
let currentTool = localStorage.getItem(TOOL_STORAGE_KEY) || "pointer";
let currentColor = localStorage.getItem(COLOR_STORAGE_KEY) || "#ef4444";
let currentSize = Number(localStorage.getItem(SIZE_STORAGE_KEY) || 5);
let currentPdfZoom = "page-fit";
let inkStore = readInkStore();
let activeStroke = null;
let drawQueued = false;

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function modeClass(mode) {
  return String(mode || "private").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function displayHeader(payload, title, detail = "") {
  const substep = payload.substep ? `Substep ${payload.substep}` : "";
  const detailText = [detail, payload.skillTitle].filter(Boolean).join(" - ");
  return `
    <header class="stage-top">
      <div class="stage-title-block">
        <p>Classroom Stage</p>
        <h1>${escapeHtml(title)}</h1>
        ${detailText ? `<span>${escapeHtml(detailText)}</span>` : ""}
      </div>
      <div class="stage-context">
        <strong>${escapeHtml(payload.groupName || "Teach Today")}</strong>
        ${substep ? `<span>${escapeHtml(substep)}</span>` : ""}
      </div>
    </header>
  `;
}

function renderWords(words = []) {
  const list = words.filter(Boolean);
  if (!list.length) return `<p class="stage-note">High-frequency words will appear here when the lesson has them.</p>`;
  return `<div class="word-wall">${list.map((word) => `<span>${escapeHtml(word)}</span>`).join("")}</div>`;
}

function renderChartWords(words = []) {
  const cells = Array.from({ length: 15 }, (_, index) => words[index] || "");
  return cells.map((word, index) => `
    <span class="chart-stage-cell${word ? "" : " empty"}">
      <em>${index + 1}</em>
      <strong>${escapeHtml(word || " ")}</strong>
    </span>
  `).join("");
}

function renderStageTools(payload) {
  if (!stageSupportsInk(payload)) return "";
  const colors = ["#ef4444", "#f97316", "#facc15", "#16a34a", "#14b8a6", "#2563eb", "#7c3aed", "#0f172a"];
  return `
    <aside class="stage-tools" aria-label="Stage tools">
      <button type="button" data-stage-tool="pen" title="Write on the stage">Pen</button>
      <button type="button" data-stage-tool="highlight" title="Highlight on the stage">Hi</button>
      <div class="stage-color-stack" aria-label="Ink colors">
        ${colors.map((color) => `<button type="button" class="stage-color" data-stage-color="${color}" style="--stage-color:${color}" title="${color}"></button>`).join("")}
      </div>
      <label class="stage-size-control">
        <span>Size</span>
        <input id="stagePenSize" type="range" min="2" max="22" step="1" value="${escapeHtml(String(currentSize || 5))}" aria-label="Pen size">
      </label>
      <button type="button" data-stage-action="undo" title="Undo last mark">Undo</button>
      <button type="button" data-stage-action="zoom-out" title="Zoom out">-</button>
      <button type="button" data-stage-action="zoom-in" title="Zoom in">+</button>
      <button type="button" data-stage-action="clear" title="Clear this stage">Clear</button>
    </aside>
    <canvas id="stageInkCanvas" class="stage-ink-canvas" aria-hidden="true"></canvas>
  `;
}

function renderShell(payload, title, body, detail = "") {
  return `
    <section class="stage-shell stage-mode-${modeClass(payload.mode)}">
      ${displayHeader(payload, title, detail)}
      <div class="stage-body">${body}</div>
      ${renderStageTools(payload)}
    </section>
  `;
}

function renderPrivate(payload) {
  return renderShell(payload, "Private Teacher Work", `
    <article class="privacy-stage">
      <div class="privacy-mark">OK</div>
      <h2>${escapeHtml(payload.privacyTitle || "Teacher is working privately")}</h2>
      <p>${escapeHtml(payload.privacyMessage || "Keep reading, writing, or practicing while your teacher charts.")}</p>
    </article>
  `);
}

function renderPoster(payload) {
  return renderShell(payload, "Sound Poster", `
    <article class="poster-stage">
      <img src="${escapeHtml(payload.poster?.src || "")}" alt="Section 1 sound poster">
    </article>
  `, "Section 1");
}

function renderHfw(payload) {
  return renderShell(payload, "High-Frequency Words", `
    <article class="hfw-stage">
      <h2>Read. Tap. Spell. Check.</h2>
      ${renderWords(payload.highFrequencyWords)}
      <p class="stage-note">${escapeHtml(payload.notebookSentence || "")}</p>
    </article>
  `);
}

function renderChart(payload) {
  const chart = payload.chart || {};
  const pdfUrl = chartPdfStageSrc(chart);
  const detail = chart.reader && chart.page
    ? `Reader ${chart.reader}, p. ${chart.page}${chart.level ? ` - ${chart.level}` : ""}`
    : "Section 4";
  return `
    <section class="stage-shell stage-mode-chart">
      <div class="chart-mini-header">
        <strong>${escapeHtml(detail)}</strong>
      </div>
      <div class="stage-body">
        <section class="chart-stage">
          <article class="chart-pdf-panel">
            ${pdfUrl ? `<iframe class="chart-pdf-frame" title="Reader charting page" src="${escapeHtml(pdfUrl)}"></iframe>` : `
              <div class="chart-pdf-empty">
                <strong>Reader page not ready</strong>
                <span>Pick or recheck the Section 4 page in Teach Today.</span>
              </div>
            `}
          </article>
        </section>
      </div>
      ${renderStageTools(payload)}
    </section>
  `;
}

function renderPassage(payload) {
  const pdf = payload.passagePdf || null;
  const pageStart = Number(pdf?.pdfPageStart || 0);
  const pageEnd = Math.max(pageStart, Number(pdf?.pdfPageEnd || pageStart));
  const pdfPages = pdf?.pdfPath && pageStart
    ? Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index)
    : [];
  const pages = pdfPages.length ? `
    <div class="display-passage-pages">
      ${pdfPages.map((page, index) => `<img alt="${escapeHtml(payload.passageTitle || "Reader passage")} page ${page}" src="${escapeHtml(passagePageImageSrc(pdf, page))}" data-reader-page="${escapeHtml(String((pdf.readerPageStart || 0) + index))}">`).join("")}
    </div>
  ` : `<p class="passage-text">${escapeHtml(payload.passageText || "")}</p>`;
  return renderShell(payload, "Controlled Passage", `
    <article class="passage-stage">
      <p class="stage-label">${escapeHtml(payload.passageTitle || "Reader passage")}</p>
      ${pages}
    </article>
  `, "Section 9");
}

function renderGame(payload) {
  return `
    <section class="stage-shell stage-mode-game">
      ${displayHeader(payload, "Game Hub", "Classroom activity")}
      <div class="stage-body game-stage">
        <iframe title="Teach Today game hub" src="${escapeHtml(payload.gameUrl || "Games/index.html")}"></iframe>
      </div>
    </section>
  `;
}

function render(payload) {
  currentPayload = payload;
  document.body.classList.remove("stage-inking");
  if (!payload) {
    root.innerHTML = `
      <section class="waiting">
        <div>
          <h1>Presenter Stage</h1>
          <p>Open Stage from Teach Today to choose what students see.</p>
        </div>
      </section>
    `;
    return;
  }

  if (payload.mode === "poster") root.innerHTML = renderPoster(payload);
  else if (payload.mode === "hfw") root.innerHTML = renderHfw(payload);
  else if (payload.mode === "chart") root.innerHTML = renderChart(payload);
  else if (payload.mode === "passage") root.innerHTML = renderPassage(payload);
  else if (payload.mode === "game") root.innerHTML = renderGame(payload);
  else root.innerHTML = renderPrivate(payload);

  currentInkKey = payloadInkKey(payload);
  bindStageControls(payload);
  setupStageInk(payload);
}

function passagePageImageSrc(pdf, page) {
  const reader = Number(pdf?.reader || 0);
  if (reader) {
    return `Part%209%20Reading%20Passages%20from%20Readers/rendered-pages/book${reader}-page-${String(page).padStart(2, "0")}.png`;
  }
  return `${encodeURI(pdf?.pdfPath || "")}#page=${encodeURIComponent(page)}`;
}

function stageUrl(url) {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}stage=1`;
}

function chartPdfStageSrc(chart = {}) {
  let pdfFile = chart.pdfFile || "";
  let pdfPage = chart.pdfPage || "";
  if ((!pdfFile || !pdfPage) && chart.pdfViewerUrl) {
    try {
      const query = chart.pdfViewerUrl.includes("?") ? chart.pdfViewerUrl.split("?").slice(1).join("?") : "";
      const params = new URLSearchParams(query);
      pdfFile ||= params.get("file") || "";
      pdfPage ||= params.get("page") || "";
    } catch (_) {}
  }
  if (!pdfFile || !pdfPage) return "";
  const zoom = currentPdfZoom === "page-fit" ? "page-fit" : `${Math.round(currentPdfZoom)}`;
  const params = [
    `page=${encodeURIComponent(pdfPage)}`,
    `zoom=${encodeURIComponent(zoom)}`,
    "toolbar=0",
    "navpanes=0",
    "scrollbar=0"
  ].join("&");
  return `${pdfFile}#${params}`;
}

function payloadInkKey(payload) {
  if (!stageSupportsInk(payload)) return "no-ink";
  if (payload.mode === "chart" && payload.chart?.key) return payload.chart.key;
  if (payload.mode === "passage" && payload.passagePdf?.passageId) return `passage:${payload.passagePdf.passageId}`;
  if (payload.mode === "poster" && payload.poster?.src) return `poster:${payload.poster.src}`;
  if (payload.mode === "hfw") return `hfw:${payload.substep || ""}:${(payload.highFrequencyWords || []).join("|")}`;
  return `${payload.mode || "stage"}:${payload.lessonId || payload.substep || payload.groupName || "current"}`;
}

function stageSupportsInk(payload) {
  return ["poster", "hfw", "chart", "passage"].includes(payload?.mode);
}

function readStoredPayload() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function readInkStore() {
  try {
    const value = JSON.parse(localStorage.getItem(INK_STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveInkStore() {
  localStorage.setItem(INK_STORAGE_KEY, JSON.stringify(inkStore));
}

function strokesForKey(key = currentInkKey) {
  if (!inkStore[key]) inkStore[key] = [];
  return inkStore[key];
}

function bindStageControls(payload) {
  const tools = root.querySelector(".stage-tools");
  if (!tools) return;
  tools.querySelectorAll("[data-stage-tool]").forEach((button) => {
    button.addEventListener("click", () => setStageTool(button.dataset.stageTool));
  });
  tools.querySelectorAll("[data-stage-color]").forEach((button) => {
    button.addEventListener("click", () => setStageColor(button.dataset.stageColor));
  });
  const size = tools.querySelector("#stagePenSize");
  if (size) {
    size.value = String(currentSize || 5);
    size.addEventListener("input", () => setStageSize(Number(size.value) || 5));
  }
  tools.querySelector("[data-stage-action='undo']")?.addEventListener("click", () => {
    strokesForKey().pop();
    saveInkStore();
    queueInkDraw();
  });
  tools.querySelector("[data-stage-action='zoom-out']")?.addEventListener("click", () => setStagePdfZoom(-25));
  tools.querySelector("[data-stage-action='zoom-in']")?.addEventListener("click", () => setStagePdfZoom(25));
  tools.querySelector("[data-stage-action='clear']")?.addEventListener("click", () => {
    inkStore[currentInkKey] = [];
    saveInkStore();
    queueInkDraw();
  });
  setStageTool(stageSupportsInk(payload) ? currentTool : "pointer", { save: false, force: true });
  setStageColor(currentColor, { save: false });
  setStageSize(currentSize || 5, { save: false });
}

function setStageTool(tool, options = {}) {
  currentTool = options.force ? tool || "pointer" : currentTool === tool ? "pointer" : tool || "pointer";
  if (options.save !== false) localStorage.setItem(TOOL_STORAGE_KEY, currentTool);
  root.querySelectorAll("[data-stage-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.stageTool === currentTool);
  });
  document.body.classList.toggle("stage-inking", currentTool === "pen" || currentTool === "highlight");
}

function setStageColor(color, options = {}) {
  currentColor = color || "#ef4444";
  if (options.save !== false) localStorage.setItem(COLOR_STORAGE_KEY, currentColor);
  root.querySelectorAll("[data-stage-color]").forEach((button) => {
    button.classList.toggle("active", button.dataset.stageColor === currentColor);
  });
}

function setStageSize(size, options = {}) {
  currentSize = Math.max(2, Math.min(22, Number(size) || 5));
  if (options.save !== false) localStorage.setItem(SIZE_STORAGE_KEY, String(currentSize));
}

function setStagePdfZoom(delta) {
  if (currentPdfZoom === "page-fit") currentPdfZoom = 100;
  currentPdfZoom = Math.max(50, Math.min(200, Number(currentPdfZoom || 100) + delta));
  const frame = root.querySelector(".chart-pdf-frame");
  if (frame && currentPayload?.chart) frame.src = chartPdfStageSrc(currentPayload.chart);
}

function setupStageInk(payload) {
  const canvas = document.getElementById("stageInkCanvas");
  if (!canvas || !stageSupportsInk(payload)) return;
  resizeInkCanvas();
  canvas.addEventListener("pointerdown", startInkStroke);
  canvas.addEventListener("pointermove", continueInkStroke);
  canvas.addEventListener("pointerup", finishInkStroke);
  canvas.addEventListener("pointercancel", finishInkStroke);
}

function resizeInkCanvas() {
  const canvas = document.getElementById("stageInkCanvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  queueInkDraw();
}

function startInkStroke(event) {
  if (currentTool !== "pen" && currentTool !== "highlight") return;
  event.preventDefault();
  const canvas = event.currentTarget;
  activeStroke = {
    tool: currentTool,
    color: currentColor,
    size: currentSize,
    points: [inkPoint(canvas, event)]
  };
  canvas.setPointerCapture?.(event.pointerId);
  queueInkDraw();
}

function continueInkStroke(event) {
  if (!activeStroke) return;
  event.preventDefault();
  activeStroke.points.push(inkPoint(event.currentTarget, event));
  queueInkDraw();
}

function finishInkStroke(event) {
  if (!activeStroke) return;
  event.preventDefault();
  if (activeStroke.points.length > 1) {
    strokesForKey().push(activeStroke);
    saveInkStore();
  }
  activeStroke = null;
  queueInkDraw();
}

function inkPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / Math.max(1, rect.width),
    y: (event.clientY - rect.top) / Math.max(1, rect.height)
  };
}

function queueInkDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    drawInk();
  });
}

function drawInk() {
  const canvas = document.getElementById("stageInkCanvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, rect.width, rect.height);
  const strokes = activeStroke ? strokesForKey().concat(activeStroke) : strokesForKey();
  strokes.forEach((stroke) => drawStroke(ctx, stroke, rect));
}

function drawStroke(ctx, stroke, rect) {
  const points = stroke.points || [];
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.tool === "highlight" ? "#facc15" : stroke.color || "#0f172a";
  ctx.lineWidth = stroke.tool === "highlight" ? Math.max(12, Number(stroke.size || 12)) : Math.max(2, Number(stroke.size || 5));
  ctx.globalAlpha = stroke.tool === "highlight" ? 0.36 : 0.92;
  ctx.globalCompositeOperation = stroke.tool === "highlight" ? "multiply" : "source-over";
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = point.x * rect.width;
    const y = point.y * rect.height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "teachTodayStudentDisplay") render(event.data.payload);
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) render(readStoredPayload());
});

window.addEventListener("resize", resizeInkCanvas);
document.addEventListener("fullscreenchange", resizeInkCanvas);

if ("BroadcastChannel" in window) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", (event) => render(event.data));
}

render(readStoredPayload());
