(function () {
  "use strict";

  const TOTAL_PARTS = 10;
  const V1_SECTION_MAPPING = [
    { partNumber: 1, title: "Sounds Quick Drill", v1SectionId: "section1", primaryFields: ["dictationPlanOverride sounds", "realWords", "nonsenseWords"] },
    { partNumber: 2, title: "Teach and Review for Reading", v1SectionId: "section2", primaryFields: ["sectionTwoReviewWords", "sectionTwoCurrentWords"] },
    { partNumber: 3, title: "Word Cards", v1SectionId: "section3", primaryFields: ["sectionThreeReviewWords", "sectionThreeCurrentWords", "highFrequencyWords"] },
    { partNumber: 4, title: "Wordlist Reading / Charting", v1SectionId: "section4", primaryFields: ["wordlistPageNumber", "chartingPageNumber", "realWords", "nonsenseWords"] },
    { partNumber: 5, title: "Sentence Reading", v1SectionId: "section5", primaryFields: ["sentencePageNumber", "readerSentences", "highFrequencyWords"] },
    { partNumber: 6, title: "Quick Drill in Reverse", v1SectionId: "section6", primaryFields: ["dictationPlanOverride sounds", "dictationPlanOverride word elements"] },
    { partNumber: 7, title: "Spelling Concepts", v1SectionId: "section7", primaryFields: ["sectionSevenReviewWords", "sectionSevenNonsenseWords", "sectionSevenCurrentWords"] },
    { partNumber: 8, title: "Dictation", v1SectionId: "section8", primaryFields: ["dictationPlanOverride"] },
    { partNumber: 9, title: "Controlled Text / Fluency", v1SectionId: "section9", primaryFields: ["section9Story", "readerSentences", "highFrequencyWords"] },
    { partNumber: 10, title: "Comprehension", v1SectionId: "section10", primaryFields: ["section9Story", "highFrequencyWords", "readerSentences"] }
  ];

  const state = {
    plan: null,
    planKey: "",
    open: false,
    slideIndex: 0,
    mode: "teacher",
    overviewOpen: false,
    drawerCollapsed: false,
    itemIndex: {},
    marked: {},
    notes: {},
    completed: {}
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function dom() {
    return {
      stage: byId("lbv2PresentStage"),
      teacherMode: byId("lbv2TeacherMode"),
      studentMode: byId("lbv2StudentMode"),
      drawerToggle: byId("lbv2DrawerToggle"),
      overviewToggle: byId("lbv2OverviewToggle"),
      fullscreen: byId("lbv2FullscreenPresent"),
      exit: byId("lbv2ExitPresent"),
      overview: byId("lbv2SlideOverview"),
      eyebrow: byId("lbv2SlideEyebrow"),
      title: byId("lbv2SlideTitle"),
      progress: byId("lbv2SlideProgress"),
      content: byId("lbv2SlideContent"),
      drawer: byId("lbv2TeacherDrawer"),
      prev: byId("lbv2PrevSlide"),
      next: byId("lbv2NextSlide")
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function unique(items) {
    return [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))];
  }

  function planKey(plan) {
    return [
      plan?.groupId,
      plan?.groupName,
      plan?.substep,
      plan?.readerLevel,
      plan?.wordlistPageNumber,
      plan?.chartingPageNumber,
      plan?.sentencePageNumber,
      (plan?.realWords || []).join("|"),
      (plan?.nonsenseWords || []).join("|")
    ].join("::");
  }

  function ensurePlan(plan) {
    if (!plan) return;
    const key = planKey(plan);
    if (key !== state.planKey) {
      state.planKey = key;
      state.slideIndex = 0;
      state.itemIndex = {};
      state.marked = {};
      state.notes = {};
      state.completed = {};
      state.overviewOpen = false;
      state.drawerCollapsed = false;
    }
    state.plan = plan;
  }

  function selectedPart(plan, partNumber) {
    return (plan.lessonParts || []).find((part) => Number(part.partNumber) === Number(partNumber)) || null;
  }

  function allSlides(plan) {
    const opening = { kind: "opening", partNumber: 0, title: "Lesson Ready", v1SectionId: "opening", selected: true };
    const slides = V1_SECTION_MAPPING.map((mapping) => ({
      ...mapping,
      kind: "part",
      selected: selectedPart(plan, mapping.partNumber)?.selected !== false
    }));
    return [opening].concat(slides);
  }

  function valuesFromBlocks(plan, matcher) {
    return unique((plan.dictationPlanOverride || [])
      .filter((block) => matcher.test(block.label || ""))
      .flatMap((block) => block.values || []));
  }

  function dictationPrompts(plan) {
    return (plan.dictationPlanOverride || []).flatMap((block, blockIndex) => (block.values || []).map((value, itemIndex) => ({
      value,
      category: block.label || "Dictation",
      blockIndex,
      itemIndex
    })));
  }

  function noteValue(key) {
    return state.notes[key] || "";
  }

  function isMarked(key, value) {
    return Boolean(state.marked[key]?.[String(value)]);
  }

  function toggleMark(key, value) {
    state.marked[key] ||= {};
    const markKey = String(value);
    if (state.marked[key][markKey]) delete state.marked[key][markKey];
    else state.marked[key][markKey] = true;
  }

  function currentIndex(key, length) {
    const max = Math.max(0, length - 1);
    return Math.max(0, Math.min(Number(state.itemIndex[key] || 0), max));
  }

  function setIndex(key, length, nextIndex) {
    const max = Math.max(0, length - 1);
    state.itemIndex[key] = Math.max(0, Math.min(Number(nextIndex) || 0, max));
  }

  function advanceIndex(key, length, delta) {
    setIndex(key, length, currentIndex(key, length) + delta);
  }

  function tokenGrid(items, options = {}) {
    const key = options.markKey || "";
    const action = options.markable ? "toggle-mark" : "set-item";
    const empty = options.empty || "Ready";
    if (!items.length) return `<div class="present-empty">${escapeHtml(empty)}</div>`;
    return `<div class="present-token-grid ${options.compact ? "compact" : ""}">${items.map((item, index) => {
      const value = typeof item === "string" ? item : item.value;
      const label = typeof item === "string" ? "" : item.label;
      const marked = key && isMarked(key, value);
      return `
        <button
          class="present-token ${marked ? "is-marked" : ""}"
          type="button"
          data-present-action="${escapeHtml(action)}"
          data-key="${escapeHtml(options.itemKey || key)}"
          data-mark-key="${escapeHtml(key)}"
          data-value="${escapeHtml(value)}"
          data-index="${index}">
          <span>${escapeHtml(value)}</span>
          ${label ? `<em>${escapeHtml(label)}</em>` : ""}
          <i class="present-mark-badge">Marked</i>
        </button>
      `;
    }).join("")}</div>`;
  }

  function miniList(title, items) {
    return `
      <section class="present-drawer-section">
        <h3>${escapeHtml(title)}</h3>
        ${items?.length ? `<div class="present-mini-list">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : `<p>No items loaded.</p>`}
      </section>
    `;
  }

  function teacherNote(key, label = "Teacher notes") {
    return `
      <label class="present-note">
        <span>${escapeHtml(label)}</span>
        <textarea data-note-key="${escapeHtml(key)}" rows="4">${escapeHtml(noteValue(key))}</textarea>
      </label>
    `;
  }

  function stepper(key, items, renderItem, options = {}) {
    const list = items.length ? items : [{ value: options.empty || "Ready", category: "" }];
    const index = currentIndex(key, list.length);
    const item = list[index];
    return `
      <div class="present-stepper">
        <button type="button" data-present-action="item-prev" data-key="${escapeHtml(key)}" data-length="${list.length}" aria-label="Previous item">Previous</button>
        <div class="present-step-main">
          ${renderItem(item, index, list)}
          <p>${index + 1} of ${list.length}</p>
        </div>
        <button type="button" data-present-action="item-next" data-key="${escapeHtml(key)}" data-length="${list.length}" aria-label="Next item">Next</button>
      </div>
    `;
  }

  function renderOpening(plan) {
    const parts = V1_SECTION_MAPPING.map((mapping) => {
      const part = selectedPart(plan, mapping.partNumber);
      return `
        <button type="button" class="present-overview-card ${part?.selected === false ? "is-off" : ""}" data-present-action="goto-slide" data-index="${mapping.partNumber}">
          <b>${mapping.partNumber}</b>
          <span>${escapeHtml(mapping.title)}</span>
        </button>
      `;
    }).join("");
    return `
      <section class="present-opening">
        <div class="present-opening-copy">
          <p>${escapeHtml(plan.groupName || "Group")}</p>
          <h3>Step ${escapeHtml(plan.substep)}: ${escapeHtml(plan.focus || "Lesson")}</h3>
          <strong>Charting Page ${escapeHtml(plan.chartingPageNumber || "--")}</strong>
          <span>Reader ${escapeHtml(plan.reader || "--")}, p. ${escapeHtml(plan.wordlistPageNumber || "--")} ${plan.readerLevel ? `(${escapeHtml(plan.readerLevel)})` : ""}</span>
          <button type="button" data-present-action="start-lesson">Start Lesson</button>
        </div>
        <div class="present-opening-overview">
          ${parts}
        </div>
      </section>
    `;
  }

  function renderSounds(plan) {
    const sounds = valuesFromBlocks(plan, /sounds/i);
    const elements = valuesFromBlocks(plan, /word elements/i);
    const backup = unique((plan.realWords || []).concat(plan.nonsenseWords || [])).slice(0, 12);
    return `
      <section class="present-activity two-panel">
        <article class="present-focus-panel">
          <h3>Sounds</h3>
          ${tokenGrid(sounds.length ? sounds : backup, { empty: "Sound set ready" })}
        </article>
        <article class="present-focus-panel">
          <h3>Word Elements</h3>
          ${tokenGrid(elements, { empty: "No word elements loaded for this step" })}
        </article>
      </section>
    `;
  }

  function renderConcepts(plan) {
    const review = (plan.sectionTwoReviewWords || []).map((value) => ({ value, label: "Review" }));
    const current = (plan.sectionTwoCurrentWords || []).map((value) => ({ value, label: "Current" }));
    const items = review.concat(current);
    return `
      <section class="present-activity">
        ${stepper("concepts", items, (item) => `
          <article class="present-card-display">
            <span>${escapeHtml(item.label || "Concept")}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `, { empty: "Concept words ready" })}
      </section>
    `;
  }

  function renderWordCards(plan) {
    const review = (plan.sectionThreeReviewWords || []).map((value) => ({ value, label: "Review card" }));
    const current = (plan.sectionThreeCurrentWords || []).map((value) => ({ value, label: "Current card" }));
    const hfw = (plan.highFrequencyWords || []).map((value) => ({ value, label: "HFW" }));
    const items = review.concat(current, hfw);
    return `
      <section class="present-activity">
        ${stepper("wordCards", items, (item) => `
          <article class="present-card-display word-card">
            <span>${escapeHtml(item.label || "Word card")}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `, { empty: "Word cards ready" })}
      </section>
    `;
  }

  function renderCharting(plan) {
    const top = plan.realWords || [];
    const bottom = plan.nonsenseWords || [];
    const renderColumn = (title, words, key) => `
      <article class="present-chart-column">
        <h3>${escapeHtml(title)}</h3>
        <div class="present-chart-grid">
          ${words.map((word, index) => {
            const marked = isMarked(key, word);
            return `
              <button class="present-chart-word ${marked ? "is-marked" : ""}" type="button" data-present-action="toggle-mark" data-mark-key="${escapeHtml(key)}" data-value="${escapeHtml(word)}">
                <b>${index + 1}</b>
                <span>${escapeHtml(word)}</span>
                <i class="present-mark-badge">Error</i>
              </button>
            `;
          }).join("")}
        </div>
      </article>
    `;
    return `
      <section class="present-activity charting">
        <div class="present-page-label">Charting Page ${escapeHtml(plan.chartingPageNumber || "--")} | Reader ${escapeHtml(plan.reader || "--")}, p. ${escapeHtml(plan.wordlistPageNumber || "--")}</div>
        <div class="present-chart-layout">
          ${renderColumn("Top Half", top, "chartTop")}
          ${renderColumn("Bottom Half", bottom, "chartBottom")}
        </div>
      </section>
    `;
  }

  function renderSentences(plan) {
    const sentences = unique(plan.readerSentences || []);
    return `
      <section class="present-activity">
        ${stepper("sentences", sentences.map((value) => ({ value })), (item) => `
          <article class="present-sentence-display">
            <span>Reader ${escapeHtml(plan.reader || "--")}, p. ${escapeHtml(plan.sentencePageNumber || "--")}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `, { empty: "Use the selected Reader sentence page." })}
      </section>
    `;
  }

  function renderReverse(plan) {
    const sounds = valuesFromBlocks(plan, /sounds/i);
    const elements = valuesFromBlocks(plan, /word elements/i);
    const items = sounds.concat(elements).map((value) => ({ value, label: "Reverse drill" }));
    return `
      <section class="present-activity">
        ${stepper("reverse", items, (item) => `
          <article class="present-card-display reverse">
            <span>Quick Drill in Reverse</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `, { empty: "Reverse drill targets ready" })}
      </section>
    `;
  }

  function renderSpelling(plan) {
    const review = (plan.sectionSevenReviewWords || []).map((value) => ({ value, label: "Review" }));
    const nonsense = (plan.sectionSevenNonsenseWords || []).map((value) => ({ value, label: "Nonsense" }));
    const current = (plan.sectionSevenCurrentWords || []).map((value) => ({ value, label: "Current" }));
    const items = review.concat(nonsense, current);
    return `
      <section class="present-activity spelling">
        ${stepper("spelling", items, (item) => `
          <article class="present-card-display spelling-card">
            <span>${escapeHtml(item.label || "Spelling")}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `, { empty: "Spelling words ready" })}
      </section>
    `;
  }

  function renderDictation(plan) {
    const prompts = dictationPrompts(plan);
    const cleanStudent = state.mode === "student";
    return `
      <section class="present-activity dictation">
        ${stepper("dictation", prompts, (item, index, list) => `
          <article class="present-dictation-card ${cleanStudent ? "student-clean" : ""}">
            <span>${escapeHtml(item.category || "Dictation")}</span>
            ${cleanStudent ? `<strong>Listen and write</strong><em>Item ${index + 1} of ${list.length}</em>` : `<strong>${escapeHtml(item.value)}</strong><em>Teacher prompt</em>`}
          </article>
        `, { empty: "Dictation prompts ready" })}
      </section>
    `;
  }

  function renderFluency(plan) {
    const sentences = unique(plan.readerSentences || []);
    const phrases = valuesFromBlocks(plan, /phrases/i);
    const text = sentences.length ? sentences.join(" ") : "Use the selected controlled Reader passage for fluency reading.";
    return `
      <section class="present-activity fluency">
        <article class="present-passage">
          <span>Controlled Text / Fluency</span>
          <p>${escapeHtml(text)}</p>
        </article>
        ${phrases.length ? `<div class="present-phrase-strip">${phrases.map((phrase) => `<span>${escapeHtml(phrase)}</span>`).join("")}</div>` : ""}
      </section>
    `;
  }

  function renderComprehension(plan) {
    const vocabulary = unique(plan.highFrequencyWords || []).slice(0, 8);
    const questions = [
      "What was this passage mostly about?",
      "What happened first, next, and last?",
      "Which word or sentence helped you know?",
      "Retell the passage in your own words."
    ];
    return `
      <section class="present-activity comprehension">
        <article class="present-focus-panel">
          <h3>Vocabulary</h3>
          ${tokenGrid(vocabulary, { empty: "Vocabulary ready" })}
        </article>
        <article class="present-question-panel">
          ${questions.map((question, index) => `<p><b>${index + 1}</b>${escapeHtml(question)}</p>`).join("")}
        </article>
      </section>
    `;
  }

  function renderSlideBody(slide, plan) {
    if (slide.kind === "opening") return renderOpening(plan);
    const renderers = {
      1: renderSounds,
      2: renderConcepts,
      3: renderWordCards,
      4: renderCharting,
      5: renderSentences,
      6: renderReverse,
      7: renderSpelling,
      8: renderDictation,
      9: renderFluency,
      10: renderComprehension
    };
    return (renderers[slide.partNumber] || renderOpening)(plan);
  }

  function drawerForSlide(slide, plan) {
    if (state.mode === "student") return "";
    const mapping = slide.kind === "opening"
      ? `<p>V2 is using the same compatible lesson payload saved for the classic Teach Today history records.</p>`
      : `<p>Adapter target: V1 ${escapeHtml(slide.v1SectionId)}. Fields: ${slide.primaryFields.map(escapeHtml).join(", ")}.</p>`;
    const complete = state.completed[slide.partNumber] ? "Marked Done" : "Mark Done";
    let details = "";
    if (slide.partNumber === 1 || slide.partNumber === 6) {
      details = miniList("Sound Targets", valuesFromBlocks(plan, /sounds/i)) + miniList("Word Elements", valuesFromBlocks(plan, /word elements/i));
    } else if (slide.partNumber === 2) {
      details = miniList("Review Words", plan.sectionTwoReviewWords || []) + miniList("Current Words", plan.sectionTwoCurrentWords || []);
    } else if (slide.partNumber === 3) {
      details = miniList("Review Cards", plan.sectionThreeReviewWords || []) + miniList("Current Cards", plan.sectionThreeCurrentWords || []) + miniList("High Frequency", plan.highFrequencyWords || []);
    } else if (slide.partNumber === 4) {
      details = miniList("Top Half", plan.realWords || []) + miniList("Bottom Half", plan.nonsenseWords || []);
    } else if (slide.partNumber === 5) {
      details = miniList("High Frequency", plan.highFrequencyWords || []) + miniList("Sentences", plan.readerSentences || []);
    } else if (slide.partNumber === 7) {
      details = miniList("Review", plan.sectionSevenReviewWords || []) + miniList("Nonsense", plan.sectionSevenNonsenseWords || []) + miniList("Current", plan.sectionSevenCurrentWords || []);
    } else if (slide.partNumber === 8) {
      details = (plan.dictationPlanOverride || []).map((block) => miniList(block.label, block.values || [])).join("");
    } else if (slide.partNumber === 9 || slide.partNumber === 10) {
      details = miniList("Reader Content", plan.readerSentences || []) + miniList("Vocabulary", plan.highFrequencyWords || []);
    }
    return `
      <div class="present-drawer-head">
        <strong>Teacher Controls</strong>
        <button type="button" data-present-action="toggle-drawer">${state.drawerCollapsed ? "Show" : "Hide"}</button>
      </div>
      <section class="present-drawer-section">
        <h3>Runtime Adapter</h3>
        ${mapping}
      </section>
      ${details}
      ${slide.kind === "opening" ? "" : teacherNote(`slide-${slide.partNumber}`)}
      ${slide.kind === "opening" ? "" : `<button class="present-done" type="button" data-present-action="toggle-done" data-part="${slide.partNumber}">${complete}</button>`}
    `;
  }

  function renderOverview(slides) {
    return `
      <div class="present-overview-head">
        <strong>Sections</strong>
        <button type="button" data-present-action="toggle-overview">Close</button>
      </div>
      ${slides.map((slide, index) => `
        <button type="button" class="${index === state.slideIndex ? "active" : ""} ${slide.selected === false ? "is-off" : ""}" data-present-action="goto-slide" data-index="${index}">
          <b>${slide.kind === "opening" ? "0" : slide.partNumber}</b>
          <span>${escapeHtml(slide.title)}</span>
          ${slide.kind === "opening" ? "" : `<em>${index} of ${TOTAL_PARTS}</em>`}
        </button>
      `).join("")}
    `;
  }

  function render(plan = state.plan) {
    ensurePlan(plan);
    const d = dom();
    if (!state.plan || !d.stage) return;
    const slides = allSlides(state.plan);
    state.slideIndex = Math.max(0, Math.min(state.slideIndex, slides.length - 1));
    const slide = slides[state.slideIndex];

    d.stage.classList.toggle("teacher-mode", state.mode === "teacher");
    d.stage.classList.toggle("student-mode", state.mode === "student");
    d.stage.classList.toggle("drawer-collapsed", state.drawerCollapsed);
    d.teacherMode?.classList.toggle("active", state.mode === "teacher");
    d.studentMode?.classList.toggle("active", state.mode === "student");
    if (d.drawerToggle) {
      d.drawerToggle.hidden = state.mode === "student";
      d.drawerToggle.textContent = state.drawerCollapsed ? "Show Teacher Panel" : "Hide Teacher Panel";
    }

    d.eyebrow.textContent = slide.kind === "opening" ? "Lesson Ready" : `Part ${slide.partNumber}`;
    d.title.textContent = slide.kind === "opening" ? `Step ${state.plan.substep} - ${state.plan.focus || "Lesson"}` : slide.title;
    d.progress.textContent = slide.kind === "opening" ? "Opening" : `${slide.partNumber} of ${TOTAL_PARTS}`;
    d.content.innerHTML = renderSlideBody(slide, state.plan);
    d.drawer.innerHTML = drawerForSlide(slide, state.plan);
    d.overview.innerHTML = renderOverview(slides);
    d.overview.hidden = !state.overviewOpen;
    d.prev.disabled = state.slideIndex === 0;
    d.next.textContent = state.slideIndex === slides.length - 1 ? "Return to Builder" : state.slideIndex === 0 ? "Start Lesson" : "Next";
  }

  async function requestFullScreen() {
    const d = dom();
    try {
      const target = d.stage || document.documentElement;
      if (target.requestFullscreen && !document.fullscreenElement) await target.requestFullscreen();
    } catch (_) {}
  }

  async function open(plan) {
    ensurePlan(plan);
    const d = dom();
    if (!d.stage) return;
    state.open = true;
    state.slideIndex = 0;
    if (window.innerWidth < 820) state.drawerCollapsed = true;
    d.stage.hidden = false;
    document.body.classList.add("lbv2-presenting");
    render();
  }

  async function close() {
    const d = dom();
    state.open = false;
    state.overviewOpen = false;
    if (d.stage) d.stage.hidden = true;
    document.body.classList.remove("lbv2-presenting");
    try {
      if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen();
    } catch (_) {}
  }

  function nextSlide() {
    const slides = allSlides(state.plan || {});
    if (state.slideIndex >= slides.length - 1) {
      close();
      return;
    }
    state.slideIndex += 1;
    render();
  }

  function previousSlide() {
    state.slideIndex = Math.max(0, state.slideIndex - 1);
    render();
  }

  function handleClick(event) {
    if (event.lbv2PresentHandled) return;
    event.lbv2PresentHandled = true;
    const d = dom();
    const button = event.target.closest("button");
    if (!button || !d.stage?.contains(button)) return;

    if (button === d.teacherMode) {
      state.mode = "teacher";
      render();
      return;
    }
    if (button === d.studentMode) {
      state.mode = "student";
      state.drawerCollapsed = false;
      render();
      return;
    }
    if (button === d.drawerToggle) {
      state.drawerCollapsed = !state.drawerCollapsed;
      render();
      return;
    }
    if (button === d.overviewToggle) {
      state.overviewOpen = !state.overviewOpen;
      render();
      return;
    }
    if (button === d.fullscreen) {
      requestFullScreen();
      return;
    }
    if (button === d.exit) {
      close();
      return;
    }
    if (button === d.prev) {
      previousSlide();
      return;
    }
    if (button === d.next) {
      nextSlide();
      return;
    }

    const action = button.dataset.presentAction;
    if (!action) return;
    if (action === "start-lesson") {
      state.slideIndex = 1;
    } else if (action === "goto-slide") {
      state.slideIndex = Number(button.dataset.index) || 0;
      state.overviewOpen = false;
    } else if (action === "toggle-overview") {
      state.overviewOpen = !state.overviewOpen;
    } else if (action === "toggle-drawer") {
      state.drawerCollapsed = !state.drawerCollapsed;
    } else if (action === "item-prev") {
      advanceIndex(button.dataset.key, Number(button.dataset.length || 1), -1);
    } else if (action === "item-next") {
      advanceIndex(button.dataset.key, Number(button.dataset.length || 1), 1);
    } else if (action === "set-item") {
      setIndex(button.dataset.key, 999, Number(button.dataset.index || 0));
    } else if (action === "toggle-mark") {
      const teacherActive = state.mode === "teacher" || d.stage.classList.contains("teacher-mode");
      if (teacherActive) toggleMark(button.dataset.markKey || button.dataset.key, button.dataset.value);
    } else if (action === "toggle-done") {
      const part = button.dataset.part;
      state.completed[part] = !state.completed[part];
    }
    render();
  }

  function handleInput(event) {
    const target = event.target;
    if (!target?.dataset?.noteKey) return;
    state.notes[target.dataset.noteKey] = target.value;
  }

  function handleKeydown(event) {
    if (!state.open) return;
    const tagName = event.target?.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
      if (event.key !== "Escape") return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousSlide();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function init() {
    const d = dom();
    d.stage?.addEventListener("click", handleClick);
    d.content?.addEventListener("click", handleClick);
    d.drawer?.addEventListener("click", handleClick);
    d.overview?.addEventListener("click", handleClick);
    d.stage?.addEventListener("input", handleInput);
    document.addEventListener("keydown", handleKeydown);
  }

  window.lessonBuilderV2PresentMode = {
    render,
    open,
    close,
    mapping: V1_SECTION_MAPPING.map((item) => ({ ...item }))
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
