(() => {
  "use strict";

  const STORAGE_KEY = "wilsonSyllableSlice.v1";
  const HUB_STORAGE_KEY = "teachTodayGameHub.v1";
  const GAME_ID = "syllableSlice";
  const BASE_TIME = 10500;
  const milestones = [250, 750, 1500, 3000, 5500, 9000, 14000];
  const vowels = new Set(["a", "e", "i", "o", "u"]);
  const prefixes = ["trans", "non", "mis", "mid", "un"];

  const syllableKey = {
    "sit-up": ["sit", "up"], zigzag: ["zig", "zag"], checkup: ["check", "up"], pigpen: ["pig", "pen"], "well-lit": ["well", "lit"], chitchat: ["chit", "chat"], tomcat: ["tom", "cat"], kickball: ["kick", "ball"], suntan: ["sun", "tan"], cutoff: ["cut", "off"], upwell: ["up", "well"], laptop: ["lap", "top"], sunbath: ["sun", "bath"], "red-hot": ["red", "hot"], dishpan: ["dish", "pan"], "mix-up": ["mix", "up"], "check-in": ["check", "in"], tidbit: ["tid", "bit"], codfish: ["cod", "fish"], catnip: ["cat", "nip"], hotshot: ["hot", "shot"], "pop-up": ["pop", "up"], bathtub: ["bath", "tub"], nutshell: ["nut", "shell"], backpack: ["back", "pack"], gumball: ["gum", "ball"], duckbill: ["duck", "bill"], hilltop: ["hill", "top"], hatbox: ["hat", "box"], sunfish: ["sun", "fish"],
    napkins: ["nap", "kins"], muffins: ["muf", "fins"], packets: ["pack", "ets"], dishpans: ["dish", "pans"], mascots: ["mas", "cots"], pedals: ["ped", "als"], sunbaths: ["sun", "baths"], unpegs: ["un", "pegs"], nickels: ["nick", "els"], mittens: ["mit", "tens"], bathtubs: ["bath", "tubs"], pigpens: ["pig", "pens"], bedbugs: ["bed", "bugs"], rackets: ["rack", "ets"], kennels: ["ken", "nels"], helmets: ["hel", "mets"], unzips: ["un", "zips"], puppets: ["pup", "pets"], cobwebs: ["cob", "webs"], hotdogs: ["hot", "dogs"], tomcats: ["tom", "cats"], lapdogs: ["lap", "dogs"], salads: ["sal", "ads"], hiccups: ["hic", "cups"], lemons: ["lem", "ons"], backpacks: ["back", "packs"], untacks: ["un", "tacks"], ribbons: ["rib", "bons"], lockets: ["lock", "ets"],
    kickoff: ["kick", "off"], catfish: ["cat", "fish"], sunset: ["sun", "set"], fishnet: ["fish", "net"], sunup: ["sun", "up"], shellfish: ["shell", "fish"], lapdog: ["lap", "dog"], within: ["with", "in"], uphill: ["up", "hill"], tiptop: ["tip", "top"], bedbug: ["bed", "bug"], sunlit: ["sun", "lit"], puffball: ["puff", "ball"], catnap: ["cat", "nap"], public: ["pub", "lic"], index: ["in", "dex"], attic: ["at", "tic"], mascot: ["mas", "cot"], muffin: ["muf", "fin"], rubbish: ["rub", "bish"], napkin: ["nap", "kin"], nutmeg: ["nut", "meg"], publish: ["pub", "lish"], rabbit: ["rab", "bit"], suffix: ["suf", "fix"], cobweb: ["cob", "web"], picnic: ["pic", "nic"], metric: ["met", "ric"], until: ["un", "til"], tennis: ["ten", "nis"], hiccup: ["hic", "cup"], upset: ["up", "set"], album: ["al", "bum"], victim: ["vic", "tim"], discuss: ["dis", "cuss"], shamrock: ["sham", "rock"],
    cabin: ["cab", "in"], solid: ["sol", "id"], rapid: ["rap", "id"], punish: ["pun", "ish"], upon: ["up", "on"], topic: ["top", "ic"], visit: ["vis", "it"], habit: ["hab", "it"], polish: ["pol", "ish"], edit: ["ed", "it"], medic: ["med", "ic"], satin: ["sat", "in"], panic: ["pan", "ic"], finish: ["fin", "ish"], robin: ["rob", "in"], limit: ["lim", "it"], axis: ["ax", "is"], exam: ["ex", "am"], common: ["com", "mon"], seven: ["sev", "en"], model: ["mod", "el"], signal: ["sig", "nal"], custom: ["cus", "tom"], fossil: ["fos", "sil"], atom: ["at", "om"], kitten: ["kit", "ten"], canyon: ["can", "yon"], seldom: ["sel", "dom"], happen: ["hap", "pen"], mental: ["men", "tal"], tunnel: ["tun", "nel"], cotton: ["cot", "ton"], novel: ["nov", "el"], level: ["lev", "el"], wagon: ["wag", "on"], sudden: ["sud", "den"], button: ["but", "ton"], lesson: ["les", "son"], camel: ["cam", "el"], method: ["meth", "od"], bottom: ["bot", "tom"], chicken: ["chick", "en"], mammal: ["mam", "mal"], vessel: ["ves", "sel"], wisdom: ["wis", "dom"], cannon: ["can", "non"], linen: ["lin", "en"], channel: ["chan", "nel"],
    rocket: ["rock", "et"], packet: ["pack", "et"], ticket: ["tick", "et"], helmet: ["hel", "met"], basket: ["bas", "ket"], tablet: ["tab", "let"], pocket: ["pock", "et"], jacket: ["jack", "et"], bucket: ["buck", "et"], puppet: ["pup", "pet"], magnet: ["mag", "net"], nugget: ["nug", "get"], locket: ["lock", "et"], velvet: ["vel", "vet"], racket: ["rack", "et"], pedal: ["ped", "al"], gallon: ["gal", "lon"], melon: ["mel", "on"], lemon: ["lem", "on"], sandal: ["san", "dal"], falcon: ["fal", "con"], panel: ["pan", "el"], salad: ["sal", "ad"], ribbon: ["rib", "bon"],
    buttons: ["but", "tons"], wagons: ["wag", "ons"], lessons: ["les", "sons"], models: ["mod", "els"], magnets: ["mag", "nets"], tunnels: ["tun", "nels"], linens: ["lin", "ens"], pockets: ["pock", "ets"], metals: ["met", "als"], baskets: ["bas", "kets"], commons: ["com", "mons"], jackets: ["jack", "ets"], levels: ["lev", "els"], camels: ["cam", "els"], cannons: ["can", "nons"], buckets: ["buck", "ets"], mammals: ["mam", "mals"], tickets: ["tick", "ets"], chickens: ["chick", "ens"], canyons: ["can", "yons"], happens: ["hap", "pens"], methods: ["meth", "ods"], signals: ["sig", "nals"], rockets: ["rock", "ets"], fossils: ["fos", "sils"], kittens: ["kit", "tens"], channels: ["chan", "nels"], medals: ["med", "als"], atoms: ["at", "oms"], novels: ["nov", "els"],
    midship: ["mid", "ship"], nonfat: ["non", "fat"], unlock: ["un", "lock"], unpack: ["un", "pack"], unman: ["un", "man"], nonfan: ["non", "fan"], unpin: ["un", "pin"], misluck: ["mis", "luck"], undid: ["un", "did"], unbox: ["un", "box"], undock: ["un", "dock"], uncut: ["un", "cut"], unfit: ["un", "fit"], transfix: ["trans", "fix"], miscall: ["mis", "call"], misled: ["mis", "led"], unwell: ["un", "well"], unset: ["un", "set"], uncap: ["un", "cap"], midleg: ["mid", "leg"], unmix: ["un", "mix"], unlit: ["un", "lit"], unfix: ["un", "fix"], misfit: ["mis", "fit"], nontax: ["non", "tax"], unshut: ["un", "shut"], unwed: ["un", "wed"], unwish: ["un", "wish"], unfed: ["un", "fed"],
    setback: ["set", "back"], potluck: ["pot", "luck"], "well-off": ["well", "off"], singsong: ["sing", "song"], backup: ["back", "up"], billfish: ["bill", "fish"], "rip-off": ["rip", "off"], batfish: ["bat", "fish"], kickback: ["kick", "back"], mothball: ["moth", "ball"], pinball: ["pin", "ball"], "hush-hush": ["hush", "hush"], pillbox: ["pill", "box"], "run-off": ["run", "off"], backlog: ["back", "log"], "toss-up": ["toss", "up"], offset: ["off", "set"], mockup: ["mock", "up"], cutback: ["cut", "back"], pitfall: ["pit", "fall"], "shut-off": ["shut", "off"], "run-on": ["run", "on"], whiplash: ["whip", "lash"], ramrod: ["ram", "rod"], tenpin: ["ten", "pin"], bellhop: ["bell", "hop"], rockfish: ["rock", "fish"], pickax: ["pick", "ax"], "tip-off": ["tip", "off"], ashcan: ["ash", "can"],
    summit: ["sum", "mit"], optic: ["op", "tic"], humbug: ["hum", "bug"], pastel: ["pas", "tel"], peptic: ["pep", "tic"], bandit: ["ban", "dit"], lentil: ["len", "til"], gossip: ["gos", "sip"], pallid: ["pal", "lid"], quintet: ["quin", "tet"], pundit: ["pun", "dit"], coffin: ["cof", "fin"], cosmic: ["cos", "mic"], vanquish: ["van", "quish"], ethnic: ["eth", "nic"], rustic: ["rus", "tic"], mantis: ["man", "tis"], puffin: ["puf", "fin"], ransack: ["ran", "sack"], tactic: ["tac", "tic"], bobcat: ["bob", "cat"], pulpit: ["pul", "pit"], gimmick: ["gim", "mick"], pepsin: ["pep", "sin"], hamlet: ["ham", "let"], hectic: ["hec", "tic"], septic: ["sep", "tic"], fabric: ["fab", "ric"], candid: ["can", "did"], limpid: ["lim", "pid"],
    banish: ["ban", "ish"], epic: ["ep", "ic"], timid: ["tim", "id"], mimic: ["mim", "ic"], vivid: ["viv", "id"], famish: ["fam", "ish"], toxin: ["tox", "in"], relish: ["rel", "ish"], vapid: ["vap", "id"], relic: ["rel", "ic"], avid: ["av", "id"], gothic: ["goth", "ic"], manic: ["man", "ic"], vomit: ["vom", "it"], fetid: ["fet", "id"], tonic: ["ton", "ic"], radish: ["rad", "ish"], tepid: ["tep", "id"], valid: ["val", "id"], sipid: ["sip", "id"], livid: ["liv", "id"], vanish: ["van", "ish"], login: ["log", "in"], comic: ["com", "ic"], ethic: ["eth", "ic"], rabid: ["rab", "id"], canid: ["can", "id"], sonic: ["son", "ic"], debit: ["deb", "it"], lavish: ["lav", "ish"],
    padlocks: ["pad", "locks"], mimics: ["mim", "ics"], comics: ["com", "ics"], tactics: ["tac", "tics"], ethics: ["eth", "ics"], pitfalls: ["pit", "falls"], puffins: ["puf", "fins"], offsets: ["off", "sets"], "mock-ups": ["mock", "ups"], epics: ["ep", "ics"], kickbacks: ["kick", "backs"], relics: ["rel", "ics"], bandits: ["ban", "dits"], toxins: ["tox", "ins"], gossips: ["gos", "sips"], bobbins: ["bob", "bins"], bobcats: ["bob", "cats"], mothballs: ["moth", "balls"], optics: ["op", "tics"], rockfalls: ["rock", "falls"], banquets: ["ban", "quets"], pundits: ["pun", "dits"], setbacks: ["set", "backs"],
    tendon: ["ten", "don"], funnel: ["fun", "nel"], ransom: ["ran", "som"], hammock: ["ham", "mock"], mussel: ["mus", "sel"], reckon: ["reck", "on"], sullen: ["sul", "len"], ravel: ["rav", "el"], tonsil: ["ton", "sil"], callus: ["cal", "lus"], nexus: ["nex", "us"], shallot: ["shal", "lot"], jackal: ["jack", "al"], mammoth: ["mam", "moth"], campus: ["cam", "pus"], gallop: ["gal", "lop"], beckon: ["beck", "on"], chisel: ["chis", "el"], revel: ["rev", "el"], fennel: ["fen", "nel"], vandal: ["van", "dal"], pixel: ["pix", "el"], menthol: ["men", "thol"], hummus: ["hum", "mus"], random: ["ran", "dom"], haddock: ["had", "dock"], bishop: ["bish", "op"], ballot: ["bal", "lot"], sultan: ["sul", "tan"],
    talon: ["tal", "on"], havoc: ["hav", "oc"], atlas: ["at", "las"], axel: ["ax", "el"], anthem: ["an", "them"], magnum: ["mag", "num"], summon: ["sum", "mon"], felon: ["fel", "on"], canvas: ["can", "vas"], chapel: ["chap", "el"], tassel: ["tas", "sel"], talcum: ["tal", "cum"], fungus: ["fun", "gus"], pivot: ["piv", "ot"], paddock: ["pad", "dock"], bedlam: ["bed", "lam"], litmus: ["lit", "mus"], rascal: ["ras", "cal"], tinsel: ["tin", "sel"], bigot: ["big", "ot"], linden: ["lin", "den"], mutton: ["mut", "ton"], fathom: ["fath", "om"], gamut: ["gam", "ut"], midden: ["mid", "den"], shellac: ["shel", "lac"],
    sonnet: ["son", "net"], rivet: ["riv", "et"], picket: ["pick", "et"], junket: ["junk", "et"], pellet: ["pel", "let"], poppet: ["pop", "pet"], russet: ["rus", "set"], musket: ["mus", "ket"], goblet: ["gob", "let"], socket: ["sock", "et"], thicket: ["thick", "et"], mallet: ["mal", "let"], gullet: ["gul", "let"], comet: ["com", "et"], casket: ["cask", "et"], pallet: ["pal", "let"], bonnet: ["bon", "net"], gasket: ["gas", "ket"], sextet: ["sex", "tet"], mullet: ["mul", "let"], cutlet: ["cut", "let"], tenet: ["ten", "et"], banquet: ["ban", "quet"], basset: ["bas", "set"], signet: ["sig", "net"],
    cactus: ["cac", "tus"], finishes: ["fin", "ish", "es"], punishes: ["pun", "ish", "es"], publishes: ["pub", "lish", "es"], suffixes: ["suf", "fix", "es"], indexes: ["in", "dex", "es"], transfixes: ["trans", "fix", "es"], polishes: ["pol", "ish", "es"], unboxes: ["un", "box", "es"], lavishes: ["lav", "ish", "es"], radishes: ["rad", "ish", "es"], relishes: ["rel", "ish", "es"], vanishes: ["van", "ish", "es"], banishes: ["ban", "ish", "es"], witnesses: ["wit", "ness", "es"], campuses: ["cam", "pus", "es"], calluses: ["cal", "lus", "es"], vanquishes: ["van", "quish", "es"]
  };

  const dom = {
    playerInitials: document.querySelector("#playerInitials"),
    playerName: document.querySelector("#playerName"),
    totalPoints: document.querySelector("#totalPoints"),
    roundLevel: document.querySelector("#roundLevel"),
    prompt: document.querySelector("#prompt"),
    timerFill: document.querySelector("#timerFill"),
    wordStage: document.querySelector("#wordStage"),
    wordTrack: document.querySelector("#wordTrack"),
    scoopLayer: document.querySelector("#scoopLayer"),
    scoopModeBtn: document.querySelector("#scoopModeBtn"),
    cutModeBtn: document.querySelector("#cutModeBtn"),
    clearBtn: document.querySelector("#clearBtn"),
    checkBtn: document.querySelector("#checkBtn"),
    streakCount: document.querySelector("#streakCount"),
    roundPoints: document.querySelector("#roundPoints"),
    milestoneLabel: document.querySelector("#milestoneLabel"),
    roadFill: document.querySelector("#roadFill"),
    roadDots: document.querySelector("#roadDots"),
    toast: document.querySelector("#toast")
  };

  let state = loadState();
  let round = null;
  let timerId = 0;
  let toastTimer = 0;
  let nextRoundTimer = 0;
  let drag = null;
  const words = buildWordBank();

  init();

  function init() {
    restorePlayer();
    renderRoadDots();
    bindEvents();
    nextRound();
  }

  function bindEvents() {
    dom.clearBtn.addEventListener("click", () => {
      round.scoops = [];
      round.selected = [];
      renderRound();
    });
    dom.checkBtn.addEventListener("click", checkAnswer);
    dom.scoopModeBtn.addEventListener("click", () => setMode("scoop"));
    dom.cutModeBtn.addEventListener("click", () => setMode("cut"));
    dom.scoopLayer.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  function buildWordBank() {
    const source = window.readerWordlists?.["3.1"] || {};
    const raw = Object.values(source).flatMap((section) => Object.values(section).flat());
    const unique = [...new Set(raw)].filter((word) => syllableKey[word]);
    const base = unique.map((word) => makeEntry(word, syllableKey[word]));
    return base.length ? base : Object.entries(syllableKey).map(([word, parts]) => makeEntry(word, parts));
  }

  function makeEntry(word, parts) {
    const affixes = affixRanges(word, parts);
    const suffix = affixes.find((item) => item.type === "suffix");
    const suffixLength = suffix ? suffix.end - suffix.start : 0;
    const syllableEnd = word.length - suffixLength;
    const playParts = suffix ? partsWithoutSuffix(parts, word.slice(suffix.start, suffix.end)) : [...parts];
    const gaps = [];
    let cursor = 0;
    playParts.slice(0, -1).forEach((part) => {
      cursor += part.length;
      gaps.push(cursor);
    });
    return {
      word,
      parts: playParts,
      gaps,
      affixes,
      syllableEnd,
      level: playParts.length > 2 ? "Boss round" : "Reader 3.1"
    };
  }

  function nextRound() {
    clearInterval(timerId);
    clearTimeout(nextRoundTimer);
    const pool = words.filter((entry) => {
      if (entry.parts.length === 2) return true;
      return state.streak >= 5 || state.totalPoints >= 750;
    });
    const recent = state.recentWords || [];
    const choices = pool.filter((entry) => !recent.includes(entry.word));
    const selected = choices.length ? choices : pool;
    const entry = selected[Math.floor(Math.random() * selected.length)];
    const needed = entry.parts.length - 1;
    const timeLimit = Math.max(6200, BASE_TIME - Math.min(2800, state.streak * 190) - (needed > 1 ? 900 : 0));
    round = {
      ...entry,
      needed,
      selected: [],
      scoops: [],
      startedAt: performance.now(),
      timeLimit,
      timeLeft: timeLimit,
      checked: false,
      reveal: false,
      wasCorrect: false
    };
    state.recentWords = [entry.word, ...recent.filter((word) => word !== entry.word)].slice(0, 14);
    saveState();
    renderRound();
    startTimer();
  }

  function renderRound() {
    if (!round) return;
    dom.playerInitials.textContent = initials(state.playerName);
    dom.playerName.textContent = state.playerName;
    dom.totalPoints.textContent = state.totalPoints;
    dom.streakCount.textContent = state.streak;
    dom.roundPoints.textContent = state.lastPoints ? `+${state.lastPoints}` : "+0";
    dom.roundLevel.textContent = round.level;
    dom.prompt.textContent = state.mode === "cut"
      ? `Cut ${titleWord(round.word)} into ${round.parts.length} syllables!`
      : `Scoop ${titleWord(round.word)} into ${round.parts.length} syllables!`;
    dom.checkBtn.textContent = state.mode === "cut" ? "Tap a Cut" : "Scoop";
    dom.wordStage.dataset.mode = state.mode;
    dom.scoopModeBtn.setAttribute("aria-pressed", String(state.mode === "scoop"));
    dom.cutModeBtn.setAttribute("aria-pressed", String(state.mode === "cut"));
    dom.wordTrack.style.setProperty("--slot-count", round.word.length);
    dom.wordTrack.innerHTML = [...round.word].map((char, index) => {
      const gap = index + 1;
      const hasGap = index < round.word.length - 1;
      const classes = ["gap-target"];
      if (round.selected.includes(gap)) classes.push("selected");
      if (round.reveal && round.gaps.includes(gap)) classes.push("correct");
      if ((round.reveal || round.tryWrong) && round.wasCorrect === false && round.selected.includes(gap) && !round.gaps.includes(gap)) classes.push("wrong");
      const tileClasses = ["letter-tile"];
      if (char === "-") tileClasses.push("is-hyphen");
      if (round.reveal && round.wasCorrect && index < round.syllableEnd) tileClasses.push("is-syllable-correct", `syllable-${syllableIndexFor(index) % 4}`);
      if (round.reveal && round.wasCorrect && round.gaps.includes(index)) tileClasses.push("starts-syllable");
      if (round.reveal && round.wasCorrect && round.gaps.includes(gap)) tileClasses.push("ends-syllable");
      const affix = affixTypeFor(index);
      if (affix) tileClasses.push(`is-${affix}`);
      const letterClasses = ["letter-char"];
      if (vowels.has(char.toLowerCase())) letterClasses.push("is-vowel");
      return `
        <div class="${tileClasses.join(" ")}" data-letter-index="${index}">
          <span class="${letterClasses.join(" ")}">${escapeHtml(char)}</span>
          ${hasGap ? `<button class="${classes.join(" ")}" type="button" data-gap="${gap}" aria-label="Cut after ${escapeHtml(char)}"></button>` : ""}
        </div>
      `;
    }).join("");
    dom.wordTrack.querySelectorAll(".gap-target").forEach((button) => {
      button.addEventListener("click", () => chooseCut(Number(button.dataset.gap)));
    });
    renderScoops();
    if (round.reveal) {
      dom.scoopLayer.insertAdjacentHTML("beforeend", `
        <foreignObject x="80" y="82" width="840" height="62">
          <div class="syllable-reveal" aria-label="Correct syllables" xmlns="http://www.w3.org/1999/xhtml">
          ${round.parts.map((part) => `<span>${decoratePart(part)}</span>`).join("")}
          </div>
        </foreignObject>
      `);
      return updateProgress();
    }
    updateProgress();
  }

  function startDrag(event) {
    if (round.checked || state.mode !== "scoop") return;
    dom.scoopLayer.setPointerCapture(event.pointerId);
    const point = scoopPoint(event);
    drag = { pointerId: event.pointerId, points: [point] };
    renderScoops();
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.points.push(scoopPoint(event));
    renderScoops();
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.points.push(scoopPoint(event));
    commitScoop(drag.points);
    drag = null;
    if (state.mode === "scoop") {
      const correct = scoopsAreCorrect();
      if (correct) {
        round.selected = round.gaps;
        round.checked = true;
        clearInterval(timerId);
        round.reveal = true;
        round.wasCorrect = true;
        awardRound();
        return;
      }
      if (round.selected.length >= round.needed) {
        retryScoop();
        return;
      }
    }
    renderRound();
  }

  function checkAnswer() {
    if (!round || round.checked) return;
    const correct = state.mode === "cut" ? arraysEqual(round.selected, round.gaps) : scoopsAreCorrect();
    if (state.mode === "scoop" && round.scoops.length < 1) {
      showToast("Draw a scoop under the word.");
      return;
    }
    if (state.mode === "cut" && round.selected.length !== round.needed) {
      showToast(round.needed === 1 ? "Choose 1 cut point." : `Choose ${round.needed} cut points.`);
      return;
    }
    if (state.mode === "scoop" && !correct) {
      retryScoop();
      return;
    }
    if (state.mode === "scoop" && correct) round.selected = round.gaps;
    round.checked = true;
    clearInterval(timerId);
    round.reveal = true;
    round.wasCorrect = correct;
    if (correct) awardRound();
    else missRound();
  }

  function chooseCut(gap) {
    if (round.checked || state.mode !== "cut" || gap < 1 || gap >= round.word.length) return;
    round.selected = [gap];
    if (round.needed > 1 && round.selected.length < round.needed) {
      renderRound();
      showToast(`Choose ${round.needed} cut points.`);
      return;
    }
    if (arraysEqual(round.selected, round.gaps)) {
      round.checked = true;
      clearInterval(timerId);
      round.reveal = true;
      round.wasCorrect = true;
      awardRound();
      return;
    }
    retryCut();
  }

  function awardRound() {
    const elapsed = performance.now() - round.startedAt;
    const speedRatio = Math.max(0, 1 - elapsed / round.timeLimit);
    const base = 120 * round.parts.length;
    const speed = Math.round(260 * speedRatio);
    const streakBonus = Math.min(600, state.streak * 45);
    const boss = round.parts.length > 2 ? 350 : 0;
    const points = base + speed + streakBonus + boss;
    state.totalPoints += points;
    state.lastPoints = points;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
    saveState();
    addHubPoints(points, { word: round.word, parts: round.parts });
    renderRound();
    celebrate(points);
    scheduleNextRound(3100);
  }

  function missRound() {
    state.lastPoints = 25;
    state.totalPoints += 25;
    state.streak = 0;
    saveState();
    addHubPoints(25, { word: round.word, miss: true });
    renderRound();
    dom.wordStage.classList.remove("shake");
    void dom.wordStage.offsetWidth;
    dom.wordStage.classList.add("shake");
    showToast(`${round.parts.join(" • ")}   +25 try points`);
    scheduleNextRound(2200);
  }

  function retryScoop() {
    clearInterval(timerId);
    state.lastPoints = 0;
    state.streak = 0;
    saveState();
    round.checked = true;
    round.reveal = false;
    round.wasCorrect = false;
    round.tryWrong = true;
    renderRound();
    dom.wordStage.classList.remove("shake");
    void dom.wordStage.offsetWidth;
    dom.wordStage.classList.add("shake");
    showToast("Not yet. Try the scoop break again.");
    setTimeout(() => {
      if (!round || round.reveal) return;
      round.scoops = [];
      round.selected = [];
      round.checked = false;
      round.tryWrong = false;
      renderRound();
      startTimer();
    }, 1150);
  }

  function retryCut() {
    clearInterval(timerId);
    state.lastPoints = 0;
    state.streak = 0;
    saveState();
    round.checked = true;
    round.reveal = false;
    round.wasCorrect = false;
    round.tryWrong = true;
    renderRound();
    dom.wordStage.classList.remove("shake");
    void dom.wordStage.offsetWidth;
    dom.wordStage.classList.add("shake");
    showToast("Not there. Try the cut again.");
    setTimeout(() => {
      if (!round || round.reveal) return;
      round.selected = [];
      round.checked = false;
      round.tryWrong = false;
      renderRound();
      startTimer();
    }, 1050);
  }

  function celebrate(points) {
    dom.wordStage.classList.remove("burst");
    void dom.wordStage.offsetWidth;
    dom.wordStage.classList.add("burst");
    const next = nextMilestone(state.totalPoints - points);
    const crossed = state.totalPoints >= next && state.totalPoints - points < next;
    showToast(crossed ? `Milestone ${next}! +${points}` : `${round.parts.join(" • ")}   +${points}`);
  }

  function startTimer() {
    updateProgress();
    timerId = setInterval(() => {
      round.timeLeft = Math.max(0, round.timeLimit - (performance.now() - round.startedAt));
      updateProgress();
      if (round.timeLeft <= 0) {
        clearInterval(timerId);
        if (!round.checked) checkTimeout();
      }
    }, 80);
  }

  function checkTimeout() {
    round.checked = true;
    state.lastPoints = 10;
    state.totalPoints += 10;
    state.streak = 0;
    saveState();
    addHubPoints(10, { word: round.word, timeout: true });
    showToast(`Time! ${round.parts.join(" • ")}   +10`);
    scheduleNextRound(1350);
  }

  function scheduleNextRound(delay) {
    clearTimeout(nextRoundTimer);
    nextRoundTimer = setTimeout(nextRound, delay);
  }

  function updateProgress() {
    if (!round) return;
    const timePercent = Math.max(0, Math.min(1, round.timeLeft / round.timeLimit));
    dom.timerFill.style.transform = `scaleX(${timePercent})`;
    const next = nextMilestone(state.totalPoints);
    const prev = previousMilestone(state.totalPoints);
    const span = next - prev || 1;
    dom.milestoneLabel.textContent = next;
    dom.roadFill.style.width = `${Math.min(100, ((state.totalPoints - prev) / span) * 100)}%`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 1100);
  }

  function renderRoadDots() {
    dom.roadDots.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";
  }

  function renderScoops() {
    const drawn = round.scoops.map((scoop, index) => scoopPathMarkup(scoop, index, "drawn"));
    const active = drag ? `<path class="scoop-path active" d="${pointsToPath(drag.points)}"></path>` : "";
    const correct = round.reveal ? correctScoopMarkup() : "";
    const labels = round.reveal && round.wasCorrect ? syllableLabelMarkup() : "";
    const breaks = state.mode === "scoop" ? scoopBreakMarkup() : "";
    dom.scoopLayer.innerHTML = `
      <rect class="scoop-catch" x="0" y="0" width="1000" height="150"></rect>
      ${correct}
      ${drawn.join("")}
      ${active}
      ${breaks}
      ${labels}
    `;
    updateTouchedLetters();
  }

  function scoopPoint(event) {
    const rect = dom.scoopLayer.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000)),
      y: Math.max(0, Math.min(150, ((event.clientY - rect.top) / rect.height) * 150))
    };
  }

  function commitScoop(points) {
    if (points.length < 2) return;
    round.tryWrong = false;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const startX = Math.min(...xs);
    const endX = Math.max(...xs);
    const depth = Math.max(...ys) - Math.min(...ys);
    const start = xToBoundary(startX);
    const end = xToBoundary(endX);
    if (end - start < 1 || depth < 14) {
      showToast("Make a full scoop under a syllable.");
      return;
    }
    const simplified = simplifyPoints(points);
    round.scoops = [...round.scoops, { start, end, points: simplified, breaks: inferBreaks(simplified) }]
      .sort((a, b) => a.start - b.start || a.end - b.end)
      .slice(-round.parts.length);
    round.selected = selectedBreaksFromScoops();
  }

  function scoopsAreCorrect() {
    const spans = correctSpans();
    const touched = allTouchedLetters();
    if (!touched.size) return false;
    const selected = selectedBreaksFromScoops();
    round.selected = selected;
    return arraysEqual(selected, round.gaps) && spans.every((span) => spanIsTouched(span, touched));
  }

  function correctSpans() {
    const boundaries = [0, ...round.gaps, round.syllableEnd];
    return boundaries.slice(0, -1).map((start, index) => ({ start, end: boundaries[index + 1] }));
  }

  function spanIsTouched(span, touched) {
    const targetLetters = [];
    for (let letter = span.start; letter < span.end; letter += 1) targetLetters.push(letter);
    const hits = targetLetters.filter((letter) => touched.has(letter)).length;
    const neededHits = Math.max(1, Math.ceil(targetLetters.length * 0.34));
    return hits >= neededHits;
  }

  function allTouchedLetters() {
    const touched = new Set();
    round.scoops.forEach((scoop) => {
      touchedLetters(scoop).forEach((letter) => touched.add(letter));
    });
    if (drag) {
      touchedLetters({ points: drag.points }).forEach((letter) => touched.add(letter));
    }
    return touched;
  }

  function updateTouchedLetters() {
    const touched = state.mode === "scoop" && !round.reveal ? allTouchedLetters() : new Set();
    const selected = state.mode === "scoop" && !round.reveal ? selectedBreaksFromScoops() : [];
    dom.wordTrack.querySelectorAll(".letter-tile").forEach((tile) => {
      const index = Number(tile.dataset.letterIndex);
      const touchedNow = touched.has(index);
      const liveSyllable = liveSyllableIndex(index, selected);
      tile.classList.toggle("is-scoop-touched", touchedNow);
      tile.classList.toggle("is-scoop-syllable-0", touchedNow && liveSyllable === 0);
      tile.classList.toggle("is-scoop-syllable-1", touchedNow && liveSyllable === 1);
      tile.classList.toggle("is-scoop-syllable-2", touchedNow && liveSyllable === 2);
      tile.classList.toggle("is-scoop-syllable-3", touchedNow && liveSyllable === 3);
    });
    dom.wordTrack.querySelectorAll(".gap-target").forEach((gap) => {
      gap.classList.toggle("selected", selected.includes(Number(gap.dataset.gap)));
    });
  }

  function liveSyllableIndex(letterIndex, selected) {
    if (letterIndex >= round.syllableEnd) return -1;
    const boundaries = [0, ...selected, round.syllableEnd].sort((a, b) => a - b);
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      if (letterIndex >= boundaries[index] && letterIndex < boundaries[index + 1]) return index;
    }
    return 0;
  }

  function touchedLetters(scoop) {
    const touched = new Set();
    const letterWidth = 1000 / round.word.length;
    scoop.points.forEach((point) => {
      const letter = Math.max(0, Math.min(round.word.length - 1, Math.floor(point.x / letterWidth)));
      const withinLetter = point.x - letter * letterWidth;
      touched.add(letter);
      if (withinLetter < letterWidth * 0.28 && letter > 0) touched.add(letter - 1);
      if (withinLetter > letterWidth * 0.72 && letter < round.word.length - 1) touched.add(letter + 1);
    });
    return touched;
  }

  function midpoint(scoop) {
    return (boundaryToX(scoop.start) + boundaryToX(scoop.end)) / 2;
  }

  function boundariesFromScoops() {
    const starts = new Set(round.scoops.map((scoop) => scoop.start));
    const ends = new Set(round.scoops.map((scoop) => scoop.end));
    return [...ends].filter((end) => end > 0 && end < round.word.length && starts.has(end)).sort((a, b) => a - b);
  }

  function selectedBreaksFromScoops() {
    const breaks = [];
    round.scoops.forEach((scoop) => {
      (scoop.breaks || inferBreaks(scoop.points)).forEach((gap) => {
        if (gap > 0 && gap < round.syllableEnd) breaks.push(gap);
      });
    });
    if (drag) {
      inferBreaks(drag.points).forEach((gap) => {
        if (gap > 0 && gap < round.syllableEnd) breaks.push(gap);
      });
    }
    return dedupeBreaks(breaks).slice(0, round.needed).sort((a, b) => a - b);
  }

  function inferBreaks(points) {
    if (!points || points.length < 5) return [];
    const smoothed = smoothPoints(points);
    const candidates = [];
    for (let index = 2; index < smoothed.length - 2; index += 1) {
      const prev = smoothed[index - 1];
      const current = smoothed[index];
      const next = smoothed[index + 1];
      const isTopTurn = current.y <= prev.y && current.y <= next.y;
      if (!isTopTurn || current.y > 78) continue;
      const leftLow = Math.max(...smoothed.slice(Math.max(0, index - 5), index + 1).map((point) => point.y));
      const rightLow = Math.max(...smoothed.slice(index, Math.min(smoothed.length, index + 6)).map((point) => point.y));
      if (leftLow - current.y < 24 || rightLow - current.y < 24) continue;
      candidates.push({ gap: xToBoundary(current.x), lift: leftLow + rightLow - current.y * 2 });
    }
    if (!candidates.length) return [];
    return dedupeBreaks(candidates.sort((a, b) => b.lift - a.lift).map((item) => item.gap));
  }

  function smoothPoints(points) {
    return points.map((point, index) => {
      const window = points.slice(Math.max(0, index - 1), Math.min(points.length, index + 2));
      return {
        x: window.reduce((sum, item) => sum + item.x, 0) / window.length,
        y: window.reduce((sum, item) => sum + item.y, 0) / window.length
      };
    });
  }

  function dedupeBreaks(breaks) {
    const unique = [];
    breaks.forEach((gap) => {
      const clean = Math.max(1, Math.min(round.syllableEnd - 1, gap));
      if (!unique.includes(clean)) unique.push(clean);
    });
    return unique.slice(0, Math.max(1, round.needed));
  }

  function scoopBreakMarkup() {
    return selectedBreaksFromScoops().map((gap) => {
      const x = boundaryToX(gap);
      return `<g class="scoop-break"><line x1="${x}" y1="10" x2="${x}" y2="70"></line><circle cx="${x}" cy="12" r="10"></circle></g>`;
    }).join("");
  }

  function xToBoundary(x) {
    const raw = Math.round((x / 1000) * round.word.length);
    return Math.max(0, Math.min(round.word.length, raw));
  }

  function boundaryToX(boundary) {
    return (boundary / round.word.length) * 1000;
  }

  function correctScoopMarkup() {
    const boundaries = [0, ...round.gaps, round.syllableEnd];
    return boundaries.slice(0, -1).map((start, index) => {
      const scoop = { start, end: boundaries[index + 1] };
      return scoopPathMarkup(scoop, index, round.wasCorrect ? "correct" : "answer");
    }).join("");
  }

  function scoopPathMarkup(scoop, index, mode) {
    const d = scoop.points?.length ? pointsToPath(scoop.points) : spanToPath(scoop.start, scoop.end);
    return `<path class="scoop-path ${mode} scoop-${index % 4}" d="${d}"></path>`;
  }

  function syllableLabelMarkup() {
    const boundaries = [0, ...round.gaps, round.syllableEnd];
    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      const x = (boundaryToX(start) + boundaryToX(end)) / 2;
      return `
        <g class="scoop-label label-${index % 4}">
          <rect x="${x - 82}" y="72" width="164" height="34" rx="8"></rect>
          <text x="${x}" y="95">Syllable ${index + 1}</text>
        </g>
      `;
    }).join("");
  }

  function spanToPath(start, end) {
    const x1 = boundaryToX(start) + 14;
    const x2 = boundaryToX(end) - 14;
    const mid = (x1 + x2) / 2;
    return `M ${x1} 38 Q ${mid} 126 ${x2} 38`;
  }

  function pointsToPath(points) {
    if (points.length < 2) return "";
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  }

  function simplifyPoints(points) {
    const step = Math.max(1, Math.floor(points.length / 18));
    const sampled = points.filter((_, index) => index % step === 0);
    const last = points[points.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    return sampled;
  }

  function syllableIndexFor(letterIndex) {
    return round.gaps.filter((gap) => letterIndex >= gap).length;
  }

  function affixTypeFor(letterIndex) {
    const range = round.affixes.find((item) => letterIndex >= item.start && letterIndex < item.end);
    return range?.type || "";
  }

  function affixRanges(word, parts) {
    const clean = word.replace(/-/g, "");
    const ranges = [];
    const prefix = prefixes.find((item) => clean.startsWith(item) && parts[0] === item);
    if (prefix) ranges.push({ start: 0, end: prefix.length, type: "prefix" });
    const suffix = suffixFor(clean);
    if (suffix) ranges.push({ start: clean.length - suffix.length, end: clean.length, type: "suffix" });
    return ranges.map((range) => ({
      ...range,
      start: cleanIndexToWordIndex(word, range.start),
      end: cleanIndexToWordIndex(word, range.end)
    }));
  }

  function cleanIndexToWordIndex(word, cleanIndex) {
    let cleanSeen = 0;
    for (let index = 0; index < word.length; index += 1) {
      if (word[index] !== "-") {
        if (cleanSeen === cleanIndex) return index;
        cleanSeen += 1;
      }
    }
    return word.length;
  }

  function suffixFor(cleanWord) {
    if (cleanWord.endsWith("es")) {
      const base = cleanWord.slice(0, -2);
      if (syllableKey[base] || syllableKey[cleanWord.slice(0, -1)]) return "es";
    }
    if (cleanWord.endsWith("s") && syllableKey[cleanWord.slice(0, -1)]) return "s";
    return "";
  }

  function partsWithoutSuffix(parts, suffixText) {
    const suffix = suffixText.replace(/-/g, "");
    if (!suffix) return [...parts];
    const last = parts[parts.length - 1] || "";
    if (last === suffix) return parts.slice(0, -1);
    if (last.endsWith(suffix) && last.length > suffix.length) {
      return [...parts.slice(0, -1), last.slice(0, -suffix.length)];
    }
    return [...parts];
  }

  function decoratePart(part) {
    return [...part].map((char) => {
      const cls = vowels.has(char.toLowerCase()) ? " class=\"is-vowel\"" : "";
      return `<b${cls}>${escapeHtml(char)}</b>`;
    }).join("");
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    saveState();
    nextRound();
  }

  function restorePlayer() {
    const queryName = new URLSearchParams(window.location.search).get("student");
    const hubName = readHubStudentName();
    state.playerName = (queryName || hubName || state.playerName || "Player").trim();
    saveState();
    saveHubSelection();
  }

  function loadState() {
    const empty = {
      playerName: "Player",
      mode: "scoop",
      totalPoints: 0,
      streak: 0,
      bestStreak: 0,
      lastPoints: 0,
      recentWords: []
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      return { ...empty, ...saved, recentWords: Array.isArray(saved.recentWords) ? saved.recentWords : [] };
    } catch {
      return empty;
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function readHubStudentName() {
    try {
      const hub = JSON.parse(localStorage.getItem(HUB_STORAGE_KEY) || "null");
      if (!hub || !hub.activeStudentId || !hub.students) return "";
      return hub.students[hub.activeStudentId]?.name || "";
    } catch {
      return "";
    }
  }

  function saveHubSelection() {
    const hub = readHubState();
    const student = ensureHubStudent(hub, state.playerName);
    hub.activeStudentId = student.id;
    const game = ensureHubGame(hub, student.id);
    game.points = Math.max(game.points || 0, state.totalPoints || 0);
    game.lastPlayedAt = state.updatedAt || new Date().toISOString();
    saveHubState(hub);
  }

  function addHubPoints(points, detail) {
    const hub = readHubState();
    const student = ensureHubStudent(hub, state.playerName);
    hub.activeStudentId = student.id;
    student.lastPlayedAt = new Date().toISOString();
    const game = ensureHubGame(hub, student.id);
    game.points = Math.max((game.points || 0) + points, state.totalPoints || 0);
    game.sessions = (game.sessions || 0) + 1;
    game.lastPlayedAt = student.lastPlayedAt;
    hub.events.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: student.id,
      studentName: student.name,
      gameId: GAME_ID,
      points,
      detail,
      createdAt: student.lastPlayedAt
    });
    hub.events = hub.events.slice(-3000);
    saveHubState(hub);
  }

  function readHubState() {
    const empty = { version: 1, activeStudentId: "", students: {}, games: {}, events: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(HUB_STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      return {
        ...empty,
        ...saved,
        students: saved.students && typeof saved.students === "object" ? saved.students : {},
        games: saved.games && typeof saved.games === "object" ? saved.games : {},
        events: Array.isArray(saved.events) ? saved.events : []
      };
    } catch {
      return empty;
    }
  }

  function ensureHubStudent(hub, name) {
    const id = slugify(name);
    if (!hub.students[id]) {
      hub.students[id] = { id, name, createdAt: new Date().toISOString(), lastPlayedAt: "" };
    }
    return hub.students[id];
  }

  function ensureHubGame(hub, studentId) {
    hub.games[studentId] ||= {};
    hub.games[studentId][GAME_ID] ||= { points: 0, sessions: 0, lastPlayedAt: "" };
    return hub.games[studentId][GAME_ID];
  }

  function saveHubState(hub) {
    hub.updatedAt = new Date().toISOString();
    localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(hub));
  }

  function nextMilestone(points) {
    return milestones.find((mark) => mark > points) || milestones[milestones.length - 1];
  }

  function previousMilestone(points) {
    return [...milestones].reverse().find((mark) => mark <= points) || 0;
  }

  function titleWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "student";
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
})();
