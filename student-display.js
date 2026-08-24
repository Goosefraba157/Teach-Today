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
  if (card.kind === "intro-21") return renderIntro21Cards(payload, card);
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

function renderIntro21MarkedWord(item) {
  const word = String(item?.text || "");
  const mark = String(item?.mark || "");
  const index = mark ? word.lastIndexOf(mark) : -1;
  if (index < 0) return `<span class="stage-intro-mark-word">${escapeHtml(word)}</span>`;
  return `<span class="stage-intro-mark-word">${escapeHtml(word.slice(0, index))}<b>${escapeHtml(mark)}</b>${escapeHtml(word.slice(index + mark.length))}</span>`;
}

function renderIntro21SoundCards(items = []) {
  return `<div class="stage-intro-sound-grid">${items.map((item) => `
    <article class="stage-intro-sound-card">
      <strong>${escapeHtml(item.text)}</strong>
      ${item.keyword ? `<span>${escapeHtml(item.keyword)} - /${escapeHtml(item.text)}/</span>` : ""}
    </article>
  `).join("")}</div>`;
}

function renderIntro21PatternCards(items = []) {
  return `<div class="stage-intro-sound-grid stage-intro-pattern-grid">${items.map((item) => {
    const text = String(item.text || "");
    const mark = String(item.mark || "");
    const index = mark ? text.indexOf(mark) : -1;
    const marked = index < 0
      ? escapeHtml(text)
      : `${escapeHtml(text.slice(0, index))}<b>${escapeHtml(mark)}</b>${escapeHtml(text.slice(index + mark.length))}`;
    return `<article class="stage-intro-sound-card"><strong>${marked}</strong></article>`;
  }).join("")}</div>`;
}

function renderIntro21KeywordArt(item) {
  const imageKey = modeClass(item.imageKey || item.text || "");
  return `<article class="stage-intro-keyword-card">
    <div class="stage-intro-keyword-art image-${imageKey}" role="img" aria-label="${escapeHtml(item.keyword || imageKey)} keyword picture"></div>
    <div><strong>${escapeHtml(item.text || "")}</strong><span>${escapeHtml(item.keyword || "")} - /${escapeHtml(item.text || "")}/</span></div>
  </article>`;
}

function renderIntro21KeywordGrid(items = []) {
  return `<div class="stage-intro-keyword-grid">${items.map(renderIntro21KeywordArt).join("")}</div>`;
}

function renderIntro21Visual(card) {
  const items = (card.items || []).filter((item) => item?.text);
  if (card.layout === "welcome") {
    return `<div class="stage-intro-welcome"><div><span>i</span><span>n</span><span>k</span></div><strong>See it. Say it. Tap it. Blend it.</strong></div>`;
  }
  if (card.layout === "family" || card.layout === "notice" || card.layout === "focus" || card.layout === "finish") {
    const visibleItems = card.layout === "notice" ? items.map((item) => ({ ...item, keyword: "" })) : items;
    return renderIntro21SoundCards(visibleItems);
  }
  if (card.layout === "pattern") return renderIntro21PatternCards(items);
  if (card.layout === "keywords") return renderIntro21KeywordGrid(items);
  if (card.layout === "pairs") {
    const pairs = new Map();
    items.forEach((item) => {
      const key = item.pair || "0";
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(item.text);
    });
    return `<div class="stage-intro-pair-grid">${[...pairs.values()].map((pair) => `
      <div><span>${escapeHtml(pair[0] || "")}</span><i>to</i><span>${escapeHtml(pair[1] || "")}</span></div>
    `).join("")}</div>`;
  }
  if (card.layout === "build") {
    return `<div class="stage-intro-build">
      <div class="stage-intro-build-row">${items.map((item) => `
        <span class="stage-intro-build-card ${modeClass(item.type)}">
          ${Number(item.tap || 0) ? `<span class="stage-intro-taps">${Array.from({ length: Number(item.tap) }, () => "<i></i>").join("")}</span>` : ""}
          ${escapeHtml(item.text)}
        </span>
      `).join("")}</div>
      <strong>${escapeHtml(card.word || "")}</strong>
      ${card.wordNote ? `<small>${escapeHtml(card.wordNote)}</small>` : ""}
    </div>`;
  }
  if (card.layout === "mark") {
    return `<div class="stage-intro-mark-grid">${items.map(renderIntro21MarkedWord).join("")}</div>`;
  }
  if (card.layout === "listen") {
    return `<div class="stage-intro-listen"><div aria-hidden="true">${Array.from({ length: 7 }, () => "<i></i>").join("")}</div><strong>Listen. Compare. Tell what changed.</strong></div>`;
  }
  if (card.layout === "contrast") {
    const notes = String(card.wordNote || "").split("|").map((note) => note.trim()).filter(Boolean);
    return `<div class="stage-intro-contrast">${renderIntro21KeywordGrid(items)}<div class="stage-intro-mouth-cues">${notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}</div></div>`;
  }
  if (card.layout === "notebook") {
    const ng = items.filter((item) => String(item.text || "").endsWith("ng"));
    const nk = items.filter((item) => String(item.text || "").endsWith("nk"));
    const sheet = (title, page, familyItems, examples) => `<article class="stage-intro-notebook-sheet">
      <header><span>Welded Sounds</span><strong>${escapeHtml(title)}</strong><em>p. ${escapeHtml(page)}</em></header>
      <div>${familyItems.map((item) => `<p><b>${escapeHtml(item.text)}</b><span>${escapeHtml(item.keyword)}</span><i>/${escapeHtml(item.text)}/</i></p>`).join("")}</div>
      <footer><span>Mark Words</span>${examples.map(renderIntro21MarkedWord).join("")}</footer>
    </article>`;
    return `<div class="stage-intro-notebook-grid">
      ${sheet("ng", "6", ng, [{ text: "long", mark: "ong" }, { text: "ring", mark: "ing" }, { text: "hung", mark: "ung" }])}
      ${sheet("nk", "7", nk, [{ text: "bank", mark: "ank" }, { text: "junk", mark: "unk" }, { text: "think", mark: "ink" }])}
    </div>`;
  }
  return "";
}

