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
  auto,
} from "@oai/artifact-tool";

const OUT = "output/output.pptx";
const PREVIEW_DIR = "scratch/previews";

const W = 1920;
const H = 1080;

const C = {
  paper: "#FFFCF2",
  ink: "#263238",
  mute: "#5D6D6F",
  teal: "#006D77",
  aqua: "#83C5BE",
  coral: "#E76F51",
  gold: "#F2C14E",
  blue: "#4667A4",
  violet: "#7C5FB3",
  green: "#2A9D8F",
  line: "#D8D2BF",
  white: "#FFFFFF",
  softBlue: "#E9F0FF",
  softCoral: "#FFE9DF",
  softGreen: "#E5F6F2",
  softGold: "#FFF2C8",
};

const F = {
  display: "Aptos Display",
  body: "Aptos",
  mono: "Aptos Mono",
};

const styles = {
  title: { fontFamily: F.display, fontSize: 50, bold: true, color: C.ink },
  subtitle: { fontFamily: F.body, fontSize: 27, color: C.mute },
  body: { fontFamily: F.body, fontSize: 30, color: C.ink },
  small: { fontFamily: F.body, fontSize: 19, color: C.mute },
  label: { fontFamily: F.body, fontSize: 20, bold: true, color: C.ink },
  huge: { fontFamily: F.display, fontSize: 150, bold: true, color: C.ink },
  cardWord: { fontFamily: F.display, fontSize: 38, bold: true, color: C.ink },
  sound: { fontFamily: F.body, fontSize: 24, bold: true, color: C.white },
};

function add(slide, node) {
  slide.compose(node, {
    frame: { left: 0, top: 0, width: W, height: H },
    baseUnit: 8,
  });
}

function bg(children, accent = C.teal) {
  return layers({ name: "stage", width: fill, height: fill }, [
    shape({ name: "paper-bg", width: fill, height: fill, fill: C.paper, line: { color: C.paper } }),
    shape({
      name: "top-accent",
      width: fill,
      height: fixed(20),
      fill: accent,
      line: { color: accent },
    }),
    ...children,
  ]);
}

function footer(label = "Wilson Step 7.1 • user-provided manual excerpt") {
  return row(
    { name: "footer", width: fill, height: hug, justify: "between", align: "center" },
    [
      text(label, { name: "source-rail", width: wrap(900), height: hug, style: styles.small }),
      text("Discover → Name → Use", {
        name: "footer-motto",
        width: hug,
        height: hug,
        style: { ...styles.small, bold: true, color: C.teal },
      }),
    ],
  );
}

function slideRoot(title, subtitle, content, accent = C.teal) {
  return bg(
    [
      column(
        {
          name: "slide-root",
          width: fill,
          height: fill,
          padding: { x: 84, y: 64 },
          gap: 28,
        },
        [
          column({ name: "title-stack", width: fill, height: hug, gap: 10 }, [
            text(title, { name: "slide-title", width: fill, height: hug, style: styles.title }),
            subtitle
              ? text(subtitle, {
                  name: "slide-subtitle",
                  width: fill,
                  height: hug,
                  style: styles.subtitle,
                })
              : null,
          ].filter(Boolean)),
          content,
          footer(),
        ],
      ),
    ],
    accent,
  );
}

function pill(label, color = C.teal, width = 150) {
  return panel(
    {
      name: `pill-${label.replace(/\W+/g, "-")}`,
      width: fixed(width),
      height: fixed(46),
      fill: color,
      borderRadius: 24,
      align: "center",
      justify: "center",
    },
    text(label, {
      name: `pill-text-${label.replace(/\W+/g, "-")}`,
      width: hug,
      height: hug,
      style: { ...styles.sound, fontSize: 20 },
    }),
  );
}

