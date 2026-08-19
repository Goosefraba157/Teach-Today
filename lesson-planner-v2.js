(function () {
  "use strict";

  const STORAGE_KEY = "dyslexiaInstructionEngine.v2";
  const V2_ARCHIVE_KEY = "teachToday.lessonBuilderV2.savedPlans.v1";
  const FEATURE_KEY = "teachToday.lessonBuilderV2.enabled";
  const ADAPTER_VERSION = "teach-today-history-v1.lesson-builder-v2";

  const SUBSTEP_TITLES = {
    "1.1": "Foundations",
    "1.2": "Introduced sounds",
    "1.3": "Three-sound words",
    "1.4": "Bonus letters and all",
    "1.5": "Nasal combinations",
    "1.6": "Base word plus suffix",
    "2.1": "Welded sounds",
    "2.2": "Four sounds",
    "2.3": "Closed exceptions",
    "2.4": "Five sounds and Latin bases",
    "2.5": "Three-letter blends",
    "3.1": "Two closed syllables",
    "3.2": "Closed syllables with blends",
    "3.3": "ct blend syllables",
    "3.4": "Multisyllabic closed",
    "3.5": "Closed plus suffixes",
    "4.1": "Vowel-consonant-e",
    "4.2": "v-e with closed",
    "4.3": "Multisyllabic mixed syllables",
    "4.4": "v-e exceptions",
    "5.1": "Open syllables",
    "5.2": "Open with closed and v-e",
    "5.3": "Final y",
    "5.4": "Three syllable types",
    "5.5": "Open exceptions",
    "6.1": "More suffixes",
    "6.2": "Suffix ed",
    "6.3": "Two suffixes",
    "6.4": "Final stable syllable",
    "7.1": "Soft c and g",
    "7.2": "ce, ge, dge",
    "7.3": "ph and tch",
    "7.4": "tion and sion",
    "7.5": "Contractions and possessives",
    "8.1": "R-controlled one-syllable",
    "8.2": "ar and or multisyllabic",
    "8.3": "er, ir, ur multisyllabic",
    "8.4": "R-controlled exceptions",
    "8.5": "Final ar/or/ard",
    "9.1": "Long a teams",
    "9.2": "Long e teams",
    "9.3": "More vowel teams",
    "9.4": "Diphthongs and teams",
    "9.5": "Vowel sounds with u",
    "9.6": "Advanced vowel teams",
    "9.7": "Additional teams",
    "10.1": "Suffixes ending in e",
    "10.2": "Drop-e suffix rule",
    "10.3": "Doubling one-syllable bases",
    "10.4": "Doubling multisyllabic bases",
    "10.5": "Advanced suffix sets",
    "10.6": "Latin base plus suffix",
    "11.1": "Y sounds",
    "11.2": "Y spelling rule",
    "11.3": "igh and eigh",
    "11.4": "ie and ei",
    "11.5": "I sound options",
    "12.1": "Split vowels",
    "12.2": "Silent letters",
    "12.3": "W affects vowels",
    "12.4": "ch and que as k",
    "12.5": "Additional suffixes",
    "12.6": "Assimilated prefixes"
  };

  const CURRICULUM_CHARTING_ANCHORS = {
    "5.3": 143
  };

  const LESSON_PARTS = [
    { id: "1", name: "Sounds Quick Drill", resource: "Reading set", summary: "Cumulative vowels, consonants, welded sounds, and word elements." },
    { id: "2", name: "Teach and Review", resource: "Concept words", summary: "Review words, current concept words, and student trouble spots." },
    { id: "3", name: "Word Cards", resource: "Word cards", summary: "Current charting words plus high frequency word support." },
    { id: "4", name: "Wordlist Reading", resource: "Charting page", summary: "Independent charting with real and nonsense words." },
    { id: "5", name: "Sentence Reading", resource: "Reader sentences", summary: "Connected sentence reading from the recommended reader page." },
    { id: "6", name: "Quick Drill in Reverse", resource: "Sound dictation", summary: "Teacher says the sound; students identify and build the sound." },
    { id: "7", name: "Spelling Concepts", resource: "Encoding words", summary: "Spelling words aligned to the same substep and page." },
    { id: "8", name: "Dictation", resource: "Dictation set", summary: "Sounds, words, phrases, and sentences for written work." },
    { id: "9", name: "Fluency", resource: "Reader passage", summary: "Oral reading, phrase work, and repeated reading support." },
    { id: "10", name: "Comprehension", resource: "Response set", summary: "Vocabulary, retell, and comprehension response." }
  ];

  const state = {
    data: loadTeacherState(),
    selectedParts: new Set(LESSON_PARTS.map((part) => part.id)),
    params: new URLSearchParams(location.search || ""),
    groupId: "",
    substep: "",
    level: "AB",
    plan: null
  };

  const dom = {
    group: document.getElementById("lbv2Group"),
    substep: document.getElementById("lbv2Substep"),
    level: document.getElementById("lbv2Level"),
    groupMeta: document.getElementById("lbv2GroupMeta"),
    studentMeta: document.getElementById("lbv2StudentMeta"),
    anchorTitle: document.getElementById("lbv2AnchorTitle"),
    chartingPage: document.getElementById("lbv2ChartingPage"),
    readerPage: document.getElementById("lbv2ReaderPage"),
    integrityScore: document.getElementById("lbv2IntegrityScore"),
    integrityLabel: document.getElementById("lbv2IntegrityLabel"),
    recommendTitle: document.getElementById("lbv2RecommendTitle"),
    recommendMeta: document.getElementById("lbv2RecommendMeta"),
    evidenceRows: document.getElementById("lbv2EvidenceRows"),
    parts: document.getElementById("lbv2Parts"),
    partCount: document.getElementById("lbv2PartCount"),
    autoSelect: document.getElementById("lbv2AutoSelect"),
    save: document.getElementById("lbv2Save"),
    saveStatus: document.getElementById("lbv2SaveStatus"),
    previewButton: document.getElementById("lbv2PreviewPdf"),
    presentButton: document.getElementById("lbv2Present"),
    preview: document.getElementById("lbv2Preview"),
    pdfPage: document.getElementById("lbv2PdfPage"),
    presentStage: document.getElementById("lbv2PresentStage"),
    exitPresent: document.getElementById("lbv2ExitPresent")
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadTeacherState() {
    const saved = readJson(STORAGE_KEY, null);
    if (saved && typeof saved === "object") {
      saved.groups = Array.isArray(saved.groups) ? saved.groups : [];
      saved.masterRecords = Array.isArray(saved.masterRecords) ? saved.masterRecords : [];
      return saved;
    }
    return {
      selectedGroupId: "preview-53",
      masterRecords: [],
      groups: [
        {
          id: "preview-53",
          name: "Preview Step 5.3 Group",
          substep: "5.3",
          readerLevel: "AB",
          students: ["Student 1", "Student 2"],
          activeStudent: "Student 1",
          trouble: [],
          chartResults: [],
          history: [],
          pageProgress: { wordlist: 0, sentences: 0, passage: 0 }
        }
      ]
    };
  }

  function orderedSubsteps() {
    const fromCharts = Object.keys(window.readerChartIndex || {});
    const fromTitles = Object.keys(SUBSTEP_TITLES);
    return [...new Set(fromTitles.concat(fromCharts))].sort(compareSubsteps);
  }

  function compareSubsteps(a, b) {
    const [as, ai] = String(a).split(".").map(Number);
    const [bs, bi] = String(b).split(".").map(Number);
    return (as - bs) || (ai - bi);
  }

  function getGroup() {
    return (state.data.groups || []).find((group) => group.id === state.groupId) || state.data.groups?.[0] || null;
  }

  function stepNumber(substep = state.substep) {
    return Number(String(substep || "1").split(".")[0]) || 1;
  }

  function substepTitle(substep = state.substep) {
    return SUBSTEP_TITLES[substep] || `Step ${substep}`;
  }

  function levelsForSubstep(substep) {
    const chartLevels = Object.keys(window.readerChartIndex?.[substep] || {});
    const sentenceLevels = Object.keys(window.readerSentenceIndex?.[substep] || {});
    const levels = [...new Set(chartLevels.concat(sentenceLevels, ["AB"]))];
    return ["AB", "A", "B", "N"].filter((level) => levels.includes(level));
  }

  function resolveLevel(substep, preferred = state.level, source = window.readerChartIndex) {
    const levels = source?.[substep] || {};
    if (levels[preferred]) return preferred;
    if (levels.AB) return "AB";
    if (levels.A) return "A";
    if (levels.B) return "B";
    if (levels.N) return "N";
    return preferred || "AB";
  }

  function chartPages(substep, preferredLevel = state.level) {
    const level = resolveLevel(substep, preferredLevel, window.readerChartIndex);
    return Object.entries(window.readerChartIndex?.[substep]?.[level] || {})
      .map(([page, entry]) => ({
        page: Number(page),
        level,
        count: Number(entry.c ?? entry.count ?? 0),
        words: (entry.t || entry.top || []).concat(entry.b || entry.bottom || [])
      }))
      .filter((item) => Number.isFinite(item.page))
      .sort((a, b) => a.page - b.page);
  }

  function sentencePages(substep, preferredLevel = state.level) {
    const level = resolveLevel(substep, preferredLevel, window.readerSentenceIndex);
    return Object.entries(window.readerSentenceIndex?.[substep]?.[level] || {})
      .map(([page, entry]) => ({
        page: Number(page),
        level,
        highFrequency: entry.h || entry.highFrequency || [],
        sentences: entry.s || entry.sentences || []
      }))
      .filter((item) => Number.isFinite(item.page))
      .sort((a, b) => a.page - b.page);
  }

  function groupRecords(group, substep = state.substep) {
    const chartResults = (group?.chartResults || []).map((record) => ({ ...record, source: "group chart" }));
    const master = (state.data.masterRecords || []).filter((record) => {
      const sameGroup = record.groupId === group?.id || record.group === group?.name;
      return sameGroup && (!substep || record.substep === substep);
    });
    const fromHistory = (group?.history || []).flatMap((plan) => (plan.lessons || []).map((lesson) => ({
      source: plan.createdBy === "LessonBuilderV2" ? "V2 lesson" : "lesson history",
      substep: lesson.substep,
      wordlistPage: lesson.wordlistPageNumber || lesson.chartingPageNumber,
      date: plan.savedAt || plan.createdAt || plan.created
    }))).filter((record) => !substep || record.substep === substep);
    return chartResults.concat(master, fromHistory);
  }

  function recommendChartPage(group, substep, level) {
    const pages = chartPages(substep, level);
    const usable = pages.filter((item) => item.count >= 30);
    const candidates = usable.length ? usable : pages;
    const progressIndex = Number(group?.pageProgress?.wordlist || 0);
    const latestRecord = groupRecords(group, substep).slice().reverse().find((record) => Number(record.wordlistPage || record.wordlistPageNumber));
    const latestPage = Number(latestRecord?.wordlistPage || latestRecord?.wordlistPageNumber || 0);
    const nextAfterLatest = latestPage ? candidates.find((item) => item.page > latestPage) : null;
    const byProgress = candidates[Math.max(0, Math.min(progressIndex, candidates.length - 1))];
    const selected = nextAfterLatest || byProgress || candidates[0] || {
      page: CURRICULUM_CHARTING_ANCHORS[substep] || null,
      level,
      count: 0,
      words: []
    };
    return {
      ...selected,
      displayPage: CURRICULUM_CHARTING_ANCHORS[substep] || selected.page,
      readerPage: selected.page,
      reader: stepNumber(substep)
    };
  }

  function nearestSentencePage(substep, level, readerPage) {
    const pages = sentencePages(substep, level);
    if (!pages.length) return { page: null, level, highFrequency: [], sentences: [] };
    const exactOrNext = pages.find((item) => item.page >= readerPage);
    return exactOrNext || pages[0];
  }

  function dictationWords(substep, level) {
    return window.dictationIndex?.[substep]?.[level]?.words
      || window.dictationIndex?.[substep]?.AB?.words
      || window.dictationIndex?.[substep]?.A?.words
      || window.dictationIndex?.[substep]?.B?.words
      || [];
  }

  function dictationPhrases(substep) {
    return (window.dictationPhraseIndex?.[substep] || [])
      .flatMap((row) => row.phrases || [])
      .slice(0, 3);
  }

  function dictationSentences(substep, level) {
    const groups = window.dictationSentenceIndex?.[substep]?.[level]?.groups
      || window.dictationSentenceIndex?.[substep]?.AB?.groups
      || [];
    return groups.flatMap((group) => group.chunks || [])
      .flatMap((chunk) => chunk.sentences || [])
      .slice(0, 3);
  }

  function unique(items) {
    return [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))];
  }

  function buildLessonPlan() {
    const group = getGroup();
    const substep = state.substep || group?.substep || "5.3";
    const level = state.level || group?.readerLevel || "AB";
    const chart = recommendChartPage(group, substep, level);
    const sentence = nearestSentencePage(substep, level, chart.readerPage || 0);
    const chartWords = unique(chart.words);
    const realWords = chartWords.slice(0, 15);
    const nonsenseWords = chartWords.slice(15, 30);
    const hfw = unique((sentence.highFrequency || []).concat(window.wilsonHighFrequencyWords?.[substep] || []));
    const words = unique(dictationWords(substep, level).concat(realWords));
    const phrases = dictationPhrases(substep);
    const sentences = unique(dictationSentences(substep, level).concat(sentence.sentences || []));
    const selectedParts = LESSON_PARTS.filter((part) => state.selectedParts.has(part.id));
    const resources = {
      readingSet: true,
      wordCards: realWords.length || words.length,
      dictation: words.length || phrases.length || sentences.length,
      reader: sentence.sentences?.length || chart.readerPage,
      fluency: sentence.sentences?.length || realWords.length,
      vocabulary: hfw.length || words.length,
      comprehension: sentence.sentences?.length || realWords.length
    };
    const score = lessonIntegrityScore(resources, selectedParts.length);
    return {
      id: `lesson-v2-${Date.now()}`,
      groupId: group?.id || "preview",
      groupName: group?.name || "Preview Group",
      substep,
      reader: stepNumber(substep),
      readerLevel: chart.level || level,
      lessonType: "full",
      title: `${substep} ${substepTitle(substep)} Lesson`,
      focus: substepTitle(substep),
      day: "Lesson Ready",
      wordlistPageNumber: chart.readerPage,
      chartingPageNumber: chart.displayPage,
      sentencePageNumber: sentence.page,
      sentenceLevel: sentence.level,
      realWords,
      nonsenseWords,
      highFrequencyWords: hfw.slice(0, 12),
      readerSentences: (sentence.sentences || []).slice(0, 10),
      sectionTwoReviewWords: words.slice(0, 6),
      sectionTwoCurrentWords: realWords.slice(0, 6),
      sectionThreeReviewWords: hfw.slice(0, 6),
      sectionThreeCurrentWords: realWords.slice(0, 8),
      sectionSevenReviewWords: words.slice(0, 5),
      sectionSevenCurrentWords: realWords.slice(0, 5),
      sectionSevenNonsenseWords: nonsenseWords.slice(0, 3),
      dictationPlanOverride: [
        { label: "5 sounds", values: soundSetForSubstep(substep).slice(0, 5) },
        { label: "5 word elements", values: wordElementsForSubstep(substep).slice(0, 5) },
        { label: "5 real words", values: words.slice(0, 5) },
        { label: "3 nonsense words", values: nonsenseWords.slice(0, 3) },
        { label: "3 phrases", values: phrases.slice(0, 3) },
        { label: "2 sentences", values: sentences.slice(0, 2) }
      ],
      lessonParts: LESSON_PARTS.map((part) => ({
        partNumber: Number(part.id),
        name: part.name,
        resource: part.resource,
        selected: state.selectedParts.has(part.id)
      })),
      sourcePages: {
        charting: {
          label: `Charting Page ${chart.displayPage || "--"}`,
          reader: chart.reader,
          readerPage: chart.readerPage,
          level: chart.level,
          wordCount: chart.count
        },
        sentence: {
          reader: stepNumber(substep),
          readerPage: sentence.page,
          level: sentence.level
        }
      },
      lessonIntegrity: {
        score,
        label: score === 100 ? "Fully Aligned" : score >= 80 ? "Needs Review" : "Missing Data",
        resources
      },
      migrationSafeAdapter: ADAPTER_VERSION,
      builderVersion: "lesson-builder-v2",
      createdAt: new Date().toISOString()
    };
  }

  function lessonIntegrityScore(resources, selectedCount) {
    const resourceValues = Object.values(resources);
    const resourceScore = resourceValues.filter(Boolean).length / resourceValues.length;
    const partScore = selectedCount / LESSON_PARTS.length;
    return Math.round(((resourceScore * 0.45) + (partScore * 0.55)) * 100);
  }

  function soundSetForSubstep(substep) {
    const step = stepNumber(substep);
    const soundIndex = window.dictationSoundIndex?.[String(Math.min(step, 7))] || {};
    return unique([soundIndex.vowels, soundIndex.consonants, soundIndex.additional].join(",").split(",")).slice(0, 12);
  }

  function wordElementsForSubstep(substep) {
    const step = stepNumber(substep);
    const base = {
      1: ["closed syllable", "digraph", "suffix -s"],
      2: ["welded sound", "blend", "closed exception", "Latin base"],
      3: ["prefix", "closed syllable", "suffix -ed", "suffix -ing"],
      4: ["vowel-consonant-e", "suffix -ive", "closed syllable"],
      5: ["open syllable", "final y", "open prefix"],
      6: ["suffix", "base word", "consonant-le"],
      7: ["soft c", "soft g", "dge", "tion", "sion"],
      8: ["r-controlled", "ar", "or", "er", "ir", "ur"],
      9: ["vowel team", "diphthong", "advanced vowel"],
      10: ["advanced suffix", "drop-e", "doubling rule"],
      11: ["y spelling", "igh", "eigh", "ie", "ei"],
      12: ["silent letters", "split vowel", "assimilated prefix"]
    };
    return base[step] || base[1];
  }

  function renderControls() {
    const groups = state.data.groups || [];
    if (!state.groupId) state.groupId = state.params.get("groupId") || state.data.selectedGroupId || groups[0]?.id || "";
    const group = getGroup();
    if (!state.substep) state.substep = state.params.get("substep") || group?.substep || "5.3";
    state.level = state.params.get("level") || state.level || group?.readerLevel || "AB";

    dom.group.innerHTML = groups.map((groupItem) => `
      <option value="${escapeHtml(groupItem.id)}">${escapeHtml(groupItem.name || groupItem.id)}</option>
    `).join("");
    dom.group.value = state.groupId;

    dom.substep.innerHTML = orderedSubsteps().map((substep) => `
      <option value="${escapeHtml(substep)}">${escapeHtml(substep)} - ${escapeHtml(substepTitle(substep))}</option>
    `).join("");
    dom.substep.value = state.substep;

    const levels = levelsForSubstep(state.substep);
    dom.level.innerHTML = levels.map((level) => `<option value="${escapeHtml(level)}">${escapeHtml(level)}</option>`).join("");
    if (!levels.includes(state.level)) state.level = levels[0] || "AB";
    dom.level.value = state.level;
  }

  function render() {
    state.plan = buildLessonPlan();
    const group = getGroup();
    const plan = state.plan;
    const selectedCount = state.selectedParts.size;

    dom.groupMeta.textContent = group?.name || "Preview Group";
    dom.studentMeta.textContent = `${(group?.students || []).length} student${(group?.students || []).length === 1 ? "" : "s"}${group?.activeStudent ? `, active: ${group.activeStudent}` : ""}`;
    dom.anchorTitle.textContent = `Step ${plan.substep}`;
    dom.chartingPage.textContent = `Charting Page ${plan.chartingPageNumber || "--"}`;
    dom.readerPage.textContent = `Reader ${plan.reader}, p. ${plan.wordlistPageNumber || "--"}${plan.readerLevel ? ` (${plan.readerLevel})` : ""}`;
    dom.integrityScore.textContent = `${plan.lessonIntegrity.score}%`;
    dom.integrityLabel.innerHTML = `<i></i> ${escapeHtml(plan.lessonIntegrity.label)}`;
    dom.recommendTitle.textContent = `Page ${plan.chartingPageNumber || "--"}`;
    dom.recommendMeta.textContent = `Step ${plan.substep}, ${plan.focus}. Reader ${plan.reader}, source page ${plan.wordlistPageNumber || "--"}, ${plan.realWords.length + plan.nonsenseWords.length} charting words loaded.`;
    dom.partCount.textContent = `${selectedCount} selected`;

    renderParts();
    renderEvidence(group, plan);
    renderPreview(plan);
    renderPresent(plan);
  }

  function renderParts() {
    dom.parts.innerHTML = LESSON_PARTS.map((part) => {
      const checked = state.selectedParts.has(part.id);
      return `
        <article class="part-card${checked ? "" : " is-off"}">
          <header>
            <b>${escapeHtml(part.id)}</b>
            <label><input type="checkbox" data-part="${escapeHtml(part.id)}" ${checked ? "checked" : ""}> Selected</label>
          </header>
          <strong>${escapeHtml(part.name)}</strong>
          <p>${escapeHtml(part.summary)}</p>
        </article>
      `;
    }).join("");

    dom.parts.querySelectorAll("[data-part]").forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) state.selectedParts.add(input.dataset.part);
        else state.selectedParts.delete(input.dataset.part);
        render();
      });
    });
  }

  function renderEvidence(group, plan) {
    const records = groupRecords(group, plan.substep);
    const lastRecord = records.at(-1);
    const rows = [
      ["Students", (group?.students || []).join(", ") || "No roster attached"],
      ["Recent evidence", lastRecord ? `${lastRecord.source || "record"}${lastRecord.wordlistPage ? `, page ${lastRecord.wordlistPage}` : ""}` : "No saved evidence for this substep"],
      ["Words", `${plan.realWords.length} real, ${plan.nonsenseWords.length} nonsense`],
      ["Dictation", `${plan.dictationPlanOverride.reduce((sum, block) => sum + block.values.length, 0)} items`],
      ["Adapter", ADAPTER_VERSION]
    ];
    dom.evidenceRows.innerHTML = rows.map(([label, value]) => `
      <div class="evidence-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>
    `).join("");
  }

  function renderPreview(plan) {
    const dictation = plan.dictationPlanOverride.map((block) => `<li><strong>${escapeHtml(block.label)}:</strong> ${escapeHtml(block.values.join(", ") || "ready")}</li>`).join("");
    const parts = plan.lessonParts.filter((part) => part.selected).map((part) => `<li>Part ${part.partNumber}: ${escapeHtml(part.name)}</li>`).join("");
    dom.pdfPage.innerHTML = `
      <header>
        <div>
          <p>Teach Today Lesson Plan</p>
          <h2>Step ${escapeHtml(plan.substep)} - ${escapeHtml(plan.focus)}</h2>
          <p>${escapeHtml(plan.groupName)} | ${escapeHtml(plan.day)}</p>
        </div>
        <div>
          <p>${escapeHtml(plan.sourcePages.charting.label)}</p>
          <p>Reader ${escapeHtml(plan.reader)}, p. ${escapeHtml(plan.wordlistPageNumber || "--")}</p>
          <p>Integrity ${escapeHtml(plan.lessonIntegrity.score)}%</p>
        </div>
      </header>
      <div class="pdf-two-col">
        <section>
          <h3>Lesson Parts</h3>
          <ul>${parts}</ul>
          <h3>Charting Words</h3>
          <p>${escapeHtml(plan.realWords.concat(plan.nonsenseWords).join(", ") || "Charting source ready.")}</p>
        </section>
        <section>
          <h3>Dictation</h3>
          <ul>${dictation}</ul>
          <h3>Reader and Comprehension</h3>
          <p>${escapeHtml((plan.readerSentences || []).slice(0, 3).join(" ") || "Reader fluency and comprehension response ready.")}</p>
          <p><strong>Vocabulary:</strong> ${escapeHtml((plan.highFrequencyWords || []).join(", ") || "Vocabulary ready.")}</p>
        </section>
      </div>
    `;
  }

  function renderPresent(plan) {
    window.lessonBuilderV2PresentMode?.render(plan);
  }

  function selectAllParts() {
    state.selectedParts = new Set(LESSON_PARTS.map((part) => part.id));
    render();
  }

  function saveCompatibleLesson() {
    const group = getGroup();
    if (!group) return;
    const plan = buildLessonPlan();
    const now = new Date();
    const record = {
      id: `plan-v2-${now.getTime()}`,
      title: `${plan.substep} Lesson Builder V2 - Charting Page ${plan.chartingPageNumber || "--"} - ${now.toLocaleDateString()}`,
      created: now.toLocaleString(),
      createdAt: now.toISOString(),
      savedAt: now.toISOString(),
      source: "TeachToday",
      createdBy: "LessonBuilderV2",
      builderVersion: "lesson-builder-v2",
      migrationSafeAdapter: ADAPTER_VERSION,
      status: "ready",
      substep: plan.substep,
      tabLabel: `${plan.substep} V2`,
      lessons: [plan]
    };
    group.history = Array.isArray(group.history) ? group.history : [];
    group.history.push(record);
    group.history = group.history.slice(-50);
    state.data.selectedGroupId = group.id;
    writeJson(STORAGE_KEY, state.data);

    const archive = readJson(V2_ARCHIVE_KEY, []);
    archive.unshift({ ...record, groupName: group.name });
    writeJson(V2_ARCHIVE_KEY, archive.slice(0, 50));

    dom.saveStatus.textContent = `Saved ${record.tabLabel} in a Teach Today compatible history record.`;
  }

  function openPreview() {
    dom.preview.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function openPresentMode() {
    const plan = state.plan || buildLessonPlan();
    await window.lessonBuilderV2PresentMode?.open(plan);
  }

  async function closePresentMode() {
    await window.lessonBuilderV2PresentMode?.close();
  }

  function bind() {
    dom.group.addEventListener("change", () => {
      state.groupId = dom.group.value;
      const group = getGroup();
      state.substep = group?.substep || state.substep;
      state.level = group?.readerLevel || state.level;
      renderControls();
      render();
    });
    dom.substep.addEventListener("change", () => {
      state.substep = dom.substep.value;
      renderControls();
      render();
    });
    dom.level.addEventListener("change", () => {
      state.level = dom.level.value;
      render();
    });
    dom.autoSelect.addEventListener("click", selectAllParts);
    dom.save.addEventListener("click", saveCompatibleLesson);
    dom.previewButton.addEventListener("click", openPreview);
    dom.presentButton.addEventListener("click", openPresentMode);
  }

  function init() {
    try {
      localStorage.setItem(FEATURE_KEY, "true");
    } catch (_) {}
    renderControls();
    render();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