function renderIntro21Cards(payload, card) {
  return renderShell(payload, "Welded Sounds", `
    <article class="stage-intro-lesson stage-intro-layout-${modeClass(card.layout)}">
      <div class="stage-intro-heading">
        <h2>${escapeHtml(card.headline || "")}</h2>
        <p>${escapeHtml(card.subhead || "")}</p>
      </div>
      <div class="stage-intro-visual">${renderIntro21Visual(card)}</div>
      <span class="stage-intro-position">${escapeHtml(card.position || "")}</span>
    </article>
  `, "Section 2 - Intro 2.1");
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
  const pageImageSrc = chartPageImageSrc(chart);
  const detail = chart.reader && chart.page
    ? `Reader ${chart.reader}, p. ${chart.page}${chart.level ? ` - ${chart.level}` : ""}`
    : "Section 4";
  const fallbackPage = hasChartWords ? `
    <div class="chart-page-fallback">
      <div class="chart-page-sheet" style="--chart-scale:${currentPdfZoom === "page-fit" ? "1" : Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))}">
        <p class="chart-page-kicker">syllable division</p>
        <div class="chart-page-rule chart-page-rule-top"></div>
        <div class="chart-page-rule chart-page-rule-middle"></div>
        <div class="chart-page-rule chart-page-rule-bottom"></div>
        ${renderChartPositionedWords(chart.topWords || [], chart.bottomWords || [])}
      </div>
    </div>
  ` : `
    <div class="chart-pdf-empty">
      <strong>Reader page not ready</strong>
      <span>Pick or recheck the Section 4 page in Teach Today.</span>
    </div>
  `;
  return `
    <section class="stage-shell stage-mode-chart">
      <div class="chart-mini-header">
        <strong>${escapeHtml(detail)}</strong>
      </div>
      <div class="stage-body">
        <section class="chart-stage">
          <article class="chart-pdf-panel">
            ${fallbackPage}
            ${pageImageSrc ? `<img class="chart-page-image" alt="${escapeHtml(detail)}" data-chart-page-src="${escapeHtml(pageImageSrc)}">` : ""}
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
  setupChartPageImage();
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

function chartPageImageSrc(chart = {}) {
  const reader = Number(chart.reader || 0);
  const chartPage = Number(chart.page || 0);
  if (!Number.isInteger(reader) || reader < 1 || reader > 12 || !Number.isInteger(chartPage) || chartPage < 1) return "";
  return `Reader%20Pages%20for%20Charting%20Section%204/rendered-pages/reader${reader}-page-${String(chartPage).padStart(3, "0")}.webp`;
}

function setupChartPageImage() {
  const image = root.querySelector(".chart-page-image[data-chart-page-src]");
  const panel = image?.closest(".chart-pdf-panel");
  if (!image || !panel) return;
  const scale = currentPdfZoom === "page-fit"
    ? 1
    : Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100));
  image.style.setProperty("--chart-view-scale", String(scale));
  image.addEventListener("load", () => panel.classList.add("chart-pdf-ready"), { once: true });
  image.addEventListener("error", () => panel.classList.add("chart-pdf-failed"), { once: true });
  image.src = image.dataset.chartPageSrc || "";
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
  const image = root.querySelector(".chart-page-image");
  if (image) image.style.setProperty("--chart-view-scale", String(Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))));
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
    const image = root.querySelector(".chart-page-image");
    if (image) image.style.setProperty("--chart-view-scale", String(currentPdfZoom === "page-fit" ? 1 : Math.max(0.5, Math.min(2, Number(currentPdfZoom || 100) / 100))));
  }
});

window.addEventListener("resize", resizeInkCanvas);
document.addEventListener("fullscreenchange", resizeInkCanvas);

if ("BroadcastChannel" in window) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", (event) => render(event.data));
}

render(readStoredPayload());
