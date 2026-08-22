const STORAGE_KEY = "teachToday.studentDisplayPayload.v1";
const CHANNEL_NAME = "teachTodayStudentDisplay.v1";
const INK_STORAGE_KEY = "teachToday.studentStageInk.v1";
const TOOL_STORAGE_KEY = "teachToday.studentStageTool.v1";
const COLOR_STORAGE_KEY = "teachToday.studentStageColor.v1";
const SIZE_STORAGE_KEY = "teachToday.studentStageSize.v1";
const PDF_ZOOM_STORAGE_KEY = "teachToday.studentStagePdfZoom.v1";
const root = document.getElementById("studentDisplay");
const stageParams = new URLSearchParams(window.location.search);
const isSection4StageEmbed = stageParams.get("embed") === "section4-stage";

if (isSection4StageEmbed) document.body.classList.add("stage-embedded-section4");

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

function renderChartRows(words = [], half = "top") {
  const cells = Array.from({ length: 15 }, (_, index) => words[index] || "");
  const xs = [15, 48, 78];
  const ys = half === "bottom" ? [67, 75, 83, 91, 96] : [24, 32, 40, 48, 56];
  return cells.map((word, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return `
      <span class="chart-page-word" style="--x:${xs[col]}%;--y:${ys[row]}%;">
        ${escapeHtml(word || " ")}
      </span>
    `;
  }).join("");
}

