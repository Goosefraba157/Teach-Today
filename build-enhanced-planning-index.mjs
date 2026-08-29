#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(process.argv[2] || "/Users/macg/Documents/Dyslexia App");
const outputPath = path.join(projectRoot, "enhanced-planning-index.js");
const wordBankRoot = path.join(sourceRoot, "word_banks", "readers");
const readerSentenceRoot = path.join(sourceRoot, "indexes", "reader-sentences");
const dictationSentencePath = path.join(
  sourceRoot,
  "indexes",
  "part8-dictation-sentences",
  "part8-dictation-sentence-index.json"
);

const compactText = (value) => String(value || "").trim();
const unique = (values) => [...new Set((values || []).map(compactText).filter(Boolean))];
const compareSubsteps = (left, right) => {
  const a = String(left).split(".").map(Number);
  const b = String(right).split(".").map(Number);
  return (a[0] - b[0]) || (a[1] - b[1]);
};

function walkFiles(root, filename) {
  const results = [];
  const visit = (folder) => {
    fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.name === filename) results.push(fullPath);
    });
  };
  visit(root);
  return results.sort();
}

function compactWordMetadata(categories = {}) {
  const previous = unique([
    ...(categories.seen_in_previous_indexed_substeps || []),
    ...(categories.base_word_seen_in_previous_indexed_substeps || [])
  ]).sort(compareSubsteps);
  const metadata = {
    b: compactText(categories.base_word),
    p: unique(categories.prefixes),
    s: unique(categories.suffixes),
    v: unique(categories.vowel_letters_for_teaching),
    d: unique([...(categories.digraphs || []), ...(categories.trigraphs || [])]),
    g: unique(categories.glued_sounds),
    k: unique([...(categories.consonant_blends_2 || []), ...(categories.consonant_blends_3 || [])]),
    e: unique(categories.closed_syllable_exceptions),
    y: unique(categories.whole_word_syllables),
    l: unique(categories.latin_bases),
    r: previous,
    c: Number(categories.syllable_count || 0) || undefined,
    f: compactText(categories.first_indexed_substep)
  };
  Object.keys(metadata).forEach((key) => {
    const value = metadata[key];
    if (value === "" || value === undefined || (Array.isArray(value) && !value.length)) delete metadata[key];
  });
  return metadata;
}

const pages = {};
const words = {};
const substeps = [];

walkFiles(wordBankRoot, "word_bank.json").forEach((filePath) => {
  const bank = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const substep = compactText(bank.substep);
  if (!substep || compareSubsteps(substep, "1.3") < 0 || compareSubsteps(substep, "7.5") > 0) return;
  substeps.push(substep);
  words[substep] ||= {};
  (bank.pages || []).forEach((page) => {
    const level = compactText(page.level_label || page.level || "AB").toUpperCase();
    const readerPage = Number(page.reader_page || 0);
    if (!readerPage) return;
    const pageWords = [];
    (page.word_occurrences || []).forEach((occurrence) => {
      const word = compactText(occurrence.word).toLowerCase();
      if (!word) return;
      pageWords.push(word);
      if (!words[substep][word]) words[substep][word] = compactWordMetadata(occurrence.categories || {});
    });
    pages[`${substep}|${level}|${readerPage}`] = {
      s: substep,
      l: level,
      p: readerPage,
      n: Boolean(page.is_nonsense),
      c: unique(page.page_concept_labels),
      w: pageWords
    };
  });
});

const sentenceRecommendations = {};
for (let step = 1; step <= 7; step += 1) {
  const filePath = path.join(readerSentenceRoot, `reader-sentence-pages-step${step}.json`);
  const index = JSON.parse(fs.readFileSync(filePath, "utf8"));
  Object.entries(index.chartingRecommendations || {}).forEach(([key, recommendation]) => {
    if (!recommendation?.sentenceReaderPage) return;
    sentenceRecommendations[key] = {
      p: Number(recommendation.sentenceReaderPage),
      l: compactText(recommendation.sentenceLevel || "AB").toUpperCase(),
      m: unique(recommendation.matchedWords),
      r: compactText(recommendation.reason)
    };
  });
}

const dictationSource = JSON.parse(fs.readFileSync(dictationSentencePath, "utf8"));
const sentenceById = new Map((dictationSource.sentences || []).map((sentence) => [sentence.id, sentence]));
const dictationRecommendations = {};
Object.entries(dictationSource.indexes?.byChartingPage || {}).forEach(([key, matches]) => {
  const selected = (matches || []).slice(0, 6).map((match) => {
    const sentence = sentenceById.get(match.sentenceId);
    if (!sentence?.text) return null;
    return {
      t: compactText(sentence.text),
      h: unique(match.hfw || sentence.currentHfwMatches),
      m: unique(match.matchedWords || sentence.highestChartedWords),
      q: Number(match.score || 0)
    };
  }).filter(Boolean);
  if (selected.length) dictationRecommendations[key] = selected;
});

const orderedSubsteps = unique(substeps).sort(compareSubsteps);
const output = {
  schemaVersion: "teach-today-enhanced-planning-v1",
  coverage: {
    firstSubstep: orderedSubsteps[0],
    lastSubstep: orderedSubsteps.at(-1),
    substeps: orderedSubsteps
  },
  pages,
  words,
  sentenceRecommendations,
  dictationRecommendations,
  stats: {
    substeps: orderedSubsteps.length,
    chartingPages: Object.keys(pages).length,
    indexedWords: Object.values(words).reduce((sum, bank) => sum + Object.keys(bank).length, 0),
    sentenceRecommendations: Object.keys(sentenceRecommendations).length,
    dictationPageRecommendations: Object.keys(dictationRecommendations).length
  }
};

const banner = [
  "// Auto-generated compact planning index for Teach Today.",
  "// Source: reviewed local Reader/Dictation indexes. Contains curriculum metadata only; no student data.",
  "// Regenerate with: node build-enhanced-planning-index.mjs [source-app-root]",
  `window.teachTodayEnhancedPlanningIndex=${JSON.stringify(output)};`,
  ""
].join("\n");

fs.writeFileSync(outputPath, banner, "utf8");
console.log(JSON.stringify({ outputPath, bytes: Buffer.byteLength(banner), ...output.stats }, null, 2));