function wordTile(word, color = C.white, tag = "") {
  return panel(
    {
      name: `word-${word}`,
      width: fill,
      height: fixed(94),
      fill: color,
      line: { color: C.line, weight: 2 },
      borderRadius: 8,
      padding: { x: 20, y: 14 },
      justify: "center",
      align: "center",
    },
    column({ width: fill, height: hug, gap: 2, align: "center" }, [
      tag
        ? text(tag, {
            width: fill,
            height: hug,
            style: { ...styles.small, fontSize: 15, bold: true, color: C.teal, textAlign: "center" },
          })
        : null,
      text(word, {
        width: fill,
        height: hug,
        style: { ...styles.cardWord, fontSize: 35, textAlign: "center" },
      }),
    ].filter(Boolean)),
  );
}

function soundColumn(title, sound, words, color) {
  return column({ name: `sound-col-${title}`, width: fill, height: fill, gap: 14 }, [
    row({ width: fill, height: hug, align: "center", gap: 12 }, [
      pill(sound, color, 94),
      text(title, { width: fill, height: hug, style: { ...styles.label, fontSize: 24 } }),
    ]),
    ...words.map((w) => wordTile(w, color + "22")),
  ]);
}

function stepItem(num, title, detail, color) {
  return row({ name: `step-${num}`, width: fill, height: hug, gap: 20, align: "center" }, [
    panel(
      {
        width: fixed(76),
        height: fixed(76),
        fill: color,
        borderRadius: 38,
        align: "center",
        justify: "center",
      },
      text(String(num), { width: hug, height: hug, style: { ...styles.sound, fontSize: 34 } }),
    ),
    column({ width: fill, height: hug, gap: 4 }, [
      text(title, { width: fill, height: hug, style: { ...styles.body, bold: true } }),
      text(detail, { width: fill, height: hug, style: { ...styles.subtitle, fontSize: 24 } }),
    ]),
  ]);
}

function miniPrompt(prompt, answer, color = C.gold) {
  return column({ width: fill, height: hug, gap: 8 }, [
    text(prompt, {
      width: fill,
      height: hug,
      style: { ...styles.body, fontSize: 28, bold: true, color: C.ink },
    }),
    row({ width: fill, height: hug, gap: 12, align: "center" }, [
      pill("listen", color, 120),
      text(answer, { width: fill, height: hug, style: { ...styles.subtitle, fontSize: 24 } }),
    ]),
  ]);
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });

// Orientation notes used to guide the build:
// requestClass: full deck; topic: Wilson Step 7.1 intro lesson; audience: dyslexic learners and teacher.
// contentMaturity: technical/educational; audiencePosture: students/learners; tone: warm, curious, active.
// formatPromise: a discovery lesson deck with word cards, sorts, and teacher prompts rather than manual-copy slides.

