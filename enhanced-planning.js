(function initializeTeachTodayEnhancedPlanning(global) {
  "use strict";

  const api = {};
  const clean = (value) => String(value || "").trim();
  const unique = (values) => [...new Set((values || []).map(clean).filter(Boolean))];
  const index = () => global.teachTodayEnhancedPlanningIndex || null;
  const normalizedLevel = (value) => clean(value).toUpperCase().replace(/\s+/g, "");

  function compareSubsteps(left, right) {
    const a = clean(left).split(".").map(Number);
    const b = clean(right).split(".").map(Number);
    return (a[0] - b[0]) || (a[1] - b[1]);
  }

  function levelScore(storedLevel, requestedLevel) {
    const stored = normalizedLevel(storedLevel);
    const requested = normalizedLevel(requestedLevel || "AB");
    if (stored === requested) return 10;
    const parts = stored.split("+");
    if (parts.includes(requested)) return 9;
    if (requested === "A" && parts.includes("AB")) return 8;
    if (requested === "AB" && parts.includes("A")) return 4;
    return -1;
  }

  function bestEntry(entries, requestedLevel, getLevel) {
    return (entries || [])
      .map((entry) => ({ entry, score: levelScore(getLevel(entry), requestedLevel) }))
      .filter((candidate) => candidate.score >= 0)
      .sort((left, right) => right.score - left.score)[0]?.entry || null;
  }

  function entriesForLevel(entries, requestedLevel, getLevel) {
    const candidates = (entries || [])
      .map((entry) => ({ entry, score: levelScore(getLevel(entry), requestedLevel) }))
      .filter((candidate) => candidate.score >= 0);
    const direct = candidates.filter((candidate) => candidate.score >= 9);
    if (direct.length) return direct.map((candidate) => candidate.entry);
    const bestScore = Math.max(-1, ...candidates.map((candidate) => candidate.score));
    return candidates.filter((candidate) => candidate.score === bestScore).map((candidate) => candidate.entry);
  }

  api.isAvailable = () => Boolean(index()?.coverage?.substeps?.length);

  api.isCovered = (substep) => Boolean(index()?.coverage?.substeps?.includes(clean(substep)));

  api.compareSubsteps = compareSubsteps;

  api.findPage = (substep, level, readerPage) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return null;
    const pageNumber = Number(readerPage || 0);
    const matches = Object.values(data.pages || {}).filter((page) => (
      page.s === clean(substep) && Number(page.p) === pageNumber
    ));
    return bestEntry(matches, level, (page) => page.l);
  };

  api.pageConceptGroups = (substep, level) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return [];
    const groups = new Map();
    entriesForLevel(
      Object.values(data.pages || {}).filter((page) => page.s === clean(substep) && !page.n),
      level,
      (page) => page.l
    )
      .sort((left, right) => Number(left.p) - Number(right.p))
      .forEach((page) => {
        const concepts = unique(page.c || []);
        const key = concepts.length ? concepts.join("|") : "regular";
        if (!groups.has(key)) groups.set(key, { key, concepts, pages: [], pageWords: [], words: [] });
        const group = groups.get(key);
        group.pages.push(Number(page.p));
        group.pageWords.push({ page: Number(page.p), words: unique(page.w || []) });
        group.words.push(...(page.w || []));
      });
    return [...groups.values()].map((group) => ({
      ...group,
      pages: [...new Set(group.pages)],
      words: unique(group.words)
    }));
  };

  api.nonsensePageGroup = (substep) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return null;
    const pages = Object.values(data.pages || {})
      .filter((page) => page.s === clean(substep) && page.n)
      .sort((left, right) => Number(left.p) - Number(right.p));
    if (!pages.length) return null;
    return {
      pages: [...new Set(pages.map((page) => Number(page.p)))],
      pageWords: pages.map((page) => ({ page: Number(page.p), words: unique(page.w || []) })),
      words: unique(pages.flatMap((page) => page.w || []))
    };
  };

  api.findSentenceRecommendation = (substep, level, readerPage) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return null;
    const pageNumber = Number(readerPage || 0);
    const matches = Object.entries(data.sentenceRecommendations || {})
      .filter(([key]) => {
        const [keySubstep, , keyPage] = key.split("|");
        return keySubstep === clean(substep) && Number(keyPage) === pageNumber;
      })
      .map(([key, recommendation]) => ({ key, recommendation, level: key.split("|")[1] }));
    return bestEntry(matches, level, (match) => match.level)?.recommendation || null;
  };

  api.findDictationRecommendations = (substep, level, readerPage) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return [];
    const pageNumber = Number(readerPage || 0);
    const matches = Object.entries(data.dictationRecommendations || {})
      .filter(([key]) => {
        const [keySubstep, , keyPage] = key.split("|");
        return keySubstep === clean(substep) && Number(keyPage) === pageNumber;
      })
      .map(([key, recommendations]) => ({ key, recommendations, level: key.split("|")[1] }));
    return bestEntry(matches, level, (match) => match.level)?.recommendations || [];
  };

  api.wordMetadata = (substep, word) => (
    index()?.words?.[clean(substep)]?.[clean(word).toLowerCase()] || null
  );

  api.wordSourceSubstep = (substep, word) => {
    const data = index();
    const key = clean(word).toLowerCase();
    if (!data || !key) return null;
    return (data.coverage?.substeps || [])
      .filter((candidate) => compareSubsteps(candidate, substep) <= 0 && data.words?.[candidate]?.[key])
      .sort((left, right) => compareSubsteps(right, left))[0] || null;
  };

  api.wordMetadataAtOrBefore = (substep, word) => {
    const source = api.wordSourceSubstep(substep, word);
    return source ? api.wordMetadata(source, word) : null;
  };

  api.wordElements = (substep, words) => {
    const values = [];
    (words || []).forEach((word) => {
      const metadata = api.wordMetadataAtOrBefore(substep, word);
      (metadata?.p || []).forEach((part) => values.push(`${part.replace(/^-+|-+$/g, "")}-`));
      (metadata?.l || []).forEach((part) => values.push(`-${part.replace(/^-+|-+$/g, "")}-`));
      (metadata?.s || []).forEach((part) => values.push(`-${part.replace(/^-+|-+$/g, "")}`));
    });
    return unique(values);
  };

  api.soundGroups = (substep, words) => {
    const groups = { vowels: [], consonants: [], welded: [] };
    (words || []).forEach((word) => {
      const metadata = api.wordMetadataAtOrBefore(substep, word);
      (metadata?.v || []).forEach((sound) => groups.vowels.push(sound));
      (metadata?.d || []).forEach((sound) => groups.consonants.push(sound));
      (metadata?.g || []).forEach((sound) => groups.welded.push(sound));
      (metadata?.k || []).forEach((blend) => {
        clean(blend).split("").forEach((sound) => groups.consonants.push(sound));
      });
      const stripped = clean(word).toLowerCase().replace(/[^a-z]/g, "");
      const consumed = unique([...(metadata?.d || []), ...(metadata?.g || [])]);
      let remaining = stripped;
      consumed.sort((a, b) => b.length - a.length).forEach((part) => {
        remaining = remaining.replaceAll(clean(part).toLowerCase(), "");
      });
      remaining.replace(/[aeiouy]/g, "").split("").forEach((sound) => groups.consonants.push(sound));
    });
    return {
      vowels: unique(groups.vowels),
      consonants: unique(groups.consonants),
      welded: unique(groups.welded)
    };
  };

  api.difficultyTags = (substep, word, options = {}) => {
    const metadata = api.wordMetadataAtOrBefore(substep, word);
    const tags = [];
    if (options.nonsense) tags.push("NS");
    if (options.hfw) tags.push("HFW");
    if (metadata?.k?.length) tags.push("Blends");
    if (metadata?.v?.length || metadata?.e?.length) tags.push("Vowel Diff");
    if (metadata?.s?.length) tags.push("Sfx");
    return unique(tags);
  };

  api.reviewWordsBefore = (substep, level, limit = 60) => {
    const data = index();
    if (!data || !api.isCovered(substep)) return [];
    return Object.values(data.pages || {})
      .filter((page) => !page.n && compareSubsteps(page.s, substep) < 0 && levelScore(page.l, level) >= 0)
      .sort((left, right) => compareSubsteps(right.s, left.s) || Number(right.p) - Number(left.p))
      .flatMap((page) => page.w || [])
      .filter((word, position, values) => values.indexOf(word) === position)
      .slice(0, limit);
  };

  global.TeachTodayEnhancedPlanning = api;
})(window);
