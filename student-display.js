const STORAGE_KEY = "teachToday.studentDisplayPayload.v1";
const CHANNEL_NAME = "teachTodayStudentDisplay.v1";
const root = document.getElementById("studentDisplay");

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function displayHeader(payload, title) {
  return `
    <header class="display-head">
      <div>
        <p>${escapeHtml(payload.groupName || "Teach Today")}</p>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <strong class="display-badge">Substep ${escapeHtml(payload.substep || "--")}</strong>
    </header>
  `;
}

function renderWords(words = []) {
  const list = words.filter(Boolean);
  if (!list.length) return `<p class="notebook-line">High-frequency words will appear here when the lesson has them.</p>`;
  return `<div class="word-wall">${list.map((word) => `<span>${escapeHtml(word)}</span>`).join("")}</div>`;
}

function render(payload) {
  if (!payload) {
    root.innerHTML = `
      <section class="waiting">
        <div>
          <h1>Student Display</h1>
          <p>Open Display from Teach Today to choose what students see.</p>
        </div>
      </section>
    `;
    return;
  }

  if (payload.mode === "poster") {
    root.innerHTML = `
      <section class="display-screen">
        ${displayHeader(payload, "Sound Poster")}
        <article class="display-card poster-card">
          <img src="${escapeHtml(payload.poster?.src || "")}" alt="Section 1 sound poster">
        </article>
      </section>
    `;
    return;
  }

  if (payload.mode === "hfw") {
    root.innerHTML = `
      <section class="display-screen">
        ${displayHeader(payload, "High-Frequency Words")}
        <article class="display-card hfw-card">
          <h2>Read, copy, check.</h2>
          ${renderWords(payload.highFrequencyWords)}
          <p class="notebook-line">${escapeHtml(payload.notebookSentence || "")}</p>
        </article>
      </section>
    `;
    return;
  }

  if (payload.mode === "passage") {
    const pdf = payload.passagePdf || null;
    const pageStart = Number(pdf?.pdfPageStart || 0);
    const pageEnd = Math.max(pageStart, Number(pdf?.pdfPageEnd || pageStart));
    const pdfPages = pdf?.pdfPath && pageStart
      ? Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index)
      : [];
    root.innerHTML = `
      <section class="display-screen">
        ${displayHeader(payload, "Controlled Passage")}
        <article class="display-card passage-card">
          <p class="label">${escapeHtml(payload.passageTitle || "Reader passage")}</p>
          <h2>Section 9</h2>
          <p class="passage-text">${escapeHtml(payload.passageText || "")}</p>
          ${pdfPages.length ? `<div class="display-passage-pages">
            ${pdfPages.map((page, index) => `<img alt="${escapeHtml(payload.passageTitle || "Reader passage")} page ${page}" src="${escapeHtml(passagePageImageSrc(pdf, page))}" data-reader-page="${escapeHtml(String((pdf.readerPageStart || 0) + index))}">`).join("")}
          </div>` : ""}
        </article>
      </section>
    `;
    return;
  }

  if (payload.mode === "game") {
    root.innerHTML = `
      <section class="display-screen game-screen">
        ${displayHeader(payload, "Game Hub")}
        <iframe title="Teach Today game hub" src="${escapeHtml(payload.gameUrl || "Games/index.html")}"></iframe>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="display-screen">
      ${displayHeader(payload, "Keep Going")}
      <article class="display-card private-screen">
        <div class="private-mark">✓</div>
        <h2>${escapeHtml(payload.privacyTitle || "Private teacher work")}</h2>
        <p>${escapeHtml(payload.privacyMessage || "Keep working while your teacher charts.")}</p>
      </article>
    </section>
  `;
}

function passagePageImageSrc(pdf, page) {
  if (Number(pdf?.reader) === 1) {
    return `Part%209%20Reading%20Passages%20from%20Readers/rendered-pages/book1-page-${String(page).padStart(2, "0")}.png`;
  }
  return `${encodeURI(pdf?.pdfPath || "")}#page=${encodeURIComponent(page)}`;
}

function readStoredPayload() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "teachTodayStudentDisplay") render(event.data.payload);
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) render(readStoredPayload());
});

if ("BroadcastChannel" in window) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", (event) => render(event.data));
}

render(readStoredPayload());