function renderChartPositionedWords(topWords = [], bottomWords = []) {
  return `
    <div class="chart-page-words">
      ${renderChartRows(topWords, "top")}
      ${renderChartRows(bottomWords, "bottom")}
    </div>
  `;
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

function renderCards(payload) {
  const card = payload.cardDisplay || {};
  const items = (card.items || []).filter((item) => item?.text);
  const content = items.length
    ? `<div class="stage-build-cards">${items.map((item) => `<span class="stage-build-card ${modeClass(item.type)}">${escapeHtml(item.text)}</span>`).join("")}</div>`
    : card.word
      ? `<strong class="stage-single-card">${escapeHtml(card.word)}</strong>`
      : `<p class="stage-note">Choose a word or card in the lesson.</p>`;
  return renderShell(payload, "Lesson Cards", `
    <article class="cards-stage">
      ${content}
      <div class="stage-card-meta">
        ${card.word && items.length ? `<strong>${escapeHtml(card.word)}</strong>` : ""}
        ${card.label ? `<span>${escapeHtml(card.label)}</span>` : ""}
        ${card.position ? `<em>${escapeHtml(card.position)}</em>` : ""}
      </div>
    </article>
  `, card.sectionLabel || "Lesson");
}

function renderSentence(payload) {
  return renderShell(payload, "Sentence Reading", `
    <article class="sentence-stage">
      <p>${escapeHtml(payload.sentence || "Choose a sentence in the lesson.")}</p>
    </article>
  `, "Section 5");
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

function renderSoundReference(payload) {
  const groups = (payload.soundReference?.groups || []).filter((group) => group.items?.length);
  return renderShell(payload, "Sound Reference", `
    <article class="sound-reference-stage">
      ${groups.map((group) => `
        <section class="sound-reference-group">
          <h2>${escapeHtml(group.title)}</h2>
          <div class="sound-reference-row">
            ${group.items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>
      `).join("")}
    </article>
  `, "Section 6");
}

function renderJournal(payload) {
  const consonants = "bcdfghjklmnpqrstvwxyz".split("");
  const vowels = "aeiou".split("");
  return renderShell(payload, "Magnetic Journal", `
    <article class="journal-stage">
      <p>${escapeHtml(payload.journal?.prompt || "Build the word your teacher dictates.")}</p>
      <div class="journal-workspace" aria-label="Magnetic journal workspace">
        ${Array.from({ length: 8 }, () => `<span></span>`).join("")}
      </div>
      <div class="journal-tile-bank" aria-label="Letter tiles">
        <div class="journal-tile-row consonants">
          ${consonants.map((letter) => `<span>${letter}</span>`).join("")}
        </div>
        <div class="journal-tile-row vowels">
          ${vowels.map((letter) => `<span>${letter}</span>`).join("")}
        </div>
      </div>
    </article>
  `, "Section 7");
}

function renderDictationPaper(payload) {
  const rows = (count) => Array.from({ length: count }, (_, index) => `
    <div class="dictation-line"><span>${index + 1}</span></div>
  `).join("");
  return renderShell(payload, "Dictation Paper", `
    <article class="dictation-paper-stage">
      <p>${escapeHtml(payload.dictationPaper?.prompt || "Listen, repeat, tap the sounds, and write.")}</p>
      <div class="dictation-paper">
        <section><h2>Sounds</h2>${rows(5)}</section>
        <section><h2>Words</h2>${rows(5)}</section>
        <section class="dictation-sentences"><h2>Sentences</h2>${rows(3)}</section>
      </div>
    </article>
  `, "Section 8");
}

function renderChart(payload) {
  const chart = payload.chart || {};
  const hasChartWords = []
    .concat(chart.topWords || [], chart.bottomWords || [])
    .some(Boolean);
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
            ${hasChartWords ? `
              <div class="chart-page-sheet" style="--chart-scale:${currentPdfZoom === "page-fit" ? "1" : Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))}">
                <p class="chart-page-kicker">syllable division</p>
                <div class="chart-page-rule chart-page-rule-top"></div>
                <div class="chart-page-rule chart-page-rule-middle"></div>
                <div class="chart-page-rule chart-page-rule-bottom"></div>
                ${renderChartPositionedWords(chart.topWords || [], chart.bottomWords || [])}
              </div>
            ` : `
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

  const nextInkKey = payloadInkKey(payload);
  if (payload.mode === "chart") currentPdfZoom = pdfZoomForKey(nextInkKey);

  if (payload.mode === "poster") root.innerHTML = renderPoster(payload);
  else if (payload.mode === "cards") root.innerHTML = renderCards(payload);
  else if (payload.mode === "hfw") root.innerHTML = renderHfw(payload);
  else if (payload.mode === "sentence") root.innerHTML = renderSentence(payload);
  else if (payload.mode === "chart") root.innerHTML = renderChart(payload);
  else if (payload.mode === "sounds") root.innerHTML = renderSoundReference(payload);
  else if (payload.mode === "journal") root.innerHTML = renderJournal(payload);
  else if (payload.mode === "dictation-paper") root.innerHTML = renderDictationPaper(payload);
  else if (payload.mode === "passage") root.innerHTML = renderPassage(payload);
  else if (payload.mode === "game") root.innerHTML = renderGame(payload);
  else root.innerHTML = renderPrivate(payload);

  currentInkKey = nextInkKey;
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
  if (payload.mode === "chart" && payload.chart?.key) return `${payload.chart.key}:chart-page-v5`;
  if (payload.mode === "passage" && payload.passagePdf?.passageId) return `passage:${payload.passagePdf.passageId}`;
  if (payload.mode === "poster" && payload.poster?.src) return `poster:${payload.poster.src}`;
  if (payload.mode === "cards") return payload.cardDisplay?.key || `cards:${payload.lessonId || payload.substep || "current"}`;
  if (payload.mode === "hfw") return `hfw:${payload.substep || ""}:${(payload.highFrequencyWords || []).join("|")}`;
  if (payload.mode === "sentence") return `sentence:${payload.lessonId || payload.substep || "current"}:${payload.sentence || ""}`;
  if (payload.mode === "sounds") return payload.soundReference?.key || `sounds:${payload.substep || ""}`;
  if (payload.mode === "journal") return payload.journal?.key || `journal:${payload.lessonId || payload.substep || "current"}`;
  if (payload.mode === "dictation-paper") return payload.dictationPaper?.key || `dictation:${payload.lessonId || payload.substep || "current"}`;
  return `${payload.mode || "stage"}:${payload.lessonId || payload.substep || payload.groupName || "current"}`;
}

function stageSupportsInk(payload) {
  return ["poster", "cards", "hfw", "sentence", "chart", "sounds", "journal", "dictation-paper", "passage"].includes(payload?.mode);
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

function readPdfZoomStore() {
  try {
    const value = JSON.parse(localStorage.getItem(PDF_ZOOM_STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function pdfZoomForKey(key = currentInkKey) {
  return readPdfZoomStore()[key] || "page-fit";
}

function savePdfZoomForKey(key = currentInkKey) {
  const store = readPdfZoomStore();
  store[key] = currentPdfZoom || "page-fit";
  localStorage.setItem(PDF_ZOOM_STORAGE_KEY, JSON.stringify(store));
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
  savePdfZoomForKey();
  const sheet = root.querySelector(".chart-page-sheet");
  if (sheet) sheet.style.setProperty("--chart-scale", String(Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))));
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
    scope: inkScope(),
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
  const rect = inkTargetRect(canvas);
  return {
    x: (event.clientX - rect.left) / Math.max(1, rect.width),
    y: (event.clientY - rect.top) / Math.max(1, rect.height)
  };
}

function inkScope() {
  return currentPayload?.mode === "chart" ? "chart-sheet" : "viewport";
}

function inkTargetRect(canvas = document.getElementById("stageInkCanvas")) {
  if (currentPayload?.mode === "chart") {
    const panel = root.querySelector(".chart-page-sheet") || root.querySelector(".chart-pdf-panel");
    const rect = panel?.getBoundingClientRect();
    if (rect?.width && rect?.height) return rect;
  }
  return canvas.getBoundingClientRect();
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
  const canvasRect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);
  const strokes = activeStroke ? strokesForKey().concat(activeStroke) : strokesForKey();
  strokes.forEach((stroke) => drawStroke(ctx, stroke, canvasRect));
}

function drawStroke(ctx, stroke, canvasRect) {
  const points = stroke.points || [];
  if (!points.length) return;
  const rect = (stroke.scope === "chart-panel" || stroke.scope === "chart-sheet") ? inkTargetRect() : canvasRect;
  const offsetX = rect.left - canvasRect.left;
  const offsetY = rect.top - canvasRect.top;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.tool === "highlight" ? "#facc15" : stroke.color || "#0f172a";
  ctx.lineWidth = stroke.tool === "highlight" ? Math.max(12, Number(stroke.size || 12)) : Math.max(2, Number(stroke.size || 5));
  ctx.globalAlpha = stroke.tool === "highlight" ? 0.36 : 0.92;
  ctx.globalCompositeOperation = stroke.tool === "highlight" ? "multiply" : "source-over";
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = offsetX + point.x * rect.width;
    const y = offsetY + point.y * rect.height;
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
  if (event.key === INK_STORAGE_KEY) {
    inkStore = readInkStore();
    queueInkDraw();
  }
  if (event.key === PDF_ZOOM_STORAGE_KEY && currentPayload?.chart) {
    currentPdfZoom = pdfZoomForKey();
    const sheet = root.querySelector(".chart-page-sheet");
    if (sheet) sheet.style.setProperty("--chart-scale", String(currentPdfZoom === "page-fit" ? 1 : Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))));
    const frame = root.querySelector(".chart-pdf-frame");
    if (frame) frame.src = chartPdfStageSrc(currentPayload.chart);
  }
});

window.addEventListener("resize", resizeInkCanvas);
document.addEventListener("fullscreenchange", resizeInkCanvas);

if ("BroadcastChannel" in window) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", (event) => render(event.data));
}

render(readStoredPayload());
