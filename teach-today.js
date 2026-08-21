let ttLesson = null;
let ttChartCard = null;
let ttCardDeck = [];
let ttCardIndex = 0;
let ttCardMode = "words";
let ttSection2Deck = [];
let ttSection2Index = 0;
let ttSection2Word = "";
let ttSection2BDeck = [];
let ttSection2BIndex = 0;
let ttSection2BWord = "";
let ttHfwDeck = [];
let ttHfwIndex = 0;
let ttNotesEnabled = false;
let ttNotesDrawing = false;
let ttNotesLastPoint = null;
let ttWhiteboardMode = "move";
let ttWhiteboardDrawing = false;
let ttWhiteboardLastPoint = null;
let ttWhiteboardDrag = null;
let ttWhiteboardTileId = 0;
let ttRestoringScroll = false;
let ttSection1View = "photo";
let ttSection1PhotoMode = "full";
let ttSection1LastTap = { time: 0, x: 0, y: 0 };
let ttSection1Pan = null;
let ttPlannerGroupId = "";
let ttPlannerDraft = {};
let ttSectionReviewSubsteps = {};
let ttPickerSelections = {};      // { pickerId: string[] }  — ordered selected words
let ttPickerSubstepCache = {};    // { "pickerId::substepId": string[] } — word pools per substep
let ttSection8RealSlots = [];     // [{ substep, word }] × 5 — Section 8 real word slots
let ttPlannerHomeScrollPositions = {};
let ttPlannerCustomizeOpen = false;
let ttLessonHistoryEditPlanId = "";
let ttAssistantNotice = "";
let ttLessonLaunchTimer = null;
let ttPresentationMenuTimer = null;
let ttPaceGuideTimer = null;
let ttPaceGuideState = {
  running: false,
  lessonStartedAt: 0,
  sectionStartedAt: 0,
  activeSectionId: ""
};
let ttPassageInkState = {
  color: "#ef4444",
  size: 5,
  mode: "pen",
  zoom: 1,
  strokes: [],
  drawing: false,
  activeStroke: null
};
let ttPassagePointerMap = new Map();
let ttPassagePinchState = null;
let ttPassageZoomSaveTimer = null;
let ttPassageGestureListenersBound = false;
let ttPassageStageActive = false;
let ttStudentDisplayWindow = null;
let ttStudentDisplayMode = localStorage.getItem("teachToday.studentDisplayMode") || "private";
let ttGroupDay = null; // "1" | "2" | null (null = show full group lesson)
const ttStudentDisplayStorageKey = "teachToday.studentDisplayPayload.v1";
const ttStudentDisplayChannel = "BroadcastChannel" in window ? new BroadcastChannel("teachTodayStudentDisplay.v1") : null;
let ttStudentDisplayScreens = [];
const ttPaceGuideLessonMsFull = 60 * 60 * 1000;
const ttPaceGuideLessonMsPart = 45 * 60 * 1000;
function ttPaceGuideLessonMs() {
  const lt = ttLesson?.lessonType || "full";
  if (lt === "group" || lt === "part1" || lt === "part2") return ttPaceGuideLessonMsPart * 2; // 90 min total
  return (lt === "full45" || lt === "flash") ? ttPaceGuideLessonMsPart : ttPaceGuideLessonMsFull;
}

// Section definitions — id, display name, minutes, color, which picker(s) it needs
const TT_LESSON_SECTIONS = [
  { id: "1",  name: "Sounds",       mins: 3,  color: "#3b82f6", hasPicker: false },
  { id: "2",  name: "Concepts",     mins: 5,  color: "#10b981", hasPicker: true  },
  { id: "3",  name: "Word Cards",   mins: 5,  color: "#3b82f6", hasPicker: true  },
  { id: "4",  name: "Charting",     mins: 10, color: "#8b5cf6", hasPicker: false },
  { id: "5",  name: "Sentences",    mins: 5,  color: "#0891b2", hasPicker: false },
  { id: "6",  name: "Quick Drill",  mins: 3,  color: "#f97316", hasPicker: true  },
  { id: "7",  name: "Spelling",     mins: 10, color: "#f43f5e", hasPicker: true  },
  { id: "8",  name: "Dictation",    mins: 20, color: "#6366f1", hasPicker: true  },
  { id: "9",  name: "Passage",      mins: 10, color: "#0f766e", hasPicker: false },
  { id: "10", name: "Story",        mins: 10, color: "#0f766e", hasPicker: false },
];
const ttPaceGuideSectionMs = 5 * 60 * 1000;
const TT_SECTION9_APPROACHES = [
  { id: "comprehension-sos", label: "Comprehension S.O.S. - Silent/Oral" },
  { id: "oral-fluency", label: "Oral Fluency - Repeated Reading" }
];
const TT_READER_PASSAGES = [
  {
    id: "reader1-1.3-ab-p46-cat-hat",
    reader: 1,
    substep: "1.3",
    level: "AB",
    title: "The Cat Got the Hat",
    readerPageStart: 46,
    readerPageEnd: 46,
    pdfPageStart: 2,
    pdfPageEnd: 2,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-ab-p47-cod-fish-ben",
    reader: 1,
    substep: "1.3",
    level: "AB",
    title: "Cod Fish for Ben",
    readerPageStart: 47,
    readerPageEnd: 47,
    pdfPageStart: 3,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-ab-p48-meg-ben-shop",
    reader: 1,
    substep: "1.3",
    level: "AB",
    title: "Meg and Ben Shop",
    readerPageStart: 48,
    readerPageEnd: 48,
    pdfPageStart: 4,
    pdfPageEnd: 4,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-ab-p49-dad-ship-job",
    reader: 1,
    substep: "1.3",
    level: "AB",
    title: "Dad and the Ship Job",
    readerPageStart: 49,
    readerPageEnd: 49,
    pdfPageStart: 5,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-ab-p50-tom-pal-jed",
    reader: 1,
    substep: "1.3",
    level: "AB",
    title: "Tom and His Pal, Jed",
    readerPageStart: 50,
    readerPageEnd: 51,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-b-p52-tick-bit-mel",
    reader: 1,
    substep: "1.3",
    level: "B",
    title: "A Tick Bit Mel",
    readerPageStart: 52,
    readerPageEnd: 52,
    pdfPageStart: 8,
    pdfPageEnd: 8,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-b-p53-bash-ted-liz",
    reader: 1,
    substep: "1.3",
    level: "B",
    title: "At the Bash with Ted and Liz",
    readerPageStart: 53,
    readerPageEnd: 53,
    pdfPageStart: 9,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-b-p54-win-jack",
    reader: 1,
    substep: "1.3",
    level: "B",
    title: "A Win for Jack",
    readerPageStart: 54,
    readerPageEnd: 54,
    pdfPageStart: 10,
    pdfPageEnd: 10,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-b-p55-not-so-fun-jog",
    reader: 1,
    substep: "1.3",
    level: "B",
    title: "The Not So Fun Jog",
    readerPageStart: 55,
    readerPageEnd: 55,
    pdfPageStart: 11,
    pdfPageEnd: 11,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.3-b-p56-big-job-ship",
    reader: 1,
    substep: "1.3",
    level: "B",
    title: "A Big Job on the Ship",
    readerPageStart: 56,
    readerPageEnd: 57,
    pdfPageStart: 12,
    pdfPageEnd: 13,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-ab-p72-cut-lip",
    reader: 1,
    substep: "1.4",
    level: "AB",
    title: "A Cut Lip",
    readerPageStart: 72,
    readerPageEnd: 72,
    pdfPageStart: 14,
    pdfPageEnd: 14,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-ab-p73-big-hit",
    reader: 1,
    substep: "1.4",
    level: "AB",
    title: "The Big Hit",
    readerPageStart: 73,
    readerPageEnd: 73,
    pdfPageStart: 15,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-ab-p74-box-deck",
    reader: 1,
    substep: "1.4",
    level: "AB",
    title: "The Box on the Deck",
    readerPageStart: 74,
    readerPageEnd: 75,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-b-p76-shop-mall",
    reader: 1,
    substep: "1.4",
    level: "B",
    title: "Shop at the Mall",
    readerPageStart: 76,
    readerPageEnd: 77,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-b-p78-bad-call",
    reader: 1,
    substep: "1.4",
    level: "B",
    title: "A Bad Call",
    readerPageStart: 78,
    readerPageEnd: 79,
    pdfPageStart: 20,
    pdfPageEnd: 21,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.4-b-p80-zip-pup",
    reader: 1,
    substep: "1.4",
    level: "B",
    title: "Zip the Pup",
    readerPageStart: 80,
    readerPageEnd: 80,
    pdfPageStart: 22,
    pdfPageEnd: 22,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.5-ab-p89-pam-jam",
    reader: 1,
    substep: "1.5",
    level: "AB",
    title: "Pam and the Jam",
    readerPageStart: 89,
    readerPageEnd: 89,
    pdfPageStart: 23,
    pdfPageEnd: 23,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.5-ab-p90-tan-duck",
    reader: 1,
    substep: "1.5",
    level: "AB",
    title: "The Tan Duck",
    readerPageStart: 90,
    readerPageEnd: 90,
    pdfPageStart: 24,
    pdfPageEnd: 24,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.5-b-p91-chess-dan",
    reader: 1,
    substep: "1.5",
    level: "B",
    title: "Chess with Dan?",
    readerPageStart: 91,
    readerPageEnd: 91,
    pdfPageStart: 25,
    pdfPageEnd: 25,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.5-b-p92-bad-tan",
    reader: 1,
    substep: "1.5",
    level: "B",
    title: "A Bad Tan",
    readerPageStart: 92,
    readerPageEnd: 92,
    pdfPageStart: 26,
    pdfPageEnd: 26,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-ab-p109-win-nicks-fans",
    reader: 1,
    substep: "1.6",
    level: "AB",
    title: "A Win for Nick's Fans",
    readerPageStart: 109,
    readerPageEnd: 109,
    pdfPageStart: 27,
    pdfPageEnd: 27,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-ab-p110-dan-pets",
    reader: 1,
    substep: "1.6",
    level: "AB",
    title: "Dan and His Pets",
    readerPageStart: 110,
    readerPageEnd: 111,
    pdfPageStart: 28,
    pdfPageEnd: 29,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-ab-p112-shack-rot",
    reader: 1,
    substep: "1.6",
    level: "AB",
    title: "The Shack Has Rot",
    readerPageStart: 112,
    readerPageEnd: 113,
    pdfPageStart: 30,
    pdfPageEnd: 31,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-ab-p114-hot-dogs-pops",
    reader: 1,
    substep: "1.6",
    level: "AB",
    title: "Hot Dogs and Pops",
    readerPageStart: 114,
    readerPageEnd: 114,
    pdfPageStart: 32,
    pdfPageEnd: 32,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-b-p115-max-quits",
    reader: 1,
    substep: "1.6",
    level: "B",
    title: "Max Quits and Quits",
    readerPageStart: 115,
    readerPageEnd: 115,
    pdfPageStart: 33,
    pdfPageEnd: 33,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-b-p116-beds-kids",
    reader: 1,
    substep: "1.6",
    level: "B",
    title: "Beds for the Kids",
    readerPageStart: 116,
    readerPageEnd: 117,
    pdfPageStart: 34,
    pdfPageEnd: 35,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader1-1.6-b-p118-job-bill",
    reader: 1,
    substep: "1.6",
    level: "B",
    title: "On the Job with Bill",
    readerPageStart: 118,
    readerPageEnd: 119,
    pdfPageStart: 36,
    pdfPageEnd: 37,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_1 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.1-ab-p14-moth-pink-wings",
    reader: 2,
    substep: "2.1",
    level: "AB",
    title: "The Moth with Pink Wings",
    readerPageStart: 14,
    readerPageEnd: 15,
    pdfPageStart: 2,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.1-ab-p16-for-win",
    reader: 2,
    substep: "2.1",
    level: "AB",
    title: "For the Win",
    readerPageStart: 16,
    readerPageEnd: 17,
    pdfPageStart: 4,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.1-b-p18-jims-bank-job",
    reader: 2,
    substep: "2.1",
    level: "B",
    title: "Jim's Bank Job",
    readerPageStart: 18,
    readerPageEnd: 19,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.1-b-p20-bad-luck-bus",
    reader: 2,
    substep: "2.1",
    level: "B",
    title: "Bad Luck on the Bus",
    readerPageStart: 20,
    readerPageEnd: 21,
    pdfPageStart: 8,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-ab-p48-beth-grass",
    reader: 2,
    substep: "2.2",
    level: "AB",
    title: "Beth's Trip in the Grass",
    readerPageStart: 48,
    readerPageEnd: 49,
    pdfPageStart: 10,
    pdfPageEnd: 11,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-ab-p50-brad-sam-pond",
    reader: 2,
    substep: "2.2",
    level: "AB",
    title: "Brad and Sam at the Pond",
    readerPageStart: 50,
    readerPageEnd: 51,
    pdfPageStart: 12,
    pdfPageEnd: 13,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-ab-p52-best-lunch",
    reader: 2,
    substep: "2.2",
    level: "AB",
    title: "Who has the Best Lunch?",
    readerPageStart: 52,
    readerPageEnd: 53,
    pdfPageStart: 14,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-ab-p54-stan-frog",
    reader: 2,
    substep: "2.2",
    level: "AB",
    title: "Stan the Frog",
    readerPageStart: 54,
    readerPageEnd: 55,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-b-p56-set-up-band",
    reader: 2,
    substep: "2.2",
    level: "B",
    title: "Set Up for the Band",
    readerPageStart: 56,
    readerPageEnd: 57,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-b-p58-big-grass-job",
    reader: 2,
    substep: "2.2",
    level: "B",
    title: "The Big Grass Job",
    readerPageStart: 58,
    readerPageEnd: 59,
    pdfPageStart: 20,
    pdfPageEnd: 21,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-b-p60-prom",
    reader: 2,
    substep: "2.2",
    level: "B",
    title: "The Prom",
    readerPageStart: 60,
    readerPageEnd: 61,
    pdfPageStart: 22,
    pdfPageEnd: 23,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.2-b-p62-track",
    reader: 2,
    substep: "2.2",
    level: "B",
    title: "On the Track",
    readerPageStart: 62,
    readerPageEnd: 63,
    pdfPageStart: 24,
    pdfPageEnd: 25,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.3-ab-p72-sid-host",
    reader: 2,
    substep: "2.3",
    level: "AB",
    title: "Sid is the Best Host",
    readerPageStart: 72,
    readerPageEnd: 73,
    pdfPageStart: 26,
    pdfPageEnd: 27,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.3-ab-p74-jack-colt",
    reader: 2,
    substep: "2.3",
    level: "AB",
    title: "Jack and the Colt",
    readerPageStart: 74,
    readerPageEnd: 75,
    pdfPageStart: 28,
    pdfPageEnd: 29,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.3-b-p76-most-bass",
    reader: 2,
    substep: "2.3",
    level: "B",
    title: "Get the Most Bass",
    readerPageStart: 76,
    readerPageEnd: 77,
    pdfPageStart: 30,
    pdfPageEnd: 31,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.3-b-p78-gift-slip-up-1",
    reader: 2,
    substep: "2.3",
    level: "B",
    title: "The Gift Slip Up Part One",
    readerPageStart: 78,
    readerPageEnd: 79,
    pdfPageStart: 32,
    pdfPageEnd: 33,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.3-b-p80-gift-slip-up-2",
    reader: 2,
    substep: "2.3",
    level: "B",
    title: "The Gift Slip Up Part Two",
    readerPageStart: 80,
    readerPageEnd: 81,
    pdfPageStart: 34,
    pdfPageEnd: 35,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.4-ab-p100-at-pond",
    reader: 2,
    substep: "2.4",
    level: "AB",
    title: "At the Pond",
    readerPageStart: 100,
    readerPageEnd: 101,
    pdfPageStart: 36,
    pdfPageEnd: 37,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.4-ab-p102-glen-gull-lunch",
    reader: 2,
    substep: "2.4",
    level: "AB",
    title: "Glen and the Gull Have Lunch",
    readerPageStart: 102,
    readerPageEnd: 103,
    pdfPageStart: 38,
    pdfPageEnd: 39,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.4-b-p104-brads-bad-day",
    reader: 2,
    substep: "2.4",
    level: "B",
    title: "Brad's Bad Day",
    readerPageStart: 104,
    readerPageEnd: 105,
    pdfPageStart: 40,
    pdfPageEnd: 41,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.4-b-p106-draft",
    reader: 2,
    substep: "2.4",
    level: "B",
    title: "The Draft",
    readerPageStart: 106,
    readerPageEnd: 107,
    pdfPageStart: 42,
    pdfPageEnd: 43,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.5-ab-p119-big-bass",
    reader: 2,
    substep: "2.5",
    level: "AB",
    title: "Big Bass",
    readerPageStart: 119,
    readerPageEnd: 119,
    pdfPageStart: 44,
    pdfPageEnd: 44,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.5-ab-p120-gram-gramps",
    reader: 2,
    substep: "2.5",
    level: "AB",
    title: "The Best Gram and Gramps in the World",
    readerPageStart: 120,
    readerPageEnd: 121,
    pdfPageStart: 45,
    pdfPageEnd: 46,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.5-b-p122-spring-job",
    reader: 2,
    substep: "2.5",
    level: "B",
    title: "The Spring Job",
    readerPageStart: 122,
    readerPageEnd: 123,
    pdfPageStart: 47,
    pdfPageEnd: 48,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader2-2.5-b-p124-help-chan",
    reader: 2,
    substep: "2.5",
    level: "B",
    title: "Help from Chan",
    readerPageStart: 124,
    readerPageEnd: 125,
    pdfPageStart: 49,
    pdfPageEnd: 50,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_2 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-ab-p40-best-lunch",
    reader: 3,
    substep: "3.1",
    level: "AB",
    title: "The Best Lunch",
    readerPageStart: 40,
    readerPageEnd: 41,
    pdfPageStart: 2,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-ab-p42-tennis-sunset",
    reader: 3,
    substep: "3.1",
    level: "AB",
    title: "Tennis Until Sunset",
    readerPageStart: 42,
    readerPageEnd: 43,
    pdfPageStart: 4,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-ab-p44-chess-club",
    reader: 3,
    substep: "3.1",
    level: "AB",
    title: "Chess Club?",
    readerPageStart: 44,
    readerPageEnd: 45,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-b-p46-snack-script",
    reader: 3,
    substep: "3.1",
    level: "B",
    title: "Snack or Script?",
    readerPageStart: 46,
    readerPageEnd: 47,
    pdfPageStart: 8,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-b-p48-trip-cabin",
    reader: 3,
    substep: "3.1",
    level: "B",
    title: "A Trip to the Cabin",
    readerPageStart: 48,
    readerPageEnd: 49,
    pdfPageStart: 10,
    pdfPageEnd: 11,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.1-b-p50-mess-banquet",
    reader: 3,
    substep: "3.1",
    level: "B",
    title: "A Mess at the Banquet",
    readerPageStart: 50,
    readerPageEnd: 51,
    pdfPageStart: 12,
    pdfPageEnd: 13,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-ab-p86-running-contest",
    reader: 3,
    substep: "3.2",
    level: "AB",
    title: "The Running Contest",
    readerPageStart: 86,
    readerPageEnd: 87,
    pdfPageStart: 14,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-ab-p88-picnic-chipmunk",
    reader: 3,
    substep: "3.2",
    level: "AB",
    title: "A Picnic with a Chipmunk",
    readerPageStart: 88,
    readerPageEnd: 89,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-ab-p90-down-six-1",
    reader: 3,
    substep: "3.2",
    level: "AB",
    title: "Down by Six Part One",
    readerPageStart: 90,
    readerPageEnd: 91,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-ab-p92-down-six-2",
    reader: 3,
    substep: "3.2",
    level: "AB",
    title: "Down by Six Part Two",
    readerPageStart: 92,
    readerPageEnd: 93,
    pdfPageStart: 20,
    pdfPageEnd: 21,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-b-p94-travel-tropics",
    reader: 3,
    substep: "3.2",
    level: "B",
    title: "Travel to the Tropics",
    readerPageStart: 94,
    readerPageEnd: 95,
    pdfPageStart: 22,
    pdfPageEnd: 23,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-b-p96-common-1",
    reader: 3,
    substep: "3.2",
    level: "B",
    title: "Problems at the Common Part One",
    readerPageStart: 96,
    readerPageEnd: 97,
    pdfPageStart: 24,
    pdfPageEnd: 25,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.2-b-p98-common-2",
    reader: 3,
    substep: "3.2",
    level: "B",
    title: "Problems at the Common Part Two",
    readerPageStart: 98,
    readerPageEnd: 98,
    pdfPageStart: 26,
    pdfPageEnd: 26,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.3-ab-p110-craft-class",
    reader: 3,
    substep: "3.3",
    level: "AB",
    title: "Craft Class",
    readerPageStart: 110,
    readerPageEnd: 111,
    pdfPageStart: 27,
    pdfPageEnd: 28,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.3-ab-p112-trash-suspect",
    reader: 3,
    substep: "3.3",
    level: "AB",
    title: "The Trash Can Suspect",
    readerPageStart: 112,
    readerPageEnd: 113,
    pdfPageStart: 29,
    pdfPageEnd: 30,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.3-ab-p114-collect-bugs",
    reader: 3,
    substep: "3.3",
    level: "AB",
    title: "Collect Some Bugs",
    readerPageStart: 114,
    readerPageEnd: 115,
    pdfPageStart: 31,
    pdfPageEnd: 32,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.3-b-p116-dunlop-bills",
    reader: 3,
    substep: "3.3",
    level: "B",
    title: "Mrs. Dunlop and Her Bills",
    readerPageStart: 116,
    readerPageEnd: 117,
    pdfPageStart: 33,
    pdfPageEnd: 34,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.3-b-p118-alans-lab",
    reader: 3,
    substep: "3.3",
    level: "B",
    title: "Alan's Work in the Lab",
    readerPageStart: 118,
    readerPageEnd: 118,
    pdfPageStart: 35,
    pdfPageEnd: 35,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.4-ab-p136-atlantic",
    reader: 3,
    substep: "3.4",
    level: "AB",
    title: "The Atlantic",
    readerPageStart: 136,
    readerPageEnd: 137,
    pdfPageStart: 36,
    pdfPageEnd: 37,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.4-ab-p138-hamilton",
    reader: 3,
    substep: "3.4",
    level: "AB",
    title: "The Fantastic Hamilton",
    readerPageStart: 138,
    readerPageEnd: 139,
    pdfPageStart: 38,
    pdfPageEnd: 39,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.4-b-p140-fossil-exhibit",
    reader: 3,
    substep: "3.4",
    level: "B",
    title: "The Fossil Exhibit",
    readerPageStart: 140,
    readerPageEnd: 141,
    pdfPageStart: 40,
    pdfPageEnd: 41,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.5-ab-p156-rafting-trip",
    reader: 3,
    substep: "3.5",
    level: "AB",
    title: "The Rafting Trip",
    readerPageStart: 156,
    readerPageEnd: 157,
    pdfPageStart: 42,
    pdfPageEnd: 43,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.5-ab-p158-walking-talking",
    reader: 3,
    substep: "3.5",
    level: "AB",
    title: "Walking and Talking",
    readerPageStart: 158,
    readerPageEnd: 159,
    pdfPageStart: 44,
    pdfPageEnd: 45,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.5-b-p160-invest-spend",
    reader: 3,
    substep: "3.5",
    level: "B",
    title: "Invest More, Spend Less",
    readerPageStart: 160,
    readerPageEnd: 161,
    pdfPageStart: 46,
    pdfPageEnd: 47,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader3-3.5-b-p162-passing-bill",
    reader: 3,
    substep: "3.5",
    level: "B",
    title: "Passing a Bill",
    readerPageStart: 162,
    readerPageEnd: 162,
    pdfPageStart: 48,
    pdfPageEnd: 48,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_3 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p34-slope-1",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "A Fine Time on the Slope Part One",
    readerPageStart: 34,
    readerPageEnd: 35,
    pdfPageStart: 2,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p36-slope-2",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "A Fine Time on the Slope Part Two",
    readerPageStart: 36,
    readerPageEnd: 37,
    pdfPageStart: 4,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p38-mittens-strikes",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "Mittens the Cat Strikes Again",
    readerPageStart: 38,
    readerPageEnd: 39,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p40-jackson-lake",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "A Hike at Jackson Lake",
    readerPageStart: 40,
    readerPageEnd: 41,
    pdfPageStart: 8,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p42-cactus-joke-1",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "The Cactus Plant Joke Part One",
    readerPageStart: 42,
    readerPageEnd: 42,
    pdfPageStart: 10,
    pdfPageEnd: 10,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-ab-p43-cactus-joke-2",
    reader: 4,
    substep: "4.1",
    level: "AB",
    title: "The Cactus Plant Joke Part Two",
    readerPageStart: 43,
    readerPageEnd: 43,
    pdfPageStart: 11,
    pdfPageEnd: 11,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-b-p44-dine-hank",
    reader: 4,
    substep: "4.1",
    level: "B",
    title: "Who will Dine with Hank?",
    readerPageStart: 44,
    readerPageEnd: 45,
    pdfPageStart: 12,
    pdfPageEnd: 13,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-b-p46-wire-contract-1",
    reader: 4,
    substep: "4.1",
    level: "B",
    title: "The Wire Contract Part One",
    readerPageStart: 46,
    readerPageEnd: 46,
    pdfPageStart: 14,
    pdfPageEnd: 14,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-b-p47-wire-contract-2",
    reader: 4,
    substep: "4.1",
    level: "B",
    title: "The Wire Contract Part Two",
    readerPageStart: 47,
    readerPageEnd: 47,
    pdfPageStart: 15,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.1-b-p48-quake-state",
    reader: 4,
    substep: "4.1",
    level: "B",
    title: "The Quake State",
    readerPageStart: 48,
    readerPageEnd: 49,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-ab-p76-limestone-cave",
    reader: 4,
    substep: "4.2",
    level: "AB",
    title: "The Limestone Cave",
    readerPageStart: 76,
    readerPageEnd: 77,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-ab-p78-caveman-exhibit",
    reader: 4,
    substep: "4.2",
    level: "AB",
    title: "The Caveman Exhibit",
    readerPageStart: 78,
    readerPageEnd: 79,
    pdfPageStart: 20,
    pdfPageEnd: 21,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-ab-p80-cleveland-pride",
    reader: 4,
    substep: "4.2",
    level: "AB",
    title: "Kendall and the Cleveland Pride",
    readerPageStart: 80,
    readerPageEnd: 81,
    pdfPageStart: 22,
    pdfPageEnd: 23,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-ab-p82-empire-lake",
    reader: 4,
    substep: "4.2",
    level: "AB",
    title: "The Empire Lake Trip",
    readerPageStart: 82,
    readerPageEnd: 83,
    pdfPageStart: 24,
    pdfPageEnd: 25,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-b-p84-big-upset",
    reader: 4,
    substep: "4.2",
    level: "B",
    title: "The Big Upset",
    readerPageStart: 84,
    readerPageEnd: 85,
    pdfPageStart: 26,
    pdfPageEnd: 27,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-b-p86-complex-math-1",
    reader: 4,
    substep: "4.2",
    level: "B",
    title: "Tom and the Complex Math Part One",
    readerPageStart: 86,
    readerPageEnd: 87,
    pdfPageStart: 28,
    pdfPageEnd: 29,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-b-p88-complex-math-2",
    reader: 4,
    substep: "4.2",
    level: "B",
    title: "Tom and the Complex Math Part Two",
    readerPageStart: 88,
    readerPageEnd: 89,
    pdfPageStart: 30,
    pdfPageEnd: 31,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.2-b-p90-pothole-problems",
    reader: 4,
    substep: "4.2",
    level: "B",
    title: "Pothole Problems",
    readerPageStart: 90,
    readerPageEnd: 91,
    pdfPageStart: 32,
    pdfPageEnd: 33,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-ab-p98-lemonade-stand",
    reader: 4,
    substep: "4.3",
    level: "AB",
    title: "Trish and the Lemonade Stand",
    readerPageStart: 98,
    readerPageEnd: 99,
    pdfPageStart: 34,
    pdfPageEnd: 35,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-ab-p100-bike-spot-1",
    reader: 4,
    substep: "4.3",
    level: "AB",
    title: "A Spot for the Bikes Part One",
    readerPageStart: 100,
    readerPageEnd: 101,
    pdfPageStart: 36,
    pdfPageEnd: 37,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-ab-p102-bike-spot-2",
    reader: 4,
    substep: "4.3",
    level: "AB",
    title: "A Spot for the Bikes Part Two",
    readerPageStart: 102,
    readerPageEnd: 103,
    pdfPageStart: 38,
    pdfPageEnd: 39,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-ab-p104-calvin-sled-dog",
    reader: 4,
    substep: "4.3",
    level: "AB",
    title: "Calvin, the Sled Dog",
    readerPageStart: 104,
    readerPageEnd: 105,
    pdfPageStart: 40,
    pdfPageEnd: 41,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-b-p106-janes-pup-hit",
    reader: 4,
    substep: "4.3",
    level: "B",
    title: "Jane's Pup is Hit",
    readerPageStart: 106,
    readerPageEnd: 107,
    pdfPageStart: 42,
    pdfPageEnd: 43,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.3-b-p108-josh-todd-profit",
    reader: 4,
    substep: "4.3",
    level: "B",
    title: "Josh and Todd Make a Profit",
    readerPageStart: 108,
    readerPageEnd: 109,
    pdfPageStart: 44,
    pdfPageEnd: 45,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-ab-p118-antons-bake-shop-1",
    reader: 4,
    substep: "4.4",
    level: "AB",
    title: "Anton's Bake Shop Part One",
    readerPageStart: 118,
    readerPageEnd: 118,
    pdfPageStart: 46,
    pdfPageEnd: 46,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-ab-p119-antons-bake-shop-2",
    reader: 4,
    substep: "4.4",
    level: "AB",
    title: "Anton's Bake Shop Part Two",
    readerPageStart: 119,
    readerPageEnd: 119,
    pdfPageStart: 47,
    pdfPageEnd: 47,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-ab-p120-pig-mud",
    reader: 4,
    substep: "4.4",
    level: "AB",
    title: "A Pig Who Does Not Like Mud?",
    readerPageStart: 120,
    readerPageEnd: 121,
    pdfPageStart: 48,
    pdfPageEnd: 49,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-b-p122-not-impressive-date-1",
    reader: 4,
    substep: "4.4",
    level: "B",
    title: "The Not-So-Impressive Date Part One",
    readerPageStart: 122,
    readerPageEnd: 122,
    pdfPageStart: 50,
    pdfPageEnd: 50,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-b-p123-not-impressive-date-2",
    reader: 4,
    substep: "4.4",
    level: "B",
    title: "The Not-So-Impressive Date Part Two",
    readerPageStart: 123,
    readerPageEnd: 123,
    pdfPageStart: 51,
    pdfPageEnd: 51,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader4-4.4-b-p124-gavins-gift",
    reader: 4,
    substep: "4.4",
    level: "B",
    title: "Gavin's Gift",
    readerPageStart: 124,
    readerPageEnd: 125,
    pdfPageStart: 52,
    pdfPageEnd: 53,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_4 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.1-ab-p10-wades-first-ride",
    reader: 5,
    substep: "5.1",
    level: "AB",
    title: "Wade's First Ride in the Sky",
    readerPageStart: 10,
    readerPageEnd: 11,
    pdfPageStart: 2,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.1-ab-p12-acting-class-maxim",
    reader: 5,
    substep: "5.1",
    level: "AB",
    title: "An Acting Class for Maxim",
    readerPageStart: 12,
    readerPageEnd: 13,
    pdfPageStart: 4,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.1-b-p14-jades-hidden-job",
    reader: 5,
    substep: "5.1",
    level: "B",
    title: "Jade's Hidden Job",
    readerPageStart: 14,
    readerPageEnd: 15,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.1-b-p16-jakes-great-food-1",
    reader: 5,
    substep: "5.1",
    level: "B",
    title: "Jake's Plan for Great Food Part One",
    readerPageStart: 16,
    readerPageEnd: 17,
    pdfPageStart: 8,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.1-b-p18-jakes-great-food-2",
    reader: 5,
    substep: "5.1",
    level: "B",
    title: "Jake's Plan for Great Food Part Two",
    readerPageStart: 18,
    readerPageEnd: 18,
    pdfPageStart: 10,
    pdfPageEnd: 10,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-ab-p42-move-states",
    reader: 5,
    substep: "5.2",
    level: "AB",
    title: "A Move to the States",
    readerPageStart: 42,
    readerPageEnd: 43,
    pdfPageStart: 11,
    pdfPageEnd: 12,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-ab-p44-attic-mess-1",
    reader: 5,
    substep: "5.2",
    level: "AB",
    title: "The Attic Mess Part One",
    readerPageStart: 44,
    readerPageEnd: 45,
    pdfPageStart: 13,
    pdfPageEnd: 14,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-ab-p46-attic-mess-2",
    reader: 5,
    substep: "5.2",
    level: "AB",
    title: "The Attic Mess Part Two",
    readerPageStart: 46,
    readerPageEnd: 47,
    pdfPageStart: 15,
    pdfPageEnd: 16,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-b-p48-ivan-debate-1",
    reader: 5,
    substep: "5.2",
    level: "B",
    title: "Ivan Behaves at the Debate Part One",
    readerPageStart: 48,
    readerPageEnd: 49,
    pdfPageStart: 17,
    pdfPageEnd: 18,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-b-p50-ivan-debate-2",
    reader: 5,
    substep: "5.2",
    level: "B",
    title: "Ivan Behaves at the Debate Part Two",
    readerPageStart: 50,
    readerPageEnd: 51,
    pdfPageStart: 19,
    pdfPageEnd: 20,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-b-p52-stucco-home-1",
    reader: 5,
    substep: "5.2",
    level: "B",
    title: "The Stucco Home Part One",
    readerPageStart: 52,
    readerPageEnd: 53,
    pdfPageStart: 21,
    pdfPageEnd: 22,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.2-b-p54-stucco-home-2",
    reader: 5,
    substep: "5.2",
    level: "B",
    title: "The Stucco Home Part Two",
    readerPageStart: 54,
    readerPageEnd: 55,
    pdfPageStart: 23,
    pdfPageEnd: 24,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.3-ab-p64-pony-ride",
    reader: 5,
    substep: "5.3",
    level: "AB",
    title: "The Pony Ride",
    readerPageStart: 64,
    readerPageEnd: 65,
    pdfPageStart: 25,
    pdfPageEnd: 26,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.3-ab-p66-ruby-bulldog",
    reader: 5,
    substep: "5.3",
    level: "AB",
    title: "Ruby, the Red Bulldog",
    readerPageStart: 66,
    readerPageEnd: 67,
    pdfPageStart: 27,
    pdfPageEnd: 28,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.3-ab-p68-grape-jelly",
    reader: 5,
    substep: "5.3",
    level: "AB",
    title: "Libby Makes Grape Jelly",
    readerPageStart: 68,
    readerPageEnd: 69,
    pdfPageStart: 29,
    pdfPageEnd: 30,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.3-b-p70-jolly-menu",
    reader: 5,
    substep: "5.3",
    level: "B",
    title: "The Jolly Menu",
    readerPageStart: 70,
    readerPageEnd: 71,
    pdfPageStart: 31,
    pdfPageEnd: 32,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.3-b-p72-brody-golf-club",
    reader: 5,
    substep: "5.3",
    level: "B",
    title: "Brody's Job at the Golf Club",
    readerPageStart: 72,
    readerPageEnd: 73,
    pdfPageStart: 33,
    pdfPageEnd: 34,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-ab-p94-abbys-brave-day-1",
    reader: 5,
    substep: "5.4",
    level: "AB",
    title: "Abby's Brave Day Part One",
    readerPageStart: 94,
    readerPageEnd: 95,
    pdfPageStart: 35,
    pdfPageEnd: 36,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-ab-p96-abbys-brave-day-2",
    reader: 5,
    substep: "5.4",
    level: "AB",
    title: "Abby's Brave Day Part Two",
    readerPageStart: 96,
    readerPageEnd: 97,
    pdfPageStart: 37,
    pdfPageEnd: 38,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-ab-p98-chicken-bathtub-1",
    reader: 5,
    substep: "5.4",
    level: "AB",
    title: "A Chicken in the Bathtub Part One",
    readerPageStart: 98,
    readerPageEnd: 99,
    pdfPageStart: 39,
    pdfPageEnd: 40,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-ab-p100-chicken-bathtub-2",
    reader: 5,
    substep: "5.4",
    level: "AB",
    title: "A Chicken in the Bathtub Part Two",
    readerPageStart: 100,
    readerPageEnd: 101,
    pdfPageStart: 41,
    pdfPageEnd: 42,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-b-p102-explosive-volcano",
    reader: 5,
    substep: "5.4",
    level: "B",
    title: "The Explosive Volcano",
    readerPageStart: 102,
    readerPageEnd: 103,
    pdfPageStart: 43,
    pdfPageEnd: 44,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-b-p104-sales-problem-1",
    reader: 5,
    substep: "5.4",
    level: "B",
    title: "The Diminishing Sales Problem Part One",
    readerPageStart: 104,
    readerPageEnd: 105,
    pdfPageStart: 45,
    pdfPageEnd: 46,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.4-b-p106-sales-problem-2",
    reader: 5,
    substep: "5.4",
    level: "B",
    title: "The Diminishing Sales Problem Part Two",
    readerPageStart: 106,
    readerPageEnd: 107,
    pdfPageStart: 47,
    pdfPageEnd: 48,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-ab-p128-day-grandma",
    reader: 5,
    substep: "5.5",
    level: "AB",
    title: "A Day with Grandma",
    readerPageStart: 128,
    readerPageEnd: 129,
    pdfPageStart: 49,
    pdfPageEnd: 50,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-ab-p130-mojo-digs",
    reader: 5,
    substep: "5.5",
    level: "AB",
    title: "Mojo, the Dog Who Digs",
    readerPageStart: 130,
    readerPageEnd: 131,
    pdfPageStart: 51,
    pdfPageEnd: 52,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-ab-p132-academy",
    reader: 5,
    substep: "5.5",
    level: "AB",
    title: "Off to the Academy",
    readerPageStart: 132,
    readerPageEnd: 133,
    pdfPageStart: 53,
    pdfPageEnd: 54,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-b-p134-chinchilla-1",
    reader: 5,
    substep: "5.5",
    level: "B",
    title: "A Chinchilla for Melissa Part One",
    readerPageStart: 134,
    readerPageEnd: 135,
    pdfPageStart: 55,
    pdfPageEnd: 56,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-b-p136-chinchilla-2",
    reader: 5,
    substep: "5.5",
    level: "B",
    title: "A Chinchilla for Melissa Part Two",
    readerPageStart: 136,
    readerPageEnd: 137,
    pdfPageStart: 57,
    pdfPageEnd: 58,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-b-p138-anna-skates-1",
    reader: 5,
    substep: "5.5",
    level: "B",
    title: "Anna on Skates Part One",
    readerPageStart: 138,
    readerPageEnd: 139,
    pdfPageStart: 59,
    pdfPageEnd: 60,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader5-5.5-b-p140-anna-skates-2",
    reader: 5,
    substep: "5.5",
    level: "B",
    title: "Anna on Skates Part Two",
    readerPageStart: 140,
    readerPageEnd: 141,
    pdfPageStart: 61,
    pdfPageEnd: 62,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_5 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-ab-p21-kendra-hopeful-1",
    reader: 6,
    substep: "6.1",
    level: "AB",
    title: "Kendra is Hopeful Part One",
    readerPageStart: 21,
    readerPageEnd: 21,
    pdfPageStart: 2,
    pdfPageEnd: 2,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-ab-p22-kendra-hopeful-2",
    reader: 6,
    substep: "6.1",
    level: "AB",
    title: "Kendra is Hopeful Part Two",
    readerPageStart: 22,
    readerPageEnd: 23,
    pdfPageStart: 3,
    pdfPageEnd: 4,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-ab-p24-safety-lesson",
    reader: 6,
    substep: "6.1",
    level: "AB",
    title: "A Safety Lesson",
    readerPageStart: 24,
    readerPageEnd: 25,
    pdfPageStart: 5,
    pdfPageEnd: 6,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-ab-p26-ladybug-problem-1",
    reader: 6,
    substep: "6.1",
    level: "AB",
    title: "The Ladybug Problem Part One",
    readerPageStart: 26,
    readerPageEnd: 26,
    pdfPageStart: 7,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-ab-p27-ladybug-problem-2",
    reader: 6,
    substep: "6.1",
    level: "AB",
    title: "The Ladybug Problem Part Two",
    readerPageStart: 27,
    readerPageEnd: 27,
    pdfPageStart: 8,
    pdfPageEnd: 8,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-b-p28-cathys-fateful-call",
    reader: 6,
    substep: "6.1",
    level: "B",
    title: "Cathy's Fateful Call",
    readerPageStart: 28,
    readerPageEnd: 29,
    pdfPageStart: 9,
    pdfPageEnd: 10,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-b-p30-work-docks",
    reader: 6,
    substep: "6.1",
    level: "B",
    title: "Work on the Docks",
    readerPageStart: 30,
    readerPageEnd: 31,
    pdfPageStart: 11,
    pdfPageEnd: 12,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-b-p32-eventful-day-1",
    reader: 6,
    substep: "6.1",
    level: "B",
    title: "An Eventful Day Part One",
    readerPageStart: 32,
    readerPageEnd: 33,
    pdfPageStart: 13,
    pdfPageEnd: 14,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.1-b-p34-eventful-day-2",
    reader: 6,
    substep: "6.1",
    level: "B",
    title: "An Eventful Day Part Two",
    readerPageStart: 34,
    readerPageEnd: 34,
    pdfPageStart: 15,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-ab-p60-cavity-1",
    reader: 6,
    substep: "6.2",
    level: "AB",
    title: "A Filling for a Cavity Part One",
    readerPageStart: 60,
    readerPageEnd: 61,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-ab-p62-cavity-2",
    reader: 6,
    substep: "6.2",
    level: "AB",
    title: "A Filling for a Cavity Part Two",
    readerPageStart: 62,
    readerPageEnd: 63,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-ab-p64-island-life-1",
    reader: 6,
    substep: "6.2",
    level: "AB",
    title: "A New Life on an Island Part One",
    readerPageStart: 64,
    readerPageEnd: 65,
    pdfPageStart: 20,
    pdfPageEnd: 21,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-ab-p66-island-life-2",
    reader: 6,
    substep: "6.2",
    level: "AB",
    title: "A New Life on an Island Part Two",
    readerPageStart: 66,
    readerPageEnd: 67,
    pdfPageStart: 22,
    pdfPageEnd: 23,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-b-p68-travel-map",
    reader: 6,
    substep: "6.2",
    level: "B",
    title: "Travel Map",
    readerPageStart: 68,
    readerPageEnd: 69,
    pdfPageStart: 24,
    pdfPageEnd: 25,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.2-b-p70-trip-lifetime",
    reader: 6,
    substep: "6.2",
    level: "B",
    title: "A Trip of a Lifetime",
    readerPageStart: 70,
    readerPageEnd: 71,
    pdfPageStart: 26,
    pdfPageEnd: 27,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-ab-p86-bike-nantucket",
    reader: 6,
    substep: "6.3",
    level: "AB",
    title: "A Bike Ride on Nantucket",
    readerPageStart: 86,
    readerPageEnd: 87,
    pdfPageStart: 28,
    pdfPageEnd: 29,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-ab-p88-pumpkins-1",
    reader: 6,
    substep: "6.3",
    level: "AB",
    title: "Crazy About Pumpkins Part One",
    readerPageStart: 88,
    readerPageEnd: 89,
    pdfPageStart: 30,
    pdfPageEnd: 31,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-ab-p90-pumpkins-2",
    reader: 6,
    substep: "6.3",
    level: "AB",
    title: "Crazy About Pumpkins Part Two",
    readerPageStart: 90,
    readerPageEnd: 91,
    pdfPageStart: 32,
    pdfPageEnd: 33,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-b-p92-life-chipmunk",
    reader: 6,
    substep: "6.3",
    level: "B",
    title: "The Life of a Chipmunk",
    readerPageStart: 92,
    readerPageEnd: 93,
    pdfPageStart: 34,
    pdfPageEnd: 35,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-b-p94-tom-travels-1",
    reader: 6,
    substep: "6.3",
    level: "B",
    title: "Tom Travels the Land Part One",
    readerPageStart: 94,
    readerPageEnd: 95,
    pdfPageStart: 36,
    pdfPageEnd: 37,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.3-b-p96-tom-travels-2",
    reader: 6,
    substep: "6.3",
    level: "B",
    title: "Tom Travels the Land Part Two",
    readerPageStart: 96,
    readerPageEnd: 97,
    pdfPageStart: 38,
    pdfPageEnd: 39,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-ab-p122-apple-picking",
    reader: 6,
    substep: "6.4",
    level: "AB",
    title: "Apple Picking",
    readerPageStart: 122,
    readerPageEnd: 123,
    pdfPageStart: 40,
    pdfPageEnd: 41,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-ab-p124-stumble-puddle",
    reader: 6,
    substep: "6.4",
    level: "AB",
    title: "A Stumble in a Puddle",
    readerPageStart: 124,
    readerPageEnd: 125,
    pdfPageStart: 42,
    pdfPageEnd: 43,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-ab-p126-candle-shop",
    reader: 6,
    substep: "6.4",
    level: "AB",
    title: "Pete's Candle Shop",
    readerPageStart: 126,
    readerPageEnd: 127,
    pdfPageStart: 44,
    pdfPageEnd: 45,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-ab-p128-jumping-rope",
    reader: 6,
    substep: "6.4",
    level: "AB",
    title: "Jumping Rope",
    readerPageStart: 128,
    readerPageEnd: 129,
    pdfPageStart: 46,
    pdfPageEnd: 47,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-b-p130-james-new-job",
    reader: 6,
    substep: "6.4",
    level: "B",
    title: "James and the New Job",
    readerPageStart: 130,
    readerPageEnd: 131,
    pdfPageStart: 48,
    pdfPageEnd: 49,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-b-p132-castle-visit-1",
    reader: 6,
    substep: "6.4",
    level: "B",
    title: "The Castle Visit Part One",
    readerPageStart: 132,
    readerPageEnd: 133,
    pdfPageStart: 50,
    pdfPageEnd: 51,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader6-6.4-b-p134-castle-visit-2",
    reader: 6,
    substep: "6.4",
    level: "B",
    title: "The Castle Visit Part Two",
    readerPageStart: 134,
    readerPageEnd: 134,
    pdfPageStart: 52,
    pdfPageEnd: 52,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_6 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-ab-p22-book-legends",
    reader: 7,
    substep: "7.1",
    level: "AB",
    title: "A Book of Legends",
    readerPageStart: 22,
    readerPageEnd: 23,
    pdfPageStart: 2,
    pdfPageEnd: 3,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-ab-p24-cisco-bike-shop-1",
    reader: 7,
    substep: "7.1",
    level: "AB",
    title: "Nigel and the Cisco Bike Shop Part One",
    readerPageStart: 24,
    readerPageEnd: 25,
    pdfPageStart: 4,
    pdfPageEnd: 5,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-ab-p26-cisco-bike-shop-2",
    reader: 7,
    substep: "7.1",
    level: "AB",
    title: "Nigel and the Cisco Bike Shop Part Two",
    readerPageStart: 26,
    readerPageEnd: 27,
    pdfPageStart: 6,
    pdfPageEnd: 7,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-ab-p28-space-age-skit-1",
    reader: 7,
    substep: "7.1",
    level: "AB",
    title: "Space Age Skit Part One",
    readerPageStart: 28,
    readerPageEnd: 29,
    pdfPageStart: 8,
    pdfPageEnd: 9,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-ab-p30-space-age-skit-2",
    reader: 7,
    substep: "7.1",
    level: "AB",
    title: "Space Age Skit Part Two",
    readerPageStart: 30,
    readerPageEnd: 31,
    pdfPageStart: 10,
    pdfPageEnd: 11,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-b-p32-magic-act",
    reader: 7,
    substep: "7.1",
    level: "B",
    title: "Stacy's Magic Act",
    readerPageStart: 32,
    readerPageEnd: 33,
    pdfPageStart: 12,
    pdfPageEnd: 13,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-b-p34-gem-theft-1",
    reader: 7,
    substep: "7.1",
    level: "B",
    title: "Gem Theft Part One",
    readerPageStart: 34,
    readerPageEnd: 35,
    pdfPageStart: 14,
    pdfPageEnd: 15,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-b-p36-gem-theft-2",
    reader: 7,
    substep: "7.1",
    level: "B",
    title: "Gem Theft Part Two",
    readerPageStart: 36,
    readerPageEnd: 37,
    pdfPageStart: 16,
    pdfPageEnd: 17,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-b-p38-secret-agent-1",
    reader: 7,
    substep: "7.1",
    level: "B",
    title: "Secret Agent Part One",
    readerPageStart: 38,
    readerPageEnd: 39,
    pdfPageStart: 18,
    pdfPageEnd: 19,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.1-b-p40-secret-agent-2",
    reader: 7,
    substep: "7.1",
    level: "B",
    title: "Secret Agent Part Two",
    readerPageStart: 40,
    readerPageEnd: 40,
    pdfPageStart: 20,
    pdfPageEnd: 20,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-ab-p52-prince-wilson-1",
    reader: 7,
    substep: "7.2",
    level: "AB",
    title: "The Prince of Wilson Castle Part One",
    readerPageStart: 52,
    readerPageEnd: 53,
    pdfPageStart: 21,
    pdfPageEnd: 22,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-ab-p54-prince-wilson-2",
    reader: 7,
    substep: "7.2",
    level: "AB",
    title: "The Prince of Wilson Castle Part Two",
    readerPageStart: 54,
    readerPageEnd: 55,
    pdfPageStart: 23,
    pdfPageEnd: 24,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-ab-p56-dance-contest",
    reader: 7,
    substep: "7.2",
    level: "AB",
    title: "The Dance Contest",
    readerPageStart: 56,
    readerPageEnd: 57,
    pdfPageStart: 25,
    pdfPageEnd: 26,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-b-p58-stonehenge-1",
    reader: 7,
    substep: "7.2",
    level: "B",
    title: "Secrets of Stonehenge Part One",
    readerPageStart: 58,
    readerPageEnd: 59,
    pdfPageStart: 27,
    pdfPageEnd: 28,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-b-p60-stonehenge-2",
    reader: 7,
    substep: "7.2",
    level: "B",
    title: "Secrets of Stonehenge Part Two",
    readerPageStart: 60,
    readerPageEnd: 61,
    pdfPageStart: 29,
    pdfPageEnd: 30,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.2-b-p62-remote-lodge",
    reader: 7,
    substep: "7.2",
    level: "B",
    title: "The Remote Lodge",
    readerPageStart: 62,
    readerPageEnd: 63,
    pdfPageStart: 31,
    pdfPageEnd: 32,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-ab-p82-dolphins-life-1",
    reader: 7,
    substep: "7.3",
    level: "AB",
    title: "A Dolphin's Life Part One",
    readerPageStart: 82,
    readerPageEnd: 83,
    pdfPageStart: 33,
    pdfPageEnd: 34,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-ab-p84-dolphins-life-2",
    reader: 7,
    substep: "7.3",
    level: "AB",
    title: "A Dolphin's Life Part Two",
    readerPageStart: 84,
    readerPageEnd: 85,
    pdfPageStart: 35,
    pdfPageEnd: 36,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-ab-p86-online-science-1",
    reader: 7,
    substep: "7.3",
    level: "AB",
    title: "The Online Science Class Part One",
    readerPageStart: 86,
    readerPageEnd: 87,
    pdfPageStart: 37,
    pdfPageEnd: 38,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-ab-p88-online-science-2",
    reader: 7,
    substep: "7.3",
    level: "AB",
    title: "The Online Science Class Part Two",
    readerPageStart: 88,
    readerPageEnd: 89,
    pdfPageStart: 39,
    pdfPageEnd: 40,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-ab-p90-first-telephone-call",
    reader: 7,
    substep: "7.3",
    level: "AB",
    title: "The First Telephone Call",
    readerPageStart: 90,
    readerPageEnd: 91,
    pdfPageStart: 41,
    pdfPageEnd: 42,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-b-p92-elephant-haven-1",
    reader: 7,
    substep: "7.3",
    level: "B",
    title: "An African Elephant Haven Part One",
    readerPageStart: 92,
    readerPageEnd: 93,
    pdfPageStart: 43,
    pdfPageEnd: 44,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-b-p94-elephant-haven-2",
    reader: 7,
    substep: "7.3",
    level: "B",
    title: "An African Elephant Haven Part Two",
    readerPageStart: 94,
    readerPageEnd: 95,
    pdfPageStart: 45,
    pdfPageEnd: 46,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-b-p96-bottlenose-dolphin-1",
    reader: 7,
    substep: "7.3",
    level: "B",
    title: "The Bottlenose Dolphin Part One",
    readerPageStart: 96,
    readerPageEnd: 97,
    pdfPageStart: 47,
    pdfPageEnd: 48,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-b-p98-bottlenose-dolphin-2",
    reader: 7,
    substep: "7.3",
    level: "B",
    title: "The Bottlenose Dolphin Part Two",
    readerPageStart: 98,
    readerPageEnd: 99,
    pdfPageStart: 49,
    pdfPageEnd: 50,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.3-b-p100-wildlife-refuge",
    reader: 7,
    substep: "7.3",
    level: "B",
    title: "The Wildlife Refuge",
    readerPageStart: 100,
    readerPageEnd: 101,
    pdfPageStart: 51,
    pdfPageEnd: 52,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-ab-p122-new-kitten",
    reader: 7,
    substep: "7.4",
    level: "AB",
    title: "The New Kitten",
    readerPageStart: 122,
    readerPageEnd: 123,
    pdfPageStart: 53,
    pdfPageEnd: 54,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-ab-p124-class-celebration",
    reader: 7,
    substep: "7.4",
    level: "AB",
    title: "Mr. Vincent's Class Celebration",
    readerPageStart: 124,
    readerPageEnd: 125,
    pdfPageStart: 55,
    pdfPageEnd: 56,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-ab-p126-inca-civilization",
    reader: 7,
    substep: "7.4",
    level: "AB",
    title: "The Inca Civilization",
    readerPageStart: 126,
    readerPageEnd: 127,
    pdfPageStart: 57,
    pdfPageEnd: 58,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-b-p128-television-1",
    reader: 7,
    substep: "7.4",
    level: "B",
    title: "The Invention of the Television Part One",
    readerPageStart: 128,
    readerPageEnd: 129,
    pdfPageStart: 59,
    pdfPageEnd: 60,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-b-p130-television-2",
    reader: 7,
    substep: "7.4",
    level: "B",
    title: "The Invention of the Television Part Two",
    readerPageStart: 130,
    readerPageEnd: 131,
    pdfPageStart: 61,
    pdfPageEnd: 62,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.4-b-p132-judge-phillips",
    reader: 7,
    substep: "7.4",
    level: "B",
    title: "A Position with Judge Phillips",
    readerPageStart: 132,
    readerPageEnd: 133,
    pdfPageStart: 63,
    pdfPageEnd: 64,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-ab-p146-clock-time-1",
    reader: 7,
    substep: "7.5",
    level: "AB",
    title: "The Clock that Couldn't Tell Time Part One",
    readerPageStart: 146,
    readerPageEnd: 147,
    pdfPageStart: 65,
    pdfPageEnd: 66,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-ab-p148-clock-time-2",
    reader: 7,
    substep: "7.5",
    level: "AB",
    title: "The Clock that Couldn't Tell Time Part Two",
    readerPageStart: 148,
    readerPageEnd: 149,
    pdfPageStart: 67,
    pdfPageEnd: 68,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-ab-p150-lonely-fish",
    reader: 7,
    substep: "7.5",
    level: "AB",
    title: "A Lonely Fish",
    readerPageStart: 150,
    readerPageEnd: 151,
    pdfPageStart: 69,
    pdfPageEnd: 70,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-b-p152-vast-pacific",
    reader: 7,
    substep: "7.5",
    level: "B",
    title: "The Vast Pacific",
    readerPageStart: 152,
    readerPageEnd: 153,
    pdfPageStart: 71,
    pdfPageEnd: 72,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-b-p154-cyrus-shore",
    reader: 7,
    substep: "7.5",
    level: "B",
    title: "Cyrus Skips the Shore",
    readerPageStart: 154,
    readerPageEnd: 155,
    pdfPageStart: 73,
    pdfPageEnd: 74,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  },
  {
    id: "reader7-7.5-b-p156-ice-rink-mixup",
    reader: 7,
    substep: "7.5",
    level: "B",
    title: "Ice Rink Mix-Up",
    readerPageStart: 156,
    readerPageEnd: 157,
    pdfPageStart: 75,
    pdfPageEnd: 76,
    pdfPath: "Part 9 Reading Passages from Readers/WRS_Student_Reader_7 - Reading Passages Only.pdf"
  }
];

function ttById(id) {
  return document.getElementById(id);
}

function ttActiveGroup() {
  return activeGroup();
}

function ttBuildLesson() {
  const group = ttActiveGroup();
  const skill = activeStep(group);
  ttLesson = createLesson(group, skill, 0, 1);
  ttLesson.scheduledDate = ttTodayKey();
  ttApplySection9StoryToLesson(ttLesson, group, skill);
  ttEnsureSection2MissIndexes(ttLesson, group, skill);
  return ttLesson;
}

function ttClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ttSubstepIndex(substep) {
  return scopeMap.findIndex((item) => item.id === substep);
}

function ttSection9ApproachLabel(approachId) {
  return TT_SECTION9_APPROACHES.find((item) => item.id === approachId)?.label || TT_SECTION9_APPROACHES[0].label;
}

function ttPassageLabel(passage) {
  if (!passage) return "Select a story";
  const pageLabel = passage.readerPageStart === passage.readerPageEnd
    ? `p. ${passage.readerPageStart}`
    : `pp. ${passage.readerPageStart}-${passage.readerPageEnd}`;
  return `${passage.title} - ${passage.substep} ${passage.level} - ${pageLabel}`;
}

function ttPassageAvailableForSubstep(passage, currentSubstep) {
  if (!passage) return false;
  const currentIndex = ttSubstepIndex(currentSubstep);
  const passageIndex = ttSubstepIndex(passage.substep);
  if (currentIndex < 0 || passageIndex < 0) return true;
  if ((currentSubstep === "1.1" || currentSubstep === "1.2") && passage.substep === "1.3") return true;
  return passageIndex <= currentIndex;
}

function ttPassagesForSubstep(substep) {
  return TT_READER_PASSAGES.filter((passage) => ttPassageAvailableForSubstep(passage, substep));
}

function ttPassageById(id) {
  return TT_READER_PASSAGES.find((passage) => passage.id === id) || null;
}

function ttSection9CompanionFor(passageOrId) {
  const id = typeof passageOrId === "string"
    ? passageOrId
    : passageOrId?.id || passageOrId?.passageId || "";
  return id ? window.section9PassageCompanions?.[id] || null : null;
}

function ttSection9QuestionList(questions = []) {
  return (questions || [])
    .slice(0, 4)
    .map((item) => `<li><strong>${escapeHtml(item.type || "question")}:</strong> ${escapeHtml(item.question || item)}</li>`)
    .join("");
}

function ttSection9CompanionHtml(passage) {
  const companion = ttSection9CompanionFor(passage);
  if (!companion) {
    return `<div class="passage-companion passage-companion-empty">
      <strong>Passage prep</strong>
      <span>Vocabulary and two-level questions are not drafted for this passage yet.</span>
    </div>`;
  }
  const vocabulary = (companion.vocabulary || []).slice(0, 6);
  const support = companion.questions?.support || [];
  const stretch = companion.questions?.stretch || [];
  return `<div class="passage-companion">
    <div class="passage-companion-head">
      <div>
        <span>Teacher prep</span>
        <strong>Pre-teach vocabulary and questions</strong>
      </div>
      <a class="passage-companion-link" href="Section9PassagePrep.html?passage=${encodeURIComponent(passage.id)}">Review library</a>
      <em>${escapeHtml(companion.status || "draft")}</em>
    </div>
    <div class="passage-vocab-list">
      ${vocabulary.map((item) => `<article>
        <strong>${escapeHtml(item.word)}</strong>
        <span>${escapeHtml(item.meaning)}</span>
        <small>${escapeHtml(item.prompt || item.whyPreteach || "")}</small>
      </article>`).join("")}
    </div>
    <div class="passage-question-grid">
      <article>
        <strong>Support questions</strong>
        <ol>${ttSection9QuestionList(support)}</ol>
      </article>
      <article>
        <strong>Stretch questions</strong>
        <ol>${ttSection9QuestionList(stretch)}</ol>
      </article>
    </div>
  </div>`;
}

function ttDefaultPassageFor(group, skill) {
  const currentSubstep = skill?.id || group?.substep || "1.1";
  const available = ttPassagesForSubstep(currentSubstep);
  const saved = ttPassageById(group?.section9Story?.passageId);
  if (saved && ttPassageAvailableForSubstep(saved, currentSubstep)) return saved;
  const preferredLevel = (group?.readerLevel || "AB") === "B" ? "B" : "AB";
  const currentIndex = ttSubstepIndex(currentSubstep);
  const closest = available
    .slice()
    .sort((a, b) => {
      const bDistance = currentIndex - ttSubstepIndex(b.substep);
      const aDistance = currentIndex - ttSubstepIndex(a.substep);
      if (aDistance !== bDistance) return aDistance - bDistance;
      const aLevelScore = a.level === preferredLevel ? 0 : 1;
      const bLevelScore = b.level === preferredLevel ? 0 : 1;
      if (aLevelScore !== bLevelScore) return aLevelScore - bLevelScore;
      return (a.readerPageStart || 0) - (b.readerPageStart || 0);
    })[0];
  return closest || available[0] || saved || TT_READER_PASSAGES[0] || null;
}

function ttEnsureSection9Story(group, skill) {
  if (!group) return null;
  const passage = ttDefaultPassageFor(group, skill);
  if (!passage) return null;
  group.section9Story ||= {};
  group.section9Story.passageId ||= passage.id;
  group.section9Story.approach ||= "comprehension-sos";
  group.section9Story.updatedAt ||= new Date().toISOString();
  return { passage: ttPassageById(group.section9Story.passageId) || passage, approach: group.section9Story.approach };
}

function ttApplySection9StoryToLesson(lesson, group, skill, options = {}) {
  if (!lesson || !group) return lesson;
  const fallback = ttEnsureSection9Story(group, skill);
  const passageId = options.passageId || lesson.section9Story?.passageId || fallback?.passage?.id || "";
  const approach = options.approach || lesson.section9Story?.approach || fallback?.approach || "comprehension-sos";
  const passage = ttPassageById(passageId) || fallback?.passage || ttDefaultPassageFor(group, skill);
  if (!passage) return lesson;
  lesson.section9Story = {
    passageId: passage.id,
    approach,
    reader: passage.reader,
    title: passage.title,
    substep: passage.substep,
    level: passage.level,
    readerPageStart: passage.readerPageStart,
    readerPageEnd: passage.readerPageEnd,
    pdfPageStart: passage.pdfPageStart,
    pdfPageEnd: passage.pdfPageEnd,
    pdfPath: passage.pdfPath
  };
  lesson.passagePageNumber = passage.readerPageStart;
  lesson.passageLevel = passage.level;
  lesson.passage = `${ttPassageLabel(passage)}. Approach: ${ttSection9ApproachLabel(approach)}.`;
  return lesson;
}

function ttSaveSection9StoryForGroup(group, passageId, approach) {
  if (!group || !passageId) return;
  group.section9Story = {
    passageId,
    approach: approach || group.section9Story?.approach || "comprehension-sos",
    updatedAt: new Date().toISOString()
  };
}

function ttDraftKey(group = ttActiveGroup()) {
  return group?.id || "default";
}

function ttLoadDraftLesson() {
  ttNormalizeTeachTodayState();
  const draft = appState.lessonDrafts?.[ttDraftKey()];
  if (!draft) return null;
  ttLesson = ttClone(draft);
  delete ttLesson.savedPlanId;
  return ttLesson;
}

function ttSaveDraftLesson(options = {}) {
  if (!ttLesson) return null;
  ttNormalizeTeachTodayState();
  const group = ttActiveGroup();
  if (ttLesson.savedPlanId) ttForkSavedLessonDraft();
  ttLesson.draftId ||= `teach-draft-${Date.now()}`;
  ttLesson.draftSavedAt = new Date().toISOString();
  appState.lessonDrafts[ttDraftKey(group)] = ttClone(ttLesson);
  saveState();
  if (options.status !== false) ttSetDraftSaveStatus(group, ttLesson);
  return ttLesson;
}

function ttForkSavedLessonDraft() {
  if (!ttLesson?.savedPlanId) return ttLesson;
  const sourcePlan = ttCurrentPlan();
  ttLesson = ttClone(ttLesson);
  ttLesson.forkedFromPlanId = ttLesson.savedPlanId;
  ttLesson.forkedFromLessonTitle = sourcePlan?.title || "";
  ttLesson.id = `teach-draft-lesson-${Date.now()}`;
  ttLesson.draftId = `teach-draft-${Date.now()}`;
  ttLesson.draftCreatedAt = new Date().toISOString();
  delete ttLesson.savedPlanId;
  delete ttLesson.lessonSequence;
  return ttLesson;
}

function ttRender() {
  ttNormalizeTeachTodayState();
  const group = ttActiveGroup();
  const lesson = ttLesson || ttBuildLesson();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(lesson, skill);
  const plan = ttCurrentPlan();
  // Apply lesson-type class so CSS can show/hide sections
  const rawKey = lesson.lessonType || "full";
  // Normalize legacy part1/part2 to unified "group"
  const lessonTypeKey = (rawKey === "part1" || rawKey === "part2") ? "group" : rawKey;
  document.body.classList.remove("lesson-type-full", "lesson-type-full45", "lesson-type-group", "lesson-type-part1", "lesson-type-part2", "lesson-type-flash");
  document.body.classList.add(`lesson-type-${lessonTypeKey}`);
  // Restore the active group day (if any) after lesson type class swap
  document.body.classList.remove("group-day-1", "group-day-2");
  if (lessonTypeKey === "group" && ttGroupDay) document.body.classList.add(`group-day-${ttGroupDay}`);
  ttUpdateGroupDayButtons();
  // For flash mode, show/hide individual sections based on selection
  for (let i = 1; i <= 10; i++) {
    const sec = ttById(`section${i}`);
    if (!sec) continue;
    if (lessonTypeKey === "flash") {
      const flashSet = new Set(lesson.flashSections || []);
      sec.hidden = !flashSet.has(String(i));
    } else {
      sec.hidden = false; // CSS handles part1/part2 via body class
    }
  }
  // In group mode, §2 stays at its position (Day 1 words); §2b (static HTML after §1b) shows Day 2 words
  // Update §1's "Next" link: in group mode it goes to §1b (the encoding-day repeat)
  const sec1El = ttById("section1");
  if (sec1El) {
    const nl1 = sec1El.querySelector(".next-link");
    if (nl1) {
      if (lessonTypeKey === "group") {
        nl1.href = "#section2"; nl1.textContent = "Next: Section 2";
      } else {
        nl1.href = "#section2"; nl1.textContent = "Next: Section 2";
      }
    }
  }

  ttById("ttTitle").textContent = `${group.name} - ${lesson.substep}`;
  ttById("ttLessonFile").textContent = plan?.title || ttLessonFileName(group, lesson);
  if (!plan) ttSetDraftSaveStatus(group, lesson);
  ttById("ttSkill").textContent = `${skill.id} - ${skill.title}`;
  ttFillGroups(group.id);
  ttFillLessonControls(group);
  if (ttById("ttSubstep")) ttById("ttSubstep").value = lesson.substep;
  if (ttById("ttReaderLevel")) ttById("ttReaderLevel").value = lesson.readerLevel || group.readerLevel || "AB";
  ttFillStudents(group);
  ttFillFrontStudents(group);
  ttRenderGroupSnapshot(group);
  ttRenderLessonIdentity(group, lesson);
  ttRenderLessonTabs();
  ttRenderAttendancePanel(group);
  ttRenderSavedLessons(group);
  ttRenderDataCenter();
  ttRenderWrapUpPanel(group, lesson);
  ttFillOverview(group, skill);
  ttFillSectionRefs(lesson);
  ttFillSounds(skill, lesson);
  ttEnsureSection2MissIndexes(lesson, group, skill);
  // §2 always shows Day 1 words; §2b (group mode only) shows Day 2 words separately
  ttFillWordRow(ttById("ttReviewWords"), lesson.sectionTwoReviewWords || [], {
    onSelect: (word) => ttShowSection2WordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("review", word)
  });
  ttFillWordRow(ttById("ttCurrentWords"), lesson.sectionTwoCurrentWords || [], {
    onSelect: (word) => ttShowSection2WordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("current", word)
  });
  // §2b — Day 2 words (only visible in group mode via CSS)
  ttFillWordRow(ttById("ttReviewWordsB2"), lesson.sectionTwoReviewWordsB2 || [], {
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id)
  });
  ttFillWordRow(ttById("ttCurrentWordsB2"), lesson.sectionTwoCurrentWordsB2 || [], {
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id)
  });
  ttFillWordRow(ttById("ttLastMissedWords"), lesson.sectionTwoLastMissedWords || [], {
    onSelect: (word) => ttShowSection2WordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("lastMisses", word)
  });
  ttFillWordRow(ttById("ttPriorityMissedWords"), lesson.sectionTwoPriorityMissedWords || [], {
    onSelect: (word) => ttShowSection2WordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("priorityMisses", word)
  });
  ttFillSection2ReplacementTools(lesson, skill);
  ttFillSection2DisplayDeck(lesson, skill);
  ttFillSection2BDisplayDeck(lesson, skill);
  ttFillSection3Cards(lesson);
  ttFillWordRow(ttById("ttHfw"), lesson.highFrequencyWords || []);
  ttFillSentences(lesson.readerSentences || []);
  ttFillPart7(lesson, skill);
  ttFillReverse(skill, lesson);
  ttFillDictation(ttActiveDictationPlan(lesson, skill));
  ttRenderSection9(lesson, group, skill);
  ttById("ttWrap").textContent = "Ask one comprehension question, note the hardest word, and decide whether the next lesson should repeat, warm up, or advance.";
  ttSetupChart(lesson);
  ttRenderHomeScreen();
  ttInitSectionCompletion();
  ttSyncStudentDisplay();
}

function ttStudentDisplayPayload(mode = ttStudentDisplayMode) {
  const group = ttActiveGroup();
  const lesson = ttLesson || ttBuildLesson();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  const poster = ttSection1PhotoForSubstep(skill.id);
  const hfwWords = hfwWordsForSubstep(skill.id, lesson).filter(Boolean).slice(0, 12);
  const passage = ttPassageById(lesson.section9Story?.passageId);
  const passageText = lesson.passage || `Use Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} for Section #9.`;
  return {
    mode,
    updatedAt: new Date().toISOString(),
    lessonId: lesson.id || "",
    groupName: group.name || "Group",
    substep: skill.id,
    skillTitle: skill.title || "",
    poster,
    highFrequencyWords: hfwWords,
    notebookSentence: "Copy the sentence your teacher gives you.",
    chart: ttStudentDisplayChartPayload(lesson, skill),
    passageTitle: passage ? ttPassageLabel(passage) : `Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"}`,
    passageText,
    passagePdf: lesson.section9Story || null,
    gameUrl: "Games/index.html",
    privacyTitle: "Private teacher work",
    privacyMessage: "Keep reading, writing, or practicing while your teacher charts."
  };
}

function ttStudentDisplayChartPayload(lesson, skill) {
  const group = ttActiveGroup();
  const reader = Number(skill.reader || lesson.reader || String(skill.id || "").split(".")[0]);
  const wordlistPage = Number(lesson.wordlistPageNumber || 0);
  const level = lesson.readerLevel || group.readerLevel || "AB";
  const activeHalf = ttChartCard?.dataset?.chartHalf || lesson.chartHalf || "bottom";
  const pdfPage = wordlistPage ? wordlistPage + 2 : "";
  const pdfFile = reader ? `Readers%20in%20PDF%20form/WRS_Student_Reader_${reader}.pdf` : "";
  const pdfViewerUrl = reader && wordlistPage
    ? ttPdfViewerHref(
      pdfFile,
      pdfPage,
      `Reader ${reader}, charting p. ${wordlistPage}`
    )
    : "";
  return {
    key: `section4-r${reader || "x"}-p${wordlistPage || "x"}-${level}`,
    title: "Wordlist Charting",
    reader,
    page: wordlistPage,
    pdfPage,
    pdfFile,
    pdfViewerUrl,
    level,
    activeHalf,
    topWords: (lesson.realWords || []).filter(Boolean).slice(0, 15),
    bottomWords: (lesson.nonsenseWords || []).filter(Boolean).slice(0, 15),
    integrityStatus: lesson.section4Integrity?.status || "",
    integrityMessage: lesson.section4Integrity?.message || ""
  };
}

function ttSection4StagePayload() {
  return ttStudentDisplayPayload("chart");
}

function ttProjectSection4(options = {}) {
  ttStudentDisplayMode = "chart";
  const payload = ttSection4StagePayload();
  ttSendStudentDisplay(payload);
  ttRenderSection4StagePreview(payload);
  if (options.open !== false) ttOpenStudentDisplay("chart");
}

function ttToggleSection4StagePreview() {
  const preview = ttById("ttSection4StagePreview");
  if (!preview) return;
  preview.hidden = !preview.hidden;
  ttById("section4")?.classList.toggle("stage-preview-open", !preview.hidden);
  document.body.classList.toggle("section4-stage-preview-open", !preview.hidden);
  if (!preview.hidden) {
    ttProjectSection4({ open: false });
  }
}

function ttRenderSection4StagePreview(payload = ttSection4StagePayload()) {
  const preview = ttById("ttSection4StagePreview");
  const frame = ttById("ttSection4StageFrame");
  if (!preview || !frame) return;
  const src = "StudentDisplay.html?embed=section4-stage&v=stage-section4-page-5";
  if (src && frame.getAttribute("src") !== src) frame.setAttribute("src", src);
  ttById("section4")?.classList.toggle("stage-preview-open", !preview.hidden);
  document.body.classList.toggle("section4-stage-preview-open", !preview.hidden);
}

function ttRenderSection9(lesson, group, skill) {
  ttApplySection9StoryToLesson(lesson, group, skill);
  const story = lesson.section9Story;
  const summary = ttById("ttPassage");
  const pages = ttById("ttPassagePages");
  if (!summary || !pages || !story) return;
  const passage = ttPassageById(story.passageId) || story;
  const approach = story.approach || "comprehension-sos";
  const availablePassages = ttPassagesForSubstep(lesson.substep || skill.id);
  summary.innerHTML = `
    <label class="passage-story-select">
      <span>Story</span>
      <select id="ttSection9PassageSelect" aria-label="Section 9 story">
        ${availablePassages.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === passage.id ? " selected" : ""}>${escapeHtml(ttPassageLabel(item))}</option>`).join("")}
      </select>
    </label>
    <span>${escapeHtml(passage.substep || lesson.substep)} ${escapeHtml(passage.level || lesson.readerLevel || "AB")} · Reader ${escapeHtml(String(passage.reader || lesson.reader || ""))}, ${escapeHtml(ttReaderPageRange(passage))}</span>
    <em>${escapeHtml(ttSection9ApproachLabel(approach))}</em>
    ${ttSection9CompanionHtml(passage)}
  `;
  ttBindSection9StorySelect(group, skill);
  const pdfPages = ttPdfPageRange(passage);
  pages.classList.toggle("one-page", pdfPages.length === 1);
  pages.classList.toggle("two-page", pdfPages.length === 2);
  pages.innerHTML = pdfPages.map((pageNumber, index) => {
    const src = ttPassagePageImageSrc(passage, pageNumber);
    const readerPage = (passage.readerPageStart || 0) + index;
    return `<article class="passage-page-frame">
      <div class="passage-page-label">Reader p. ${escapeHtml(String(readerPage))}</div>
      <img class="passage-page-image" alt="${escapeHtml(passage.title)} page ${escapeHtml(String(readerPage))}" src="${src}">
    </article>`;
  }).join("");
  pages.querySelectorAll("img").forEach((image) => {
    image.addEventListener("load", () => ttResizePassageInk(), { once: true });
  });
  ttPassageInkState.strokes = ttSection9InkStore(lesson).strokes || [];
  ttPassageInkState.zoom = ttSection9InkStore(lesson).zoom || 1;
  ttSetupPassageInk();
}

function ttBindSection9StorySelect(group, skill) {
  const select = ttById("ttSection9PassageSelect");
  if (!select) return;
  select.onchange = () => {
    const passageId = select.value;
    const approach = ttLesson?.section9Story?.approach || group.section9Story?.approach || "comprehension-sos";
    ttSaveSection9StoryForGroup(group, passageId, approach);
    if (ttPlannerDraft?.groupId === group.id) ttPlannerDraft.passageId = passageId;
    ttApplySection9StoryToLesson(ttLesson, group, skill, { passageId, approach });
    ttSaveDraftLesson({ status: false });
    saveState();
    ttRender();
  };
}

function ttReaderPageRange(passage) {
  if (!passage) return "p. --";
  return passage.readerPageStart === passage.readerPageEnd
    ? `p. ${passage.readerPageStart}`
    : `pp. ${passage.readerPageStart}-${passage.readerPageEnd}`;
}

function ttPdfPageRange(passage) {
  const start = Number(passage?.pdfPageStart || 1);
  const end = Math.max(start, Number(passage?.pdfPageEnd || start));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function ttPassagePageImageSrc(passage, pdfPageNumber) {
  if (passage?.reader && /Reading Passages Only\.pdf$/i.test(passage?.pdfPath || "")) {
    return `Part%209%20Reading%20Passages%20from%20Readers/rendered-pages/book${encodeURIComponent(passage.reader)}-page-${String(pdfPageNumber).padStart(2, "0")}.png`;
  }
  return `${encodeURI(passage?.pdfPath || "")}#page=${encodeURIComponent(pdfPageNumber)}`;
}

function ttSection9InkStore(lesson = ttLesson) {
  if (!lesson) return { strokes: [], zoom: 1 };
  lesson.section9Ink ||= {};
  const key = lesson.section9Story?.passageId || "default";
  lesson.section9Ink[key] ||= { strokes: [], zoom: 1 };
  return lesson.section9Ink[key];
}

function ttSetupPassageInk() {
  const stage = ttById("ttPassageStage");
  const surface = ttById("ttPassageSurface");
  const canvas = ttById("ttPassageInk");
  if (!stage || !surface || !canvas) return;
  const zoom = ttPassageInkState.zoom || 1;
  surface.style.width = `${Math.max(stage.clientWidth - 24, 720) * zoom}px`;
  surface.style.setProperty("--passage-zoom", String(zoom));
  canvas.onpointerdown = ttPassagePointerDown;
  canvas.onpointermove = ttPassagePointerMove;
  canvas.onpointerup = ttPassagePointerEnd;
  canvas.onpointercancel = ttPassagePointerEnd;
  canvas.onpointerleave = ttPassagePointerEnd;
  canvas.ontouchstart = ttPassageTouchStart;
  canvas.ontouchmove = ttPassageTouchMove;
  canvas.ontouchend = ttPassageTouchEnd;
  canvas.ontouchcancel = ttPassageTouchEnd;
  canvas.ondblclick = ttPassageDoubleClickZoom;
  stage.onmouseenter = () => { ttPassageStageActive = true; };
  stage.onmouseleave = () => { ttPassageStageActive = false; };
  stage.onpointerenter = () => { ttPassageStageActive = true; };
  stage.onpointerleave = () => { ttPassageStageActive = false; };
  stage.onwheel = null;
  stage.ongesturestart = null;
  stage.ongesturechange = null;
  stage.ongestureend = null;
  ttBindPassageGestureListeners();
  ttResizePassageInk();
  ttBindPassageInkTools();
  requestAnimationFrame(ttResizePassageInk);
}

function ttBindPassageGestureListeners() {
  if (ttPassageGestureListenersBound) return;
  ttPassageGestureListenersBound = true;
  document.addEventListener("wheel", ttPassageGlobalWheelZoom, { capture: true, passive: false });
  window.addEventListener("gesturestart", ttPassageGlobalGestureStart, { capture: true, passive: false });
  window.addEventListener("gesturechange", ttPassageGlobalGestureChange, { capture: true, passive: false });
  window.addEventListener("gestureend", ttPassageGlobalGestureEnd, { capture: true, passive: false });
}

function ttBindPassageInkTools() {
  document.querySelectorAll("[data-passage-mode]").forEach((button) => {
    button.classList.toggle("active", (button.dataset.passageMode || "pen") === (ttPassageInkState.mode || "pen"));
    button.onclick = () => {
      ttPassageInkState.mode = button.dataset.passageMode || "pen";
      document.querySelectorAll("[data-passage-mode]").forEach((item) => item.classList.toggle("active", item === button));
      const size = ttById("ttPassagePenSize");
      if (ttPassageInkState.mode === "highlight" && size && Number(size.value) < 10) {
        ttPassageInkState.size = 12;
        size.value = "12";
      }
    };
  });
  document.querySelectorAll("[data-passage-color]").forEach((button) => {
    button.classList.toggle("active", (button.dataset.passageColor || "") === ttPassageInkState.color);
    button.onclick = () => {
      ttPassageInkState.color = button.dataset.passageColor || ttPassageInkState.color;
      document.querySelectorAll("[data-passage-color]").forEach((item) => item.classList.toggle("active", item === button));
    };
  });
  const size = ttById("ttPassagePenSize");
  if (size) {
    size.value = String(ttPassageInkState.size || 5);
    size.oninput = () => { ttPassageInkState.size = Number(size.value) || 5; };
  }
  const zoomIn = ttById("ttPassageZoomIn");
  const zoomOut = ttById("ttPassageZoomOut");
  if (zoomIn) zoomIn.onclick = () => ttSetPassageZoom((ttPassageInkState.zoom || 1) + 0.15);
  if (zoomOut) zoomOut.onclick = () => ttSetPassageZoom((ttPassageInkState.zoom || 1) - 0.15);
  const undo = ttById("ttPassageUndoInk");
  if (undo) undo.onclick = () => ttUndoPassageInk();
  const clear = ttById("ttPassageClearInk");
  if (clear) clear.onclick = () => {
    ttClearPassageInk();
  };
}

function ttFinalizeActivePassageStroke() {
  if (!ttPassageInkState.drawing || !ttPassageInkState.activeStroke) return;
  if (ttPassageInkState.activeStroke.points.length > 1) {
    ttPassageInkState.strokes.push(ttPassageInkState.activeStroke);
    ttPersistPassageInk();
  }
  ttPassageInkState.drawing = false;
  ttPassageInkState.activeStroke = null;
}

function ttPersistPassageInk(options = {}) {
  const store = ttSection9InkStore();
  store.strokes = ttPassageInkState.strokes || [];
  store.zoom = ttPassageInkState.zoom || 1;
  if (options.save !== false) {
    ttSaveDraftLesson({ status: false });
    saveState();
  }
}

function ttUndoPassageInk() {
  if (!ttPassageInkState.strokes?.length) return;
  ttPassageInkState.strokes.pop();
  ttPersistPassageInk();
  ttRedrawPassageInk();
}

function ttClearPassageInk(options = {}) {
  ttPassageInkState.strokes = [];
  ttPassageInkState.activeStroke = null;
  ttPassageInkState.drawing = false;
  if (options.allStories && ttLesson) {
    ttLesson.section9Ink = {};
  } else {
    ttSection9InkStore().strokes = [];
  }
  ttPersistPassageInk({ save: options.save !== false });
  ttRedrawPassageInk();
}

function ttSetPassageZoom(value) {
  ttSetPassageZoomAt(value);
}

function ttSetPassageZoomAt(value, anchor = null, options = {}) {
  const stage = ttById("ttPassageStage");
  const surface = ttById("ttPassageSurface");
  const previousZoom = ttPassageInkState.zoom || 1;
  const nextZoom = Math.max(0.65, Math.min(2.8, value));
  if (!stage || !surface || Math.abs(nextZoom - previousZoom) < 0.001) return;
  const stageRect = stage.getBoundingClientRect();
  const anchorElement = ttById("ttPassagePages") || surface;
  const anchorRect = anchorElement.getBoundingClientRect();
  const anchorX = anchor?.clientX ?? (stageRect.left + stageRect.width / 2);
  const anchorWidth = Math.max(1, anchorElement.scrollWidth || anchorElement.offsetWidth);
  const ratioX = (anchorX - anchorRect.left) / anchorWidth;
  ttPassageInkState.zoom = nextZoom;
  ttSection9InkStore().zoom = ttPassageInkState.zoom;
  ttSetupPassageInk();
  requestAnimationFrame(() => {
    const newAnchorWidth = Math.max(1, anchorElement.scrollWidth || anchorElement.offsetWidth);
    const nextAnchorRect = anchorElement.getBoundingClientRect();
    const desiredScrollX = (ratioX * newAnchorWidth) - (anchorX - nextAnchorRect.left);
    stage.scrollLeft += desiredScrollX;
    ttResizePassageInk();
  });
  if (options.save !== false) ttPersistPassageInk();
}

function ttSchedulePassageZoomPersist() {
  clearTimeout(ttPassageZoomSaveTimer);
  ttPassageZoomSaveTimer = setTimeout(() => {
    ttPassageZoomSaveTimer = null;
    ttPersistPassageInk();
  }, 220);
}

function ttResizePassageInk() {
  const surface = ttById("ttPassageSurface");
  const pages = ttById("ttPassagePages");
  const canvas = ttById("ttPassageInk");
  if (!surface || !pages || !canvas) return;
  const rect = pages.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  surface.style.minHeight = `${Math.max(520, rect.height)}px`;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ttRedrawPassageInk();
}

function ttPassageCanvasPoint(event) {
  const canvas = ttById("ttPassageInk");
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / Math.max(1, rect.width),
    y: (event.clientY - rect.top) / Math.max(1, rect.height)
  };
}

function ttPassagePointerSnapshot(event) {
  return { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, pointerType: event.pointerType };
}

function ttSafePassagePointerCapture(method, pointerId) {
  const canvas = ttById("ttPassageInk");
  try {
    canvas?.[method]?.(pointerId);
  } catch (err) {
    // Some browsers reject capture for synthetic or interrupted touch pointers.
  }
}

function ttTouchSnapshots(touches = []) {
  return Array.from(touches).slice(0, 2).map((touch, index) => ({
    pointerId: touch.identifier ?? index,
    clientX: touch.clientX,
    clientY: touch.clientY,
    pointerType: "touch"
  }));
}

function ttPassagePinchDistance(points) {
  const [a, b] = points;
  if (!a || !b) return 0;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function ttPassagePinchCenter(points) {
  const [a, b] = points;
  return {
    clientX: ((a?.clientX || 0) + (b?.clientX || 0)) / 2,
    clientY: ((a?.clientY || 0) + (b?.clientY || 0)) / 2
  };
}

function ttStartPassagePinch() {
  const points = [...ttPassagePointerMap.values()];
  if (points.length < 2) return;
  ttFinalizeActivePassageStroke();
  ttPassagePinchState = {
    distance: ttPassagePinchDistance(points),
    zoom: ttPassageInkState.zoom || 1
  };
}

function ttUpdatePassagePinch(event) {
  ttPassagePointerMap.set(event.pointerId, ttPassagePointerSnapshot(event));
  const points = [...ttPassagePointerMap.values()];
  if (points.length < 2 || !ttPassagePinchState?.distance) return false;
  const distance = ttPassagePinchDistance(points);
  const center = ttPassagePinchCenter(points);
  ttSetPassageZoomAt(ttPassagePinchState.zoom * (distance / ttPassagePinchState.distance), center, { save: false });
  return true;
}

function ttPassagePointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  ttSafePassagePointerCapture("setPointerCapture", event.pointerId);
  ttPassagePointerMap.set(event.pointerId, ttPassagePointerSnapshot(event));
  if (ttPassagePointerMap.size >= 2) {
    ttStartPassagePinch();
    event.preventDefault();
    return;
  }
  const point = ttPassageCanvasPoint(event);
  ttPassageInkState.drawing = true;
  ttPassageInkState.activeStroke = {
    color: ttPassageInkState.color,
    size: ttPassageInkState.size,
    mode: ttPassageInkState.mode || "pen",
    points: [point]
  };
  event.preventDefault();
}

function ttPassagePointerMove(event) {
  if (ttPassagePointerMap.has(event.pointerId)) ttPassagePointerMap.set(event.pointerId, ttPassagePointerSnapshot(event));
  if (ttPassagePointerMap.size >= 2) {
    if (ttUpdatePassagePinch(event)) event.preventDefault();
    return;
  }
  if (!ttPassageInkState.drawing || !ttPassageInkState.activeStroke) return;
  ttPassageInkState.activeStroke.points.push(ttPassageCanvasPoint(event));
  ttRedrawPassageInk(ttPassageInkState.activeStroke);
  event.preventDefault();
}

function ttPassagePointerEnd(event) {
  ttSafePassagePointerCapture("releasePointerCapture", event.pointerId);
  ttPassagePointerMap.delete(event.pointerId);
  if (ttPassagePointerMap.size < 2 && ttPassagePinchState) {
    ttPassagePinchState = null;
    ttPersistPassageInk();
  }
  if (ttPassagePointerMap.size >= 1 && !ttPassageInkState.drawing) {
    event.preventDefault();
    return;
  }
  if (!ttPassageInkState.drawing || !ttPassageInkState.activeStroke) return;
  ttPassageInkState.drawing = false;
  if (ttPassageInkState.activeStroke.points.length > 1) {
    ttPassageInkState.strokes.push(ttPassageInkState.activeStroke);
    ttPersistPassageInk();
  }
  ttPassageInkState.activeStroke = null;
  ttRedrawPassageInk();
}

function ttPassageTouchStart(event) {
  if ((event.touches || []).length < 2) return;
  event.preventDefault();
  ttFinalizeActivePassageStroke();
  ttPassagePointerMap.clear();
  const points = ttTouchSnapshots(event.touches);
  ttPassagePinchState = {
    distance: ttPassagePinchDistance(points),
    zoom: ttPassageInkState.zoom || 1
  };
}

function ttPassageTouchMove(event) {
  if ((event.touches || []).length < 2 || !ttPassagePinchState?.distance) return;
  event.preventDefault();
  const points = ttTouchSnapshots(event.touches);
  const distance = ttPassagePinchDistance(points);
  const center = ttPassagePinchCenter(points);
  ttSetPassageZoomAt(ttPassagePinchState.zoom * (distance / ttPassagePinchState.distance), center, { save: false });
}

function ttPassageTouchEnd(event) {
  if (!ttPassagePinchState || (event.touches || []).length >= 2) return;
  event?.preventDefault?.();
  ttPassagePinchState = null;
  ttPersistPassageInk();
}

function ttPassageEventInStage(event) {
  const stage = ttById("ttPassageStage");
  if (!stage) return false;
  const path = event.composedPath?.() || [];
  if (path.includes(stage)) return true;
  return ttPassageStageActive;
}

function ttPassageGlobalWheelZoom(event) {
  if (!ttPassageEventInStage(event)) return;
  ttPassageWheelZoom(event);
}

function ttPassageWheelZoom(event) {
  const isZoomGesture = event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
  if (!isZoomGesture) return;
  event.preventDefault();
  ttFinalizeActivePassageStroke();
  const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  const multiplier = Math.exp(-delta * 0.0018);
  ttSetPassageZoomAt((ttPassageInkState.zoom || 1) * multiplier, event, { save: false });
  ttSchedulePassageZoomPersist();
}

function ttPassageGlobalGestureStart(event) {
  if (!ttPassageEventInStage(event)) return;
  ttPassageGestureStart(event);
}

function ttPassageGlobalGestureChange(event) {
  if (!ttPassageEventInStage(event)) return;
  ttPassageGestureChange(event);
}

function ttPassageGlobalGestureEnd(event) {
  if (!ttPassageEventInStage(event)) return;
  ttPassageGestureEnd(event);
}

function ttPassageDoubleClickZoom(event) {
  event.preventDefault();
  ttFinalizeActivePassageStroke();
  const current = ttPassageInkState.zoom || 1;
  const next = event.shiftKey ? current / 1.35 : current * 1.35;
  ttSetPassageZoomAt(next, event);
}

function ttPassageGestureStart(event) {
  event.preventDefault();
  ttFinalizeActivePassageStroke();
  ttPassagePinchState = {
    distance: 1,
    zoom: ttPassageInkState.zoom || 1
  };
}

function ttPassageGestureChange(event) {
  if (!ttPassagePinchState) ttPassageGestureStart(event);
  event.preventDefault();
  ttSetPassageZoomAt(ttPassagePinchState.zoom * (event.scale || 1), event, { save: false });
}

function ttPassageGestureEnd(event) {
  event?.preventDefault?.();
  ttPassagePinchState = null;
  ttPersistPassageInk();
}

function ttRedrawPassageInk(extraStroke = null) {
  const canvas = ttById("ttPassageInk");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth || 1;
  const height = canvas.clientHeight || 1;
  ctx.clearRect(0, 0, width, height);
  (ttPassageInkState.strokes || []).concat(extraStroke ? [extraStroke] : []).forEach((stroke) => {
    const points = stroke.points || [];
    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = stroke.color || "#ef4444";
    ctx.lineWidth = Number(stroke.size || 5);
    if (stroke.mode === "highlight") {
      ctx.globalAlpha = 0.28;
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth = Math.max(8, Number(stroke.size || 12));
    }
    points.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  });
}

function ttSendStudentDisplay(payload = ttStudentDisplayPayload()) {
  localStorage.setItem(ttStudentDisplayStorageKey, JSON.stringify(payload));
  localStorage.setItem("teachToday.studentDisplayMode", payload.mode);
  ttStudentDisplayChannel?.postMessage(payload);
  if (ttStudentDisplayWindow && !ttStudentDisplayWindow.closed) {
    ttStudentDisplayWindow.postMessage({ type: "teachTodayStudentDisplay", payload }, window.location.origin);
  }
  ttUpdateStudentDisplayStatus(payload.mode);
}

function ttStudentDisplayWindowFeatures(screen = null) {
  if (!screen) return "";
  const width = Math.max(320, Math.round(screen.availWidth || screen.width || 1280));
  const height = Math.max(320, Math.round(screen.availHeight || screen.height || 720));
  const left = Math.round(screen.availLeft ?? screen.left ?? 0);
  const top = Math.round(screen.availTop ?? screen.top ?? 0);
  return `popup=yes,left=${left},top=${top},width=${width},height=${height}`;
}

function ttOpenStudentDisplay(mode = ttStudentDisplayMode, options = {}) {
  ttStudentDisplayMode = mode || ttStudentDisplayMode || "private";
  const payload = ttStudentDisplayPayload(ttStudentDisplayMode);
  localStorage.setItem(ttStudentDisplayStorageKey, JSON.stringify(payload));
  localStorage.setItem("teachToday.studentDisplayMode", ttStudentDisplayMode);
  ttStudentDisplayWindow = window.open("StudentDisplay.html", "teachTodayStudentDisplay", ttStudentDisplayWindowFeatures(options.screen));
  ttStudentDisplayWindow?.focus?.();
  setTimeout(() => ttSendStudentDisplay(payload), 250);
  ttUpdateStudentDisplayStatus(ttStudentDisplayMode);
}

function ttSetStudentDisplayMode(mode) {
  ttStudentDisplayMode = mode || "private";
  if (!ttStudentDisplayWindow || ttStudentDisplayWindow.closed) {
    ttOpenStudentDisplay(ttStudentDisplayMode);
    return;
  }
  ttSendStudentDisplay(ttStudentDisplayPayload(ttStudentDisplayMode));
}

function ttSyncStudentDisplay() {
  const payload = ttStudentDisplayPayload(ttStudentDisplayMode);
  localStorage.setItem(ttStudentDisplayStorageKey, JSON.stringify(payload));
  if (ttStudentDisplayWindow && !ttStudentDisplayWindow.closed) ttSendStudentDisplay(payload);
  else ttUpdateStudentDisplayStatus(ttStudentDisplayMode);
}

function ttShowGroupDayPicker(group, callback) {
  document.getElementById("ttGroupDayPickerModal")?.remove();
  const last = group.lastGroupDay;
  const lastAt = group.lastGroupDayAt ? new Date(group.lastGroupDayAt) : null;
  let reminderText = "No previous day on record";
  if (last && lastAt) {
    const diff = Date.now() - lastAt.getTime();
    const days = Math.floor(diff / 86400000);
    const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    reminderText = `Last taught: Day ${last} · ${when}`;
  }
  const modal = document.createElement("div");
  modal.id = "ttGroupDayPickerModal";
  modal.className = "gdp-backdrop";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="gdp-card">
      <h2 class="gdp-title">Which day are you teaching?</h2>
      <p class="gdp-reminder">${reminderText}</p>
      <label class="gdp-date">Session date
        <input type="date" value="${escapeHtml(ttLesson?.scheduledDate || ttTodayKey())}">
      </label>
      <div class="gdp-btns">
        <button class="gdp-btn" data-gdp-day="1" type="button">
          <strong>Day 1</strong>
          <span>§1–5 + §9/10</span>
        </button>
        <button class="gdp-btn" data-gdp-day="2" type="button">
          <strong>Day 2</strong>
          <span>§1↺ · §2B · §6–8 + §9/10</span>
        </button>
      </div>
      <button class="gdp-skip" type="button">Show full lesson (no filter)</button>
    </div>`;
  const close = (day) => {
    const date = modal.querySelector(".gdp-date input")?.value || ttTodayKey();
    modal.remove();
    callback(day ? { day, date } : null);
  };
  modal.addEventListener("click", (e) => {
    const dayBtn = e.target.closest("[data-gdp-day]");
    if (dayBtn) {
      const day = dayBtn.dataset.gdpDay;
      group.lastGroupDay = day;
      group.lastGroupDayAt = new Date().toISOString();
      saveState();
      close(day);
      return;
    }
    if (e.target.closest(".gdp-skip") || !e.target.closest(".gdp-card")) close(null);
  });
  document.body.appendChild(modal);
  modal.querySelector("[data-gdp-day]")?.focus();
}

function ttUpdateGroupDayButtons() {
  document.querySelectorAll("[data-group-day]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.groupDay === ttGroupDay);
  });
}

function ttSetGroupDay(day) {
  // Toggle: clicking the already-active day clears the selection (show full lesson)
  ttGroupDay = ttGroupDay === day ? null : day;
  document.body.classList.remove("group-day-1", "group-day-2");
  if (ttGroupDay) document.body.classList.add(`group-day-${ttGroupDay}`);
  // Update all day-toggle button states (ribbon + dock)
  ttUpdateGroupDayButtons();
  if (ttLesson && ttGroupDay) {
    ttLesson.activeGroupDay = ttGroupDay;
    const plan = ttCurrentPlan();
    if (plan) {
      plan.activeDay = ttGroupDay;
      ttEnsureLessonWorkflow(plan, ttLesson, ttActiveGroup());
      saveState();
    }
  }
  // Scroll to top of the visible section flow
  document.querySelector(".teach-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttInitSectionCompletion() {
  if (document.body.classList.contains("home-mode")) return;
  const completed = ttLesson?.completedSections || {};
  document.querySelectorAll(".teach-card[id^='section']").forEach((card) => {
    const sectionId = card.id;
    let btn = card.querySelector(".section-done-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.sectionDone = sectionId;
      const head = card.querySelector(".section-head");
      if (head) head.appendChild(btn);
    }
    const state = completed[sectionId] || null;
    btn.textContent = state === "done" ? "✓ Done" : state === "skipped" ? "Skipped" : "Mark done";
    btn.className = `section-done-btn${state === "done" ? " done" : state === "skipped" ? " skipped" : ""}`;
    card.classList.toggle("section-completed", state === "done");
    card.classList.toggle("section-skipped", state === "skipped");
  });
}

function ttToggleSectionDone(sectionId) {
  if (!ttLesson) return;
  ttLesson.completedSections ||= {};
  const current = ttLesson.completedSections[sectionId] || null;
  const next = current === null ? "done" : current === "done" ? "skipped" : null;
  if (next === null) delete ttLesson.completedSections[sectionId];
  else ttLesson.completedSections[sectionId] = next;
  if (sectionId === "section9" && next === "done") ttClearPassageInk({ save: false, allStories: true });
  if (ttLesson.savedPlanId) ttSaveCurrentLesson({ render: false, reason: `Updated ${sectionId.replace("section", "Section ")} progress` });
  else ttSaveDraftLesson({ status: false });
  ttInitSectionCompletion();
  ttRenderLessonIdentity();
}

function ttUpdateStudentDisplayStatus(mode = ttStudentDisplayMode) {
  const status = ttById("ttDisplayStatus");
  const labels = {
    private: "Privacy screen ready",
    poster: "Showing Section 1 poster",
    hfw: "Showing high-frequency words",
    chart: "Showing Section 4 chart",
    passage: "Showing Section 9 passage",
    game: "Showing game hub"
  };
  if (status) status.textContent = labels[mode] || "Student display ready";
  ttById("ttDisplayPanel")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.displayMode === mode);
  });
  ttById("ttPresentDisplayTray")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.displayMode === mode);
  });
  ttById("ttDockDisplay")?.classList.toggle("active", !ttById("ttPresentDisplayTray")?.hidden);
}

function ttTogglePresentDisplayTray(force = null) {
  const tray = ttById("ttPresentDisplayTray");
  const dock = document.querySelector(".presentation-dock");
  if (!tray) return;
  const shouldOpen = force ?? tray.hidden;
  tray.hidden = !shouldOpen;
  dock?.classList.toggle("display-tray-open", shouldOpen);
  ttById("ttDockDisplay")?.classList.toggle("active", shouldOpen);
  if (shouldOpen) ttUpdateStudentDisplayStatus();
}

function ttStudentDisplayStatusText(text) {
  const status = ttById("ttDisplayStatus");
  if (status) status.textContent = text;
}

function ttManualStudentDisplayFallback(reason = "Automatic screen choice is not available in this browser.") {
  ttShowManualStudentDisplaySetup(reason);
  ttStudentDisplayStatusText(`${reason} Manual setup is ready.`);
}

function ttScreenLabel(screen, index) {
  const label = screen.label || (screen.isPrimary ? "Primary display" : `Display ${index + 1}`);
  const size = `${Math.round(screen.width || screen.availWidth || 0)} x ${Math.round(screen.height || screen.availHeight || 0)}`;
  const badges = [screen.isPrimary ? "primary" : "", screen.isInternal ? "built-in" : ""].filter(Boolean).join(", ");
  return `${label}${size.trim() !== "0 x 0" ? ` (${size})` : ""}${badges ? ` - ${badges}` : ""}`;
}

function ttShowScreenChoice(screens) {
  ttStudentDisplayScreens = screens;
  const existing = ttById("ttScreenChoicePanel");
  existing?.remove();
  const panel = document.createElement("section");
  panel.id = "ttScreenChoicePanel";
  panel.className = "screen-choice-panel";
  panel.setAttribute("aria-label", "Choose student display screen");
  panel.innerHTML = `
    <div>
      <p>Presenter Stage</p>
      <strong>Choose a screen</strong>
      <span>Pick the smartboard or extended display. If it lands wrong, use manual move.</span>
    </div>
    <div class="screen-choice-actions">
      ${screens.map((screen, index) => `<button type="button" data-screen-index="${index}">${escapeHtml(ttScreenLabel(screen, index))}</button>`).join("")}
      <button id="ttScreenChoiceManual" class="secondary" type="button">Manual move</button>
      <button id="ttScreenChoiceClose" class="secondary" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelectorAll("[data-screen-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const screen = ttStudentDisplayScreens[Number(button.dataset.screenIndex)];
      ttOpenStudentDisplay(ttStudentDisplayMode, { screen });
      ttStudentDisplayStatusText(`Student display sent to ${ttScreenLabel(screen, Number(button.dataset.screenIndex))}.`);
      panel.remove();
    });
  });
  panel.querySelector("#ttScreenChoiceManual")?.addEventListener("click", () => {
    panel.remove();
    ttManualStudentDisplayFallback("Manual setup:");
  });
  panel.querySelector("#ttScreenChoiceClose")?.addEventListener("click", () => panel.remove());
}

function ttShowManualStudentDisplaySetup(reason) {
  ttById("ttScreenChoicePanel")?.remove();
  const panel = document.createElement("section");
  panel.id = "ttScreenChoicePanel";
  panel.className = "screen-choice-panel";
  panel.setAttribute("aria-label", "Manual student display setup");
  panel.innerHTML = `
    <div>
      <p>Manual Setup</p>
      <strong>Move the stage yourself</strong>
      <span>${escapeHtml(reason)} Open the stage, drag it to the smartboard or extended monitor, then make that window full screen.</span>
    </div>
    <div class="screen-choice-actions">
      <button id="ttScreenChoiceOpenManual" type="button">Open presenter stage</button>
      <button id="ttScreenChoiceClose" class="secondary" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelector("#ttScreenChoiceOpenManual")?.addEventListener("click", () => {
    ttOpenStudentDisplay(ttStudentDisplayMode);
    ttStudentDisplayStatusText("Presenter stage opened. Move it to the smartboard, then make it full screen.");
    panel.remove();
  });
  panel.querySelector("#ttScreenChoiceClose")?.addEventListener("click", () => panel.remove());
}

async function ttProjectStudentDisplay() {
  ttStudentDisplayStatusText("Checking connected screens...");
  if (!window.isSecureContext) {
    ttManualStudentDisplayFallback("Screen detection needs a secure app window.");
    return;
  }
  if (!window.getScreenDetails) {
    ttManualStudentDisplayFallback("This browser cannot choose a display automatically.");
    return;
  }
  try {
    const details = await window.getScreenDetails();
    const screens = Array.from(details?.screens || []);
    if (screens.length < 2) {
      ttManualStudentDisplayFallback("Only one screen was detected.");
      return;
    }
    const current = details.currentScreen;
    const preferred = screens.filter((screen) => screen !== current && !screen.isPrimary);
    const candidates = preferred.length ? preferred : screens.filter((screen) => screen !== current);
    const choices = candidates.length ? candidates : screens;
    if (choices.length === 1) {
      ttOpenStudentDisplay(ttStudentDisplayMode, { screen: choices[0] });
      ttStudentDisplayStatusText(`Student display sent to ${ttScreenLabel(choices[0], screens.indexOf(choices[0]))}.`);
      return;
    }
    ttShowScreenChoice(choices);
  } catch (error) {
    const denied = error?.name === "NotAllowedError";
    ttManualStudentDisplayFallback(denied ? "Screen permission was not allowed." : "Automatic screen choice did not work.");
  }
}

function ttFillSectionRefs(lesson) {
  const wordlist = `Reader ${lesson.reader}, p. ${lesson.wordlistPageNumber || "--"} - ${lesson.readerLevel || "AB"}`;
  const sentence = lesson.sentenceMeta
    ? lesson.sentenceMeta.replace("Reader ", "Reader ")
    : `Reader ${lesson.reader}, p. -- - ${lesson.readerLevel || "AB"}`;
  const passage = lesson.section9Story?.title
    ? `${lesson.section9Story.title} - ${lesson.section9Story.substep} ${lesson.section9Story.level}`
    : `Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} - ${lesson.passageLevel || lesson.readerLevel || "AB"}`;
  const refs = {
    ttSection1Ref: lesson.substep,
    ttSection2Ref: wordlist,
    ttSection3Ref: `${lesson.substep} cards`,
    ttSection4Ref: wordlist,
    ttSection5Ref: sentence,
    ttSection6Ref: `${lesson.substep} reverse drill`,
    ttSection7Ref: `${lesson.substep} spelling`,
    ttSection8Ref: `Dictation Book ${lesson.substep}`,
    ttSection9Ref: passage
  };
  Object.entries(refs).forEach(([id, text]) => {
    const node = ttById(id);
    if (node) node.textContent = text;
  });
}

function ttRenderDataCenter() {
  const lastSave = appState.lastSavedAt ? new Date(appState.lastSavedAt) : null;
  const lastBackup = localStorage.getItem("teachToday.lastBackupAt");
  const lastCloudSync = localStorage.getItem("teachToday.lastCloudSyncAt");
  const cloudStatus = localStorage.getItem("teachToday.cloudSyncStatus") || "Choose a local backup folder to save a file on this Mac.";
  const cloudFolder = localStorage.getItem("teachToday.cloudSyncFolderName");
  const driveStatus = localStorage.getItem("teachToday.driveStatus") || "Connect Google Drive to upload audio into your Drive.";
  const lastFirebaseSync = localStorage.getItem("teachToday.lastFirebaseSyncAt");
  const firebaseStatus = localStorage.getItem("teachToday.firebaseSyncStatus") || "Firebase internet sync is ready.";
  const records = appState.masterRecords?.length || 0;
  const lessons = (appState.groups || []).reduce((sum, group) => sum + (group.history?.length || 0), 0);
  const dictation = (appState.groups || []).reduce((sum, group) => sum + (group.dictationMisses?.length || 0), 0);
  const encoding = (appState.groups || []).reduce((sum, group) => sum + (group.encodingObservations?.length || 0), 0);
  const lastSaveEl = ttById("ttLastInternalSave");
  const lastBackupEl = ttById("ttLastBackup");
  const lastCloudSyncEl = ttById("ttLastCloudSync");
  const lastFirebaseSyncEl = ttById("ttLastFirebaseSync");
  const countsEl = ttById("ttDataCounts");
  const cloudStatusEl = ttById("ttCloudSyncStatus");
  const driveStatusEl = ttById("ttDriveSyncStatus");
  const firebaseStatusEl = ttById("ttFirebaseSyncStatus");
  const secureLegacyButton = ttById("ttSecureLegacyStudentData");
  if (lastSaveEl) lastSaveEl.textContent = lastSave ? formatDateTime(lastSave) : "Not saved yet";
  if (lastBackupEl) lastBackupEl.textContent = lastBackup ? formatDateTime(new Date(lastBackup)) : "No backup yet";
  if (lastCloudSyncEl) lastCloudSyncEl.textContent = lastCloudSync ? formatDateTime(new Date(lastCloudSync)) : "Not connected";
  if (lastFirebaseSyncEl) lastFirebaseSyncEl.textContent = lastFirebaseSync ? formatDateTime(new Date(lastFirebaseSync)) : "Not synced";
  if (countsEl) countsEl.textContent = `${records} / ${lessons}${dictation || encoding ? ` / ${dictation + encoding}` : ""}`;
  if (cloudStatusEl) cloudStatusEl.textContent = `${cloudFolder ? `${cloudFolder}: ` : ""}${cloudStatus} Local browser storage is still saved first.`;
  if (driveStatusEl) driveStatusEl.textContent = `${driveStatus} Local browser storage is still saved first.`;
  if (firebaseStatusEl) firebaseStatusEl.textContent = `${firebaseStatus} Local browser storage is still saved first.`;
  if (secureLegacyButton) secureLegacyButton.hidden = !ttFirebaseUser || Boolean(localStorage.getItem("teachToday.privacyMigrationReceipt"));
}

function ttShowConnectionNotice(message, title = "Cloud connection issue") {
  if (ttWorkOffline) return;
  const panel = ttById("ttConnectionNotice");
  if (!panel) return;
  ttById("ttConnectionTitle").textContent = title;
  ttById("ttConnectionMessage").textContent = message;
  panel.hidden = false;
}

function ttHideConnectionNotice() {
  const panel = ttById("ttConnectionNotice");
  if (panel) panel.hidden = true;
}

function ttSetWorkOffline(value) {
  ttWorkOffline = Boolean(value);
  localStorage.setItem("teachToday.workOffline", ttWorkOffline ? "true" : "false");
  if (ttWorkOffline) {
    localStorage.setItem("teachToday.firebaseSyncStatus", "Working offline. Local browser storage is still saving.");
    localStorage.setItem("teachToday.driveStatus", "Working offline. Google Drive audio uploads are paused.");
    ttHideConnectionNotice();
    ttRenderDataCenter();
    return;
  }
  ttRetryCloudConnections();
}

async function ttRetryCloudConnections() {
  ttWorkOffline = false;
  localStorage.setItem("teachToday.workOffline", "false");
  if (!navigator.onLine) {
    ttShowConnectionNotice("This device is offline. Keep working locally or try again when the internet is back.", "Offline mode available");
    return;
  }
  localStorage.setItem("teachToday.firebaseSyncStatus", "Retrying cloud sync...");
  localStorage.setItem("teachToday.driveStatus", "Retrying Google Drive audio...");
  ttRenderDataCenter();
  try {
    await ttFirebaseSyncWrite("Saved to Firebase after reconnect.");
    if (ttDriveAccessToken) await ttUploadPendingAudioToDrive();
    else localStorage.setItem("teachToday.driveStatus", "Google Drive needs permission. Click Google Drive audio in Records.");
    const firebaseStatus = localStorage.getItem("teachToday.firebaseSyncStatus") || "";
    const driveStatus = localStorage.getItem("teachToday.driveStatus") || "";
    const stillBlocked = /could not|failed|offline/i.test(`${firebaseStatus} ${driveStatus}`);
    if (!stillBlocked) ttHideConnectionNotice();
  } catch (err) {
    ttShowConnectionNotice(`Cloud retry failed: ${err?.message || "unknown error"}`);
  } finally {
    ttRenderDataCenter();
  }
}

function ttInitConnectionMonitor() {
  window.addEventListener("offline", () => {
    ttShowConnectionNotice("This device is offline. Teach Today will keep saving locally.", "You are offline");
  });
  window.addEventListener("online", () => {
    if (!ttWorkOffline) ttRetryCloudConnections();
  });
  if (!navigator.onLine) {
    ttShowConnectionNotice("This device is offline. Teach Today will keep saving locally.", "You are offline");
  }
}

function formatDateTime(date) {
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function ttNormalizeTeachTodayState() {
  appState.openLessonTabs ||= [];
  appState.lessonScrollPositions ||= {};
  appState.lessonDrafts ||= {};
  appState.attendanceRecords ||= {};
  appState.rosterStudents ||= [];
  const existingRosterNames = new Set(appState.rosterStudents.map((student) => String(student.name || student).toLowerCase()));
  appState.groups?.forEach((group) => {
    (group.students || []).forEach((name) => {
      if (!existingRosterNames.has(String(name).toLowerCase())) {
        appState.rosterStudents.push({ name, school: group.school || group.name || "" });
        existingRosterNames.add(String(name).toLowerCase());
      }
    });
  });
  appState.groups?.forEach((group) => {
    group.lessonSerial ||= 0;
    group.history ||= [];
  });
  ttBackfillLessonLinks();
}

function ttRecordTime(record) {
  return new Date(record?.date || record?.displayDate || 0).getTime() || 0;
}

function ttPlanTime(plan) {
  return new Date(plan?.savedAt || plan?.created || 0).getTime() || 0;
}

function ttFindBestPlanForRecord(group, record) {
  const plans = (group.history || []).filter((plan) => plan.source === "TeachToday" && plan.lessons?.[0]);
  if (!plans.length) return null;
  const recordDay = dateKey(record.date || record.displayDate);
  const recordTime = ttRecordTime(record);
  const scored = plans.map((plan) => {
    const lesson = plan.lessons[0];
    let score = 0;
    if (record.lessonId && lesson.id === record.lessonId) score += 1000;
    if (record.planId && plan.id === record.planId) score += 1000;
    if (recordDay && (plan.dailyKey === recordDay || dateKey(plan.savedAt || plan.created) === recordDay)) score += 120;
    if (record.substep && lesson.substep === record.substep) score += 80;
    if (record.wordlistPage && String(lesson.wordlistPageNumber || "") === String(record.wordlistPage)) score += 60;
    if (record.reader && String(lesson.reader || "") === String(record.reader)) score += 25;
    const distance = Math.abs(ttPlanTime(plan) - recordTime);
    score -= Math.min(distance / 60000, 240);
    return { plan, score, distance };
  }).sort((a, b) => b.score - a.score || a.distance - b.distance);
  return scored[0]?.score > 0 ? scored[0].plan : null;
}

function ttApplyPlanLinkToRecord(record, plan) {
  if (!record || !plan?.lessons?.[0]) return false;
  const lesson = plan.lessons[0];
  let changed = false;
  const values = {
    lessonId: lesson.id || "",
    planId: plan.id || "",
    lessonTitle: plan.title || "",
    lessonSavedAt: plan.savedAt || ""
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value && record[key] !== value) {
      record[key] = value;
      changed = true;
    }
  });
  if (!plan.hasStudentData || (plan.status !== "Taught" && plan.status !== "Complete")) {
    plan.hasStudentData = true;
    if (plan.status !== "Complete") plan.status = "Taught";
    plan.lastStudentDataAt ||= record.date || new Date().toISOString();
    changed = true;
  }
  return changed;
}

function ttBackfillLessonLinks() {
  if (appState.lessonLinkBackfillVersion >= 1) return;
  let changed = false;
  (appState.masterRecords || []).forEach((record) => {
    if (record.planId && record.lessonTitle) return;
    const group = (appState.groups || []).find((item) => item.id === record.groupId || item.name === record.group);
    const plan = group ? ttFindBestPlanForRecord(group, record) : null;
    if (plan) changed = ttApplyPlanLinkToRecord(record, plan) || changed;
  });
  (appState.groups || []).forEach((group) => {
    ["dictationMisses", "encodingObservations"].forEach((key) => {
      (group[key] || []).forEach((record) => {
        if (record.planId && record.lessonTitle) return;
        const plan = ttFindBestPlanForRecord(group, record);
        if (plan) changed = ttApplyPlanLinkToRecord(record, plan) || changed;
      });
    });
  });
  appState.lessonLinkBackfillVersion = 1;
  if (changed) {
    appState.lastSavedAt = new Date().toISOString();
    localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(appState));
    if (typeof window.teachTodayQueueCloudSync === "function") window.teachTodayQueueCloudSync();
  }
}

function ttActivePlanId() {
  return ttLesson?.savedPlanId || "";
}

function ttRememberScroll(planId = ttActivePlanId()) {
  if (!planId || ttRestoringScroll) return;
  ttNormalizeTeachTodayState();
  appState.lessonScrollPositions[planId] = Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0));
  saveState();
}

function ttRestoreScroll(planId = ttActivePlanId()) {
  if (!planId) return;
  const top = appState.lessonScrollPositions?.[planId];
  if (typeof top !== "number") return;
  ttRestoringScroll = true;
  requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: "auto" });
    setTimeout(() => {
      ttRestoringScroll = false;
    }, 60);
  });
}

function ttRememberHomeScroll(groupId = ttPlannerGroupId || appState.selectedGroupId || "") {
  if (!groupId || ttRestoringScroll) return;
  ttPlannerHomeScrollPositions[groupId] = Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0));
}

function ttRestoreHomeScroll(groupId = ttPlannerGroupId || appState.selectedGroupId || "") {
  const top = ttPlannerHomeScrollPositions[groupId] || 0;
  ttRestoringScroll = true;
  requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: "auto" });
    setTimeout(() => {
      ttRestoringScroll = false;
    }, 60);
  });
}

function ttLessonDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ttTodayKey() {
  return dateKey(new Date());
}

function ttNextInstructionDateKey(value) {
  const date = ttDateFromKey(value || ttTodayKey());
  do {
    date.setDate(date.getDate() + 1);
  } while ([0, 5, 6].includes(date.getDay()));
  return dateKey(date);
}

function ttDateFromKey(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date(value || Date.now());
}

function ttOrdinalDay(day) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  return `${day}${day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th"}`;
}

function ttLongLessonDate(value) {
  const date = ttDateFromKey(value);
  if (Number.isNaN(date.getTime())) return "Date not assigned";
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = date.toLocaleDateString(undefined, { month: "long" });
  return `${weekday}, ${month} ${ttOrdinalDay(date.getDate())}`;
}

function ttPlanLessonNumber(plan, lesson, group) {
  return plan?.lessonNumber || lesson?.lessonSequence || group?.lessonSerial || "Next";
}

function ttPlanSessionDay(plan, lesson) {
  return String(plan?.activeDay || lesson?.activeGroupDay || "1");
}

function ttEnsureLessonWorkflow(plan, lesson = plan?.lessons?.[0], group = ttActiveGroup()) {
  if (!plan || !lesson) return plan;
  plan.lessonNumber ||= lesson.lessonSequence || group.lessonSerial || 1;
  const isGroup = ["group", "part1", "part2"].includes(lesson.lessonType);
  const day = isGroup ? ttPlanSessionDay(plan, lesson) : "1";
  const scheduledDate = lesson.scheduledDate || plan.scheduledDate || plan.dailyKey || dateKey(plan.savedAt || new Date());
  plan.scheduledDate ||= scheduledDate;
  plan.activeDay ||= day;
  plan.sessions ||= {};
  plan.sessions[day] ||= { date: scheduledDate, status: "Planned" };
  group.activeLessonPlanId ||= plan.status === "Complete" ? "" : plan.id;
  return plan;
}

function ttActiveOpenPlan(group = ttPlannerGroup()) {
  if (!group) return null;
  let plan = group.activeLessonPlanId
    ? (group.history || []).find((item) => item.id === group.activeLessonPlanId)
    : null;
  if (plan && (plan.excludedFromLessonSequence || ["Complete", "Incomplete", "Test"].includes(plan.status))) {
    group.activeLessonPlanId = "";
    plan = null;
  }
  if (!plan) {
    plan = (group.history || []).slice().reverse().find((item) => item.source === "TeachToday" && item.lessons?.[0] && !item.excludedFromLessonSequence && !["Complete", "Incomplete", "Test"].includes(item.status));
    if (plan) group.activeLessonPlanId = plan.id;
  }
  if (!plan || plan.status === "Complete") return null;
  return ttEnsureLessonWorkflow(plan, plan.lessons?.[0], group);
}

function ttCompletedSectionSummary(lesson) {
  const states = lesson?.completedSections || {};
  const done = Object.entries(states).filter(([, state]) => state === "done").map(([id]) => id.replace("section", ""));
  const skipped = Object.entries(states).filter(([, state]) => state === "skipped").map(([id]) => id.replace("section", ""));
  return { done, skipped };
}

function ttRecordPlanRevision(plan, lesson, reason = "Saved changes") {
  if (!plan || !lesson) return;
  const snapshot = ttClone(lesson);
  delete snapshot.savedPlanId;
  const fingerprint = JSON.stringify(snapshot);
  if (plan.lastRevisionFingerprint === fingerprint) return;
  plan.revisions ||= [];
  plan.revisions.push({ id: `revision-${Date.now()}`, savedAt: new Date().toISOString(), reason, lesson: snapshot });
  plan.revisions = plan.revisions.slice(-10);
  plan.lastRevisionFingerprint = fingerprint;
}

function ttRenderLessonIdentity(group = ttActiveGroup(), lesson = ttLesson) {
  const banner = ttById("ttLessonIdentity");
  if (!banner || !lesson || document.body.classList.contains("home-mode")) {
    if (banner) banner.hidden = true;
    return;
  }
  const plan = ttCurrentPlan();
  if (plan) ttEnsureLessonWorkflow(plan, lesson, group);
  const isGroup = ["group", "part1", "part2"].includes(lesson.lessonType);
  const day = isGroup ? ttPlanSessionDay(plan, lesson) : "";
  const sessionDate = plan?.sessions?.[day || "1"]?.date || lesson.scheduledDate || plan?.scheduledDate || ttTodayKey();
  const summary = ttCompletedSectionSummary(lesson);
  const status = plan?.status || "Draft";
  const sessionStatus = plan?.sessions?.[day || "1"]?.status || status;
  const dayOneDate = isGroup && day === "2" ? plan?.sessions?.["1"]?.date : "";
  const revisions = (plan?.revisions || []).slice().reverse();
  banner.hidden = false;
  banner.innerHTML = `<div><span>${escapeHtml(group.name || "Group")}</span>
      <strong>Lesson ${escapeHtml(ttPlanLessonNumber(plan, lesson, group))}${day ? ` · Day ${escapeHtml(day)}` : ""} · ${escapeHtml(ttLongLessonDate(sessionDate))}</strong>
      ${dayOneDate ? `<em>Day 1 taught ${escapeHtml(ttLongLessonDate(dayOneDate))}</em>` : ""}</div>
    <div class="lesson-identity-status"><b>${escapeHtml(sessionStatus)}</b><small>${summary.done.length ? `Finished sections: ${escapeHtml(summary.done.join(", "))}` : "No sections marked finished yet"}</small>
      ${revisions.length ? `<details><summary>${revisions.length} saved version${revisions.length === 1 ? "" : "s"}</summary>${revisions.slice(0, 5).map((revision) => `<span>${escapeHtml(revision.reason || "Saved changes")} · ${escapeHtml(ttLessonTime(new Date(revision.savedAt)))}</span>`).join("")}</details>` : ""}</div>`;
}

function ttLessonTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ttCompactDate(date = new Date()) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function ttWordlistShortLabel(lesson) {
  const meta = lesson?.wordlistMeta || "";
  const page = lesson?.wordlistPageNumber || "--";
  const match = meta.match(/Page\s+(\d+)\s+of\s+(\d+)\s+([A-Z]+)\s+wordlist/i);
  return match ? `p. ${page} (${match[1]} of ${match[2]} ${match[3]})` : `p. ${page}`;
}

function ttLessonFileName(group, lesson, date = new Date()) {
  return `${lesson.substep} - charting page ${ttWordlistShortLabel(lesson)} - ${ttLessonDate(date)} ${ttLessonTime(date)} - ${group.name}`;
}

function ttLessonTabLabel(plan, group = ttActiveGroup()) {
  const lesson = plan?.lessons?.[0] || ttLesson;
  const date = plan?.savedAt ? new Date(plan.savedAt) : new Date();
  const shortGroup = (group.name || "Group").replace(/\s+Group$/i, "");
  return `${shortGroup} ${lesson?.substep || group.substep} ${ttCompactDate(date)}`;
}

function ttCurrentPlan() {
  const group = ttActiveGroup();
  return (group.history || []).find((plan) => plan.id === ttLesson?.savedPlanId);
}

function ttPlanDayKey(date = new Date()) {
  return dateKey(date);
}

function ttDailyPlanFor(group, date = new Date()) {
  const key = ttPlanDayKey(date);
  return (group.history || []).slice().reverse().find((plan) =>
    plan.source === "TeachToday"
    && (plan.dailyKey === key || dateKey(plan.savedAt || plan.created) === key)
  );
}

function ttAddLessonTab(planId) {
  if (!planId) return;
  ttNormalizeTeachTodayState();
  appState.openLessonTabs = appState.openLessonTabs.filter((id) => id !== planId);
  appState.openLessonTabs.unshift(planId);
  appState.openLessonTabs = appState.openLessonTabs.slice(0, 8);
}

function ttRenderLessonTabs() {
  const container = ttById("ttLessonTabs");
  if (!container) return;
  ttNormalizeTeachTodayState();
  const allPlans = [];
  appState.groups.forEach((group) => {
    (group.history || []).forEach((plan) => allPlans.push({ group, plan }));
  });
  const tabPlans = appState.openLessonTabs
    .map((id) => allPlans.find((item) => item.plan.id === id))
    .filter(Boolean);
  if (!tabPlans.length && ttLesson?.savedPlanId) {
    const plan = ttCurrentPlan();
    if (plan) tabPlans.push({ group: ttActiveGroup(), plan });
  }
  container.innerHTML = "";
  tabPlans.forEach(({ group, plan }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lesson-tab${plan.id === ttLesson?.savedPlanId ? " active" : ""}`;
    button.innerHTML = `<span>${escapeHtml(plan.tabLabel || ttLessonTabLabel(plan, group))}</span><span class="lesson-tab-close" aria-hidden="true">×</span>`;
    button.title = plan.title || button.textContent;
    button.addEventListener("click", (event) => {
      if (event.target.closest(".lesson-tab-close")) {
        event.stopPropagation();
        appState.openLessonTabs = (appState.openLessonTabs || []).filter((id) => id !== plan.id);
        saveState();
        ttRenderLessonTabs();
        return;
      }
      ttOpenPlanInApp(plan.id);
    });
    container.appendChild(button);
  });
}

function ttFillGroups(activeId) {
  const select = ttById("ttGroup");
  select.innerHTML = "";
  appGroups().forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    option.selected = group.id === activeId;
    select.appendChild(option);
  });
}

function appGroups() {
  const group = activeGroup();
  const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
  return stored.groups?.length ? stored.groups : [group];
}

function ttFillLessonControls(group) {
  const substep = ttById("ttSubstep");
  if (substep && !substep.options.length) {
    scopeMap.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = `${skill.id} - ${skill.title}`;
      substep.appendChild(option);
    });
  }
  if (substep) substep.value = group.substep;
  const level = ttById("ttReaderLevel");
  if (level) level.value = group.readerLevel || "AB";
}

function ttFillStudents(group) {
  const select = ttById("ttStudent");
  select.innerHTML = "";
  group.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student;
    option.textContent = student;
    option.selected = student === group.activeStudent;
    select.appendChild(option);
  });
}

function ttFillFrontStudents(group) {
  const container = ttById("ttFrontStudents");
  container.innerHTML = "";
  group.students.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `front-student${student === group.activeStudent ? " active" : ""}`;
    const status = performanceStatus(recordsForStudent(student));
    button.innerHTML = `<span class="status-dot ${status.color}"></span>${escapeHtml(student)}`;
    button.addEventListener("click", () => ttSelectStudent(student));
    container.appendChild(button);
  });
}

function ttAttendanceKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function ttTodaysAttendance(group = ttActiveGroup()) {
  ttNormalizeTeachTodayState();
  const key = ttAttendanceKey();
  appState.attendanceRecords[group.id] ||= {};
  appState.attendanceRecords[group.id][key] ||= {};
  return appState.attendanceRecords[group.id][key];
}

function ttRenderAttendancePanel(group) {
  const panel = ttById("ttAttendancePanel");
  if (!panel) return;
  const attendance = ttTodaysAttendance(group);
  panel.innerHTML = group.students.map((student) => {
    const present = attendance[student] !== false;
    return `<button type="button" class="attendance-chip ${present ? "present" : ""}" data-student="${escapeHtml(student)}">${present ? "Present" : "Absent"} - ${escapeHtml(student)}</button>`;
  }).join("");
  panel.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const student = button.dataset.student;
      attendance[student] = attendance[student] === false;
      saveState();
      ttRenderAttendancePanel(group);
    });
  });
}

function ttSetAttendancePanel(open = true, options = {}) {
  const panel = ttById("ttAttendancePanel");
  const button = ttById("ttAttendance");
  if (!panel) return;
  if (open) ttCloseSmallDropdownMenus("ttAttendance");
  panel.hidden = !open;
  button?.classList.toggle("active", open);
  button?.setAttribute("aria-expanded", String(open));
  if (!panel.hidden) {
    ttRenderAttendancePanel(ttActiveGroup());
    if (options.focus) panel.querySelector("button")?.focus({ preventScroll: true });
  }
}

function ttSmallDropdownButtonIds() {
  return [
    "ttAttendance",
    "ttRibbonReaders",
    "ttRibbonDictation",
    "ttHomeReaders",
    "ttHomeDictation"
  ];
}

function ttDropdownMenuForButton(button) {
  return button?.closest(".ref-menu-wrap")?.querySelector(".reference-menu, .attendance-panel");
}

function ttCloseSmallDropdownMenus(exceptId = "") {
  ttSmallDropdownButtonIds().forEach((buttonId) => {
    if (buttonId === exceptId) return;
    const button = ttById(buttonId);
    const menu = ttDropdownMenuForButton(button);
    if (menu) menu.hidden = true;
    button?.classList.remove("active");
    button?.setAttribute("aria-expanded", "false");
  });
}

function ttToggleSmallDropdown(trigger, options = {}) {
  const button = ttById(trigger);
  const menu = ttDropdownMenuForButton(button);
  if (!button || !menu) return;
  const isOpen = !menu.hidden;
  ttById("ttSavedPanel") && (ttById("ttSavedPanel").hidden = true);
  ttById("ttSavedToggle")?.classList.remove("active");
  ttById("ttDataPanel") && (ttById("ttDataPanel").hidden = true);
  ttById("ttDataToggle")?.classList.remove("active");
  ttCloseSmallDropdownMenus(trigger);
  if (trigger === "ttAttendance") {
    ttSetAttendancePanel(isOpen ? false : true, options);
    return;
  }
  menu.hidden = isOpen;
  button.classList.toggle("active", !isOpen);
  button.setAttribute("aria-expanded", String(!isOpen));
}

function ttAddStudentFromRoster() {
  ttToggleRosterPicker(true);
}

function ttRosterStudents() {
  ttNormalizeTeachTodayState();
  return (appState.rosterStudents || [])
    .map((student) => typeof student === "string" ? { name: student } : student)
    .filter((student) => student.name)
    .sort((a, b) => (a.school || "").localeCompare(b.school || "") || a.name.localeCompare(b.name));
}

function ttToggleRosterPicker(force = null) {
  const panel = ttById("ttRosterPicker");
  if (!panel) return;
  panel.hidden = force === null ? !panel.hidden : !force;
  if (!panel.hidden) ttRenderRosterPicker();
}

function ttRenderRosterPicker() {
  const group = ttActiveGroup();
  const select = ttById("ttRosterSelect");
  if (!select) return;
  const roster = ttRosterStudents().filter((student) => !group.students.includes(student.name));
  select.innerHTML = roster.map((student) => {
    const details = [student.gradeLevel ? `Gr ${student.gradeLevel}` : "", student.school ? shortSchoolName(student.school) : ""].filter(Boolean).join(" - ");
    const label = details ? `${student.name} (${details})` : student.name;
    return `<option value="${escapeHtml(student.name)}">${escapeHtml(label)}</option>`;
  }).join("");
  select.disabled = !roster.length;
  ttById("ttRosterAddSelected").disabled = !roster.length;
}

function ttAddSelectedRosterStudent() {
  const name = ttById("ttRosterSelect")?.value || "";
  ttAddStudentToActiveGroup(name);
}

function ttAddNewRosterStudent() {
  const nameInput = ttById("ttNewRosterStudent");
  const gradeInput = ttById("ttNewRosterGrade");
  const name = nameInput?.value.trim() || "";
  if (!name) return;
  const group = ttActiveGroup();
  appState.rosterStudents ||= [];
  if (!appState.rosterStudents.some((student) => String(student.name || student).toLowerCase() === name.toLowerCase())) {
    appState.rosterStudents.push({
      name,
      fullName: name,
      gradeLevel: gradeInput?.value.trim() || "",
      school: group.school || ""
    });
  }
  if (nameInput) nameInput.value = "";
  if (gradeInput) gradeInput.value = "";
  ttAddStudentToActiveGroup(name);
}

function ttAddStudentToActiveGroup(name) {
  const group = ttActiveGroup();
  const cleanName = String(name || "").trim();
  if (!cleanName) return;
  if (!group.students.includes(cleanName)) group.students.push(cleanName);
  group.activeStudent = cleanName;
  ttTodaysAttendance(group)[cleanName] = true;
  saveState();
  ttToggleRosterPicker(false);
  ttRender();
}

function shortSchoolName(school) {
  if (/cochran/i.test(school)) return "Cochran";
  if (/allen/i.test(school)) return "Allen";
  return school;
}

function ttRenderGroupSnapshot(group) {
  const panel = ttById("ttGroupSnapshot");
  if (!panel) return;
  const chartRecords = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id || record.group === group.name)
    .sort((a, b) => new Date(b.date || b.displayDate || 0) - new Date(a.date || a.displayDate || 0));
  const dictationRecords = (group.dictationMisses || [])
    .concat((group.encodingObservations || []).filter((record) => record.section === "section8"))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const latestTime = Math.max(
    ...chartRecords.map((record) => new Date(record.date || record.displayDate || 0).getTime()).filter(Number.isFinite),
    ...dictationRecords.map((record) => new Date(record.date || 0).getTime()).filter(Number.isFinite),
    0
  );

  if (!latestTime) {
    panel.innerHTML = `
      <div class="snapshot-head">
        <div><strong>Last Class Snapshot</strong><span>No saved Section 4 or Section 8 data yet.</span></div>
      </div>
      <p class="snapshot-empty">After you save charting or dictation data, this panel will show what to watch before today's lesson.</p>
    `;
    return;
  }

  const latestKey = dateKey(new Date(latestTime));
  const lastChart = chartRecords.filter((record) => dateKey(record.date || record.displayDate) === latestKey);
  const lastDictation = dictationRecords.filter((record) => dateKey(record.date) === latestKey);
  const byStudent = new Map();
  group.students.forEach((student) => byStudent.set(student, { student, chart: [], dictation: [] }));
  lastChart.forEach((record) => {
    const bucket = byStudent.get(record.student) || { student: record.student, chart: [], dictation: [] };
    bucket.chart.push(record);
    byStudent.set(record.student, bucket);
  });
  lastDictation.forEach((record) => {
    const bucket = byStudent.get(record.student) || { student: record.student, chart: [], dictation: [] };
    bucket.dictation.push(record);
    byStudent.set(record.student, bucket);
  });

  const cards = [...byStudent.values()]
    .filter((item) => item.chart.length || item.dictation.length)
    .map((item) => ttSnapshotStudentCard(item))
    .join("");
  panel.innerHTML = `
    <div class="snapshot-head">
      <div><strong>Last Class Snapshot</strong><span>${formatSnapshotDate(latestTime)} - Section 4 charting and Section 8 dictation</span></div>
      <small>${lastChart.length} charting record${lastChart.length === 1 ? "" : "s"} / ${lastDictation.length} dictation mark${lastDictation.length === 1 ? "" : "s"}</small>
    </div>
    <div class="snapshot-grid">${cards || "<p class=\"snapshot-empty\">No student details saved for the last class date.</p>"}</div>
  `;
}

function ttShowHomeScreen(groupId = ttPlannerGroupId || ttActiveGroup().id) {
  if (ttLessonLaunchTimer) {
    clearTimeout(ttLessonLaunchTimer);
    ttLessonLaunchTimer = null;
  }
  ttTogglePresentation(false);
  ttById("ttLessonLaunch")?.setAttribute("hidden", "");
  document.body.classList.remove("lesson-launching", "lesson-home-exit", "lesson-flow-enter", "legacy-full-lesson-mode");
  document.body.classList.remove("group-day-1", "group-day-2");
  ttGroupDay = null;
  ttPlannerGroupId = groupId;
  const home = ttById("ttHomeScreen");
  const flow = document.querySelector(".teach-flow");
  if (home) home.hidden = false;
  if (flow) flow.hidden = true;
  if (ttById("ttLessonIdentity")) ttById("ttLessonIdentity").hidden = true;
  document.body.classList.add("home-mode");
  ttRenderHomeScreen();
  ttRestoreHomeScroll(groupId);
}

function ttReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function ttUpdateLessonLaunch(group = ttActiveGroup(), lesson = ttLesson) {
  const launch = ttById("ttLessonLaunch");
  if (!launch || !group) return null;
  const substep = lesson?.substep || group.substep || "--";
  const reader = lesson?.reader || lesson?.readerLevel || group.readerLevel || "AB";
  const wordlist = lesson?.wordlistPageNumber || "--";
  const sentence = lesson?.sentencePageNumber || "--";
  const students = (group.students || []).filter(Boolean);
  const studentText = students.length ? `${students.length} student${students.length === 1 ? "" : "s"}` : "No students assigned";
  ttById("ttLaunchGroup").textContent = group.name || "Current group";
  ttById("ttLaunchMeta").textContent = `${studentText} - ready for the live lesson view`;
  ttById("ttLaunchSubstep").textContent = `Substep ${substep}`;
  ttById("ttLaunchLevel").textContent = `Reader ${reader}`;
  ttById("ttLaunchWordlist").textContent = `Wordlist p. ${wordlist}`;
  ttById("ttLaunchSentence").textContent = `Sentences p. ${sentence}`;
  launch.hidden = false;
  return launch;
}

function ttOpenTeachFlow(options = {}) {
  if (document.body.classList.contains("home-mode")) ttRememberHomeScroll();
  const home = ttById("ttHomeScreen");
  const flow = document.querySelector(".teach-flow");
  const launch = ttById("ttLessonLaunch");
  const fromHome = document.body.classList.contains("home-mode");
  const forceLaunch = options.forceLaunch === true;
  const useTransition = options.transition !== false && (fromHome || forceLaunch) && !ttReduceMotion() && launch;
  const targetId = options.targetId || "";
  const openAsPresentation = options.presentation === true;
  const afterOpen = typeof options.afterOpen === "function" ? options.afterOpen : null;
  const revealFlow = () => {
    if (home) home.hidden = true;
    if (flow) flow.hidden = false;
    document.body.classList.remove("home-mode", "lesson-home-exit");
    document.body.classList.remove("legacy-full-lesson-mode");
    document.body.classList.remove("lesson-type-full", "lesson-type-full45", "lesson-type-group", "lesson-type-part1", "lesson-type-part2", "lesson-type-flash");
    const _ltRaw = ttLesson?.lessonType || "full";
    document.body.classList.add(`lesson-type-${(_ltRaw === "part1" || _ltRaw === "part2") ? "group" : _ltRaw}`);
    document.body.classList.add("lesson-flow-enter");
    ttRender();
    if (openAsPresentation) ttTogglePresentation(true);
    else ttTogglePresentation(false, { fullscreen: false });
    const target = targetId ? ttById(targetId) : null;
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      window.scrollTo({ top: 0, behavior: useTransition ? "auto" : "smooth" });
    }
    if (ttLessonLaunchTimer) clearTimeout(ttLessonLaunchTimer);
    ttLessonLaunchTimer = setTimeout(() => {
      launch?.setAttribute("hidden", "");
      document.body.classList.remove("lesson-launching", "lesson-flow-enter");
      ttLessonLaunchTimer = null;
      afterOpen?.();
    }, useTransition ? 520 : 0);
  };

  if (!useTransition) {
    launch?.setAttribute("hidden", "");
    document.body.classList.remove("lesson-launching", "lesson-home-exit", "lesson-flow-enter");
    revealFlow();
    return;
  }

  if (ttLessonLaunchTimer) clearTimeout(ttLessonLaunchTimer);
  ttUpdateLessonLaunch(ttActiveGroup(), ttLesson);
  document.body.classList.remove("lesson-flow-enter");
  document.body.classList.add("lesson-launching", "lesson-home-exit");
  ttLessonLaunchTimer = setTimeout(revealFlow, 240);
}

function ttRenderHomeScreen() {
  const home = ttById("ttHomeScreen");
  if (!home || home.hidden) return;
  const yearSelect = ttById("ttHomeSchoolYear");
  const activeYearId = appState.activeSchoolYearId || currentSchoolYearId();
  const schoolYears = (appState.schoolYears || []).slice().sort((a, b) => b.id.localeCompare(a.id));
  const requestedYearId = yearSelect?.value;
  const viewedYearId = schoolYears.some((year) => year.id === requestedYearId)
    ? requestedYearId
    : activeYearId;
  if (yearSelect) {
    yearSelect.innerHTML = schoolYears.map((year) =>
      `<option value="${escapeHtml(year.id)}">${escapeHtml(year.label || year.id)}${year.id === activeYearId ? " (Current)" : ""}</option>`
    ).join("");
    yearSelect.value = viewedYearId;
    if (!yearSelect.dataset.bound) {
      yearSelect.dataset.bound = "true";
      yearSelect.addEventListener("change", () => {
        ttPlannerGroupId = "";
        ttPlannerDraft = {};
        ttRenderHomeScreen();
      });
    }
  }
  const viewingArchive = viewedYearId !== activeYearId;
  const status = ttById("ttHomeSchoolYearStatus");
  if (status) status.textContent = viewingArchive
    ? "Archived groups — history is preserved"
    : "Current groups";
  const groups = (appState.groups || []).filter((group) => group.schoolYearId === viewedYearId);
  if (!ttPlannerGroupId || !groups.some((group) => group.id === ttPlannerGroupId)) {
    ttPlannerGroupId = groups.some((group) => group.id === appState.selectedGroupId)
      ? appState.selectedGroupId
      : groups[0]?.id || "";
  }
  ttEnsurePlannerDraft(ttPlannerGroup());
  const list = ttById("ttHomeGroups");
  if (list) {
    const addCard = `<button type="button" class="home-group-card home-group-add-card" id="ttHomeAddGroup" title="Create a new group" aria-label="Create a new group">
      <span class="home-group-add-icon">+</span>
      <strong>New Group</strong>
      <em>Create a teaching group</em>
    </button>`;
    const hasDemoGroup = groups.some((group) => group.isDemoGroup);
    const demoCard = hasDemoGroup ? "" : `<button type="button" class="home-group-card home-group-add-card home-group-demo-card" id="ttHomeAddDemoGroup" title="Create a demo group" aria-label="Create a demo group">
      <span class="home-group-add-icon">D</span>
      <strong>Demo Group</strong>
      <em>Maya, Jordan, and Eli</em>
    </button>`;
    list.innerHTML = groups.map((group) => ttHomeGroupCardHtml(group, !viewingArchive)).join("") + (viewingArchive ? "" : `${addCard}${demoCard}`);
    list.querySelectorAll("[data-home-group]").forEach((button) => {
      button.addEventListener("click", () => {
        ttPlannerGroupId = button.dataset.homeGroup;
        ttPlannerDraft = {};
        ttRenderHomeScreen();
      });
    });
    list.querySelectorAll("[data-edit-group]").forEach((button) => {
      button.addEventListener("click", () => {
        if (typeof ttOpenEditGroupModal === "function") ttOpenEditGroupModal(button.dataset.editGroup);
      });
    });
    list.querySelector("#ttHomeAddGroup")?.addEventListener("click", () => {
      if (typeof ttOpenNewGroupModal === "function") ttOpenNewGroupModal();
    });
    list.querySelector("#ttHomeAddDemoGroup")?.addEventListener("click", () => ttCreateDemoGroup());
  }
  ttRenderHomeContinuity(!viewingArchive);
  ttRenderHomeLessonHistory(!viewingArchive);
  ttRenderHomeModePicker(!viewingArchive);
  ttRenderPlannerPanel();
  ttUpdateHomeReferenceLinks();
}

function ttRenderHomeContinuity(enabled = true) {
  const container = ttById("ttHomeContinuity");
  const group = ttPlannerGroup();
  if (!container) return;
  container.hidden = !enabled || !group;
  if (container.hidden) return;
  const openPlan = ttActiveOpenPlan(group);
  const latestComplete = (group.history || []).slice().reverse().find((plan) => plan.status === "Complete" && plan.lessons?.[0]);
  if (!openPlan) {
    if (!latestComplete) {
      container.hidden = true;
      return;
    }
    const lesson = latestComplete.lessons[0];
    ttEnsureLessonWorkflow(latestComplete, lesson, group);
    container.innerHTML = `<div class="continuity-copy"><span>Last lesson completed</span>
        <strong>${escapeHtml(group.name)} · Lesson ${escapeHtml(ttPlanLessonNumber(latestComplete, lesson, group))} · ${escapeHtml(ttLongLessonDate(latestComplete.sessions?.[latestComplete.activeDay || "1"]?.date || latestComplete.scheduledDate))}</strong>
        <small>Your next saved lesson will be Lesson ${escapeHtml((Number(latestComplete.lessonNumber || lesson.lessonSequence || group.lessonSerial || 0) + 1))}.</small></div>
      <div class="continuity-actions"><button type="button" data-continuity="review">Review completed lesson</button></div>`;
    container.querySelector('[data-continuity="review"]')?.addEventListener("click", () => {
      ttOpenPlanInApp(latestComplete.id);
      ttOpenTeachFlow({ transition: false });
    });
    return;
  }
  const lesson = openPlan.lessons[0];
  const day = ttPlanSessionDay(openPlan, lesson);
  const summary = ttCompletedSectionSummary(lesson);
  const sessionDate = openPlan.sessions?.[day]?.date || openPlan.scheduledDate;
  const canContinueDay2 = ["group", "part1", "part2"].includes(lesson.lessonType) && day === "1" && !openPlan.sessions?.["2"];
  const plannedDay2Date = openPlan.plannedDay2Date || ttNextInstructionDateKey(openPlan.sessions?.["1"]?.date || sessionDate);
  container.innerHTML = `<div class="continuity-copy"><span>Lesson still open</span>
      <strong>${escapeHtml(group.name)} · Lesson ${escapeHtml(ttPlanLessonNumber(openPlan, lesson, group))} · Day ${escapeHtml(day)} · ${escapeHtml(ttLongLessonDate(sessionDate))}</strong>
      <small>${summary.done.length ? `Finished sections: ${escapeHtml(summary.done.join(", "))}` : "No sections have been marked finished yet."}${summary.skipped.length ? ` · Skipped: ${escapeHtml(summary.skipped.join(", "))}` : ""}</small></div>
    <div class="continuity-actions">
      <label>Day ${escapeHtml(day)} date<input type="date" value="${escapeHtml(sessionDate || ttTodayKey())}" data-continuity-session-date></label>
      <button class="continuity-primary" type="button" data-continuity="resume">Continue where I left off</button>
      ${canContinueDay2 ? `<label>Day 2 date<input type="date" value="${escapeHtml(plannedDay2Date)}" data-continuity-date></label><button type="button" data-continuity="day2">Continue Day 2</button><button type="button" data-continuity="complete-day1">Complete Lesson As Is</button>` : ""}
      <button type="button" data-continuity="new">Plan a new lesson</button>
    </div>`;
  const saveSessionDate = (date) => {
    if (!date) return;
    openPlan.sessions ||= {};
    openPlan.sessions[day] = { ...openPlan.sessions[day], date };
    if (day === "1") {
      openPlan.scheduledDate = date;
      openPlan.dailyKey = date;
      if (canContinueDay2) {
        openPlan.plannedDay2Date = ttNextInstructionDateKey(date);
        const day2Input = container.querySelector("[data-continuity-date]");
        if (day2Input) day2Input.value = openPlan.plannedDay2Date;
      }
    }
    lesson.scheduledDate = date;
    saveState();
    const heading = container.querySelector(".continuity-copy strong");
    if (heading) heading.textContent = `${group.name} · Lesson ${ttPlanLessonNumber(openPlan, lesson, group)} · Day ${day} · ${ttLongLessonDate(date)}`;
  };
  const sessionDateInput = container.querySelector("[data-continuity-session-date]");
  ["input", "change"].forEach((eventName) => sessionDateInput?.addEventListener(eventName, (event) => saveSessionDate(event.target.value)));
  const plannedDay2Input = container.querySelector("[data-continuity-date]");
  const savePlannedDay2Date = (event) => {
    if (!event.target.value) return;
    openPlan.plannedDay2Date = event.target.value;
    saveState();
  };
  ["input", "change"].forEach((eventName) => plannedDay2Input?.addEventListener(eventName, savePlannedDay2Date));
  container.querySelector('[data-continuity="resume"]')?.addEventListener("click", () => {
    saveSessionDate(container.querySelector("[data-continuity-session-date]")?.value || sessionDate);
    ttOpenPlanInApp(openPlan.id);
    if (lesson.activeGroupDay || openPlan.activeDay) ttSetGroupDay(String(openPlan.activeDay || lesson.activeGroupDay));
    ttOpenTeachFlow({ transition: false });
  });
  container.querySelector('[data-continuity="day2"]')?.addEventListener("click", () => {
    const date = container.querySelector("[data-continuity-date]")?.value || openPlan.plannedDay2Date || ttTodayKey();
    openPlan.plannedDay2Date = date;
    saveState();
    ttOpenPlanInApp(openPlan.id);
    ttLesson.activeGroupDay = "2";
    ttLesson.scheduledDate = date;
    openPlan.activeDay = "2";
    openPlan.sessions ||= {};
    openPlan.sessions["2"] = { date, status: "In progress", startedAt: new Date().toISOString() };
    delete openPlan.plannedDay2Date;
    ttSetGroupDay("2");
    ttSaveCurrentLesson({ render: false, starting: true, reason: "Started Day 2" });
    ttOpenTeachFlow({ transition: false, presentation: true });
  });
  container.querySelector('[data-continuity="complete-day1"]')?.addEventListener("click", () => {
    const completedDate = container.querySelector("[data-continuity-session-date]")?.value || sessionDate;
    saveSessionDate(completedDate);
    if (!confirm(`Save Lesson ${ttPlanLessonNumber(openPlan, lesson, group)} as complete exactly as it is now? Unfinished sections are allowed. The next plan will be Lesson ${Number(ttPlanLessonNumber(openPlan, lesson, group)) + 1}.`)) return;
    openPlan.status = "Complete";
    openPlan.completionKind = "as-is";
    openPlan.completedAt = new Date().toISOString();
    openPlan.sessions["1"].status = "Complete";
    group.activeLessonPlanId = "";
    ttPlannerDraft = {};
    ttEnsurePlannerDraft(group).scheduledDate = ttNextInstructionDateKey(completedDate);
    saveState();
    ttRenderHomeScreen();
  });
  container.querySelector('[data-continuity="new"]')?.addEventListener("click", () => {
    const nextDate = ttNextInstructionDateKey(openPlan.sessions?.[day]?.date || sessionDate);
    const nextNumber = Number(ttPlanLessonNumber(openPlan, lesson, group)) + 1;
    if (!confirm(`Keep Lesson ${ttPlanLessonNumber(openPlan, lesson, group)} marked incomplete and prepare Lesson ${nextNumber} for ${ttLongLessonDate(nextDate)}?`)) return;
    openPlan.status = "Incomplete";
    openPlan.closedAt = new Date().toISOString();
    openPlan.closedReason = "Teacher chose to start a new lesson";
    group.activeLessonPlanId = "";
    ttPlannerDraft = {};
    ttEnsurePlannerDraft(group).scheduledDate = nextDate;
    saveState();
    ttRenderHomeScreen();
  });
}

function ttCreateDemoGroup() {
  const existing = (appState.groups || []).find((group) => group.schoolYearId === appState.activeSchoolYearId && group.isDemoGroup);
  if (existing) {
    ttPlannerGroupId = existing.id;
    ttRenderHomeScreen();
    return;
  }
  const group = createGroup("Demo Group");
  const names = ["Maya", "Jordan", "Eli"];
  group.isDemoGroup = true;
  group.lessonTypePreference = "group";
  group.students = names;
  group.studentIds = {};
  appState.rosterStudents ||= [];
  names.forEach((name) => {
    let student = appState.rosterStudents.find((item) => typeof item !== "string" && item.isDemoStudent && item.name === name);
    if (!student) {
      student = { name, displayName: name, studentId: privateRandomId("demo-stu"), isDemoStudent: true, status: "active", createdAt: new Date().toISOString() };
      appState.rosterStudents.push(student);
    }
    group.studentIds[name] = student.studentId;
  });
  group.activeStudent = names[0];
  appState.groups.push(group);
  appState.selectedGroupId = group.id;
  ttPlannerGroupId = group.id;
  ttPlannerDraft = {};
  saveState();
  ttRenderHomeScreen();
}

function ttOfficialLessonPlans(group) {
  return (group?.history || []).filter((plan) => plan.source === "TeachToday" && plan.lessons?.[0] && !plan.excludedFromLessonSequence && plan.status !== "Test");
}

function ttRecalculateLessonSerial(group) {
  group.lessonSerial = ttOfficialLessonPlans(group).reduce((highest, plan) => {
    return Math.max(highest, Number(plan.lessonNumber || plan.lessons?.[0]?.lessonSequence || 0));
  }, 0);
}

function ttRenderHomeLessonHistory(enabled = true) {
  const container = ttById("ttHomeLessonHistory");
  const group = ttPlannerGroup();
  if (!container) return;
  const plans = ttOfficialLessonPlans(group).slice().reverse();
  container.hidden = !enabled || !group || (!plans.length && !Number(group.lessonSerial || 0));
  if (container.hidden) return;
  const editingPlan = plans.find((plan) => plan.id === ttLessonHistoryEditPlanId) || null;
  const options = plans.map((plan) => {
    const lesson = plan.lessons[0];
    const day = ttPlanSessionDay(plan, lesson);
    const date = plan.sessions?.[day]?.date || plan.scheduledDate;
    return `<option value="${escapeHtml(plan.id)}">Lesson ${escapeHtml(ttPlanLessonNumber(plan, lesson, group))} · ${escapeHtml(plan.status || "Saved")} · ${escapeHtml(ttLongLessonDate(date))}</option>`;
  }).join("");
  const editHtml = editingPlan ? (() => {
    const lesson = editingPlan.lessons[0];
    const isGroup = ["group", "part1", "part2"].includes(lesson.lessonType);
    return `<div class="lesson-history-editor">
      <label>Lesson number<input type="number" min="1" step="1" value="${escapeHtml(ttPlanLessonNumber(editingPlan, lesson, group))}" data-history-number></label>
      <label>Day 1 date<input type="date" value="${escapeHtml(editingPlan.sessions?.["1"]?.date || editingPlan.scheduledDate || "")}" data-history-day1></label>
      ${isGroup && editingPlan.sessions?.["2"] ? `<label>Day 2 date<input type="date" value="${escapeHtml(editingPlan.sessions["2"].date || "")}" data-history-day2></label>` : ""}
      <button type="button" data-history-save>Save correction</button>
      <button type="button" data-history-cancel>Cancel</button>
    </div>`;
  })() : "";
  container.innerHTML = `<div class="lesson-history-heading"><div><span>Group records</span><strong>Lesson history</strong></div>
    <div class="lesson-history-controls">${plans.length ? `<select aria-label="Previous lesson">${options}</select><button type="button" data-history-edit>Edit date / number</button>` : `<span>No official lessons yet</span>`}</div></div>${editHtml}`;
  container.querySelector("[data-history-edit]")?.addEventListener("click", () => {
    ttLessonHistoryEditPlanId = container.querySelector("select")?.value || "";
    ttRenderHomeLessonHistory(enabled);
  });
  container.querySelector("[data-history-cancel]")?.addEventListener("click", () => {
    ttLessonHistoryEditPlanId = "";
    ttRenderHomeLessonHistory(enabled);
  });
  container.querySelector("[data-history-save]")?.addEventListener("click", () => {
    if (!editingPlan) return;
    const lesson = editingPlan.lessons[0];
    const number = Math.max(1, Number(container.querySelector("[data-history-number]")?.value || 1));
    const day1 = container.querySelector("[data-history-day1]")?.value || editingPlan.scheduledDate;
    const day2 = container.querySelector("[data-history-day2]")?.value || "";
    const duplicate = ttOfficialLessonPlans(group).find((plan) => plan.id !== editingPlan.id && Number(plan.lessonNumber || plan.lessons?.[0]?.lessonSequence) === number);
    const duplicateWarning = duplicate ? ` Another official record already uses Lesson ${number}.` : "";
    if (!confirm(`Correct this official record to Lesson ${number}, Day 1 ${ttLongLessonDate(day1)}${day2 ? `, Day 2 ${ttLongLessonDate(day2)}` : ""}?${duplicateWarning}`)) return;
    editingPlan.lessonNumber = number;
    lesson.lessonSequence = number;
    editingPlan.scheduledDate = day1;
    editingPlan.dailyKey = day1;
    editingPlan.sessions ||= {};
    editingPlan.sessions["1"] = { ...editingPlan.sessions["1"], date: day1 };
    if (day2) editingPlan.sessions["2"] = { ...editingPlan.sessions["2"], date: day2 };
    if (String(editingPlan.activeDay || "1") === "1") lesson.scheduledDate = day1;
    else if (day2) lesson.scheduledDate = day2;
    ttRecalculateLessonSerial(group);
    ttLessonHistoryEditPlanId = "";
    saveState();
    ttRenderHomeScreen();
  });
}

function ttSubstepProgressBar(group) {
  const skill = scopeMap.find((s) => s.id === group.substep) || activeStep(group);
  const level = group.readerLevel || "AB";
  const pages = skill.pages?.wordlist || {};
  const primaryPages = pages[level] || pages.AB || pages.A || pages.B || [];
  const nPages = pages.N || [];
  const totalPages = primaryPages.length + nPages.length;
  if (!totalPages) return "";
  const currentIndex = group.pageProgress?.wordlist || 0;
  const pct = Math.min(100, Math.round((currentIndex / totalPages) * 100));
  const pageLabel = `${currentIndex} of ${totalPages} pages`;
  return `<div class="group-progress-bar" title="${pageLabel}">
    <div class="group-progress-fill" style="width:${pct}%"></div>
    <span class="group-progress-label">${pageLabel}${nPages.length ? ` · ${nPages.length} nonsense` : ""}</span>
  </div>`;
}

function ttHomeGroupCardHtml(group, editable = true) {
  const palette = ["#2563eb", "#0f766e", "#7c3aed", "#c2410c", "#0891b2", "#be123c", "#4f46e5", "#15803d", "#b45309", "#0e7490"];
  const color = palette[Math.max(0, (appState.groups || []).findIndex((item) => item.id === group.id)) % palette.length];
  const recentHistory = (group.history || []).slice().reverse();
  const lastPlan = recentHistory.find((plan) => plan.source === "TeachToday" && plan.lessons?.[0] && !plan.excludedFromLessonSequence)
    || recentHistory.find((plan) => !plan.excludedFromLessonSequence);
  const lastLesson = lastPlan?.lessons?.[0];
  const records = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id || record.group === group.name)
    .sort((a, b) => new Date(b.date || b.displayDate || 0) - new Date(a.date || a.displayDate || 0));
  const lastRecord = records[0];
  const students = (group.students || []).slice(0, 5).join(", ");
  const active = group.id === ttPlannerGroupId ? " active" : "";
  const lastText = lastLesson
    ? `${lastLesson.substep} / Reader ${lastLesson.reader}, p. ${lastLesson.wordlistPageNumber || "--"}`
    : `${group.substep || "--"} / no saved lesson yet`;
  const chartText = lastRecord
    ? `${lastRecord.student}: ${lastRecord.correct ?? "--"}/${lastRecord.total || 15}${lastRecord.seconds ? ` in ${lastRecord.seconds}s` : ""}`
    : "No charting saved";
  const preferredType = ttPlannerFormatLabel(ttPreferredLessonType(group));
  return `<div class="home-group-card-shell" style="--group-color: ${color};">
    <button type="button" class="home-group-card${active}" data-home-group="${escapeHtml(group.id)}" aria-pressed="${group.id === ttPlannerGroupId ? "true" : "false"}">
      <span>${escapeHtml(group.time || "Group")}</span>
      <strong>${escapeHtml(group.name || "Unnamed group")}</strong>
      ${ttSubstepProgressBar(group)}
      <em>${escapeHtml(students || "No students yet")}</em>
      <small>Last lesson: ${escapeHtml(lastText)}</small>
      <small>Last chart: ${escapeHtml(chartText)}</small>
      <small class="home-group-preference">Preferred: ${escapeHtml(preferredType)}</small>
    </button>
    ${editable ? `<button type="button" class="home-group-edit" data-edit-group="${escapeHtml(group.id)}" aria-label="Edit ${escapeHtml(group.name || "group")}" title="Edit group">Edit</button>` : ""}
  </div>`;
}

function ttPlannerGroup() {
  return (appState.groups || []).find((group) => group.id === ttPlannerGroupId) || ttActiveGroup();
}

function ttNormalizeLessonType(value) {
  const normalized = value === "part1" || value === "part2" ? "group" : value;
  return ["full", "full45", "group", "flash"].includes(normalized) ? normalized : "group";
}

function ttPreferredLessonType(group) {
  if (!group) return "group";
  if (group.preferredLessonType) return ttNormalizeLessonType(group.preferredLessonType);
  return "group";
}

function ttModeButtonsHtml(activeType, compact = false) {
  const current = ttNormalizeLessonType(activeType);
  const modeButton = (value, icon, headline, sub, color) => `<button type="button" class="mode-pick-btn${current === value ? " active" : ""}${compact ? " compact" : ""}"
    style="--mode-color:${color}" data-mode-pick="${value}">
    <span class="mode-icon">${icon}</span>
    <strong>${headline}</strong>
    <em>${sub}</em>
  </button>`;
  return `${modeButton("full", "🎯", "60 min", "Full 1:1", "#2563eb")}
    ${modeButton("full45", "⚡", "45 min", "Quick 1:1", "#0891b2")}
    ${modeButton("group", "👥", "45+45", "Group days", "#7c3aed")}
    ${modeButton("flash", "🎮", "Flash", "Build your own", "#e11d48")}`;
}

function ttSetPlannerLessonType(value) {
  const group = ttPlannerGroup();
  if (!group) return;
  ttEnsurePlannerDraft(group);
  const lessonType = ttNormalizeLessonType(value);
  ttPlannerDraft.lessonType = lessonType;
  group.preferredLessonType = lessonType;
  if (lessonType === "flash") ttPlannerDraft.flashSections ||= ["1", "2", "3", "5"];
  const groupCard = [...ttById("ttHomeGroups")?.querySelectorAll("[data-home-group]") || []]
    .find((button) => button.dataset.homeGroup === group.id);
  const preference = groupCard?.querySelector(".home-group-preference");
  if (preference) preference.textContent = `Preferred: ${ttPlannerFormatLabel(lessonType)}`;
  ttRenderPlannerPanel();
  ttRenderHomeModePicker(true);
  saveState();
}

function ttRenderHomeModePicker(enabled = true) {
  const container = ttById("ttHomeLessonType");
  const group = ttPlannerGroup();
  if (!container) return;
  container.hidden = !enabled || !group;
  if (container.hidden) return;
  const lessonType = ttEnsurePlannerDraft(group).lessonType || ttPreferredLessonType(group);
  container.innerHTML = `<div class="home-lesson-type-copy">
      <div><span class="mode-pick-eyebrow">Lesson type for ${escapeHtml(group.name || "selected group")}</span>
        <small>Generate Best Lesson will keep this format.</small></div>
      <label class="home-lesson-date">Teach on
        <input type="date" value="${escapeHtml(ttEnsurePlannerDraft(group).scheduledDate || ttTodayKey())}" aria-label="Date planned for this lesson">
      </label>
    </div>
    <div class="mode-pick-row">${ttModeButtonsHtml(lessonType, true)}</div>`;
  container.querySelector(".home-lesson-date input")?.addEventListener("change", (event) => {
    ttEnsurePlannerDraft(group).scheduledDate = event.target.value || ttTodayKey();
  });
  container.querySelectorAll("[data-mode-pick]").forEach((button) => {
    button.addEventListener("click", () => ttSetPlannerLessonType(button.dataset.modePick));
  });
}

function ttEnsurePlannerDraft(group) {
  if (!group) return {};
  if (ttPlannerDraft.groupId === group.id) return ttPlannerDraft;
  const skill = scopeMap.find((item) => item.id === group.substep) || activeStep(group);
  const level = group.readerLevel || "AB";
  ttPlannerDraft = {
    groupId: group.id,
    substep: skill.id,
    level,
    wordlist: pageAssignment(group, skill, "wordlist", 0, level).page || "",
    sentence: pageAssignment(group, skill, "sentences", 0, level).page || "",
    passageId: ttDefaultPassageFor(group, skill)?.id || "",
    passageApproach: group.section9Story?.approach || "comprehension-sos",
    reviewSubsteps: [priorSubstep(skill.id)],
    lessonType: ttPreferredLessonType(group),
    scheduledDate: ttTodayKey(),
    flashSections: ["1", "2", "3", "5"]
  };
  const priorStep = priorSubstep(skill.id);
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttSection8RealSlots = [];
  ttSectionReviewSubsteps = {
    section2: [priorStep],
    section3: [priorStep],
    section7: [priorStep],
    section8Real: [skill.id]
  };
  return ttPlannerDraft;
}

function ttRenderPlannerPanel() {
  const panel = ttById("ttQuickPlanner");
  if (!panel) return;
  const group = ttPlannerGroup();
  panel.hidden = !group;
  if (!group) return;
  const draft = ttEnsurePlannerDraft(group);
  const skill = scopeMap.find((item) => item.id === draft.substep) || activeStep(group);
  const level = draft.level || group.readerLevel || "AB";
  ttById("ttPlannerTitle").textContent = group.name || "Lesson builder";
  ttById("ttPlannerLastLesson").textContent = ttPlannerLastLessonText(group);
  ttFillPlannerCoreSelects(group, skill, level);
  ttRenderModePicker();
  const lesson = ttPlannerPreviewLesson(group);
  ttById("ttPlannerSections").innerHTML = ttPlannerSectionsHtml(group, skill, lesson);
  ttBindPlannerChips();
  ttRenderPlannerPreview(group, skill, lesson);
  ttRenderLessonAssistant(group, skill, lesson);
  ttRenderPlannerCustomizeState();
  ttUpdateHomeReferenceLinks();
}

function ttRenderPlannerCustomizeState() {
  const panel = ttById("ttPlannerCustomizePanel");
  const toggle = ttById("ttPlannerCustomizeToggle");
  if (panel) panel.hidden = !ttPlannerCustomizeOpen;
  if (toggle) {
    toggle.setAttribute("aria-expanded", ttPlannerCustomizeOpen ? "true" : "false");
    toggle.classList.toggle("active", ttPlannerCustomizeOpen);
    toggle.textContent = ttPlannerCustomizeOpen ? "Hide Customize" : "Customize";
  }
}

function ttInstructionalLessonType(group, lesson) {
  const records = ttGroupChartRecords(group).filter((record) => !lesson?.substep || record.substep === lesson.substep);
  const latest = records.at(-1);
  const misses = ttAssistantTroubleItems(group, lesson, 8);
  if (!records.length) return "Introduction";
  if (misses.length || Number(latest?.correct || 0) < 12) return "Accuracy";
  if (latest && !latest.automaticity) return "Fluency";
  return "Review";
}

function ttPlannerFormatLabel(lessonType = ttPlannerDraft.lessonType || "full") {
  return {
    full: "Full 1:1",
    full45: "Quick 1:1",
    group: "Group days",
    part1: "Group days",
    part2: "Group days",
    flash: "Custom"
  }[lessonType] || "Full 1:1";
}

function ttPlannerRecommendedMinutes(lessonType = ttPlannerDraft.lessonType || "full") {
  if (lessonType === "full45") return 45;
  if (lessonType === "group" || lessonType === "part1" || lessonType === "part2") return 90;
  if (lessonType === "flash") {
    const selected = new Set(ttPlannerDraft.flashSections || []);
    return TT_LESSON_SECTIONS.filter((section) => selected.has(section.id)).reduce((sum, section) => sum + section.mins, 0);
  }
  return 60;
}

function ttAssistantLatestRecords(group, lesson) {
  const currentSubstep = lesson?.substep || group?.substep || "";
  const records = ttGroupChartRecords(group)
    .filter((record) => !currentSubstep || record.substep === currentSubstep)
    .sort((a, b) => ttRecordTime(a) - ttRecordTime(b));
  const latest = records.at(-1) || null;
  const recent = records.slice(-5);
  const dictation = (group.dictationMisses || []).filter((record) => !currentSubstep || record.substep === currentSubstep).slice(-12);
  const encoding = (group.encodingObservations || []).filter((record) => !currentSubstep || record.substep === currentSubstep).slice(-12);
  return { records, recent, latest, dictation, encoding };
}

function ttAssistantTroubleItems(group, lesson, limit = 6) {
  const data = ttAssistantLatestRecords(group, lesson);
  const chartMisses = data.recent.flatMap(ttMissWordsFromChartRecord);
  const marked = data.dictation.concat(data.encoding)
    .map((record) => record.item || record.note || record.category || "")
    .filter(Boolean);
  return uniqueWords([].concat(group.trouble || [], chartMisses, marked)).slice(0, limit);
}

function ttAssistantReadiness(group, lesson) {
  const missing = [];
  if (!(group.students || []).length) missing.push("students");
  if (!lesson?.realWords?.length && !lesson?.nonsenseWords?.length) missing.push("word list");
  if (!lesson?.readerSentences?.length) missing.push("sentence page");
  if (!lesson?.section9Story?.title && !lesson?.passage) missing.push("connected text");
  const data = ttAssistantLatestRecords(group, lesson);
  const needsReview = Boolean(
    data.latest && (Number(data.latest.correct || 0) < 12 || !data.latest.automaticity)
  ) || ttAssistantTroubleItems(group, lesson, 1).length > 0;
  const status = missing.length ? "Missing Data" : needsReview ? "Needs Review" : "Ready";
  const details = missing.length
    ? `Add ${missing.join(", ")} before teaching.`
    : needsReview
      ? "Review items are included before new work."
      : "Core decoding, encoding, and connected text are selected.";
  return { status, details, missing, needsReview };
}

function ttAssistantRecommendation(group, lesson, skill) {
  const data = ttAssistantLatestRecords(group, lesson);
  const trouble = ttAssistantTroubleItems(group, lesson, 6);
  const reasonParts = [];
  if (data.latest) {
    const score = `${data.latest.correct ?? "--"}/${data.latest.total || 15}`;
    if (Number(data.latest.correct || 0) < 12) reasonParts.push(`last chart was ${score}, below mastery`);
    else if (!data.latest.automaticity) reasonParts.push(`last chart was accurate but automaticity is still building`);
    else reasonParts.push(`recent charting shows ${score} with automaticity`);
  }
  if (trouble.length) reasonParts.push(`${trouble.length} trouble spot${trouble.length === 1 ? "" : "s"} are being reviewed`);
  if (!reasonParts.length) reasonParts.push(`smart defaults use ${skill.id} and the group’s current lesson data`);
  const reviewSource = priorSubstep(skill.id);
  const title = `${ttPlannerFormatLabel()} ${ttInstructionalLessonType(group, lesson)} lesson for ${skill.id}`;
  return {
    title,
    reason: `Recommended because ${reasonParts.join(" and ")}.`,
    support: `Current work comes from ${skill.id}; maintenance review pulls from ${reviewSource} and older mastered substeps when data is available.`
  };
}

function ttAssistantContentList(values = [], fallback = "Selected in lesson") {
  const items = uniqueWords(values || []).filter(Boolean).slice(0, 8);
  if (!items.length) return fallback;
  const suffix = values.length > items.length ? ` +${values.length - items.length} more` : "";
  return `${items.join(", ")}${suffix}`;
}

function ttAssistantEvidenceText(sectionId, group, lesson) {
  const data = ttAssistantLatestRecords(group, lesson);
  if (sectionId === "4") return data.latest ? `Last chart: ${data.latest.correct ?? "--"}/${data.latest.total || 15}${data.latest.seconds ? ` in ${data.latest.seconds}s` : ""}` : "Charting record";
  if (sectionId === "8") return data.dictation.length ? `${data.dictation.length} recent dictation mark${data.dictation.length === 1 ? "" : "s"}` : "Dictation accuracy";
  if (sectionId === "9") return "Fluency/rate and passage notes";
  if (sectionId === "10") return "Comprehension response";
  return data.recent.length ? "Recent accuracy and automaticity" : "Teacher observation";
}

function ttAssistantMasteryText(sectionId, group, lesson) {
  const data = ttAssistantLatestRecords(group, lesson);
  if (!data.latest) return "Not enough data yet";
  if (sectionId === "4" || sectionId === "9") {
    if (data.latest.automaticity) return "Automatic";
    if (data.latest.accuracy) return "Accurate, building speed";
    return "Needs accuracy review";
  }
  if (ttAssistantTroubleItems(group, lesson, 1).length) return "Needs review";
  return "On track";
}

function ttAssistantSectionRows(group, lesson, skill) {
  const dictation = ttActiveDictationPlan(lesson, skill);
  const block = (label) => dictation.find((item) => item.label.toLowerCase().includes(label))?.values || [];
  const sectionSeven = ttSectionSevenSetsForLesson(lesson, skill);
  const passageTitle = lesson.section9Story?.title || lesson.passage || "Select connected text";
  const trouble = ttAssistantTroubleItems(group, lesson, 5);
  const masteryContent = [
    `Decoding: ${ttAssistantEvidenceText("4", group, lesson)}`,
    `Encoding: ${block("real words").length || sectionSeven.current?.length || 0} planned words`,
    `Trouble spots: ${trouble.join(", ") || "none flagged"}`,
    "Comprehension: passage response and notes"
  ];
  return [
    { id: "1", title: "Decoding Warm-Up", target: "sound-symbol automaticity", mins: 3, content: `${soundsForSubstep(skill.id).vowels}; ${soundsForSubstep(skill.id).consonants}`, edit: "1" },
    { id: "2", title: "New / Review Skill", target: skill.title, mins: 5, content: `Review: ${ttAssistantContentList(lesson.sectionTwoReviewWords || [])}. Current: ${ttAssistantContentList(lesson.sectionTwoCurrentWords || [])}`, edit: "2" },
    { id: "4", title: "Word Reading", target: "single-word decoding accuracy", mins: ttPlannerDraft.lessonType === "full45" ? 5 : 10, content: `Reader ${lesson.reader}, p. ${lesson.wordlistPageNumber || "--"} - ${ttAssistantContentList([].concat(lesson.realWords || [], lesson.nonsenseWords || []), "charting page")}`, edit: "4" },
    { id: "3", title: "Word Cards", target: "word recognition and vocabulary", mins: 5, content: `Review: ${ttAssistantContentList(section3ReviewCards(lesson))}. Current: ${ttAssistantContentList(section3CurrentCards(lesson))}`, edit: "3" },
    { id: "5", title: "Sentence Reading", target: "decoding in connected sentences", mins: ttPlannerDraft.lessonType === "full45" ? 3 : 5, content: `Reader ${lesson.reader}, p. ${lesson.sentencePageNumber || "--"} - ${ttAssistantContentList(lesson.readerSentences || [], "sentence page")}`, edit: "5" },
    { id: "6", title: "Encoding Warm-Up", target: "sound production for spelling", mins: 3, content: ttAssistantContentList((lesson.reverseDrillOverride || []).map((item) => item.value), "reverse quick drill"), edit: "6" },
    { id: "7", title: "Encoding / Spelling", target: "spelling with word structure", mins: 10, content: `Review: ${ttAssistantContentList(sectionSeven.review || [])}. Current: ${ttAssistantContentList(sectionSeven.current || [])}`, edit: "7" },
    { id: "8", title: "Dictation", target: "sounds, words, phrases, and sentences", mins: ttPlannerDraft.lessonType === "full45" ? 10 : 20, content: `Words: ${ttAssistantContentList(block("real words"))}. Sentences: ${ttAssistantContentList(block("sentences"), "dictation sentences")}`, edit: "8" },
    { id: "9", title: "Passage / Fluency", target: "controlled text reading", mins: 10, content: `${passageTitle} - ${ttSection9ApproachLabel(lesson.section9Story?.approach)}`, edit: "9" },
    { id: "10", title: "Comprehension", target: "retell, vocabulary, and response", mins: 10, content: "Vocabulary, follow-up questions, comprehension response, and teacher notes", edit: "10" },
    { id: "M", title: "Mastery Evidence", target: "repeat, review, or advance decision", mins: 0, content: masteryContent.join(". "), edit: "M", evidenceOnly: true }
  ];
}

function ttAssistantSectionCardHtml(section, group, lesson, skill, index) {
  const evidence = ttAssistantEvidenceText(section.id, group, lesson);
  const mastery = ttAssistantMasteryText(section.id, group, lesson);
  const open = index < 2 ? " open" : "";
  return `<details class="assistant-section-card" data-assistant-section="${escapeHtml(section.id)}"${open}>
    <summary>
      <span class="assistant-sec-num">${escapeHtml(section.id)}</span>
      <span class="assistant-sec-title">
        <strong>${escapeHtml(section.title)}</strong>
        <em>${escapeHtml(section.content)}</em>
      </span>
      <span class="assistant-sec-min">${section.mins ? `${section.mins}m` : "evidence"}</span>
    </summary>
    <div class="assistant-section-body">
      <div class="assistant-tags">
        <span>Step ${escapeHtml(String(skill.id).split(".")[0] || "")}</span>
        <span>Substep ${escapeHtml(skill.id)}</span>
        <span>${escapeHtml(section.target)}</span>
        <span>${escapeHtml(mastery)}</span>
      </div>
      <p><strong>Selected content:</strong> ${escapeHtml(section.content)}</p>
      <p><strong>Evidence collected:</strong> ${escapeHtml(evidence)}</p>
      <div class="assistant-section-actions">
        <button type="button" data-assistant-edit="${escapeHtml(section.edit)}">Edit</button>
        <button type="button" data-assistant-regenerate="${escapeHtml(section.id)}">Regenerate</button>
      </div>
    </div>
  </details>`;
}

function ttAssistantTimelineHtml(group, lesson, skill) {
  const lessonType = ttPlannerDraft.lessonType || "full";
  const rows = ttAssistantSectionRows(group, lesson, skill).filter((section) => !section.evidenceOnly && section.mins > 0);
  const selected = lessonType === "flash" ? new Set(ttPlannerDraft.flashSections || []) : null;
  const visibleRows = selected ? rows.filter((section) => selected.has(section.id)) : rows;
  const plannedMinutes = ttPlannerRecommendedMinutes(lessonType);
  const hasDecoding = !selected || ["1", "2", "3", "4", "5"].some((id) => selected.has(id));
  const hasEncoding = !selected || ["6", "7", "8"].some((id) => selected.has(id));
  const hasText = !selected || ["5", "9", "10"].some((id) => selected.has(id));
  const warnings = [
    !hasDecoding ? "missing decoding" : "",
    !hasEncoding ? "missing encoding" : "",
    !hasText ? "missing connected text" : ""
  ].filter(Boolean);
  const locked = lessonType === "flash" ? "Custom order follows selected sections" : "Order locked for structured lesson flow";
  return `<div class="assistant-timeline-head">
      <div><strong>${plannedMinutes} min</strong><span>Total recommended lesson time</span></div>
      <em class="${warnings.length ? "warning" : ""}">${warnings.length ? `Warning: ${warnings.join(", ")}` : locked}</em>
    </div>
    <div class="assistant-timeline-track">
      ${visibleRows.map((section) => `<span style="--tl-color:${escapeHtml(TT_LESSON_SECTIONS.find((item) => item.id === section.id)?.color || "#64748b")}" draggable="${lessonType === "flash" ? "true" : "false"}"><b>${escapeHtml(section.id)}</b>${escapeHtml(section.mins)}m</span>`).join("")}
    </div>`;
}

function ttAssistantStudentPanelHtml(group, lesson) {
  const currentSubstep = lesson?.substep || group.substep || "";
  const rows = (group.students || []).map((student) => {
    const records = typeof recordsForStudent === "function"
      ? recordsForStudent(student).filter((record) => record.groupId === group.id || record.group === group.name)
      : (appState.masterRecords || []).filter((record) => record.student === student && (record.groupId === group.id || record.group === group.name));
    const last = records.at(-1);
    const status = typeof performanceStatus === "function" ? performanceStatus(records) : { color: "gray", label: "No data yet" };
    const misses = uniqueWords(records.slice(-3).flatMap(ttMissWordsFromChartRecord)).slice(0, 3);
    const score = last ? `${last.correct ?? "--"}/${last.total || 15}${last.seconds ? `, ${last.seconds}s` : ""}` : "No chart yet";
    return `<article class="assistant-student-row">
      <div><strong><span class="status-dot ${escapeHtml(status.color)}"></span>${escapeHtml(student)}</strong><span>${escapeHtml(currentSubstep)}</span></div>
      <div><b>${escapeHtml(score)}</b><span>${escapeHtml(misses.join(", ") || "No recent misses")}</span></div>
      <em>${escapeHtml(status.label)}</em>
    </article>`;
  }).join("");
  const trouble = ttAssistantTroubleItems(group, lesson, 6);
  return `<div class="assistant-panel-head">
      <span>Teacher Panel</span>
      <strong>${escapeHtml(group.students?.length || 0)} student${(group.students || []).length === 1 ? "" : "s"}</strong>
      <em>${escapeHtml(currentSubstep)}</em>
    </div>
    <div class="assistant-panel-trouble">
      <strong>Trouble spots</strong>
      <p>${escapeHtml(trouble.join(", ") || "No trouble spots flagged yet.")}</p>
    </div>
    <div class="assistant-student-list">${rows || "<p class=\"planner-empty\">Add students to see readiness by student.</p>"}</div>
    <label class="assistant-note-box">Notes<textarea readonly>${escapeHtml(group.note || "No notes yet.")}</textarea></label>`;
}

function ttPlannerFiltersHtml() {
  const filters = [
    ["step", "Step"],
    ["substep", "Substep"],
    ["skill", "Skill"],
    ["real", "Real words"],
    ["nonsense", "Nonsense words"],
    ["hfw", "High frequency"],
    ["sentence", "Sentence reading"],
    ["dictation", "Dictation"],
    ["fluency", "Fluency"],
    ["comprehension", "Comprehension"]
  ];
  return `<div class="planner-filter-head"><strong>Filters</strong><span>Advanced controls stay here until needed.</span></div>
    <div class="planner-filter-chips">
      ${filters.map(([id, label]) => `<label><input type="checkbox" data-planner-filter="${id}" checked>${escapeHtml(label)}</label>`).join("")}
    </div>`;
}

function ttRenderLessonAssistant(group, skill, fallbackLesson) {
  const planned = ttPlannerDraftLessonWithSelections(group);
  const lesson = planned.lesson || fallbackLesson;
  const activeSkill = planned.skill || skill;
  const recommendation = ttAssistantRecommendation(group, lesson, activeSkill);
  const readiness = ttAssistantReadiness(group, lesson);
  const summary = ttById("ttAssistantSummary");
  if (summary) {
    summary.innerHTML = [
      ["Group", group.name || "Group"],
      ["Step/Substep", `${String(activeSkill.id).split(".")[0] || "--"} / ${activeSkill.id}`],
      ["Lesson type", ttInstructionalLessonType(group, lesson)],
      ["Length", `${ttPlannerRecommendedMinutes()} min`],
      ["Readiness", readiness.status]
    ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
  }
  const rec = ttById("ttAssistantRecommendation");
  if (rec) {
    rec.innerHTML = `<span>Today's Recommended Lesson</span>
      <strong>${escapeHtml(recommendation.title)}</strong>
      <p>${escapeHtml(recommendation.reason)}</p>
      <em>${escapeHtml(recommendation.support)}</em>
      ${ttAssistantNotice ? `<small>${escapeHtml(ttAssistantNotice)}</small>` : ""}`;
  }
  const ready = ttById("ttAssistantReadiness");
  if (ready) {
    ready.className = `assistant-readiness ${readiness.status.toLowerCase().replace(/\s+/g, "-")}`;
    ready.innerHTML = `<span>${escapeHtml(readiness.status)}</span><p>${escapeHtml(readiness.details)}</p>`;
  }
  const filters = ttById("ttPlannerFilters");
  if (filters && !filters.innerHTML) filters.innerHTML = ttPlannerFiltersHtml();
  ttBindPlannerFilters();
  const timeline = ttById("ttAssistantTimeline");
  if (timeline) timeline.innerHTML = ttAssistantTimelineHtml(group, lesson, activeSkill);
  const sections = ttById("ttAssistantSections");
  if (sections) {
    const cards = ttAssistantSectionRows(group, lesson, activeSkill)
      .map((section, index) => ttAssistantSectionCardHtml(section, group, lesson, activeSkill, index))
      .join("");
    sections.innerHTML = cards;
  }
  const panel = ttById("ttAssistantTeacherPanel");
  if (panel) panel.innerHTML = ttAssistantStudentPanelHtml(group, lesson);
  ttBindLessonAssistantActions();
}

function ttBindLessonAssistantActions() {
  ttById("ttAssistantSections")?.querySelectorAll("[data-assistant-edit]").forEach((button) => {
    button.addEventListener("click", () => ttAssistantEditSection(button.dataset.assistantEdit));
  });
  ttById("ttAssistantSections")?.querySelectorAll("[data-assistant-regenerate]").forEach((button) => {
    button.addEventListener("click", () => ttAssistantRegenerateSection(button.dataset.assistantRegenerate));
  });
}

function ttAssistantEditSection(sectionId) {
  ttPlannerCustomizeOpen = true;
  ttRenderPlannerCustomizeState();
  const safeSectionId = String(sectionId || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  const target = ttById("ttPlannerSections")?.querySelector(`[data-sec="${safeSectionId}"]`)
    || ttById("ttPlannerCustomizePanel");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttAssistantRegenerateSection(sectionId) {
  const pickerMap = {
    "2": ["section2Review", "section2Current", "section2ReviewB2", "section2CurrentB2"],
    "3": ["section3Review", "section3Current"],
    "6": ["section6Vowels", "section6Consonants", "section6Welded", "section6Elements", "dictationSounds", "dictationElements"],
    "7": ["section7Review", "section7Current", "section7Nonsense"],
    "8": ["dictationSounds", "dictationElements", "dictationReal", "dictationNonsense", "dictationPhrases", "dictationSentences", "readerSentences"]
  };
  (pickerMap[sectionId] || []).forEach((id) => { delete ttPickerSelections[id]; });
  if (sectionId === "8") ttSection8RealSlots = [];
  if (sectionId === "M") {
    ttAssistantNotice = "Mastery evidence refreshes automatically from saved lesson data.";
  } else {
    ttAssistantNotice = `Regenerated Section ${sectionId}.`;
  }
  window.setTimeout(() => {
    ttAssistantNotice = "";
    ttRenderPlannerPanel();
  }, 1800);
  ttRenderPlannerPanel();
}

function ttBindPlannerFilters() {
  const filters = ttById("ttPlannerFilters");
  if (!filters || filters.dataset.bound === "true") return;
  filters.dataset.bound = "true";
  filters.querySelectorAll("[data-planner-filter]").forEach((input) => {
    input.addEventListener("change", () => ttApplyPlannerFilters());
  });
  ttApplyPlannerFilters();
}

function ttApplyPlannerFilters() {
  const filters = ttById("ttPlannerFilters");
  const rows = ttById("ttPlannerSections");
  if (!filters || !rows) return;
  const checked = new Set([...filters.querySelectorAll("[data-planner-filter]:checked")].map((input) => input.dataset.plannerFilter));
  const allOn = checked.size === filters.querySelectorAll("[data-planner-filter]").length;
  const sectionFilters = {
    "2": ["step", "substep", "skill", "real"],
    "2B": ["step", "substep", "skill", "real"],
    "3": ["skill", "real", "hfw"],
    "6": ["skill", "dictation"],
    "7": ["skill", "real", "nonsense", "dictation"],
    "8": ["real", "nonsense", "hfw", "sentence", "dictation"]
  };
  rows.querySelectorAll(".planner-section-row").forEach((row) => {
    if (allOn) {
      row.hidden = false;
      return;
    }
    const keys = sectionFilters[row.dataset.sec] || [];
    row.hidden = keys.length ? !keys.some((key) => checked.has(key)) : false;
  });
}

function ttSavePlannerTemplate() {
  const group = ttPlannerGroup();
  if (!group) return;
  const planned = ttPlannerDraftLessonWithSelections(group);
  group.lessonTemplates ||= [];
  const now = new Date();
  group.lessonTemplates.unshift({
    id: `template-${Date.now()}`,
    title: `${group.name || "Group"} ${planned.lesson.substep} ${ttPlannerFormatLabel()} template`,
    createdAt: now.toISOString(),
    substep: planned.lesson.substep,
    lessonType: ttPlannerDraft.lessonType || "full",
    lesson: ttClone(planned.lesson)
  });
  group.lessonTemplates = group.lessonTemplates.slice(0, 12);
  ttAssistantNotice = "Template saved for this group.";
  saveState();
  ttRenderPlannerPanel();
}

function ttDuplicatePreviousLesson() {
  const group = ttPlannerGroup();
  if (!group) return;
  const lastPlan = (group.history || []).slice().reverse().find((plan) => plan.source === "TeachToday" && plan.lessons?.[0]);
  const previous = lastPlan?.lessons?.[0];
  if (!previous) {
    ttAssistantNotice = "No previous lesson to duplicate yet.";
    ttRenderPlannerPanel();
    return;
  }
  const skill = scopeMap.find((item) => item.id === previous.substep) || activeStep(group);
  ttPlannerDraft = {
    groupId: group.id,
    substep: previous.substep || group.substep,
    level: previous.readerLevel || group.readerLevel || "AB",
    wordlist: previous.wordlistPageNumber || "",
    sentence: previous.sentencePageNumber || "",
    passageId: previous.section9Story?.passageId || previous.section9Story?.id || "",
    passageApproach: previous.section9Story?.approach || "comprehension-sos",
    reviewSubsteps: [priorSubstep(previous.substep || group.substep)],
    lessonType: previous.lessonType || "full",
    flashSections: (previous.flashSections || ["1", "2", "3", "5"]).slice()
  };
  ttPickerSelections = {
    section2Review: (previous.sectionTwoReviewWords || []).slice(),
    section2Current: (previous.sectionTwoCurrentWords || []).slice(),
    section2ReviewB2: (previous.sectionTwoReviewWordsB2 || []).slice(),
    section2CurrentB2: (previous.sectionTwoCurrentWordsB2 || []).slice(),
    section3Review: (previous.sectionThreeReviewWords || section3ReviewCards(previous) || []).slice(),
    section3Current: (previous.sectionThreeCurrentWords || section3CurrentCards(previous) || []).slice(),
    section7Review: (previous.sectionSevenReviewWords || []).slice(),
    section7Current: (previous.sectionSevenCurrentWords || []).slice(),
    section7Nonsense: (previous.sectionSevenNonsenseWords || []).slice()
  };
  const dictationPlan = previous.dictationPlanOverride || [];
  dictationPlan.forEach((block) => {
    const label = String(block.label || "").toLowerCase();
    if (label.includes("sounds")) ttPickerSelections.dictationSounds = (block.values || []).slice();
    if (label.includes("word elements")) ttPickerSelections.dictationElements = (block.values || []).slice();
    if (label.includes("real words")) ttPickerSelections.dictationReal = (block.values || []).slice();
    if (label.includes("nonsense")) ttPickerSelections.dictationNonsense = (block.values || []).slice();
    if (label.includes("phrases")) ttPickerSelections.dictationPhrases = (block.values || []).slice();
    if (label.includes("sentences")) ttPickerSelections.dictationSentences = (block.values || []).slice();
  });
  const realWords = ttPickerSelections.dictationReal || [];
  ttSection8RealSlots = realWords.slice(0, 5).map((word) => ({ substep: previous.substep || skill.id, word }));
  ttSectionReviewSubsteps = {
    section2: [priorSubstep(skill.id)],
    section3: [priorSubstep(skill.id)],
    section7: [priorSubstep(skill.id)],
    section8Real: [skill.id]
  };
  group.preferredLessonType = ttNormalizeLessonType(ttPlannerDraft.lessonType);
  saveState();
  ttAssistantNotice = "Previous lesson duplicated into today’s assistant.";
  ttRenderPlannerPanel();
}

// ── Mode Picker ──────────────────────────────────────────────────────────────

function ttRenderModePicker() {
  const container = ttById("ttPlannerModePicker");
  if (!container) return;
  const draft = ttPlannerDraft;
  // Treat legacy part1/part2 as unified "group"
  const rawLt = draft.lessonType || "full";
  const lt = (rawLt === "part1" || rawLt === "part2") ? "group" : rawLt;
  if (rawLt === "part1" || rawLt === "part2") draft.lessonType = "group";
  const isFlash = lt === "flash";

  let html = `<div class="mode-pick-header">
    <span class="mode-pick-eyebrow">What type of lesson today?</span>
  </div>
  <div class="mode-pick-row">
    ${ttModeButtonsHtml(lt)}
  </div>`;

  // No sub-picker — group mode shows the full two-day flow in one unified lesson

  if (isFlash) {
    const secs = TT_LESSON_SECTIONS;
    const selected = new Set(draft.flashSections || ["1", "2", "3", "5"]);
    const totalMins = secs.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + s.mins, 0);
    const flashColor = totalMins === 0 ? "#475569"
      : totalMins < 30 ? "#3b82f6"
      : totalMins < 45 ? "#10b981"
      : totalMins === 45 ? "#f59e0b"
      : totalMins <= 52 ? "#f97316"
      : "#ef4444";
    const flashLabel = totalMins === 0 ? "Pick your sections below"
      : totalMins === 45 ? "✓ Perfect — exactly 45 min!"
      : totalMins > 45 ? `${totalMins - 45} min over target`
      : `${45 - totalMins} min left to fill`;
    const barPct = Math.min(100, Math.round((totalMins / 45) * 100));

    html += `<div class="flash-builder">
      <div class="flash-counter" style="--flash-color:${flashColor}">
        <span class="flash-mins${totalMins === 45 ? " is-perfect" : ""}">${totalMins}</span>
        <span class="flash-mins-unit">min</span>
        <div class="flash-counter-right">
          <span class="flash-label">${flashLabel}</span>
          <div class="flash-bar"><div class="flash-bar-fill" style="width:${barPct}%"></div></div>
          <span class="flash-target-line">Target: 45 min · tap sections to add or remove</span>
        </div>
      </div>
      <div class="flash-sections">
        ${secs.map((s) => {
          const on = selected.has(s.id);
          return `<button type="button" class="flash-sec-btn${on ? " active" : ""}"
            data-flash-sec="${escapeHtml(s.id)}" style="--sec-color:${s.color}">
            <span class="flash-sec-num">§${s.id}</span>
            <span class="flash-sec-name">${escapeHtml(s.name)}</span>
            <span class="flash-sec-mins">${s.mins}m</span>
          </button>`;
        }).join("")}
      </div>
    </div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll("[data-mode-pick]").forEach((btn) => {
    btn.addEventListener("click", () => ttSetPlannerLessonType(btn.dataset.modePick));
  });

  container.querySelectorAll("[data-flash-sec]").forEach((btn) => {
    btn.addEventListener("click", () => ttFlashSectionToggle(btn.dataset.flashSec));
  });
}

function ttFlashSectionToggle(secId) {
  const group = ttPlannerGroup();
  if (!group) return;
  ttEnsurePlannerDraft(group);
  ttPlannerDraft.flashSections ||= ["1", "2", "3", "5"];
  const idx = ttPlannerDraft.flashSections.indexOf(secId);
  if (idx >= 0) {
    ttPlannerDraft.flashSections.splice(idx, 1);
  } else {
    ttPlannerDraft.flashSections.push(secId);
    ttPlannerDraft.flashSections.sort((a, b) => Number(a) - Number(b));
  }
  // Re-render mode picker (snappy counter update) then rebuild section pickers
  ttRenderModePicker();
  const skill = scopeMap.find((s) => s.id === ttPlannerDraft.substep) || activeStep(group);
  const lesson = ttPlannerPreviewLesson(group);
  ttById("ttPlannerSections").innerHTML = ttPlannerSectionsHtml(group, skill, lesson);
  ttBindPlannerChips();
  ttRefreshPreview();
}

const ttDictationBookStartPages = {
  "1.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 9 },
  "1.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 11 },
  "1.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 14 },
  "1.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 17 },
  "1.5": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 18 },
  "1.6": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 19 },
  "2.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 33 },
  "2.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 34 },
  "2.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 37 },
  "2.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 38 },
  "2.5": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%201-2%20-%20first%20part%20of%20book.pdf", page: 40 },
  "3.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 4 },
  "3.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 8 },
  "3.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 13 },
  "3.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 14 },
  "3.5": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 16 },
  "4.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 36 },
  "4.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 38 },
  "4.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 42 },
  "4.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%203-4%20-%20middle%20part%20of%20book.pdf", page: 43 },
  "5.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 4 },
  "5.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 5 },
  "5.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 10 },
  "5.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 12 },
  "5.5": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 17 },
  "6.1": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 36 },
  "6.2": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 40 },
  "6.3": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 45 },
  "6.4": { file: "Dictation%20Books%20in%20PDF%20form/Wilson%20WRS%20Dictation%20Book%20Steps%205-6%20-%20last%20third%20of%20book.pdf", page: 46 },
  "7.1": { file: "Dictation%20Books%20in%20PDF%20form/WRS%20Dictation%20Book%20step%207%20only%20.pdf", page: 13 },
  "7.2": { file: "Dictation%20Books%20in%20PDF%20form/WRS%20Dictation%20Book%20step%207%20only%20.pdf", page: 16 },
  "7.3": { file: "Dictation%20Books%20in%20PDF%20form/WRS%20Dictation%20Book%20step%207%20only%20.pdf", page: 18 },
  "7.4": { file: "Dictation%20Books%20in%20PDF%20form/WRS%20Dictation%20Book%20step%207%20only%20.pdf", page: 21 },
  "7.5": { file: "Dictation%20Books%20in%20PDF%20form/WRS%20Dictation%20Book%20step%207%20only%20.pdf", page: 25 }
};

function ttPlannerReferenceContext() {
  const group = ttPlannerGroup() || ttActiveGroup();
  if (!group) return null;
  const useDraft = ttPlannerDraft?.groupId === group.id;
  const substep = useDraft ? ttPlannerDraft.substep : ttLesson?.substep || group.substep;
  const skill = scopeMap.find((item) => item.id === substep) || activeStep(group);
  const level = useDraft ? ttPlannerDraft.level || group.readerLevel || "AB" : ttLesson?.readerLevel || group.readerLevel || "AB";
  const fallbackPage = pageAssignment(group, skill, "wordlist", 0, level).page || 0;
  const wordlist = useDraft
    ? Number(ttPlannerDraft.wordlist || fallbackPage)
    : Number(ttLesson?.wordlistPageNumber || fallbackPage);
  return { group, skill, level, wordlist };
}

function ttReferencePdfHref(type) {
  const context = ttPlannerReferenceContext();
  if (!context?.skill) return "";
  if (type === "reader") {
    const reader = Number(context.skill.reader || String(context.skill.id || "").split(".")[0]);
    if (!reader || !context.wordlist) return "";
    return ttPdfViewerHref(
      `Readers%20in%20PDF%20form/WRS_Student_Reader_${reader}.pdf`,
      context.wordlist + 2,
      `Reader ${reader}, p. ${context.wordlist}`
    );
  }
  const entry = ttDictationBookStartPages[context.skill.id];
  return entry ? ttPdfViewerHref(entry.file, entry.page, `Dictation ${context.skill.id} start`) : "";
}

function ttPdfViewerHref(file, page = "", title = "") {
  const params = new URLSearchParams();
  params.set("file", file);
  if (page) params.set("page", String(page));
  if (title) params.set("title", title);
  return `PdfViewer.html?${params.toString()}`;
}

function ttSetReferenceLink(id, href, fallbackHref, label) {
  const link = ttById(id);
  if (!link) return;
  link.href = href || fallbackHref;
  link.setAttribute("aria-disabled", href ? "false" : "true");
  link.textContent = label;
}

function ttUpdateHomeReferenceLinks() {
  const context = ttPlannerReferenceContext();
  const readerHref = ttReferencePdfHref("reader");
  const dictationHref = ttReferencePdfHref("dictation");
  const readerLabel = readerHref && context
    ? `Current Reader ${context.skill.reader}, p. ${context.wordlist}`
    : "Current charting page";
  const dictationLabel = dictationHref && context
    ? `Current ${context.skill.id} start`
    : "Current substep start";
  ttSetReferenceLink("ttCurrentReaderPdf", readerHref, "ReferencePdfs.html?set=readers", readerLabel);
  ttSetReferenceLink("ttCurrentDictationPdf", dictationHref, "ReferencePdfs.html?set=dictation", dictationLabel);
  // Also update the ribbon reference panel links
  ttSetReferenceLink("ttRibbonCurrentReaderPdf", readerHref, "ReferencePdfs.html?set=readers", readerLabel);
  ttSetReferenceLink("ttRibbonCurrentDictationPdf", dictationHref, "ReferencePdfs.html?set=dictation", dictationLabel);
}

function ttPlannerLastLessonText(group) {
  const lastPlan = (group.history || []).slice().reverse().find((plan) => plan.source === "TeachToday" && plan.lessons?.[0]);
  if (!lastPlan?.lessons?.[0]) return "No saved lesson yet. Smart defaults use this group’s current substep.";
  const lesson = lastPlan.lessons[0];
  const saved = lastPlan.savedAt ? formatDateTime(new Date(lastPlan.savedAt)) : lastPlan.created || "";
  return `Last taught: ${lesson.substep}, Reader ${lesson.reader}, wordlist p. ${lesson.wordlistPageNumber || "--"}${saved ? ` · ${saved}` : ""}`;
}

function ttFillPlannerCoreSelects(group, skill, level) {
  const draft = ttEnsurePlannerDraft(group);
  const substep = ttById("ttPlannerSubstep");
  const levelSelect = ttById("ttPlannerLevel");
  const wordlist = ttById("ttPlannerWordlist");
  const sentence = ttById("ttPlannerSentence");
  const passageSelect = ttById("ttPlannerPassage");
  const approachSelect = ttById("ttPlannerPassageApproach");
  if (substep) {
    substep.innerHTML = scopeMap.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === draft.substep ? " selected" : ""}>${escapeHtml(item.id)} - ${escapeHtml(item.title)}</option>`).join("");
  }
  if (levelSelect) {
    levelSelect.innerHTML = ["AB", "A", "B", "N"].map((item) => `<option value="${item}"${item === draft.level ? " selected" : ""}>${item}</option>`).join("");
  }
  if (wordlist) {
    const pages = pageList(skill, "wordlist", level);
    wordlist.innerHTML = pages.map((page, index) => {
      const count = chartingPageEntry(skill.id, resolvedLevel(skill, "wordlist", level), page).count;
      return `<option value="${page}"${page === Number(draft.wordlist) ? " selected" : ""}>p. ${page} (${index + 1}/${pages.length}${count ? `, ${count}w` : ""})</option>`;
    }).join("");
  }
  if (sentence) {
    const pages = pageList(skill, "sentences", level);
    sentence.innerHTML = pages.map((page, index) => `<option value="${page}"${page === Number(draft.sentence) ? " selected" : ""}>p. ${page} (${index + 1}/${pages.length})</option>`).join("");
  }
  if (passageSelect) {
    const passages = ttPassagesForSubstep(skill.id);
    if (!passages.length) {
      passageSelect.innerHTML = `<option value="">No stories loaded yet</option>`;
      passageSelect.disabled = true;
    } else {
      const selectedId = passages.some((passage) => passage.id === draft.passageId) ? draft.passageId : passages[0].id;
      draft.passageId = selectedId;
      passageSelect.disabled = false;
      passageSelect.innerHTML = passages.map((passage) => (
        `<option value="${escapeHtml(passage.id)}"${passage.id === selectedId ? " selected" : ""}>${escapeHtml(ttPassageLabel(passage))}</option>`
      )).join("");
    }
  }
  if (approachSelect) {
    approachSelect.innerHTML = TT_SECTION9_APPROACHES.map((approach) => (
      `<option value="${escapeHtml(approach.id)}"${approach.id === draft.passageApproach ? " selected" : ""}>${escapeHtml(approach.label)}</option>`
    )).join("");
  }
}

function ttPlannerPreviewLesson(group) {
  const draft = ttEnsurePlannerDraft(group);
  const skillId = draft.substep || group.substep;
  const skill = scopeMap.find((item) => item.id === skillId) || activeStep(group);
  const level = draft.level || group.readerLevel || "AB";
  const tempGroup = ttClone(group);
  tempGroup.substep = skill.id;
  tempGroup.readerLevel = level;
  tempGroup.pageProgress ||= { wordlist: 0, sentences: 0, passage: 0 };
  const wordPages = pageList(skill, "wordlist", level);
  const sentencePages = pageList(skill, "sentences", level);
  const selectedWordPage = Number(draft.wordlist || 0);
  const selectedSentencePage = Number(draft.sentence || 0);
  tempGroup.pageProgress.wordlist = Math.max(0, wordPages.indexOf(selectedWordPage));
  tempGroup.pageProgress.sentences = Math.max(0, sentencePages.indexOf(selectedSentencePage));
  const lesson = createLesson(tempGroup, skill, 0, 1);
  ttApplySection9StoryToLesson(lesson, group, skill, {
    passageId: draft.passageId,
    approach: draft.passageApproach
  });
  if (selectedSentencePage) {
    const sentenceAssignment = {
      reader: skill.reader,
      page: selectedSentencePage,
      level: resolvedLevel(skill, "sentences", level),
      index: Math.max(0, sentencePages.indexOf(selectedSentencePage)) + 1,
      total: sentencePages.length
    };
    const sentenceData = sentenceDataForPage(skill, sentenceAssignment);
    lesson.sentencePageNumber = selectedSentencePage;
    lesson.sentenceLevel = sentenceAssignment.level;
    lesson.sentenceMeta = `Reader ${skill.reader}, p. ${selectedSentencePage} - ${pagePositionLabel(sentenceAssignment, "sentence")}`;
    lesson.highFrequencyWords = sentenceData.highFrequency;
    lesson.readerSentences = sentenceData.sentences;
  }
  return lesson;
}

// ── Section 8 Real Words: 5-slot individual word picker ──────────────────────

function ttSection8RealSlotsInit(skill) {
  const currentIdx = scopeMap.findIndex((s) => s.id === skill.id);
  const upTo = (subIds) => subIds.filter((id) => {
    const i = scopeMap.findIndex((s) => s.id === id);
    return i >= 0 && i <= currentIdx;
  });
  const level = ttPlannerDraft?.level || "AB";

  // Helper: get real (non-nonsense) words for a substep
  const realWords = (subId) => {
    const ns = new Set(readerNonsenseWordsFromSubstep(subId));
    return readerWordsFromSubstep(subId, level)
      .concat(dictationWordsFor(subId, level))
      .filter((w) => isValidDictationWord(w) && !ns.has(w));
  };

  // Build pools for each slot per the specified criteria
  const allSubsteps = scopeMap.slice(0, currentIdx + 1).map((s) => s.id);

  // Slot 0: 1-syllable real word from any substep up to current
  const pool0 = uniqueWords(allSubsteps.flatMap(realWords)).filter((w) => ttCountSyllables(w) === 1);

  // Slot 1: 1-syllable from specific early substeps (up to current)
  const slot1Preferred = upTo(["2.4", "2.5", "3.5", "4.1", "5.1", "6.1", "6.4"]);
  const pool1 = uniqueWords((slot1Preferred.length ? slot1Preferred : allSubsteps.slice(-4)).flatMap(realWords))
    .filter((w) => ttCountSyllables(w) === 1);

  // Slot 2: from specific mixed substeps
  const slot2Preferred = upTo(["2.3", "2.4", "2.5", "3.3", "4.1", "4.2", "5.1", "5.2", "6.1", "6.4"]);
  const pool2 = uniqueWords((slot2Preferred.length ? slot2Preferred : allSubsteps.slice(-4)).flatMap(realWords));

  // Slots 3 & 4: current substep
  const pool34 = uniqueWords(realWords(skill.id));

  const pickFrom = (pool, avoid) => {
    const filtered = uniqueWords(pool).filter((w) => !avoid.has(w));
    return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : null;
  };

  const used = new Set();
  const w0 = pickFrom(pool0, used); if (w0) used.add(w0);
  const w1 = pickFrom(pool1, used); if (w1) used.add(w1);
  const w2 = pickFrom(pool2, used); if (w2) used.add(w2);
  const w3 = pickFrom(pool34, used); if (w3) used.add(w3);
  const w4 = pickFrom(pool34, used);

  // Find which substep a word came from
  const findSubstep = (word) => {
    if (!word) return skill.id;
    for (let i = currentIdx; i >= 0; i--) {
      if (readerWordsFromSubstep(scopeMap[i].id, level).includes(word)) return scopeMap[i].id;
    }
    return skill.id;
  };

  ttSection8RealSlots = [
    { substep: findSubstep(w0) || skill.id, word: w0 },
    { substep: findSubstep(w1) || skill.id, word: w1 },
    { substep: findSubstep(w2) || skill.id, word: w2 },
    { substep: w3 ? skill.id : skill.id, word: w3 },
    { substep: skill.id, word: w4 },
  ];
}

function ttSection8RealSlotsHtml(skill) {
  if (!ttSection8RealSlots.length) ttSection8RealSlotsInit(skill);
  const currentIdx = scopeMap.findIndex((s) => s.id === skill.id);
  const substepOptions = scopeMap.slice(Math.max(0, currentIdx - 8), currentIdx + 1).map((s) => s.id).reverse();
  const level = ttPlannerDraft?.level || "AB";
  const slotHints = [
    "1-syllable · any prior step",
    "1-syllable · early steps",
    "mixed steps review",
    "current substep",
    "current substep"
  ];

  const slotHtml = ttSection8RealSlots.map((slot, i) => {
    const wordPool = uniqueWords(readerWordsFromSubstep(slot.substep, level).concat(dictationWordsFor(slot.substep, level)))
      .filter((w) => {
        const ns = new Set(readerNonsenseWordsFromSubstep(slot.substep));
        return isValidDictationWord(w) && !ns.has(w);
      }).slice(0, 40);
    const selectedWord = slot.word || "";
    return `<div class="s8-real-slot" data-slot="${i}">
      <div class="s8-slot-header">
        <span class="s8-slot-num">Word #${i + 1}</span>
        <span class="s8-slot-hint">${slotHints[i]}</span>
        <span class="s8-slot-selected${selectedWord ? "" : " empty"}">${escapeHtml(selectedWord) || "—"}</span>
      </div>
      <div class="s8-slot-substeps">
        <span>From:</span>
        ${substepOptions.map((sub) => `<button type="button" class="s8-substep-btn${slot.substep === sub ? " selected" : ""}" data-slot="${i}" data-substep="${escapeHtml(sub)}" onclick="ttSetSection8SlotSubstep(this)">${escapeHtml(sub)}</button>`).join("")}
      </div>
      <div class="s8-slot-chips">
        ${wordPool.map((w) => `<button type="button" class="${selectedWord === w ? "selected" : ""}" data-slot="${i}" data-word="${escapeHtml(w)}" onclick="ttSetSection8SlotWord(this)">${escapeHtml(w)}</button>`).join("")}
      </div>
      <div class="s8-slot-custom-row">
        <input type="text" placeholder="Type custom word…" onkeydown="if(event.key==='Enter'){ttSetSection8SlotCustom(this,${i});event.preventDefault();}">
        <button type="button" onclick="ttSetSection8SlotCustom(this.previousElementSibling,${i})">+</button>
      </div>
    </div>`;
  }).join("");

  return `<div class="s8-real-slots">
    <div class="s8-slots-header">
      5 Real Words
      <span class="s8-slots-badge">Choose substep → choose word per slot</span>
    </div>
    ${slotHtml}
  </div>`;
}

function ttSetSection8SlotSubstep(btn) {
  const slotIdx = Number(btn.dataset.slot);
  const substep = btn.dataset.substep;
  if (!ttSection8RealSlots[slotIdx]) return;
  ttSection8RealSlots[slotIdx].substep = substep;
  ttSection8RealSlots[slotIdx].word = null; // clear word when substep changes
  // Re-render the full slots container in-place
  const container = btn.closest(".s8-real-slots");
  if (!container) return;
  const skill = scopeMap.find((s) => s.id === ttPlannerDraft?.substep) || activeStep(ttPlannerGroup());
  if (!skill) return;
  container.outerHTML = ttSection8RealSlotsHtml(skill);
  ttSyncSection8RealSelectionState();
  ttRefreshPreview();
}

function ttSetSection8SlotWord(btn) {
  const slotIdx = Number(btn.dataset.slot);
  const word = btn.dataset.word;
  if (!ttSection8RealSlots[slotIdx]) return;
  ttSection8RealSlots[slotIdx].word = ttSection8RealSlots[slotIdx].word === word ? null : word;
  // Update UI: selected word display + chip highlight
  const slot = btn.closest(".s8-real-slot");
  const selectedDisplay = slot?.querySelector(".s8-slot-selected");
  if (selectedDisplay) {
    selectedDisplay.textContent = ttSection8RealSlots[slotIdx].word || "—";
    selectedDisplay.classList.toggle("empty", !ttSection8RealSlots[slotIdx].word);
  }
  slot?.querySelectorAll(".s8-slot-chips button").forEach((c) => {
    c.classList.toggle("selected", c.dataset.word === ttSection8RealSlots[slotIdx].word);
  });
  ttSyncSection8RealSelectionState();
  ttRefreshPreview();
}

function ttSetSection8SlotCustom(inputEl, slotIdx) {
  const word = (inputEl.value || "").trim();
  if (!word || !ttSection8RealSlots[slotIdx]) return;
  ttSection8RealSlots[slotIdx].word = word;
  inputEl.value = "";
  // Update display
  const slot = inputEl.closest(".s8-real-slot");
  const selectedDisplay = slot?.querySelector(".s8-slot-selected");
  if (selectedDisplay) {
    selectedDisplay.textContent = word;
    selectedDisplay.classList.remove("empty");
  }
  // Add chip and select it
  const chipArea = slot?.querySelector(".s8-slot-chips");
  if (chipArea) {
    chipArea.querySelectorAll("button").forEach((c) => c.classList.remove("selected"));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "selected";
    btn.dataset.slot = String(slotIdx);
    btn.dataset.word = word;
    btn.textContent = word;
    btn.addEventListener("click", () => ttSetSection8SlotWord(btn));
    chipArea.prepend(btn);
  }
  ttSyncSection8RealSelectionState();
  ttRefreshPreview();
}

function ttSection8RealWords() {
  return uniqueWords((ttSection8RealSlots || []).map((slot) => slot?.word).filter(Boolean));
}

function ttSyncSection8RealSelectionState() {
  ttPickerSelections.dictationReal = ttSection8RealWords();
}

function ttPlannerSectionsHtml(group, skill, lesson) {
  const originalSelectedGroupId = appState.selectedGroupId;
  appState.selectedGroupId = group.id;
  ttEnsurePlannerDraft(group);
  const sectionSeven = ttBuildSectionSevenWordSets(lesson, skill);
  const dictationPlan = ttDictationPlan(lesson, skill, { avoidWordKeys: new Set() });
  const dictationBlock = (label) => dictationPlan.find((block) => block.label.toLowerCase().includes(label))?.values || [];
  const chartWords = uniqueWords([].concat(lesson.realWords || [], lesson.nonsenseWords || []));
  const fallbackPrior = [priorSubstep(skill.id)];
  const sec2Substeps = ttSectionReviewSubsteps.section2?.length ? ttSectionReviewSubsteps.section2 : fallbackPrior;
  const sec3Substeps = ttSectionReviewSubsteps.section3?.length ? ttSectionReviewSubsteps.section3 : fallbackPrior;
  const sec7Substeps = ttSectionReviewSubsteps.section7?.length ? ttSectionReviewSubsteps.section7 : fallbackPrior;
  const sec8Substeps = ttSectionReviewSubsteps.section8Real?.length ? ttSectionReviewSubsteps.section8Real : [skill.id];
  const level = lesson.readerLevel || "AB";
  const reviewPool = ttPlannerReviewWordPool(sec2Substeps, level).slice(0, 64);
  const sec3ReviewPool = ttPlannerReviewWordPool(sec3Substeps, level).slice(0, 36);
  const sec7ReviewPool = ttPlannerReviewWordPool(sec7Substeps, level).slice(0, 40);
  const sec8RealPool = ttPlannerReviewWordPool(sec8Substeps, level).slice(0, 40);
  const currentPool = chartWords.slice(0, 30);
  const section3Review = uniqueWords([].concat(section3ReviewCards(lesson), sec3ReviewPool)).slice(0, 36);
  const section3Current = uniqueWords([].concat(section3CurrentCards(lesson), chartWords)).slice(0, 36);
  const vowels = vowelSoundList(skill.id);
  const consonants = consonantSoundList(skill.id);
  const welded = ttKnownWeldedValues(skill.id);
  const elements = wordElementList(skill.id);
  const sounds = uniqueWords([].concat(vowels, consonants, welded)).slice(0, 80);
  const realWords = uniqueWords([].concat(ttCurrentRealWordPool(lesson, skill), ttReviewRealWordPool(lesson, skill))).slice(0, 40);
  const nonsense = ttTrueNonsensePool(skill.id).slice(0, 60);
  const phraseRows = currentDictationPhraseRows(skill.id);
  const dictationSentences = uniqueWords(currentDictationSentencesForLesson(lesson, skill, group)).slice(0, 30);
  const readerSentences = uniqueWords(currentReaderSentencesForDictation(lesson, skill)).slice(0, 24);
  const lessonType = ttPlannerDraft.lessonType || "full";

  const plannerRow = (num, color, label, subtitle, pickers, extraAction = "", timeMins = null) =>
    `<div class="planner-section-row" data-sec="${num}" style="--ps-color:${color}">
      <div class="planner-section-label">
        <span class="planner-sec-num">${num}</span>
        <div>
          <strong>${label}${timeMins ? `<span class="planner-sec-time">${timeMins}</span>` : ""}</strong>
          ${subtitle ? `<em>${subtitle}</em>` : ""}
        </div>
        ${extraAction}
      </div>
      <div class="planner-pickers-wrap">${pickers}</div>
    </div>`;

  // Schedule summary bar
  const scheduleBar = ttPlannerScheduleBarHtml(lessonType);

  const row2Decoding = plannerRow(2, "#10b981", "Teach & Review Concepts", "Review first, then current words",
    ttPlannerReviewPickerHtml("section2Review", "Review words", reviewPool, lesson.sectionTwoReviewWords || [], 6, "section2", skill) +
    ttPlannerPickerHtml("section2Current", "Current words", currentPool, lesson.sectionTwoCurrentWords || [], 6),
    "", "5 min"
  );

  // Part 2 uses a distinct set of Section 2 words (Day 2 — different from Day 1)
  const row2Encoding = plannerRow(2, "#10b981", "§2B · Teach & Review Concepts", "Day 2 words — different from Day 1 §2",
    ttPlannerReviewPickerHtml("section2ReviewB2", "Review words (Day 2)", reviewPool, lesson.sectionTwoReviewWordsB2 || [], 6, "section2", skill) +
    ttPlannerPickerHtml("section2CurrentB2", "Current words (Day 2)", currentPool, lesson.sectionTwoCurrentWordsB2 || [], 6),
    "", "5 min"
  );

  const row3 = plannerRow(3, "#3b82f6", "Word Cards", "Review cards first, then current",
    ttPlannerReviewPickerHtml("section3Review", "Review cards", section3Review, section3ReviewCards(lesson), 8, "section3", skill) +
    ttPlannerPickerHtml("section3Current", "Current cards", section3Current, section3CurrentCards(lesson), 8),
    "", "5 min"
  );

  const row6 = plannerRow(6, "#f97316", "Quick Drill in Reverse", "Sounds to practice encoding",
    ttPlannerPickerHtml("section6Vowels", "Vowels", vowels, [], 5) +
    ttPlannerPickerHtml("section6Consonants", "Consonants", consonants, [], 5) +
    ttPlannerPickerHtml("section6Welded", "Welded / glued", welded, [], 5) +
    ttPlannerPickerHtml("section6Elements", "Word elements", elements, [], 5),
    `<button type="button" class="planner-select-all-btn" data-sec-target="6" onclick="ttToggleSection6All(this)">Select all</button>`,
    "3 min"
  );

  const row7 = plannerRow(7, "#f43f5e", "Teach & Review for Spelling", "Words students will spell",
    ttPlannerReviewPickerHtml("section7Review", "Review words", uniqueWords([].concat(sectionSeven.review, sec7ReviewPool)), [], 5, "section7", skill) +
    ttPlannerPickerHtml("section7Current", "Current words", uniqueWords([].concat(sectionSeven.current, currentPool)), [], 5) +
    ttPlannerPickerHtml("section7Nonsense", "Nonsense words", uniqueWords([].concat(sectionSeven.nonsense, nonsense)), [], 3),
    "", "10 min"
  );

  const row8 = plannerRow(8, "#6366f1", "Dictation", "Sounds, words, phrases and sentences to dictate",
    ttPlannerPickerHtml("dictationSounds", "Sounds", sounds, dictationBlock("sounds"), 5) +
    ttPlannerPickerHtml("dictationElements", "Word elements", elements, dictationBlock("word elements"), 5) +
    ttSection8RealSlotsHtml(skill) +
    ttPlannerPickerHtml("dictationNonsense", "Nonsense words", nonsense, [], 3) +
    ttPlannerPhrasePickerHtml(phraseRows, dictationBlock("phrases"), 3) +
    ttPlannerPickerHtml("dictationSentences", "Dictation book sentences", dictationSentences, dictationBlock("sentences"), "max 3 combined") +
    ttPlannerPickerHtml("readerSentences", "Reader sentences for dictation", readerSentences, [], "max 3 combined"),
    "", "20 min"
  );

  let rows = [];
  if (lessonType === "group" || lessonType === "part1" || lessonType === "part2") {
    // Unified 45+45 group lesson: Day 1 pickers (§2, §3) + Day 2 pickers (§2B, §6, §7, §8)
    rows = [row2Decoding, row3, row2Encoding, row6, row7, row8];
  } else if (lessonType === "flash") {
    // Only show pickers for selected sections that have plannable content
    const flashSet = new Set(ttPlannerDraft.flashSections || []);
    if (flashSet.has("2")) rows.push(row2Decoding);
    if (flashSet.has("3")) rows.push(row3);
    if (flashSet.has("6")) rows.push(row6);
    if (flashSet.has("7")) rows.push(row7);
    if (flashSet.has("8")) rows.push(row8);
    if (!rows.length) {
      rows.push(`<div class="planner-schedule-bar" style="grid-column:1/-1;color:#64748b;background:#f8fafc;border-color:#e2e8f0">
        Tap sections above to build your lesson — pickers appear here as you add sections.
      </div>`);
    }
  } else {
    // full / full45 — show all pickers
    rows = [row2Decoding, row3, row6, row7, row8];
  }

  const html = scheduleBar + rows.join("");
  appState.selectedGroupId = originalSelectedGroupId;
  return html;
}

function ttPlannerScheduleBarHtml(lessonType) {
  const sec = (num, mins, optional = false) =>
    `<span class="planner-schedule-sec${optional ? " is-optional" : ""}"><span class="sec-num">${num}</span><span class="sec-min">${mins}</span></span>`;
  const div = `<span class="planner-schedule-divider">›</span>`;

  let label = "";
  let secsHtml = "";

  if (lessonType === "group" || lessonType === "part1" || lessonType === "part2") {
    label = "Group Lesson · 45+45 min";
    // Full two-day flow: Decoding Day §1-5, then Encoding Day §1↺, §2B, §6-8
    secsHtml = [
      sec(1,"3m"), div, sec(2,"5m"), div, sec(3,"5m"), div, sec(4,"10m"), div, sec(5,"5m"),
      div, sec("1↺","3m"), div, sec("2B","5m"),
      div, sec(6,"3m"), div, sec(7,"10m"), div, sec(8,"20m"),
      div, sec("9","if time",true), sec("10","if time",true)
    ].join("");
  } else if (lessonType === "full45") {
    label = "Quick 1:1 · 45 min";
    secsHtml = [sec(1,"3m"), div, sec(2,"5m"), div, sec(3,"5m"), div, sec(4,"5m"), div, sec(5,"3m"), div, sec(6,"3m"), div, sec(7,"7m"), div, sec(8,"10m"), div, sec("9","if time",true)].join("");
  } else if (lessonType === "flash") {
    const flashSet = new Set(ttPlannerDraft.flashSections || []);
    const totalMins = TT_LESSON_SECTIONS.filter((s) => flashSet.has(s.id)).reduce((sum, s) => sum + s.mins, 0);
    label = `Flash Lesson · ${totalMins} min`;
    secsHtml = TT_LESSON_SECTIONS.filter((s) => flashSet.has(s.id)).map((s, i, arr) =>
      (i > 0 ? div : "") + sec(s.id, s.mins + "m")
    ).join("");
    if (!secsHtml) secsHtml = `<span style="color:#94a3b8;font-weight:500">No sections selected yet</span>`;
  } else {
    label = "Full Lesson · 1:1 · 60 min";
    secsHtml = [sec(1,"3m"), div, sec(2,"5m"), div, sec(3,"5m"), div, sec(4,"10m"), div, sec(5,"5m"), div, sec(6,"3m"), div, sec(7,"10m"), div, sec(8,"20m"), div, sec("9","if time",true), sec("10","if time",true)].join("");
  }

  return `<div class="planner-schedule-bar"><strong>${escapeHtml(label)}</strong>${secsHtml}</div>`;
}

function ttPlannerReviewWordPool(substeps, level) {
  const real = uniqueWords((substeps || []).flatMap((substep) =>
    readerWordsFromSubstep(substep, level).concat(dictationWordsFor(substep, level))
  )).filter(isValidDictationWord);
  // Always include at least one nonsense word from one of the substeps
  const nsPool = uniqueWords((substeps || []).flatMap((sub) => readerNonsenseWordsFromSubstep(sub)));
  const nsWord = nsPool.length ? nsPool[Math.floor(Math.random() * nsPool.length)] : null;
  return nsWord ? uniqueWords([...real, nsWord]) : real;
}

function ttPlannerReviewSourceHtml(skill, selectedSubsteps) {
  const currentIndex = scopeMap.findIndex((item) => item.id === skill.id);
  const options = scopeMap.slice(Math.max(0, currentIndex - 8), currentIndex + 1).map((item) => item.id).reverse();
  const selected = new Set(selectedSubsteps || []);
  return `<article class="planner-picker planner-review-source" data-picker="reviewSources" data-target-count="multi">
    <header><strong>Review source substeps</strong><span>multi-select</span></header>
    <div class="planner-chip-row">
      ${options.map((id) => `<button type="button" class="${selected.has(id) ? "selected" : ""}" data-value="${escapeHtml(id)}">${escapeHtml(id)}</button>`).join("")}
    </div>
  </article>`;
}

// Returns nonsense words from the last 6 substeps (for N-view)
function ttReviewNonsensePool(skillId) {
  const idx = scopeMap.findIndex((s) => s.id === skillId);
  const subs = scopeMap.slice(Math.max(0, idx - 6), idx + 1).map((s) => s.id);
  return uniqueWords(subs.flatMap((sub) => readerNonsenseWordsFromSubstep(sub)));
}

// Build initial preselection across 2-3 different substeps with 1-2 guaranteed nonsense words.
// Caches each substep pool so bubble highlights work from the start.
function ttBuildReviewPreselect(pickerId, skill, numTarget, level) {
  const currentIdx = scopeMap.findIndex((s) => s.id === skill.id);
  const priorSubs = scopeMap.slice(Math.max(0, currentIdx - 8), currentIdx).map((s) => s.id);
  if (!priorSubs.length) return [];

  // Pick 3 prior substeps: immediate prior always first, then 2 random others
  const prior = priorSubs[priorSubs.length - 1];
  const rest = priorSubs.slice(0, -1).sort(() => Math.random() - 0.5);
  const reviewSubs = [prior, ...rest].slice(0, Math.min(3, priorSubs.length));

  // Cache each substep's pool
  reviewSubs.forEach((sub) => {
    const pool = uniqueWords(
      readerWordsFromSubstep(sub, level).concat(dictationWordsFor(sub, level))
    ).filter(isValidDictationWord);
    ttPickerSubstepCache[`${pickerId}::${sub}`] = pool;
  });
  // Cache N pool
  ttPickerSubstepCache[`${pickerId}::N`] = ttReviewNonsensePool(skill.id);

  const nsCount = Math.min(2, Math.max(1, Math.floor(numTarget / 3)));
  const realCount = numTarget - nsCount;

  const result = [];
  const used = new Set();

  // Pick exactly 1 real word from each substep (different words from different substeps)
  for (const sub of reviewSubs) {
    if (result.length >= realCount) break;
    const pool = (ttPickerSubstepCache[`${pickerId}::${sub}`] || []).filter((w) => !used.has(w));
    if (!pool.length) continue;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    result.push(pick);
    used.add(pick);
  }
  // Fill remaining real slots if not enough substeps had words
  if (result.length < realCount) {
    const allReal = uniqueWords(reviewSubs.flatMap((sub) => ttPickerSubstepCache[`${pickerId}::${sub}`] || []))
      .filter((w) => !used.has(w));
    ttSmartPreselect(allReal, realCount - result.length).forEach((w) => {
      result.push(w); used.add(w);
    });
  }
  // Add 1-2 nonsense words
  const nsPool = (ttPickerSubstepCache[`${pickerId}::N`] || []).filter((w) => !used.has(w));
  nsPool.sort(() => Math.random() - 0.5).slice(0, nsCount).forEach((w) => result.push(w));

  return result;
}

function ttSubstepBubblesHtml(sectionKey, skill) {
  const currentIndex = scopeMap.findIndex((item) => item.id === skill.id);
  const options = scopeMap.slice(Math.max(0, currentIndex - 8), currentIndex + 1).map((item) => item.id).reverse();
  const current = (ttSectionReviewSubsteps[sectionKey] || [])[0];
  return `<div class="planner-substep-row" data-substep-section="${escapeHtml(sectionKey)}">
    <span class="planner-substep-label">From:</span>
    ${options.map((id) => `<button type="button" class="planner-substep-btn${current === id ? " selected" : ""}" data-value="${escapeHtml(id)}" data-substep-section="${escapeHtml(sectionKey)}">${escapeHtml(id)}</button>`).join("")}
    <button type="button" class="planner-substep-btn planner-substep-n-btn${current === "N" ? " selected" : ""}" data-value="N" data-substep-section="${escapeHtml(sectionKey)}" title="Nonsense words">N</button>
  </div>`;
}

function ttPlannerReviewPickerHtml(id, title, items, selected, targetCount, sectionKey, skill) {
  const level = ttPlannerDraft?.level || "AB";
  const numTarget = Number(targetCount) || 0;
  const currentSubstep = (ttSectionReviewSubsteps[sectionKey] || [])[0] || priorSubstep(skill.id);
  const isNView = currentSubstep === "N";

  // Build display pool for the current substep
  const nsWords = new Set(readerNonsenseWordsFromSubstep(currentSubstep));
  const currentPool = isNView
    ? ttReviewNonsensePool(skill.id)
    : uniqueWords(
        readerWordsFromSubstep(currentSubstep, level).concat(dictationWordsFor(currentSubstep, level))
      ).filter(isValidDictationWord);

  // Cache current substep pool
  ttPickerSubstepCache[`${id}::${currentSubstep}`] = currentPool;

  // Initial preselection: spread across multiple substeps + 1-2 nonsense
  if (!ttPickerSelections[id]) {
    ttPickerSelections[id] = ttBuildReviewPreselect(id, skill, numTarget, level);
  }

  const currentSels = ttPickerSelections[id];
  const selectedSet = new Set(currentSels);

  const reshuffleBtn = numTarget > 0
    ? `<button type="button" class="picker-reshuffle-btn" onclick="ttReshufflePicker(this)" title="New random selection">⟳</button>`
    : "";
  const clearBtn = `<button type="button" class="picker-clear-btn" onclick="ttClearPicker(this)" title="Clear all selections">✕</button>`;
  const undoBtn = `<button type="button" class="picker-undo-btn" onclick="ttRemoveLastPick(this)" title="Remove last selection">⌫</button>`;
  const completeBadge = `<span class="picker-done-badge" title="Target met ✓">✓</span>`;
  // Cross-substep count badge so user knows selections from other substeps are remembered
  const crossCount = currentSels.filter((w) => !currentPool.includes(w)).length;
  const crossBadge = crossCount > 0
    ? `<span class="picker-cross-badge" title="${crossCount} word(s) selected from other substeps">+${crossCount} other</span>`
    : "";
  const customInput = `<div class="picker-custom-row"><input type="text" class="picker-custom-input" placeholder="Type a word…" onkeydown="if(event.key==='Enter'){ttAddCustomWord(this);event.preventDefault();}"><button type="button" class="picker-custom-add" onclick="ttAddCustomWord(this.previousElementSibling)">+</button></div>`;

  return `<article class="planner-picker${selectedSet.size >= numTarget && numTarget > 0 ? " picker-complete" : ""}" data-picker="${escapeHtml(id)}" data-target-count="${numTarget}">
    <header>
      <strong>${escapeHtml(title)}</strong>
      <span class="picker-target-pill">${numTarget} target</span>
      ${completeBadge}${crossBadge}
      ${reshuffleBtn}${clearBtn}${undoBtn}
    </header>
    ${ttSubstepBubblesHtml(sectionKey, skill)}
    <div class="planner-chip-row">
      ${currentPool.map((item) => {
        const isNs = isNView || nsWords.has(item);
        return `<button type="button" class="${selectedSet.has(item) ? "selected" : ""}${isNs ? " chip-nonsense" : ""}" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
      }).join("")}
    </div>
    ${customInput}
  </article>`;
}

// Spread-sample: divide pool into targetCount equal segments, pick one at random from each.
// Gives a representative spread rather than always taking the first N items.
function ttSmartPreselect(pool, targetCount) {
  const n = Math.min(Number(targetCount) || 0, pool.length);
  if (n <= 0 || !pool.length) return [];
  const segSize = pool.length / n;
  const result = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * segSize);
    const end = Math.floor((i + 1) * segSize);
    const seg = pool.slice(start, end);
    if (seg.length) result.push(seg[Math.floor(Math.random() * seg.length)]);
  }
  return result;
}

// Count syllables heuristic (vowel groups).
function ttCountSyllables(word) {
  const groups = word.toLowerCase().match(/[aeiouy]+/g) || [];
  return groups.length || 1;
}

// Return 'count' randomly chosen prior substeps always starting with the immediate prior.
function ttRandomReviewSubsteps(skillId, count) {
  const idx = scopeMap.findIndex((item) => item.id === skillId);
  if (idx <= 0) return [skillId];
  const pool = scopeMap.slice(Math.max(0, idx - 8), idx).map((s) => s.id);
  if (!pool.length) return [skillId];
  const prior = pool[pool.length - 1];
  const rest = pool.slice(0, -1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [prior, ...rest].slice(0, count);
}

// Add a typed custom word to a picker.
function ttAddCustomWord(inputEl) {
  const word = (inputEl.value || "").trim();
  if (!word) return;
  const picker = inputEl.closest("[data-picker]");
  if (!picker) return;
  const pickerId = picker.dataset.picker;
  const chipRow = picker.querySelector(".planner-chip-row");
  if (!chipRow) return;
  // Don't add duplicates
  if ([...chipRow.querySelectorAll("button")].some((b) => b.dataset.value === word)) {
    inputEl.value = "";
    return;
  }
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "selected picker-custom-chip";
  btn.dataset.value = word;
  btn.textContent = word;
  btn.addEventListener("click", () => ttTogglePlannerChip(btn));
  chipRow.prepend(btn);
  if (!ttPickerSelections[pickerId]) ttPickerSelections[pickerId] = [];
  if (!ttPickerSelections[pickerId].includes(word)) ttPickerSelections[pickerId].push(word);
  inputEl.value = "";
  ttPickerUpdateStatus(picker);
  ttRefreshPreview();
}

// Randomly re-pick words for a single picker without touching any other area.
function ttReshufflePicker(btn) {
  const picker = btn.closest("[data-picker]");
  if (!picker) return;
  const chips = [...picker.querySelectorAll(".planner-chip-row button")];
  if (!chips.length) return;
  const pickerId = picker.dataset.picker;
  const targetCount = Number(picker.dataset.targetCount) || 0;
  chips.forEach((c) => c.classList.remove("selected"));
  ttPickerSelections[pickerId] = [];
  if (targetCount > 0) {
    const pool = chips.map((c) => c.dataset.value);
    const pick = ttSmartPreselect(pool, targetCount);
    ttPickerSelections[pickerId] = pick;
    const pickSet = new Set(pick);
    chips.forEach((c) => { if (pickSet.has(c.dataset.value)) c.classList.add("selected"); });
  }
  ttPickerUpdateStatus(picker);
  ttRefreshPreview();
}

// Ensure picker selection state exists; initialise with smart preselect if brand new
function ttPickerEnsure(pickerId, pool, targetCount) {
  if (!ttPickerSelections[pickerId]) {
    ttPickerSelections[pickerId] = ttSmartPreselect(pool, Number(targetCount) || 0);
  }
}

// Update the "complete" badge and substep bubble highlights for a picker element
function ttPickerUpdateStatus(pickerEl) {
  if (!pickerEl) return;
  const pickerId = pickerEl.dataset.picker;
  const target = Number(pickerEl.dataset.targetCount) || 0;
  const selected = ttPickerSelections[pickerId] || [];
  // Complete indicator
  pickerEl.classList.toggle("picker-complete", target > 0 && selected.length >= target);
  // Substep bubble highlights
  pickerEl.querySelectorAll(".planner-substep-btn").forEach((btn) => {
    const substepId = btn.dataset.value;
    const cacheKey = `${pickerId}::${substepId}`;
    const pool = ttPickerSubstepCache[cacheKey] || [];
    const hasWords = pool.length > 0 && selected.some((w) => pool.includes(w));
    btn.classList.toggle("has-words", hasWords);
  });
}

// Clear all selections in a picker
function ttClearPicker(btn) {
  const picker = btn.closest("[data-picker]");
  if (!picker) return;
  const pickerId = picker.dataset.picker;
  ttPickerSelections[pickerId] = [];
  picker.querySelectorAll(".planner-chip-row button").forEach((c) => c.classList.remove("selected"));
  ttPickerUpdateStatus(picker);
  ttRefreshPreview();
}

// Remove the last selected word in a picker
function ttRemoveLastPick(btn) {
  const picker = btn.closest("[data-picker]");
  if (!picker) return;
  const pickerId = picker.dataset.picker;
  const sel = ttPickerSelections[pickerId] || [];
  if (!sel.length) return;
  const last = sel.pop();
  picker.querySelectorAll(".planner-chip-row button").forEach((c) => {
    if (c.dataset.value === last) c.classList.remove("selected");
  });
  ttPickerUpdateStatus(picker);
  ttRefreshPreview();
}

function ttPlannerPickerHtml(id, title, items, selected, targetCount) {
  const cleanItems = uniqueWords(items || []).filter(Boolean).slice(0, 48);
  const numTarget = Number(targetCount) || 0;
  // Initialise state; if no saved selections yet, use smart preselect
  if (!ttPickerSelections[id]) {
    const seed = (selected && selected.length > 0) ? selected : ttSmartPreselect(cleanItems, numTarget);
    ttPickerSelections[id] = seed;
  }
  const selectedSet = new Set(ttPickerSelections[id]);
  const reshuffleBtn = numTarget > 0
    ? `<button type="button" class="picker-reshuffle-btn" onclick="ttReshufflePicker(this)" title="New random selection">⟳</button>`
    : "";
  const clearBtn = `<button type="button" class="picker-clear-btn" onclick="ttClearPicker(this)" title="Clear all selections">✕</button>`;
  const undoBtn = `<button type="button" class="picker-undo-btn" onclick="ttRemoveLastPick(this)" title="Remove last selection">⌫</button>`;
  const completeBadge = `<span class="picker-done-badge" title="Target met ✓">✓</span>`;
  const customInput = `<div class="picker-custom-row"><input type="text" class="picker-custom-input" placeholder="Type a word…" onkeydown="if(event.key==='Enter'){ttAddCustomWord(this);event.preventDefault();}"><button type="button" class="picker-custom-add" onclick="ttAddCustomWord(this.previousElementSibling)">+</button></div>`;
  return `<article class="planner-picker${selectedSet.size >= numTarget && numTarget > 0 ? " picker-complete" : ""}" data-picker="${escapeHtml(id)}" data-target-count="${targetCount}">
    <header>
      <strong>${escapeHtml(title)}</strong>
      <span class="picker-target-pill">${targetCount} target</span>
      ${completeBadge}
      ${reshuffleBtn}${clearBtn}${undoBtn}
    </header>
    <div class="planner-chip-row">
      ${cleanItems.map((item) => `<button type="button" class="${selectedSet.has(String(item)) ? "selected" : ""}" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
    </div>
    ${customInput}
  </article>`;
}

function ttPlannerPhrasePickerHtml(rows, selected, targetCount) {
  // Seed ttPickerSelections on first render
  const pickId = "dictationPhrases";
  if (!ttPickerSelections[pickId]) {
    ttPickerSelections[pickId] = (selected || []).slice(0, 3);
  }
  const selectedSet = new Set(ttPickerSelections[pickId]);
  const numTarget = Number(targetCount) || 3;
  const clearBtn = `<button type="button" class="picker-clear-btn" onclick="ttClearPicker(this)" title="Clear all">✕</button>`;
  const undoBtn = `<button type="button" class="picker-undo-btn" onclick="ttRemoveLastPick(this)" title="Remove last">⌫</button>`;
  const completeBadge = `<span class="picker-done-badge" title="Target met ✓">✓</span>`;
  const content = (rows || []).map((row) => {
    const hfw = row.hfw || row.word || "HFW";
    const phrases = row.phrases || [];
    return `<section class="planner-phrase-group">
      <h4>${escapeHtml(hfw)}</h4>
      <div class="planner-chip-row">
        ${phrases.map((phrase) => `<button type="button" class="${selectedSet.has(String(phrase)) ? "selected" : ""}" data-value="${escapeHtml(phrase)}">${escapeHtml(phrase)}</button>`).join("")}
      </div>
    </section>`;
  }).join("");
  return `<article class="planner-picker planner-phrases${selectedSet.size >= numTarget ? " picker-complete" : ""}" data-picker="${pickId}" data-target-count="${numTarget}">
    <header>
      <strong>Dictation phrases</strong>
      <span class="picker-target-pill">${numTarget} target · FIFO</span>
      ${completeBadge}${clearBtn}${undoBtn}
    </header>
    ${content || "<p class=\"planner-empty\">No phrase groups indexed for this substep.</p>"}
  </article>`;
}

function ttBindPlannerChips() {
  ttById("ttPlannerSections")?.querySelectorAll(".planner-chip-row button").forEach((button) => {
    button.addEventListener("click", () => ttTogglePlannerChip(button));
  });
  ttById("ttPlannerSections")?.querySelectorAll(".planner-substep-btn").forEach((button) => {
    button.addEventListener("click", () => ttTogglePlannerChip(button));
  });
}

function ttTogglePlannerChip(button) {
  const picker = button.closest("[data-picker]");
  const pickerId = picker?.dataset.picker || "";
  const willSelect = !button.classList.contains("selected");
  if (button.classList.contains("planner-substep-btn")) {
    const sectionKey = button.dataset.substepSection;
    const substepRow = button.closest(".planner-substep-row");
    substepRow.querySelectorAll(".planner-substep-btn").forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");
    ttSectionReviewSubsteps[sectionKey] = [button.dataset.value];
    ttUpdateSectionReviewChips(sectionKey);
    // Update lesson preview so newly-shown words feed through
    ttRefreshPreview();
    return;
  }
  // Phrases: FIFO max 3 — deselect oldest when adding a 4th
  if (willSelect && pickerId === "dictationPhrases") {
    const phraseChips = [...picker.querySelectorAll(".planner-chip-row button.selected")];
    if (phraseChips.length >= 3) {
      const oldest = phraseChips[0];
      oldest.classList.remove("selected");
      ttPickerSelections[pickerId] = (ttPickerSelections[pickerId] || []).filter((w) => w !== oldest.dataset.value);
    }
  }
  // Sentences: combined FIFO max 3 across both sentence pickers
  if (willSelect && (pickerId === "dictationSentences" || pickerId === "readerSentences")) {
    const totalCount = ttPlannerSelectedSentenceCount();
    if (totalCount >= 3) {
      // Find and deselect the oldest selected sentence across BOTH pickers
      const allSentencePickers = ["dictationSentences", "readerSentences"];
      for (const pid of allSentencePickers) {
        const pEl = ttById("ttPlannerSections")?.querySelector(`[data-picker="${pid}"]`);
        const firstSelected = pEl?.querySelector(".planner-chip-row button.selected");
        if (firstSelected) {
          firstSelected.classList.remove("selected");
          ttPickerSelections[pid] = (ttPickerSelections[pid] || []).filter((w) => w !== firstSelected.dataset.value);
          break;
        }
      }
    }
  }
  button.classList.toggle("selected");
  // Keep ttPickerSelections in sync
  if (!ttPickerSelections[pickerId]) ttPickerSelections[pickerId] = [];
  if (button.classList.contains("selected")) {
    if (!ttPickerSelections[pickerId].includes(button.dataset.value)) {
      ttPickerSelections[pickerId].push(button.dataset.value);
    }
  } else {
    ttPickerSelections[pickerId] = ttPickerSelections[pickerId].filter((w) => w !== button.dataset.value);
  }
  ttPickerUpdateStatus(picker);
  ttRefreshPreview();
}

function ttUpdateSectionReviewChips(sectionKey) {
  const group = ttPlannerGroup();
  const skill = scopeMap.find((item) => item.id === (ttPlannerDraft.substep || group.substep)) || activeStep(group);
  const level = ttPlannerDraft.level || group.readerLevel || "AB";
  const currentSubstep = (ttSectionReviewSubsteps[sectionKey] || [priorSubstep(skill.id)])[0];

  const pickerIdMap = { section2: "section2Review", section3: "section3Review", section7: "section7Review", section8Real: "dictationReal" };
  const pickerId = pickerIdMap[sectionKey];
  if (!pickerId) return;

  const picker = ttById("ttPlannerSections")?.querySelector(`[data-picker="${pickerId}"]`);
  if (!picker) return;

  const isNView = currentSubstep === "N";
  const nsWordsSet = new Set(readerNonsenseWordsFromSubstep(currentSubstep));

  // Build pool for new substep
  const newPool = isNView
    ? ttReviewNonsensePool(skill.id)
    : uniqueWords(
        readerWordsFromSubstep(currentSubstep, level).concat(dictationWordsFor(currentSubstep, level))
      ).filter(isValidDictationWord);

  // Cache it
  ttPickerSubstepCache[`${pickerId}::${currentSubstep}`] = newPool;

  const currentSels = ttPickerSelections[pickerId] || [];
  const selectedSet = new Set(currentSels);
  // Cross-substep count badge update
  const crossCount = currentSels.filter((w) => !newPool.includes(w)).length;
  const crossBadge = picker.querySelector(".picker-cross-badge");
  if (crossBadge) {
    crossBadge.textContent = crossCount > 0 ? `+${crossCount} other` : "";
    crossBadge.hidden = crossCount === 0;
  }

  // Update chip row — only current substep words
  const chipRow = picker.querySelector(".planner-chip-row");
  if (!chipRow) return;
  chipRow.innerHTML = newPool.map((item) => {
    const isNs = isNView || nsWordsSet.has(item);
    return `<button type="button" class="${selectedSet.has(item) ? "selected" : ""}${isNs ? " chip-nonsense" : ""}" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
  }).join("");
  chipRow.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => ttTogglePlannerChip(btn)));

  ttPickerUpdateStatus(picker);
}

function ttToggleSection6All(button) {
  const row = button.closest(".planner-section-row");
  if (!row) return;
  const chips = [...row.querySelectorAll(".planner-chip-row button")];
  const allSelected = chips.every((chip) => chip.classList.contains("selected"));
  chips.forEach((chip) => chip.classList.toggle("selected", !allSelected));
  button.textContent = allSelected ? "Select all" : "Deselect all";
  // Sync ttPickerSelections and update complete badges for each picker in the row
  row.querySelectorAll("[data-picker]").forEach((picker) => {
    const pickerId = picker.dataset.picker;
    if (!pickerId) return;
    const pickerChips = [...picker.querySelectorAll(".planner-chip-row button")];
    if (allSelected) {
      ttPickerSelections[pickerId] = [];
    } else {
      ttPickerSelections[pickerId] = pickerChips.map((c) => c.dataset.value).filter(Boolean);
    }
    ttPickerUpdateStatus(picker);
  });
  ttRefreshPreview();
}

function ttPlannerSelectedSentenceCount() {
  return ttPlannerSelected("dictationSentences").length + ttPlannerSelected("readerSentences").length;
}

function ttPlannerSelected(id) {
  // ttPickerSelections is the source of truth — it tracks selections across substeps including pinned rows.
  // Fall back to DOM scan for any picker not yet initialised in state.
  if (ttPickerSelections[id] !== undefined) {
    return (ttPickerSelections[id] || []).filter(Boolean);
  }
  return [...ttById("ttPlannerSections")?.querySelectorAll(`[data-picker="${id}"] .planner-chip-row button.selected`) || []]
    .map((button) => button.dataset.value)
    .filter(Boolean);
}

function ttUsePlannerDefaults() {
  const group = ttPlannerGroup();
  if (!group) return;
  const lessonType = ttNormalizeLessonType(ttPlannerDraft.lessonType || ttPreferredLessonType(group));
  ttPlannerDraft = {};
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttSection8RealSlots = [];
  ttSectionReviewSubsteps = {};
  ttAssistantNotice = "Generated the best lesson from current group data.";
  ttEnsurePlannerDraft(group);
  ttPlannerDraft.lessonType = lessonType;
  group.preferredLessonType = lessonType;
  saveState();
  ttRenderPlannerPanel();
  ttRenderHomeModePicker(true);
}

function ttBuildPlannerLesson(options = {}) {
  const group = ttPlannerGroup();
  if (!group) return;
  const draft = ttEnsurePlannerDraft(group);
  group.preferredLessonType = ttNormalizeLessonType(draft.lessonType || ttPreferredLessonType(group));
  appState.selectedGroupId = group.id;
  group.substep = draft.substep || group.substep;
  group.readerLevel = draft.level || group.readerLevel || "AB";
  const skill = scopeMap.find((item) => item.id === group.substep) || activeStep(group);
  const level = group.readerLevel || "AB";
  const wordPages = pageList(skill, "wordlist", level);
  const sentencePages = pageList(skill, "sentences", level);
  const selectedWordPage = Number(draft.wordlist || 0);
  const selectedSentencePage = Number(draft.sentence || 0);
  group.pageProgress ||= { wordlist: 0, sentences: 0, passage: 0 };
  group.pageProgress.wordlist = Math.max(0, wordPages.indexOf(selectedWordPage));
  group.pageProgress.sentences = Math.max(0, sentencePages.indexOf(selectedSentencePage));
  ttSaveSection9StoryForGroup(group, draft.passageId, draft.passageApproach);
  ttLesson = createLesson(group, skill, 0, 1);
  ttLesson.scheduledDate = draft.scheduledDate || ttTodayKey();
  ttApplySection9StoryToLesson(ttLesson, group, skill, {
    passageId: draft.passageId,
    approach: draft.passageApproach
  });
  ttApplyPlannerSelectionsToLesson(group, skill);
  ttSaveDraftLesson({ status: false });
  saveState();
  const lessonTypeForPicker = (ttLesson?.lessonType === "part1" || ttLesson?.lessonType === "part2") ? "group" : (ttLesson?.lessonType || "full");
  if (lessonTypeForPicker === "group") {
    ttShowGroupDayPicker(group, (choice) => {
      const day = typeof choice === "object" ? choice.day : choice;
      const scheduledDate = typeof choice === "object" ? choice.date : ttLesson.scheduledDate;
      if (day) {
        ttLesson.activeGroupDay = day;
        ttLesson.scheduledDate = scheduledDate || ttLesson.scheduledDate || ttTodayKey();
        ttSetGroupDay(day);
      }
      if (options.startTeaching) ttStartCurrentLesson();
      else ttOpenTeachFlow(options.openOptions || {});
    });
  } else {
    if (options.startTeaching) ttStartCurrentLesson();
    else ttOpenTeachFlow(options.openOptions || {});
  }
}

function ttOpenPlannerPreviewSection(sectionNumber) {
  ttBuildPlannerLesson({ openOptions: { targetId: `section${sectionNumber}` } });
}

function ttApplyPlannerSelectionsToLesson(group, skill) {
  if (!ttLesson) return;
  const draft = ttEnsurePlannerDraft(group);
  const sentencePage = Number(draft.sentence || 0);
  if (sentencePage) {
    const pages = pageList(skill, "sentences", ttLesson.readerLevel || group.readerLevel || "AB");
    const assignment = {
      reader: skill.reader,
      page: sentencePage,
      level: resolvedLevel(skill, "sentences", ttLesson.readerLevel || group.readerLevel || "AB"),
      index: Math.max(0, pages.indexOf(sentencePage)) + 1,
      total: pages.length
    };
    const data = sentenceDataForPage(skill, assignment);
    ttLesson.sentencePageNumber = sentencePage;
    ttLesson.sentenceLevel = assignment.level;
    ttLesson.sentenceMeta = `Reader ${skill.reader}, p. ${sentencePage} - ${pagePositionLabel(assignment, "sentence")}`;
    ttLesson.highFrequencyWords = data.highFrequency;
    ttLesson.readerSentences = data.sentences;
  }
  // Store lesson type + flash sections in the lesson object
  ttLesson.lessonType = draft.lessonType || "full";
  if (draft.lessonType === "flash") {
    ttLesson.flashSections = (draft.flashSections || []).slice();
  }
  ttSaveSection9StoryForGroup(group, draft.passageId, draft.passageApproach);
  ttApplySection9StoryToLesson(ttLesson, group, skill, {
    passageId: draft.passageId,
    approach: draft.passageApproach
  });

  const selected = {
    sectionTwoCurrentWords: ttPlannerSelected("section2Current"),
    sectionTwoReviewWords: ttPlannerSelected("section2Review"),
    sectionTwoCurrentWordsB2: ttPlannerSelected("section2CurrentB2"),
    sectionTwoReviewWordsB2: ttPlannerSelected("section2ReviewB2"),
    sectionThreeCurrentWords: ttPlannerSelected("section3Current"),
    sectionThreeReviewWords: ttPlannerSelected("section3Review"),
    sectionSevenReviewWords: ttPlannerSelected("section7Review"),
    sectionSevenCurrentWords: ttPlannerSelected("section7Current"),
    sectionSevenNonsenseWords: ttPlannerSelected("section7Nonsense")
  };
  Object.entries(selected).forEach(([key, values]) => {
    if (values.length) ttLesson[key] = values;
  });
  const readerDictationSentences = ttPlannerSelected("readerSentences");
  const dictationSentences = ttPlannerSelected("dictationSentences").concat(readerDictationSentences).slice(0, 3);
  ttLesson.dictationPlanOverride = [
    { label: "5 sounds", values: ttPlannerSelected("dictationSounds") },
    { label: "5 word elements", values: ttPlannerSelected("dictationElements") },
    { label: "5 real words", values: (ttSection8RealWords().length ? ttSection8RealWords() : ttPlannerSelected("dictationReal")) },
    { label: "3 nonsense words", values: ttPlannerSelected("dictationNonsense") },
    { label: "3 phrases", values: ttPlannerSelected("dictationPhrases") },
    { label: "2 sentences", values: dictationSentences }
  ].map((block) => ({ ...block, values: block.values.filter(Boolean) }));
  ttLesson.reverseDrillOverride = ttPlannerSelected("dictationSounds")
    .concat(ttPlannerSelected("section6Vowels"))
    .concat(ttPlannerSelected("section6Consonants"))
    .concat(ttPlannerSelected("section6Welded"))
    .concat(ttPlannerSelected("section6Elements"))
    .concat(ttPlannerSelected("dictationElements"))
    .slice(0, 20)
    .map((value) => ({ value, category: "Planner", group: "Planned quick drill" }));
}

function ttKnownWeldedValues(substep) {
  return knownWeldedAndExceptions
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value);
}

function ttTrueNonsensePool(substep) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const words = [];
  for (let index = Math.max(0, currentIndex); index >= 0; index -= 1) {
    words.push(...readerNonsenseWordsFromSubstep(scopeMap[index].id));
  }
  words.push(...readerNonsenseWordsForReview(priorSubstep(substep), substep));
  return uniqueWords(words).filter(isValidDictationWord);
}

function ttPlannerDraftLessonWithSelections(group = ttPlannerGroup()) {
  const skill = scopeMap.find((item) => item.id === (ttPlannerDraft.substep || group.substep)) || activeStep(group);
  const lesson = ttPlannerPreviewLesson(group);
  const originalLesson = ttLesson;
  ttLesson = lesson;
  ttApplyPlannerSelectionsToLesson(group, skill);
  ttEnsureSection2MissIndexes(ttLesson, group, skill);
  const planned = ttClone(ttLesson);
  ttLesson = originalLesson;
  return { lesson: planned, skill };
}

// Shorthand — always call this whenever selections change so the preview stays live.
function ttRefreshPreview() {
  const g = ttPlannerGroup();
  if (!g) return;
  const draft = ttPlannerDraft;
  const sk = scopeMap.find((s) => s.id === (draft.substep || g.substep)) || activeStep(g);
  const lesson = ttPlannerPreviewLesson(g);
  ttRenderPlannerPreview(g, sk, lesson);
  ttRenderLessonAssistant(g, sk, lesson);
  ttRenderPlannerCustomizeState();
}

function ttRenderPlannerPreview(group = ttPlannerGroup(), skill = null, lesson = null) {
  const preview = ttById("ttPlannerPreview");
  if (!preview || !group) return;
  const originalSelectedGroupId = appState.selectedGroupId;
  appState.selectedGroupId = group.id;
  const planned = ttPlannerDraftLessonWithSelections(group);
  const activeSkill = skill || planned.skill;
  const activeLesson = planned.lesson;
  const dictation = ttActiveDictationPlan(activeLesson, activeSkill);
  const block = (label) => dictation.find((item) => item.label.toLowerCase().includes(label))?.values || [];
  const sectionSeven = ttSectionSevenSetsForLesson(activeLesson, activeSkill);
  // Capture words already in the preview before re-render (to detect new additions)
  const prevWordSet = new Set([...preview.querySelectorAll("[data-pw]")].map((s) => s.dataset.pw));

  const lessonTypeLabel = {
    full:   "Full Lesson · 60 min",
    full45: "Quick 1:1 · 45 min",
    group:  "Group Lesson · 45+45 min",
    part1:  "Group Lesson · 45+45 min",
    part2:  "Group Lesson · 45+45 min",
    flash:  "Flash Lesson · custom"
  };
  const rawLessonType = ttPlannerDraft.lessonType || "full";
  const currentLessonType = (rawLessonType === "part1" || rawLessonType === "part2") ? "group" : rawLessonType;
  const isGroup = currentLessonType === "group";
  const isFlash = currentLessonType === "flash";
  const flashSet = isFlash ? new Set(ttPlannerDraft.flashSections || []) : null;

  // Day 1 words always come from the standard §2 fields
  const sec2ReviewWords = activeLesson.sectionTwoReviewWords || [];
  const sec2CurrentWords = activeLesson.sectionTwoCurrentWords || [];
  // Day 2 words from §2b fields (only shown in group mode)
  const sec2bReviewWords = activeLesson.sectionTwoReviewWordsB2 || ttPlannerSelected("section2ReviewB2") || [];
  const sec2bCurrentWords = activeLesson.sectionTwoCurrentWordsB2 || ttPlannerSelected("section2CurrentB2") || [];

  preview.innerHTML = `
    <div class="planner-preview-paper">
      <header>
        <span>${escapeHtml(lessonTypeLabel[currentLessonType] || "Lesson Preview")}</span>
        <strong>${escapeHtml(group.name)} · ${escapeHtml(activeLesson.substep)}</strong>
        <em>Reader ${escapeHtml(activeLesson.reader)}, wordlist p. ${escapeHtml(activeLesson.wordlistPageNumber || "--")} · sentences p. ${escapeHtml(activeLesson.sentencePageNumber || "--")}</em>
        <button class="preview-open-btn" type="button">Start teaching</button>
      </header>
      ${ttPlannerPreviewBlock("2", "Teach & Review", [
        ["Review", sec2ReviewWords],
        ["Current", sec2CurrentWords],
        ["Last Misses", activeLesson.sectionTwoLastMissedWords || []],
        ["Priority", activeLesson.sectionTwoPriorityMissedWords || []]
      ], prevWordSet)}
      ${(!isFlash || flashSet.has("3")) ? ttPlannerPreviewBlock("3", "Word Cards", [
        ["Review", activeLesson.sectionThreeReviewWords || section3ReviewCards(activeLesson)],
        ["Current", activeLesson.sectionThreeCurrentWords || section3CurrentCards(activeLesson)]
      ], prevWordSet) : ""}
      ${isGroup ? ttPlannerPreviewBlock("2B", "Concepts · Day 2", [
        ["Review", sec2bReviewWords],
        ["Current", sec2bCurrentWords]
      ], prevWordSet) : ""}
      ${(!isFlash || flashSet.has("6")) ? ttPlannerPreviewBlock("6", "Quick Drill", [
        ["Targets", (activeLesson.reverseDrillOverride || []).map((item) => item.value).slice(0, 20)]
      ], prevWordSet) : ""}
      ${(!isFlash || flashSet.has("7")) ? ttPlannerPreviewBlock("7", "Spelling", [
        ["Review", sectionSeven.review || []],
        ["Nonsense", sectionSeven.nonsense || []],
        ["Current", sectionSeven.current || []]
      ], prevWordSet) : ""}
      ${(!isFlash || flashSet.has("8")) ? ttPlannerPreviewBlock("8", "Dictation", [
        ["Sounds", block("sounds")],
        ["Elements", block("word elements")],
        ["Real", block("real words")],
        ["Nonsense", block("nonsense")],
        ["Phrases", block("phrases")],
        ["Sentences", block("sentences")]
      ], prevWordSet) : ""}
      ${(!isFlash || flashSet.has("9") || flashSet.has("10")) ? `<section class="preview-block-empty">
        <h3><span>9</span>Controlled Passage</h3>
        <p><b>Story:</b> ${escapeHtml(activeLesson.section9Story?.title || "Select a story")}</p>
        <p><b>Approach:</b> ${escapeHtml(ttSection9ApproachLabel(activeLesson.section9Story?.approach))}</p>
      </section>` : ""}
    </div>`;
  ttBindPlannerPreviewActions(preview);
  appState.selectedGroupId = originalSelectedGroupId;
}

function ttBindPlannerPreviewActions(preview) {
  preview.querySelector(".preview-open-btn")?.addEventListener("click", () => ttBuildPlannerLesson());
  preview.querySelectorAll(".preview-jump-section").forEach((section) => {
    section.addEventListener("dblclick", () => ttOpenPlannerPreviewSection(section.dataset.jumpSection));
  });
}

function ttPlannerPreviewBlock(number, title, rows, prevWords = new Set()) {
  const nonEmptyRows = rows.filter(([, v]) => (v || []).length > 0);
  const allFilled = nonEmptyRows.length === rows.length;
  const anyFilled = nonEmptyRows.length > 0;
  const statusClass = allFilled ? "preview-block-complete" : anyFilled ? "preview-block-partial" : "preview-block-empty";
  const rowsHtml = rows.map(([label, values]) => {
    const words = values || [];
    if (!words.length) return `<p><b>${escapeHtml(label)}:</b> <span class="preview-empty">—</span></p>`;
    const wordSpans = words.map((w) => {
      const key = String(w);
      const isNew = !prevWords.has(key);
      return `<span class="pw${isNew ? " pw-new" : ""}" data-pw="${escapeHtml(key)}">${escapeHtml(key)}</span>`;
    }).join(", ");
    return `<p><b>${escapeHtml(label)}:</b> ${wordSpans}</p>`;
  }).join("");
  return `<section class="${statusClass} preview-jump-section" data-jump-section="${escapeHtml(number)}" title="Double-click to open Section ${escapeHtml(number)}">
    <h3><span>${number}</span>${escapeHtml(title)}${allFilled ? ' <span class="preview-check">✓</span>' : ""}</h3>
    ${rowsHtml}
  </section>`;
}

function ttTodaysLessonData(group = ttActiveGroup(), lesson = ttLesson) {
  const today = dateKey(new Date());
  const planId = lesson?.savedPlanId || "";
  const lessonId = lesson?.id || "";
  const isToday = (value) => dateKey(value || new Date()) === today;
  const groupChart = (appState.masterRecords || []).filter((record) => {
    const sameGroup = record.groupId === group.id || record.group === group.name;
    const sameLesson = planId ? record.planId === planId : lessonId ? record.lessonId === lessonId : false;
    return sameGroup && (sameLesson || isToday(record.date || record.displayDate));
  });
  const groupDictation = (group.dictationMisses || []).filter((record) => {
    const sameLesson = planId ? record.planId === planId : lessonId ? record.lessonId === lessonId : false;
    return sameLesson || isToday(record.date);
  });
  const groupEncoding = (group.encodingObservations || []).filter((record) => {
    const sameLesson = planId ? record.planId === planId : lessonId ? record.lessonId === lessonId : false;
    return sameLesson || isToday(record.date);
  });
  return { chart: groupChart, dictation: groupDictation, encoding: groupEncoding };
}

function ttRenderWrapUpPanel(group = ttActiveGroup(), lesson = ttLesson) {
  const summary = ttById("ttWrapUpSummary");
  if (!summary) return;
  const plan = ttCurrentPlan();
  const data = ttTodaysLessonData(group, lesson);
  const attendance = ttTodaysAttendance(group);
  const presentStudents = (group.students || []).filter((student) => attendance[student] !== false);
  const absentStudents = (group.students || []).filter((student) => attendance[student] === false);
  const chartCount = data.chart.length;
  const dictationCount = data.dictation.length;
  const encodingCount = data.encoding.length;
  const completeLabel = plan?.wrapUp?.completedAt ? `Completed ${formatDateTime(new Date(plan.wrapUp.completedAt))}` : "Ready to complete";

  summary.innerHTML = `
    <article><strong>${escapeHtml(group.name || "Group")}</strong><span>${escapeHtml(lesson?.substep || group.substep || "--")} / Reader ${escapeHtml(lesson?.reader || "")}</span></article>
    <article><strong>${presentStudents.length}/${(group.students || []).length}</strong><span>Present</span></article>
    <article><strong>${chartCount}</strong><span>Chart record${chartCount === 1 ? "" : "s"}</span></article>
    <article><strong>${dictationCount + encodingCount}</strong><span>Miss / encoding mark${dictationCount + encodingCount === 1 ? "" : "s"}</span></article>
    <article><strong>${escapeHtml(completeLabel)}</strong><span>Lesson status</span></article>
  `;

  const attendancePanel = ttById("ttWrapAttendance");
  if (attendancePanel) {
    attendancePanel.innerHTML = (group.students || []).map((student) => {
      const present = attendance[student] !== false;
      return `<button type="button" class="attendance-chip ${present ? "present" : ""}" data-student="${escapeHtml(student)}">${present ? "Present" : "Absent"} - ${escapeHtml(student)}</button>`;
    }).join("");
    attendancePanel.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const student = button.dataset.student;
        attendance[student] = attendance[student] === false;
        saveState();
        ttRenderAttendancePanel(group);
        ttRenderWrapUpPanel(group, lesson);
      });
    });
  }

  const studentData = ttById("ttWrapStudentData");
  if (studentData) {
    const rows = (group.students || []).map((student) => {
      const chart = data.chart.filter((record) => record.student === student);
      const dictation = data.dictation.filter((record) => record.student === student);
      const encoding = data.encoding.filter((record) => record.student === student);
      const lastChart = chart.at(-1);
      const badge = lastChart
        ? `${lastChart.correct ?? "--"}/${lastChart.total || 15}${lastChart.seconds ? `, ${lastChart.seconds}s` : ""}`
        : "No chart";
      return `<div class="wrap-student-row">
        <strong>${escapeHtml(student)}</strong>
        <span>${escapeHtml(badge)}</span>
        <em>${dictation.length + encoding.length} mark${dictation.length + encoding.length === 1 ? "" : "s"}</em>
      </div>`;
    }).join("");
    studentData.innerHTML = rows || "<p class=\"snapshot-empty\">No students in this group yet.</p>";
  }

  const note = ttById("ttWrapNote");
  if (note && document.activeElement !== note) {
    note.value = plan?.wrapUp?.note || group.note || "";
  }
  const recommendation = ttById("ttWrapRecommendation");
  if (recommendation) {
    recommendation.innerHTML = ttWrapRecommendationHtml(data, presentStudents, absentStudents);
  }
}

function ttWrapRecommendationHtml(data, presentStudents, absentStudents) {
  const chart = data.chart.slice().sort((a, b) => new Date(b.date || b.displayDate || 0) - new Date(a.date || a.displayDate || 0));
  const latest = chart[0];
  const misses = data.dictation.concat(data.encoding)
    .map((record) => record.item || record.note || record.category)
    .filter(Boolean);
  const missSummary = uniqueWords(misses).slice(0, 6).join(", ");
  let recommendation = "Save at least one charting record or miss mark to generate a stronger next step.";
  if (latest) recommendation = latest.recommendation || ttChartNextStep(latest.correct || 0, latest.seconds || 0);
  if (chart.length >= 2 && chart.some((record) => record.correct < 12)) {
    recommendation = "Repeat or warm up the current charting page before advancing.";
  }
  const parts = [
    `<strong>${escapeHtml(recommendation)}</strong>`,
    missSummary ? `<span>Review next: ${escapeHtml(missSummary)}</span>` : "",
    absentStudents.length ? `<span>Absent today: ${escapeHtml(absentStudents.join(", "))}</span>` : "",
    presentStudents.length ? `<span>Ready to save for ${presentStudents.length} present student${presentStudents.length === 1 ? "" : "s"}.</span>` : "<span>No present students marked yet.</span>"
  ].filter(Boolean);
  return parts.join("");
}

function ttChartNextStep(correct, seconds) {
  if (correct < 12) return "Repeat same page next lesson";
  if (seconds && seconds <= 35 && correct >= 12) return "Advance page; automaticity met";
  if (correct >= 14) return "Advance page; keep brief fluency warm-up";
  return "Advance carefully; repeat as warm-up";
}

function ttCompleteLessonWrapUp(options = {}) {
  const group = ttActiveGroup();
  if (!ttLesson) ttBuildLesson();
  ttSaveCurrentLesson({ render: false });
  const plan = ttCurrentPlan();
  if (!plan) return;
  const data = ttTodaysLessonData(group, ttLesson);
  const note = ttById("ttWrapNote")?.value.trim() || "";
  group.note = note;
  plan.wrapUp = {
    completedAt: new Date().toISOString(),
    note,
    attendance: ttClone(ttTodaysAttendance(group)),
    chartRecordCount: data.chart.length,
    dictationMissCount: data.dictation.length,
    encodingMarkCount: data.encoding.length,
    recommendation: ttById("ttWrapRecommendation")?.textContent.trim() || ""
  };
  plan.status = "Complete";
  plan.completedAt = new Date().toISOString();
  plan.completionKind = plan.completionKind || (["group", "part1", "part2"].includes(ttLesson.lessonType) && ttPlanSessionDay(plan, ttLesson) === "1" ? "after-day-1" : "full");
  const completedDay = ttPlanSessionDay(plan, ttLesson);
  ttEnsureLessonWorkflow(plan, ttLesson, group);
  plan.sessions[completedDay].status = "Complete";
  group.activeLessonPlanId = "";
  plan.hasStudentData = Boolean(plan.hasStudentData || data.chart.length || data.dictation.length || data.encoding.length);
  plan.lastStudentDataAt = new Date().toISOString();
  saveState();
  ttUpdateSaveStatus(plan);
  ttRenderSavedLessons(group);
  ttRenderWrapUpPanel(group, ttLesson);
  if (options.scroll !== false) ttById("ttWrapUpPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttSaveWrapUpNoteDraft() {
  const group = ttActiveGroup();
  const note = ttById("ttWrapNote")?.value.trim() || "";
  group.note = note;
  const plan = ttCurrentPlan();
  if (plan?.wrapUp) plan.wrapUp.note = note;
  saveState();
}

function ttSnapshotStudentCard(summary) {
  const chart = summary.chart.slice(-2).map((record) => {
    const status = record.automaticity ? "Auto" : record.accuracy ? "Acc" : "Strug";
    const misses = ttChartMissSummary(record);
    return `<p><strong>${escapeHtml(record.correct ?? "--")}/${escapeHtml(record.total || 15)} ${status}</strong> <span>${escapeHtml(record.seconds || "--")} sec, ${escapeHtml(record.wcpm || wcpmForRecord(record) || "--")} wcpm, p.${escapeHtml(record.wordlistPage || "--")}</span>${misses}</p>`;
  }).join("");
  const dictation = ttDictationSummary(summary.dictation);
  return `<article class="snapshot-student">
    <h3>${escapeHtml(summary.student)}</h3>
    ${chart || "<p><span>No charting saved.</span></p>"}
    ${dictation ? `<div class="snapshot-dictation"><b>Dictation:</b> ${dictation}</div>` : "<div class=\"snapshot-dictation muted\"><b>Dictation:</b> no Section 8 marks.</div>"}
  </article>`;
}

function ttChartMissSummary(record) {
  const half = record.chartHalf || "";
  const misses = (record.wordRecords || [])
    .filter((item) => item.section === half && item.correct === false)
    .map((item) => item.said ? `${item.word} -> ${item.said}` : item.word)
    .filter(Boolean);
  const fallback = (record.wrongWords || []).filter(Boolean);
  const items = misses.length ? misses : fallback;
  return items.length ? `<em>Missed: ${escapeHtml(items.slice(0, 4).join(", "))}${items.length > 4 ? "..." : ""}</em>` : "";
}

function ttDictationSummary(records) {
  const seen = new Set();
  const items = [];
  records.forEach((record) => {
    const label = [record.category, record.item || record.note].filter(Boolean).join(": ");
    if (!label || seen.has(label)) return;
    seen.add(label);
    items.push(label);
  });
  return items.slice(0, 5).map(escapeHtml).join(", ");
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatSnapshotDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ttFillOverview(group, skill) {
  const level = group.readerLevel || "AB";
  const wordlist = pageAssignment(group, skill, "wordlist", 0, level);
  const sentence = pageAssignment(group, skill, "sentences", 0, level);
  const story = ttEnsureSection9Story(group, skill)?.passage;
  ttFillWordlistPageSelect(group, skill, level, wordlist);
  ttById("ttWordlistPage").textContent = `${formatPage(wordlist)} - ${pagePositionLabel(wordlist, "wordlist")}`;
  ttById("ttSentencePage").textContent = sentence.page ? `${formatPage(sentence)} - ${pagePositionLabel(sentence, "sentence")}` : "No sentence page listed";
  ttById("ttPassagePage").textContent = story ? ttPassageLabel(story) : "No passage story selected";
}

function ttFillWordlistPageSelect(group, skill, level, assignment) {
  const select = ttById("ttWordlistPageSelect");
  if (!select) return;
  const pages = pageList(skill, "wordlist", level);
  const resolved = resolvedLevel(skill, "wordlist", level);
  select.innerHTML = "";
  if (!pages.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No pages";
    select.appendChild(option);
    select.disabled = true;
    return;
  }
  pages.forEach((page, index) => {
    const option = document.createElement("option");
    const count = chartingPageEntry(skill.id, resolved, page).count;
    option.value = String(index);
    option.textContent = `p. ${page} (${index + 1}/${pages.length}${count ? `, ${count}w` : ""})`;
    select.appendChild(option);
  });
  select.disabled = false;
  select.value = String(Math.max(0, (assignment.index || 1) - 1));
}

function ttSetWordlistPageIndex(pageIndex) {
  const group = ttActiveGroup();
  const skill = activeStep(group);
  const level = group.readerLevel || "AB";
  const pages = pageList(skill, "wordlist", level);
  const index = Math.max(0, Math.min(Number(pageIndex) || 0, pages.length - 1));
  group.pageProgress ||= { wordlist: 0, sentences: 0, passage: 0 };
  group.pageProgress.wordlist = index;
  saveState();
  ttLesson = ttBuildLesson();
  ttRerollEncodingSectionsForSelectedPage(skill);
  ttSaveDraftLesson({ status: false });
  history.replaceState(null, "", location.pathname);
  ttSection2Word = "";
  ttRender();
}

function ttRerollEncodingSectionsForSelectedPage(skill = null) {
  if (!ttLesson) return;
  const activeSkill = skill || scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const seed = Date.now() + Math.floor(Math.random() * 1000);
  ttLesson.reverseDrillSeed = seed;
  ttLesson.reverseDrillOverride = ttBuildReverseDrillOverride(activeSkill, ttLesson);
  const sectionSeven = ttBuildSectionSevenWordSets(ttLesson, activeSkill);
  ttLesson.sectionSevenReviewWords = sectionSeven.review;
  ttLesson.sectionSevenNonsenseWords = sectionSeven.nonsense;
  ttLesson.sectionSevenCurrentWords = sectionSeven.current;
  ttLesson.dictationPlanOverride = ttRerollDictationPlan(ttLesson, activeSkill, {
    avoidWordKeys: ttSectionSevenWordKeys(ttLesson)
  });
}

function ttRerollEncodingSectionsAction() {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  ttRerollEncodingSectionsForSelectedPage();
  ttSaveDraftLesson();
  ttRender();
  ttById("section6")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttFillSounds(skill, lesson) {
  const photo = ttSection1PhotoForSubstep(skill.id);
  const smallCardHtml = ttSection1SmallCardView(skill, lesson);
  const soundsHtml = `
    <div class="section1-view-actions" role="toolbar" aria-label="Section 1 view controls">
      <button type="button" class="${ttSection1View === "photo" ? "active" : ""}" data-section1-view="photo">Photo View</button>
      <button type="button" class="${ttSection1View === "cards" ? "active" : ""}" data-section1-view="cards">Small Card View</button>
      <span></span>
      <button type="button" class="${ttSection1PhotoMode === "full" ? "active" : ""}" data-section1-photo-mode="full">Full View</button>
      <button type="button" class="${ttSection1PhotoMode === "zoom" ? "active" : ""}" data-section1-photo-mode="zoom">Zoom View</button>
    </div>
    <section class="section1-photo-view ${ttSection1View === "photo" ? "active" : ""}" aria-label="Section 1 sound poster">
      <header class="section1-photo-head">
        <strong>${escapeHtml(photo.label)}</strong>
        <span>${ttSection1PhotoMode === "full" ? "Whole poster shown" : "Fit height; drag or swipe sideways"}</span>
      </header>
      <div class="section1-photo-viewport" data-mode="${ttSection1PhotoMode}">
        <img src="${escapeHtml(photo.src)}" alt="Section 1 sound drill poster for ${escapeHtml(photo.label)}" draggable="false">
      </div>
    </section>
    <section class="section1-card-view ${ttSection1View === "cards" ? "active" : ""}" aria-label="Section 1 small card view">
      ${smallCardHtml}
    </section>
  `;
  ttById("ttSounds").innerHTML = soundsHtml;
  // Also fill the §1 repeat card shown in Part 2 after §5
  const soundsB = ttById("ttSoundsB");
  if (soundsB) soundsB.innerHTML = soundsHtml;
  ttBindSection1Controls();
}

function ttSection1SmallCardView(skill, lesson) {
  const poster = ttSection1PosterForSubstep(skill.id);
  const vowelCards = ttSection1VowelCards(skill.id);
  const consonantCards = ttSection1ConsonantCards(skill.id);
  const gluedCards = ttSection1GluedCards(skill.id);
  const elementCards = ttSection1ElementCards(skill.id);
  const targets = targetSoundItemsForLesson(lesson, skill);
  const targetGroups = {
    vowels: vowelCards.slice(0, 5).map((item) => item.label),
    consonants: targets.filter((item) => /consonants|digraphs/i.test(item.group || "")).map((item) => item.value),
    glued: targets.filter((item) => /welded|glued/i.test(item.group || "")).map((item) => item.value),
    elements: targets.filter((item) => /pfx|sfx|element/i.test(item.group || "")).map((item) => item.value)
  };
  return `
    <section class="section1-board" aria-label="Section 1 sound drill board">
      <header class="section1-board-head">
        <div>
          <span>PowerPoint slide ${poster.slide}</span>
          <h3>${escapeHtml(poster.title)}</h3>
        </div>
        <strong>${escapeHtml(poster.range)}</strong>
      </header>
      <div class="section1-poster-grid">
        <article class="section1-poster-panel section1-vowels">
          <strong>Vowels first</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(vowelCards, "vowel")}</div>
        </article>
        <article class="section1-poster-panel section1-consonants">
          <strong>Consonants / digraphs</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(consonantCards, "consonant")}</div>
        </article>
        <article class="section1-poster-panel section1-glued">
          <strong>Glued / welded sounds</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(gluedCards, "glued")}</div>
        </article>
        <article class="section1-poster-panel section1-elements">
          <strong>Word elements</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(elementCards, "element")}</div>
        </article>
      </div>
      <div class="section1-quick-picks">
        <strong>Today's quick picks</strong>
        <div><span>Vowels</span>${ttChipList(targetGroups.vowels)}</div>
        <div><span>Consonants</span>${ttChipList(targetGroups.consonants)}</div>
        <div><span>Glued</span>${ttChipList(targetGroups.glued)}</div>
        <div><span>Elements</span>${ttChipList(targetGroups.elements)}</div>
      </div>
    </section>
  `;
}

function ttBindSection1Controls() {
  ttById("ttSounds")?.querySelectorAll("[data-section1-view]").forEach((button) => {
    button.addEventListener("click", () => {
      ttSection1View = button.dataset.section1View;
      ttRender();
    });
  });
  ttById("ttSounds")?.querySelectorAll("[data-section1-photo-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      ttSetSection1PhotoMode(button.dataset.section1PhotoMode);
    });
  });
  const viewport = ttById("ttSounds")?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    ttSection1Pan = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      moved: false
    };
    viewport.classList.add("is-panning");
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!ttSection1Pan || ttSection1Pan.id !== event.pointerId) return;
    const dx = event.clientX - ttSection1Pan.x;
    const dy = event.clientY - ttSection1Pan.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) ttSection1Pan.moved = true;
    viewport.scrollLeft = ttSection1Pan.left - dx;
    viewport.scrollTop = ttSection1Pan.top - dy;
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    viewport.addEventListener(type, (event) => {
      if (ttSection1Pan?.id === event.pointerId || type === "lostpointercapture") {
        viewport.classList.remove("is-panning");
        if (type !== "pointerup") ttSection1Pan = null;
      }
    });
  });
  viewport.addEventListener("dblclick", (event) => {
    event.preventDefault();
    ttToggleSection1PhotoModeAt(event.clientX);
  });
  viewport.addEventListener("pointerup", (event) => {
    const didPan = ttSection1Pan?.moved;
    ttSection1Pan = null;
    if (didPan) return;
    const now = Date.now();
    const distance = Math.hypot(event.clientX - ttSection1LastTap.x, event.clientY - ttSection1LastTap.y);
    if (now - ttSection1LastTap.time < 320 && distance < 28) {
      event.preventDefault();
      ttToggleSection1PhotoModeAt(event.clientX);
      ttSection1LastTap = { time: 0, x: 0, y: 0 };
      return;
    }
    ttSection1LastTap = { time: now, x: event.clientX, y: event.clientY };
  });
}

function ttSetSection1PhotoMode(mode, focusRatio = 0) {
  ttSection1PhotoMode = mode === "zoom" ? "zoom" : "full";
  const root = ttById("ttSounds");
  const viewport = root?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  viewport.dataset.mode = ttSection1PhotoMode;
  root.querySelectorAll("[data-section1-photo-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section1PhotoMode === ttSection1PhotoMode);
  });
  const help = root.querySelector(".section1-photo-head span");
  if (help) help.textContent = ttSection1PhotoMode === "full" ? "Whole poster shown" : "Fit height; drag or swipe sideways";
  requestAnimationFrame(() => {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = ttSection1PhotoMode === "zoom" ? max * Math.max(0, Math.min(1, focusRatio)) : 0;
  });
}

function ttToggleSection1PhotoModeAt(clientX) {
  const viewport = ttById("ttSounds")?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left + viewport.scrollLeft) / Math.max(1, viewport.scrollWidth)));
  ttSetSection1PhotoMode(ttSection1PhotoMode === "full" ? "zoom" : "full", ratio);
}

function ttSection1PhotoForSubstep(substep) {
  const photos = [
    { from: "1.1", to: "1.1", file: "1.1.png", label: "1.1" },
    { from: "1.2", to: "1.3", file: "1.2 - 1.3.png", label: "1.2-1.3" },
    { from: "1.4", to: "1.4", file: "1.4.png", label: "1.4" },
    { from: "1.5", to: "1.6", file: "1.5 - 1.6.png", label: "1.5-1.6" },
    { from: "2.1", to: "2.2", file: "2.1 - 2.2.png", label: "2.1-2.2" },
    { from: "2.3", to: "3.5", file: "2.3 - 3.5.png", label: "2.3-3.5" },
    { from: "4.1", to: "4.4", file: "4.1 - 4.4.png", label: "4.1-4.4" },
    { from: "5.1", to: "5.2", file: "5.1 - 5.2.png", label: "5.1-5.2" },
    { from: "5.3", to: "5.4", file: "5.3 - 5.4.png", label: "5.3-5.4" },
    { from: "5.5", to: "6.3", file: "5.5 - 6.3.png", label: "5.5-6.3" },
    { from: "6.4", to: "6.4", file: "6.4.png", label: "6.4" },
    { from: "7.1", to: "7.1", file: "7.1.png", label: "7.1" },
    { from: "7.2", to: "7.2", file: "7.2.png", label: "7.2" },
    { from: "7.3", to: "7.3", file: "7.3.png", label: "7.3" },
    { from: "7.4", to: "7.5", file: "7.4 - 7.5.png", label: "7.4-7.5" },
    { from: "8.1", to: "8.1", file: "8.1.png", label: "8.1" },
    { from: "8.2", to: "8.4", file: "8.1 - 8.4.png", label: "8.2-8.4" },
    { from: "8.5", to: "8.5", file: "8.5.png", label: "8.5" },
    { from: "9.1", to: "12.6", file: "9.1 and on.png", label: "9.1 and on" }
  ];
  const match = photos.find((photo) => ttSubstepInRange(substep, photo.from, photo.to)) || photos[0];
  return {
    ...match,
    src: `Sounds%20for%20Section%201/${encodeURIComponent(match.file)}`
  };
}

function ttSection1PosterForSubstep(substep) {
  const posters = [
    { from: "1.1", to: "1.1", slide: 1, range: "1.1", title: "Vowels + consonants" },
    { from: "1.2", to: "1.3", slide: 2, range: "1.2-1.3", title: "Vowels, consonants, digraphs" },
    { from: "1.4", to: "1.4", slide: 3, range: "1.4", title: "First glued sound: all" },
    { from: "1.5", to: "1.6", slide: 4, range: "1.5-1.6", title: "Glued sounds: all, am, an" },
    { from: "2.1", to: "2.2", slide: 5, range: "2.1-2.2", title: "Closed syllable glued sounds" },
    { from: "2.3", to: "3.5", slide: 6, range: "2.3-3.5", title: "Cumulative closed syllable sounds" },
    { from: "4.1", to: "4.4", slide: 7, range: "4.1-4.4", title: "V-e long vowel sounds" },
    { from: "5.1", to: "5.2", slide: 8, range: "5.1-5.2", title: "Open syllable long sounds" },
    { from: "5.3", to: "5.4", slide: 9, range: "5.3-5.4", title: "Open syllable + final y" },
    { from: "5.5", to: "6.3", slide: 10, range: "5.5-6.3", title: "Cumulative long vowel review" },
    { from: "6.4", to: "6.4", slide: 11, range: "6.4", title: "Final stable syllable review" },
    { from: "7.1", to: "7.1", slide: 12, range: "7.1", title: "Soft c and soft g" },
    { from: "7.2", to: "7.2", slide: 13, range: "7.2", title: "ce, ge, and dge" },
    { from: "7.3", to: "7.3", slide: 14, range: "7.3", title: "ph and tch" },
    { from: "7.4", to: "7.4", slide: 15, range: "7.4", title: "tion and sion" },
    { from: "7.5", to: "7.5", slide: 16, range: "7.5", title: "Contractions and possessives" },
    { from: "8.1", to: "8.5", slide: 17, range: "8.1-8.5", title: "R-controlled vowels" },
    { from: "9.1", to: "12.6", slide: 18, range: "9.1-12.6", title: "Advanced vowel teams and exceptions" }
  ];
  return posters.find((poster) => ttSubstepInRange(substep, poster.from, poster.to)) || posters[0];
}

function ttSubstepInRange(substep, from, to) {
  return isAtLeastSubstep(substep, from) && isAtLeastSubstep(to, substep);
}

function ttSection1VowelCards(substep) {
  const cards = [
    { label: "a", cue: "apple", sound: "/ă/" },
    { label: "e", cue: "Ed", sound: "/ĕ/" },
    { label: "i", cue: "itch", sound: "/ĭ/" },
    { label: "o", cue: "octopus", sound: "/ŏ/" },
    { label: "u", cue: "up", sound: "/ŭ/" }
  ];
  if (isAtLeastSubstep(substep, "4.1")) {
    cards.push(
      { label: "a-e", cue: "safe", sound: "/ā/" },
      { label: "e-e", cue: "Pete", sound: "/ē/" },
      { label: "i-e", cue: "pine", sound: "/ī/" },
      { label: "o-e", cue: "home", sound: "/ō/" },
      { label: "u-e", cue: "rule / mule", sound: "/ū/ /ü/" }
    );
  }
  if (isAtLeastSubstep(substep, "5.1")) {
    cards.push(
      { label: "a", cue: "acorn", sound: "/ā/" },
      { label: "e", cue: "me", sound: "/ē/" },
      { label: "i", cue: "hi", sound: "/ī/" },
      { label: "o", cue: "no", sound: "/ō/" },
      { label: "u", cue: "flu", sound: "/ū/ /ü/" },
      { label: "y", cue: "baby / cry", sound: "/ē/ /ī/" }
    );
  }
  if (isAtLeastSubstep(substep, "8.1")) {
    cards.push(
      { label: "ar", cue: "car", sound: "/ar/" },
      { label: "er", cue: "her", sound: "/er/" },
      { label: "ir", cue: "bird", sound: "/er/" },
      { label: "or", cue: "fork", sound: "/or/" },
      { label: "ur", cue: "burn", sound: "/er/" }
    );
  }
  if (isAtLeastSubstep(substep, "9.1")) {
    cards.push(
      { label: "ai/ay", cue: "rain / play", sound: "/ā/" },
      { label: "ee/ea/ey", cue: "see / eat / key", sound: "/ē/" },
      { label: "oi/oy", cue: "coin / boy", sound: "/oi/" },
      { label: "oa/oe/ow", cue: "boat / toe / snow", sound: "/ō/" },
      { label: "ou/ow", cue: "out / cow", sound: "/ou/" },
      { label: "oo", cue: "moon / book", sound: "/ū/ /oo/" }
    );
  }
  return cards;
}

function ttSection1ConsonantCards(substep) {
  const base = isAtLeastSubstep(substep, "1.2")
    ? ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "qu", "r", "s", "t", "v", "w", "x", "y", "z", "ch", "ck", "sh", "th", "wh"]
    : ["f", "l", "m", "n", "r", "s", "d", "g", "p", "t"];
  if (isAtLeastSubstep(substep, "7.1")) base.push("c=/s/", "g=/j/");
  if (isAtLeastSubstep(substep, "7.2")) base.push("ce", "ge", "dge");
  if (isAtLeastSubstep(substep, "7.3")) base.push("ph", "tch");
  return [...new Set(base)].map((label) => ({ label }));
}

function ttSection1GluedCards(substep) {
  return knownWeldedAndExceptions
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, label]) => ({ label }));
}

function ttSection1ElementCards(substep) {
  return wordElementList(substep)
    .slice(0, 24)
    .map((label) => ({ label }));
}

function ttSoundCardHtml(cards, type) {
  if (!cards.length) return `<span class="section1-empty">Not introduced yet</span>`;
  return cards.map((card) => `
    <span class="section1-sound-card ${type}">
      <b>${escapeHtml(card.label)}</b>
      ${card.cue ? `<small>${escapeHtml(card.cue)}</small>` : ""}
      ${card.sound ? `<em>${escapeHtml(card.sound)}</em>` : ""}
    </span>
  `).join("");
}

function ttChipList(items) {
  const unique = [...new Set(items)].filter(Boolean);
  if (!unique.length) return `<em>as needed</em>`;
  return unique.slice(0, 8).map((item) => `<b>${escapeHtml(item)}</b>`).join("");
}

function ttFillReverse(skill, lesson) {
  const targetItems = targetSoundItemsForLesson(lesson, skill);
  const targets = targetItems.map((item) => item.value);
  const targetSet = new Set(targets);
  const groups = [
    { title: "Vowels", items: vowelSoundList(skill.id) },
    { title: "Consonants", items: consonantSoundList(skill.id) },
    { title: "Welded / glued", items: knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(skill.id, step)).map(([, value]) => value) },
    { title: "Word elements", items: wordElementList(skill.id) }
  ];
  const html = groups.map((group) => `
    <article class="reverse-group">
      <strong>${escapeHtml(group.title)}</strong>
      <div class="reverse-chip-row">
        ${group.items.map((item) => {
          const key = item.replace(/^-|-$/g, "");
          const marked = isMarkedReviewWord(item) || isMarkedReviewWord(key);
          const today = targetSet.has(item) || targetSet.has(key);
          return `<button type="button" class="${today ? "today-target" : ""} ${marked ? "marked-word" : ""}" data-sound="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
        }).join("")}
      </div>
    </article>
  `).join("");
  ttById("ttReverse").innerHTML = html;
  ttById("ttReverse").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      ttToggleEncodingForActiveStudent(button, "section6", "Reverse drill", button.dataset.sound);
    });
  });
  ttFillEncodingStudentGrid(ttById("ttEncodingBar6"), "section6", "Reverse drill", targetItems);
}

function ttFillEncodingStudentGrid(container, section, label, items = []) {
  if (!container) return;
  const group = ttActiveGroup();
  container.dataset.section = section;
  const observationGroups = [
    [
      ["automatic encoding; no struggle", "Auto"],
      ["accurate encoding; minor struggle", "Acc"],
      ["struggling to identify and segment sounds properly", "Strug"]
    ],
    [
      ["struggles mainly with nonsense words", "NS"],
      ["struggles with consonant blends", "Blends"],
      ["struggles differentiating vowel sounds", "Vowel Diff"],
      ["struggles with high-frequency words", "HFW"],
      ["struggles with words that have suffixes", "Sfx"]
    ]
  ];
  const visibleItems = ttNormalizeEncodingItems(items).slice(0, 32);
  container.innerHTML = `
    <div class="encoding-row">
      <strong>${escapeHtml(label)} data</strong>
      <span class="encoding-selected">Tap under each student to save for this lesson</span>
    </div>
    <div class="encoding-student-grid"></div>
  `;
  const grid = container.querySelector(".encoding-student-grid");
  group.students.forEach((student) => {
    const column = document.createElement("article");
    column.className = "encoding-student-column";
    column.innerHTML = `
      <strong>${escapeHtml(student)}</strong>
      <div class="encoding-code-row encoding-code-row-main"></div>
      <div class="encoding-code-row encoding-code-row-skill"></div>
      <div class="encoding-item-row"></div>
    `;
    const codeRows = column.querySelectorAll(".encoding-code-row");
    observationGroups.forEach((groupItems, groupIndex) => {
      groupItems.forEach(([note, shortLabel]) => {
        const quickButton = document.createElement("button");
        quickButton.type = "button";
        quickButton.textContent = shortLabel;
        quickButton.dataset.note = note;
        quickButton.dataset.quickGroup = groupIndex === 0 ? "status" : "skill";
        quickButton.addEventListener("click", () => {
          if (groupIndex === 0) {
            ttSetExclusiveEncodingObservation(quickButton, student, section, label, note);
          } else {
            ttToggleEncodingObservation(quickButton, student, section, label, note, "");
          }
          container.querySelector(".encoding-selected").textContent = `Saved: ${student} - ${shortLabel}`;
        });
        codeRows[groupIndex].appendChild(quickButton);
      });
    });
    const itemRow = column.querySelector(".encoding-item-row");
    ttGroupEncodingItems(visibleItems).forEach((itemGroup) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "encoding-item-group";
      groupBlock.innerHTML = `<span>${escapeHtml(itemGroup.group)}</span><div></div>`;
      const buttonRow = groupBlock.querySelector("div");
      itemGroup.items.forEach((item) => {
        const itemButton = document.createElement("button");
        itemButton.type = "button";
        itemButton.textContent = item.value;
        itemButton.addEventListener("click", () => {
          ttToggleEncodingObservation(itemButton, student, section, item.category || label, "encoding miss", item.value);
          container.querySelector(".encoding-selected").textContent = `${student}: ${item.value}`;
        });
        buttonRow.appendChild(itemButton);
      });
      itemRow.appendChild(groupBlock);
    });
    grid.appendChild(column);
  });
}

function ttSetExclusiveEncodingObservation(button, student, section, category, note) {
  const group = ttActiveGroup();
  group.encodingObservations ||= [];
  const lessonId = ttLesson?.id || "";
  const exclusiveNotes = new Set([
    "automatic encoding; no struggle",
    "accurate encoding; minor struggle",
    "struggling to identify and segment sounds properly"
  ]);
  const wasSaved = group.encodingObservations.some((record) =>
    record.lessonId === lessonId
    && record.student === student
    && record.section === section
    && record.category === category
    && record.note === note
    && !(record.item || "")
  );
  group.encodingObservations = group.encodingObservations.filter((record) =>
    !(record.lessonId === lessonId
      && record.student === student
      && record.section === section
      && record.category === category
      && exclusiveNotes.has(record.note)
      && !(record.item || ""))
  );
  button.closest(".encoding-code-row")?.querySelectorAll("button").forEach((item) => item.classList.remove("saved", "encoding-selected-item"));
  if (!wasSaved) {
    ttSaveEncodingObservation(student, section, category, note, "");
    button.classList.add("saved", "encoding-selected-item");
  }
  saveState();
}

function ttNormalizeEncodingItems(items = []) {
  const seen = new Set();
  const normalized = [];
  items.filter(Boolean).forEach((item) => {
    const value = typeof item === "object" ? item.value : item;
    const category = typeof item === "object" ? item.category : "";
    const group = typeof item === "object" ? item.group : "";
    const cleanValue = String(value || "").trim();
    if (!cleanValue) return;
    const key = `${category || ""}|${cleanValue.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ value: cleanValue, category, group: group || category || "Items" });
  });
  return normalized;
}

function ttGroupEncodingItems(items = []) {
  const groups = [];
  items.forEach((item, blockIndex) => {
    const groupName = item.group || item.category || "Items";
    let target = groups.find((group) => group.group === groupName);
    if (!target) {
      target = { group: groupName, items: [] };
      groups.push(target);
    }
    target.items.push(item);
  });
  return groups;
}

function ttSelectEncodingItem(button, section, category, value) {
  if (button.classList.contains("encoding-selected-item")) {
    button.classList.remove("encoding-selected-item");
    ttClearEncodingSelection(section);
    return;
  }
  document.querySelectorAll(`[data-encoding-section="${section}"], .encoding-selected-item`).forEach((item) => {
    if (item.dataset.encodingSection === section || item.closest(`#section${section.replace("section", "")}`)) {
      item.classList.remove("encoding-selected-item");
    }
  });
  button.classList.add("encoding-selected-item");
  button.dataset.encodingSection = section;
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  bar.dataset.selectedValue = value;
  bar.dataset.selectedCategory = category;
  bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
}

function ttToggleEncodingForActiveStudent(button, section, category, value) {
  const group = ttActiveGroup();
  const student = group.activeStudent || group.students[0];
  ttToggleEncodingObservation(button, student, section, category, "encoding miss", value);
}

function ttToggleEncodingObservation(button, student, section, category, note, item = "") {
  const group = ttActiveGroup();
  group.encodingObservations ||= [];
  const lessonId = ttLesson?.id || "";
  const existingIndex = group.encodingObservations.findIndex((record) =>
    record.lessonId === lessonId
    && record.student === student
    && record.section === section
    && record.category === category
    && record.note === note
    && (record.item || "") === (item || "")
  );
  if (existingIndex >= 0) {
    group.encodingObservations.splice(existingIndex, 1);
    button.classList.remove("saved", "encoding-selected-item");
  } else {
    ttSaveEncodingObservation(student, section, category, note, item);
    button.classList.add("saved", "encoding-selected-item");
  }
  saveState();
}

function ttClearEncodingSelection(section) {
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  bar.dataset.selectedValue = "";
  bar.dataset.selectedCategory = "";
  bar.querySelector(".encoding-selected").textContent = "Tap item, then student";
}

function ttSelectEncodingValue(section, category, value) {
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  if (bar.dataset.selectedValue === value && bar.dataset.selectedCategory === category) {
    ttClearEncodingSelection(section);
    return;
  }
  bar.dataset.selectedValue = value;
  bar.dataset.selectedCategory = category;
  bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
  document.querySelectorAll(".encoding-selected-item").forEach((item) => item.classList.remove("encoding-selected-item"));
}

function ttEncodingBarForSection(section) {
  return {
    section6: ttById("ttEncodingBar6"),
    section7: ttById("ttEncodingBar7"),
    section8: ttById("ttDictation")?.querySelector(".encoding-bar")
  }[section] || null;
}

function ttSaveEncodingSelected(container, student) {
  const value = container.dataset.selectedValue || "";
  const category = container.dataset.selectedCategory || "";
  const section = container.dataset.section || "";
  if (!value) {
    container.querySelector(".encoding-selected").textContent = "Tap an item first";
    return;
  }
  ttSaveEncodingObservation(student, section, category, "encoding miss", value);
  container.querySelector(".encoding-selected").textContent = `Saved: ${student} - ${value}`;
  container.dataset.selectedValue = "";
  container.dataset.selectedCategory = "";
  document.querySelectorAll(".encoding-selected-item").forEach((item) => item.classList.remove("encoding-selected-item"));
}

function ttSaveEncodingObservation(student, section, category, note, item = "") {
  if (!student) return;
  ttEnsureCurrentLessonSavedForData();
  const group = ttActiveGroup();
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  group.encodingObservations ||= [];
  group.encodingObservations.push({
    id: `encoding-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    student,
    section,
    substep: ttLesson?.substep || group.substep,
    category,
    item,
    note,
    ...lessonMeta
  });
  if (item || note.includes("difficult") || note.includes("strategies")) {
    group.markedReviewWords ||= [];
    group.markedReviewWords.push({
      word: item || note,
      source: section,
      student,
      substep: ttLesson?.substep || group.substep,
      date: new Date().toISOString()
    });
  }
  saveState();
  ttRenderMarkedWords();
}

function vowelSoundList(substep) {
  const items = ["ă", "ĕ", "ĭ", "ŏ", "ŭ"];
  if (isAtLeastSubstep(substep, "4.1")) items.push("ā-e", "ē-e", "ī-e", "ō-e", "ū-e");
  if (isAtLeastSubstep(substep, "5.1")) items.push("ā", "ē", "ī", "ō", "ū");
  if (isAtLeastSubstep(substep, "5.3")) items.push("y=ē", "y=ī");
  if (isAtLeastSubstep(substep, "8.1")) items.push("ar", "er", "ir", "or", "ur");
  if (isAtLeastSubstep(substep, "9.1")) items.push("ai", "ay");
  if (isAtLeastSubstep(substep, "9.2")) items.push("ee", "ey");
  if (isAtLeastSubstep(substep, "9.3")) items.push("ea", "oa", "oe");
  return items;
}

function consonantSoundList(substep) {
  const base = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "qu", "r", "s", "t"];
  if (isAtLeastSubstep(substep, "1.2")) base.push("v", "w", "x", "y", "z", "ch", "ck", "sh", "th", "wh");
  if (isAtLeastSubstep(substep, "7.2")) base.push("dge", "ce", "ge");
  if (isAtLeastSubstep(substep, "7.3")) base.push("ph", "tch");
  return [...new Set(base)];
}

function wordElementList(substep) {
  return knownPrefixes.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value)
    .concat(knownSuffixes.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value))
    .concat(knownLatinBases.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value));
}

function targetSoundsForLesson(lesson, skill) {
  return targetSoundItemsForLesson(lesson, skill).map((item) => item.value);
}

function targetSoundItemsForLesson(lesson, skill) {
  if (lesson.reverseDrillOverride?.length) return lesson.reverseDrillOverride;
  const words = []
    .concat(lesson.sectionTwoCurrentWords || [])
    .concat(lesson.sectionTwoLastMissedWords || [])
    .concat(lesson.sectionTwoPriorityMissedWords || [])
    .concat(lesson.realWords || [])
    .concat(dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []));
  const text = words.join(" ").toLowerCase();
  const consonants = [];
  const welded = [];
  const elements = [];
  consonantSoundList(skill.id).forEach((sound) => {
    const key = sound.replace(/^-|-$/g, "").toLowerCase();
    if (key.length && text.includes(key)) consonants.push(sound);
  });
  knownWeldedAndExceptions.map(([, value]) => value).forEach((sound) => {
    const key = sound.replace(/^-|-$/g, "").toLowerCase();
    if (key.length && text.includes(key)) welded.push(sound);
  });
  wordElementList(skill.id).forEach((part) => {
    const key = part.replace(/^-|-$/g, "").toLowerCase();
    if (key && text.includes(key)) elements.push(part);
  });
  const vowels = vowelSoundList(skill.id);
  const pageOffset = Number(lesson.wordlistPageNumber || lesson.pageNumber || 0) + Number(lesson.reverseDrillSeed || 0);
  return []
    .concat(vowels.slice(pageOffset % Math.max(vowels.length, 1)).concat(vowels).slice(0, 5).map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(pickConsonantTargets(consonants, skill.id, pageOffset).map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat([...new Set(welded)].slice(0, 3).map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat([...new Set(elements)].slice(0, 2).map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
}

function pickConsonantTargets(candidates, substep, offset = 0) {
  const unique = [...new Set(candidates)].filter(Boolean);
  const digraphs = ["ch", "ck", "sh", "th", "wh", "dge", "ph", "tch"];
  const picked = [];
  const candidateDigraph = unique.find((sound) => digraphs.includes(sound));
  const knownDigraphs = consonantSoundList(substep).filter((sound) => digraphs.includes(sound));
  if (candidateDigraph) {
    picked.push(candidateDigraph);
  } else if (knownDigraphs.length) {
    picked.push(knownDigraphs[offset % knownDigraphs.length]);
  }
  const remaining = unique.filter((sound) => !picked.includes(sound));
  const start = remaining.length ? offset % remaining.length : 0;
  const rotated = remaining.slice(start).concat(remaining.slice(0, start));
  rotated.forEach((sound) => {
    if (picked.length < 5) picked.push(sound);
  });
  consonantSoundList(substep).forEach((sound) => {
    if (picked.length < 5 && !picked.includes(sound)) picked.push(sound);
  });
  return picked.slice(0, 5);
}

function ttFillWordRow(container, words, options = {}) {
  container.innerHTML = "";
  if (!words.length) {
    const empty = document.createElement("span");
    empty.textContent = "No words listed";
    container.appendChild(empty);
    return;
  }
  words.forEach((word) => {
    const item = document.createElement(options.markable || options.onSelect ? "button" : "span");
    item.textContent = word;
    if (options.markable || options.onSelect) {
      item.type = "button";
      item.className = [
        options.markable && isMarkedReviewWord(word) ? "marked-word" : "",
        word === ttSection2Word ? "selected-display-word" : ""
      ].filter(Boolean).join(" ");
    }
    const singleAction = () => {
      if (options.markable) toggleReviewWord(word, options.source || "lesson");
      if (options.onSelect) options.onSelect(word);
    };
    if (options.onReplace) {
      ttBindSingleOrTriple(item, singleAction, () => options.onReplace(word));
    } else if (options.markable || options.onSelect) {
      item.addEventListener("click", singleAction);
    }
    container.appendChild(item);
  });
}

function ttBindSingleOrTriple(element, singleAction, tripleAction) {
  if (!element) return;
  let taps = 0;
  let tapTimer = null;
  element.classList.add("triple-switchable");
  element.title = element.title ? `${element.title} | Triple-tap to switch` : "Triple-tap to switch";
  element.addEventListener("click", (event) => {
    taps += 1;
    clearTimeout(tapTimer);
    if (taps >= 3) {
      event.preventDefault();
      event.stopPropagation();
      taps = 0;
      tripleAction?.();
      ttFlashSwitchFeedback(element);
      return;
    }
    tapTimer = setTimeout(() => {
      if (taps === 1) singleAction?.(event);
      taps = 0;
    }, 300);
  });
}

function ttFlashSwitchFeedback(element) {
  if (!element) return;
  element.classList.remove("switch-flash");
  void element.offsetWidth;
  element.classList.add("switch-flash");
  setTimeout(() => element.classList.remove("switch-flash"), 800);
}

function ttFillSection3Cards(lesson) {
  document.querySelectorAll(".card-mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === ttCardMode);
  });
  ttFillHfwStepChoicesForSelect(ttById("ttSection3HfwStep"), lesson.substep);
  ttById("ttSection3HfwStep")?.classList.toggle("active", ttCardMode === "hfw");
  const deckData = section3DeckForMode(lesson, ttCardMode);
  ttCardDeck = deckData.deck;
  ttById("ttReviewCardsTitle").textContent = deckData.reviewTitle;
  ttById("ttCurrentCardsTitle").textContent = deckData.currentTitle;
  ttFillWordRow(ttById("ttReviewCards"), deckData.review, {
    markable: ttCardMode === "words",
    source: `section3-${ttCardMode}-review`,
    onSelect: (word) => ttShowCardByWord(word),
    onReplace: ttCardMode === "words" ? (word) => ttReplaceSection3Word("review", word) : null
  });
  ttFillWordRow(ttById("ttCurrentCards"), deckData.current, {
    markable: ttCardMode === "words",
    source: `section3-${ttCardMode}-current`,
    onSelect: (word) => ttShowCardByWord(word),
    onReplace: ttCardMode === "words" ? (word) => ttReplaceSection3Word("current", word) : null
  });
  ttCardIndex = 0;
  ttShowCard(0);
}

function ttReplaceSection3Word(kind, oldWord) {
  if (!ttLesson || ttCardMode !== "words") return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const key = kind === "review" ? "sectionThreeReviewWords" : "sectionThreeCurrentWords";
  const current = ttLesson[key] || (kind === "review" ? section3ReviewCards(ttLesson) : section3CurrentCards(ttLesson));
  const pool = kind === "review"
    ? readerWordsFromSubstep(priorSubstep(skill.id), ttLesson.readerLevel || "AB")
    : (ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []);
  ttLesson[key] = current.map((word) => word === oldWord ? ttPickReplacement(pool, current, oldWord) : word);
  ttSaveDraftLesson();
  ttFillSection3Cards(ttLesson);
}

function section3DeckForMode(lesson, mode) {
  if (mode === "hfw") {
    const hfwSubstep = ttById("ttSection3HfwStep")?.value || lesson.substep;
    const current = hfwWordsForSubstep(hfwSubstep, lesson);
    const review = hfwReviewWordsForSubstep(hfwSubstep);
    return {
      reviewTitle: "Review HFW",
      currentTitle: `${hfwSubstep} HFW`,
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review HFW", label: "HFW review" }))
        .concat(current.map((word) => ({ word, type: "Current HFW", label: `${hfwSubstep} HFW` })))
    };
  }
  if (mode === "words") {
    const review = section3ReviewCards(lesson);
    const current = section3CurrentCards(lesson);
    return {
      reviewTitle: "Review cards",
      currentTitle: "Current cards",
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review", label: `${lesson.substep} review` }))
        .concat(current.map((word) => ({ word, type: "Current", label: `${lesson.substep}${lesson.readerLevel || "AB"}` })))
    };
  }

  const group = ttActiveGroup();
  const cards = wordPartCardsForMode(group.substep, mode);
  const title = modeTitle(mode);
  return {
    reviewTitle: `${title} known up to ${group.substep}`,
    currentTitle: "Tap a card to flash it",
    review: [],
    current: cards.map((card) => card.word),
    deck: cards
  };
}

function wordPartCardsForMode(substep, mode) {
  const sources = {
    welded: knownWeldedAndExceptions,
    latin: knownLatinBases,
    prefixes: knownPrefixes,
    suffixes: knownSuffixes
  };
  const typeLabels = {
    welded: "Welded/Glued",
    latin: "Latin Base",
    prefixes: "Prefix",
    suffixes: "Suffix"
  };
  const entries = sources[mode] || [];
  return entries
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([introduced, word]) => ({
      word: displayWordPart(word, mode),
      type: mode,
      label: introduced,
      typeLabel: typeLabels[mode] || mode
    }));
}

function displayWordPart(word, mode) {
  if (mode === "prefixes") return word.replace(/-$/, "");
  if (mode === "suffixes") return word.replace(/^-/, "");
  return word;
}

function modeTitle(mode) {
  return {
    hfw: "High-frequency words",
    welded: "Welded/Glued sounds",
    latin: "Latin bases",
    prefixes: "Prefixes",
    suffixes: "Suffixes"
  }[mode] || "Word cards";
}

function section3ReviewCards(lesson) {
  if (lesson.sectionThreeReviewWords?.length) return lesson.sectionThreeReviewWords;
  const skill = scopeMap.find((item) => item.id === lesson.substep);
  if (!skill) return [];
  return chooseWords(readerWordsFromSubstep(priorSubstep(skill.id), lesson.readerLevel || "AB"), 8, true);
}

function section3CurrentCards(lesson) {
  if (lesson.sectionThreeCurrentWords?.length) return lesson.sectionThreeCurrentWords;
  const section2 = new Set(lesson.sectionTwoCurrentWords || []);
  const chartingPageWords = (lesson.realWords || []).concat(lesson.nonsenseWords || []);
  const source = chartingPageWords.filter((word) => !section2.has(word));
  return chooseWords(source.length ? source : chartingPageWords, 8, true);
}

function ttGroupChartRecords(group = ttActiveGroup()) {
  const studentIds = new Set(Object.values(group.studentIds || {}).filter(Boolean));
  const matching = (record) => record && (
    record.groupId === group.id
    || record.group === group.name
    || (record.historicalBaseline && record.studentId && studentIds.has(record.studentId))
  );
  return (appState.masterRecords || [])
    .filter(matching)
    .concat(group.chartResults || [])
    .sort((a, b) => ttRecordTime(a) - ttRecordTime(b));
}

function ttMissWordsFromChartRecord(record) {
  const wordRecords = (record?.wordRecords || [])
    .filter((item) => item && item.correct === false)
    .map((item) => item.word || item.value || "");
  const wrongWords = (record?.wrongWords || []).filter(Boolean);
  return uniqueWords(wordRecords.concat(wrongWords).filter(isUsableReaderWord));
}

function ttSection2RelevantMisses(words = [], lesson = {}, skill = null) {
  const activeSkill = skill || scopeMap.find((item) => item.id === lesson.substep) || activeStep(ttActiveGroup());
  const currentWords = new Set([].concat(lesson.realWords || [], lesson.nonsenseWords || []).map((word) => word.toLowerCase()));
  const knownWords = new Set(
    [].concat(
      readerWordsFromSubstep(activeSkill.id, lesson.readerLevel || "AB"),
      readerWordsFromSubstep(priorSubstep(activeSkill.id), lesson.readerLevel || "AB"),
      priorDictationWords(activeSkill.id, lesson.readerLevel || "AB"),
      ttCurrentRealWordPool(lesson, activeSkill),
      ttReviewRealWordPool(lesson, activeSkill)
    ).map((word) => word.toLowerCase())
  );
  const filtered = uniqueWords(words)
    .filter(isUsableReaderWord)
    .filter((word) => currentWords.has(word.toLowerCase()) || knownWords.has(word.toLowerCase()));
  return filtered.length ? filtered : uniqueWords(words).filter(isUsableReaderWord);
}

function ttLastLessonMissedWords(group = ttActiveGroup(), lesson = ttLesson, skill = null) {
  const currentPlanId = lesson?.savedPlanId || "";
  const currentLessonId = lesson?.id || "";
  const records = ttGroupChartRecords(group)
    .filter((record) => !(currentPlanId && record.planId === currentPlanId))
    .filter((record) => !(currentLessonId && record.lessonId === currentLessonId))
    .filter((record) => ttMissWordsFromChartRecord(record).length);
  if (!records.length) return ttSection2RelevantMisses(group.trouble || [], lesson, skill).slice(0, 6);
  const lastDate = dateKey(records.at(-1).date || records.at(-1).displayDate);
  const words = records
    .filter((record) => dateKey(record.date || record.displayDate) === lastDate)
    .flatMap(ttMissWordsFromChartRecord);
  return ttSection2RelevantMisses(words, lesson, skill).slice(0, 8);
}

function ttPriorityMissedWords(group = ttActiveGroup(), lesson = ttLesson, skill = null) {
  const counts = new Map();
  const recency = new Map();
  ttGroupChartRecords(group).forEach((record) => {
    const time = ttRecordTime(record);
    ttMissWordsFromChartRecord(record).forEach((word) => {
      const key = word.toLowerCase();
      counts.set(key, { word, count: (counts.get(key)?.count || 0) + 1 });
      recency.set(key, Math.max(recency.get(key) || 0, time));
    });
  });
  const ranked = [...counts.values()]
    .sort((a, b) => b.count - a.count || (recency.get(b.word.toLowerCase()) || 0) - (recency.get(a.word.toLowerCase()) || 0))
    .map((item) => item.word);
  const fallback = (group.trouble || []).concat(ttLastLessonMissedWords(group, lesson, skill));
  return ttSection2RelevantMisses(ranked.length ? ranked : fallback, lesson, skill).slice(0, 8);
}

function ttEnsureSection2MissIndexes(lesson = ttLesson, group = ttActiveGroup(), skill = null) {
  if (!lesson || !group) return lesson;
  const activeSkill = skill || scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  const currentWords = new Set([].concat(lesson.sectionTwoReviewWords || [], lesson.sectionTwoCurrentWords || []).map((word) => word.toLowerCase()));
  if (!Array.isArray(lesson.sectionTwoLastMissedWords) || !lesson.sectionTwoLastMissedWords.length) {
    lesson.sectionTwoLastMissedWords = ttLastLessonMissedWords(group, lesson, activeSkill)
      .filter((word) => !currentWords.has(word.toLowerCase()))
      .slice(0, 6);
  }
  const used = new Set([].concat(lesson.sectionTwoReviewWords || [], lesson.sectionTwoCurrentWords || [], lesson.sectionTwoLastMissedWords || []).map((word) => word.toLowerCase()));
  if (!Array.isArray(lesson.sectionTwoPriorityMissedWords) || !lesson.sectionTwoPriorityMissedWords.length) {
    lesson.sectionTwoPriorityMissedWords = ttPriorityMissedWords(group, lesson, activeSkill)
      .filter((word) => !used.has(word.toLowerCase()))
      .slice(0, 6);
  }
  return lesson;
}

function ttFillSection2ReplacementTools(lesson, skill) {
  const currentSelect = ttById("ttCurrentWordSelect");
  if (currentSelect) {
    const words = [...new Set([].concat(lesson.realWords || [], lesson.nonsenseWords || []).filter(isUsableReaderWord))];
    currentSelect.innerHTML = `<option value="">Pick from charting page...</option>${words.map((word) => `<option value="${escapeHtml(word)}">${escapeHtml(word)}</option>`).join("")}`;
  }
  const categorySelect = ttById("ttReviewCategory");
  if (categorySelect) {
    const categories = section2ReviewCategories();
    categorySelect.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join("");
    ttFillSection2ReviewCategoryWords(categorySelect.value || categories[0]?.id || "", skill.id);
  }
}

function section2ReviewCategories() {
  return [
    { id: "blends", label: "Blends" },
    { id: "shortLong", label: "Short vs long" },
    { id: "ve", label: "V-e" },
    { id: "open", label: "Open" },
    { id: "fss", label: "FSS" },
    { id: "sfx", label: "Sfx" },
    { id: "multiSfx", label: "Multi Sfx" },
    { id: "ct", label: "-ct" },
    { id: "ruleBreaker", label: "Rule Breaker" },
    { id: "glued", label: "Glued" }
  ];
}

function ttFillSection2ReviewCategoryWords(categoryId, currentSubstep) {
  const container = ttById("ttReviewReplacementWords");
  if (!container) return;
  const words = section2ReviewWordsForCategory(categoryId, currentSubstep).slice(0, 18);
  container.innerHTML = "";
  words.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = word;
    button.addEventListener("click", () => ttShowSection2WordByDeck(word, currentSubstep));
    container.appendChild(button);
  });
}

function section2ReviewWordsForCategory(categoryId, currentSubstep) {
  const level = ttLesson?.readerLevel || ttActiveGroup().readerLevel || "AB";
  const fromSteps = (steps) => steps
    .filter((step) => isAtLeastSubstep(currentSubstep, step))
    .flatMap((step) => dictationWordsFor(step, level).concat(readerWordsFromSubstep(step, level)));
  const noSuffix = (word) => !hasVisibleSuffix(word);
  const hasSuffix = (word) => hasVisibleSuffix(word);
  const hasGlued = (word) => [...gluedSoundSet()].some((sound) => word.includes(sound));
  const hasBlend = (word) => /(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw|scr|shr|spl|spr|squ|str|thr)/.test(word);
  const hasVe = (word) => /[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(word);
  const hasOpen = (word) => /[aeiou]$/.test(word) || /(ba|be|bi|bo|bu|me|mi|no|pa|pi|pro|re|ro|ta|ti|tri)$/.test(word);
  const source = {
    blends: fromSteps(["2.2", "2.4", "2.5"]).filter((word) => noSuffix(word) && hasBlend(word)),
    shortLong: fromSteps(["2.2", "4.1", "5.1"]).filter(noSuffix),
    ve: fromSteps(["4.1", "4.2", "4.3", "4.4"]).filter((word) => noSuffix(word) && hasVe(word)),
    open: fromSteps(["5.1", "5.2"]).filter((word) => noSuffix(word) && hasOpen(word)),
    fss: fromSteps(["6.4"]).filter(noSuffix),
    sfx: fromSteps(["2.2", "2.3", "2.4", "2.5"]).filter(hasSuffix),
    multiSfx: scopeMap.filter((skill) => isAtLeastSubstep(skill.id, "3.1") && isAtLeastSubstep(currentSubstep, skill.id)).flatMap((skill) => fromSteps([skill.id])).filter(hasSuffix),
    ct: fromSteps(["3.3"]).filter((word) => noSuffix(word) && /ct/.test(word)),
    ruleBreaker: fromSteps(["2.3"]),
    glued: priorDictationWords(currentSubstep, level).concat(fromSteps(["1.4", "1.5", "2.1", "2.3"])).filter(hasGlued)
  }[categoryId] || [];
  return chooseWords([...new Set(source.filter(isValidDictationWord))], 18, true);
}

function ttArrayWithout(values = [], remove = "") {
  return values.filter((item) => item !== remove);
}

function ttPickReplacement(pool = [], current = [], oldWord = "") {
  const used = new Set(current.filter((word) => word !== oldWord));
  return chooseWords(pool.filter((word) => isUsableReaderWord(word) && !used.has(word) && word !== oldWord), 1, true)[0] || oldWord;
}

function ttReplaceSection2Word(kind, oldWord) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  if (kind === "current") {
    const pool = (ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []);
    ttLesson.sectionTwoCurrentWords = (ttLesson.sectionTwoCurrentWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoCurrentWords || [], oldWord) : word
    );
  } else if (kind === "lastMisses") {
    const pool = ttLastLessonMissedWords(ttActiveGroup(), ttLesson, skill)
      .concat(ttPriorityMissedWords(ttActiveGroup(), ttLesson, skill));
    ttLesson.sectionTwoLastMissedWords = (ttLesson.sectionTwoLastMissedWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoLastMissedWords || [], oldWord) : word
    );
  } else if (kind === "priorityMisses") {
    const pool = ttPriorityMissedWords(ttActiveGroup(), ttLesson, skill)
      .concat(ttLastLessonMissedWords(ttActiveGroup(), ttLesson, skill));
    ttLesson.sectionTwoPriorityMissedWords = (ttLesson.sectionTwoPriorityMissedWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoPriorityMissedWords || [], oldWord) : word
    );
  } else {
    const pool = section2ReviewWordsForCategory(ttById("ttReviewCategory")?.value || "blends", skill.id)
      .concat(dictationReviewWords(skill.id, ttLesson.readerLevel || "AB"), priorDictationWords(skill.id, ttLesson.readerLevel || "AB"));
    ttLesson.sectionTwoReviewWords = (ttLesson.sectionTwoReviewWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoReviewWords || [], oldWord) : word
    );
  }
  ttSaveDraftLesson();
  ttRender();
}

function ttFillSection2DisplayDeck(lesson, skill) {
  const review = lesson.sectionTwoReviewWords || [];
  const current = lesson.sectionTwoCurrentWords || [];
  const lastMisses = lesson.sectionTwoLastMissedWords || [];
  const priorityMisses = lesson.sectionTwoPriorityMissedWords || [];
  ttSection2Deck = review.map((word) => ({ word, type: "Review", label: "Review word" }))
    .concat(current.map((word) => ({ word, type: "Current", label: "Current word" })))
    .concat(lastMisses.map((word) => ({ word, type: "Last miss", label: "Last lesson miss" })))
    .concat(priorityMisses.map((word) => ({ word, type: "Priority", label: "Group priority miss" })));
  const preferredWord = ttSection2Word || review[0] || current[0] || lastMisses[0] || priorityMisses[0] || "";
  const preferredIndex = ttSection2Deck.findIndex((card) => card.word === preferredWord);
  ttShowSection2Card(preferredIndex >= 0 ? preferredIndex : 0, skill.id);
}

function ttFillSection2BDisplayDeck(lesson, skill) {
  const review = lesson.sectionTwoReviewWordsB2 || [];
  const current = lesson.sectionTwoCurrentWordsB2 || [];
  ttSection2BDeck = review.map((word) => ({ word, type: "Review", label: "Day 2 review word" }))
    .concat(current.map((word) => ({ word, type: "Current", label: "Day 2 current word" })));
  const preferredIndex = ttSection2BDeck.findIndex((card) => card.word === ttSection2BWord);
  ttShowSection2BCard(preferredIndex >= 0 ? preferredIndex : 0, skill.id);
}

function ttShowSection2BCard(index, substep = ttLesson?.substep || ttActiveGroup().substep) {
  if (!ttSection2BDeck.length) {
    ttSection2BIndex = 0;
    ttShowSection2BWord("", substep, { preserveDeckIndex: true });
    return;
  }
  ttSection2BIndex = (index + ttSection2BDeck.length) % ttSection2BDeck.length;
  ttShowSection2BWord(ttSection2BDeck[ttSection2BIndex].word, substep, { preserveDeckIndex: true });
}

function ttShowSection2BWordByDeck(word, substep = ttLesson?.substep || ttActiveGroup().substep) {
  const index = ttSection2BDeck.findIndex((card) => card.word === word);
  if (index >= 0) ttShowSection2BCard(index, substep);
  else ttShowSection2BWord(word, substep);
}

function ttShowSection2BWord(word, substep, options = {}) {
  const display = ttById("ttSection2BDisplay");
  const hint = ttById("ttSection2BHint");
  if (!display || !hint) return;
  if (!options.preserveDeckIndex) {
    const deckIndex = ttSection2BDeck.findIndex((card) => card.word === word);
    if (deckIndex >= 0) ttSection2BIndex = deckIndex;
  }
  ttSection2BWord = word;
  display.innerHTML = "";
  if (!word) {
    display.innerHTML = "<span>Tap a Day 2 word</span>";
    ttRenderSection2BCount();
    hint.textContent = "One-syllable words show sound cards. Multisyllabic words show syllable cards.";
    ttRenderMarkedWords();
    return;
  }
  const cards = section2CardsForWord(word, substep);
  display.dataset.mode = cards.mode;
  display.dataset.count = String(cards.items.length);
  display.style.setProperty("--tile-count", String(Math.max(cards.items.length, 1)));
  display.classList.toggle("many-cards", cards.items.length >= 7);
  display.classList.toggle("crowded-cards", cards.items.length >= 9);
  display.classList.toggle("multi-syllable-cards", cards.mode === "syllables" && cards.items.length >= 4);
  display.classList.toggle("long-syllable-cards", cards.mode === "syllables" && cards.items.length >= 5);
  cards.items.forEach((item) => {
    const card = document.createElement("span");
    card.className = `build-card ${item.type}`;
    card.textContent = section2DisplayCardText(item);
    display.appendChild(card);
  });
  hint.textContent = cards.mode === "sounds"
    ? "Sound cards: yellow consonants, pink vowels, green glued/welded sounds."
    : "Syllable / word-part cards: bright yellow affixes and white syllable or Latin-base cards.";
  ttRenderSection2BCount();
  ttRenderMarkedWords();
}

function ttRenderSection2BCount() {
  const count = ttById("ttSection2BCount");
  if (!count) return;
  if (!ttSection2BDeck.length) {
    count.textContent = "0 of 0";
    return;
  }
  const card = ttSection2BDeck[ttSection2BIndex] || {};
  count.textContent = `${card.type || "Card"} ${ttSection2BIndex + 1} of ${ttSection2BDeck.length}`;
}

function ttShowSection2Card(index, substep = ttLesson?.substep || ttActiveGroup().substep) {
  if (!ttSection2Deck.length) {
    ttSection2Index = 0;
    ttShowSection2Word("", substep, { preserveDeckIndex: true });
    return;
  }
  ttSection2Index = (index + ttSection2Deck.length) % ttSection2Deck.length;
  const card = ttSection2Deck[ttSection2Index];
  ttShowSection2Word(card.word, substep, { preserveDeckIndex: true });
}

function ttShowSection2WordByDeck(word, substep = ttLesson?.substep || ttActiveGroup().substep) {
  const index = ttSection2Deck.findIndex((card) => card.word === word);
  if (index >= 0) ttShowSection2Card(index, substep);
  else ttShowSection2Word(word, substep);
}

function ttReplaceSimpleListWord(key, oldWord, pool = []) {
  if (!ttLesson || !Array.isArray(ttLesson[key])) return;
  ttForkSavedLessonDraft();
  ttLesson[key] = ttLesson[key].map((word) => word === oldWord ? ttPickReplacement(pool, ttLesson[key], oldWord) : word);
  ttSaveDraftLesson();
  ttRender();
}

function ttSentenceHfwPool() {
  const data = window.readerSentenceIndex?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || window.readerSentenceIndex?.[ttLesson?.substep]?.AB
    || {};
  return [...new Set(Object.values(data).flatMap((page) => page.h || page.highFrequency || page.highFrequencyWords || []))];
}

function ttRefreshSection(sectionNumber) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(group);
  const level = ttLesson.readerLevel || group.readerLevel || "AB";
  const seedIndex = Math.floor(Math.random() * 1000);
  if (sectionNumber === "2") {
    ttLesson.sectionTwoReviewWords = sectionTwoReviewWords(skill, level, true);
    ttLesson.sectionTwoCurrentWords = sectionTwoCurrentWords((ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []), true);
    delete ttLesson.sectionTwoLastMissedWords;
    delete ttLesson.sectionTwoPriorityMissedWords;
    ttEnsureSection2MissIndexes(ttLesson, group, skill);
    ttSection2Word = "";
  }
  if (sectionNumber === "2b") {
    const dayOneReview = new Set(ttLesson.sectionTwoReviewWords || []);
    const dayOneCurrent = new Set(ttLesson.sectionTwoCurrentWords || []);
    const reviewPool = uniqueWords(sectionTwoReviewWords(skill, level, true)
      .concat(dictationReviewWords(skill.id, level), priorDictationWords(skill.id, level)));
    const currentPool = uniqueWords((ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []));
    const nextReview = shuffled(reviewPool.filter((word) => !dayOneReview.has(word))).slice(0, 6);
    const nextCurrent = shuffled(currentPool.filter((word) => !dayOneCurrent.has(word))).slice(0, 6);
    ttLesson.sectionTwoReviewWordsB2 = nextReview.length ? nextReview : sectionTwoReviewWords(skill, level, true);
    ttLesson.sectionTwoCurrentWordsB2 = nextCurrent.length ? nextCurrent : sectionTwoCurrentWords(currentPool, true);
    ttSection2BWord = "";
  }
  if (sectionNumber === "3") {
    delete ttLesson.sectionThreeReviewWords;
    delete ttLesson.sectionThreeCurrentWords;
    ttCardIndex = 0;
  }
  if (sectionNumber === "4") {
    const assignment = ttChooseReaderPage(skill, "wordlist", ttLesson.wordlistPageNumber);
    if (!assignment) return;
    group.pageProgress ||= { wordlist: 0, sentences: 0, passage: 0 };
    group.pageProgress.wordlist = Math.max(0, assignment.index - 1);
    ttLesson.wordlistPageNumber = assignment.page;
    ttLesson.readerLevel = assignment.level;
    ttLesson.wordlistMeta = `Reader ${skill.reader}, p. ${assignment.page} - ${pagePositionLabel(assignment, "wordlist")}`;
    ttEnsureSection4PageIntegrity(ttLesson, skill, true);
    ttRerollEncodingSectionsForSelectedPage(skill);
  }
  if (sectionNumber === "5") {
    const assignment = ttChooseReaderPage(skill, "sentences", ttLesson.sentencePageNumber);
    if (!assignment) return;
    const sentencePageData = sentenceDataForPage(skill, assignment);
    ttLesson.sentencePageNumber = assignment.page;
    ttLesson.sentenceLevel = assignment.level;
    ttLesson.sentenceMeta = `Reader ${skill.reader}, p. ${assignment.page || "--"} - ${pagePositionLabel(assignment, "sentence")}`;
    ttLesson.highFrequencyWords = sentencePageData.highFrequency;
    ttLesson.readerSentences = sentencePageData.sentences;
  }
  if (sectionNumber === "6") {
    ttLesson.reverseDrillSeed = seedIndex;
    ttLesson.reverseDrillOverride = ttBuildReverseDrillOverride(skill, ttLesson);
  }
  if (sectionNumber === "7") {
    const sectionSeven = ttBuildSectionSevenWordSets(ttLesson, skill);
    ttLesson.sectionSevenReviewWords = sectionSeven.review;
    ttLesson.sectionSevenNonsenseWords = sectionSeven.nonsense;
    ttLesson.sectionSevenCurrentWords = sectionSeven.current;
    ttLesson.dictationPlanOverride = ttRerollDictationPlan(ttLesson, skill, {
      avoidWordKeys: ttSectionSevenWordKeys(ttLesson)
    });
  }
  if (sectionNumber === "8") {
    ttLesson.dictationPlanOverride = ttRerollDictationPlan(ttLesson, skill, {
      avoidWordKeys: ttSectionSevenWordKeys(ttLesson)
    });
  }
  if (sectionNumber === "9") {
    const passages = ttPassagesForSubstep(skill.id);
    if (passages.length) {
      const currentId = ttLesson.section9Story?.passageId || group.section9Story?.passageId;
      const currentIndex = Math.max(0, passages.findIndex((passage) => passage.id === currentId));
      const nextPassage = passages[(currentIndex + 1) % passages.length];
      const approach = ttLesson.section9Story?.approach || group.section9Story?.approach || "comprehension-sos";
      ttSaveSection9StoryForGroup(group, nextPassage.id, approach);
      ttApplySection9StoryToLesson(ttLesson, group, skill, { passageId: nextPassage.id, approach });
    }
  }
  ttSaveDraftLesson();
  ttRender();
  ttById(`section${sectionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttChooseReaderPage(skill, type, currentPage) {
  const level = ttLesson?.readerLevel || ttActiveGroup().readerLevel || "AB";
  const pages = pageList(skill, type, level);
  const resolved = resolvedLevel(skill, type, level);
  if (!pages.length) {
    alert("No Reader pages are listed for this section.");
    return null;
  }
  const label = type === "wordlist" ? "wordlist charting" : "sentence";
  const currentIndex = Math.max(0, pages.indexOf(currentPage));
  const pageLabels = type === "wordlist"
    ? pages.map((page) => `${page} (${chartingPageEntry(skill.id, resolved, page).count}/30)`).join(", ")
    : pages.join(", ");
  const promptText = `Choose ${label} page for Substep ${skill.id}\n\nType page number or page position 1-${pages.length}.\nPages: ${pageLabels}`;
  const response = prompt(promptText, String(currentPage || pages[currentIndex] || pages[0]));
  if (response === null) return null;
  const requested = Number(String(response).trim());
  if (!Number.isFinite(requested)) return null;
  let pageIndex = pages.indexOf(requested);
  if (pageIndex < 0 && requested >= 1 && requested <= pages.length) pageIndex = requested - 1;
  if (pageIndex < 0) {
    alert("That page is not listed for this substep/level.");
    return null;
  }
  return {
    reader: skill.reader,
    page: pages[pageIndex],
    level: resolved,
    index: pageIndex + 1,
    total: pages.length,
    position: `${pageIndex + 1} of ${pages.length}`
  };
}

function ttBuildReverseDrillOverride(skill, lesson) {
  const seed = Number(lesson.reverseDrillSeed || Date.now());
  const rotate = (items, count) => {
    const unique = [...new Set(items.filter(Boolean))];
    if (!unique.length) return [];
    const start = seed % unique.length;
    return unique.slice(start).concat(unique.slice(0, start)).slice(0, count);
  };
  const words = []
    .concat(lesson.sectionTwoCurrentWords || [])
    .concat(lesson.realWords || [])
    .concat(dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []));
  const text = words.join(" ").toLowerCase();
  const consonants = consonantSoundList(skill.id).filter((sound) => text.includes(sound.replace(/^-|-$/g, "").toLowerCase()));
  const welded = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(skill.id, step))
    .map(([, value]) => value)
    .filter((sound) => text.includes(sound.replace(/^-|-$/g, "").toLowerCase()));
  const elements = wordElementList(skill.id).filter((part) => text.includes(part.replace(/^-|-$/g, "").toLowerCase()));
  return []
    .concat(rotate(vowelSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(rotate(consonants.length ? consonants : consonantSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat(rotate(welded.length ? welded : knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(skill.id, step)).map(([, value]) => value), 3).map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat(rotate(elements.length ? elements : wordElementList(skill.id), 2).map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
}

function ttBuildSectionSevenWordSets(lesson, skill) {
  const currentPool = ttCurrentSectionSevenWordPool(lesson, skill);
  const reviewPool = ttReviewRealWordPool(lesson, skill);
  const nonsensePool = ttNonsenseWordPool(lesson, skill);
  const review = chooseWords(reviewPool, 5, true);
  const nonsense = chooseWords(nonsensePool, 3, true);
  const used = new Set(review.concat(nonsense).map(ttWordKey));
  const current = chooseWords(currentPool.filter((word) => !used.has(ttWordKey(word))), 5, true);
  return { review, nonsense, current };
}

function ttRealReaderLevel(level = "AB") {
  return level === "N" ? "AB" : level;
}

function ttKnownNonsenseWordKeys(lesson = {}, skill = null) {
  const currentSubstep = skill?.id || lesson.substep;
  const words = []
    .concat(lesson.nonsenseWords || [])
    .concat((lesson.readerLevel || "AB") === "N" ? (lesson.realWords || []) : [])
    .concat(currentSubstep ? readerNonsenseWordsFromSubstep(currentSubstep) : [])
    .concat(currentSubstep ? readerNonsenseWordsForReview(priorSubstep(currentSubstep), currentSubstep) : []);
  return new Set(words.map(ttWordKey).filter(Boolean));
}

function ttRealWordCandidates(words = [], lesson = {}, skill = null) {
  const nonsenseKeys = ttKnownNonsenseWordKeys(lesson, skill);
  return uniqueWords(words)
    .filter(isValidDictationWord)
    .filter((word) => !nonsenseKeys.has(ttWordKey(word)));
}

function ttNonsenseWordCandidates(words = [], lesson = {}, skill = null) {
  const nonsenseKeys = ttKnownNonsenseWordKeys(lesson, skill);
  const clean = uniqueWords(words).filter(isValidDictationWord);
  const known = clean.filter((word) => nonsenseKeys.has(ttWordKey(word)));
  return known.length ? known : clean;
}

function ttCurrentRealWordPool(lesson, skill) {
  const level = ttRealReaderLevel(lesson.readerLevel || "AB");
  const pageWords = (lesson.readerLevel || "AB") === "N" ? [] : (lesson.realWords || []);
  return ttRealWordCandidates(
    pageWords.concat(readerWordsFromSubstep(skill.id, level)),
    lesson,
    skill
  );
}

function ttReviewRealWordPool(lesson, skill) {
  const level = ttRealReaderLevel(lesson.readerLevel || "AB");
  const currentIndex = scopeMap.findIndex((item) => item.id === skill.id);
  const words = [];
  for (let index = currentIndex - 1; index >= 0 && words.length < 80; index -= 1) {
    words.push(...readerWordsFromSubstep(scopeMap[index].id, level));
  }
  return ttRealWordCandidates(words, lesson, skill);
}

function ttNonsenseWordPool(lesson, skill) {
  const level = lesson.readerLevel || "AB";
  const chartWords = level === "N" ? (lesson.realWords || []) : [];
  return ttNonsenseWordCandidates(
    chartWords
      .concat(lesson.nonsenseWords || [])
      .concat(threeNonsenseWords(skill.id, level))
      .concat(readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id)),
    lesson,
    skill
  );
}

function ttCurrentSectionSevenWordPool(lesson, skill) {
  const level = lesson.readerLevel || "AB";
  const currentChartWords = (lesson.realWords || []).concat(lesson.nonsenseWords || []);
  const fallbackReal = ttCurrentRealWordPool(lesson, skill);
  const fallbackNonsense = ttNonsenseWordPool(lesson, skill);
  return uniqueWords(currentChartWords.concat(fallbackReal, level === "N" ? fallbackNonsense : []))
    .filter(isValidDictationWord);
}

function ttSectionSevenSetsForLesson(lesson, skill) {
  if ((lesson.sectionSevenReviewWords || []).length
    || (lesson.sectionSevenNonsenseWords || []).length
    || (lesson.sectionSevenCurrentWords || []).length) {
    return {
      review: lesson.sectionSevenReviewWords || [],
      nonsense: lesson.sectionSevenNonsenseWords || [],
      current: lesson.sectionSevenCurrentWords || []
    };
  }
  return ttBuildSectionSevenWordSets(lesson, skill);
}

function ttSectionSevenWordKeys(lesson) {
  return new Set([]
    .concat(lesson.sectionSevenReviewWords || [])
    .concat(lesson.sectionSevenNonsenseWords || [])
    .concat(lesson.sectionSevenCurrentWords || [])
    .map(ttWordKey)
    .filter(Boolean));
}

function ttWordKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function ttWithoutWordKeys(words = [], avoidWordKeys = new Set()) {
  return (words || []).filter((word) => {
    const key = ttWordKey(word);
    return key && !avoidWordKeys.has(key);
  });
}

function ttRerollDictationPlan(lesson, skill, options = {}) {
  const avoidWordKeys = options.avoidWordKeys || new Set();
  return ttDictationPlan(lesson, skill, options).map((block) => {
    const rawPool = ttDictationReplacementPool(block.label, lesson, skill);
    const pool = /real words|nonsense/i.test(block.label || "")
      ? ttWithoutWordKeys(rawPool, avoidWordKeys)
      : rawPool;
    const fallbackValues = /real words|nonsense/i.test(block.label || "")
      ? ttWithoutWordKeys(block.values || [], avoidWordKeys)
      : block.values || [];
    const source = pool.length ? pool : fallbackValues;
    return {
      ...block,
      values: fillToCount(chooseWords(source, source.length, true), fallbackValues, (block.values || []).length)
    };
  });
}

function ttSanitizeDictationPlan(plan, lesson, skill, avoidWordKeys = new Set()) {
  return (plan || []).map((block) => {
    if (!/real words|nonsense/i.test(block.label || "")) return block;
    const pool = ttWithoutWordKeys(ttDictationReplacementPool(block.label, lesson, skill), avoidWordKeys);
    const poolKeys = new Set(pool.map(ttWordKey));
    const cleanValues = (block.values || []).filter((word) => {
      const key = ttWordKey(word);
      return key && poolKeys.has(key) && !avoidWordKeys.has(key);
    });
    return {
      ...block,
      values: fillToCount(cleanValues, pool, (block.values || []).length)
    };
  });
}

function ttShowCardByWord(word) {
  const index = ttCardDeck.findIndex((card) => card.word === word);
  ttShowCard(index >= 0 ? index : 0);
}

function ttShowCard(index) {
  if (!ttCardDeck.length) {
    ttById("ttCardDisplay").querySelector("strong").textContent = "No cards";
    ttById("ttCardLabel").textContent = "";
    ttById("ttCardDisplay").dataset.type = "";
    ttById("ttCardCount").textContent = "0 of 0";
    return;
  }
  ttCardIndex = (index + ttCardDeck.length) % ttCardDeck.length;
  const card = ttCardDeck[ttCardIndex];
  ttById("ttCardDisplay").querySelector("strong").textContent = card.word;
  ttById("ttCardLabel").textContent = card.label;
  ttById("ttCardDisplay").dataset.type = /hfw/i.test(card.type) ? "hfw" : card.type.toLowerCase();
  ttById("ttCardCount").textContent = `${ttCardIndex + 1} of ${ttCardDeck.length}`;
}

function toggleReviewWord(word, source) {
  const group = ttActiveGroup();
  group.markedReviewWords ||= [];
  const existing = group.markedReviewWords.find((item) => item.word === word);
  if (existing) {
    group.markedReviewWords = group.markedReviewWords.filter((item) => item.word !== word);
  } else {
    group.markedReviewWords.push({
      word,
      source,
      substep: group.substep,
      date: new Date().toISOString()
    });
  }
  saveState();
  ttRenderMarkedWords();
}

function isMarkedReviewWord(word) {
  const group = ttActiveGroup();
  return (group.markedReviewWords || []).some((item) => item.word === word);
}

function ttShowSection2Word(word, substep, options = {}) {
  const display = ttById("ttSection2Display");
  const hint = ttById("ttSection2Hint");
  const editor = ttById("ttSection2Editor");
  if (!display || !hint) return;
  if (!options.preserveDeckIndex) {
    const deckIndex = ttSection2Deck.findIndex((card) => card.word === word);
    if (deckIndex >= 0) ttSection2Index = deckIndex;
  }
  ttSection2Word = word;
  display.innerHTML = "";
  if (editor) editor.hidden = true;
  if (!word) {
    display.innerHTML = "<span>Tap a word</span>";
    ttRenderSection2Count();
    hint.textContent = "One-syllable words show sound cards. Multisyllabic words show syllable cards.";
    return;
  }
  const cards = section2CardsForWord(word, substep);
  display.dataset.mode = cards.mode;
  display.dataset.count = String(cards.items.length);
  display.style.setProperty("--tile-count", String(Math.max(cards.items.length, 1)));
  display.classList.toggle("many-cards", cards.items.length >= 7);
  display.classList.toggle("crowded-cards", cards.items.length >= 9);
  display.classList.toggle("multi-syllable-cards", cards.mode === "syllables" && cards.items.length >= 4);
  display.classList.toggle("long-syllable-cards", cards.mode === "syllables" && cards.items.length >= 5);
  cards.items.forEach((item) => {
    const card = document.createElement("span");
    card.className = `build-card ${item.type}`;
    card.textContent = section2DisplayCardText(item);
    display.appendChild(card);
  });
  hint.textContent = cards.mode === "sounds"
    ? "Sound cards: yellow consonants, pink vowels, green glued/welded sounds."
    : "Syllable / word-part cards: yellow affixes and white syllable or Latin-base cards.";
  ttRenderSection2Count();
  ttRenderMarkedWords();
}

function ttRenderSection2Count() {
  const count = ttById("ttSection2Count");
  if (!count) return;
  if (!ttSection2Deck.length) {
    count.textContent = "0 of 0";
    return;
  }
  const card = ttSection2Deck[ttSection2Index] || {};
  count.textContent = `${card.type || "Card"} ${ttSection2Index + 1} of ${ttSection2Deck.length}`;
}

function ttUseCustomSection2Word() {
  const input = ttById("ttSection2CustomWord");
  if (!input) return;
  const value = input.value.trim();
  if (!value) return;
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  const clean = cleanCardWord(value);
  if (!clean) return;
  if (/\s/.test(value.trim())) {
    const items = parseSection2CardInput(value, substep);
    if (items.length) {
      const overrides = section2CardOverrides();
      overrides[clean] = {
        mode: "syllables",
        items,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
    }
  }
  input.value = "";
  ttShowSection2Word(clean, substep);
}

function ttCurrentSection2Cards() {
  if (!ttSection2Word) return null;
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  return section2CardsForWord(ttSection2Word, substep);
}

function ttEditSection2Cards() {
  const editor = ttById("ttSection2Editor");
  const input = ttById("ttSection2EditInput");
  if (!editor || !input || !ttSection2Word) return;
  const cards = ttCurrentSection2Cards();
  input.value = cards?.items?.length ? cards.items.map(section2EditInputText).join(" ") : "";
  editor.hidden = false;
  input.focus();
  input.select();
}

function ttCancelSection2Edit() {
  const editor = ttById("ttSection2Editor");
  if (editor) editor.hidden = true;
}

function ttSaveSection2Cards() {
  const input = ttById("ttSection2EditInput");
  const editor = ttById("ttSection2Editor");
  if (!input || !ttSection2Word) return;
  const items = parseSection2CardInput(input.value, ttLesson?.substep || ttActiveGroup().substep);
  if (!items.length) return;
  const clean = cleanCardWord(ttSection2Word);
  const overrides = section2CardOverrides();
  overrides[clean] = {
    mode: section2ModeForItems(items),
    items,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
  input.value = "";
  if (editor) editor.hidden = true;
  ttShowSection2Word(ttSection2Word, ttLesson?.substep || ttActiveGroup().substep);
}

function section2CardOverrides() {
  try {
    return JSON.parse(localStorage.getItem("teachToday.section2CardOverrides.v1") || "{}");
  } catch {
    return {};
  }
}

function parseSection2CardInput(value, substep) {
  const matches = [...value.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
  const rawParts = matches.length ? matches : value.split(/[\s|,]+/).map((part) => part.trim()).filter(Boolean);
  return rawParts.map((part) => {
    const type = section2TypeForPart(part, substep);
    return { text: section2StoredCardText(part, type), type };
  });
}

function section2EditInputText(item) {
  const text = String(item?.text || "").trim();
  if (!text) return "";
  if (item.type === "prefix") return `${text.replace(/-+$/g, "")}-`;
  if (item.type === "suffix") return `-${text.replace(/^-+/g, "")}`;
  if (item.type === "latin") {
    const clean = text.replace(/^-+|-+$/g, "");
    return clean ? `-${clean}-` : text;
  }
  return text;
}

function section2DisplayCardText(item) {
  if (item.type === "prefix") return String(item.text || "").replace(/-+$/g, "");
  if (item.type === "suffix") return String(item.text || "").replace(/^-+/g, "");
  return item.text;
}

function section2StoredCardText(part, type) {
  const text = String(part || "").trim();
  if (type === "prefix") return text.replace(/-+$/g, "").toLowerCase();
  if (type === "suffix") return text.replace(/^-+/g, "").toLowerCase();
  return text.toLowerCase();
}

function section2TypeForPart(part, substep) {
  const clean = part.replace(/^-|-$/g, "").toLowerCase();
  if (part.endsWith("-") && knownPrefixValues(substep).includes(clean)) return "prefix";
  if (part.startsWith("-") && knownSuffixValues(substep).includes(clean)) return "suffix";
  if (part.startsWith("-") && part.endsWith("-")) return "latin";
  if (gluedSoundSet().has(clean)) return "glued";
  if (clean.length === 1) return "aeiou".includes(clean) ? "vowel" : "consonant";
  if (["ch", "ck", "sh", "th", "wh", "qu", "tch", "dge"].includes(clean)) return "consonant";
  return "syllable";
}

function section2ModeForItems(items) {
  return items.some((item) => ["syllable", "prefix", "latin"].includes(item.type)) ? "syllables" : "sounds";
}

function cleanCardWord(word) {
  return String(word || "").toLowerCase().replace(/[^a-z-]/g, "");
}

function ttSaveGeneratedLesson(lesson, group, skill, options = {}) {
  if (!lesson) return null;
  const now = new Date();
  const createdDate = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const createdTime = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const scheduledDate = lesson.scheduledDate || ttTodayKey();
  const scheduled = ttDateFromKey(scheduledDate);
  const dailyKey = scheduledDate;
  const existing = options.upsertDaily === false ? null : ttDailyPlanFor(group, scheduled);
  if (existing) {
    lesson.lessonSequence = existing.lessons?.[0]?.lessonSequence || lesson.lessonSequence || group.lessonSerial || 1;
    lesson.savedPlanId = existing.id;
    existing.lessons = [lesson];
    existing.savedAt = now.toISOString();
    existing.dailyKey = dailyKey;
    existing.title = ttLessonFileName(group, lesson, now);
    existing.tabLabel = ttLessonTabLabel(existing, group);
    existing.status = existing.status === "Complete" ? "Complete" : options.starting ? "In progress" : existing.hasStudentData ? "Taught" : (existing.status === "In progress" ? "In progress" : "Saved");
    existing.scheduledDate = scheduledDate;
    ttEnsureLessonWorkflow(existing, lesson, group);
    const day = ttPlanSessionDay(existing, lesson);
    existing.activeDay = day;
    existing.sessions[day] = { ...existing.sessions[day], date: scheduledDate, status: options.starting ? "In progress" : (existing.sessions[day]?.status || "Planned"), ...(options.starting ? { startedAt: existing.sessions[day]?.startedAt || now.toISOString() } : {}) };
    group.activeLessonPlanId = existing.status === "Complete" ? "" : existing.id;
    ttRecordPlanRevision(existing, lesson, options.reason || "Saved lesson");
    ttAddLessonTab(existing.id);
    delete appState.lessonDrafts[ttDraftKey(group)];
    saveState();
    ttUpdateSaveStatus(existing);
    return existing;
  }
  group.lessonSerial = (group.lessonSerial || 0) + 1;
  lesson.lessonSequence = group.lessonSerial;
  const plan = {
    id: `teach-plan-${Date.now()}`,
    title: ttLessonFileName(group, lesson, now),
    tabLabel: ttLessonTabLabel({ lessons: [lesson], savedAt: now.toISOString() }, group),
    created: `${createdDate} at ${createdTime}`,
    savedAt: now.toISOString(),
    dailyKey,
    scheduledDate,
    status: options.starting ? "In progress" : "Saved",
    substep: `${skill.id} - ${skill.title}`,
    source: "TeachToday",
    lessons: [lesson]
  };
  lesson.savedPlanId = plan.id;
  ttEnsureLessonWorkflow(plan, lesson, group);
  const day = ttPlanSessionDay(plan, lesson);
  plan.sessions[day] = { ...plan.sessions[day], date: scheduledDate, status: options.starting ? "In progress" : "Planned", ...(options.starting ? { startedAt: now.toISOString() } : {}) };
  group.activeLessonPlanId = plan.id;
  ttRecordPlanRevision(plan, lesson, options.reason || "Lesson created");
  group.history ||= [];
  group.history.push(plan);
  group.history = group.history.slice(-50);
  ttAddLessonTab(plan.id);
  delete appState.lessonDrafts[ttDraftKey(group)];
  saveState();
  ttUpdateSaveStatus(plan);
  return plan;
}

function ttSaveCurrentLesson(options = {}) {
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
  if (!ttLesson) ttLesson = createLesson(group, skill, 0, 1);
  ttEnsureSection2MissIndexes(ttLesson, group, skill);
  delete ttLesson.draftId;
  delete ttLesson.draftSavedAt;
  if (!ttLesson.savedPlanId) {
    ttSaveGeneratedLesson(ttLesson, group, skill, { ...options, upsertDaily: !ttLesson.forkedFromPlanId });
    if (options.render !== false) ttRender();
    return;
  }
  const plan = ttCurrentPlan();
  if (!plan) {
    ttLesson.savedPlanId = "";
    ttSaveGeneratedLesson(ttLesson, group, skill, options);
    if (options.render !== false) ttRender();
    return;
  }
  const now = new Date();
  plan.lessons = [ttLesson];
  plan.savedAt = now.toISOString();
  plan.dailyKey ||= ttPlanDayKey(now);
  plan.title = ttLessonFileName(group, ttLesson, now);
  plan.tabLabel = ttLessonTabLabel(plan, group);
  plan.status = plan.status === "Complete" ? "Complete" : options.starting ? "In progress" : plan.hasStudentData ? "Taught" : (plan.status === "In progress" ? "In progress" : "Saved");
  ttEnsureLessonWorkflow(plan, ttLesson, group);
  const day = ttPlanSessionDay(plan, ttLesson);
  plan.activeDay = day;
  plan.sessions[day] = { ...plan.sessions[day], date: ttLesson.scheduledDate || plan.sessions[day]?.date || ttTodayKey(), status: options.starting ? "In progress" : (plan.sessions[day]?.status || "Planned"), ...(options.starting ? { startedAt: plan.sessions[day]?.startedAt || now.toISOString() } : {}) };
  if (plan.status !== "Complete") group.activeLessonPlanId = plan.id;
  ttRecordPlanRevision(plan, ttLesson, options.reason || "Saved changes");
  ttAddLessonTab(plan.id);
  delete appState.lessonDrafts[ttDraftKey(group)];
  saveState();
  ttUpdateSaveStatus(plan);
  ttRenderLessonTabs();
  ttRenderSavedLessons(group);
}

function ttStartCurrentLesson() {
  if (!ttLesson) ttBuildLesson();
  ttLesson.scheduledDate ||= ttTodayKey();
  ttSaveCurrentLesson({ render: false, starting: true, reason: "Started teaching" });
  ttUpdateLessonLaunch(ttActiveGroup(), ttLesson);
  ttOpenTeachFlow({
    forceLaunch: true,
    presentation: true,
    afterOpen: () => {
      ttStartPaceGuide();
      ttSetAttendancePanel(true, { scroll: true, focus: true });
    }
  });
}

function ttNewLesson() {
  const group = ttActiveGroup();
  const openPlan = ttActiveOpenPlan(group);
  if (openPlan && openPlan.id !== ttLesson?.savedPlanId) {
    if (!confirm(`Lesson ${ttPlanLessonNumber(openPlan, openPlan.lessons?.[0], group)} is still unfinished. Keep it as incomplete and plan a new lesson?`)) return;
    openPlan.status = "Incomplete";
    group.activeLessonPlanId = "";
  } else if (openPlan && openPlan.id === ttLesson?.savedPlanId) {
    if (!confirm(`This lesson is still unfinished. Keep it as incomplete and plan a new lesson?`)) return;
    openPlan.status = "Incomplete";
    group.activeLessonPlanId = "";
  }
  ttSection2Word = "";
  ttLesson = ttBuildLesson();
  ttSaveDraftLesson({ status: false });
  history.replaceState(null, "", location.pathname);
  ttRender();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function ttPlanUrl(planId) {
  return `${location.pathname}?group=${encodeURIComponent(ttActiveGroup().id)}&plan=${encodeURIComponent(planId)}`;
}

function ttUpdateSaveStatus(plan) {
  const status = ttById("ttSaveStatus");
  if (!status || !plan) return;
  const lesson = plan.lessons?.[0];
  const page = lesson?.wordlistMeta || "";
  const savedDate = plan.savedAt ? new Date(plan.savedAt) : new Date();
  const date = savedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = savedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  status.textContent = `Saved: ${date} at ${time}${page ? ` - ${page}` : ""}`;
  const group = ttActiveGroup();
  const file = ttById("ttLessonFile");
  if (file && plan.lessons?.[0]) file.textContent = plan.title || ttLessonFileName(group, plan.lessons[0], savedDate);
}

function ttSetDraftSaveStatus(group = ttActiveGroup(), lesson = ttLesson) {
  const status = ttById("ttSaveStatus");
  if (status) {
    status.textContent = lesson?.forkedFromLessonTitle
      ? "Draft copy - original saved lesson is protected"
      : "Draft - click Save when this is the lesson you will use today";
  }
  const file = ttById("ttLessonFile");
  if (file && lesson) file.textContent = `Draft: ${ttLessonFileName(group, lesson)}`;
}

function ttMarkCurrentPlanHasData(lesson = ttLesson) {
  if (!lesson?.savedPlanId) return null;
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === lesson.savedPlanId);
  if (!plan) return null;
  plan.hasStudentData = true;
  if (plan.status !== "Complete") plan.status = "Taught";
  plan.lastStudentDataAt = new Date().toISOString();
  return plan;
}

function ttCurrentLessonRecordMeta(lesson = ttLesson) {
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === lesson?.savedPlanId);
  return {
    lessonId: lesson?.id || "",
    planId: plan?.id || lesson?.savedPlanId || "",
    lessonTitle: plan?.title || (lesson ? ttLessonFileName(group, lesson, plan?.savedAt ? new Date(plan.savedAt) : new Date()) : ""),
    lessonSavedAt: plan?.savedAt || ""
  };
}

function ttEnsureCurrentLessonSavedForData() {
  ttSaveCurrentLesson({ render: false });
  return ttMarkCurrentPlanHasData(ttLesson);
}

function ttOpenExportViewer({ url, title, filename, contentType = "pdf" }) {
  const overlay = ttById("ttExportViewer");
  const frame = ttById("ttExportViewerFrame");
  const titleEl = ttById("ttExportViewerTitle");
  if (!overlay || !frame) return;
  overlay._exportBlobUrl = url;
  overlay._exportFilename = filename;
  overlay._exportContentType = contentType;
  titleEl.textContent = title;
  frame.src = url;
  overlay.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
}

function ttCloseExportViewer() {
  const overlay = ttById("ttExportViewer");
  const frame = ttById("ttExportViewerFrame");
  if (!overlay) return;
  frame.src = "";
  overlay.setAttribute("hidden", "");
  document.body.style.overflow = "";
  if (overlay._exportBlobUrl) {
    URL.revokeObjectURL(overlay._exportBlobUrl);
    overlay._exportBlobUrl = null;
  }
}

function ttOpenPdfLessonPlan() {
  ttSaveCurrentLesson();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
  const plan = ttCurrentPlan();
  const savedDate = plan?.savedAt ? new Date(plan.savedAt) : new Date();
  // Remove auto-print script — the export viewer provides its own Print button
  const html = ttLessonPlanDocumentHtml(group, skill, ttLesson, plan, savedDate)
    .replace(/<script>\s*window\.addEventListener\("load"[^<]*<\/script>/s, "");
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const baseName = ttLessonExportBaseName(group, ttLesson, plan, savedDate);
  ttOpenExportViewer({
    url,
    title: group?.name ? `${group.name} — Lesson Plan` : "Lesson Plan",
    filename: `${baseName} - TT Lesson Plan.html`,
    contentType: "html"
  });
}

async function ttOpenWilsonLessonPlan() {
  return ttOpenWilsonLessonPlanPdf({ fillable: false });
}

async function ttOpenFillableWilsonLessonPlan() {
  return ttOpenWilsonLessonPlanPdf({ fillable: true });
}

async function ttOpenWilsonLessonPlanPdf({ fillable = false } = {}) {
  try {
    ttSaveCurrentLesson();
    const group = ttActiveGroup();
    const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
    const plan = ttCurrentPlan();
    const savedDate = plan?.savedAt ? new Date(plan.savedAt) : new Date();
    const pdfBytes = await ttBuildWilsonLessonPlanPdf(group, skill, ttLesson, plan, savedDate, { fillable });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const filename = `${ttLessonExportBaseName(group, ttLesson, plan, savedDate)} - ${fillable ? "Fillable Teach Today" : "Teach Today"}.pdf`;
    const label = fillable ? "Fillable Teach Today LP" : "Teach Today LP";
    ttOpenExportViewer({
      url,
      title: group?.name ? `${group.name} — ${label}` : label,
      filename,
      contentType: "pdf"
    });
  } catch (error) {
    console.error(error);
    alert(`Could not create the ${fillable ? "fillable lesson PDF" : "lesson plan PDF"}: ${error.message || error}`);
  }
}

async function ttBuildWilsonLessonPlanPdf(group, skill, lesson, plan, savedDate, options = {}) {
  if (!window.PDFLib?.PDFDocument) throw new Error("PDF helper did not load. Refresh Teach Today and try again.");
  if (!window.wilsonLessonPlanTemplateBase64) throw new Error("Wilson lesson plan template did not load.");
  const { PDFDocument, StandardFonts } = window.PDFLib;
  const templateBytes = ttBase64ToUint8Array(window.wilsonLessonPlanTemplateBase64);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const data = ttWilsonLessonPlanData(group, skill, lesson, plan, savedDate);

  Object.entries(data.text).forEach(([name, value]) => ttSetPdfTextField(form, name, value));
  data.checks.forEach((name) => ttCheckPdfField(form, name));
  form.updateFieldAppearances(font);
  if (!options.fillable) form.flatten();
  return pdfDoc.save();
}

function ttWilsonLessonPlanData(group, skill, lesson, plan, savedDate) {
  const date = savedDate.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" });
  const sounds = soundsForSubstep(skill.id);
  const dictationPlan = ttActiveDictationPlan(lesson, skill);
  const dictationBlock = (label) => dictationPlan.find((item) => item.label.toLowerCase().includes(label))?.values || [];
  const section6Targets = targetSoundItemsForLesson(lesson, skill);
  const section6ByGroup = (pattern) => section6Targets.filter((item) => pattern.test(item.group || "")).map((item) => item.value);
  const section9 = ttWilsonSection9PlanData(lesson, skill);
  const sectionSeven = ttSectionSevenSetsForLesson(lesson, skill);
  const part7Review = sectionSeven.review;
  const part7Current = sectionSeven.current;
  const part7Hfw = lesson.sectionSevenHfwWords || hfwWordsForSubstep(skill.id, lesson);
  // For group 45+45 lessons, §2B (Day 2 decoding concepts) has its own review/current words.
  // The PDF template has two dedicated boxes at the top-right of page 2:
  //   '1 Review Words'   rect=[265,739,412,774]  — §2B review words
  //   'Dict Current Words' rect=[414,740,573,775] — §2B current words
  const isGroupLesson = (lesson.lessonType === "group" || lesson.lessonType === "part1" || lesson.lessonType === "part2");
  const section2bReview = isGroupLesson ? (lesson.sectionTwoReviewWordsB2 || []) : [];
  const section2bCurrent = isGroupLesson ? (lesson.sectionTwoCurrentWordsB2 || []) : [];
  const section3Review = lesson.sectionThreeReviewWords || section3ReviewCards(lesson);
  const section3Current = lesson.sectionThreeCurrentWords || section3CurrentCards(lesson);
  const wordElements = dictationBlock("word elements");
  const phrases = dictationBlock("phrases");
  const sentences = dictationBlock("sentences");
  const concept = `${skill.title}: ${skill.target}`;
  const lessonNumber = lesson.lessonSequence || group.lessonSerial || "";
  const level = lesson.readerLevel || "AB";
  const notebookItems = ttNewNotebookItemsForSubstep(skill.id);
  const section3VocabularyWord = (section3Current || section3Review || []).find(Boolean) || "";
  const text = {
    "DATE": date,
    "Lesson Number": lessonNumber ? String(lessonNumber) : "",
    "Student Name/Group": (group.students || []).join(", "),
    "Substep": skill.id,
    "CONCEPTS TO WEAVE": concept,
    "TROUBLE SPOTS": ttWilsonTroubleSpots(group, lesson),
    "1 SQD Vowels": sounds.vowels,
    "1 SQD CONSONANTS": sounds.consonants,
    "1 SQD WELDED": sounds.welded,
    "1 SQD ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "1 SQD DRILL LEADER IF GROUP": (group.students || []).join(", "),
    "2 REVIEW CONCEPTS": `Review ${priorSubstep(skill.id)} and trouble patterns.`,
    "2 REVIEW WORDS": ttJoinLines((lesson.sectionTwoReviewWords || []).concat(lesson.sectionTwoLastMissedWords || [])),
    "2 CURRENT CONCEPTS": concept,
    "CURRENT WORDS 1": ttJoinLines((lesson.sectionTwoCurrentWords || lesson.realWords || []).concat(lesson.sectionTwoPriorityMissedWords || [])),
    "2 ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "3 SUBSTEPS": skill.id,
    "3 WC ACTIVITY": `Review: ${ttJoinWords(section3Review)}\nCurrent: ${ttJoinWords(section3Current)}`,
    "WC 3 ADD NEW TO NOTEBOOK": section3VocabularyWord,
    "3 WC HIGH FREQUENCY WORDS": ttJoinWords(lesson.highFrequencyWords),
    "4 WR Practice Page": lesson.wordlistPageNumber || "",
    "4 WR Charting Page": lesson.wordlistPageNumber || "",
    "4 WR Errors": ttWilsonChartingMisses(group, lesson),
    "4 WR Activity": `Chart ${level} ${lesson.chartHalf || "bottom"} half. Goal: 12/15 accurate; 14/15 fluency; 12/15 in 35 sec for automaticity.`,
    "5 SR Student Reader Page": lesson.sentencePageNumber || "",
    "5 SR Errors": "Mark missed words and notes during sentence reading.",
    "5 SR Notes": `HFW: ${ttJoinWords(lesson.highFrequencyWords)}\n${ttJoinLines((lesson.readerSentences || []).slice(0, 3))}`,
    "6 QD VOWELS": ttJoinWords(section6ByGroup(/sounds/i).slice(0, 5)),
    "6 QD CONSONANTS": ttJoinWords(section6ByGroup(/consonants|digraphs/i)),
    "6 QD WELDED": ttJoinWords(section6ByGroup(/welded|glued/i)),
    "6 QD WORD ELEMENTS": ttJoinWords(section6ByGroup(/pfx|sfx|element/i)),
    "1 Review Words": ttJoinLines(section2bReview),
    "Dict Current Words": ttJoinLines(section2bCurrent),
    "7 TR REVIEW CONCEPTS": `Review spelling patterns from ${priorSubstep(skill.id)}.`,
    "7 TR Review Words": ttJoinLines(part7Review),
    "7 TR CURRENT CONCEPTS": concept,
    "7 TR CURRENT WORDS": ttJoinLines(part7Current),
    "7 TR HIGH FREQUENCY WORDS": ttJoinWords(part7Hfw),
    "7 TR ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "8 WWD Sounds": ttJoinLines(dictationBlock("sounds")),
    "8 WWD Word Elements": ttJoinLines(wordElements),
    "8 WWD Real Words": ttJoinLines(dictationBlock("real words")),
    "8 WWD Nonsense Words": ttJoinLines(dictationBlock("nonsense")),
    "8 WWD HIGH FREQUENCY WORD PHRASES 1": phrases[0] || "",
    "8 WWD HIGH FREQUENCY WORD PHRASES 2": phrases[1] || "",
    "8 WWD HIGH FREQUENCY WORD PHRASES 3": phrases[2] || "",
    "8 WWD SENTENCES": ttJoinLines(sentences),
    "9 CTP DEVELOP ORAL EXPRESSIVE LANGUAGE SKILLS WITH RETELL": section9.retell,
    "9 CTP Source Student Reader Text": section9.source,
    "9 CTP Vocabulary": section9.vocabulary,
    "9 CTP Follow Up ?": section9.followUp,
    "10 LRF Sources": "",
    "10 LRF Title": "",
    "10 LRF Pages": "",
    "10 LRF Notes": ""
  };
  const checks = [
    "Introduction Check",
    "Word Type Real",
    level === "A" ? "4 WR Student Reader A Check" : level === "B" ? "4 WR Student Reader B Check" : "4 WR Student Reader AB Check",
    "4 WR Student Reader Real",
    lesson.chartHalf === "top" ? "4 WR Charting Page Top Check" : "4 WR Charting Page Bottom Check",
    level === "B" ? "5 SR Student Reader B" : "5 SR Student Reader AB",
    ...section9.checks
  ];
  return { text, checks };
}

function ttWilsonSection9PlanData(lesson, skill) {
  const story = lesson.section9Story || null;
  const companion = ttSection9CompanionFor(story?.passageId || story);
  const pageRange = story ? ttReaderPageRange(story) : `p. ${lesson.passagePageNumber || "--"}`;
  const level = (story?.level || lesson.passageLevel || lesson.readerLevel || "AB") === "B" ? "B" : "AB";
  const approach = story?.approach || "comprehension-sos";
  const vocabulary = (companion?.vocabulary || [])
    .slice(0, 6)
    .map((item) => [item.word, item.meaning].filter(Boolean).join(": "));
  const supportQuestions = companion?.questions?.support || [];
  const stretchQuestions = companion?.questions?.stretch || [];
  const followUp = [
    supportQuestions.length ? `Support: ${supportQuestions.slice(0, 3).map((item) => item.question || item).join(" | ")}` : "",
    stretchQuestions.length ? `Stretch: ${stretchQuestions.slice(0, 3).map((item) => item.question || item).join(" | ")}` : ""
  ].filter(Boolean);
  const checks = [
    "9 CTP Source Student Reader Check",
    level === "B" ? "9 CTP Source Student Reader B Check" : "9 CTP Source Student Reader AB Check",
    approach === "oral-fluency" ? "9 CTP Oral Fluency Repeated Reading" : "9 CTP Comp SOS Silent Oral"
  ];
  return {
    retell: story?.title || "Assigned Student Reader passage",
    source: pageRange,
    vocabulary: vocabulary.join("\n"),
    followUp: followUp.length ? followUp.join("\n") : [
      "What was this passage mostly about?",
      "What happened first, next, and last?",
      "What detail from the passage helped you understand the story?"
    ].join("\n"),
    checks
  };
}

function ttSetPdfTextField(form, name, value) {
  try {
    const field = form.getTextField(name);
    field.setText(ttPdfFieldText(value));
    if (String(value || "").length > 120 || String(value || "").includes("\n")) field.setFontSize(7.5);
    else field.setFontSize(9);
  } catch {
    /* Template field may not exist in older copies. */
  }
}

function ttCheckPdfField(form, name) {
  try {
    form.getCheckBox(name).check();
  } catch {
    /* Some button fields are radio-style in older template copies. */
  }
}

function ttPdfFieldText(value) {
  return ttPdfSafeText(String(value || "").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim());
}

function ttPdfSafeText(value) {
  const replacements = {
    "ă": "a",
    "ĕ": "e",
    "ĭ": "i",
    "ŏ": "o",
    "ŭ": "u",
    "ā": "a",
    "ē": "e",
    "ī": "i",
    "ō": "o",
    "ū": "u",
    "ü": "u",
    "ô": "aw",
    "’": "'",
    "“": "\"",
    "”": "\"",
    "–": "-",
    "—": "-",
    "•": "-"
  };
  return String(value || "").replace(/[^\x00-\x7F]/g, (char) => replacements[char] || "");
}

function ttJoinWords(values = []) {
  return (values || []).filter(Boolean).join(", ");
}

function ttJoinLines(values = []) {
  return (values || []).filter(Boolean).join("\n");
}

function ttNotebookNote(substep) {
  const elements = wordElementList(substep).slice(0, 6);
  return elements.length ? `Add/review: ${ttJoinWords(elements)}` : "Review current sound cards.";
}

function ttNewNotebookItemsForSubstep(substep) {
  const exact = ([introduced]) => introduced === substep;
  const items = []
    .concat(knownWeldedAndExceptions.filter(exact).map(([, value]) => value))
    .concat(knownPrefixes.filter(exact).map(([, value]) => value))
    .concat(knownLatinBases.filter(exact).map(([, value]) => value))
    .concat(knownSuffixes.filter(exact).map(([, value]) => value));
  const consonantAdditions = {
    "7.1": ["c=/s/", "g=/j/"],
    "7.2": ["ce", "ge", "dge"],
    "7.3": ["ph", "tch"]
  };
  return [...new Set(items.concat(consonantAdditions[substep] || []))];
}

function ttWilsonTroubleSpots(group, lesson) {
  const recentMisses = (group.chartResults || [])
    .slice(-5)
    .flatMap((record) => record.wrongWords || [])
    .slice(-8);
  const trouble = (group.trouble || []).concat(recentMisses);
  return [...new Set(trouble)].filter(Boolean).join(", ") || lesson.teacherMove || "";
}

function ttWilsonChartingMisses(group, lesson) {
  const today = new Date().toISOString().slice(0, 10);
  const records = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id)
    .filter((record) => record.substep === lesson.substep)
    .filter((record) => String(record.wordlistPage) === String(lesson.wordlistPageNumber || ""))
    .filter((record) => String(record.date || "").slice(0, 10) === today)
    .slice(-4);
  return records.flatMap((record) => {
    const misses = (record.wordRecords || [])
      .filter((item) => item.section === record.chartHalf && !item.correct)
      .map((item) => item.said ? `${item.word} -> ${item.said}` : item.word);
    return misses.length ? [`${record.student}: ${misses.join(", ")}`] : [];
  }).join("\n");
}

function ttBase64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function ttSafeFileName(value) {
  return String(value || "Teach Today Lesson").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function ttLessonExportBaseName(group, lesson, plan, savedDate) {
  return ttSafeFileName(plan?.title || ttLessonFileName(group, lesson, savedDate));
}

function ttLessonPlanDocumentHtml(group, skill, lesson, plan, savedDate) {
  const title = `${ttLessonExportBaseName(group, lesson, plan, savedDate)} - TT`;
  const date = savedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = savedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sounds = soundsForSubstep(skill.id);
  const section3Review = lesson.sectionThreeReviewWords || section3ReviewCards(lesson);
  const section3Current = lesson.sectionThreeCurrentWords || section3CurrentCards(lesson);
  const sectionSeven = ttSectionSevenSetsForLesson(lesson, skill);
  const part7Review = sectionSeven.review;
  const part7Nonsense = sectionSeven.nonsense;
  const part7Current = sectionSeven.current;
  const dictationPlan = ttActiveDictationPlan(lesson, skill);
  const section6Targets = targetSoundItemsForLesson(lesson, skill).map((item) => item.value);
  const isGroupLesson = (lesson.lessonType === "group" || lesson.lessonType === "part1" || lesson.lessonType === "part2");
  const section2bReview = isGroupLesson ? (lesson.sectionTwoReviewWordsB2 || []) : [];
  const section2bCurrent = isGroupLesson ? (lesson.sectionTwoCurrentWordsB2 || []) : [];
  const students = (group.students || []).map((student) => `<span>${escapeHtml(student)}</span>`).join("");
  const section9Companion = ttSection9CompanionFor(lesson.section9Story?.passageId || lesson.section9Story);
  const section9Vocab = (section9Companion?.vocabulary || []).slice(0, 6);
  const section9Support = (section9Companion?.questions?.support || []).slice(0, 3);
  const section9Stretch = (section9Companion?.questions?.stretch || []).slice(0, 3);
  const teacherNotes = [
    "Charting goal: 12+/15 accurate. Automaticity: 12+/15 under 35 sec. Fluency: 14+/15.",
    "Use AB by default for elementary. Drop to A for support or move to B for challenge.",
    lesson.teacherMove || ""
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e8f1f5;
      color: #142033;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      line-height: 1.25;
    }
    .print-actions {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px;
      background: #ffffff;
      border-bottom: 1px solid #cbd5e1;
    }
    .print-actions button {
      border: 1px solid #0f766e;
      border-radius: 999px;
      padding: 8px 14px;
      background: #0f766e;
      color: #fff;
      font-weight: 900;
      cursor: pointer;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      margin: 14px auto;
      padding: 0.34in;
      background: #fff;
      border: 1px solid #d1d5db;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
    }
    .cover {
      border: 2px solid #0f766e;
      border-radius: 6px;
      padding: 7px 10px;
      background: #dff7ec;
      text-align: center;
      font-size: 13px;
      font-weight: 950;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      margin: 10px 0 8px;
      border-left: 5px solid #0f766e;
      border-radius: 4px;
      padding: 9px 10px;
      background: #f8fafc;
    }
    .eyebrow {
      margin: 0 0 2px;
      color: #64748b;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; line-height: 1; }
    .subtitle { color: #334155; font-size: 12px; }
    .meta { text-align: right; color: #334155; font-size: 11px; font-weight: 800; }
    .skill-strip {
      margin-top: 7px;
      border-radius: 4px;
      padding: 7px 9px;
      background: #eaf5ef;
      color: #14532d;
      font-size: 11px;
      font-weight: 850;
    }
    .section {
      margin-top: 8px;
      border: 1px solid #cbd5e1;
      border-left: 5px solid var(--accent, #0f766e);
      border-radius: 5px;
      padding: 8px 10px;
      break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }
    .section-title h2 {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 15px;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
      padding: 2px 7px;
      background: var(--accent, #0f766e);
      color: #fff;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .ref {
      color: #64748b;
      font-size: 10px;
      font-weight: 850;
      text-align: right;
    }
    .note {
      margin-bottom: 6px;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 6px 8px;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 10.5px;
    }
    .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .grid4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
    .label {
      margin-bottom: 3px;
      color: #475569;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .small { color: #475569; font-size: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip {
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 3px 7px;
      background: #f8fafc;
      font-size: 11px;
      font-weight: 850;
    }
    .chip.green { border-color: #86efac; background: #f0fdf4; color: #14532d; }
    .chip.purple { border-color: #d8b4fe; background: #faf5ff; color: #6b21a8; }
    .word-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .word-grid li {
      min-height: 22px;
      border: 1px solid #dbe3ed;
      border-radius: 4px;
      padding: 3px 5px;
      background: #fbfdff;
      font-family: "Courier New", monospace;
      font-size: 11px;
      font-weight: 700;
    }
    .word-grid.chart { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .word-grid.chart li {
      display: grid;
      grid-template-columns: 23px 1fr;
      border-width: 0 0 1px;
      border-radius: 0;
      background: transparent;
      font-size: 12px;
    }
    .sentence-list {
      margin: 0;
      padding-left: 19px;
      font-size: 11px;
    }
    .sentence-list li {
      padding: 3px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .dictation-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .dictation-table th {
      width: 130px;
      color: #0f766e;
      text-align: left;
      vertical-align: top;
      font-size: 10px;
      text-transform: uppercase;
    }
    .dictation-table th, .dictation-table td {
      border: 1px solid #dbe3ed;
      padding: 5px 6px;
    }
    .write-lines {
      display: grid;
      gap: 5px;
      margin-top: 5px;
    }
    .write-lines span {
      display: block;
      min-height: 19px;
      border-bottom: 1px solid #cbd5e1;
    }
    .page-two { break-before: page; }
    @page { size: Letter; margin: 0.25in; }
    @media print {
      body { background: #fff; }
      .print-actions { display: none; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        border: 0;
        box-shadow: none;
        page-break-after: always;
      }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button type="button" onclick="window.print()">Print / Save PDF</button>
  </div>
  <main>
    <section class="page">
      <div class="cover">TT Lesson Plan | ${escapeHtml(skill.id)} | ${escapeHtml(group.name)} | ${escapeHtml(lesson.readerLevel || "AB")} | ${escapeHtml(date)}</div>
      <header class="hero">
        <div>
          <p class="eyebrow">Teach Today Structured Literacy Lesson</p>
          <h1>Substep ${escapeHtml(skill.id)} <span class="small">${escapeHtml(skill.title)}</span></h1>
          <p class="subtitle">${escapeHtml(skill.pattern)} | ${escapeHtml(lesson.day || "Lesson")}</p>
          <div class="skill-strip">Skill focus: ${escapeHtml(skill.teacherCue || lesson.focus || "Use controlled reading and spelling from today's substep.")}</div>
        </div>
        <div class="meta">
          <p>${escapeHtml(date)}</p>
          <p>${escapeHtml(time)}</p>
          <p>${escapeHtml(lesson.wordlistMeta || "")}</p>
          <p>${escapeHtml(group.name)}</p>
        </div>
      </header>

      ${ttPlanSection("1", "Sounds Quick Drill", lesson.substep, `
        <div class="grid2">
          ${ttPlanFact("Vowels", sounds.vowels)}
          ${ttPlanFact("Consonants", sounds.consonants)}
          ${ttPlanFact("Glued / Exceptions", sounds.welded)}
          ${ttPlanFact("Elements", `Prefixes: ${sounds.prefixes}; Suffixes: ${sounds.suffixes}; Latin bases: ${sounds.latinBases}`)}
        </div>
      `, "#2563eb")}

      ${ttPlanSection("2", "Teach & Review Concepts", lesson.wordlistMeta, `
        <div class="note"><strong>Teacher move:</strong> Build one current word. Ask students to identify the vowel/syllable type, mark word parts, then blend or read the full word.</div>
        <div class="grid4">
          <div>${ttPlanLabel("Review - prior concepts")}${ttPlanChips(lesson.sectionTwoReviewWords || [], "purple")}</div>
          <div>${ttPlanLabel("Current - from today's page")}${ttPlanChips(lesson.sectionTwoCurrentWords || [], "green")}</div>
          <div>${ttPlanLabel("Last lesson misses")}${ttPlanChips(lesson.sectionTwoLastMissedWords || [], "orange")}</div>
          <div>${ttPlanLabel("Group priority misses")}${ttPlanChips(lesson.sectionTwoPriorityMissedWords || [], "blue")}</div>
        </div>
      `, "#7c3aed")}

      ${ttPlanSection("3", "Word Cards Activity", `${lesson.substep} cards`, `
        <div class="grid2">
          <div>${ttPlanLabel("Review cards")}${ttPlanChips(section3Review, "purple")}</div>
          <div>${ttPlanLabel("Current cards")}${ttPlanChips(section3Current, "green")}</div>
        </div>
        <p class="small">Flash cards quickly. Ask: prefix? suffix? glued sound? Latin base? Circle or box the part with a finger.</p>
      `, "#f97316")}

      ${ttPlanSection("4", "Wordlist Charting", lesson.wordlistMeta, `
        <div class="grid2">
          <div>${ttPlanLabel("Top 15")}${ttPlanNumberedWords(lesson.realWords || [], "chart")}</div>
          <div>${ttPlanLabel("Bottom 15")}${ttPlanNumberedWords(lesson.nonsenseWords || [], "chart")}</div>
        </div>
        <div class="grid2 small" style="margin-top:6px;">
          <p><strong>Students:</strong> ${students || "__________"}</p>
          <p><strong>Score:</strong> ___/15 correct | ___ sec/15w | repeat / advance</p>
        </div>
      `, "#15803d")}

      ${ttPlanSection("5", "Sentence Reading", lesson.sentenceMeta, `
        ${ttPlanLabel("High-frequency words")}${ttPlanChips(lesson.highFrequencyWords || [], "green")}
        <ol class="sentence-list">${(lesson.readerSentences || []).slice(0, 10).map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join("") || "<li>Use assigned Reader sentence page.</li>"}</ol>
      `, "#365314")}
    </section>

    <section class="page page-two">
      ${isGroupLesson && (section2bReview.length || section2bCurrent.length) ? ttPlanSection("2B", "Teach & Review Concepts · Day 2", `${lesson.substep} Day 2 decoding`, `
        <div class="note"><strong>Day 2 — Encoding day opener:</strong> Briefly revisit decoding concepts before moving into spelling. Use these words to bridge from Day 1.</div>
        <div class="grid2">
          <div>${ttPlanLabel("Review words (Day 2)")}${ttPlanChips(section2bReview, "purple")}</div>
          <div>${ttPlanLabel("Current words (Day 2)")}${ttPlanChips(section2bCurrent, "green")}</div>
        </div>
      `, "#7c3aed") : ""}

      ${ttPlanSection("6", "Quick Drill in Reverse", `${lesson.substep} reverse drill`, `
        <div class="note">Dictate sounds and elements. Students repeat the sound/element and write it. Prioritize today’s target words and known trouble spots.</div>
        ${ttPlanLabel("Today's quick targets")}${ttPlanChips(section6Targets, "green")}
        <div class="write-lines"><span></span><span></span></div>
      `, "#2563eb")}

      ${ttPlanSection("7", "Teach & Review Concepts for Spelling", `${lesson.substep} spelling`, `
        <div class="grid3">
          <div>${ttPlanLabel("Review")}${ttPlanChips(part7Review, "purple")}</div>
          <div>${ttPlanLabel("Nonsense")}${ttPlanChips(part7Nonsense, "purple")}</div>
          <div>${ttPlanLabel("Current")}${ttPlanChips(part7Current, "green")}</div>
        </div>
        ${ttPlanLabel("High-frequency words")}${ttPlanChips(hfwWordsForSubstep(skill.id, lesson), "green")}
        <p class="small">Dictate one word at a time. Students segment syllables, tap sounds in each syllable, then spell with tiles or syllable cards.</p>
      `, "#ea580c")}

      ${ttPlanSection("8", "Dictation", `Dictation Book ${lesson.substep}`, `
        <table class="dictation-table">
          <tbody>
            ${dictationPlan.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td>${ttPlanChips(item.values || [], "")}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="write-lines"><span></span><span></span><span></span><span></span></div>
      `, "#b45309")}

      ${ttPlanSection("9", "Controlled Passage", lesson.section9Story?.title
        ? `${lesson.section9Story.title} - Reader ${lesson.section9Story.reader || lesson.reader}, ${lesson.section9Story.substep} ${lesson.section9Story.level}, ${ttReaderPageRange(lesson.section9Story)}`
        : `Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} (${lesson.passageLevel || lesson.readerLevel})`, `
        <p class="small"><strong>${escapeHtml(ttSection9ApproachLabel(lesson.section9Story?.approach))}</strong></p>
        <p class="small">${escapeHtml(lesson.passage || "Use the assigned Reader passage page. Preview three target words before reading.")}</p>
        ${ttPlanLabel("Pre-teach vocabulary")}
        <ul class="sentence-list">${section9Vocab.length
          ? section9Vocab.map((item) => `<li><strong>${escapeHtml(item.word)}</strong>: ${escapeHtml(item.meaning || item.whyPreteach || "")}</li>`).join("")
          : "<li>Draft passage vocabulary after reading the selected passage.</li>"}</ul>
        <div class="grid2">
          <div>
            ${ttPlanLabel("Support questions")}
            <ol class="sentence-list">${section9Support.length
              ? section9Support.map((item) => `<li>${escapeHtml(item.question || item)}</li>`).join("")
              : "<li>What was this passage mostly about?</li><li>What happened first, next, and last?</li><li>Show where you found your answer.</li>"}</ol>
          </div>
          <div>
            ${ttPlanLabel("Stretch questions")}
            <ol class="sentence-list">${section9Stretch.length
              ? section9Stretch.map((item) => `<li>${escapeHtml(item.question || item)}</li>`).join("")
              : "<li>What detail helped you understand the story?</li><li>What can you infer from the passage?</li><li>What does a key word mean in context?</li>"}</ol>
          </div>
        </div>
        <div class="write-lines"><span></span><span></span></div>
      `, "#0369a1")}

      ${ttPlanSection("10", "Comprehension / Wrap-Up", "notes", `
        <div class="grid2">
          <div>
            ${ttPlanLabel("Teacher reminders")}
            <ul class="sentence-list">${teacherNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
          </div>
          <div>
            ${ttPlanLabel("Notes / next lesson")}
            <div class="write-lines"><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
      `, "#0f766e")}
    </section>
  </main>
  <script>
    window.addEventListener("load", () => setTimeout(() => window.print(), 350));
  </script>
</body>
</html>`;
}

function ttPlanSection(number, title, ref, body, accent) {
  return `<section class="section" style="--accent:${accent};">
    <div class="section-title">
      <h2><span class="tag">Section ${number}</span>${escapeHtml(title)}</h2>
      <p class="ref">${escapeHtml(ref || "")}</p>
    </div>
    ${body}
  </section>`;
}

function ttPlanFact(label, value) {
  return `<div><p class="label">${escapeHtml(label)}</p><p class="small">${escapeHtml(value || "n/a")}</p></div>`;
}

function ttPlanLabel(label) {
  return `<p class="label">${escapeHtml(label)}</p>`;
}

function ttPlanChips(values = [], color = "") {
  const items = (values || []).filter(Boolean);
  if (!items.length) return `<div class="chips"><span class="chip">n/a</span></div>`;
  return `<div class="chips">${items.map((value) => `<span class="chip ${color}">${escapeHtml(value)}</span>`).join("")}</div>`;
}

function ttPlanNumberedWords(words = [], mode = "") {
  const items = (words || []).slice(0, 15);
  return `<ol class="word-grid ${mode}">${items.map((word, index) => `<li><span>${index + 1}.</span><strong>${escapeHtml(word)}</strong></li>`).join("")}</ol>`;
}

const ttCloudSyncFileName = "teach-today-cloud-sync.json";
const ttCloudSyncDbName = "teachTodayCloudSync.v1";
const ttCloudSyncStore = "handles";
const ttCloudSyncHandleKey = "syncDirectory";
let ttCloudSyncTimer = null;
let ttCloudSyncBusy = false;
let ttCloudSyncPending = false;

const ttFirebaseConfig = {
  apiKey: "AIzaSyAQxODRvRAINGXfSxlqTxiyhkeisIPQLEs",
  authDomain: "teach-today-35149.firebaseapp.com",
  projectId: "teach-today-35149",
  storageBucket: "teach-today-35149.firebasestorage.app",
  messagingSenderId: "506415947825",
  appId: "1:506415947825:web:9415befdc50d928eccb510"
};
const ttFirebaseSdkVersion = "10.12.5";
const ttFirebaseChunkSize = 350000;
const ttDriveScope = "https://www.googleapis.com/auth/drive.file";
const ttDriveFolderName = "Teach Today Recordings";
let ttFirebaseSdkPromise = null;
let ttFirebaseTimer = null;
let ttFirebaseBusy = false;
let ttFirebasePending = false;
let ttFirebaseUser = null; // set after Google sign-in
let ttDriveAccessToken = "";
let ttDriveFolderId = localStorage.getItem("teachToday.driveFolderId") || "";
let ttWorkOffline = localStorage.getItem("teachToday.workOffline") === "true";

// Returns the Firestore doc path: per-user when signed in, legacy path as fallback
function ttFirebaseDocPath() {
  if (ttFirebaseUser) return ["users", ttFirebaseUser.uid, "teachTodaySync", "main"];
  return ["teachTodaySync", "main"];
}

function ttBackupPayload(now = new Date()) {
  return {
    kind: "TeachTodayBackup",
    version: 1,
    exportedAt: now.toISOString(),
    appState,
    section2CardOverrides: section2CardOverrides()
  };
}

function ttBackupFileStamp(date = new Date()) {
  const year = date.getFullYear();
  const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const monthName = date.toLocaleString("en-US", { month: "short" });
  const hour12 = date.getHours() % 12 || 12;
  const hour = String(hour12).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const meridiem = date.getHours() >= 12 ? "pm" : "am";
  return `${year}-${monthNumber}-${day}-${monthName}-${hour}-${minute}-${meridiem}`;
}

async function ttFirebaseSdk() {
  if (ttFirebaseSdkPromise) return ttFirebaseSdkPromise;
  ttFirebaseSdkPromise = Promise.all([
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-storage.js`)
  ]).then(([appModule, firestoreModule, authModule, storageModule]) => {
    const firebaseApp = appModule.initializeApp(ttFirebaseConfig);
    const firestoreDb = firestoreModule.getFirestore(firebaseApp);
    const firebaseAuth = authModule.getAuth(firebaseApp);
    const firebaseStorage = storageModule.getStorage(firebaseApp);
    return { ...firestoreModule, ...authModule, ...storageModule, firestoreDb, firebaseAuth, firebaseStorage };
  });
  return ttFirebaseSdkPromise;
}

// Upload one audio blob to Firebase Storage; saves the download URL back into the record
function ttPatchAudioRecord(recordId, patch, options = {}) {
  const record = (appState.masterRecords || []).find((item) => item.id === recordId);
  if (!record) return null;
  Object.assign(record, patch);
  saveState();
  if (options.sync !== false && ttFirebaseUser) ttQueueFirebaseSync();
  return record;
}

async function ttUploadAudioToStorage(recordId, blob) {
  if (!ttFirebaseUser) {
    ttPatchAudioRecord(recordId, {
      audioUploadStatus: "local-only",
      audioUploadMessage: "Sign in to Sync on the original recording device to upload this audio."
    }, { sync: false });
    return null;
  }
  if (!blob) {
    ttPatchAudioRecord(recordId, {
      audioUploadStatus: "missing-local-file",
      audioUploadMessage: "The local audio file was not found on this device."
    });
    return null;
  }
  try {
    ttPatchAudioRecord(recordId, {
      audioUploadStatus: "uploading",
      audioUploadMessage: "Uploading audio to Firebase Storage."
    }, { sync: false });
    const { firebaseStorage, ref, uploadBytes, getDownloadURL } = await ttFirebaseSdk();
    const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
    const path = `users/${ttFirebaseUser.uid}/recordings/${recordId}.${ext}`;
    const storageRef = ref(firebaseStorage, path);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    ttPatchAudioRecord(recordId, {
      audioUrl: url,
      audioUploadStatus: "cloud-ready",
      audioUploadMessage: "Audio uploaded and ready on synced devices.",
      audioUploadedAt: new Date().toISOString()
    }, { sync: false });
    await ttFirebaseSyncWrite("Saved recording audio link to Firebase.");
    return url;
  } catch (err) {
    console.warn("Audio upload to Firebase Storage failed:", err);
    ttPatchAudioRecord(recordId, {
      audioUploadStatus: "failed",
      audioUploadMessage: `Firebase Storage upload failed: ${err?.code || err?.message || "unknown error"}`
    });
    return null;
  }
}
window.ttUploadAudioToStorage = ttUploadAudioToStorage;

function ttDriveHeaders(contentType = "application/json") {
  const headers = { Authorization: `Bearer ${ttDriveAccessToken}` };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function ttFriendlyDriveError(err) {
  const message = String(err?.message || err || "unknown error");
  const apiEnableUrl = "https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=506415947825";
  if (message.includes("SERVICE_DISABLED") || message.includes("has not been used in project")) {
    return `Google Drive API is not enabled yet. Enable it here: ${apiEnableUrl}`;
  }
  if (message.includes("PERMISSION_DENIED")) {
    return "Google Drive permission was denied. Open Records and connect Google Drive audio again.";
  }
  if (message.includes("401") || message.includes("invalid_token")) {
    return "Google Drive permission expired. Open Records and connect Google Drive audio again.";
  }
  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

async function ttEnsureDrivePermission() {
  if (ttDriveAccessToken) return true;
  const { firebaseAuth, GoogleAuthProvider, signInWithPopup } = await ttFirebaseSdk();
  const provider = new GoogleAuthProvider();
  provider.addScope(ttDriveScope);
  const result = await signInWithPopup(firebaseAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  ttDriveAccessToken = credential?.accessToken || "";
  if (ttDriveAccessToken) {
    localStorage.setItem("teachToday.driveStatus", "Google Drive audio is connected.");
    ttRenderDataCenter();
  }
  return Boolean(ttDriveAccessToken);
}

async function ttDriveRequest(path, options = {}) {
  if (!(await ttEnsureDrivePermission())) throw new Error("Google Drive permission was not granted.");
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: { ...ttDriveHeaders(options.contentType), ...(options.headers || {}) }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Drive request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

async function ttDriveUploadMultipart(metadata, blob) {
  if (!(await ttEnsureDrivePermission())) throw new Error("Google Drive permission was not granted.");
  const boundary = `teach_today_${Date.now()}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${blob.type || "audio/webm"}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: ttDriveHeaders(body.type),
    body
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Drive upload failed (${response.status}): ${detail}`);
  }
  return response.json();
}

async function ttDriveCreateMetadata(metadata) {
  return ttDriveRequest("files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify(metadata)
  });
}

async function ttDriveFolder() {
  if (ttDriveFolderId) return ttDriveFolderId;
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    "name='Teach Today Recordings'",
    "trashed=false"
  ].join(" and ");
  const result = await ttDriveRequest(`files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)&pageSize=1`);
  ttDriveFolderId = result.files?.[0]?.id || "";
  if (!ttDriveFolderId) {
    const folder = await ttDriveCreateMetadata({
      name: ttDriveFolderName,
      mimeType: "application/vnd.google-apps.folder"
    });
    ttDriveFolderId = folder.id || "";
  }
  if (ttDriveFolderId) localStorage.setItem("teachToday.driveFolderId", ttDriveFolderId);
  return ttDriveFolderId;
}

async function ttUploadAudioToDrive(recordId, blob, fileName) {
  if (!blob || !fileName) return null;
  if (!ttDriveAccessToken) {
    ttPatchAudioRecord(recordId, {
      driveUploadStatus: "queued",
      driveUploadMessage: "Connect Google Drive audio from Records to upload this file."
    }, { sync: false });
    return null;
  }
  try {
    ttPatchAudioRecord(recordId, {
      driveUploadStatus: "uploading",
      driveUploadMessage: "Uploading audio to Google Drive."
    }, { sync: false });
    const folderId = await ttDriveFolder();
    const file = await ttDriveUploadMultipart({
      name: fileName,
      parents: folderId ? [folderId] : undefined,
      mimeType: blob.type || "audio/webm"
    }, blob);
    ttPatchAudioRecord(recordId, {
      driveFileId: file.id,
      driveFileName: file.name || fileName,
      driveWebViewLink: file.webViewLink || "",
      driveUploadStatus: "cloud-ready",
      driveUploadMessage: "Audio uploaded to Google Drive.",
      driveUploadedAt: new Date().toISOString()
    }, { sync: false });
    await ttFirebaseSyncWrite("Saved Google Drive recording link.");
    localStorage.setItem("teachToday.driveStatus", "Audio uploaded to Google Drive.");
    ttRenderDataCenter();
    return file.id;
  } catch (err) {
    console.warn("Audio upload to Google Drive failed:", err);
    const friendlyError = ttFriendlyDriveError(err);
    ttPatchAudioRecord(recordId, {
      driveUploadStatus: "failed",
      driveUploadMessage: `Google Drive upload failed: ${friendlyError}`
    });
    localStorage.setItem("teachToday.driveStatus", `Google Drive audio failed: ${friendlyError}`);
    ttShowConnectionNotice(`Google Drive audio could not upload: ${friendlyError}`);
    ttRenderDataCenter();
    return null;
  }
}
window.ttUploadAudioToDrive = ttUploadAudioToDrive;

async function ttUploadPendingAudioToDrive() {
  const pending = (appState.masterRecords || []).filter((record) => record.audioRecordingId && record.audioFileName && !record.driveFileId);
  if (!pending.length) {
    localStorage.setItem("teachToday.driveStatus", "Google Drive audio is connected. No local recordings need upload.");
    ttRenderDataCenter();
    return;
  }
  if (!(await ttEnsureDrivePermission())) return;
  localStorage.setItem("teachToday.driveStatus", `Uploading ${pending.length} recording(s) to Google Drive...`);
  ttRenderDataCenter();
  for (const record of pending) {
    const blob = await window.loadAudioBlob?.(record.audioRecordingId).catch(() => null);
    if (blob) await ttUploadAudioToDrive(record.audioRecordingId, blob, record.audioFileName);
  }
}

// On sign-in, upload any recordings that are in IndexedDB but never reached Firebase Storage
async function ttUploadPendingAudioRecordings() {
  if (!ttFirebaseUser) return;
  const pending = (appState.masterRecords || []).filter((r) => r.audioRecordingId && !r.audioUrl);
  if (!pending.length) return;
  console.log(`[Teach Today] Uploading ${pending.length} pending recording(s) to Firebase Storage…`);
  for (const record of pending) {
    const blob = await window.loadAudioBlob?.(record.audioRecordingId).catch(() => null);
    if (blob) await ttUploadAudioToStorage(record.audioRecordingId, blob).catch(() => {});
  }
}

// ── Audio → cloud sync folder ────────────────────────────────────────────────
// Saves audio files into the same local folder used for JSON backups.
// If that folder lives inside iCloud Drive, Dropbox, or Google Drive,
// the files sync to other devices automatically — no extra cost.
async function ttSaveAudioToSyncFolder(recordId, blob, fileName) {
  try {
    const handle = await ttCloudSyncGetValue(ttCloudSyncHandleKey);
    if (!handle) return; // sync folder not connected
    const hasPermission = await ttCloudSyncPermission(handle, true, false);
    if (!hasPermission) return;
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    // Mark the record with the filename so the student profile can find it
    const record = (appState.masterRecords || []).find((r) => r.id === recordId);
    if (record) {
      record.audioSyncFile = fileName;
      saveState();
      ttQueueFirebaseSync();
    }
  } catch (err) {
    console.warn("Audio save to sync folder failed:", err);
  }
}
window.ttSaveAudioToSyncFolder = ttSaveAudioToSyncFolder;

async function ttSavePendingAudioToSyncFolder() {
  const pending = (appState.masterRecords || []).filter((record) => record.audioRecordingId && record.audioFileName && !record.audioSyncFile);
  if (!pending.length) return;
  for (const record of pending) {
    const blob = await window.loadAudioBlob?.(record.audioRecordingId).catch(() => null);
    if (blob) await ttSaveAudioToSyncFolder(record.audioRecordingId, blob, record.audioFileName);
  }
}

async function ttFirebaseReadPayload() {
  if (!ttFirebaseUser) return null;
  const { firestoreDb, doc, getDoc } = await ttFirebaseSdk();
  const path = ttFirebaseDocPath();
  const snapshot = await getDoc(doc(firestoreDb, ...path));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data?.payload) return data.payload;
  if (!data?.chunkCount) return null;
  const chunks = [];
  for (let index = 0; index < data.chunkCount; index += 1) {
    const id = String(index).padStart(4, "0");
    const chunkPath = data.revisionId
      ? [...path, "revisions", data.revisionId, "chunks", id]
      : [...path, "chunks", id];
    const chunkSnapshot = await getDoc(doc(firestoreDb, ...chunkPath));
    if (!chunkSnapshot.exists()) {
      const error = new Error(`Firebase backup chunk ${id} is missing.`);
      error.code = "teach-today/corrupt-chunks";
      error.remoteExportedAt = data.exportedAt || "";
      throw error;
    }
    chunks.push(chunkSnapshot.data()?.text || "");
  }
  try {
    return JSON.parse(chunks.join(""));
  } catch (error) {
    error.code = "teach-today/corrupt-chunks";
    error.remoteExportedAt = data.exportedAt || "";
    throw error;
  }
}

async function ttFirebaseRestoreIfNewer() {
  const payload = await ttFirebaseReadPayload();
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  if (!ttShouldRestorePayload(payload)) return false;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
  if (payload.section2CardOverrides) {
    localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
  }
  localStorage.setItem("teachToday.lastFirebaseSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.firebaseSyncStatus", "Loaded newer Firebase data.");
  location.reload();
  return true;
}

async function ttFirebaseSyncWrite(reason = "Saved to Firebase.") {
  if (!ttFirebaseUser) return; // require sign-in
  if (ttFirebaseBusy) {
    ttFirebasePending = true;
    return;
  }
  ttFirebaseBusy = true;
  let syncConflict = false;
  try {
    let remotePayload = null;
    let remoteExportedAt = "";
    try {
      remotePayload = await ttFirebaseReadPayload();
      remoteExportedAt = remotePayload?.exportedAt || "";
    } catch (readError) {
      if (readError?.code !== "teach-today/corrupt-chunks") throw readError;
      remoteExportedAt = readError.remoteExportedAt || "";
      localStorage.setItem("teachToday.firebaseSyncStatus", "Repairing an interrupted legacy Firebase sync from this browser's intact local copy...");
      ttRenderDataCenter();
    }
    if (ttShouldRestorePayload(remotePayload)) {
      await ttFirebaseRestoreIfNewer();
      return;
    }
    const { firestoreDb, doc, setDoc, serverTimestamp, runTransaction } = await ttFirebaseSdk();
    const path = ttFirebaseDocPath();
    const now = new Date();
    const payload = ttBackupPayload(now);
    const serialized = JSON.stringify(payload);
    const chunkCount = Math.ceil(serialized.length / ttFirebaseChunkSize);
    const revisionToken = crypto.randomUUID?.().slice(0, 8) || Math.random().toString(16).slice(2, 10);
    const revisionId = `${now.getTime()}-${revisionToken}`;
    for (let index = 0; index < chunkCount; index += 1) {
      const id = String(index).padStart(4, "0");
      await setDoc(doc(firestoreDb, ...path, "revisions", revisionId, "chunks", id), {
        index,
        text: serialized.slice(index * ttFirebaseChunkSize, (index + 1) * ttFirebaseChunkSize)
      });
    }
    const mainRef = doc(firestoreDb, ...path);
    await runTransaction(firestoreDb, async (transaction) => {
      const currentSnapshot = await transaction.get(mainRef);
      const currentExportedAt = currentSnapshot.exists() ? (currentSnapshot.data()?.exportedAt || "") : "";
      if (currentExportedAt !== remoteExportedAt) {
        const conflict = new Error("Another signed-in browser saved newer Teach Today data.");
        conflict.code = "teach-today/sync-conflict";
        throw conflict;
      }
      transaction.set(mainRef, {
        kind: "TeachTodayFirebaseSync",
        version: 3,
        revisionId,
        updatedAt: serverTimestamp(),
        exportedAt: payload.exportedAt,
        chunkCount,
        chunkSize: ttFirebaseChunkSize,
        byteLength: new Blob([serialized]).size
      });
    });
    localStorage.setItem("teachToday.lastFirebaseSyncAt", now.toISOString());
    localStorage.setItem("teachToday.firebaseSyncStatus", reason);
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    if (detail === "teach-today/sync-conflict") {
      syncConflict = true;
      ttFirebasePending = false;
      localStorage.setItem("teachToday.firebaseSyncStatus", "Another signed-in browser saved newer data. This tab did not overwrite it. Refresh before continuing here.");
      ttShowConnectionNotice("Another signed-in browser saved newer Teach Today data. This tab did not overwrite it. Refresh before continuing here.");
      return;
    }
    console.warn("Teach Today Firebase sync failed:", error);
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase could not save (${detail}).`);
    ttShowConnectionNotice(`Firebase could not save right now (${detail}). You can keep trying or work offline.`);
  } finally {
    ttFirebaseBusy = false;
    ttRenderDataCenter();
    if (ttFirebasePending && !syncConflict) {
      ttFirebasePending = false;
      ttQueueFirebaseSync();
    }
  }
}

async function ttSecureLegacyStudentData() {
  if (!ttFirebaseUser) {
    localStorage.setItem("teachToday.firebaseSyncStatus", "Sign in with Google before securing legacy student records.");
    ttRenderDataCenter();
    return;
  }
  const button = ttById("ttSecureLegacyStudentData");
  if (button) {
    button.disabled = true;
    button.textContent = "Securing student records…";
  }
  try {
    const { firestoreDb, collection, getDocs, doc, setDoc, serverTimestamp } = await ttFirebaseSdk();
    const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
    const localStudents = new Map();
    (appState.groups || []).forEach((group) => {
      (group.students || []).forEach((name) => {
        const roster = (appState.rosterStudents || []).find((item) => item.studentId === group.studentIds?.[name]
          || normalize(item.name || item.fullName) === normalize(name));
        const key = `${group.id}::${normalize(name)}`;
        localStudents.set(key, { groupId: group.id, name, studentId: roster?.studentId || group.studentIds?.[name] || "" });
      });
    });

    const studentSnapshot = await getDocs(collection(firestoreDb, "students"));
    const studentClaims = [];
    const claimedStudentIds = new Set();
    for (const studentDoc of studentSnapshot.docs) {
      const data = studentDoc.data();
      const names = [data.name, data.fullName].map(normalize).filter(Boolean);
      const matchesLocal = names.some((name) => localStudents.has(`${data.groupId || ""}::${name}`));
      if (!matchesLocal && ![...localStudents.values()].some((item) => item.studentId && item.studentId === studentDoc.id)) continue;
      studentClaims.push(studentDoc.id);
      claimedStudentIds.add(studentDoc.id);
    }

    const codeSnapshot = await getDocs(collection(firestoreDb, "studentCodes"));
    const codeClaims = [];
    for (const codeDoc of codeSnapshot.docs) {
      if (!claimedStudentIds.has(codeDoc.data().studentId)) continue;
      codeClaims.push(codeDoc.id);
    }

    const linkSnapshot = await getDocs(collection(firestoreDb, "studentLinks"));
    const linkClaims = [];
    for (const linkDoc of linkSnapshot.docs) {
      if (!claimedStudentIds.has(linkDoc.data().studentId)) continue;
      linkClaims.push(linkDoc.id);
    }

    if (!studentClaims.length) {
      localStorage.setItem("teachToday.firebaseSyncStatus", "Privacy migration found no matching legacy student records. Nothing was changed.");
      return;
    }

    const approved = window.confirm(
      `Ready to secure ${studentClaims.length} student record(s), ${codeClaims.length} code(s), and ${linkClaims.length} link(s) for the signed-in teacher account. No records will be deleted. Continue?`
    );
    if (!approved) {
      localStorage.setItem("teachToday.firebaseSyncStatus", "Privacy migration preview canceled. Nothing was changed.");
      return;
    }

    for (const studentId of studentClaims) {
      await setDoc(doc(firestoreDb, "students", studentId), {
        teacherUid: ttFirebaseUser.uid,
        privacyMigratedAt: serverTimestamp()
      }, { merge: true });
    }

    for (const codeId of codeClaims) {
      await setDoc(doc(firestoreDb, "studentCodes", codeId), {
        teacherUid: ttFirebaseUser.uid,
        privacyMigratedAt: serverTimestamp()
      }, { merge: true });
    }

    for (const linkId of linkClaims) {
      await setDoc(doc(firestoreDb, "studentLinks", linkId), {
        teacherUid: ttFirebaseUser.uid,
        privacyMigratedAt: serverTimestamp()
      }, { merge: true });
    }

    const receipt = {
      completedAt: new Date().toISOString(),
      teacherUid: ttFirebaseUser.uid,
      students: claimedStudentIds.size,
      codes: codeClaims.length,
      links: linkClaims.length
    };
    localStorage.setItem("teachToday.privacyMigrationReceipt", JSON.stringify(receipt));
    localStorage.setItem("teachToday.firebaseSyncStatus", `Privacy migration secured ${receipt.students} student record(s), ${receipt.codes} code(s), and ${receipt.links} link(s).`);
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    localStorage.setItem("teachToday.firebaseSyncStatus", `Privacy migration could not finish (${detail}). No records were deleted.`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Secure legacy student records";
    }
    ttRenderDataCenter();
  }
}

function ttQueueFirebaseSync() {
  clearTimeout(ttFirebaseTimer);
  ttFirebaseTimer = setTimeout(() => ttFirebaseSyncWrite(), 1200);
}

async function ttSyncFirebaseAndLocalNow() {
  await Promise.all([
    ttFirebaseSyncWrite("Saved to Firebase now."),
    ttCloudSyncWrite("Saved local backup file now.")
  ]);
}

// --- Auth UI helpers ---
function ttUpdateFirebaseAuthUI() {
  const badge = document.getElementById("ttFirebaseUserBadge");
  const signInBtn = document.getElementById("ttFirebaseSignIn");
  const signOutBtn = document.getElementById("ttFirebaseSignOut");
  if (ttFirebaseUser) {
    if (badge) { badge.textContent = ttFirebaseUser.displayName || ttFirebaseUser.email; badge.hidden = false; }
    if (signInBtn) signInBtn.hidden = true;
    if (signOutBtn) signOutBtn.hidden = false;
  } else {
    if (badge) badge.hidden = true;
    if (signInBtn) signInBtn.hidden = false;
    if (signOutBtn) signOutBtn.hidden = true;
  }
}

async function ttFirebaseSignIn() {
  try {
    const { firebaseAuth, GoogleAuthProvider, signInWithPopup } = await ttFirebaseSdk();
    const provider = new GoogleAuthProvider();
    provider.addScope(ttDriveScope);
    const result = await signInWithPopup(firebaseAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    ttDriveAccessToken = credential?.accessToken || "";
    if (ttDriveAccessToken) {
      localStorage.setItem("teachToday.driveStatus", "Google Drive audio is connected.");
      ttUploadPendingAudioToDrive().catch(() => {});
    }
  } catch (err) {
    localStorage.setItem("teachToday.firebaseSyncStatus", `Sign-in failed: ${err.message}`);
    ttRenderDataCenter();
  }
}

async function ttFirebaseSignOut() {
  const { firebaseAuth, signOut } = await ttFirebaseSdk();
  await signOut(firebaseAuth);
}

// Copies legacy shared-path data to the new per-user path (runs once on first sign-in)
async function ttFirebaseMigrateLegacyData() {
  try {
    const { firestoreDb, doc, getDoc, setDoc } = await ttFirebaseSdk();
    const legacySnap = await getDoc(doc(firestoreDb, "teachTodaySync", "main"));
    if (!legacySnap.exists()) return;
    const userPath = ttFirebaseDocPath();
    const userSnap = await getDoc(doc(firestoreDb, ...userPath));
    if (userSnap.exists()) return; // user already has their own data
    const legacyData = legacySnap.data();
    await setDoc(doc(firestoreDb, ...userPath), { ...legacyData, _migratedFrom: "legacy", _migratedAt: new Date().toISOString() });
    if (legacyData.chunkCount) {
      for (let i = 0; i < legacyData.chunkCount; i++) {
        const id = String(i).padStart(4, "0");
        const chunkSnap = await getDoc(doc(firestoreDb, "teachTodaySync", "main", "chunks", id));
        if (chunkSnap.exists()) await setDoc(doc(firestoreDb, ...userPath, "chunks", id), chunkSnap.data());
      }
    }
    console.log("[Teach Today] Legacy Firebase data migrated to user path.");
  } catch (err) {
    console.warn("[Teach Today] Legacy data migration skipped:", err.message);
  }
}

async function ttInitFirebaseSync() {
  try {
    const { firebaseAuth, onAuthStateChanged } = await ttFirebaseSdk();
    onAuthStateChanged(firebaseAuth, async (user) => {
      const wasSignedIn = !!ttFirebaseUser;
      ttFirebaseUser = user;
      ttUpdateFirebaseAuthUI();
      if (user) {
        localStorage.setItem("teachToday.firebaseSyncStatus", `Signed in as ${user.email}. Checking cloud data…`);
        ttRenderDataCenter();
        if (!wasSignedIn) await ttFirebaseMigrateLegacyData();
        await ttFirebaseRestoreIfNewer();
        ttQueueFirebaseSync();
        ttUploadPendingAudioRecordings(); // upload any recordings that didn't make it to Storage yet
        if (!ttDriveAccessToken) {
          localStorage.setItem("teachToday.driveStatus", "Google Drive needs permission for this browser session. Click Google Drive audio in Records.");
        }
        localStorage.setItem("teachToday.firebaseSyncStatus", `Signed in as ${user.email}. Syncing automatically.`);
      } else {
        localStorage.setItem("teachToday.firebaseSyncStatus", "Sign in with Google to sync across all your devices.");
      }
      ttRenderDataCenter();
    });
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    console.warn("Teach Today Firebase startup failed:", error);
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase not reachable (${detail}).`);
    ttRenderDataCenter();
  }
}

function ttBackupData() {
  const now = new Date();
  const payload = ttBackupPayload(now);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = now.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  link.download = `teach-today-backup-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
  localStorage.setItem("teachToday.lastBackupAt", now.toISOString());
  ttRenderDataCenter();
}

function ttHistoricalDay(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).trim().toLowerCase() : date.toISOString().slice(0, 10);
}

function ttHistoricalFingerprint(record) {
  const misses = (record.wrongWords || []).map((word) => String(word).toLowerCase()).sort().join("|");
  return [record.studentId || "", ttHistoricalDay(record.date || record.displayDate || record.dateRaw), record.substep || "", record.wordlistPage || "", record.chartHalf || "", record.correct ?? "", misses].join("::");
}

function ttHistoricalIdentity(record) {
  return [record.studentId || "", ttHistoricalDay(record.date || record.displayDate || record.dateRaw), record.substep || "", record.wordlistPage || "", record.chartHalf || ""].join("::");
}

function ttHistoricalStudent(entry) {
  const aliases = (entry.matchNames || [entry.studentName]).filter(Boolean).map((name) => String(name).trim().toLowerCase());
  return (appState.rosterStudents || []).find((student) => [student.name, student.fullName, student.displayName]
    .filter(Boolean).some((name) => aliases.includes(String(name).trim().toLowerCase()))) || null;
}

function ttHistoricalGroup(studentId, schoolYearId, aliases) {
  const names = aliases.map((name) => String(name).trim().toLowerCase());
  return (appState.groups || []).find((group) => group.schoolYearId === schoolYearId && (
    Object.values(group.studentIds || {}).includes(studentId)
    || (group.students || []).some((name) => names.includes(String(name).trim().toLowerCase()))
  )) || null;
}

async function ttImportHistoricalWrsFile(file) {
  if (!file) return;
  let payload;
  try { payload = JSON.parse(await file.text()); } catch { alert("This historical WRS file is not valid JSON."); return; }
  if (payload?.kind !== "TeachTodayHistoricalWrsImport" || !Array.isArray(payload.students)) {
    alert("This is not a Teach Today historical WRS import file."); return;
  }
  const proposed = [], proposedNotes = [], unmatched = [];
  payload.students.forEach((entry) => {
    const student = ttHistoricalStudent(entry);
    if (!student) { unmatched.push(entry.studentName || "Unknown student"); return; }
    const aliases = (entry.matchNames || [entry.studentName]).filter(Boolean);
    const group = ttHistoricalGroup(student.studentId, payload.schoolYearId, aliases);
    (entry.reviewNotes || []).forEach((note, index) => {
      const id = `historical-wrs-note-${student.studentId}-${index}-${payload.schoolYearId}`;
      proposedNotes.push({ ...note, id, studentId: student.studentId, schoolYearId: payload.schoolYearId, source: "historical-wrs-import" });
    });
    (entry.records || []).forEach((incoming) => proposed.push({ ...incoming,
      student: student.name || student.displayName, studentId: student.studentId,
      group: group?.name || `Historical WRS ${payload.schoolYearId}`, groupId: group?.id || null,
      groupIdAtTime: group?.id || null, schoolYearId: payload.schoolYearId,
      historicalBaseline: true, source: "historical-wrs-import", importedAt: new Date().toISOString()
    }));
  });
  const existing = new Set((appState.masterRecords || []).map(ttHistoricalIdentity)), seen = new Set();
  const additions = proposed.filter((record) => {
    const identity = ttHistoricalIdentity(record), key = ttHistoricalFingerprint(record);
    if ((ttHistoricalDay(record.date || record.displayDate || record.dateRaw) && existing.has(identity)) || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const skipped = proposed.length - additions.length;
  if (!confirm(`Historical WRS preview\n\n${additions.length} new charting records\n${skipped} duplicates skipped\n${unmatched.length} unmatched students\n\nAdds charting evidence only—no lessons, attendance, dictation, or recordings.\n\nContinue?`)) return;
  ttBackupData();
  appState.masterRecords ||= [];
  appState.masterRecords.push(...additions);
  appState.historicalWrsReviewNotes ||= [];
  const existingNoteIds = new Set(appState.historicalWrsReviewNotes.map((item) => item.id));
  appState.historicalWrsReviewNotes.push(...proposedNotes.filter((item) => !existingNoteIds.has(item.id)));
  appState.masterRecords.sort((a, b) => ttRecordTime(a) - ttRecordTime(b));
  saveState();
  await ttFirebaseSyncWrite(`Imported ${additions.length} historical WRS charting records.`);
  alert(`Import complete: ${additions.length} added, ${skipped} duplicates skipped.${unmatched.length ? ` ${unmatched.length} unmatched.` : ""}`);
  ttRenderDataCenter();
}

function ttCloudSyncSupported() {
  return Boolean(window.showDirectoryPicker && window.indexedDB);
}

function ttOpenCloudSyncDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ttCloudSyncDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(ttCloudSyncStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function ttCloudSyncStoreValue(key, value) {
  const db = await ttOpenCloudSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ttCloudSyncStore, "readwrite");
    transaction.objectStore(ttCloudSyncStore).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function ttCloudSyncGetValue(key) {
  const db = await ttOpenCloudSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ttCloudSyncStore, "readonly");
    const request = transaction.objectStore(ttCloudSyncStore).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function ttCloudSyncPermission(handle, write = false, request = false) {
  if (!handle) return false;
  const options = { mode: write ? "readwrite" : "read" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  if (!request) return false;
  return (await handle.requestPermission(options)) === "granted";
}

async function ttCloudSyncReadPayload(handle) {
  try {
    const fileHandle = await handle.getFileHandle(ttCloudSyncFileName);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

function ttPayloadTime(payload) {
  const state = payload?.appState || payload;
  return new Date(state?.lastSavedAt || payload?.exportedAt || 0).getTime() || 0;
}

function ttLocalSaveTime() {
  return new Date(appState?.lastSavedAt || 0).getTime() || 0;
}

function ttStateDataScore(state = appState) {
  const groups = state?.groups || [];
  return (state?.masterRecords || []).length
    + groups.reduce((sum, group) =>
      sum
      + (group.history || []).length
      + (group.dictationMisses || []).length
      + (group.encodingObservations || []).length,
    0);
}

function ttShouldRestorePayload(payload) {
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  const remoteScore = ttStateDataScore(restoredState);
  const localScore = ttStateDataScore(appState);
  return remoteScore > localScore || ttPayloadTime(payload) > ttLocalSaveTime() + 1000;
}

async function ttCloudSyncRestoreIfNewer(handle) {
  const payload = await ttCloudSyncReadPayload(handle);
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  if (!ttShouldRestorePayload(payload)) return false;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
  if (payload.section2CardOverrides) {
    localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
  }
  localStorage.setItem("teachToday.lastCloudSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.cloudSyncStatus", "Loaded newer cloud data.");
  location.reload();
  return true;
}

async function ttCloudSyncWrite(reason = "Saved local backup file.") {
  if (!ttCloudSyncSupported()) {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local folder backup is not supported in this browser.");
    ttRenderDataCenter();
    return;
  }
  if (ttCloudSyncBusy) {
    ttCloudSyncPending = true;
    return;
  }
  ttCloudSyncBusy = true;
  try {
    const handle = await ttCloudSyncGetValue(ttCloudSyncHandleKey);
    if (!handle) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Choose a local backup folder to save a file on this Mac.");
      return;
    }
    if (!(await ttCloudSyncPermission(handle, true, false))) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Open Data Center and choose the local folder again to reconnect.");
      return;
    }
    if (await ttCloudSyncRestoreIfNewer(handle)) return;
    const now = new Date();
    const payload = ttBackupPayload(now);
    const backupText = JSON.stringify(payload, null, 2);
    const datedFileName = `teach-today-backup-${ttBackupFileStamp(now)}.json`;
    const datedFileHandle = await handle.getFileHandle(datedFileName, { create: true });
    const datedWritable = await datedFileHandle.createWritable();
    await datedWritable.write(backupText);
    await datedWritable.close();
    const latestFileHandle = await handle.getFileHandle(ttCloudSyncFileName, { create: true });
    const latestWritable = await latestFileHandle.createWritable();
    await latestWritable.write(backupText);
    await latestWritable.close();
    await ttSavePendingAudioToSyncFolder();
    localStorage.setItem("teachToday.lastCloudSyncAt", now.toISOString());
    localStorage.setItem("teachToday.cloudSyncStatus", `${reason} File: ${datedFileName}.`);
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local backup file could not save. Browser storage is still saved.");
  } finally {
    ttCloudSyncBusy = false;
    ttRenderDataCenter();
    if (ttCloudSyncPending) {
      ttCloudSyncPending = false;
      ttQueueCloudSync();
    }
  }
}

function ttQueueCloudSync() {
  clearTimeout(ttCloudSyncTimer);
  ttCloudSyncTimer = setTimeout(() => ttCloudSyncWrite(), 900);
  ttQueueFirebaseSync();
}

async function ttConnectCloudSync() {
  if (!ttCloudSyncSupported()) {
    alert("This browser cannot write to a local folder automatically. Use Chrome or Edge on your Mac, or keep using backup files.");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!(await ttCloudSyncPermission(handle, true, true))) {
      alert("Teach Today needs permission to write the sync file in that folder.");
      return;
    }
    await ttCloudSyncStoreValue(ttCloudSyncHandleKey, handle);
    localStorage.setItem("teachToday.cloudSyncFolderName", handle.name || "Local backup folder");
    const restored = await ttCloudSyncRestoreIfNewer(handle);
    if (!restored) await ttCloudSyncWrite("Connected and saved local backup file.");
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local backup folder was not connected.");
    ttRenderDataCenter();
  }
}

async function ttInitCloudSync() {
  if (!ttCloudSyncSupported()) {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local folder backup is not supported in this browser.");
    ttRenderDataCenter();
    return;
  }
  try {
    const handle = await ttCloudSyncGetValue(ttCloudSyncHandleKey);
    if (!handle) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Choose a local backup folder to save a file on this Mac.");
      ttRenderDataCenter();
      return;
    }
    if (!(await ttCloudSyncPermission(handle, false, false))) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Open Data Center and choose the local folder again to reconnect.");
      ttRenderDataCenter();
      return;
    }
    await ttCloudSyncRestoreIfNewer(handle);
    ttQueueCloudSync();
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local file backup is paused. Browser storage is still saved.");
    ttRenderDataCenter();
  }
}

window.teachTodayQueueCloudSync = ttQueueCloudSync;

function ttRestoreDataFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const restoredState = payload.appState || payload;
      if (!restoredState.groups || !Array.isArray(restoredState.groups)) {
        alert("That backup file does not look like Teach Today data.");
        return;
      }
      localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
      if (payload.section2CardOverrides) {
        localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
      }
      localStorage.setItem("teachToday.lastBackupAt", new Date().toISOString());
      alert("Backup restored. The page will reload now.");
      location.reload();
    } catch {
      alert("I could not read that backup file.");
    }
  };
  reader.readAsText(file);
}

function ttRenderSavedLessons(group) {
  const list = ttById("ttSavedLessons");
  if (!list) return;
  const seenDays = new Set();
  const plans = (group.history || []).slice().reverse().filter((plan) => {
    const key = plan.dailyKey || dateKey(plan.savedAt || plan.created);
    if (!key) return true;
    if (seenDays.has(key)) return false;
    seenDays.add(key);
    return true;
  });
  if (!plans.length) {
    list.innerHTML = "<p>No saved lessons for this group yet.</p>";
    return;
  }
  list.innerHTML = `<p class="saved-lesson-note">Showing the latest official saved lesson for each day.</p>`;
  plans.forEach((plan) => {
    const lesson = plan.lessons?.[0];
    const saved = plan.savedAt ? new Date(plan.savedAt) : null;
    const when = saved
      ? `${saved.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${saved.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
      : plan.created;
    const badge = plan.hasStudentData ? "Taught" : (plan.status || "Saved");
    const item = document.createElement("article");
    item.className = "saved-lesson-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(plan.title || "Saved lesson")} <span class="lesson-status-badge">${escapeHtml(badge)}</span></strong>
        <p>${escapeHtml(when)} - ${escapeHtml(plan.substep || "")}</p>
        <p>${escapeHtml(lesson?.wordlistMeta || "")}</p>
      </div>
      <button type="button">Open in app</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      if (!lesson) return;
      ttAddLessonTab(plan.id);
      saveState();
      ttOpenPlanInApp(plan.id);
    });
    list.appendChild(item);
  });
}

function ttOpenPlanInApp(planId) {
  ttRememberScroll();
  let found = null;
  appState.groups.forEach((group) => {
    const plan = (group.history || []).find((item) => item.id === planId);
    if (plan) found = { group, plan };
  });
  if (!found?.plan?.lessons?.[0]) return;
  appState.selectedGroupId = found.group.id;
  ttLesson = ttClone(found.plan.lessons[0]);
  ttLesson.savedPlanId = found.plan.id;
  ttEnsureLessonWorkflow(found.plan, ttLesson, found.group);
  ttAddLessonTab(found.plan.id);
  saveState();
  ttUpdateSaveStatus(found.plan);
  history.replaceState(null, "", ttPlanUrl(found.plan.id));
  ttRender();
  ttRestoreScroll(found.plan.id);
}

function section2CardsForWord(word, substep) {
  const clean = cleanCardWord(word);
  if (!clean) return { mode: "sounds", items: [] };
  const override = section2CardOverrides()[clean];
  if (override?.items?.length) return { mode: override.mode || section2ModeForItems(override.items), items: override.items };
  const suffix = knownSuffixValues(substep).find((value) => clean.endsWith(value) && clean.length > value.length + 2 && hasPlausibleSuffixBase(clean, value));
  const base = suffix ? clean.slice(0, -suffix.length) : clean;
  const shouldUseSyllables = isAtLeastSubstep(substep, "3.1") && (clean.includes("-") || hasKnownPrefixOrBase(base, substep) || estimatedSyllables(base) > 1);
  return shouldUseSyllables
    ? { mode: "syllables", items: syllableCardsForWord(clean, substep) }
    : { mode: "sounds", items: soundCardsForWord(clean, substep) };
}

function hasKnownPrefixOrBase(word, substep) {
  return knownPrefixValues(substep).some((prefix) => word.startsWith(prefix) && word.length > prefix.length + 2)
    || knownLatinBaseValues(substep).some((base) => word === base || word.endsWith(base));
}

function knownPrefixValues(substep) {
  return knownPrefixes
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/-$/, ""))
    .sort((a, b) => b.length - a.length);
}

function knownSuffixValues(substep) {
  return knownSuffixes
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/^-/, ""))
    .sort((a, b) => b.length - a.length);
}

function knownLatinBaseValues(substep) {
  return knownLatinBases
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/^-|-$/g, ""))
    .sort((a, b) => b.length - a.length);
}

function soundCardsForWord(word, substep = "1.1") {
  const chunks = [];
  const suffix = knownSuffixValues(substep).find((value) => word.endsWith(value) && word.length > value.length + 2 && hasPlausibleSuffixBase(word, value));
  const base = suffix ? word.slice(0, -suffix.length) : word;
  const sounds = ["tch", "dge", "ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk", "ild", "ind", "old", "olt", "ost", "all", "am", "an", "ch", "ck", "sh", "th", "wh", "qu"];
  let index = 0;
  while (index < base.length) {
    const chunk = sounds.find((sound) => base.slice(index).startsWith(sound));
    if (chunk) {
      chunks.push({ text: chunk, type: gluedSoundSet().has(chunk) ? "glued" : "consonant" });
      index += chunk.length;
    } else {
      const letter = base[index];
      chunks.push({ text: letter, type: "aeiou".includes(letter) ? "vowel" : "consonant" });
      index += 1;
    }
  }
  if (suffix) chunks.push({ text: suffix, type: "suffix" });
  return chunks;
}

function gluedSoundSet() {
  return new Set(["ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk", "ild", "ind", "old", "olt", "ost", "all", "am", "an"]);
}

function syllableCardsForWord(word, substep) {
  const items = [];
  let remaining = word;
  const verified = verifiedSyllableParts(remaining);
  if (verified) {
    verified.forEach((part) => items.push({ text: part, type: cardTypeForVerifiedPart(part, substep) }));
    return items;
  }
  if (remaining.includes("-")) {
    remaining.split("-").filter(Boolean).forEach((part, index, parts) => {
      items.push({ text: part, type: index < parts.length - 1 ? "syllable" : "syllable" });
    });
    return items;
  }
  const suffix = knownSuffixValues(substep).find((value) => remaining.endsWith(value) && remaining.length > value.length + 2 && hasPlausibleSuffixBase(remaining, value));
  let base = suffix ? remaining.slice(0, -suffix.length) : remaining;
  if (compoundPartsForWord(base)) {
    compoundPartsForWord(base).forEach((part) => items.push({ text: part, type: "syllable" }));
    if (suffix) items.push({ text: suffix, type: "suffix" });
    return items;
  }
  const prefix = prefixForWord(base, substep);
  if (prefix) {
    items.push({ text: prefix, type: "prefix" });
    base = base.slice(prefix.length);
  }
  const latinBase = knownLatinBaseValues(substep).find((value) => base === value || base.endsWith(value));
  if (latinBase && base === latinBase) {
    items.push({ text: `-${latinBase}-`, type: "latin" });
  } else if (latinBase && base.endsWith(latinBase)) {
    const front = base.slice(0, -latinBase.length);
    if (front) {
      const frontType = knownPrefixValues(substep).includes(front) ? "prefix" : "syllable";
      splitClosedSyllables(front).forEach((part) => items.push({ text: part, type: frontType }));
    }
    items.push({ text: `-${latinBase}-`, type: "latin" });
  } else if (compoundPartsForWord(base)) {
    compoundPartsForWord(base).forEach((part) => items.push({ text: part, type: "syllable" }));
  } else {
    splitClosedSyllables(base).forEach((part) => items.push({ text: part, type: "syllable" }));
  }
  if (suffix) items.push({ text: suffix, type: "suffix" });
  return items.length ? items : [{ text: word, type: "syllable" }];
}

function verifiedSyllableParts(word) {
  const verified = {
    congressmen: ["con-", "gress", "men"],
    sublimit: ["sub-", "lim", "it"]
  };
  return verified[word] || null;
}

function cardTypeForVerifiedPart(part, substep) {
  const clean = part.replace(/^-|-$/g, "");
  if (part.endsWith("-") && knownPrefixValues(substep).includes(clean)) return "prefix";
  if (part.startsWith("-") && knownSuffixValues(substep).includes(clean)) return "suffix";
  if (part.startsWith("-") && part.endsWith("-") && knownLatinBaseValues(substep).includes(clean)) return "latin";
  return "syllable";
}

function prefixForWord(word, substep) {
  const nonPrefixWords = new Set(["index", "insect", "inside", "until", "uncle", "under", "unit", "union"]);
  if (nonPrefixWords.has(word)) return "";
  return knownPrefixValues(substep).find((value) => word.startsWith(value) && word.length > value.length + 2) || "";
}

function hasPlausibleSuffixBase(word, suffix) {
  const nonSuffixWords = new Set(["radish", "finish", "polish", "punish", "publish", "relish", "banish", "vanish", "famish", "lavish"]);
  if (nonSuffixWords.has(word)) return false;
  const base = word.slice(0, -suffix.length);
  if (suffix === "s") return !/[aeious]$/.test(base);
  if (suffix === "es") return /(s|x|z|ch|sh)$/.test(base);
  return base.length >= 2;
}

function estimatedSyllables(word) {
  const groups = word.replace(/e$/i, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function compoundPartsForWord(word) {
  const knownCompounds = {
    hilltop: ["hill", "top"],
    sunset: ["sun", "set"],
    sunlit: ["sun", "lit"],
    backpack: ["back", "pack"],
    bathtub: ["bath", "tub"],
    bedbug: ["bed", "bug"],
    bedpost: ["bed", "post"],
    bobsled: ["bob", "sled"],
    catfish: ["cat", "fish"],
    catnip: ["cat", "nip"],
    catnap: ["cat", "nap"],
    checklist: ["check", "list"],
    checkup: ["check", "up"],
    chestnut: ["chest", "nut"],
    chitchat: ["chit", "chat"],
    clamshell: ["clam", "shell"],
    codfish: ["cod", "fish"],
    cobweb: ["cob", "web"],
    desktop: ["desk", "top"],
    dishcloth: ["dish", "cloth"],
    dishpan: ["dish", "pan"],
    drumstick: ["drum", "stick"],
    dustpan: ["dust", "pan"],
    duckbill: ["duck", "bill"],
    fishnet: ["fish", "net"],
    fishpond: ["fish", "pond"],
    grandchild: ["grand", "child"],
    gumdrop: ["gum", "drop"],
    gumball: ["gum", "ball"],
    handbag: ["hand", "bag"],
    handpick: ["hand", "pick"],
    handstand: ["hand", "stand"],
    hatbox: ["hat", "box"],
    hotshot: ["hot", "shot"],
    hotdog: ["hot", "dog"],
    kickball: ["kick", "ball"],
    kickoff: ["kick", "off"],
    kickstand: ["kick", "stand"],
    kingfish: ["king", "fish"],
    lapdog: ["lap", "dog"],
    laptop: ["lap", "top"],
    lipstick: ["lip", "stick"],
    mankind: ["man", "kind"],
    nutshell: ["nut", "shell"],
    pickup: ["pick", "up"],
    pigpen: ["pig", "pen"],
    sandbox: ["sand", "box"],
    shellfish: ["shell", "fish"],
    snapshot: ["snap", "shot"],
    softball: ["soft", "ball"],
    sunbath: ["sun", "bath"],
    sunblock: ["sun", "block"],
    sundress: ["sun", "dress"],
    sunfish: ["sun", "fish"],
    suntan: ["sun", "tan"],
    sunup: ["sun", "up"],
    tiptop: ["tip", "top"],
    tomcat: ["tom", "cat"],
    topmost: ["top", "most"],
    uphill: ["up", "hill"],
    upwell: ["up", "well"],
    wildcat: ["wild", "cat"],
    windmill: ["wind", "mill"],
    zigzag: ["zig", "zag"]
  };
  return knownCompounds[word] || null;
}

function splitClosedSyllables(word) {
  if (word.length <= 4) return [word];
  if (estimatedSyllables(word) <= 1) return [word];
  const vowels = "aeiouy";
  const parts = [];
  let start = 0;
  for (let index = 1; index < word.length - 1; index += 1) {
    if (!vowels.includes(word[index]) && vowels.includes(word[index - 1]) && /[aeiouy]/.test(word.slice(index + 1))) {
      let cut = index + 1;
      if (isDigraphAt(word, index)) cut = index + 2;
      if (cut - start >= 2 && word.length - cut >= 2) {
        parts.push(word.slice(start, cut));
        start = cut;
        index = cut;
      }
    }
  }
  parts.push(word.slice(start));
  return parts.length > 1 ? parts : splitNearMiddle(word);
}

function isDigraphAt(word, index) {
  return ["ch", "ck", "sh", "th", "wh"].includes(word.slice(index, index + 2));
}

function splitNearMiddle(word) {
  const middle = Math.floor(word.length / 2);
  for (let offset = 0; offset < 3; offset += 1) {
    for (const cut of [middle + offset, middle - offset]) {
      if (cut > 1 && cut < word.length - 1) return [word.slice(0, cut), word.slice(cut)];
    }
  }
  return [word];
}

function ttRenderMarkedWords() {
  document.querySelectorAll(".word-row button").forEach((button) => {
    if (button.closest("#ttReviewWordsB2, #ttCurrentWordsB2")) {
      button.classList.remove("marked-word");
      button.classList.toggle("selected-display-word", button.textContent === ttSection2BWord);
      return;
    }
    if (button.closest("#ttReviewWords, #ttCurrentWords")) {
      button.classList.remove("marked-word");
      button.classList.toggle("selected-display-word", button.textContent === ttSection2Word);
      return;
    }
    button.classList.toggle("marked-word", isMarkedReviewWord(button.textContent));
    button.classList.toggle("selected-display-word", button.textContent === ttSection2Word);
  });
  document.querySelectorAll(".section7-word-card > button").forEach((button) => {
    button.classList.toggle("marked-word", isMarkedReviewWord(button.textContent));
  });
}

function ttFillPart7(lesson, skill) {
  const sectionSeven = ttSectionSevenSetsForLesson(lesson, skill);
  const review = sectionSeven.review;
  const nonsense = sectionSeven.nonsense;
  const current = sectionSeven.current;
  ttById("ttSpellingConcept").textContent = "Review first, then dictate current substep words. For multisyllabic words, segment syllables, tap sounds in each syllable, then spell.";
  ttFillPart7WordCards([
    { title: "Review", category: "Review dictation word", source: "section7-review-dictation", words: review },
    { title: "Nonsense", category: "Prior nonsense review", source: "section7-nonsense-dictation", words: nonsense },
    { title: "Current", category: "Current substep word", source: "section7-current-dictation", words: current }
  ], skill.id);
  ttFillHfwStepChoices(skill.id);
  if (ttById("ttHfwStep")) ttById("ttHfwStep").value = skill.id;
  ttFillHfwDisplayWords(hfwWordsForSubstep(ttById("ttHfwStep")?.value || skill.id, lesson), ttById("ttHfwStep")?.value || skill.id);
  ttFillEncodingStudentGrid(ttById("ttEncodingBar7"), "section7", "Spelling concepts", []
    .concat(review.map((value) => ({ value, category: "Review dictation word", group: "Review" })))
    .concat(nonsense.map((value) => ({ value, category: "Prior nonsense review", group: "Nonsense" })))
    .concat(current.map((value) => ({ value, category: "Current substep word", group: "Current" }))));
}

function ttFillPart7WordCards(groups, substep) {
  const container = ttById("ttPart7WordCards");
  if (!container) return;
  container.innerHTML = "";
  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "section7-card-group";
    section.innerHTML = `<h3>${escapeHtml(group.title)}</h3><div></div>`;
    const rows = section.querySelector("div");
    group.words.forEach((word, wordIndex) => {
      const row = document.createElement("article");
      row.className = "section7-word-card";
      row.dataset.word = word;
      const wordButton = document.createElement("button");
      wordButton.type = "button";
      wordButton.className = isMarkedReviewWord(word) ? "marked-word" : "";
      wordButton.textContent = word;
      ttBindSingleOrTriple(
        wordButton,
        () => {
          toggleReviewWord(word, group.source);
          ttSelectPart7Word(word, group.category);
        },
        () => ttReplaceSection7Word(group.title, wordIndex)
      );
      const mini = document.createElement("div");
      mini.className = "section7-mini-display";
      ttRenderBuildCards(mini, word, substep);
      const fixButton = document.createElement("button");
      fixButton.type = "button";
      fixButton.className = "section7-fix-button";
      fixButton.textContent = "Fix";
      fixButton.title = `Fix card split for ${word}`;
      fixButton.addEventListener("click", () => ttOpenSection7Fix(row, word, substep));
      const fixPanel = document.createElement("div");
      fixPanel.className = "section7-fix-panel";
      fixPanel.hidden = true;
      fixPanel.innerHTML = `
        <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="con- gress men">
        <button type="button" class="section7-save-fix">Save</button>
        <button type="button" class="section7-cancel-fix">Cancel</button>
      `;
      fixPanel.querySelector(".section7-save-fix").addEventListener("click", () => ttSaveSection7Fix(row, word, substep));
      fixPanel.querySelector(".section7-cancel-fix").addEventListener("click", () => {
        fixPanel.hidden = true;
      });
      fixPanel.querySelector("input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") ttSaveSection7Fix(row, word, substep);
        if (event.key === "Escape") fixPanel.hidden = true;
      });
      row.append(wordButton, mini, fixButton, fixPanel);
      rows.appendChild(row);
    });
    container.appendChild(section);
  });
}

function ttReplaceSection7Word(groupTitle, wordIndex) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const key = groupTitle === "Current" ? "sectionSevenCurrentWords" : groupTitle === "Nonsense" ? "sectionSevenNonsenseWords" : "sectionSevenReviewWords";
  const sectionSeven = ttSectionSevenSetsForLesson(ttLesson, skill);
  const current = ttLesson[key] || (groupTitle === "Current"
    ? sectionSeven.current
    : groupTitle === "Nonsense"
      ? sectionSeven.nonsense
      : sectionSeven.review);
  const pool = groupTitle === "Current"
    ? ttCurrentSectionSevenWordPool(ttLesson, skill)
    : groupTitle === "Nonsense"
      ? ttNonsenseWordPool(ttLesson, skill)
      : ttReviewRealWordPool(ttLesson, skill);
  ttLesson[key] = current.map((word, index) => index === wordIndex ? ttPickReplacement(pool, current, word) : word);
  ttLesson.dictationPlanOverride = ttRerollDictationPlan(ttLesson, skill, {
    avoidWordKeys: ttSectionSevenWordKeys(ttLesson)
  });
  ttSaveDraftLesson();
  ttFillPart7(ttLesson, skill);
}

function ttOpenSection7Fix(row, word, substep) {
  const panel = row.querySelector(".section7-fix-panel");
  const input = panel?.querySelector("input");
  const cards = section2CardsForWord(word, substep);
  if (!panel || !input) return;
  input.value = cards?.items?.length ? cards.items.map(section2EditInputText).join(" ") : "";
  panel.hidden = false;
  input.focus();
  input.select();
}

function ttSaveSection7Fix(row, word, substep) {
  const panel = row.querySelector(".section7-fix-panel");
  const input = panel?.querySelector("input");
  const mini = row.querySelector(".section7-mini-display");
  if (!input || !mini) return;
  const items = parseSection2CardInput(input.value, substep);
  if (!items.length) return;
  const overrides = section2CardOverrides();
  overrides[cleanCardWord(word)] = {
    mode: section2ModeForItems(items),
    items,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
  input.value = "";
  if (panel) panel.hidden = true;
  ttRenderBuildCards(mini, word, substep);
}

function ttSelectPart7Word(word, category) {
  ttSelectEncodingValue("section7", category, word);
  document.querySelectorAll(".section7-word-card").forEach((row) => {
    row.classList.toggle("selected-display-word", row.dataset.word === word);
  });
}

function ttRenderBuildCards(container, word, substep) {
  if (!container) return;
  container.innerHTML = "";
  if (!word) {
    container.innerHTML = "<span>Tap a word</span>";
    return;
  }
  const cards = section2CardsForWord(word, substep);
  container.dataset.mode = cards.mode;
  container.style.setProperty("--tile-count", String(Math.max(cards.items.length, 1)));
  container.classList.toggle("many-cards", cards.items.length >= 7);
  cards.items.forEach((item) => {
    const card = document.createElement("span");
    card.className = `build-card ${item.type}`;
    card.textContent = section2DisplayCardText(item);
    container.appendChild(card);
  });
}

function ttFillHfwStepChoices(currentSubstep) {
  ttFillHfwStepChoicesForSelect(ttById("ttHfwStep"), currentSubstep);
}

function ttFillHfwStepChoicesForSelect(select, currentSubstep) {
  if (!select) return;
  const firstFill = !select.options.length;
  if (!select.options.length) {
    scopeMap.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = skill.id;
      select.appendChild(option);
    });
  }
  [...select.options].forEach((option) => {
    option.hidden = !isAtLeastSubstep(currentSubstep, option.value);
  });
  if (firstFill || !select.value || !isAtLeastSubstep(currentSubstep, select.value)) select.value = currentSubstep;
}

function isUsableHfwWord(word) {
  const text = String(word || "").trim();
  return /^[A-Za-z](?:[A-Za-z'.-]*[A-Za-z.])?$/.test(text);
}

function hfwWordsForSubstep(substep, lesson) {
  const hfw = window.wilsonHighFrequencyWords?.[substep] || [];
  return [...new Set(hfw)].filter(isUsableHfwWord);
}

function hfwReviewWordsForSubstep(substep) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const review = [];
  for (let index = currentIndex - 1; index >= 0 && review.length < 12; index -= 1) {
    review.push(...hfwWordsForSubstep(scopeMap[index].id, ttLesson));
  }
  return [...new Set(review)].slice(0, 12);
}

function dictationReviewWords(substep, level = "AB") {
  const group = ttActiveGroup();
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const candidates = [];
  for (let index = currentIndex - 1; index >= 0 && candidates.length < 30; index -= 1) {
    const prior = scopeMap[index];
    const bank = dictationValues("words", prior.id, level);
    candidates.push(...bank.filter(isUsableReaderWord));
    if (candidates.length < 5) {
      candidates.push(...readerWordsFromSubstep(prior.id, level));
    }
  }
  return chooseEasyReviewWords(candidates, 3, group?.trouble || []);
}

function dictationCurrentWords(substep, level = "AB", pageWords = []) {
  const bank = dictationValues("words", substep, level);
  const compatible = pageWords.filter((word) => bank.includes(word));
  const source = compatible.length >= 2 ? compatible : pageWords.concat(bank);
  return chooseEasyCurrentWords(source.filter(isUsableReaderWord), 2);
}

function chooseEasyReviewWords(words, count, trouble = []) {
  const usable = uniqueWords(words).filter(isValidDictationWord);
  const troubleSet = new Set(trouble);
  return usable
    .map((word, index) => ({ word, index, score: reviewWordScore(word, troubleSet) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((item) => item.word)
    .slice(0, count);
}

function chooseEasyCurrentWords(words, count) {
  return uniqueWords(words)
    .filter(isValidDictationWord)
    .map((word, index) => ({ word, index, score: easyWordScore(word) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((item) => item.word)
    .slice(0, count);
}

function reviewWordScore(word, troubleSet) {
  let score = easyWordScore(word);
  if (troubleSet.has("suffix confusion") && hasVisibleSuffix(word)) score -= 3;
  if (troubleSet.has("vowel sounds") && /[aeiou]/i.test(word)) score -= 1;
  if ((troubleSet.has("blending") || troubleSet.has("slow decoding")) && estimatedSyllables(word) <= 1 && word.length <= 5) score -= 2;
  if (troubleSet.has("multisyllable division") && estimatedSyllables(word) >= 2) score -= 2;
  if (!troubleSet.size && hasVisibleSuffix(word)) score += 4;
  return score;
}

function easyWordScore(word) {
  const clean = String(word || "").toLowerCase().replace(/[^a-z-]/g, "");
  return (estimatedSyllables(clean) * 6) + clean.length + (hasVisibleSuffix(clean) ? 3 : 0);
}

function ttFillHfwDisplayWords(words, substep) {
  const container = ttById("ttPart7Hfw");
  const hfwWords = words.filter(isUsableHfwWord);
  ttHfwDeck = hfwWords;
  ttHfwIndex = 0;
  container.innerHTML = "";
  if (!hfwWords.length) {
    const item = document.createElement("span");
    item.textContent = "No HFW listed for this page";
    container.appendChild(item);
    ttShowHfw("Tap HFW", substep);
    return;
  }
  hfwWords.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = word;
    button.addEventListener("click", () => ttShowHfwByDeck(word, substep));
    container.appendChild(button);
  });
  ttShowHfwCard(0, substep);
}

function ttShowHfwCard(index, substep = ttById("ttHfwStep")?.value || ttLesson?.substep || "") {
  if (!ttHfwDeck.length) {
    ttShowHfw("Tap HFW", substep);
    return;
  }
  ttHfwIndex = (index + ttHfwDeck.length) % ttHfwDeck.length;
  ttShowHfw(ttHfwDeck[ttHfwIndex], substep, { preserveDeckIndex: true });
}

function ttShowHfwByDeck(word, substep = ttById("ttHfwStep")?.value || ttLesson?.substep || "") {
  const deckIndex = ttHfwDeck.findIndex((item) => item === word);
  if (deckIndex >= 0) {
    ttShowHfwCard(deckIndex, substep);
    return;
  }
  ttShowHfw(word, substep);
}

function ttShowHfw(word, substep, options = {}) {
  const display = ttById("ttHfwDisplay");
  if (!display) return;
  if (!options.preserveDeckIndex) {
    const deckIndex = ttHfwDeck.findIndex((item) => item === word);
    if (deckIndex >= 0) ttHfwIndex = deckIndex;
  }
  display.querySelector("strong").textContent = word;
  ttById("ttHfwSubstep").textContent = substep;
  ttRenderHfwCount();
}

function ttRenderHfwCount() {
  const count = ttById("ttHfwCount");
  if (!count) return;
  count.textContent = ttHfwDeck.length ? `${ttHfwIndex + 1} of ${ttHfwDeck.length}` : "0 of 0";
}

function ttFillSentences(sentences) {
  const list = ttById("ttSentences");
  list.innerHTML = "";
  const source = sentences.length ? sentences.slice(0, 10) : ["Use the assigned Reader sentence page."];
  source.forEach((sentence, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = sentence;
    button.addEventListener("click", () => ttShowSentence(sentence));
    item.appendChild(button);
    list.appendChild(item);
    if (index === 0) ttShowSentence(sentence, true);
  });
}

function ttShowSentence(sentence, quiet = false) {
  const display = ttById("ttSentenceDisplay");
  if (!display) return;
  display.hidden = false;
  display.querySelector("p").textContent = sentence;
  display.classList.toggle("long-sentence", sentence.length > 78);
  if (!quiet) display.scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelectorAll("#ttSentences button").forEach((button) => {
    button.classList.toggle("active", button.textContent === sentence);
  });
}

function ttCloseSentenceDisplay() {
  const display = ttById("ttSentenceDisplay");
  if (display) display.hidden = true;
  document.querySelectorAll("#ttSentences button.active").forEach((button) => button.classList.remove("active"));
}

function ttFillDictation(items) {
  const container = ttById("ttDictation");
  container.innerHTML = "";
  const encodingBar = document.createElement("div");
  encodingBar.className = "encoding-bar";
  container.appendChild(encodingBar);
  const hfwItems = ttHighFrequencyItemsFromPhrases(items);
  const dictationItems = items.flatMap((item) => (item.values || []).map((value) => ({
    value,
    category: item.label,
    group: item.label.replace(/^\d+\s*/, "")
  })));
  ttFillEncodingStudentGrid(encodingBar, "section8", "Dictation", hfwItems.concat(dictationItems));

  const sheet = document.createElement("div");
  sheet.className = "dictation-sheet";
  items.forEach((item, blockIndex) => {
    const block = document.createElement("section");
    block.className = "dictation-block";
    block.innerHTML = `<strong>${escapeHtml(item.label)}</strong><div class="dictation-checks"></div>`;
    const checks = block.querySelector(".dictation-checks");
    item.values.forEach((value, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span>${index + 1}</span>${escapeHtml(value)}`;
      button.dataset.value = value;
      button.dataset.category = item.label;
      button.dataset.blockIndex = String(blockIndex);
      button.dataset.itemIndex = String(index);
      ttBindSingleOrTriple(
        button,
        () => ttToggleEncodingForActiveStudent(button, "section8", item.label, value),
        () => ttReplaceDictationItem(blockIndex, index)
      );
      checks.appendChild(button);
    });
    sheet.appendChild(block);
  });
  container.appendChild(sheet);
}

function ttActiveDictationPlan(lesson, skill) {
  const sectionSeven = ttSectionSevenSetsForLesson(lesson, skill);
  const avoidWordKeys = new Set([]
    .concat(sectionSeven.review || [])
    .concat(sectionSeven.nonsense || [])
    .concat(sectionSeven.current || [])
    .map(ttWordKey)
    .filter(Boolean));
  const plan = lesson.dictationPlanOverride || ttDictationPlan(lesson, skill, { avoidWordKeys });
  return ttSanitizeDictationPlan(plan, lesson, skill, avoidWordKeys);
}

function ttReplaceDictationItem(blockIndex, itemIndex) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const plan = ttActiveDictationPlan(ttLesson, skill).map((item) => ({ ...item, values: (item.values || []).slice() }));
  const block = plan[blockIndex];
  if (!block) return;
  const oldValue = block.values[itemIndex];
  const sectionSeven = ttSectionSevenSetsForLesson(ttLesson, skill);
  const avoidWordKeys = new Set([]
    .concat(sectionSeven.review || [])
    .concat(sectionSeven.nonsense || [])
    .concat(sectionSeven.current || [])
    .map(ttWordKey)
    .filter(Boolean));
  const pool = /real words|nonsense/i.test(block.label || "")
    ? ttWithoutWordKeys(ttDictationReplacementPool(block.label, ttLesson, skill), avoidWordKeys)
    : ttDictationReplacementPool(block.label, ttLesson, skill);
  block.values[itemIndex] = ttPickReplacement(pool, block.values, oldValue);
  ttLesson.dictationPlanOverride = plan;
  ttSaveDraftLesson();
  ttFillDictation(plan);
}

function ttDictationReplacementPool(label, lesson, skill) {
  const level = lesson.readerLevel || "AB";
  const substep = lesson.substep || skill.id;
  if (/sounds/i.test(label)) return soundsFromWords((lesson.realWords || []).concat(lesson.nonsenseWords || []), skill.id).concat(fiveDictationSounds(skill.id));
  if (/word elements/i.test(label)) return elementsFromWords((lesson.realWords || []).concat(lesson.readerSentences || []), skill.id).concat(fiveWordElements(skill.id, lesson.realWords || []));
  if (/real words/i.test(label)) return ttSection8RealWords().concat(ttCurrentRealWordPool(lesson, skill), ttReviewRealWordPool(lesson, skill));
  if (/nonsense/i.test(label)) return ttNonsenseWordPool(lesson, skill);
  if (/phrases/i.test(label)) return rankedCurrentDictationPhraseRows(currentDictationPhraseRows(substep), lesson, skill)
    .concat(currentDictationPhraseBank(substep));
  if (/sentences/i.test(label)) {
    const sentenceBank = currentDictationSentencesForLesson(lesson, skill, ttActiveGroup());
    return rankedCurrentDictationSentences(sentenceBank, lesson, skill, ttActiveGroup())
      .concat(currentReaderSentencesForDictation(lesson, skill), sentenceBank);
  }
  return [];
}

function ttHighFrequencyItemsFromPhrases(items = []) {
  const hfwBank = new Set();
  (ttLesson?.highFrequencyWords || []).forEach((word) => hfwBank.add(String(word).toLowerCase()));
  dictationValues("highFrequency", ttLesson?.substep, ttLesson?.readerLevel || "AB").forEach((word) => hfwBank.add(String(word).toLowerCase()));
  const sentenceData = window.readerSentenceIndex?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || window.readerSentenceIndex?.[ttLesson?.substep]?.AB
    || window.readerSentences?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || {};
  Object.values(sentenceData || {}).forEach((page) => {
    (page.h || page.highFrequencyWords || page.highFrequency || []).forEach((word) => hfwBank.add(String(word).toLowerCase()));
  });
  [
    "a", "the", "to", "of", "is", "was", "were", "you", "your", "our", "through",
    "throughout", "called", "another", "would", "could", "should", "their", "there"
  ].forEach((word) => hfwBank.add(word));
  const phrases = items
    .filter((item) => /phrases/i.test(item.label || ""))
    .flatMap((item) => item.values || []);
  const seen = new Set();
  const found = [];
  phrases.forEach((phrase) => {
    String(phrase || "").toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g)?.forEach((token) => {
      if (!hfwBank.has(token) || seen.has(token)) return;
      seen.add(token);
      found.push({ value: token, category: "HFW from phrase", group: "HFW from phrases" });
    });
  });
  return found;
}

function ttSelectDictationItem(button, value, category) {
  if (button.classList.contains("selected")) {
    button.classList.remove("selected");
    const container = ttById("ttDictation");
    container.dataset.selectedValue = "";
    container.dataset.selectedCategory = "";
    container.querySelector(".dictation-selected").textContent = "Tap item, then student";
    ttClearEncodingSelection("section8");
    return;
  }
  document.querySelectorAll(".dictation-checks button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  const container = ttById("ttDictation");
  container.dataset.selectedValue = value;
  container.dataset.selectedCategory = category;
  container.querySelector(".dictation-selected").textContent = `Selected: ${value}`;
  const bar = ttEncodingBarForSection("section8");
  if (bar) {
    bar.dataset.selectedValue = value;
    bar.dataset.selectedCategory = category;
    bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
  }
}

function ttSaveDictationMissForStudent(student) {
  const container = ttById("ttDictation");
  const value = container.dataset.selectedValue || "";
  const category = container.dataset.selectedCategory || "";
  if (!value) {
    container.querySelector(".dictation-selected").textContent = "Tap an item first";
    return;
  }
  ttEnsureCurrentLessonSavedForData();
  const group = ttActiveGroup();
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  group.dictationMisses ||= [];
  group.dictationMisses.push({
    id: `dictation-miss-${Date.now()}`,
    date: new Date().toISOString(),
    student,
    substep: ttLesson?.substep || group.substep,
    category,
    item: value,
    ...lessonMeta
  });
  ttSaveEncodingObservation(student, "section8", category, "encoding miss", value);
  group.markedReviewWords ||= [];
  group.markedReviewWords.push({
    word: value,
    source: `section8-${category}`,
    student,
    substep: ttLesson?.substep || group.substep,
    date: new Date().toISOString()
  });
  saveState();
  document.querySelectorAll(".dictation-checks button.selected").forEach((button) => {
    button.classList.add("missed");
    button.classList.remove("selected");
  });
  container.dataset.selectedValue = "";
  container.dataset.selectedCategory = "";
  ttClearEncodingSelection("section8");
  container.querySelector(".dictation-selected").textContent = `Saved: ${student} missed ${value}`;
}

function ttDictationPlan(lesson, skill, options = {}) {
  const group = ttActiveGroup();
  const substep = lesson.substep || skill.id;
  const level = lesson.readerLevel || "AB";
  const avoidWordKeys = options.avoidWordKeys || new Set();
  const sentenceLevel = dictationSentenceLevel(level);
  const phraseRows = currentDictationPhraseRows(substep);
  const phraseBank = phraseRowsToPhrases(phraseRows);
  const sentenceBank = currentDictationSentencesForLesson(lesson, skill, group);
  const rankedSentences = rankedCurrentDictationSentences(sentenceBank, lesson, skill, group);
  const sentences = fillToCount(rankedSentences, sentenceBank.concat(currentReaderSentencesForDictation(lesson, skill)), 2);
  const sentenceTokens = tokenSet(sentences.join(" "));
  const sentenceHfw = highFrequencyWordsFromTexts(sentences, lesson);
  const currentWords = ttWithoutWordKeys(ttCurrentRealWordPool(lesson, skill), avoidWordKeys).slice(0, 2);
  const reviewWords = ttWithoutWordKeys(ttReviewRealWordPool(lesson, skill), avoidWordKeys);
  const priorWords = ttWithoutWordKeys(ttReviewRealWordPool(lesson, skill).concat(ttCurrentRealWordPool(lesson, skill)), avoidWordKeys);
  const fallbackCurrentWords = ttWithoutWordKeys(ttCurrentRealWordPool(lesson, skill).concat(ttReviewRealWordPool(lesson, skill)), avoidWordKeys);
  const words = fillToCount(reviewWords, priorWords, 3)
    .concat(fillToCount(currentWords, fallbackCurrentWords, 2))
    .slice(0, 5);
  const phraseMatches = rankedCurrentDictationPhraseRows(phraseRows, lesson, skill, sentenceTokens, sentenceHfw);
  const phrases = fillToCount(phraseMatches, phraseBank, 3);
  const soundTargets = soundsFromWords(words.concat(threeNonsenseWords(skill.id, level)), skill.id);
  const elementTargets = elementsFromWords(words.concat(lesson.realWords || [], sentences), skill.id);
  const nonsenseWords = fillToCount(
    ttWithoutWordKeys(ttNonsenseWordPool(lesson, skill), avoidWordKeys),
    ttWithoutWordKeys(threeNonsenseWords(skill.id, level), avoidWordKeys),
    3
  );
  return [
    { label: "5 sounds", values: fillToCount(soundTargets, fiveDictationSounds(skill.id).concat(["ă", "ĕ", "ĭ", "ŏ", "ŭ"]), 5) },
    { label: "5 word elements", values: fillToCount(elementTargets, fiveWordElements(skill.id, lesson.realWords || []), 5) },
    { label: "5 real words", values: words },
    { label: "3 nonsense words", values: nonsenseWords },
    { label: "3 phrases", values: phrases },
    { label: "2 sentences", values: sentences }
  ];
}

function dictationSentenceLevel(level) {
  return level === "B" ? "B" : "AB";
}

function currentDictationSentencesForLesson(lesson, skill, group) {
  const substep = lesson.substep || skill.id;
  const groups = structuredDictationSentenceGroups(substep, lesson.readerLevel || "AB");
  const currentGroups = groups.filter((item) => item.kind === "current");
  const sourceGroups = currentGroups.length ? currentGroups : groups;
  const chunks = sourceGroups.flatMap((item) => item.chunks || []);
  if (!chunks.length) return dictationItems("sentences", substep, dictationSentenceLevel(lesson.readerLevel || "AB"), 80);
  const preferredIndex = preferredSentenceChunkIndex(lesson, skill, chunks.length);
  const preferred = chunks[preferredIndex]?.sentences || [];
  const fallback = chunks.flatMap((chunk) => chunk.sentences || []);
  const pool = preferred.length >= 2 ? preferred.concat(fallback) : fallback;
  return isStrugglingGroup(group) ? pool.filter((sentence) => sentenceWordCount(sentence) <= 10).concat(pool) : pool;
}

function preferredSentenceChunkIndex(lesson, skill, chunkCount) {
  if (chunkCount <= 1) return 0;
  const level = lesson.readerLevel || "AB";
  const pages = pageList(skill, "wordlist", level);
  const pageIndex = Math.max(pages.indexOf(lesson.wordlistPageNumber), 0);
  if (!pages.length) return 0;
  return Math.min(Math.floor((pageIndex / Math.max(pages.length, 1)) * chunkCount), chunkCount - 1);
}

function currentDictationPhraseBank(substep) {
  const rows = currentDictationPhraseRows(substep);
  if (rows.length) return phraseRowsToPhrases(rows);
  return dictationItems("phrases", substep, "AB", 80);
}

function currentDictationPhraseRows(substep) {
  return window.dictationPhraseIndex?.[substep] || [];
}

function phraseRowsToPhrases(rows) {
  return rows.flatMap((row) => row.phrases || []);
}

function tokenSet(text) {
  return new Set(String(text || "").toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g) || []);
}

function highFrequencyWordsFromTexts(texts, lesson) {
  const known = new Set((lesson.highFrequencyWords || []).map((word) => String(word).toLowerCase()));
  const sentenceData = window.readerSentenceIndex?.[lesson.substep]?.[lesson.readerLevel || "AB"]
    || window.readerSentenceIndex?.[lesson.substep]?.AB
    || window.readerSentences?.[lesson.substep]?.[lesson.readerLevel || "AB"]
    || {};
  Object.values(sentenceData || {}).forEach((page) => {
    (page.h || page.highFrequency || page.highFrequencyWords || []).forEach((word) => known.add(String(word).toLowerCase()));
  });
  return [...tokenSet(texts.join(" "))].filter((word) => known.has(word));
}

function rankedCurrentDictationSentences(sentences, lesson, skill, group) {
  const currentHfw = new Set(currentHfwForDictation(lesson, skill));
  const pageWords = new Set((lesson.realWords || []).map((word) => String(word).toLowerCase()));
  const struggling = isStrugglingGroup(group);
  const scored = sentences
    .map((sentence, index) => {
      const tokens = tokenSet(sentence);
      let currentHfwHits = 0;
      let pageWordHits = 0;
      tokens.forEach((token) => {
        if (currentHfw.has(token)) currentHfwHits += 1;
        if (pageWords.has(token)) pageWordHits += 1;
      });
      const wordCount = sentenceWordCount(sentence);
      const difficulty = wordCount + estimatedSentenceSyllables(sentence) + (struggling && wordCount > 8 ? 20 : 0);
      const score = (index * 2) + difficulty - (currentHfwHits * 18) - (pageWordHits * 5);
      return { sentence, score, index, currentHfwHits, wordCount };
    })
    .filter((item) => !currentHfw.size || item.currentHfwHits > 0);
  const source = scored.length >= 2 ? scored : sentences.map((sentence, index) => ({
    sentence,
    index,
    currentHfwHits: 0,
    wordCount: sentenceWordCount(sentence),
    score: (index * 2) + sentenceWordCount(sentence) + estimatedSentenceSyllables(sentence)
  }));
  const shortSource = struggling ? source.filter((item) => item.wordCount <= 8) : [];
  return (shortSource.length >= 2 ? shortSource : source)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((item) => item.sentence);
}

function currentHfwForDictation(lesson, skill) {
  return uniqueWords([]
    .concat(dictationValues("highFrequency", skill.id, dictationSentenceLevel(lesson.readerLevel || "AB")))
    .concat(hfwWordsForSubstep(skill.id, lesson))
    .concat(lesson.highFrequencyWords || []))
    .map((word) => String(word).toLowerCase());
}

function currentReaderSentencesForDictation(lesson, skill) {
  const currentHfw = new Set(currentHfwForDictation(lesson, skill));
  const sentences = (lesson.readerSentences || []).filter(Boolean);
  const hfwMatches = sentences.filter((sentence) => [...tokenSet(sentence)].some((token) => currentHfw.has(token)));
  return hfwMatches.length ? hfwMatches : sentences;
}

function sentenceWordCount(sentence) {
  return String(sentence || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length || 0;
}

function estimatedSentenceSyllables(sentence) {
  return (String(sentence || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [])
    .reduce((sum, word) => sum + estimatedSyllables(word), 0);
}

function isStrugglingGroup(group) {
  const trouble = new Set(group?.trouble || []);
  return ["blending", "slow decoding", "dictation", "vowel sounds", "fluency"].some((item) => trouble.has(item));
}

function rankedCurrentDictationPhraseRows(rows, lesson, skill, sentenceTokens = new Set(), sentenceHfw = []) {
  const common = new Set(["a", "an", "the", "in", "into", "on", "at", "to", "of", "and", "is", "was", "were"]);
  const currentHfw = new Set(currentHfwForDictation(lesson, skill).filter((word) => !common.has(word)));
  const pageWords = new Set((lesson.realWords || []).map((word) => String(word).toLowerCase()));
  const hfwSet = new Set(sentenceHfw.filter((word) => !common.has(word)));
  const contentTokens = [...sentenceTokens].filter((word) => word.length > 3 && !common.has(word));
  const scored = rows
    .map((row, index) => {
      const rowPhrases = row.phrases || [];
      const tokens = tokenSet(rowPhrases.join(" "));
      const hfw = String(row.hfw || "").toLowerCase();
      let score = 0;
      if (currentHfw.has(hfw)) score += 30;
      currentHfw.forEach((word) => {
        if (tokens.has(word)) score += 10;
      });
      hfwSet.forEach((word) => {
        if (tokens.has(word)) score += 6;
      });
      contentTokens.forEach((word) => {
        if (tokens.has(word)) score += 3;
      });
      pageWords.forEach((word) => {
        if (tokens.has(word)) score += 2;
      });
      return { row, score, index, length: tokens.size };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index || a.length - b.length);
  const matches = scored.filter((item) => item.score > 0);
  return (matches.length ? matches : scored)
    .flatMap((item) => item.row.phrases || []);
}

function soundsFromWords(words, substep) {
  const text = words.join(" ").toLowerCase();
  const vowelMap = { a: "ă", e: "ĕ", i: "ĭ", o: "ŏ", u: "ŭ" };
  const vowelHits = Object.entries(vowelMap)
    .map(([letter, sound]) => ({ sound, count: (text.match(new RegExp(letter, "g")) || []).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => item.sound);
  const distinctive = ["x", "qu", "j", "z", "v", "y"].filter((sound) => text.includes(sound));
  const digraphs = ["sh", "ch", "th", "wh", "ck", "ph", "tch", "dge"].filter((sound) => text.includes(sound));
  const welded = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(substep, step))
    .map(([, value]) => value)
    .filter((sound) => text.includes(sound))
    .sort((a, b) => Number(a === "ing") - Number(b === "ing") || b.length - a.length);
  const consonants = consonantSoundList(substep)
    .filter((sound) => sound.length === 1 && !distinctive.includes(sound) && text.includes(sound));
  return [...new Set([
    vowelHits[0],
    ...distinctive,
    ...digraphs.slice(0, 2),
    ...welded,
    ...digraphs.slice(2),
    ...vowelHits.slice(1),
    ...consonants
  ].filter(Boolean))];
}

function elementsFromWords(words, substep) {
  const text = words.join(" ").toLowerCase();
  const wordList = String(text).match(/[a-z]+(?:-[a-z]+)?/g) || [];
  const suffixes = knownSuffixValues(substep)
    .filter((suffix) => wordList.some((word) => word.endsWith(suffix)))
    .map((suffix) => `-${suffix}`);
  const prefixes = knownPrefixValues(substep)
    .filter((prefix) => wordList.some((word) => word.startsWith(prefix)))
    .map((prefix) => `${prefix}-`);
  const latinBases = knownLatinBaseValues(substep)
    .filter((base) => text.includes(base))
    .map((base) => `-${base}-`);
  return [...new Set(suffixes.concat(prefixes, latinBases))];
}

function fillToCount(primary, fallback, count) {
  const values = [];
  primary.concat(fallback).forEach((item) => {
    if (item && !values.includes(item) && values.length < count) values.push(item);
  });
  return values;
}

function validDictationWords(words, preferred = []) {
  const preferredSet = new Set(preferred);
  return words
    .filter(isValidDictationWord)
    .sort((a, b) => Number(preferredSet.has(b)) - Number(preferredSet.has(a)));
}

function isValidDictationWord(word) {
  const banned = new Set(["ing", "ang", "ong", "ung", "ank", "ink", "onk", "unk", "all", "am", "an", "ild", "ind", "old", "olt", "ost", "suffix", "prefix", "base"]);
  return isUsableReaderWord(word) && word.length >= 3 && !banned.has(word.toLowerCase());
}

function dictationWordsFor(substep, level) {
  return dictationValues("words", substep, level);
}

function priorDictationWords(substep, level) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const words = [];
  for (let index = currentIndex - 1; index >= 0 && words.length < 80; index -= 1) {
    words.push(...dictationWordsFor(scopeMap[index].id, level));
  }
  return words;
}

function hasVisibleSuffix(word) {
  return /(s|es|ed|ing|ful|less|ly|ness|ment|able|ive)$/i.test(word);
}

function fiveDictationSounds(substep) {
  const sounds = soundsForSubstep(substep);
  return `${sounds.vowels}, ${sounds.consonants}, ${sounds.welded}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function fiveWordElements(substep, pageWords) {
  const suffixes = knownSuffixValues(substep).filter((suffix) => pageWords.some((word) => word.endsWith(suffix))).slice(0, 2).map((suffix) => `-${suffix}`);
  const prefixes = knownPrefixValues(substep).filter((prefix) => pageWords.some((word) => word.startsWith(prefix))).slice(0, 2).map((prefix) => `${prefix}-`);
  const base = knownLatinBaseValues(substep)[0] ? [`-${knownLatinBaseValues(substep)[0]}-`] : [];
  return prefixes.concat(suffixes, base, knownPrefixValues(substep).slice(0, 4).map((prefix) => `${prefix}-`), knownSuffixValues(substep).slice(0, 4).map((suffix) => `-${suffix}`)).slice(0, 5);
}

function threeNonsenseWords(substep, level) {
  const candidates = ["2.2", "2.4", "2.5", "3.1", "3.2", "4.1", "4.2", substep]
    .flatMap((step) => readerNonsenseWordsForReview(step, substep));
  return [...new Set(candidates)].filter(isUsableReaderWord).slice(0, 3);
}

function ttSetupChart(lesson) {
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(lesson, skill);
  const card = ttById("section4");
  ttChartCard = card;
  card.dataset.lessonId = lesson.id;
  card.dataset.elapsed = "0";
  card.dataset.startedAt = "";
  card.dataset.startElapsed = "0";
  card.dataset.chartHalf = "bottom";
  card._lesson = lesson;
  fillChartBoard(card.querySelector(".chart-top"), lesson.realWords || [], "top");
  fillChartBoard(card.querySelector(".chart-bottom"), lesson.nonsenseWords || [], "bottom");
  ttRenderChartIntegrity(lesson);
  ttFillStudentPills(group);
  syncChartHalfUi(card);
  updateLiveScore(card);
  ttRenderSection4StagePreview(ttSection4StagePayload());
}

function ttExactChartingWords(skill, lesson) {
  const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
  return chartingWordsForReaderPage(skill.id, level, lesson.wordlistPageNumber);
}

function ttEnsureSection4PageIntegrity(lesson, skill, forceSource = false) {
  let sourceWords = ttExactChartingWords(skill, lesson);
  const savedWords = [].concat(lesson.realWords || [], lesson.nonsenseWords || []).filter(isUsableReaderWord);
  let sourceHasFullPage = sourceWords.length >= 30;
  const savedHasFullPage = savedWords.length >= 30;

  if (sourceWords.length < 15 && !savedHasFullPage) {
    const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
    const validPages = pageList(skill, "wordlist", level);
    const replacementPage = validPages.find((page) => page !== lesson.wordlistPageNumber) || validPages[0];
    if (replacementPage) {
      lesson.wordlistPageNumber = replacementPage;
      lesson.readerLevel = resolvedLevel(skill, "wordlist", level);
      const assignment = {
        reader: skill.reader,
        page: replacementPage,
        level: lesson.readerLevel,
        index: Math.max(0, validPages.indexOf(replacementPage)) + 1,
        total: validPages.length
      };
      lesson.wordlistMeta = `Reader ${skill.reader}, p. ${replacementPage} - ${pagePositionLabel(assignment, "wordlist")}`;
      sourceWords = ttExactChartingWords(skill, lesson);
      sourceHasFullPage = sourceWords.length >= 30;
    }
  }

  if (sourceHasFullPage) {
    const expected = sourceWords.slice(0, 30).join("|");
    const current = savedWords.slice(0, 30).join("|");
    if (expected !== current || (lesson.realWords || []).length !== 15 || (lesson.nonsenseWords || []).length !== 15) {
      lesson.realWords = sourceWords.slice(0, 15);
      lesson.nonsenseWords = sourceWords.slice(15, 30);
    }
    lesson.section4Integrity = {
      status: "ok",
      message: `Section 4 checked: 30 words loaded from Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}.`
    };
    return true;
  }

  if (!sourceHasFullPage && !forceSource && savedHasFullPage) {
    lesson.realWords = savedWords.slice(0, 15);
    lesson.nonsenseWords = savedWords.slice(15, 30);
    lesson.section4Integrity = {
      status: "warning",
      message: `Saved lesson has 30 charting words, but the Reader page source currently shows ${sourceWords.length}/30. Use Recheck only after confirming the page data.`
    };
    return false;
  }

  lesson.realWords = sourceWords.slice(0, 15);
  lesson.nonsenseWords = sourceWords.slice(15, 30);
  const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
  const pageCounts = ttChartingPageCounts(skill, level);
  const fullCount = pageCounts.filter((item) => item.count >= 30).length;
  const fullSummary = fullCount ? "" : ` No complete ${level} charting page is indexed for this substep.`;
  const countSummary = pageCounts.length
    ? ` Indexed ${level} pages: ${pageCounts.map((item) => `p.${item.page} ${item.count}/30`).join(", ")}.`
    : "";
  lesson.section4Integrity = {
    status: sourceWords.length >= 15 ? "warning" : "error",
    message: sourceWords.length >= 15
      ? `Reader page source has ${sourceWords.length}/30 words for Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}. Top is usable, but Bottom is incomplete in the source.${fullSummary}${countSummary}`
      : `Reader page source is incomplete: ${sourceWords.length}/30 words found for Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}. Do not chart this page until corrected.${fullSummary}${countSummary}`
  };
  return false;
}

function ttChartingPageCounts(skill, level) {
  const pages = skill.pages?.wordlist || {};
  const resolved = pages[level]?.length ? level : pages.AB?.length ? "AB" : pages.A?.length ? "A" : pages.B?.length ? "B" : level;
  const listed = pages[resolved] || [];
  return listed.map((page) => ({
    page,
    count: chartingPageEntry(skill.id, resolved, page).count
  }));
}

function ttRenderChartIntegrity(lesson) {
  const status = ttById("ttChartIntegrity");
  if (!status) return;
  const info = lesson.section4Integrity || {};
  status.textContent = info.message || "Section 4 checked.";
  status.classList.toggle("warning", info.status === "warning");
  status.classList.toggle("error", info.status === "error");
}

function ttRecheckSection4Words() {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(ttLesson, skill, true);
  ttSaveDraftLesson();
  ttRender();
  ttById("section4")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttFillStudentPills(group) {
  const container = ttById("ttStudentPills");
  container.innerHTML = "";
  group.students.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `student-pill${student === group.activeStudent ? " active" : ""}`;
    button.dataset.student = student;
    const status = performanceStatus(recordsForStudent(student));
    button.innerHTML = `<span class="status-dot ${status.color}"></span>${escapeHtml(student)}`;
    button.addEventListener("click", () => ttSelectStudent(student));
    container.appendChild(button);
  });
}

function ttSelectStudent(student) {
  selectActiveStudent(student, { sourceCard: ttChartCard, resetSource: true });
  ttById("ttStudent").value = student;
  ttById("ttTitle").textContent = `${ttActiveGroup().name} - ${ttLesson?.substep || ttActiveGroup().substep}`;
  ttFillFrontStudents(ttActiveGroup());
}

function ttSchedulePresentationMenuClose(delay = 6500) {
  if (ttPresentationMenuTimer) clearTimeout(ttPresentationMenuTimer);
  if (!document.body.classList.contains("presentation-mode")) return;
  ttPresentationMenuTimer = setTimeout(() => {
    document.body.classList.remove("present-menu-open");
    ttPresentationMenuTimer = null;
  }, delay);
}

function ttSetPresentationMenu(open, { hold = false } = {}) {
  if (!document.body.classList.contains("presentation-mode")) return;
  document.body.classList.toggle("present-menu-open", open);
  if (ttPresentationMenuTimer) {
    clearTimeout(ttPresentationMenuTimer);
    ttPresentationMenuTimer = null;
  }
  if (open && !hold) ttSchedulePresentationMenuClose();
}

function ttHandlePresentationLogoClick() {
  if (!document.body.classList.contains("presentation-mode")) return;
  ttSetPresentationMenu(true);
}

function ttHandlePresentationMenuOutsidePointer(event) {
  if (!document.body.classList.contains("present-menu-open")) return;
  const menu = document.querySelector(".teach-bar");
  const logo = ttById("ttPresentMenuLogo");
  if (menu?.contains(event.target) || logo?.contains(event.target)) return;
  ttSetPresentationMenu(false);
}

function ttAllTeachingSectionIds() {
  return [
    "section1", "section2", "section3", "section4", "section5",
    "section1b", "section2b", "section6", "section7", "section8",
    "section9", "section10"
  ];
}

function ttIsTeachingSectionVisible(section) {
  if (!section || section.hidden) return false;
  return window.getComputedStyle(section).display !== "none";
}

function ttPaceGuideSectionIds() {
  return ttAllTeachingSectionIds().filter((id) => ttIsTeachingSectionVisible(ttById(id)));
}

function ttCurrentPaceSectionId() {
  const viewportAnchor = Math.min(window.innerHeight * 0.38, 230);
  let current = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  ttPaceGuideSectionIds().forEach((id) => {
    const section = ttById(id);
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const isNearView = rect.bottom > 80 && rect.top < window.innerHeight * 0.78;
    if (!isNearView) return;
    const distance = Math.abs(rect.top - viewportAnchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      current = id;
    }
  });
  const sectionIds = ttPaceGuideSectionIds();
  const priorSection = sectionIds.includes(ttPaceGuideState.activeSectionId)
    ? ttPaceGuideState.activeSectionId
    : "";
  return current || priorSection || sectionIds[0] || "section1";
}

function ttGoToTeachingSection(direction) {
  const sectionIds = ttPaceGuideSectionIds();
  if (!sectionIds.length) return;
  const currentId = ttCurrentPaceSectionId();
  const currentIndex = Math.max(0, sectionIds.indexOf(currentId));
  const targetIndex = Math.max(0, Math.min(sectionIds.length - 1, currentIndex + direction));
  const targetId = sectionIds[targetIndex];
  ttById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  ttPaceGuideState.activeSectionId = targetId;
  ttPaceGuideState.sectionStartedAt = Date.now();
  ttUpdatePaceGuide();
}

function ttSetPaceGuideLine(line, progressLeft) {
  const fill = line?.querySelector("i");
  if (!line || !fill) return;
  const clamped = Math.max(0, Math.min(1, progressLeft));
  fill.style.width = `${Math.max(4, clamped * 100)}%`;
  line.classList.toggle("is-dot", clamped <= 0.04);
}

function ttUpdatePaceGuideSection() {
  if (!ttPaceGuideState.running) return;
  const sectionId = ttCurrentPaceSectionId();
  if (sectionId && sectionId !== ttPaceGuideState.activeSectionId) {
    ttPaceGuideState.activeSectionId = sectionId;
    ttPaceGuideState.sectionStartedAt = Date.now();
  }
}

function ttUpdatePaceGuide() {
  if (!ttPaceGuideState.running) return;
  ttUpdatePaceGuideSection();
  const guide = ttById("ttPaceGuide");
  if (!guide) return;
  const now = Date.now();
  const lessonLeft = 1 - ((now - ttPaceGuideState.lessonStartedAt) / ttPaceGuideLessonMs());
  const sectionLeft = 1 - ((now - ttPaceGuideState.sectionStartedAt) / ttPaceGuideSectionMs);
  ttSetPaceGuideLine(guide.querySelector(".pace-line-lesson"), lessonLeft);
  ttSetPaceGuideLine(guide.querySelector(".pace-line-section"), sectionLeft);
}

function ttStartPaceGuide() {
  const guide = ttById("ttPaceGuide");
  if (!guide) return;
  const now = Date.now();
  ttPaceGuideState = {
    running: true,
    lessonStartedAt: now,
    sectionStartedAt: now,
    activeSectionId: ttCurrentPaceSectionId()
  };
  guide.hidden = false;
  if (ttPaceGuideTimer) clearInterval(ttPaceGuideTimer);
  ttUpdatePaceGuide();
  ttPaceGuideTimer = setInterval(ttUpdatePaceGuide, 1000);
}

function ttStopPaceGuide() {
  ttPaceGuideState.running = false;
  if (ttPaceGuideTimer) {
    clearInterval(ttPaceGuideTimer);
    ttPaceGuideTimer = null;
  }
  const guide = ttById("ttPaceGuide");
  if (guide) guide.hidden = true;
}

async function ttTogglePresentation(force = null, options = {}) {
  const shouldPresent = force ?? !document.body.classList.contains("presentation-mode");
  document.body.classList.toggle("presentation-mode", shouldPresent);
  if (shouldPresent) {
    document.body.classList.remove("legacy-full-lesson-mode");
    ttSetPresentationMenu(false);
  } else {
    ttTogglePresentDisplayTray(false);
    document.body.classList.remove("present-menu-open");
    if (ttPresentationMenuTimer) {
      clearTimeout(ttPresentationMenuTimer);
      ttPresentationMenuTimer = null;
    }
  }
  const button = ttById("ttPresent");
  if (button) button.textContent = shouldPresent ? "Exit" : "Present";
  try {
    if (shouldPresent && options.fullscreen !== false && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (!shouldPresent && options.fullscreen !== false && document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    /* iPad Safari may not allow fullscreen unless launched as a web app. */
  }
}

function ttToggleNotes(force = null, clearWhenOff = true) {
  ttNotesEnabled = force ?? !ttNotesEnabled;
  document.body.classList.toggle("notes-mode", ttNotesEnabled);
  ttById("ttNotesToggle")?.classList.toggle("active", ttNotesEnabled);
  if (ttNotesEnabled) {
    ttResizeNotesCanvas();
  } else {
    ttNotesDrawing = false;
    ttNotesLastPoint = null;
    if (clearWhenOff) ttClearCanvas("ttNotesCanvas");
  }
}

function ttResizeNotesCanvas() {
  ttResizeCanvas("ttNotesCanvas");
}

function ttResizeCanvas(canvasId) {
  const canvas = ttById(canvasId);
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function ttCanvasPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  return { x: touch.clientX, y: touch.clientY };
}

function ttDrawLine(canvasId, from, to, options) {
  if (!from || !to) return;
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = options.stroke;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = options.blur ?? 10;
  ctx.lineWidth = options.width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function ttDrawDot(canvasId, point, options) {
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx || !point) return;
  ctx.save();
  ctx.fillStyle = options.fill;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = options.blur ?? 10;
  ctx.beginPath();
  ctx.arc(point.x, point.y, options.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ttClearCanvas(canvasId) {
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function ttNotesStart(event) {
  if (!ttNotesEnabled) return;
  event.preventDefault();
  ttResizeNotesCanvas();
  ttNotesDrawing = true;
  ttNotesLastPoint = ttCanvasPoint(event);
  ttDrawDot("ttNotesCanvas", ttNotesLastPoint, {
    fill: "rgba(220, 38, 38, 0.9)",
    shadow: "rgba(220, 38, 38, 0.45)",
    radius: 5
  });
}

function ttNotesMove(event) {
  if (!ttNotesEnabled || !ttNotesDrawing) return;
  event.preventDefault();
  const point = ttCanvasPoint(event);
  ttDrawLine("ttNotesCanvas", ttNotesLastPoint, point, {
    stroke: "rgba(220, 38, 38, 0.82)",
    shadow: "rgba(220, 38, 38, 0.45)",
    width: 8
  });
  ttNotesLastPoint = point;
}

function ttNotesEnd(event) {
  if (!ttNotesEnabled) return;
  event.preventDefault();
  ttNotesDrawing = false;
  ttNotesLastPoint = null;
}

function ttOpenWhiteboard() {
  const board = ttById("ttWhiteboard");
  if (!board) return;
  if (ttNotesEnabled) ttToggleNotes(false, false);
  board.hidden = false;
  document.body.classList.add("whiteboard-mode");
  ttById("ttWhiteboardTitle").textContent = ttSection2Word ? `Whiteboard - ${ttSection2Word}` : "Section 2 Whiteboard";
  ttSetWhiteboardMode("move");
  requestAnimationFrame(() => {
    ttResizeWhiteboardCanvases();
    ttRenderWhiteboardPalette();
    if (!ttById("ttWhiteboardTiles").querySelector(".wb-built-tile")) ttBuildCurrentWordOnWhiteboard();
  });
}

function ttCloseWhiteboard() {
  ttById("ttWhiteboard").hidden = true;
  document.body.classList.remove("whiteboard-mode");
  ttWhiteboardDrawing = false;
  ttWhiteboardDrag = null;
  window.removeEventListener("pointermove", ttMoveWhiteboardTile);
  window.removeEventListener("pointerup", ttEndWhiteboardTileDrag);
  window.removeEventListener("pointercancel", ttEndWhiteboardTileDrag);
}

function ttSetWhiteboardMode(mode) {
  ttWhiteboardMode = mode;
  document.querySelectorAll(".wb-mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function ttRenderWhiteboardPalette() {
  const currentSubstep = ttLesson?.substep || ttActiveGroup().substep;
  const showAll = ttById("ttWhiteboardScope")?.value === "all";
  const substep = showAll ? "12.9" : currentSubstep;
  const bank = ttById("ttWhiteboardBank");
  if (bank) bank.innerHTML = "";
  const sounds = [
    ..."aeiou".split("").map((text) => ({ text, type: "vowel" })),
    ...consonantSoundList(substep).map((text) => ({ text, type: "consonant" }))
  ];
  const glued = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(substep, step))
    .map(([, text]) => ({ text, type: "glued" }));
  const prefixes = knownPrefixValues(substep).map((prefix) => ({ text: `${prefix}-`, type: "prefix" }));
  const suffixes = knownSuffixValues(substep).map((suffix) => ({ text: `-${suffix}`, type: "suffix" }));
  const latin = knownLatinBaseValues(substep).map((base) => ({ text: `-${base}-`, type: "latin" }));
  ttFillWhiteboardTray("ttWbSounds", sounds);
  ttFillWhiteboardTray("ttWbGlued", glued);
  ttFillWhiteboardTray("ttWbPrefixes", prefixes);
  ttFillWhiteboardTray("ttWbSuffixes", suffixes);
  ttFillWhiteboardTray("ttWbLatin", latin);
  ttLayoutWhiteboardBank(substep, showAll);
}

function ttFillWhiteboardTray(id, cards) {
  const tray = ttById(id);
  if (!tray) return;
  tray.innerHTML = "";
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = card.type;
    button.textContent = card.text;
    button.addEventListener("click", () => ttAutoPlaceWhiteboardCard(card));
    tray.appendChild(button);
  });
}

function ttLayoutWhiteboardBank() {
  const bank = ttById("ttWhiteboardBank");
  const stage = ttById("ttWhiteboardStage");
  if (!bank || !stage) return;
  const showAll = ttById("ttWhiteboardScope")?.value === "all";
  const currentSubstep = showAll ? "12.9" : (ttLesson?.substep || ttActiveGroup().substep);
  const leftRows = [
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h", "i", "j", "k", "l"],
    ["m", "n", "o", "p", "qu", "r", "s"],
    ["t", "u", "v", "w", "x", "y", "z"],
    ["f", "l", "s"],
    ["wh", "ch", "sh", "th", "ck", "ph", "dge", "tch"],
    ["all", "am", "an", "tion", "sion", "y", "ə"],
    ["ild", "ind", "old", "olt", "ost", "ive", "stle"],
    ["ar", "er", "ir", "or", "ur"],
    ["ai", "ay", "ee", "ea", "ey", "oi", "oy"],
    ["oa", "oe", "ow", "ou"],
    ["oo", "ue", "ew", "au", "aw", "eu", "ui"],
    ["", "", ""]
  ];
  const vowelCards = new Set("a e i o u y ə ar er ir or ur ai ay ee ea ey oi oy oa oe ow ou oo ue ew au aw eu ui".split(" "));
  const gluedCards = new Set([...gluedSoundSet(), "tion", "sion", "ive", "stle"]);
  const currentValues = new Set([
    ..."aeiou".split(""),
    ...consonantSoundList(currentSubstep),
    ...knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(currentSubstep, step)).map(([, value]) => {
      if (value.includes("ive")) return "ive";
      if (value.includes("stle")) return "stle";
      return value.replace(/\s+exception|\s+syllable/g, "");
    })
  ]);
  if (isAtLeastSubstep(currentSubstep, "5.3")) currentValues.add("y");
  if (isAtLeastSubstep(currentSubstep, "3.1")) currentValues.add("ə");
  if (isAtLeastSubstep(currentSubstep, "8.1")) "ar er ir or ur".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.1")) "ai ay".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.2")) "ee ey".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.3")) "ea oa oe".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.4")) "oi oy".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.5")) "ow ou".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.6")) "oo ue ew au aw eu ui".split(" ").forEach((card) => currentValues.add(card));
  const rightRows = [["ang", "ank"], ["ing", "ink"], ["ong", "onk"], ["ung", "unk"]];
  bank.innerHTML = "";
  const add = (text, x, y) => {
    if (text && !showAll && !currentValues.has(text)) return;
    const type = !text ? "blank" : gluedCards.has(text) ? "glued" : vowelCards.has(text) ? "vowel" : "consonant";
    bank.appendChild(ttCreateWhiteboardTile({ text, type }, x, y, "wb-bank-tile"));
  };
  const step = showAll ? 50 : 54;
  const bankTop = Math.max(96, (stage.clientHeight || 620) * 0.25);
  const leftWouldOverflow = showAll || (stage.clientHeight || 620) < bankTop + leftRows.length * step + 24;
  const leftRowsToPlace = leftWouldOverflow ? leftRows.slice(0, 8) : leftRows;
  leftRowsToPlace.forEach((row, rowIndex) => row.forEach((text, colIndex) => add(text, 22 + colIndex * step, bankTop + rowIndex * step)));
  const rightX = Math.max(490, Math.min((stage.clientWidth || 900) - 250, 560));
  rightRows.forEach((row, rowIndex) => row.forEach((text, colIndex) => add(text, rightX + colIndex * step, bankTop + rowIndex * step)));
  if (leftWouldOverflow) {
    const extraRows = leftRows.slice(8);
    extraRows.forEach((row, rowIndex) => {
      row.forEach((text, colIndex) => add(text, rightX + (colIndex % 4) * step, bankTop + (rightRows.length + 1 + rowIndex + Math.floor(colIndex / 4)) * step));
    });
  }
}

function ttBuildCurrentWordOnWhiteboard() {
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  const word = ttSection2Word || (ttLesson?.sectionTwoCurrentWords || [])[0] || "";
  if (!word) return;
  ttClearBuiltWhiteboardTiles();
  const cards = section2CardsForWord(word, substep).items;
  const stage = ttById("ttWhiteboardStage");
  const width = stage.clientWidth || 900;
  const tileWidth = cards.some((card) => ["syllable", "prefix", "suffix", "latin"].includes(card.type)) ? 104 : 64;
  const gap = 10;
  const total = cards.length * tileWidth + Math.max(cards.length - 1, 0) * gap;
  let x = Math.max(24, (width - total) / 2);
  const y = Math.max(20, (stage.clientHeight || 520) * 0.12);
  cards.forEach((card) => {
    ttAddWhiteboardTile({ text: section2DisplayCardText(card), type: card.type }, x, y);
    x += tileWidth + gap;
  });
  ttById("ttWhiteboardTitle").textContent = `Whiteboard - ${word}`;
}

function ttAddWhiteboardTile(card, x = null, y = null) {
  const stage = ttById("ttWhiteboardStage");
  const layer = ttById("ttWhiteboardTiles");
  if (!stage || !layer) return;
  const count = layer.querySelectorAll(".wb-built-tile").length;
  const left = x ?? (24 + (count % 10) * 62);
  const top = y ?? Math.max(20, (stage.clientHeight || 520) * 0.12 + Math.floor(count / 10) * 54);
  const tile = ttCreateWhiteboardTile(card, left, top, "wb-built-tile");
  layer.appendChild(tile);
  return tile;
}

function ttCreateWhiteboardTile(card, x, y, extraClass = "") {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = `wb-tile ${card.type || "consonant"} ${extraClass} ${card.big ? "wb-big-syllable" : ""}`.trim();
  tile.textContent = card.text || "";
  if (card.editable) {
    tile.contentEditable = "true";
    tile.autocorrect = "off";
    tile.spellcheck = false;
    tile.inputMode = "text";
    tile.setAttribute("aria-label", "Editable syllable card");
  }
  tile.dataset.tileId = String(++ttWhiteboardTileId);
  tile.dataset.cardText = card.text || "";
  tile.dataset.cardType = card.type || "consonant";
  tile.style.left = `${Math.max(8, x)}px`;
  tile.style.top = `${Math.max(8, y)}px`;
  tile.addEventListener("pointerdown", ttStartWhiteboardTileDrag);
  tile.addEventListener("click", () => {
    if (tile.dataset.autoPlaced === "true") {
      tile.dataset.autoPlaced = "false";
      return;
    }
    if (tile.dataset.dragged === "true" || !tile.classList.contains("wb-bank-tile")) return;
    ttAutoPlaceWhiteboardCard({ text: tile.dataset.cardText, type: tile.dataset.cardType });
  });
  return tile;
}

function ttAutoPlaceWhiteboardCard(card) {
  ttAddWhiteboardTile(card);
}

function ttAddBlankSyllableCard() {
  const layer = ttById("ttWhiteboardTiles");
  const stage = ttById("ttWhiteboardStage");
  if (!layer || !stage) return;
  const count = layer.querySelectorAll(".wb-edit-syllable").length;
  const usableWidth = Math.max(720, stage.clientWidth || window.innerWidth || 900) - 120;
  const cardWidth = Math.min(310, Math.max(210, usableWidth / 4 - 12));
  const col = count % 4;
  const row = Math.floor(count / 4);
  const x = 46 + col * (cardWidth + 14);
  const y = Math.max(92, (stage.clientHeight || 700) * 0.34) + row * 172;
  const tile = ttAddWhiteboardTile({ text: "", type: "syllable", big: true, editable: true }, x, y);
  if (tile) {
    tile.classList.add("wb-edit-syllable");
    tile.style.width = `${cardWidth}px`;
    tile.focus();
  }
}

function ttRemoveBlankSyllableCard() {
  const cards = [...ttById("ttWhiteboardTiles").querySelectorAll(".wb-edit-syllable")];
  cards.at(-1)?.remove();
}

function ttStartWhiteboardTileDrag(event) {
  if (event.currentTarget?.isContentEditable && ttWhiteboardMode !== "move") return;
  event.preventDefault();
  const tile = event.currentTarget;
  const stageRect = ttById("ttWhiteboardStage").getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  tile.dataset.dragged = "false";
  ttWhiteboardDrag = {
    tile,
    offsetX: event.clientX - tileRect.left,
    offsetY: event.clientY - tileRect.top,
    startX: event.clientX,
    startY: event.clientY,
    stageRect
  };
  tile.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", ttMoveWhiteboardTile, { passive: false });
  window.addEventListener("pointerup", ttEndWhiteboardTileDrag, { passive: false });
  window.addEventListener("pointercancel", ttEndWhiteboardTileDrag, { passive: false });
}

function ttMoveWhiteboardTile(event) {
  if (!ttWhiteboardDrag) return;
  event.preventDefault();
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  const { tile, offsetX, offsetY, startX, startY, stageRect } = ttWhiteboardDrag;
  if (Math.abs(touch.clientX - startX) + Math.abs(touch.clientY - startY) > 5) tile.dataset.dragged = "true";
  const maxX = stageRect.width - tile.offsetWidth - 6;
  const maxY = stageRect.height - tile.offsetHeight - 6;
  const x = Math.min(Math.max(touch.clientX - stageRect.left - offsetX, 6), maxX);
  const y = Math.min(Math.max(touch.clientY - stageRect.top - offsetY, 6), maxY);
  tile.style.left = `${x}px`;
  tile.style.top = `${y}px`;
}

function ttEndWhiteboardTileDrag() {
  if (ttWhiteboardDrag?.tile?.classList.contains("wb-bank-tile") && ttWhiteboardDrag.tile.dataset.dragged !== "true") {
    const tile = ttWhiteboardDrag.tile;
    ttAutoPlaceWhiteboardCard({ text: tile.dataset.cardText, type: tile.dataset.cardType });
    tile.dataset.autoPlaced = "true";
    window.setTimeout(() => {
      tile.dataset.autoPlaced = "false";
    }, 250);
  }
  ttWhiteboardDrag = null;
  window.removeEventListener("pointermove", ttMoveWhiteboardTile);
  window.removeEventListener("pointerup", ttEndWhiteboardTileDrag);
  window.removeEventListener("pointercancel", ttEndWhiteboardTileDrag);
}

function ttResizeWhiteboardCanvases() {
  ["ttWhiteboardInk", "ttWhiteboardLaserInk"].forEach((id) => {
    const canvas = ttById(id);
    const stage = ttById("ttWhiteboardStage");
    if (!canvas || !stage) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.floor(stage.clientWidth * ratio);
    const height = Math.floor(stage.clientHeight * ratio);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${stage.clientWidth}px`;
    canvas.style.height = `${stage.clientHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  });
}

function ttWhiteboardPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  const rect = ttById("ttWhiteboardStage").getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function ttWhiteboardPointerStart(event) {
  if (ttById("ttWhiteboard").hidden || ttWhiteboardMode === "move") return;
  if (!event.target.closest?.("#ttWhiteboardStage")) return;
  if (event.target.closest?.(".wb-tile")) return;
  event.preventDefault();
  ttResizeWhiteboardCanvases();
  ttWhiteboardDrawing = true;
  ttWhiteboardLastPoint = ttWhiteboardPoint(event);
  ttDrawWhiteboardPoint(ttWhiteboardLastPoint);
}

function ttWhiteboardPointerMove(event) {
  ttMoveWhiteboardTile(event);
  if (!ttWhiteboardDrawing || ttWhiteboardMode === "move") return;
  event.preventDefault();
  const point = ttWhiteboardPoint(event);
  ttDrawWhiteboardLine(ttWhiteboardLastPoint, point);
  ttWhiteboardLastPoint = point;
}

function ttWhiteboardPointerEnd(event) {
  ttEndWhiteboardTileDrag();
  if (!ttWhiteboardDrawing) return;
  event.preventDefault();
  ttWhiteboardDrawing = false;
  ttWhiteboardLastPoint = null;
  if (ttWhiteboardMode === "laser") {
    setTimeout(() => ttClearWhiteboardCanvas("ttWhiteboardLaserInk"), 450);
  }
}

function ttDrawWhiteboardPoint(point) {
  const canvasId = ttWhiteboardMode === "laser" ? "ttWhiteboardLaserInk" : "ttWhiteboardInk";
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  if (ttWhiteboardMode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = ttWhiteboardMode === "laser" ? "rgba(220,38,38,0.85)" : "rgba(220,38,38,0.92)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ttDrawWhiteboardLine(from, to) {
  if (!from || !to) return;
  const canvasId = ttWhiteboardMode === "laser" ? "ttWhiteboardLaserInk" : "ttWhiteboardInk";
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  if (ttWhiteboardMode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 32;
  } else {
    ctx.strokeStyle = ttWhiteboardMode === "laser" ? "rgba(220,38,38,0.82)" : "rgba(220,38,38,0.9)";
    ctx.shadowColor = "rgba(220,38,38,0.35)";
    ctx.shadowBlur = 8;
    ctx.lineWidth = ttWhiteboardMode === "laser" ? 9 : 6;
  }
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function ttClearWhiteboardCanvas(id = "ttWhiteboardInk") {
  const canvas = ttById(id);
  const stage = ttById("ttWhiteboardStage");
  const ctx = canvas?.getContext("2d");
  if (ctx && stage) ctx.clearRect(0, 0, stage.clientWidth, stage.clientHeight);
}

function ttClearWhiteboardTiles() {
  const layer = ttById("ttWhiteboardTiles");
  if (layer) layer.innerHTML = "";
}

function ttClearBuiltWhiteboardTiles() {
  ttById("ttWhiteboardTiles")?.querySelectorAll(".wb-built-tile").forEach((tile) => tile.remove());
}

function ttResetWhiteboardWordAndCards() {
  ttClearBuiltWhiteboardTiles();
  ttRenderWhiteboardPalette();
}

function ttBind() {
  let scrollSaveTimer = null;
  ttById("ttGroup").addEventListener("change", (event) => {
    ttRememberScroll();
    if (appStateSwitchGroup(event.target.value)) return;
  });

  ttById("ttHome")?.addEventListener("click", () => {
    if (!document.body.classList.contains("home-mode")) ttRememberScroll();
    ttStopPaceGuide();
    ttShowHomeScreen();
  });
  ttById("ttHomeOpenCurrent")?.addEventListener("click", () => ttOpenTeachFlow());
  ttById("ttPlannerUseDefaults")?.addEventListener("click", () => ttUsePlannerDefaults());
  ttById("ttPlannerBuild")?.addEventListener("click", () => ttBuildPlannerLesson());
  ttById("ttPlannerOpen")?.addEventListener("click", () => {
    // Apply all planner selections then open — same as "Build lesson" but goes straight to teach flow
    ttBuildPlannerLesson({ startTeaching: true });
  });
  ttById("ttPlannerCustomizeToggle")?.addEventListener("click", () => {
    ttPlannerCustomizeOpen = !ttPlannerCustomizeOpen;
    ttRenderPlannerCustomizeState();
  });
  ttById("ttPlannerSaveTemplate")?.addEventListener("click", () => ttSavePlannerTemplate());
  ttById("ttPlannerDuplicatePrevious")?.addEventListener("click", () => ttDuplicatePreviousLesson());
  ["ttPlannerSubstep", "ttPlannerLevel", "ttPlannerWordlist", "ttPlannerSentence", "ttPlannerPassage", "ttPlannerPassageApproach"].forEach((id) => {
    ttById(id)?.addEventListener("change", () => {
      const group = ttPlannerGroup();
      if (!group) return;
      ttEnsurePlannerDraft(group);
      if (id === "ttPlannerSubstep") {
        ttPlannerDraft.substep = ttById(id).value;
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttPlannerDraft.wordlist = pageAssignment(group, skill, "wordlist", 0, ttPlannerDraft.level || group.readerLevel || "AB").page || "";
        ttPlannerDraft.sentence = pageAssignment(group, skill, "sentences", 0, ttPlannerDraft.level || group.readerLevel || "AB").page || "";
        ttPlannerDraft.passageId = ttDefaultPassageFor(group, skill)?.id || "";
      }
      if (id === "ttPlannerLevel") {
        ttPlannerDraft.level = ttById(id).value;
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttPlannerDraft.wordlist = pageAssignment(group, skill, "wordlist", 0, ttPlannerDraft.level).page || "";
        ttPlannerDraft.sentence = pageAssignment(group, skill, "sentences", 0, ttPlannerDraft.level).page || "";
      }
      if (id === "ttPlannerWordlist") ttPlannerDraft.wordlist = ttById(id).value;
      if (id === "ttPlannerSentence") ttPlannerDraft.sentence = ttById(id).value;
      if (id === "ttPlannerPassage") ttPlannerDraft.passageId = ttById(id).value;
      if (id === "ttPlannerPassageApproach") ttPlannerDraft.passageApproach = ttById(id).value;
      ttRenderPlannerPanel();
    });
  });

  ttById("ttStudent").addEventListener("change", (event) => ttSelectStudent(event.target.value));
  ttById("ttSubstep").addEventListener("change", (event) => {
    const group = ttActiveGroup();
    group.substep = event.target.value;
    group.pageProgress = { wordlist: 0, sentences: 0, passage: 0 };
    saveState();
    ttLesson = ttBuildLesson();
    ttSaveDraftLesson({ status: false });
    history.replaceState(null, "", location.pathname);
    ttSection2Word = "";
    ttRender();
  });
  ttById("ttReaderLevel").addEventListener("change", (event) => {
    const group = ttActiveGroup();
    group.readerLevel = event.target.value;
    group.pageProgress = { wordlist: 0, sentences: 0, passage: 0 };
    saveState();
    ttLesson = ttBuildLesson();
    ttSaveDraftLesson({ status: false });
    history.replaceState(null, "", location.pathname);
    ttSection2Word = "";
    ttRender();
  });
  ttById("ttWordlistPageSelect")?.addEventListener("change", (event) => {
    ttSetWordlistPageIndex(event.target.value);
  });
  ttById("ttRerollEncodingWords")?.addEventListener("click", () => ttRerollEncodingSectionsAction());
  ttById("ttStartLesson")?.addEventListener("click", () => ttStartCurrentLesson());
  ttById("ttSaveLesson").addEventListener("click", () => ttSaveCurrentLesson());
  ttById("ttPdfPlan").addEventListener("click", () => ttOpenPdfLessonPlan());
  ttById("ttWilsonPlan").addEventListener("click", () => ttOpenWilsonLessonPlan());
  ttById("ttWilsonFillablePlan")?.addEventListener("click", () => ttOpenFillableWilsonLessonPlan());
  ttById("ttExportViewerClose")?.addEventListener("click", () => ttCloseExportViewer());
  ttById("ttExportViewerPrint")?.addEventListener("click", () => {
    const frame = ttById("ttExportViewerFrame");
    try { frame?.contentWindow?.print(); } catch (_) {}
  });
  ttById("ttExportViewerDownload")?.addEventListener("click", () => {
    const overlay = ttById("ttExportViewer");
    if (!overlay?._exportBlobUrl) return;
    const a = document.createElement("a");
    a.href = overlay._exportBlobUrl;
    a.download = overlay._exportFilename || "export";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  ttById("ttWrapJump")?.addEventListener("click", () => {
    ttRenderWrapUpPanel(ttActiveGroup(), ttLesson);
    ttById("ttWrapUpPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  ttById("ttRefresh").addEventListener("click", () => ttNewLesson());
  ttById("ttAddRosterStudent").addEventListener("click", () => ttAddStudentFromRoster());
  ttById("ttRosterAddSelected").addEventListener("click", () => ttAddSelectedRosterStudent());
  ttById("ttRosterAddNew").addEventListener("click", () => ttAddNewRosterStudent());
  ttById("ttRosterClose").addEventListener("click", () => ttToggleRosterPicker(false));
  ttById("ttNewRosterStudent").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttAddNewRosterStudent();
  });
  ttById("ttAttendance").addEventListener("click", () => {
    ttToggleSmallDropdown("ttAttendance", { focus: true });
  });
  ttById("ttPresent").addEventListener("click", () => ttTogglePresentation());
  // Day 1 / Day 2 toggle — works in both teach bar and presentation dock
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-group-day]");
    if (btn) ttSetGroupDay(btn.dataset.groupDay);
  });
  // Section done/skip tracking
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-section-done]");
    if (btn) ttToggleSectionDone(btn.dataset.sectionDone);
  });
  ttById("ttPresentMenuLogo")?.addEventListener("click", () => ttHandlePresentationLogoClick());
  document.addEventListener("pointerdown", ttHandlePresentationMenuOutsidePointer, true);
  document.querySelector(".teach-bar .brand-block")?.addEventListener("click", () => ttHandlePresentationLogoClick());
  document.querySelector(".teach-bar")?.addEventListener("pointerenter", () => {
    if (document.body.classList.contains("present-menu-open")) ttSetPresentationMenu(true, { hold: true });
  });
  document.querySelector(".teach-bar")?.addEventListener("pointerleave", () => {
    if (document.body.classList.contains("present-menu-open")) ttSchedulePresentationMenuClose(2400);
  });
  document.querySelector(".teach-bar")?.addEventListener("focusin", () => {
    if (document.body.classList.contains("present-menu-open")) ttSetPresentationMenu(true, { hold: true });
  });
  document.querySelector(".teach-bar")?.addEventListener("focusout", () => {
    if (document.body.classList.contains("present-menu-open")) ttSchedulePresentationMenuClose(2400);
  });
  ttById("ttDisplayToggle")?.addEventListener("click", () => {
    const panel = ttById("ttDisplayPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) ttUpdateStudentDisplayStatus();
  });
  ttById("ttDisplayOpen")?.addEventListener("click", () => ttOpenStudentDisplay(ttStudentDisplayMode));
  ttById("ttDisplayProjector")?.addEventListener("click", () => ttProjectStudentDisplay());
  ttById("ttDisplayPanel")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.addEventListener("click", () => ttSetStudentDisplayMode(button.dataset.displayMode));
  });
  ttById("ttDockDisplay")?.addEventListener("click", () => ttTogglePresentDisplayTray());
  ttById("ttPresentDisplayOpen")?.addEventListener("click", () => ttOpenStudentDisplay(ttStudentDisplayMode));
  ttById("ttPresentDisplayProjector")?.addEventListener("click", () => ttProjectStudentDisplay());
  ttById("ttPresentDisplayTray")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.addEventListener("click", () => ttSetStudentDisplayMode(button.dataset.displayMode));
  });
  ttById("ttExitPresent").addEventListener("click", () => ttTogglePresentation(false));
  ttById("ttNotesToggle").addEventListener("click", () => ttToggleNotes());
  ttById("ttDockPrevSection")?.addEventListener("click", () => ttGoToTeachingSection(-1));
  ttById("ttDockNextSection")?.addEventListener("click", () => ttGoToTeachingSection(1));
  ttById("ttDockTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("present-menu-open")) {
      ttSetPresentationMenu(false);
    }
  });
  const notesCanvas = ttById("ttNotesCanvas");
  notesCanvas.addEventListener("pointerdown", ttNotesStart);
  notesCanvas.addEventListener("pointermove", ttNotesMove);
  notesCanvas.addEventListener("pointerup", ttNotesEnd);
  notesCanvas.addEventListener("pointercancel", ttNotesEnd);
  notesCanvas.addEventListener("touchstart", ttNotesStart, { passive: false });
  notesCanvas.addEventListener("touchmove", ttNotesMove, { passive: false });
  notesCanvas.addEventListener("touchend", ttNotesEnd, { passive: false });
  window.addEventListener("resize", () => {
    if (ttNotesEnabled) {
      ttResizeNotesCanvas();
      ttClearCanvas("ttNotesCanvas");
    }
    if (!ttById("ttWhiteboard")?.hidden) {
      ttResizeWhiteboardCanvases();
    }
  });
  window.addEventListener("scroll", () => {
    ttUpdatePaceGuideSection();
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
      if (document.body.classList.contains("home-mode")) ttRememberHomeScroll();
      else ttRememberScroll();
    }, 120);
  }, { passive: true });
  ttById("ttSavedToggle").addEventListener("click", () => {
    const panel = ttById("ttSavedPanel");
    const isOpen = !panel.hidden;
    // Close other ribbon panels first
    ttById("ttDataPanel").hidden = true;
    ttById("ttDataToggle").classList.remove("active");
    ttCloseSmallDropdownMenus();
    panel.hidden = isOpen;
    ttById("ttSavedToggle").classList.toggle("active", !isOpen);
    if (!panel.hidden) ttRenderSavedLessons(ttActiveGroup());
  });
  ttById("ttSavedClose")?.addEventListener("click", () => {
    ttById("ttSavedPanel").hidden = true;
    ttById("ttSavedToggle").classList.remove("active");
  });
  ttById("ttDataToggle").addEventListener("click", () => {
    const panel = ttById("ttDataPanel");
    const isOpen = !panel.hidden;
    // Close other ribbon panels first
    ttById("ttSavedPanel").hidden = true;
    ttById("ttSavedToggle").classList.remove("active");
    ttCloseSmallDropdownMenus();
    panel.hidden = isOpen;
    ttById("ttDataToggle").classList.toggle("active", !isOpen);
    if (!panel.hidden) ttRenderDataCenter();
  });
  ttById("ttDataClose")?.addEventListener("click", () => {
    ttById("ttDataPanel").hidden = true;
    ttById("ttDataToggle").classList.remove("active");
  });

  ttById("ttRibbonReaders")?.addEventListener("click", () => ttToggleSmallDropdown("ttRibbonReaders"));
  ttById("ttRibbonDictation")?.addEventListener("click", () => ttToggleSmallDropdown("ttRibbonDictation"));
  ttById("ttHomeReaders")?.addEventListener("click", () => ttToggleSmallDropdown("ttHomeReaders"));
  ttById("ttHomeDictation")?.addEventListener("click", () => ttToggleSmallDropdown("ttHomeDictation"));
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".ref-menu-wrap")) return;
    ttCloseSmallDropdownMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") ttCloseSmallDropdownMenus();
  });
  ttById("ttProfile").addEventListener("click", () => ttOpenStudentProfile());
  ttById("ttBackupData").addEventListener("click", () => ttBackupData());
  ttById("ttConnectCloudSync").addEventListener("click", () => ttConnectCloudSync());
  ttById("ttSyncCloudNow").addEventListener("click", () => ttCloudSyncWrite("Saved local backup file now."));
  ttById("ttDriveConnect")?.addEventListener("click", () => ttUploadPendingAudioToDrive().catch((err) => {
    localStorage.setItem("teachToday.driveStatus", `Google Drive audio failed: ${ttFriendlyDriveError(err)}`);
    ttRenderDataCenter();
  }));
  ttById("ttFirebaseSyncNow").addEventListener("click", () => ttSyncFirebaseAndLocalNow());
  ttById("ttSecureLegacyStudentData")?.addEventListener("click", () => ttSecureLegacyStudentData());
  ttById("ttConnectionRetry")?.addEventListener("click", () => ttRetryCloudConnections());
  ttById("ttConnectionOffline")?.addEventListener("click", () => ttSetWorkOffline(true));
  document.getElementById("ttFirebaseSignIn")?.addEventListener("click", () => ttFirebaseSignIn());
  document.getElementById("ttFirebaseSignOut")?.addEventListener("click", () => ttFirebaseSignOut());
  // OpenAI key setup
  const openAIKeyInput = document.getElementById("ttOpenAIKey");
  const openAIKeySave = document.getElementById("ttOpenAISave");
  const openAIKeyStatus = document.getElementById("ttOpenAIKeyStatus");
  if (openAIKeyInput) {
    const saved = localStorage.getItem("teachToday.openaiKey") || "";
    openAIKeyInput.value = saved;
    if (openAIKeyStatus) openAIKeyStatus.textContent = saved ? "Key saved — transcription is active." : "";
  }
  openAIKeySave?.addEventListener("click", () => {
    const val = openAIKeyInput?.value.trim() || "";
    if (val && !val.startsWith("sk-")) {
      if (openAIKeyStatus) openAIKeyStatus.textContent = "That doesn't look like an OpenAI key (should start with sk-).";
      return;
    }
    localStorage.setItem("teachToday.openaiKey", val);
    if (openAIKeyStatus) openAIKeyStatus.textContent = val ? "Key saved — transcription is active." : "Key cleared.";
  });

  ttById("ttRestoreData").addEventListener("click", () => ttById("ttRestoreFile").click());
  ttById("ttRestoreFile").addEventListener("change", (event) => ttRestoreDataFromFile(event.target.files?.[0]));
  ttById("ttImportHistoricalWrs").addEventListener("click", () => ttById("ttHistoricalWrsFile").click());
  ttById("ttHistoricalWrsFile").addEventListener("change", (event) => ttImportHistoricalWrsFile(event.target.files?.[0]));
  ttById("ttExportCsv").addEventListener("click", () => exportMasterRecords());
  ttById("ttCloseSentenceDisplay").addEventListener("click", () => ttCloseSentenceDisplay());
  ttById("ttEditSection2Cards").addEventListener("click", () => ttEditSection2Cards());
  ttById("ttSaveSection2Cards").addEventListener("click", () => ttSaveSection2Cards());
  ttById("ttCancelSection2Edit").addEventListener("click", () => ttCancelSection2Edit());
  ttById("ttSection2EditInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttSaveSection2Cards();
    if (event.key === "Escape") ttCancelSection2Edit();
  });
  ttById("ttCurrentWordSelect").addEventListener("change", (event) => {
    if (event.target.value) ttShowSection2WordByDeck(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttReviewCategory").addEventListener("change", (event) => {
    ttFillSection2ReviewCategoryWords(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttUseCustomWord").addEventListener("click", () => ttUseCustomSection2Word());
  ttById("ttSection2CustomWord").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttUseCustomSection2Word();
  });
  ttById("ttOpenWhiteboard").addEventListener("click", () => ttOpenWhiteboard());
  ttById("ttSection2Prev")?.addEventListener("click", () => ttShowSection2Card(ttSection2Index - 1));
  ttById("ttSection2Next")?.addEventListener("click", () => ttShowSection2Card(ttSection2Index + 1));
  ttById("ttSection2BPrev")?.addEventListener("click", () => ttShowSection2BCard(ttSection2BIndex - 1));
  ttById("ttSection2BNext")?.addEventListener("click", () => ttShowSection2BCard(ttSection2BIndex + 1));
  ttById("ttCloseWhiteboard").addEventListener("click", () => ttCloseWhiteboard());
  ttById("ttWhiteboardBuildWord").addEventListener("click", () => ttBuildCurrentWordOnWhiteboard());
  ttById("ttWhiteboardAddBlank").addEventListener("click", () => ttAddBlankSyllableCard());
  ttById("ttWhiteboardRemoveBlank").addEventListener("click", () => ttRemoveBlankSyllableCard());
  ttById("ttWhiteboardClearInk").addEventListener("click", () => {
    ttClearWhiteboardCanvas("ttWhiteboardInk");
    ttClearWhiteboardCanvas("ttWhiteboardLaserInk");
  });
  ttById("ttWhiteboardClearTiles").addEventListener("click", () => ttResetWhiteboardWordAndCards());
  ttById("ttWhiteboardScope").addEventListener("change", () => ttRenderWhiteboardPalette());
  document.querySelectorAll(".wb-mode").forEach((button) => {
    button.addEventListener("click", () => ttSetWhiteboardMode(button.dataset.mode));
  });
  const whiteboardStage = ttById("ttWhiteboardStage");
  whiteboardStage.addEventListener("pointerdown", ttWhiteboardPointerStart, true);
  whiteboardStage.addEventListener("pointermove", ttWhiteboardPointerMove, true);
  whiteboardStage.addEventListener("pointerup", ttWhiteboardPointerEnd, true);
  whiteboardStage.addEventListener("pointercancel", ttWhiteboardPointerEnd, true);
  whiteboardStage.addEventListener("touchstart", ttWhiteboardPointerStart, { passive: false, capture: true });
  whiteboardStage.addEventListener("touchmove", ttWhiteboardPointerMove, { passive: false, capture: true });
  whiteboardStage.addEventListener("touchend", ttWhiteboardPointerEnd, { passive: false, capture: true });
  ttById("ttHfwStep").addEventListener("change", (event) => {
    if (!ttLesson) return;
    ttFillHfwDisplayWords(hfwWordsForSubstep(event.target.value, ttLesson), event.target.value);
  });
  ttById("ttHfwPrev")?.addEventListener("click", () => ttShowHfwCard(ttHfwIndex - 1));
  ttById("ttHfwNext")?.addEventListener("click", () => ttShowHfwCard(ttHfwIndex + 1));
  ttById("ttSection3HfwStep")?.addEventListener("change", () => {
    ttCardMode = "hfw";
    ttFillSection3Cards(ttLesson);
  });
  ttById("ttBackTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  ttById("ttWrapHome")?.addEventListener("click", () => ttById("ttHome")?.click());
  ttById("ttWrapRefresh")?.addEventListener("click", () => ttRenderWrapUpPanel(ttActiveGroup(), ttLesson));
  ttById("ttCompleteLesson")?.addEventListener("click", () => ttCompleteLessonWrapUp());
  ttById("ttWrapSavePdf")?.addEventListener("click", () => {
    ttCompleteLessonWrapUp({ scroll: false });
    ttOpenPdfLessonPlan();
  });
  ttById("ttWrapProfile")?.addEventListener("click", () => ttOpenStudentProfile());
  ttById("ttWrapNextLesson")?.addEventListener("click", () => {
    ttCompleteLessonWrapUp({ scroll: false });
    ttNewLesson();
  });
  ttById("ttWrapNote")?.addEventListener("blur", () => ttSaveWrapUpNoteDraft());
  document.querySelectorAll(".card-mode").forEach((button) => {
    button.addEventListener("click", () => {
      ttCardMode = button.dataset.mode;
      document.querySelectorAll(".card-mode").forEach((item) => item.classList.toggle("active", item === button));
      ttFillSection3Cards(ttLesson);
    });
  });
  document.querySelectorAll(".section-refresh[data-refresh-section]").forEach((button) => {
    button.addEventListener("click", () => ttRefreshSection(button.dataset.refreshSection));
  });
  ttById("ttProjectSection4")?.addEventListener("click", () => ttProjectSection4());
  ttById("ttSection4PreviewToggle")?.addEventListener("click", () => ttToggleSection4StagePreview());
  ttById("ttRecheckCharting")?.addEventListener("click", () => ttRecheckSection4Words());
  ttById("ttCardPrev").addEventListener("click", () => ttShowCard(ttCardIndex - 1));
  ttById("ttCardNext").addEventListener("click", () => ttShowCard(ttCardIndex + 1));

  ttById("section4").querySelectorAll(".half-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      ttChartCard.dataset.chartHalf = button.dataset.half;
      syncChartHalfUi(ttChartCard);
      updateLiveScore(ttChartCard);
      ttSyncStudentDisplay();
    });
  });
  ttById("section4").querySelector(".start-timer").addEventListener("click", () => startLiveTimer(ttChartCard, false));
  ttById("section4").querySelector(".pause-timer").addEventListener("click", () => pauseLiveTimer(ttChartCard));
  ttById("section4").querySelector(".stop-timer").addEventListener("click", async () => {
    stopLiveTimer(ttChartCard, false);
    if (typeof activeRecognition !== "undefined" && activeRecognition) {
      try { activeRecognition.stop(); } catch (_) {}
      // eslint-disable-next-line no-global-assign
      activeRecognition = null;
    }
    const blob = await stopAudioRecording(true);
    showAudioPlayerInCard(ttChartCard);
    saveLiveRecord(ttChartCard, { automatic: true });
  });
  ttById("section4").querySelector(".mute-toggle")?.addEventListener("click", () => {
    if (isSpeechMuted) unmuteSpeech(ttChartCard);
    else muteSpeech(ttChartCard, 8);
  });
  ttById("section4").querySelector(".save-live-record").addEventListener("click", () => saveLiveRecord(ttChartCard));
}

function appStateSwitchGroup(groupId) {
  const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
  if (!stored.groups?.some((group) => group.id === groupId)) return false;
  stored.selectedGroupId = groupId;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(stored));
  const url = new URL(location.href);
  url.searchParams.set("group", groupId);
  url.searchParams.delete("plan");
  location.href = url.href;
  return true;
}

function ttLoadPlanFromUrl() {
  const params = new URLSearchParams(location.search);
  const groupId = params.get("group");
  const planId = params.get("plan");
  if (groupId && groupId !== ttActiveGroup().id) {
    const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
    if (stored.groups?.some((group) => group.id === groupId)) {
      stored.selectedGroupId = groupId;
      localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(stored));
      location.href = `${location.pathname}?group=${encodeURIComponent(groupId)}&plan=${encodeURIComponent(planId || "")}`;
    }
    return null;
  }
  if (!planId) return null;
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === planId);
  if (!plan?.lessons?.[0]) return null;
  ttLesson = ttClone(plan.lessons[0]);
  ttLesson.savedPlanId = plan.id;
  ttUpdateSaveStatus(plan);
  return plan;
}

function ttOpenStudentProfile() {
  if (ttChartCard) saveLiveRecordIfNeeded(ttChartCard);
  const group = ttActiveGroup();
  const student = group.activeStudent || group.students[0] || "";
  if (!student) return;
  const studentId = group.studentIds?.[student]
    || (appState.rosterStudents || []).find((item) => (item.name || item.fullName) === student)?.studentId
    || "";
  const url = `StudentProfile.html?group=${encodeURIComponent(group.id)}&studentId=${encodeURIComponent(studentId)}`;
  location.href = url;
}

function ttHandleDeveloperRoute() {
  const params = new URLSearchParams(location.search);
  const route = String(params.get("devRoute") || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!route || !window.TTDeveloperAccess?.isEnabled?.()) return;

  if (route === "home" || route === "planner") {
    ttShowHomeScreen();
    return;
  }

  const targetMap = {
    "lesson-flow": "",
    "section1": "section1",
    "section2": "section2",
    "section3": "section3",
    "section4": "section4",
    "section5": "section5",
    "section6": "section6",
    "section7": "section7",
    "section8": "section8",
    "section9": "section9",
    "section10": "section10",
    "wrap-up": "ttWrapUpPanel",
    "exports": "",
    "records": ""
  };
  if (!(route in targetMap)) return;

  const afterOpen = () => {
    if (route === "records") {
      const panel = ttById("ttDataPanel");
      if (panel?.hidden) ttById("ttDataToggle")?.click();
    }
    if (route === "exports") ttById("ttPdfPlan")?.focus();
  };

  if (route === "wrap-up") ttRenderWrapUpPanel(ttActiveGroup(), ttLesson);
  ttOpenTeachFlow({ targetId: targetMap[route], transition: false, afterOpen });
}

const ttLoadedPlan = ttLoadPlanFromUrl();
ttLoadedPlan || ttLoadDraftLesson() || ttBuildLesson();
ttInitCloudSync();
ttInitFirebaseSync();
ttInitConnectionMonitor();
ttBind();
window.addEventListener("beforeunload", ttFinalizeActivePassageStroke);
ttRender();
if (!ttLoadedPlan) ttShowHomeScreen();
ttHandleDeveloperRoute();
