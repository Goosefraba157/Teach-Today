/* Shared, data-only 4.2 scenes and student-safe rendering for browser and native Stage. */
(function (root) {
  "use strict";
  const part = (text, type = "base", keyword = "") => ({ text, type, keyword });
  const scenes = [];
  function add(id, layout, headline, subhead, items, cue, extra = {}) {
    scenes.push({ id, layout, kicker: "Discovery 4.2", headline, subhead, items, cue, ...extra });
  }
  add("review-question", "parts", "What do you remember?", "Read each syllable. Explain the vowel sound.",
    [part("sun", "closed"), part("rise", "v-e")], "Review closed and v-e syllables from 4.1. Wait for the short/long vowel explanation. There are no new letter-sounds in 4.2.");
  add("review-answer", "marked", "Two familiar syllable types", "A closed syllable has a short vowel. In v-e, the first vowel is long and final e is silent.",
    [part("sun", "closed"), part("rise", "v-e")], "Read sun, then rise. Review breve, macron, silent-e slash, scoop and syllable labels.");
  add("compound-question", "joined", "What happens when we join them?", "Read the whole word. How do the two words help explain its meaning?",
    [part("sun", "closed"), part("rise", "v-e")], "Students scoop and read sunrise. Ask why it is a compound word before revealing the explanation.");
  add("compound-answer", "marked", "Two words make one compound word", "sun + rise = sunrise", [part("sun", "closed"), part("rise", "v-e")],
    "Both sun and rise are independent words and contribute to sunrise's meaning. Name the two syllable types.");
  for (const [word, a, b, first, second] of [["classmate", "class", "mate", "closed", "v-e"], ["baseball", "base", "ball", "v-e", "closed"], ["sunshine", "sun", "shine", "closed", "v-e"]]) {
    const items = [part(a, first), part(b, second)];
    add(`${word}-question`, "word", "Find the two words", "Read it. Where would you scoop? Which syllable is v-e?", [part(word)],
      "Have students identify the two meaningful words, scoop, read, and explain the meaning. In ball, review the taught /all/ welded sound rather than forcing a short-a pronunciation.");
    add(`${word}-answer`, "marked", "Check the syllables", `${a} + ${b} = ${word}`, items, "Read each part and then the whole word. A v-e syllable may come first or second.");
  }
  add("safe-base", "letters", "Read the base word", "What syllable type is safe?", [part("safe", "v-e")], "Read safe first. Identify the long a and silent e.");
  add("unsafe-question", "elements", "What did the prefix change?", "Find the base word and the prefix. Explain the new meaning.", [part("un-", "prefix"), part("safe")],
    "Wait for the student to identify safe and un-. Then scoop and read unsafe.");
  add("unsafe-answer", "marked", "un- means not", "unsafe means not safe. The base word stays safe.", [part("un", "closed"), part("safe", "v-e")],
    "Distinguish two syllables from two word elements. Removing un- leaves a complete word: safe.");
  add("prefix-practice", "word", "Find the prefix and base word", "Read each word. Explain how the prefix changes its meaning.", [part("misuse"), part("dislike"), part("midline")],
    "Students identify mis- + use, dis- + like, mid- + line. Each word has two syllables and two word elements. Review the already taught prefix meanings.");
  add("fore-question", "elements", "Meet a new prefix", "Read fore-. What might forecast mean?", [part("fore-", "prefix"), part("cast")],
    "Show and read fore-. Explain that this new prefix means before, then discuss predicting something before it happens.");
  add("fore-answer", "elements", "fore- means before", "fore- + cast = forecast", [part("fore-", "prefix"), part("cast")],
    "Read forecast. Explain the meaning in a familiar weather context. Treat fore- as the taught prefix; do not require a regular long-o pronunciation.");
  add("fore-practice", "word", "Read and explain", "What does fore- contribute to each word?", [part("foretold"), part("foreleg")],
    "Foretold: told before something happened. Foreleg: a front leg, before the back legs. Identify the prefix and base word.");
  add("entire-question", "letters", "Does every long word have two smaller words?", "Read this word. Look for the vowel patterns.", [part("entire")],
    "Model entire without inventing a prefix or compound. Ask whether it needs to be divided: the vowels are separated.");
  add("entire-divide", "parts", "Keep the v-e pattern together", "Divide between n and t. Do not split i–r–e.", [part("en", "closed"), part("tire", "v-e")],
    "There are two consonants between the first two vowels. Separate en and tire; the v-e pattern remains intact. Scoop and read each syllable, then entire.");
  add("entire-answer", "marked", "Syllables help us read the whole word", "en / tire → entire", [part("en", "closed"), part("tire", "v-e")],
    "Name C and V-e. These syllable chunks are not two meaning-bearing words in entire. Briefly discuss whole or all of something.");
  for (const [word, a, b] of [["escape", "es", "cape"], ["volume", "vol", "ume"], ["invite", "in", "vite"]]) {
    add(`${word}-question`, "word", "Try it: find the syllables", "Keep v-e together. Scoop, read each syllable, then blend.", [part(word)],
      "Allow student analysis before advancing. These are not compound words. Use syllable analysis without assigning untaught word elements.");
    add(`${word}-answer`, "marked", "Check your division", `${a} / ${b} → ${word}`, [part(a, "closed"), part(b, "v-e")],
      "Read the word and discuss its meaning. In escape, keep the /sk/ blend fluent when blending the whole word.");
  }
  add("mark-question", "word", "Your turn to mark", "Scoop the syllables. Label C and V-e. Mark the vowels.", [part("sunrise"), part("escape")],
    "Use the existing presentation pen or board. Ask students to explain every mark before showing the model.");
  add("mark-answer", "marked", "Check one word at a time", "sunrise: C + V-e. escape: C + V-e.", [part("sun", "closed"), part("rise", "v-e"), part("es", "closed"), part("cape", "v-e")],
    "The first pair forms sunrise; the second forms escape. Model a separate scoop for each syllable, breve for the short vowel, macron and silent-e slash for v-e.");
  add("element-marking", "elements", "A different job: mark word elements", "Find the meaningful parts instead of labeling syllables.", [part("sun", "compound"), part("rise", "compound"), part("fore-", "prefix"), part("cast")],
    "Use ink to mark compound elements in sunrise and circle fore- in forecast, following the student's notebook conventions. Syllable marking and word-element marking answer different questions.");
  add("notebook-elements", "notebook", "Add to your notebook", "Word Elements", [part("fore- = before", "note", "Prefixes · page 36"), part("baseball · sunshine", "note", "Compound Words · page 85")],
    "The supplied manual's handwritten notebook references identify pages 36 and 85. Locate the named sections if the student's edition differs.");
  add("notebook-syllables", "notebook", "Save the longer-word pattern", "Vowel-Consonant-e Syllable · page 11", [part("invite · concrete · reptile", "note", "Example words"), part("ex / treme", "note", "Mark extreme: C + V-e")],
    "Add the manual's three examples to the middle of the v-e page. At the bottom, practice marking extreme with scoops, C/V-e, breve, macron and silent-e slash.");
  add("spell-bridge", "routine", "Now use syllables to spell", "Repeat → name each syllable → spell one at a time → read back", [part("1", "note", "Repeat the whole word"), part("2", "note", "Touch and name each syllable"), part("3", "note", "Name and spell each syllable"), part("4", "note", "Scoop and read the whole word")],
    "Section 7 starts here. Review three or four previous-substep words first as needed. Use face-down cards; check each syllable after the student spells it. Do not reveal the next card early.");
  for (const [word, a, b, prefix] of [["sunshine", "sun", "shine", false], ["misname", "mis", "name", true], ["forecast", "fore", "cast", true]]) {
    const cardType = prefix ? "prefix" : "base";
    add(`spell-${word}-hidden`, "spell", "Listen. Repeat. Name the syllables.", "Touch each face-down card. Spell the first syllable.", [part("?", cardType), part("?", "base")],
      `Dictate ${word} without showing the spelling. ${prefix ? "The first yellow card represents the prefix." : "Use two white syllable cards."} Students name both syllables, then name and spell the first.`, { kicker: "Spelling 4.2" });
    add(`spell-${word}-first`, "spell", "Check the first syllable", "Now name and spell the next syllable.", [part(prefix ? `${a}-` : a, cardType), part("?", "base")],
      `Reveal ${a} only after it is spelled. Keep ${b} hidden until the student names and spells it.`, { kicker: "Spelling 4.2" });
    add(`spell-${word}-answer`, "spell", "Check. Scoop. Read it back.", word, [part(prefix ? `${a}-` : a, cardType), part(b)],
      `Reveal ${b}; student reads ${word} while scooping. ${word === "misname" ? "Practice misuse, dislike and midline as time permits." : word === "forecast" ? "Dictate fore- separately: student repeats, spells f-o-r-e and traces the prefix dash. Optional practice: foretold, foremost." : "Optional compound spelling: baseball, classmate, campfire and flagpole."}`, { kicker: "Spelling 4.2" });
  }
  add("suffix-question", "elements", "What do we spell before the suffix?", "Read the base word first. Then read the whole word.", [part("dis-", "prefix"), part("like"), part("-s", "suffix")],
    "Read dislike, then dislikes. Before spelling, students name and spell the word without its suffix, then add -s. No vowel-suffix spelling changes are introduced here.");
  add("finish", "word", "Show what you discovered", "Read. Explain the parts. Scoop. Spell one syllable at a time.", [part("classmate"), part("unsafe"), part("escape")],
    "Check a compound, prefix + base, and a noncompound syllable word. Continue ordinary Sections 3–8 using only taught word types. Complex Latin-base words such as conclude and compose belong in subsequent lessons, not this introduction. Do not infer mastery or save assessment results from advancing slides.");

  function esc(value) { return String(value || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function letters(text, kind, marked) {
    const chunks = text.match(/qu|ch|ck|ph|sh|th|wh|./g) || [];
    const first = chunks.findIndex(c => /^[aeiou]$/.test(c));
    return `<div class="intro-42-letters">${chunks.map((c, i) => `<span class="intro-42-letter ${/^[aeiou]$/.test(c) ? "vowel" : "consonant"} ${marked && i === first && text !== "ball" ? kind === "v-e" ? "macron" : "breve" : ""} ${marked && kind === "v-e" && i === chunks.length - 1 ? "silent-slash" : ""}">${esc(c)}</span>`).join("")}</div>`;
  }
  function render(scene) {
    const items = scene.items || [];
    const layout = scene.layout;
    if (["notebook", "routine"].includes(layout)) return `<div class="intro-42-notes">${items.map(i => `<article><strong>${esc(i.text)}</strong><p>${esc(i.keyword)}</p></article>`).join("")}</div>`;
    if (layout === "word") return `<div class="intro-42-words">${items.map(i => `<strong>${esc(i.text)}</strong>`).join("")}</div>`;
    if (layout === "letters") return `<div class="intro-42-parts">${items.map(i => letters(i.text, i.type, false)).join("")}</div>`;
    const marked = layout === "marked";
    return `<div class="intro-42-parts ${marked ? "marked" : ""} ${layout === "joined" ? "joined" : ""}">${items.map(i => `<div class="intro-42-part">${["parts", "joined", "marked"].includes(layout) ? letters(i.text, i.type, marked) : `<span class="intro-42-element ${esc(i.type)} ${i.text === "?" ? "face-down" : ""}" aria-label="${i.text === "?" ? "Face-down card" : esc(i.text)}">${esc(i.text)}</span>`}${marked ? `<div class="intro-42-scoop"><b>${i.type === "v-e" ? "V-e" : "C"}</b></div>` : ""}</div>`).join("")}</div>`;
  }
  // Keep each teaching visit brief; Section 7 is a separate spelling visit.
  add("compound-notebook", "notebook", "Keep an example", "Compound Words · page 85", [part("baseball · sunshine", "note", "Two words contribute to one meaning")], "Add the manual's examples to the Compound Words page. Reader 4 page 50 is the first compound charting page; A page 55 and B pages 58–59 extend it.");
  add("prefix-notebook", "notebook", "Save the new prefix", "Prefixes · page 36", [part("fore-", "note", "before"), part("forecast", "note", "A prediction made before an event")], "Add fore- beside its meaning. There is no dedicated fore- charting page in the supplied 4.2 Reader pages; use this as a short bridge after prefix + base page 51.");
  add("prefix-check", "word", "Find the prefix. Read the base. Read the whole word.", "Which syllable is closed? Which is v-e?", [part("unsafe"), part("misuse"), part("midline")], "Use a quick oral check. Return to ordinary Section 2. Reader 4 page 51 matches prefix + base word practice.");
  add("compound-check", "word", "Two words. Two syllables. One meaning.", "Find the compound parts. Identify C and V-e.", [part("classmate"), part("sunshine")], "Ask for one explanation and one scoop/read. Return to ordinary Section 2. Reader 4 page 50 is the matching introductory compound chart; do not change the selected scored half.");
  add("fore-check", "word", "What does fore- mean?", "Read each word and explain its meaning.", [part("forecast"), part("foretold")], "A short check, then return to the lesson. Do not invent a dedicated fore- charting page or treat this practice as a scored chart.");
  add("division-check", "word", "Find the syllables without a compound or prefix", "Keep v-e together. Scoop and read.", [part("reptile"), part("extreme")], "Check rep/tile and ex/treme. Reader 4 page 52 mixes these words with later complex bases: select only taught word types for practice; do not treat the entire page as ready before teaching those bases.");
  add("complex-question", "elements", "Does the part left behind stand alone?", "Read unsafe. Then read conclude. Try removing each prefix.", [part("un-", "prefix"), part("safe"), part("con-", "prefix"), part("-clude-", "base")], "Subsequent lesson only: safe is a word; -clude- is not a word by itself. The prefix plus Latin base together make the complex base word conclude.");
  add("complex-answer", "elements", "A prefix can be part of a base word", "con- + -clude- → conclude", [part("con-", "prefix"), part("-clude-", "base")], "Name the prefix and Latin-base element. Conclude is the whole complex base word. Also scoop con/clude and identify C/V-e.");
  add("complex-build", "elements", "Build another complex base word", "Read each element. Scoop and read the whole word.", [part("com-", "prefix"), part("-pose-", "base")], "Read compose. Explain its meaning with an accessible example, such as composing a tune. Use previously taught prefixes and introduce the required v-e Latin base before practice.");
  add("complex-practice", "word", "Find the prefix and Latin base", "Read the whole word. Explain a meaning you know.", [part("compute"), part("confuse"), part("include")], "Analyze com- + -pute-, con- + -fuse-, in- + -clude-. Teach or review each element explicitly. These words appear on mixed Reader 4 page 52; there is no separate AB complex-base list.");
  add("complex-suffix", "elements", "How many word elements now?", "Read the base word include first. Then read includes.", [part("in-", "prefix"), part("-clude-", "base"), part("-s", "suffix")], "Reveal three elements: prefix, Latin-base element, suffix. Underline include as the complete base word and circle -s with ink. Syllable and word-element marking remain separate tasks.");
  add("complex-check", "word", "Explain the structure", "Which part is a prefix? Which is a Latin base?", [part("conclude"), part("compose")], "Use page 52 only after the selected bases have been taught. Pages 53–54 add suffixes; do not advance merely because the slideshow ended.");
  for (const [word, a, b, prefix] of [["escape", "es", "cape", false], ["include", "in-", "-clude-", true]]) {
    add(`spell-${word}-hidden`, "spell", "Listen. Repeat. Name the syllables.", "Spell one syllable at a time. Keep the second card hidden.", [part("?", prefix ? "prefix" : "base"), part("?")], `Dictate ${word}. ${prefix ? "Tell the student this is a complex base word. Use prefix and Latin-base cards under two blank syllable cards." : "Use two face-down white syllable cards."} Touch and name the syllables before spelling.`, { kicker: "Spelling 4.2" });
    add(`spell-${word}-first`, "spell", "Check the first syllable", "Now name and spell the next syllable.", [part(a, prefix ? "prefix" : "base"), part("?")], "Reveal only the first card after it is spelled; retain the next face-down card.", { kicker: "Spelling 4.2" });
    add(`spell-${word}-answer`, "spell", "Check. Scoop. Read the whole word.", word, [part(a, prefix ? "prefix" : "base"), part(b)], `Read back ${word}. ${prefix ? "Other later spelling examples: consume, confuse, expose and compute. Identify a complex base before dictating it." : "Additional noncompound practice: reptile and invite."}`, { kicker: "Spelling 4.2" });
  }
  const byId = new Map(scenes.map(s => [s.id, s]));
  const pick = ids => ids.map(id => { if (!byId.has(id)) throw new Error(`Unknown 4.2 scene: ${id}`); return byId.get(id); });
  const dictationChoices = {
    sunshine: "sunshine, baseball, classmate, campfire, flagpole",
    misname: "misname, misuse, dislike, midline, unsafe",
    forecast: "forecast, foretold, foremost",
    escape: "escape, reptile, invite",
    include: "include, consume, confuse, expose, compute"
  };
  const spelling = (word, extra = []) => {
    const selected = pick(["spell-bridge", `spell-${word}-hidden`, `spell-${word}-first`, `spell-${word}-answer`, ...extra]);
    return selected.map((scene, index) => index === 0 ? {
      ...scene,
      cue: `Dictation choices: ${dictationChoices[word]}. Choose a few. Repeat the word; name both syllables; spell one at a time; scoop and read back.`
    } : scene);
  };
  const lessons = {
    compounds: { title: "Compound Words", label: "1 · Compound words · Reader 4 p.50", reading: pick(["review-question", "compound-question", "compound-answer", "classmate-question", "classmate-answer", "baseball-question", "baseball-answer", "compound-notebook", "compound-check"]), spelling: spelling("sunshine") },
    prefixes: { title: "Prefix + Base Word", label: "2 · Prefix + base · Reader 4 p.51", reading: pick(["safe-base", "unsafe-question", "unsafe-answer", "prefix-practice", "prefix-check"]), spelling: spelling("misname", ["suffix-question"]) },
    fore: { title: "The Prefix fore-", label: "3 · fore- · bridge after p.51", reading: pick(["fore-question", "fore-answer", "fore-practice", "prefix-notebook", "fore-check"]), spelling: spelling("forecast") },
    division: { title: "Keep V-e Together", label: "4 · Divide syllables · p.52 selections", reading: pick(["entire-question", "entire-divide", "entire-answer", "escape-question", "escape-answer", "volume-question", "volume-answer", "notebook-syllables", "division-check"]), spelling: spelling("escape") },
    complex: { title: "Complex Base Words", label: "5 · Complex bases · subsequent lesson · p.52", reading: pick(["complex-question", "complex-answer", "complex-build", "complex-practice", "complex-suffix", "complex-check"]), spelling: spelling("include") }
  };
  function getScenes(key = "compounds", forSpelling = false) {
    const lesson = lessons[key] || lessons.compounds;
    return forSpelling ? lesson.spelling : lesson.reading;
  }
  const api = { scenes: [...new Set(Object.values(lessons).flatMap(l => [...l.reading, ...l.spelling]))], lessons, getScenes, render };

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TTIntro42 = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
