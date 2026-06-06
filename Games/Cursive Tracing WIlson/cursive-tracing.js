(() => {
  "use strict";

  const STORAGE_KEY = "wilsonCursiveStrokeLab.v1";
  const DB_NAME = "wilsonCursiveStrokeLab";
  const DB_STORE = "progress";
  const DB_KEY = "latest";
  const WIDTH = 1200;
  const HEIGHT = 760;
  const LINES = {
    sky: 110,
    plane: 305,
    grass: 440,
    worm: 650
  };

  const colors = {
    guide: "#b9c5d4",
    current: "#f06f5f",
    ink: "#202938",
    blue: "#1d7eea",
    green: "#159c5b",
    sloppy: "#94d46b",
    future: "#d8e2ef"
  };

  const seedNames = [
    "Angel", "Emma", "Ariana", "Mia", "Emmanuel", "Juan", "Sofia",
    "Alesander", "Linda", "Joshua", "Jayden C.", "Jayden D.", "Aileen",
    "Davonte", "Bethany", "Ayden", "Jedediah", "Makayla", "Rodrigo",
    "Diomedes", "Alberto", "Ta'Marrion", "Jesus", "Madison", "Xavier",
    "Allison", "Jade", "Julianna", "Robert", "Jose", "Jerson", "Yeici", "Katy"
  ];

  const families = {
    loop: "Loop letter",
    updown: "Up/down letter",
    twoclock: "Two o'clock letter",
    hump: "Hump letter"
  };

  const referenceGuide = {
    a: { sky: 8, plane: 73, grass: 114, worm: 184 },
    b: { sky: 12, plane: 86, grass: 122, worm: 189 },
    c: { sky: -50, plane: 16, grass: 60, worm: 130 },
    d: { sky: 9, plane: 74, grass: 115, worm: 187 },
    e: { sky: -49, plane: 14, grass: 56, worm: 123 },
    f: { sky: 12, plane: 72, grass: 124, worm: 189 },
    g: { sky: -44, plane: 16, grass: 57, worm: 130 },
    h: { sky: 7, plane: 72, grass: 113, worm: 179 },
    i: { sky: -40, plane: 30, grass: 77, worm: 148 },
    j: { sky: -48, plane: 29, grass: 80, worm: 149 },
    k: { sky: 6, plane: 73, grass: 124, worm: 188 },
    l: { sky: 7, plane: 68, grass: 129, worm: 190 },
    m: { sky: -15, plane: 48, grass: 91, worm: 154 },
    n: { sky: -15, plane: 48, grass: 91, worm: 154 },
    o: { sky: -55, plane: 15, grass: 62, worm: 132 },
    p: { sky: -54, plane: 16, grass: 62, worm: 130 },
    q: { sky: -60, plane: 12, grass: 60, worm: 130 },
    r: { sky: -32, plane: 27, grass: 66, worm: 125 },
    s: { sky: -65, plane: 10, grass: 60, worm: 135 },
    t: { sky: 12, plane: 73, grass: 123, worm: 190 },
    u: { sky: -56, plane: 12, grass: 57, worm: 125 },
    v: { sky: -31, plane: 26, grass: 64, worm: 121 },
    w: { sky: -27, plane: 37, grass: 81, worm: 145 },
    x: { sky: -54, plane: 12, grass: 56, worm: 122 },
    y: { sky: -58, plane: 10, grass: 55, worm: 127 },
    z: { sky: -57, plane: 10, grass: 54, worm: 128 }
  };

  const referenceMetrics = {
    a: { width: 175, height: 185, ink: [13, 67, 168, 129] },
    b: { width: 195, height: 195, ink: [19, 10, 173, 133] },
    c: { width: 165, height: 83, ink: [0, 11, 132, 73] },
    d: { width: 185, height: 190, ink: [0, 7, 163, 130] },
    e: { width: 155, height: 82, ink: [2, 10, 112, 71] },
    f: { width: 175, height: 200, ink: [0, 10, 98, 189] },
    g: { width: 175, height: 141, ink: [2, 10, 155, 131] },
    h: { width: 200, height: 139, ink: [17, 4, 161, 129] },
    i: { width: 160, height: 101, ink: [4, 10, 121, 92] },
    j: { width: 185, height: 161, ink: [5, 10, 117, 151] },
    k: { width: 180, height: 140, ink: [0, 4, 86, 130] },
    l: { width: 175, height: 140, ink: [0, 5, 45, 99] },
    m: { width: 205, height: 83, ink: [31, 10, 205, 73] },
    n: { width: 180, height: 83, ink: [48, 10, 180, 74] },
    o: { width: 185, height: 84, ink: [37, 11, 185, 74] },
    p: { width: 180, height: 143, ink: [43, 11, 180, 132] },
    q: { width: 175, height: 142, ink: [60, 10, 175, 132] },
    r: { width: 165, height: 82, ink: [64, 10, 165, 72] },
    s: { width: 175, height: 82, ink: [56, 10, 175, 72] },
    t: { width: 195, height: 145, ink: [36, 11, 158, 135] },
    u: { width: 195, height: 83, ink: [2, 11, 165, 73] },
    v: { width: 185, height: 82, ink: [0, 10, 178, 72] },
    w: { width: 205, height: 82, ink: [4, 11, 205, 72] },
    x: { width: 185, height: 80, ink: [29, 10, 164, 71] },
    y: { width: 195, height: 139, ink: [28, 9, 179, 129] },
    z: { width: 195, height: 139, ink: [22, 10, 178, 130] }
  };

  const dom = {
    playerSelect: document.querySelector("#playerSelect"),
    newPlayerName: document.querySelector("#newPlayerName"),
    addPlayerBtn: document.querySelector("#addPlayerBtn"),
    totalPoints: document.querySelector("#totalPoints"),
    letterStrip: document.querySelector("#letterStrip"),
    activeLetterBadge: document.querySelector("#activeLetterBadge"),
    letterGroup: document.querySelector("#letterGroup"),
    strokePrompt: document.querySelector("#strokePrompt"),
    retryBtn: document.querySelector("#retryBtn"),
    nextBtn: document.querySelector("#nextBtn"),
    traceCanvas: document.querySelector("#traceCanvas"),
    feedbackPill: document.querySelector("#feedbackPill"),
    strokeProgress: document.querySelector("#strokeProgress"),
    letterPoints: document.querySelector("#letterPoints"),
    currentStreak: document.querySelector("#currentStreak"),
    perfectStrokes: document.querySelector("#perfectStrokes"),
    masteredCount: document.querySelector("#masteredCount"),
    strokeList: document.querySelector("#strokeList"),
    playerSummary: document.querySelector("#playerSummary"),
    leaderboard: document.querySelector("#leaderboard"),
    exportBtn: document.querySelector("#exportBtn"),
    importBtn: document.querySelector("#importBtn"),
    importFile: document.querySelector("#importFile"),
    saveStatus: document.querySelector("#saveStatus"),
    teacherReportBtn: document.querySelector("#teacherReportBtn"),
    reportDialog: document.querySelector("#reportDialog"),
    closeReportBtn: document.querySelector("#closeReportBtn"),
    reportText: document.querySelector("#reportText")
  };

  const ctx = dom.traceCanvas.getContext("2d");
  const letters = buildLetters();
  const alphabet = Object.keys(letters);
  const referenceImages = new Map();
  let state = loadState();
  let activeLetter = state.lastLetter && letters[state.lastLetter] ? state.lastLetter : "a";
  let activeMode = state.mode || "focus";
  let attempt = newAttempt(activeLetter);
  let dbPromise = openDatabase();

  init();

  function init() {
    dom.traceCanvas.width = WIDTH;
    dom.traceCanvas.height = HEIGHT;
    preloadReferenceImages();
    ensurePlayers();
    renderAll();
    bindEvents();
    saveState();
  }

  function preloadReferenceImages() {
    alphabet.forEach((letter) => {
      const image = new Image();
      image.onload = draw;
      image.src = `reference-letters/${letter}.png?v=2`;
      referenceImages.set(letter, image);
    });
  }

  function bindEvents() {
    dom.addPlayerBtn.addEventListener("click", addPlayerFromInput);
    dom.newPlayerName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addPlayerFromInput();
    });
    dom.playerSelect.addEventListener("change", () => {
      state.activePlayerId = dom.playerSelect.value;
      saveState();
      renderAll();
    });
    dom.retryBtn.addEventListener("click", () => resetAttempt("Letter ready"));
    dom.nextBtn.addEventListener("click", nextLetter);
    dom.exportBtn.addEventListener("click", exportProgress);
    dom.importBtn.addEventListener("click", () => dom.importFile.click());
    dom.importFile.addEventListener("change", importProgress);
    dom.teacherReportBtn.addEventListener("click", openTeacherReport);
    dom.closeReportBtn.addEventListener("click", () => dom.reportDialog.close());

    document.querySelectorAll(".mode-button").forEach((button) => {
      button.addEventListener("click", () => {
        activeMode = button.dataset.mode;
        state.mode = activeMode;
        if (activeMode === "review") activeLetter = pickReviewLetter();
        if (activeMode === "arcade") activeLetter = pickArcadeLetter();
        resetAttempt("Mode changed");
        saveState();
      });
    });

    dom.traceCanvas.addEventListener("pointerdown", pointerDown);
    dom.traceCanvas.addEventListener("pointermove", pointerMove);
    dom.traceCanvas.addEventListener("pointerup", pointerUp);
    dom.traceCanvas.addEventListener("pointercancel", pointerUp);
  }

  function buildLetters() {
    const S = LINES.sky;
    const P = LINES.plane;
    const G = LINES.grass;
    const W = LINES.worm;
    const start = 245;
    const mid = 455;
    const right = 620;

    const p = (x, y) => ({ x, y });
    const point = (x, y, label) => ({ kind: "point", label, points: [p(x, y)] });
    const path = (label, points) => ({ kind: "path", label, points: points.map(([x, y]) => p(x, y)) });
    const refPoint = (letter, x, y) => {
      const placement = referencePlacement(letter);
      return [placement.x + x * placement.scale, placement.y + y * placement.scale];
    };
    const pointRef = (letter, x, y, label) => point(...refPoint(letter, x, y), label);
    const pathRef = (letter, label, points) => path(label, points.map(([x, y]) => refPoint(letter, x, y)));
    const tail = (x, y) => path("make a tail", [[x, y], [x + 70, y + 4], [x + 122, y - 48]]);
    const bridge = (x, y) => path("make a swinging bridge", [[x, y], [x + 54, y - 64], [x + 128, y - 14]]);

    const twoClockOpen = (name, more) => ({
      name,
      family: "twoclock",
      strokes: [
        point(start, G, "start on the grass line"),
        path("glide to two o'clock", [[start, G], [280, 390], [370, P], [475, P + 20]]),
        path("curve back to the grass line", [[475, P + 20], [360, P - 36], [260, 355], [288, G - 18], [405, G]]),
        ...more
      ]
    });

    const rawLetters = {
      a: {
        name: "a",
        family: "twoclock",
        manualFit: true,
        strokes: [
          pointRef("a", 16, 114, "start on the grass line"),
          pathRef("a", "glide to two o'clock", [[16, 114], [28, 116], [41, 112], [54, 101], [67, 89], [82, 80], [98, 74], [113, 72], [126, 73]]),
          pathRef("a", "round back and climb", [[126, 73], [114, 71], [101, 71], [88, 75], [76, 84], [68, 97], [65, 109], [69, 119], [81, 123], [95, 121], [108, 114], [118, 101], [124, 87], [126, 73]]),
          pathRef("a", "trace down", [[126, 73], [131, 79], [130, 90], [126, 101], [121, 112], [113, 120]]),
          pathRef("a", "make a tail", [[113, 120], [126, 122], [139, 119], [153, 108], [168, 98]])
        ]
      },
      b: {
        name: "b",
        family: "loop",
        manualFit: true,
        strokes: [
          pointRef("b", 20, 122, "start on the grass line"),
          pathRef("b", "glide to the sky line", [[20, 122], [35, 124], [51, 119], [66, 108], [78, 93], [88, 76], [98, 56], [106, 36], [113, 18], [109, 11], [98, 12]]),
          pathRef("b", "loop down", [[98, 12], [89, 24], [82, 43], [76, 62], [70, 82], [66, 101], [69, 117], [80, 126]]),
          pathRef("b", "make a big belly", [[80, 126], [96, 129], [111, 125], [121, 113], [126, 97], [124, 82], [118, 72]]),
          pathRef("b", "make a swinging bridge", [[118, 72], [124, 86], [137, 95], [154, 98], [170, 88], [182, 72]])
        ]
      },
      c: twoClockOpen("c", [
        tail(405, G)
      ]),
      d: {
        name: "d",
        family: "twoclock",
        strokes: [
          point(start, G, "start on the grass line"),
          path("glide to two o'clock", [[start, G], [280, 390], [370, P], [475, P + 20]]),
          path("round back and reach sky", [[475, P + 20], [360, P - 36], [260, 355], [288, G - 18], [382, G + 12], [470, 410], [468, S]]),
          path("loop back down", [[468, S], [565, 210], [510, 390], [468, G]]),
          tail(468, G)
        ]
      },
      e: {
        name: "e",
        family: "loop",
        strokes: [
          point(290, G, "start on the grass line"),
          path("glide to the plane line", [[290, G], [340, 375], [438, P]]),
          path("loop back down", [[438, P], [526, 338], [430, 500], [345, G]]),
          tail(345, G)
        ]
      },
      f: {
        name: "f",
        family: "loop",
        strokes: [
          point(295, G, "start on the grass line"),
          path("glide to the sky line", [[295, G], [345, 330], [430, S]]),
          path("loop to the worm line", [[430, S], [548, 230], [420, 510], [372, W]]),
          path("loop back to grass", [[372, W], [475, 635], [500, 525], [430, G]]),
          tail(430, G)
        ]
      },
      g: {
        name: "g",
        family: "twoclock",
        strokes: [
          point(start, G, "start on the grass line"),
          path("glide to two o'clock", [[start, G], [280, 390], [370, P], [475, P + 20]]),
          path("round back and climb", [[475, P + 20], [360, P - 36], [260, 355], [288, G - 18], [382, G + 12], [474, 410], [468, P]]),
          path("trace to the worm line", [[468, P], [468, 430], [430, W]]),
          path("loop up and tail", [[430, W], [560, 640], [590, 515], [490, G], [560, G], [625, 455]])
        ]
      },
      h: {
        name: "h",
        family: "loop",
        strokes: [
          point(275, G, "start on the grass line"),
          path("glide to the sky line", [[275, G], [320, 330], [405, S]]),
          path("loop down", [[405, S], [520, 205], [450, 455], [330, G]]),
          path("make a hump", [[330, G], [378, 375], [450, P], [540, G]]),
          tail(540, G)
        ]
      },
      i: {
        name: "i",
        family: "updown",
        strokes: [
          point(315, G, "start on the grass line"),
          path("glide to the plane line", [[315, G], [365, 380], [430, P]]),
          path("trace down and tail", [[430, P], [430, 405], [430, G], [505, G], [558, 455]]),
          point(430, 205, "add the dot")
        ]
      },
      j: {
        name: "j",
        family: "updown",
        strokes: [
          point(320, G, "start on the grass line"),
          path("glide to the plane line", [[320, G], [365, 380], [430, P]]),
          path("go to the worm line", [[430, P], [430, 420], [388, W]]),
          path("loop back up and tail", [[388, W], [510, 638], [540, 520], [445, G], [520, G], [585, 455]]),
          point(430, 205, "add the dot")
        ]
      },
      k: {
        name: "k",
        family: "loop",
        strokes: [
          point(275, G, "start on the grass line"),
          path("glide to the sky line", [[275, G], [320, 330], [405, S]]),
          path("loop down", [[405, S], [520, 205], [450, 455], [330, G]]),
          path("make a little belly", [[330, G], [382, 370], [458, P], [534, 340], [468, 395]]),
          path("return to grass and tail", [[468, 395], [430, 445], [480, G], [548, G], [610, 455]])
        ]
      },
      l: {
        name: "l",
        family: "loop",
        strokes: [
          point(280, G, "start on the grass line"),
          path("glide to the sky line", [[280, G], [325, 330], [410, S]]),
          path("loop down", [[410, S], [528, 215], [448, 455], [330, G]]),
          tail(330, G)
        ]
      },
      m: {
        name: "m",
        family: "hump",
        strokes: [
          point(245, G, "start on the grass line"),
          path("make the first hump", [[245, G], [310, 380], [382, P], [460, G]]),
          path("make the second hump", [[460, G], [468, 368], [548, P], [625, G]]),
          path("make the third hump", [[625, G], [632, 370], [710, P], [790, G]]),
          tail(790, G)
        ]
      },
      n: {
        name: "n",
        family: "hump",
        strokes: [
          point(255, G, "start on the grass line"),
          path("make the first hump", [[255, G], [322, 380], [392, P], [475, G]]),
          path("make another hump", [[475, G], [482, 370], [558, P], [640, G]]),
          tail(640, G)
        ]
      },
      o: {
        name: "o",
        family: "twoclock",
        strokes: [
          point(start, G, "start on the grass line"),
          path("glide to two o'clock", [[start, G], [280, 390], [370, P], [475, P + 20]]),
          path("round back and connect", [[475, P + 20], [360, P - 36], [260, 355], [288, G - 18], [382, G + 12], [474, 410], [510, 315]]),
          bridge(510, 315)
        ]
      },
      p: {
        name: "p",
        family: "updown",
        strokes: [
          point(320, G, "start on the grass line"),
          path("glide to the plane line", [[320, G], [365, 380], [430, P]]),
          path("go to the worm line", [[430, P], [430, 430], [390, W]]),
          path("make a big belly", [[390, W], [440, 500], [430, P], [585, 300], [580, 465], [430, 500]]),
          tail(430, 500)
        ]
      },
      q: {
        name: "q",
        family: "twoclock",
        strokes: [
          point(start, G, "start on the grass line"),
          path("glide to two o'clock", [[start, G], [280, 390], [370, P], [475, P + 20]]),
          path("round back and climb", [[475, P + 20], [360, P - 36], [260, 355], [288, G - 18], [382, G + 12], [474, 410], [468, P]]),
          path("trace to the worm line", [[468, P], [468, 430], [430, W]]),
          path("loop up and tail", [[430, W], [560, 640], [590, 515], [490, G], [560, G], [625, 455]])
        ]
      },
      r: {
        name: "r",
        family: "updown",
        strokes: [
          point(300, G, "start on the grass line"),
          path("glide to the plane line", [[300, G], [355, 380], [430, P]]),
          path("make half a bridge", [[430, P], [505, P - 10], [545, 355]]),
          path("go back and tail", [[545, 355], [500, 450], [525, G], [595, G], [650, 455]])
        ]
      },
      s: {
        name: "s",
        family: "updown",
        strokes: [
          point(310, G, "start on the grass line"),
          path("glide to the plane line", [[310, G], [362, 380], [442, P]]),
          path("come down and connect", [[442, P], [520, 330], [395, 395], [455, G], [355, G]]),
          tail(355, G)
        ]
      },
      t: {
        name: "t",
        family: "updown",
        strokes: [
          point(300, G, "start on the grass line"),
          path("glide to the sky line", [[300, G], [355, 335], [452, S]]),
          path("trace down", [[452, S], [452, 330], [452, G]]),
          tail(452, G),
          path("cross on the plane line", [[360, P], [462, P - 18], [580, P - 4]])
        ]
      },
      u: {
        name: "u",
        family: "updown",
        strokes: [
          point(280, G, "start on the grass line"),
          path("glide to the plane line", [[280, G], [340, 380], [420, P]]),
          path("down and swing up", [[420, P], [420, 405], [420, G], [505, G], [560, P]]),
          path("down and tail", [[560, P], [560, 405], [560, G], [630, G], [690, 455]])
        ]
      },
      v: {
        name: "v",
        family: "hump",
        strokes: [
          point(270, G, "start on the grass line"),
          path("make a rounded downstroke", [[270, G], [345, 378], [420, P], [515, G]]),
          path("curve back up", [[515, G], [560, 410], [615, P]]),
          bridge(615, P)
        ]
      },
      w: {
        name: "w",
        family: "updown",
        strokes: [
          point(255, G, "start on the grass line"),
          path("glide to the plane line", [[255, G], [318, 382], [390, P]]),
          path("down and swing up", [[390, P], [390, 420], [390, G], [472, G], [530, P]]),
          path("down and swing up again", [[530, P], [530, 420], [530, G], [612, G], [670, P]]),
          bridge(670, P)
        ]
      },
      x: {
        name: "x",
        family: "hump",
        strokes: [
          point(270, G, "start on the grass line"),
          path("make a wide hump", [[270, G], [350, 365], [455, P], [610, G]]),
          tail(610, G),
          point(585, P, "start the slide back"),
          path("slide back to grass", [[585, P], [478, 370], [360, G]])
        ]
      },
      y: {
        name: "y",
        family: "hump",
        strokes: [
          point(265, G, "start on the grass line"),
          path("make a hump", [[265, G], [340, 378], [420, P], [505, G]]),
          path("curve back up", [[505, G], [550, 415], [600, P]]),
          path("trace to the worm line", [[600, P], [585, 435], [535, W]]),
          path("loop up and tail", [[535, W], [655, 640], [690, 515], [590, G], [665, G], [725, 455]])
        ]
      },
      z: {
        name: "z",
        family: "hump",
        strokes: [
          point(260, G, "start on the grass line"),
          path("make a hump", [[260, G], [330, 378], [405, P], [490, G]]),
          path("make a smaller hump", [[490, G], [505, 385], [580, 318], [650, 390]]),
          path("go to the worm line", [[650, 390], [610, 500], [555, W]]),
          path("loop up and tail", [[555, W], [680, 640], [710, 515], [610, G], [690, G], [755, 455]])
        ]
      }
    };

    return fitLettersToReference(rawLetters);
  }

  function fitLettersToReference(rawLetters) {
    Object.keys(rawLetters).forEach((letter) => {
      if (rawLetters[letter].manualFit) return;
      const sourceBox = strokeBounds(rawLetters[letter].strokes);
      const targetBox = referenceInkBox(letter);
      if (!sourceBox || !targetBox) return;
      const sourceWidth = Math.max(1, sourceBox.right - sourceBox.left);
      const sourceHeight = Math.max(1, sourceBox.bottom - sourceBox.top);
      const targetWidth = Math.max(1, targetBox.right - targetBox.left);
      const targetHeight = Math.max(1, targetBox.bottom - targetBox.top);

      rawLetters[letter].strokes.forEach((stroke) => {
        stroke.points = stroke.points.map((point) => ({
          x: targetBox.left + ((point.x - sourceBox.left) / sourceWidth) * targetWidth,
          y: targetBox.top + ((point.y - sourceBox.top) / sourceHeight) * targetHeight
        }));
      });
    });
    return rawLetters;
  }

  function strokeBounds(strokes) {
    const points = strokes.flatMap((stroke) => stroke.points);
    if (!points.length) return null;
    return {
      left: Math.min(...points.map((point) => point.x)),
      right: Math.max(...points.map((point) => point.x)),
      top: Math.min(...points.map((point) => point.y)),
      bottom: Math.max(...points.map((point) => point.y))
    };
  }

  function referenceInkBox(letter) {
    const metrics = referenceMetrics[letter];
    const placement = referencePlacement(letter);
    if (!metrics || !placement) return null;
    const [left, top, right, bottom] = metrics.ink;
    return {
      left: placement.x + left * placement.scale,
      top: placement.y + top * placement.scale,
      right: placement.x + right * placement.scale,
      bottom: placement.y + bottom * placement.scale
    };
  }

  function referencePlacement(letter) {
    const guide = referenceGuide[letter];
    const metrics = referenceMetrics[letter];
    if (!guide || !metrics) return null;
    const scale = (LINES.grass - LINES.plane) / Math.max(guide.grass - guide.plane, 1);
    return {
      x: 162,
      y: LINES.plane - guide.plane * scale,
      scale
    };
  }

  function newAttempt(letter) {
    const strokeCount = letters[letter].strokes.length;
    return {
      letter,
      currentIndex: 0,
      letterPoints: 0,
      streak: 0,
      perfect: 0,
      completed: Array.from({ length: strokeCount }, () => null),
      completedInk: [],
      activeTrace: [],
      allInk: [],
      drawing: false,
      pointerId: null,
      drawingStartIndex: null,
      liftCounts: Array.from({ length: strokeCount }, () => 0)
    };
  }

  function loadState() {
    const empty = {
      version: 1,
      activePlayerId: "",
      players: {},
      history: [],
      lastLetter: "a",
      mode: "focus",
      updatedAt: ""
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      return {
        ...empty,
        ...saved,
        players: saved.players && typeof saved.players === "object" ? saved.players : {},
        history: Array.isArray(saved.history) ? saved.history : []
      };
    } catch {
      return empty;
    }
  }

  function ensurePlayers() {
    if (!state.players || typeof state.players !== "object") state.players = {};
    mergePlayers(seedNames);
    mergePlayers(readTeachingRoster());
    const ids = Object.keys(state.players);
    if (!state.activePlayerId || !state.players[state.activePlayerId]) {
      state.activePlayerId = ids[0] || createPlayer("Player 1").id;
    }
  }

  function readTeachingRoster() {
    try {
      const saved = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "null");
      if (!saved || !Array.isArray(saved.rosterStudents)) return [];
      return saved.rosterStudents.map((student) => student.name || student.fullName).filter(Boolean);
    } catch {
      return [];
    }
  }

  function mergePlayers(names) {
    names.forEach((name) => {
      if (!name || findPlayerByName(name)) return;
      const player = makePlayer(name);
      state.players[player.id] = player;
    });
  }

  function makePlayer(name) {
    const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      name: name.trim(),
      totalPoints: 0,
      allTimeStreak: 0,
      letters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function createPlayer(name) {
    const player = makePlayer(name);
    state.players[player.id] = player;
    state.activePlayerId = player.id;
    return player;
  }

  function findPlayerByName(name) {
    const normalized = name.trim().toLowerCase();
    return Object.values(state.players).find((player) => player.name.trim().toLowerCase() === normalized);
  }

  function addPlayerFromInput() {
    const name = dom.newPlayerName.value.trim();
    if (!name) return;
    const existing = findPlayerByName(name);
    state.activePlayerId = existing ? existing.id : createPlayer(name).id;
    dom.newPlayerName.value = "";
    saveState();
    renderAll();
  }

  function currentPlayer() {
    return state.players[state.activePlayerId] || Object.values(state.players)[0];
  }

  function letterStats(player, letter) {
    if (!player.letters[letter]) {
      player.letters[letter] = {
        points: 0,
        attempts: 0,
        bestScore: 0,
        completedStrokes: 0,
        perfectStrokes: 0,
        greenStrokes: 0,
        sloppyStrokes: 0,
        mastered: false,
        lastPlayed: ""
      };
    }
    return player.letters[letter];
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    state.lastLetter = activeLetter;
    state.mode = activeMode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveToDatabase(state);
    if (dom.saveStatus) {
      dom.saveStatus.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
  }

  function openDatabase() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  function saveToDatabase(data) {
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(JSON.parse(JSON.stringify(data)), DB_KEY);
    });
  }

  function renderAll() {
    renderPlayers();
    renderMode();
    renderLetterStrip();
    renderAttemptPanels();
    renderPlayerPanels();
    draw();
  }

  function renderPlayers() {
    const players = Object.values(state.players).sort((a, b) => a.name.localeCompare(b.name));
    dom.playerSelect.innerHTML = players.map((player) => (
      `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`
    )).join("");
    dom.playerSelect.value = state.activePlayerId;
  }

  function renderMode() {
    document.querySelectorAll(".mode-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === activeMode);
    });
  }

  function renderLetterStrip() {
    const player = currentPlayer();
    dom.letterStrip.innerHTML = alphabet.map((letter) => {
      const stats = player ? player.letters[letter] : null;
      const classes = ["letter-button"];
      if (letter === activeLetter) classes.push("active");
      if (stats && stats.mastered) classes.push("mastered");
      return `<button class="${classes.join(" ")}" type="button" data-letter="${letter}" aria-label="Letter ${letter}">${letter}</button>`;
    }).join("");
    dom.letterStrip.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeLetter = button.dataset.letter;
        resetAttempt("Letter ready");
      });
    });
  }

  function renderAttemptPanels() {
    const data = letters[activeLetter];
    const currentStroke = data.strokes[attempt.currentIndex];
    dom.activeLetterBadge.textContent = activeLetter;
    dom.letterGroup.textContent = families[data.family];
    dom.strokePrompt.textContent = currentStroke
      ? `Stroke ${attempt.currentIndex + 1}: ${currentStroke.label}`
      : "Letter complete";
    dom.letterPoints.textContent = attempt.letterPoints;
    dom.currentStreak.textContent = attempt.streak;
    dom.perfectStrokes.textContent = attempt.perfect;
    dom.strokeList.innerHTML = data.strokes.map((stroke, index) => strokeRow(stroke, index)).join("");
    dom.strokeProgress.innerHTML = data.strokes.map((stroke, index) => progressStep(stroke, index)).join("");
  }

  function strokeRow(stroke, index) {
    const result = attempt.completed[index];
    const rating = result ? result.rating : "";
    const points = result ? `+${result.points}` : "";
    return `
      <li class="${rating}">
        <span class="stroke-number">${index + 1}</span>
        <span>${escapeHtml(stroke.label)}</span>
        <span class="stroke-rating ${rating}">${points || "open"}</span>
      </li>
    `;
  }

  function progressStep(stroke, index) {
    const result = attempt.completed[index];
    const rating = result ? result.rating : "";
    const label = result ? ratingLabel(rating) : (index === attempt.currentIndex ? "Now" : "Waiting");
    return `
      <div class="progress-step ${rating}">
        <strong>${index + 1}. ${escapeHtml(label)}</strong>
        <span>${escapeHtml(stroke.label)}</span>
      </div>
    `;
  }

  function renderPlayerPanels() {
    const player = currentPlayer();
    const mastered = alphabet.filter((letter) => player.letters[letter]?.mastered).length;
    dom.totalPoints.textContent = player.totalPoints || 0;
    dom.masteredCount.textContent = mastered;
    renderSummary(player);
    renderLeaderboard();
  }

  function renderSummary(player) {
    const stats = letterStats(player, activeLetter);
    dom.playerSummary.innerHTML = `
      <div class="summary-row">
        <span>Letter ${activeLetter}</span>
        <strong class="summary-value">${stats.points || 0}</strong>
        <p>points</p>
      </div>
      <div class="summary-row">
        <span>Best run</span>
        <strong class="summary-value">${stats.bestScore || 0}</strong>
        <p>points</p>
      </div>
      <div class="summary-row">
        <span>Attempts</span>
        <strong class="summary-value">${stats.attempts || 0}</strong>
        <p>finished</p>
      </div>
    `;
  }

  function renderLeaderboard() {
    const players = Object.values(state.players)
      .slice()
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 6);
    dom.leaderboard.innerHTML = players.map((player, index) => `
      <div class="leader-row">
        <span class="leader-rank">#${index + 1}</span>
        <span>${escapeHtml(player.name)}</span>
        <strong class="leader-points">${player.totalPoints || 0}</strong>
      </div>
    `).join("");
  }

  function resetAttempt(message) {
    attempt = newAttempt(activeLetter);
    setFeedback(message || "Letter ready");
    renderAll();
    saveState();
  }

  function nextLetter() {
    if (activeMode === "review") {
      activeLetter = pickReviewLetter();
    } else if (activeMode === "arcade") {
      activeLetter = pickArcadeLetter();
    } else {
      const index = alphabet.indexOf(activeLetter);
      activeLetter = alphabet[(index + 1) % alphabet.length];
    }
    resetAttempt("Letter ready");
  }

  function pickReviewLetter() {
    const player = currentPlayer();
    const ranked = alphabet
      .map((letter) => ({ letter, stats: player.letters[letter] || null }))
      .sort((a, b) => {
        const aMastered = a.stats?.mastered ? 1 : 0;
        const bMastered = b.stats?.mastered ? 1 : 0;
        if (aMastered !== bMastered) return aMastered - bMastered;
        return (a.stats?.bestScore || 0) - (b.stats?.bestScore || 0);
      });
    return ranked[0]?.letter || "a";
  }

  function pickArcadeLetter() {
    const player = currentPlayer();
    const pool = alphabet.flatMap((letter) => {
      const stats = player.letters[letter] || {};
      if (!stats.attempts) return [letter, letter, letter];
      if (!stats.mastered) return [letter, letter];
      return [letter];
    });
    return pool[Math.floor(Math.random() * pool.length)] || "a";
  }

  function pointerDown(event) {
    const point = eventPoint(event);
    dom.traceCanvas.setPointerCapture(event.pointerId);
    attempt.pointerId = event.pointerId;
    attempt.drawing = true;
    attempt.drawingStartIndex = attempt.currentIndex;
    attempt.activeTrace.push(point);
    attempt.allInk.push(point);
    handlePointStroke(point);
    draw();
  }

  function pointerMove(event) {
    if (!attempt.drawing || event.pointerId !== attempt.pointerId) return;
    const point = eventPoint(event);
    attempt.activeTrace.push(point);
    attempt.allInk.push(point);
    tryCompletePath(false);
    draw();
  }

  function pointerUp(event) {
    if (!attempt.drawing || event.pointerId !== attempt.pointerId) return;
    const strokeIndex = attempt.currentIndex;
    const completed = tryCompletePath(true);
    const stillOnStartedStroke = attempt.drawingStartIndex === strokeIndex && attempt.currentIndex === strokeIndex;
    if (!completed && stillOnStartedStroke && attempt.currentIndex < letters[activeLetter].strokes.length) {
      attempt.liftCounts[attempt.currentIndex] += 1;
      setFeedback("Keep tracing this stroke");
    }
    attempt.drawing = false;
    attempt.pointerId = null;
    attempt.drawingStartIndex = null;
    draw();
  }

  function eventPoint(event) {
    const rect = dom.traceCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      t: performance.now()
    };
  }

  function handlePointStroke(point) {
    let stroke = letters[activeLetter].strokes[attempt.currentIndex];
    while (stroke && stroke.kind === "point") {
      const target = stroke.points[0];
      const dist = distance(point, target);
      if (dist > 78) {
        setFeedback("Start closer to the dot");
        return;
      }
      const raw = Math.max(0, 1 - dist / 78);
      const rating = raw > 0.75 ? "blue" : raw > 0.48 ? "green" : "sloppy";
      completeStroke(rating, { raw, coverage: 1, accuracy: raw, direction: 1, smoothness: 1 }, [point]);
      stroke = letters[activeLetter].strokes[attempt.currentIndex];
    }
  }

  function tryCompletePath(fromPointerUp) {
    const stroke = letters[activeLetter].strokes[attempt.currentIndex];
    if (!stroke || stroke.kind !== "path" || attempt.activeTrace.length < 4) return false;
    const metrics = evaluateStroke(stroke, attempt.activeTrace, attempt.liftCounts[attempt.currentIndex]);
    const goodFinish = metrics.endClose <= 78;
    const acceptableFinish = metrics.endClose <= 115;
    const complete = metrics.coverage >= 0.7 && goodFinish;
    const sloppyComplete = fromPointerUp && metrics.coverage >= 0.55 && acceptableFinish;
    if (!complete && !sloppyComplete) return false;

    let rating = "sloppy";
    if (metrics.raw >= 0.9 && metrics.lifts === 0 && metrics.startClose <= 80 && goodFinish) {
      rating = "blue";
    } else if (metrics.raw >= 0.73 && metrics.direction >= 0.68) {
      rating = "green";
    }
    completeStroke(rating, metrics, attempt.activeTrace.slice());
    return true;
  }

  function evaluateStroke(stroke, trace, lifts) {
    const expected = samplePoints(stroke.points, 90);
    const traceSamples = samplePoints(trace, Math.max(30, Math.min(90, trace.length * 4)));
    const traceToExpected = traceSamples.map((point) => nearest(point, expected));
    const expectedToTrace = expected.map((point) => nearest(point, traceSamples));
    const coverage = expectedToTrace.filter((hit) => hit.dist <= 48).length / expected.length;
    const avgDist = average(traceToExpected.map((hit) => Math.min(hit.dist, 130)));
    const accuracy = clamp(1 - avgDist / 130, 0, 1);
    const indices = traceToExpected.map((hit) => hit.index);
    let forward = 0;
    for (let i = 1; i < indices.length; i += 1) {
      if (indices[i] + 3 >= indices[i - 1]) forward += 1;
    }
    const direction = indices.length > 1 ? forward / (indices.length - 1) : 0;
    const expectedLength = pathLength(expected);
    const traceLength = pathLength(trace);
    const lengthScore = clamp(1 - Math.abs(traceLength - expectedLength) / Math.max(expectedLength, 1.2), 0, 1);
    const turnScore = smoothness(trace);
    const continuity = clamp(1 - lifts * 0.18, 0.35, 1);
    const raw = (coverage * 0.42) + (accuracy * 0.22) + (direction * 0.16) + (lengthScore * 0.08) + (turnScore * 0.07) + (continuity * 0.05);
    return {
      coverage,
      accuracy,
      direction,
      smoothness: (turnScore + lengthScore) / 2,
      continuity,
      raw,
      lifts,
      startClose: distance(traceSamples[0], expected[0]),
      endClose: distance(traceSamples[traceSamples.length - 1], expected[expected.length - 1])
    };
  }

  function completeStroke(rating, metrics, trace) {
    const player = currentPlayer();
    const index = attempt.currentIndex;
    const strokeCount = letters[activeLetter].strokes.length;
    const firstStroke = index === 0;
    const points = strokePoints(rating, firstStroke);
    const result = {
      rating,
      points,
      metrics,
      completedAt: new Date().toISOString()
    };
    attempt.completed[index] = result;
    attempt.completedInk.push({ points: trace, rating });
    attempt.currentIndex += 1;
    attempt.letterPoints += points;
    attempt.streak += 1;
    if (rating === "blue") attempt.perfect += 1;

    player.totalPoints = (player.totalPoints || 0) + points;
    player.allTimeStreak = (player.allTimeStreak || 0) + 1;
    player.updatedAt = new Date().toISOString();

    const stats = letterStats(player, activeLetter);
    stats.points = (stats.points || 0) + points;
    stats.completedStrokes = (stats.completedStrokes || 0) + 1;
    stats.lastPlayed = new Date().toISOString();
    if (rating === "blue") stats.perfectStrokes = (stats.perfectStrokes || 0) + 1;
    if (rating === "green") stats.greenStrokes = (stats.greenStrokes || 0) + 1;
    if (rating === "sloppy") stats.sloppyStrokes = (stats.sloppyStrokes || 0) + 1;

    state.history.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: player.id,
      playerName: player.name,
      letter: activeLetter,
      stroke: index + 1,
      rating,
      points,
      raw: Number(metrics.raw.toFixed(3)),
      mode: activeMode,
      completedAt: new Date().toISOString()
    });
    state.history = state.history.slice(-3000);

    if (attempt.currentIndex >= strokeCount) {
      stats.attempts = (stats.attempts || 0) + 1;
      stats.bestScore = Math.max(stats.bestScore || 0, attempt.letterPoints);
      const cleanStrokes = attempt.completed.filter((item) => item && item.rating !== "sloppy").length;
      const blueStrokes = attempt.completed.filter((item) => item && item.rating === "blue").length;
      stats.mastered = stats.mastered || cleanStrokes === strokeCount || blueStrokes >= Math.ceil(strokeCount * 0.75);
      attempt.activeTrace = [];
      setFeedback(`Letter complete: +${attempt.letterPoints}`, "green");
    } else {
      const next = letters[activeLetter].strokes[attempt.currentIndex];
      attempt.activeTrace = trace.slice(-1);
      setFeedback(`${ratingLabel(rating)} +${points}`, rating);
      if (next && next.kind === "point") attempt.activeTrace = [];
    }

    renderAll();
    saveState();
  }

  function strokePoints(rating, firstStroke) {
    const base = firstStroke ? 25 : 12;
    if (rating === "blue") return base + 18;
    if (rating === "green") return base + 9;
    return base + 3;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawPaper();
    drawReferenceLetter();
    drawCompletedInk();
    drawGuideLetter();
    drawActiveTrace();
  }

  function drawPaper() {
    ctx.save();
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "#e3edf7";
    ctx.lineWidth = 1;
    for (let x = -260; x < WIDTH + 260; x += 86) {
      ctx.beginPath();
      ctx.moveTo(x, HEIGHT);
      ctx.lineTo(x + 270, 0);
      ctx.stroke();
    }

    drawGridLine(LINES.sky, "Sky");
    drawGridLine(LINES.plane, "Plane");
    drawGridLine(LINES.grass, "Grass");
    drawGridLine(LINES.worm, "Worm");
    ctx.restore();
  }

  function drawGridLine(y, label) {
    ctx.save();
    ctx.strokeStyle = y === LINES.plane ? "#b6c8dc" : "#879bb3";
    ctx.setLineDash(y === LINES.plane ? [12, 10] : []);
    ctx.lineWidth = y === LINES.grass ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(WIDTH - 70, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#6f8195";
    ctx.font = "800 18px Inter, system-ui, sans-serif";
    ctx.fillText(label, 78, y - 10);
    ctx.restore();
  }

  function drawGuideLetter() {
    const data = letters[activeLetter];
    data.strokes.forEach((stroke, index) => {
      const result = attempt.completed[index];
      const isCurrent = index === attempt.currentIndex;
      if (result && stroke.kind === "point") {
        drawStroke(stroke, colorForRating(result.rating), 0.9, false);
      } else if (isCurrent) {
        drawStroke(stroke, colors.current, 0.25, true);
      }
    });
  }

  function drawReferenceLetter() {
    const image = referenceImages.get(activeLetter);
    const placement = referencePlacement(activeLetter);
    if (!image || !image.complete || !image.naturalWidth || !placement) return;
    const width = image.naturalWidth * placement.scale;
    const height = image.naturalHeight * placement.scale;
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.drawImage(image, placement.x, placement.y, width, height);
    ctx.restore();
  }

  function drawStroke(stroke, color, alpha, isCurrent) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (stroke.kind === "point") {
      const target = stroke.points[0];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(target.x, target.y, isCurrent ? 16 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (isCurrent) {
      drawTargetDots(stroke.points, color, alpha);
      ctx.restore();
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = isCurrent ? 14 : 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (isCurrent) ctx.setLineDash([12, 18]);
    drawSmoothPath(stroke.points);
    ctx.stroke();
    ctx.restore();
  }

  function drawTargetDots(points, color, alpha) {
    const length = pathLength(points);
    const dots = samplePoints(points, Math.max(10, Math.ceil(length / 20)));
    ctx.save();
    ctx.globalAlpha = Math.max(alpha, 0.72);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawSmoothPath(points);
    ctx.stroke();
    ctx.fillStyle = color;
    dots.forEach((point, index) => {
      const radius = index === 0 || index === dots.length - 1 ? 6 : 4.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawCompletedInk() {
    attempt.completedInk.forEach((line) => {
      if (!line.points || line.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = colorForRating(line.rating);
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawSmoothPath(line.points);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawActiveTrace() {
    if (attempt.activeTrace.length < 2) return;
    ctx.save();
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.86;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawSmoothPath(attempt.activeTrace);
    ctx.stroke();
    ctx.restore();
  }

  function drawSmoothPath(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }
    for (let i = 1; i < points.length - 1; i += 1) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function samplePoints(points, targetCount) {
    const sampled = [];
    const lengths = [];
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      const len = distance(points[i - 1], points[i]);
      lengths.push(len);
      total += len;
    }
    if (!total) return points.slice();
    for (let s = 0; s < targetCount; s += 1) {
      const wanted = (s / (targetCount - 1)) * total;
      let walked = 0;
      for (let i = 1; i < points.length; i += 1) {
        const len = lengths[i - 1];
        if (walked + len >= wanted) {
          const t = len ? (wanted - walked) / len : 0;
          sampled.push({
            x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
            y: points[i - 1].y + (points[i].y - points[i - 1].y) * t
          });
          break;
        }
        walked += len;
      }
    }
    return sampled;
  }

  function nearest(point, points) {
    let best = { dist: Infinity, index: 0 };
    points.forEach((candidate, index) => {
      const dist = distance(point, candidate);
      if (dist < best.dist) best = { dist, index };
    });
    return best;
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function pathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) total += distance(points[i - 1], points[i]);
    return total;
  }

  function smoothness(points) {
    if (points.length < 4) return 1;
    let sharpTurns = 0;
    let measured = 0;
    for (let i = 2; i < points.length; i += 2) {
      const a = points[i - 2];
      const b = points[i - 1];
      const c = points[i];
      const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
      const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
      const diff = Math.abs(Math.atan2(Math.sin(angle2 - angle1), Math.cos(angle2 - angle1)));
      if (diff > 1.15) sharpTurns += 1;
      measured += 1;
    }
    return clamp(1 - sharpTurns / Math.max(measured, 1), 0, 1);
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function colorForRating(rating) {
    if (rating === "blue") return colors.blue;
    if (rating === "green") return colors.green;
    if (rating === "sloppy") return colors.sloppy;
    return colors.guide;
  }

  function ratingLabel(rating) {
    if (rating === "blue") return "Perfect";
    if (rating === "green") return "Completed";
    if (rating === "sloppy") return "Sloppy";
    return "Open";
  }

  function setFeedback(text, rating) {
    dom.feedbackPill.textContent = text;
    dom.feedbackPill.className = `feedback-pill ${rating || ""}`;
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `wilson-cursive-progress-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("Backup exported");
  }

  function importProgress(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        mergeImportedState(incoming);
        saveState();
        renderAll();
        setFeedback("Backup imported", "green");
      } catch {
        setFeedback("Import did not work");
      }
      dom.importFile.value = "";
    };
    reader.readAsText(file);
  }

  function mergeImportedState(incoming) {
    if (!incoming || typeof incoming !== "object") return;
    if (incoming.players && typeof incoming.players === "object") {
      Object.values(incoming.players).forEach((player) => {
        if (!player || !player.name) return;
        const existing = findPlayerByName(player.name);
        if (!existing) {
          state.players[player.id || makePlayer(player.name).id] = normalizeImportedPlayer(player);
          return;
        }
        existing.totalPoints = Math.max(existing.totalPoints || 0, player.totalPoints || 0);
        existing.allTimeStreak = Math.max(existing.allTimeStreak || 0, player.allTimeStreak || 0);
        existing.letters = mergeLetterStats(existing.letters || {}, player.letters || {});
        existing.updatedAt = new Date().toISOString();
      });
    }
    const seen = new Set(state.history.map((entry) => entry.id));
    if (Array.isArray(incoming.history)) {
      incoming.history.forEach((entry) => {
        if (entry && entry.id && !seen.has(entry.id)) state.history.push(entry);
      });
    }
    state.history = state.history.slice(-3000);
  }

  function normalizeImportedPlayer(player) {
    return {
      ...makePlayer(player.name),
      ...player,
      letters: player.letters || {},
      totalPoints: player.totalPoints || 0
    };
  }

  function mergeLetterStats(current, incoming) {
    const merged = { ...current };
    Object.keys(incoming).forEach((letter) => {
      const a = merged[letter] || {};
      const b = incoming[letter] || {};
      merged[letter] = {
        points: Math.max(a.points || 0, b.points || 0),
        attempts: Math.max(a.attempts || 0, b.attempts || 0),
        bestScore: Math.max(a.bestScore || 0, b.bestScore || 0),
        completedStrokes: Math.max(a.completedStrokes || 0, b.completedStrokes || 0),
        perfectStrokes: Math.max(a.perfectStrokes || 0, b.perfectStrokes || 0),
        greenStrokes: Math.max(a.greenStrokes || 0, b.greenStrokes || 0),
        sloppyStrokes: Math.max(a.sloppyStrokes || 0, b.sloppyStrokes || 0),
        mastered: Boolean(a.mastered || b.mastered),
        lastPlayed: [a.lastPlayed, b.lastPlayed].filter(Boolean).sort().pop() || ""
      };
    });
    return merged;
  }

  function openTeacherReport() {
    const lines = [];
    Object.values(state.players)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((player) => {
        const mastered = alphabet.filter((letter) => player.letters[letter]?.mastered);
        const needs = alphabet
          .map((letter) => ({ letter, stats: player.letters[letter] || {} }))
          .sort((a, b) => (a.stats.bestScore || 0) - (b.stats.bestScore || 0))
          .slice(0, 5)
          .map((item) => item.letter)
          .join(", ");
        lines.push(`${player.name}`);
        lines.push(`  Total points: ${player.totalPoints || 0}`);
        lines.push(`  Mastered letters: ${mastered.length ? mastered.join(", ") : "none yet"}`);
        lines.push(`  Review next: ${needs || "a, b, c"}`);
        lines.push("");
      });
    dom.reportText.textContent = lines.join("\n");
    dom.reportDialog.showModal();
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "player";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
