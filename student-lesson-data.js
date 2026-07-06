(function () {
  "use strict";

  const WELDED_ENDINGS = ["ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk"];

  function unique(values) {
    return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
  }

  function flattenWordPages(section) {
    return unique(Object.values(section || {}).flatMap((page) => Array.isArray(page) ? page : []));
  }

  function flattenSentencePages(section) {
    return unique(Object.values(section || {}).flatMap((page) => page?.sentences || []));
  }

  function patternFor(word) {
    return WELDED_ENDINGS.find((ending) => word.endsWith(ending)) || "mixed";
  }

  function graphemesFor(word) {
    const pieces = [];
    let rest = String(word || "").toLowerCase();
    while (rest) {
      const digraph = ["ch", "sh", "th", "wh", "qu", "ck"].find((part) => rest.startsWith(part));
      if (digraph) {
        pieces.push(digraph);
        rest = rest.slice(digraph.length);
        continue;
      }
      if (rest.length === 2 && (rest === "ng" || rest === "nk")) {
        pieces.push(rest);
        break;
      }
      pieces.push(rest[0]);
      rest = rest.slice(1);
    }
    return pieces;
  }

  function buildStep21() {
    const wordsRoot = window.readerWordlists?.["2.1"] || {};
    const sentencesRoot = window.readerSentences?.["2.1"] || {};
    const earlyWords = flattenWordPages({
      ...(wordsRoot.AB || {}),
      ...(wordsRoot.B || {})
    }).filter((word) => WELDED_ENDINGS.some((ending) => word.endsWith(ending)) && !word.endsWith("s"));
    const sentences = unique([
      ...flattenSentencePages(sentencesRoot.AB),
      ...flattenSentencePages(sentencesRoot.B)
    ]);
    const words = earlyWords.map((word) => ({
      word,
      pattern: patternFor(word),
      graphemes: graphemesFor(word),
      source: "reader-wordlists.js · Step 2.1"
    }));

    return {
      stepId: "2",
      stepTitle: "Welded Sounds",
      substepId: "2.1",
      substepTitle: "Welded sounds: ng and nk",
      concept: "Read and spell words with welded -ng and -nk endings.",
      patterns: WELDED_ENDINGS,
      sources: {
        words: "reader-wordlists.js · 2.1 AB/B",
        sentences: "reader-sentences.js · 2.1 AB/B"
      },
      wordPool: words,
      sentencePool: sentences,
      heroPath: {
        lessonSets: [
          {
            setId: "learn",
            number: 1,
            title: "Learn",
            icon: "✨",
            color: "#534AB7",
            description: "Meet the welded sounds and build accurate first reads.",
            xpReward: 35,
            activities: [
              { id: "2.1-learn-sounds", title: "Sounds Quick Drill", icon: "🎤", type: "external-sounds", rounds: 1, xpReward: 20 },
              { id: "2.1-learn-blend", title: "Blend the Weld", icon: "🔗", type: "decode-choice", patterns: ["ang", "ing", "ong", "ung"], rounds: 5, xpReward: 15 },
              { id: "2.1-learn-read", title: "Word Reading", icon: "👀", type: "rapid-decode", patterns: ["ang", "ing", "ong", "ung"], rounds: 5, xpReward: 15 }
            ]
          },
          {
            setId: "practice",
            number: 2,
            title: "Practice",
            icon: "⚡",
            color: "#185FA5",
            description: "Mix -ng and -nk words in short, repeatable rounds.",
            xpReward: 45,
            activities: [
              { id: "2.1-practice-sound", title: "Sound Sprint", icon: "🔊", type: "decode-choice", rounds: 6, xpReward: 18 },
              { id: "2.1-practice-blend", title: "Blending Practice", icon: "🧩", type: "rapid-decode", rounds: 6, xpReward: 18 },
              { id: "2.1-practice-read", title: "Word Reading", icon: "📚", type: "decode-choice", rounds: 6, xpReward: 18 },
              { id: "2.1-practice-build", title: "Syllable Scoop Build", icon: "🛠️", type: "tile-build", rounds: 5, xpReward: 20 }
            ]
          },
          {
            setId: "apply",
            number: 3,
            title: "Apply",
            icon: "🚀",
            color: "#1D9E75",
            description: "Use welded sounds in spelling and connected text.",
            xpReward: 55,
            activities: [
              { id: "2.1-apply-review", title: "Sound Review", icon: "🎧", type: "decode-choice", rounds: 6, xpReward: 18 },
              { id: "2.1-apply-read", title: "Word Reading", icon: "🪄", type: "rapid-decode", rounds: 6, xpReward: 18 },
              { id: "2.1-apply-dictation", title: "Dictation Practice", icon: "⌨️", type: "encoding-type", rounds: 5, hints: true, xpReward: 22 },
              { id: "2.1-apply-sentence", title: "Sentence Practice", icon: "💬", type: "sentence-read", rounds: 4, xpReward: 20 }
            ]
          },
          {
            setId: "mastery",
            number: 4,
            title: "Mastery Challenge",
            icon: "👑",
            color: "#BA7517",
            description: "Show accuracy first, then add speed to defeat the boss.",
            xpReward: 80,
            activities: [
              { id: "2.1-mastery-mixed", title: "Mixed Review", icon: "🔀", type: "mastery-mixed", rounds: 8, passingAccuracy: .85, xpReward: 25 },
              { id: "2.1-mastery-fluency", title: "Fluency Challenge", icon: "⏱️", type: "rapid-decode", rounds: 8, timed: true, passingAccuracy: .85, xpReward: 25 },
              { id: "2.1-mastery-dictation", title: "Dictation Challenge", icon: "✍️", type: "encoding-type", rounds: 6, hints: false, passingAccuracy: .85, xpReward: 30 },
              { id: "2.1-mastery-boss", title: "Welded Sound Boss", icon: "🐲", type: "mastery-mixed", rounds: 10, boss: true, passingAccuracy: .9, xpReward: 50 }
            ]
          }
        ]
      },
      drillPath: {
        title: "Power-Up Loop",
        description: "Adaptive decoding and encoding practice that stays at your level.",
        roundSize: 6,
        practicePools: {
          decoding: words.map((item) => item.word),
          encoding: words.map((item) => item.word),
          sentences
        },
        adaptiveRules: [
          { maxAccuracy: 0.69, level: 1, label: "Accuracy Builder", decodingType: "decode-choice", encodingType: "tile-build", hints: true },
          { maxAccuracy: 0.84, level: 2, label: "Review Loop", decodingType: "decode-choice", encodingType: "encoding-type", hints: true },
          { maxAccuracy: 0.89, level: 3, label: "Speed Builder", decodingType: "rapid-decode", encodingType: "encoding-type", hints: false },
          { maxAccuracy: 1, level: 4, label: "Automaticity Run", decodingType: "rapid-decode", encodingType: "encoding-type", hints: false, timed: true }
        ]
      }
    };
  }

  // Add future sub-steps here. The player and progress engine should not need new screens.
  const curriculum = { "2.1": buildStep21() };

  window.TTStudentLessonData = {
    version: 1,
    getSubstep(substepId) { return curriculum[String(substepId)] || null; },
    listSubsteps() { return Object.values(curriculum); },
    graphemesFor,
    patternFor
  };
})();