{
  const slide = deck.slides.add();
  add(
    slide,
    bg(
      [
        grid(
          {
            name: "cover-root",
            width: fill,
            height: fill,
            columns: [fr(1.1), fr(0.9)],
            columnGap: 60,
            padding: { x: 92, y: 72 },
          },
          [
            column({ width: fill, height: fill, justify: "center", gap: 28 }, [
              text("Step 7.1", {
                name: "cover-eyebrow",
                width: hug,
                height: hug,
                style: { ...styles.label, fontSize: 28, color: C.coral },
              }),
              text("The letter looks ahead", {
                name: "cover-title",
                width: wrap(890),
                height: hug,
                style: { ...styles.title, fontSize: 94 },
              }),
              text("Discovering when c says /s/ and g says /j/", {
                name: "cover-promise",
                width: wrap(820),
                height: hug,
                style: { ...styles.subtitle, fontSize: 34 },
              }),
              text("Intro lesson • April 30, 2026", {
                name: "cover-context",
                width: wrap(620),
                height: hug,
                style: { ...styles.small, fontSize: 22, color: C.mute },
              }),
            ]),
            column({ width: fill, height: fill, justify: "center", align: "center", gap: 26 }, [
              row({ width: fill, height: hug, gap: 28, align: "center", justify: "center" }, [
                text("c", { width: hug, height: hug, style: { ...styles.huge, color: C.teal } }),
                text("+", { width: hug, height: hug, style: { ...styles.huge, fontSize: 72, color: C.mute } }),
                row({ width: hug, height: hug, gap: 14 }, [pill("e", C.gold, 76), pill("i", C.gold, 76), pill("y", C.gold, 76)]),
                text("= /s/", { width: hug, height: hug, style: { ...styles.huge, fontSize: 82, color: C.coral } }),
              ]),
              row({ width: fill, height: hug, gap: 28, align: "center", justify: "center" }, [
                text("g", { width: hug, height: hug, style: { ...styles.huge, color: C.blue } }),
                text("+", { width: hug, height: hug, style: { ...styles.huge, fontSize: 72, color: C.mute } }),
                row({ width: hug, height: hug, gap: 14 }, [pill("e", C.gold, 76), pill("i", C.gold, 76), pill("y", C.gold, 76)]),
                text("= /j/", { width: hug, height: hug, style: { ...styles.huge, fontSize: 82, color: C.violet } }),
              ]),
              text("Students notice the clue before they name the rule.", {
                width: wrap(760),
                height: hug,
                style: { ...styles.subtitle, fontSize: 28, bold: true, color: C.ink },
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
    slideRoot(
      "Lesson map",
      "Today’s flow: students hear it, see it, then explain it.",
      grid({ name: "spine-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 34 }, [
          stepItem(1, "Discover", "Sort, listen, compare. The pattern comes from the words.", C.coral),
          stepItem(2, "Name", "Give the rule only after students can point to the clue.", C.teal),
          stepItem(3, "Use", "Read, mark, spell, and explain the choice back.", C.blue),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          text("Teacher language", {
            width: fill,
            height: hug,
            style: { ...styles.title, fontSize: 44, color: C.violet },
          }),
          miniPrompt("What sound does c or g make?", "Student says the sound, not just a label.", C.violet),
          miniPrompt("What letter comes right after it?", "Student finds e, i, or y as the clue.", C.teal),
          miniPrompt("How do you know?", "Student explains the pattern in their own words.", C.coral),
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
    slideRoot(
      "Auditory discovery: hear the switch",
      "Say each pair. Students tap or signal the sound they hear for c or g.",
      column({ name: "auditory-body", width: fill, height: fill, justify: "center", gap: 40 }, [
        row({ width: fill, height: hug, gap: 28 }, [
          wordTile("cap", C.white, "c = /k/"),
          wordTile("city", C.softCoral, "c = /s/"),
          wordTile("got", C.white, "g = /g/"),
          wordTile("gentle", C.softBlue, "g = /j/"),
        ]),
        row({ width: fill, height: hug, gap: 28 }, [
          wordTile("call", C.white, "c = /k/"),
          wordTile("cent", C.softCoral, "c = /s/"),
          wordTile("gum", C.white, "g = /g/"),
          wordTile("giant", C.softBlue, "g = /j/"),
        ]),
        text("Discovery question: What changed after the letter?", {
          width: wrap(980),
          height: hug,
          style: { ...styles.title, fontSize: 48, color: C.teal },
        }),
      ]),
      C.gold,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Sort the cards",
      "Students read each word, then place it by the sound of c or g.",
      grid({ name: "sort-grid", width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1)], columnGap: 24 }, [
        soundColumn("c sound", "c = /k/", ["call", "contact", "volcano"], C.teal),
        soundColumn("c sound", "c = /s/", ["cent", "civil", "decide"], C.coral),
        soundColumn("g sound", "g = /g/", ["gum", "grand", "golden"], C.blue),
        soundColumn("g sound", "g = /j/", ["stage", "digest", "gene"], C.violet),
      ]),
      C.coral,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Now name the pattern",
      "The next letter is the clue.",
      grid({ name: "rule-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 80 }, [
        column({ width: fill, height: fill, justify: "center", gap: 28, align: "center" }, [
          text("c", { width: hug, height: hug, style: { ...styles.huge, color: C.teal } }),
          row({ width: hug, height: hug, gap: 14 }, [pill("e", C.gold, 86), pill("i", C.gold, 86), pill("y", C.gold, 86)]),
          text("says /s/", { width: hug, height: hug, style: { ...styles.title, fontSize: 58, color: C.coral } }),
          text("city • cent • cycle", { width: hug, height: hug, style: { ...styles.subtitle, fontSize: 26 } }),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 28, align: "center" }, [
          text("g", { width: hug, height: hug, style: { ...styles.huge, color: C.blue } }),
          row({ width: hug, height: hug, gap: 14 }, [pill("e", C.gold, 86), pill("i", C.gold, 86), pill("y", C.gold, 86)]),
          text("says /j/", { width: hug, height: hug, style: { ...styles.title, fontSize: 58, color: C.violet } }),
          text("gentle • magic • gym", { width: hug, height: hug, style: { ...styles.subtitle, fontSize: 26 } }),
        ]),
      ]),
      C.blue,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Mark, scoop, read",
      "Students prove the sound by pointing to the following letter.",
      column({ name: "mark-body", width: fill, height: fill, justify: "center", gap: 34 }, [
        row({ width: fill, height: hug, gap: 24 }, [
          wordTile("cent", C.softCoral, "/s/ above c"),
          wordTile("stage", C.softBlue, "/j/ above g"),
          wordTile("cycle", C.softCoral, "/s/ then /k/"),
          wordTile("suggest", C.softBlue, "/g/ then /j/"),
        ]),
        rule({ width: fill, stroke: C.line, weight: 2 }),
        row({ width: fill, height: hug, gap: 28 }, [
          panel(
            { width: grow(1), height: fixed(160), fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 24 },
            column({ width: fill, height: fill, justify: "center", gap: 10 }, [
              text("con • cen • trate", { width: fill, height: hug, style: { ...styles.cardWord, fontSize: 40 } }),
              text("Find both c sounds. Explain each one.", { width: fill, height: hug, style: styles.subtitle }),
            ]),
          ),
          panel(
            { width: grow(1), height: fixed(160), fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: 24 },
            column({ width: fill, height: fill, justify: "center", gap: 10 }, [
              text("gi • gan • tic", { width: fill, height: hug, style: { ...styles.cardWord, fontSize: 40 } }),
              text("Scoop first, then mark the g and c.", { width: fill, height: hug, style: styles.subtitle }),
            ]),
          ),
        ]),
      ]),
      C.violet,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Notebook anchor: make it portable",
      "The notebook becomes the student’s reference, not the teacher’s rescue rope.",
      grid({ name: "notebook-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 64 }, [
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: { x: 38, y: 34 } },
          column({ width: fill, height: fill, gap: 22 }, [
            text("Consonants page", { width: fill, height: hug, style: { ...styles.label, fontSize: 26, color: C.coral } }),
            text("c = /k/ and /s/ before e, i, or y", { width: fill, height: hug, style: { ...styles.body, fontSize: 31 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("g = /g/ and /j/ before e, i, or y", { width: fill, height: hug, style: { ...styles.body, fontSize: 31 } }),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Practice: cent, stage", { width: fill, height: hug, style: { ...styles.subtitle, fontSize: 25 } }),
          ]),
        ),
        panel(
          { width: fill, height: fill, fill: C.white, line: { color: C.line, weight: 2 }, borderRadius: 8, padding: { x: 38, y: 34 } },
          column({ width: fill, height: fill, gap: 22 }, [
            text("Jobs of silent e", { width: fill, height: hug, style: { ...styles.label, fontSize: 26, color: C.blue } }),
            row({ width: fill, height: hug, gap: 22 }, [wordTile("rice", C.softCoral, "c = /s/"), wordTile("page", C.softBlue, "g = /j/")]),
            rule({ width: fill, stroke: C.line, weight: 2 }),
            text("Student check: read, mark, explain.", { width: fill, height: hug, style: { ...styles.body, fontSize: 31 } }),
          ]),
        ),
      ]),
      C.green,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Build bigger words with known parts",
      "Latin bases let students decode and spell by structure, not guessing.",
      column({ name: "latin-body", width: fill, height: fill, justify: "center", gap: 32 }, [
        row({ width: fill, height: hug, gap: 20, align: "center" }, [
          pill("re-", C.gold, 120),
          text("+", { width: hug, height: hug, style: { ...styles.title, fontSize: 48, color: C.mute } }),
          pill("-duce-", C.teal, 170),
          text("= reduce", { width: hug, height: hug, style: { ...styles.title, fontSize: 56, color: C.ink } }),
          text("lead back", { width: hug, height: hug, style: { ...styles.subtitle, fontSize: 26, color: C.teal } }),
        ]),
        row({ width: fill, height: hug, gap: 20, align: "center" }, [
          pill("pro-", C.gold, 120),
          text("+", { width: hug, height: hug, style: { ...styles.title, fontSize: 48, color: C.mute } }),
          pill("-duce-", C.teal, 170),
          text("= produce", { width: hug, height: hug, style: { ...styles.title, fontSize: 56, color: C.ink } }),
          text("lead forth", { width: hug, height: hug, style: { ...styles.subtitle, fontSize: 26, color: C.teal } }),
        ]),
        rule({ width: fill, stroke: C.line, weight: 2 }),
        grid({ width: fill, height: hug, columns: [fr(1), fr(1), fr(1), fr(1)], columnGap: 18, rowGap: 16 }, [
          pill("-cede-", C.blue, 170),
          pill("-cess-", C.blue, 170),
          pill("-cept-", C.violet, 170),
          pill("-cite-", C.coral, 170),
          pill("-cide-", C.coral, 170),
          pill("-cise-", C.coral, 170),
          pill("-scend-", C.green, 190),
          pill("-side-", C.teal, 170),
        ]),
        text("For today: emphasize reading and spelling first; meaning grows with use.", {
          width: wrap(1080),
          height: hug,
          style: { ...styles.subtitle, fontSize: 28, bold: true },
        }),
      ]),
      C.teal,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Spelling",
      "Use a blank tile to slow down the decision.",
      grid({ name: "spelling-grid", width: fill, height: fill, columns: [fr(1.05), fr(0.95)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 24 }, [
          stepItem(1, "Repeat and tap", "Where is the sound with more than one spelling?", C.coral),
          stepItem(2, "Place a blank tile", "The blank marks the decision spot.", C.gold),
          stepItem(3, "List the options", "/s/ can be s or c. /j/ can be j or g.", C.teal),
          stepItem(4, "Verify and spell", "Use a dictionary or spell-checking technology, then orally spell.", C.blue),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 26 }, [
          text("cinch", { width: fixed(420), height: hug, style: { ...styles.huge, fontSize: 96, color: C.ink } }),
          row({ width: hug, height: hug, gap: 16 }, [pill("s", C.coral, 74), pill("c", C.coral, 74), text("for /s/", { width: hug, height: hug, style: styles.subtitle })]),
          text("page", { width: fixed(420), height: hug, style: { ...styles.huge, fontSize: 96, color: C.ink } }),
          row({ width: hug, height: hug, gap: 16 }, [pill("j", C.violet, 74), pill("g", C.violet, 74), text("for /j/", { width: hug, height: hug, style: styles.subtitle })]),
          text("Reminder: English words do not end with j.", {
            width: wrap(620),
            height: hug,
            style: { ...styles.subtitle, fontSize: 25, bold: true, color: C.blue },
          }),
        ]),
      ]),
      C.gold,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "One syllable at a time",
      "Keep the discovery visible while the word gets longer.",
      column({ name: "gentle-body", width: fill, height: fill, justify: "center", gap: 36 }, [
        row({ width: fill, height: hug, gap: 22, align: "center", justify: "center" }, [
          wordTile("gen", C.softBlue, "syllable 1"),
          text("+", { width: hug, height: hug, style: { ...styles.title, fontSize: 48, color: C.mute } }),
          wordTile("tle", C.white, "syllable 2"),
          text("= gentle", { width: hug, height: hug, style: { ...styles.title, fontSize: 60 } }),
        ]),
        grid({ width: fill, height: hug, columns: [fr(1), fr(1), fr(1)], columnGap: 30 }, [
          miniPrompt("Which syllable has the spelling option?", "Point to gen.", C.blue),
          miniPrompt("Which sound has the option?", "The first sound: /j/.", C.violet),
          miniPrompt("What are the choices?", "j or g; verify, then spell.", C.teal),
        ]),
        text("Then read the full word back while scooping the syllables.", {
          width: wrap(1020),
          height: hug,
          style: { ...styles.title, fontSize: 46, color: C.coral },
        }),
      ]),
      C.violet,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Lesson flow after the intro",
      "Return to the same concept in smaller, faster loops.",
      grid({ name: "flow-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          stepItem(1, "Word cards", "Sort for c/g sounds; build automaticity.", C.coral),
          stepItem(2, "Wordlist reading", "Choose lists that match today’s teaching point.", C.teal),
          stepItem(3, "Sentence reading", "Read for accuracy, phrasing, and meaning.", C.blue),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          stepItem(4, "Quick drill in reverse", "What says /s/? What says /j/?", C.gold),
          stepItem(5, "Spelling options", "Use tiles, options, and verification.", C.violet),
          stepItem(6, "Written dictation", "Mark c/g sounds, syllables, affixes, and bases.", C.green),
        ]),
      ]),
      C.green,
    ),
  );
}

{
  const slide = deck.slides.add();
  add(
    slide,
    slideRoot(
      "Exit ticket",
      "Students leave with a reason, not just a rule.",
      grid({ name: "exit-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 70 }, [
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          text("Read and explain", { width: fill, height: hug, style: { ...styles.title, fontSize: 48, color: C.teal } }),
          row({ width: fill, height: hug, gap: 18 }, [wordTile("city", C.softCoral), wordTile("magic", C.softBlue)]),
          row({ width: fill, height: hug, gap: 18 }, [wordTile("cycle", C.softCoral), wordTile("suggest", C.softBlue)]),
          text("Prompt: What sound? Why?", { width: fill, height: hug, style: { ...styles.subtitle, fontSize: 30, bold: true } }),
        ]),
        column({ width: fill, height: fill, justify: "center", gap: 22 }, [
          text("Spell and justify", { width: fill, height: hug, style: { ...styles.title, fontSize: 48, color: C.coral } }),
          stepItem(1, "Tap the sounds", "Find the option spot.", C.coral),
          stepItem(2, "Name the choices", "s/c or j/g.", C.violet),
          stepItem(3, "Check and spell", "Then read it back.", C.teal),
          text("Teacher closes: You found the clue the letter was looking at.", {
            width: wrap(760),
            height: hug,
            style: { ...styles.subtitle, fontSize: 28, bold: true, color: C.ink },
          }),
        ]),
      ]),
      C.coral,
    ),
  );
}

await fs.mkdir("output", { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT);

for (let i = 0; i < deck.slides.count; i++) {
  const blob = await deck.export({ slide: deck.slides.getItem(i), format: "png" });
  const bytes = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(`${PREVIEW_DIR}/slide-${String(i + 1).padStart(2, "0")}.png`, bytes);
}

console.log(`saved ${OUT}`);
console.log(`rendered ${deck.slides.count} preview PNGs to ${PREVIEW_DIR}`);
