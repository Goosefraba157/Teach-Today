import fs from "node:fs/promises";
import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
} from "@oai/artifact-tool";

const W = 1920;
const H = 1080;
const OUT = "output/wilson-7-1-sections-1-5-decoding.pptx";
const PREVIEW_DIR = "scratch/previews";

const C = {
  paper: "#FFFCF2",
  ink: "#263238",
  muted: "#607274",
  line: "#D8D2BF",
  teal: "#006D77",
  blue: "#4667A4",
  coral: "#E76F51",
  gold: "#F2C14E",
  violet: "#7C5FB3",
  green: "#2A9D8F",
  cream: "#FFF6DA",
  softTeal: "#E5F6F2",
  softBlue: "#E9F0FF",
  softCoral: "#FFE9DF",
  softViolet: "#F0EAFE",
  white: "#FFFFFF",
};

const F = {
  display: "Aptos Display",
  body: "Aptos",
  mono: "Aptos Mono",
};

const S = {
  title: { fontFamily: F.display, fontSize: 50, bold: true, color: C.ink },
  subtitle: { fontFamily: F.body, fontSize: 25, color: C.muted },
  body: { fontFamily: F.body, fontSize: 28, color: C.ink },
  small: { fontFamily: F.body, fontSize: 18, color: C.muted },
  label: { fontFamily: F.body, fontSize: 20, bold: true, color: C.ink },
  word: { fontFamily: F.display, fontSize: 39, bold: true, color: C.ink, textAlign: "center" },
  sound: { fontFamily: F.body, fontSize: 22, bold: true, color: C.white, textAlign: "center" },
};

function add(slide, node) {
  slide.compose(node, {
    frame: { left: 0, top: 0, width: W, height: H },
    baseUnit: 8,
  });
}

function bg(children, accent = C.teal) {
  return layers({ width: fill, height: fill }, [
    shape({ width: fill, height: fill, fill: C.paper, line: { color: C.paper } }),
    shape({ width: fill, height: fixed(18), fill: accent, line: { color: accent } }),
    ...children,
  ]);
}

function footer(section = "Sections 1-5 • Decoding") {
  return row({ width: fill, height: hug, justify: "between", align: "center" }, [
    text(`Wilson 7.1 Intro • ${section}`, { width: wrap(900), height: hug, style: S.small }),
    text("Notice → Mark → Read", {
      width: hug,
      height: hug,
      style: { ...S.small, bold: true, color: C.teal },
    }),
  ]);
}

function root(title, subtitle, body, accent = C.teal, section = "Sections 1-5 • Decoding") {
  return bg(
    [
      column(
        {
          name: "slide-root",
          width: fill,
          height: fill,
          padding: { x: 84, y: 64 },
          gap: 26,
        },
        [
          column({ width: fill, height: hug, gap: 8 }, [
            text(title, { name: "slide-title", width: fill, height: hug, style: S.title }),
            subtitle ? text(subtitle, { width: fill, height: hug, style: S.subtitle }) : null,
          ].filter(Boolean)),
          body,
          footer(section),
        ],
      ),
    ],
    accent,
  );
}

function badge(label, color = C.teal, width = 130) {
  return panel(
    {
      width: fixed(width),
      height: fixed(44),
      fill: color,
      borderRadius: 22,
      justify: "center",
      align: "center",
    },
    text(label, { width: fill, height: hug, style: S.sound }),
  );
}

function sectionBadge(n, color = C.teal) {
  return panel(
    {
      width: fixed(78),
      height: fixed(78),
      fill: color,
      borderRadius: 39,
      justify: "center",
      align: "center",
    },
    text(String(n), { width: fill, height: hug, style: { ...S.sound, fontSize: 33 } }),
  );
}

function wordCard(word, note = "", fillColor = C.white) {
  return panel(
    {
      width: fill,
      height: fixed(100),
      fill: fillColor,
      line: { color: C.line, weight: 2 },
      borderRadius: 8,
      padding: { x: 18, y: 12 },
      justify: "center",
      align: "center",
    },
    column({ width: fill, height: hug, gap: 2, align: "center" }, [
      note
        ? text(note, {
            width: fill,
            height: hug,
            style: { ...S.small, fontSize: 14, bold: true, color: C.teal, textAlign: "center" },
          })
        : null,
      text(word, { width: fill, height: hug, style: S.word }),
    ].filter(Boolean)),
  );
}

function step(n, title, detail, color = C.teal) {
  return row({ width: fill, height: hug, gap: 18, align: "center" }, [
    sectionBadge(n, color),
    column({ width: fill, height: hug, gap: 3 }, [
      text(title, { width: fill, height: hug, style: { ...S.body, bold: true } }),
      text(detail, { width: fill, height: hug, style: { ...S.subtitle, fontSize: 23 } }),
    ]),
  ]);
}

function prompt(q, a, color = C.gold) {
  return column({ width: fill, height: hug, gap: 8 }, [
    text(q, { width: fill, height: hug, style: { ...S.body, fontSize: 26, bold: true } }),
    row({ width: fill, height: hug, gap: 12, align: "center" }, [
      badge("ask", color, 92),
      text(a, { width: fill, height: hug, style: { ...S.subtitle, fontSize: 22 } }),
    ]),
  ]);
}

function cardColumn(label, sound, words, color, fillColor) {
  return column({ width: fill, height: fill, gap: 13 }, [
    row({ width: fill, height: hug, gap: 10, align: "center" }, [
      badge(sound, color, 100),
      text(label, { width: fill, height: hug, style: { ...S.label, fontSize: 22 } }),
    ]),
    ...words.map((w) => wordCard(w, "", fillColor)),
  ]);
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });

// New deck scope: 7.1 intro decoding only, Sections/Parts 1-5.
// Excludes subsequent Latin-base lessons, taught-affix extension, nonsense word charting, and spelling Parts 6-8.

{
  const slide = deck.slides.add();
  add(
    slide,
    bg(
      [
        grid(
          { width: fill, height: fill, columns: [fr(1.05), fr(0.95)], columnGap: 66, padding: { x: 92, y: 72 } },
          [
            column({ width: fill, height: fill, justify: "center", gap: 26 }, [
              text("Wilson 7.1 Intro", { width: hug, height: hug, style: { ...S.label, fontSize: 28, color: C.coral } }),
              text("Decoding Sections 1-5", {
                width: wrap(900),
                height: hug,
                style: { ...S.title, fontSize: 88 },
              }),
              text("The student discovers how c and g change when the next letter is e, i, or y.", {
                width: wrap(860),
                height: hug,
                style: { ...S.subtitle, fontSize: 32 },
              }),
            ]),
            column({ width: fill, height: fill, justify: "center", gap: 34, align: "center" }, [
              row({ width: hug, height: hug, gap: 18, align: "center" }, [
                text("c", { width: hug, height: hug, style: { ...S.title, fontSize: 116, color: C.teal } }),
                badge("e i y", C.gold, 116),
                text("/s/", { width: hug, height: hug, style: { ...S.title, fontSize: 78, color: C.coral } }),
              ]),
              row({ width: hug, height: hug, gap: 18, align: "center" }, [
                text("g", { width: hug, height: hug, style: { ...S.title, fontSize: 116, color: C.blue } }),
                badge("e i y", C.gold, 116),
                text("/j/", { width: hug, height: hug, style: { ...S.title, fontSize: 78, color: C.violet } }),
              ]),
              text("Discovery lesson, not a lecture.", {
                width: wrap(620),
                height: hug,
                style: { ...S.subtitle, fontSize: 28, bold: true, color: C.ink, textAlign: "center" },
              }),
            ]),
          ],
        ),
      ],
      C.coral,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Lesson map",
      "Each section has a clear job. Section 2 carries the new learning.",
      grid({ width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 68 }, [
        column({ width: fill, height: fill, justify: "center", gap: 23 }, [
          step(1, "Quick Drill", "Warm up known sound cards; prime c and g for a new job.", C.coral),
          step(2, "Teach Concept", "Discover, mark, scoop, and read c/g before e, i, y.", C.teal),
          step(3, "Word Cards", "Sort current and review words by c/g sound.", C.blue),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 23 }, [
          step(4, "Wordlist Reading", "Practice first; chart first 7.1 AB wordlist page.", C.violet),
          step(5, "Sentence Reading", "Use the first 7.1 AB sentence page for accuracy, phrasing, meaning.", C.green),
          panel(
            { width: fill, height: fixed(126), fill: C.cream, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 24 },
            text("Save subsequent lesson items for later: Latin bases, affixes, nonsense words, and spelling Parts 6-8.", {
              width: fill,
              height: hug,
              style: { ...S.body, fontSize: 25, bold: true, color: C.ink },
            }),
          ),
        ]),
      ]),
      C.teal,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 1: Quick Drill",
      "Purpose: wake up the sound system before the new pattern appears.",
      grid({ width: fill, height: fill, columns: [fr(0.85), fr(1.15)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 28 }, [
          sectionBadge(1, C.coral),
          text("Fast, familiar, confident.", { width: fill, height: hug, style: { ...S.title, fontSize: 54, color: C.coral } }),
          text("Flash known cards and keep the pace brisk. Do not teach the new rule here; just prepare the ear and eye.", {
            width: fill,
            height: hug,
            style: { ...S.body, fontSize: 29 },
          }),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          row({ width: fill, height: hug, gap: 18 }, [badge("c", C.teal, 80), text("known response: /k/", { width: fill, height: hug, style: S.body })]),
          row({ width: fill, height: hug, gap: 18 }, [badge("g", C.blue, 80), text("known response: /g/", { width: fill, height: hug, style: S.body })]),
          rule({ width: fill, stroke: C.line, weight: 2 }),
          text("Set the hook: Today these letters are going to make us look at the next letter.", {
            width: wrap(780),
            height: hug,
            style: { ...S.title, fontSize: 43, color: C.teal },
          }),
        ]),
      ]),
      C.coral,
      "Section 1 • Quick Drill",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 2A: Discover with magic",
      "Build the word with syllable cards. Let the student hear and see the reason.",
      grid({ width: fill, height: fill, columns: [fr(1.05), fr(0.95)], columnGap: 72 }, [
        column({ width: fill, height: fill, justify: "center", gap: 30 }, [
          row({ width: fill, height: hug, gap: 20, align: "center" }, [
            wordCard("mag", "syllable 1", C.white),
            text("+", { width: hug, height: hug, style: { ...S.title, fontSize: 50, color: C.muted } }),
            wordCard("ic", "syllable 2", C.softBlue),
            text("magic", { width: hug, height: hug, style: { ...S.title, fontSize: 64, color: C.blue } }),
          ]),
          text("The g is followed by i, even though the word has more than one syllable.", {
            width: fill,
            height: hug,
            style: { ...S.body, fontSize: 31, bold: true },
          }),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          prompt("What sound does g make in magic?", "Student: /j/.", C.violet),
          prompt("Why?", "Because g is followed by i.", C.teal),
          prompt("Where is the clue?", "Point to the letter after g.", C.gold),
        ]),
      ]),
      C.blue,
      "Section 2 • Teach Concept",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 2B: Mark cent and stage",
      "Now the new response becomes visible.",
      grid({ width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 28, align: "center" }, [
          wordCard("cent", "/s/ over c", C.softCoral),
          row({ width: hug, height: hug, gap: 14, align: "center" }, [badge("c", C.teal, 80), badge("e", C.gold, 80), text("→ /s/", { width: hug, height: hug, style: { ...S.title, fontSize: 58, color: C.coral } })]),
          text("Read it. Mark it. Explain it.", { width: hug, height: hug, style: { ...S.subtitle, fontSize: 28, bold: true } }),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 28, align: "center" }, [
          wordCard("stage", "/j/ over g", C.softBlue),
          row({ width: hug, height: hug, gap: 14, align: "center" }, [badge("g", C.blue, 80), badge("e", C.gold, 80), text("→ /j/", { width: hug, height: hug, style: { ...S.title, fontSize: 58, color: C.violet } })]),
          text("Avoid: Is it hard or soft?", { width: hug, height: hug, style: { ...S.subtitle, fontSize: 28, bold: true, color: C.coral } }),
        ]),
      ]),
      C.violet,
      "Section 2 • Teach Concept",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 2C: Notebook anchor",
      "Add the new responses only after the student has discovered the clue.",
      grid({ width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 62 }, [
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 34 },
          column({ width: fill, height: fill, gap: 20 }, [
            text("Sounds section", { width: fill, height: hug, style: { ...S.label, fontSize: 26, color: C.teal } }),
            text("c: /k/ and /s/ before e, i, or y", { width: fill, height: hug, style: { ...S.body, fontSize: 30 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("g: /g/ and /j/ before e, i, or y", { width: fill, height: hug, style: { ...S.body, fontSize: 30 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Practice marking: cent, stage", { width: fill, height: hug, style: { ...S.subtitle, fontSize: 24 } }),
          ]),
        ),
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 34 },
          column({ width: fill, height: fill, gap: 20 }, [
            text("Jobs of silent e", { width: fill, height: hug, style: { ...S.label, fontSize: 26, color: C.blue } }),
            row({ width: fill, height: hug, gap: 18 }, [wordCard("rice", "c = /s/", C.softCoral), wordCard("page", "g = /j/", C.softBlue)]),
            text("Student says the response, then explains the following-letter clue.", {
              width: fill,
              height: hug,
              style: { ...S.body, fontSize: 28, bold: true },
            }),
          ]),
        ),
      ]),
      C.green,
      "Section 2 • Teach Concept",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 2D: One word can hold both sounds",
      "Build, scoop, read, and identify each c or g.",
      column({ width: fill, height: fill, justify: "center", gap: 36 }, [
        row({ width: fill, height: hug, gap: 24 }, [
          wordCard("cy • cle", "c = /s/ then /k/", C.softCoral),
          wordCard("sug • gest", "g = /g/ then /j/", C.softBlue),
        ]),
        grid({ width: fill, height: hug, columns: [fr(1), fr(1), fr(1)], columnGap: 30 }, [
          prompt("What does c say in cycle?", "First c says /s/ because y follows.", C.coral),
          prompt("What about the second c?", "It says /k/ because e, i, y do not follow.", C.teal),
          prompt("What happens in suggest?", "Both g sounds appear in the same word.", C.violet),
        ]),
      ]),
      C.coral,
      "Section 2 • Teach Concept",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 2E: Apply to longer words",
      "Scoop first. Then mark c and g.",
      column({ width: fill, height: fill, justify: "center", gap: 30 }, [
        row({ width: fill, height: hug, gap: 28 }, [
          panel(
            { width: grow(1), height: fixed(178), fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 26 },
            column({ width: fill, height: fill, justify: "center", gap: 8 }, [
              text("con • cen • trate", { width: fill, height: hug, style: { ...S.word, fontSize: 43 } }),
              text("Find both c sounds. Explain each.", { width: fill, height: hug, style: { ...S.subtitle, textAlign: "center" } }),
            ]),
          ),
          panel(
            { width: grow(1), height: fixed(178), fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 26 },
            column({ width: fill, height: fill, justify: "center", gap: 8 }, [
              text("gi • gan • tic", { width: fill, height: hug, style: { ...S.word, fontSize: 43 } }),
              text("Mark g and c after reading.", { width: fill, height: hug, style: { ...S.subtitle, textAlign: "center" } }),
            ]),
          ),
        ]),
        text("Teacher weave: What sound does the letter make in this word? Why?", {
          width: fill,
          height: hug,
          style: { ...S.title, fontSize: 43, color: C.teal },
        }),
      ]),
      C.teal,
      "Section 2 • Teach Concept",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 3: Word Cards",
      "Use review words for automaticity, then current cards for the new c/g concept.",
      grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1)], columnGap: 24 }, [
        cardColumn("c sound", "c=/k/", ["call", "contact", "volcano"], C.teal, C.softTeal),
        cardColumn("c sound", "c=/s/", ["cent", "civil", "decide"], C.coral, C.softCoral),
        cardColumn("g sound", "g=/g/", ["gum", "grand", "golden"], C.blue, C.softBlue),
        cardColumn("g sound", "g=/j/", ["stage", "digest", "gene"], C.violet, C.softViolet),
      ]),
      C.blue,
      "Section 3 • Word Cards",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 4: Wordlist Reading",
      "Use the first 7.1 AB reader wordlist page for practice and charting.",
      grid({ width: fill, height: fill, columns: [fr(0.98), fr(1.02)], columnGap: 64 }, [
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          step(1, "Practice", "Choose 5-6 words from the first AB wordlist that match today’s concept.", C.coral),
          step(2, "Chart", "Read 15 words aloud from the first AB charting page.", C.violet),
          step(3, "Correct", "Record errors, discuss the clue, and reread accurately.", C.teal),
        ]),
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 28 },
          column({ width: fill, height: fill, gap: 20 }, [
            text("Charting focus", { width: fill, height: hug, style: { ...S.label, fontSize: 28, color: C.violet } }),
            row({ width: fill, height: hug, gap: 14 }, [badge("AB", C.violet, 82), text("first 7.1 wordlist page", { width: fill, height: hug, style: S.body })]),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Start with real words containing c=/s/ and g=/j/; mix hard and soft c/g after the student is steady.", {
              width: fill,
              height: hug,
              style: { ...S.body, fontSize: 28 },
            }),
            text("Do not chart nonsense words yet in the intro lesson.", {
              width: fill,
              height: hug,
              style: { ...S.body, fontSize: 28, bold: true, color: C.coral },
            }),
          ]),
        ),
      ]),
      C.violet,
      "Section 4 • Wordlist Reading",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Section 5: Sentence Reading",
      "Use the first 7.1 AB sentence page to connect decoding to meaning.",
      grid({ width: fill, height: fill, columns: [fr(1.02), fr(0.98)], columnGap: 66 }, [
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 30 },
          column({ width: fill, height: fill, gap: 20 }, [
            text("AB sentence page", { width: fill, height: hug, style: { ...S.label, fontSize: 28, color: C.green } }),
            text("Read silently first, then aloud one sentence at a time.", { width: fill, height: hug, style: { ...S.body, fontSize: 28 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Focus: accurate word reading, phrasing, prosody, and meaning.", { width: fill, height: hug, style: { ...S.body, fontSize: 28 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Weave concept questions into the sentence work.", { width: fill, height: hug, style: { ...S.body, fontSize: 28, bold: true } }),
          ]),
        ),
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          prompt("Before reading", "Review high frequency and untaught words at the top of the page.", C.gold),
          prompt("During reading", "Pencil phrasing when needed; keep meaning alive.", C.green),
          prompt("After reading", "Ask: What sound did c or g make? Why?", C.teal),
        ]),
      ]),
      C.green,
      "Section 5 • Sentence Reading",
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    root(
      "Teacher weave",
      "The strongest question is small and specific.",
      grid({ width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          text("Use these", { width: fill, height: hug, style: { ...S.title, fontSize: 50, color: C.teal } }),
          prompt("What sound does c or g make?", "Student names the sound.", C.teal),
          prompt("What letter follows it?", "Student points to the clue.", C.gold),
          prompt("Why?", "Student explains the rule in context.", C.coral),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          text("Avoid this shortcut", { width: fill, height: hug, style: { ...S.title, fontSize: 50, color: C.coral } }),
          panel(
            { width: fill, height: fixed(120), fill: C.softCoral, line: { color: C.coral, weight: 2 }, borderRadius: 8, padding: 24 },
            text("Is it hard or soft?", { width: fill, height: hug, style: { ...S.body, fontSize: 34, bold: true, color: C.ink } }),
          ),
          text("That label can come later. The intro lesson is about noticing the sound and proving the reason.", {
            width: fill,
            height: hug,
            style: { ...S.body, fontSize: 30 },
          }),
        ]),
      ]),
      C.coral,
      "Sections 1-5 • Weave Questions",
    ),
  );
}

await fs.mkdir("output", { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT);

for (let i = 0; i < deck.slides.count; i += 1) {
  const blob = await deck.export({ slide: deck.slides.getItem(i), format: "png" });
  await fs.writeFile(`${PREVIEW_DIR}/slide-${String(i + 1).padStart(2, "0")}.png`, Buffer.from(await blob.arrayBuffer()));
}

console.log(`saved ${OUT}`);
console.log(`rendered ${deck.slides.count} preview PNGs to ${PREVIEW_DIR}`);
