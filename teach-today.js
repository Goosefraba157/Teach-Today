let ttLesson = null;
let ttChartCard = null;
let ttCardDeck = [];
let ttCardIndex = 0;
let ttCardMode = "lesson";
let ttCardModeLessonKey = "";
let ttFatStackThreshold = "all";
let ttSection2Deck = [];
let ttSection2Index = 0;
let ttSection2Word = "";
let ttSection2BDeck = [];
let ttSection2BIndex = 0;
let ttSection2BWord = "";
let ttWhiteboardWord = "";
let ttIntro21Open = false;
let ttIntro21Index = 0;
let ttIntro21Variant = "guided";
let ttIntroTeacherMirror = false;
let ttIntroSourceSection = "section2";
let ttIntroLaunchButtonId = "ttOpenIntro21";
let ttHfwDeck = [];
let ttHfwIndex = 0;
let ttNotesEnabled = false;
let ttNotesDrawing = false;
let ttNotesLastPoint = null;
let ttGlobalInkState = {
  open: false,
  active: false,
  mode: "pen",
  color: "#ef4444",
  size: 5,
  strokes: [],
  drawing: false,
  activeStroke: null
};
let ttLaserEnabled = false;
let ttLaserTouchMode = "scoop";
let ttLaserPoints = [];
let ttLaserCurrentPoint = null;
let ttLaserFrame = null;
let ttLaserActivePointerId = null;
let ttLaserScrollPadPointerId = null;
let ttLaserScrollPadLastY = 0;
const ttLaserScrollPadSpeed = 4;
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
let ttPlannerEditingPlanId = "";
let ttSectionReviewSubsteps = {};
let ttPickerSelections = {};      // { pickerId: string[] }  — ordered selected words
let ttPickerSubstepCache = {};    // { "pickerId::substepId": string[] } — word pools per substep
let ttReviewWordFilters = {};     // { pickerId: filterKey } — view-only in Section 2; selection-driving in Section 3
let ttSection8RealSlots = [];     // [{ substep, word }] × 5 — Section 8 real word slots
let ttSection8SoundElementsManual = false;
let ttPlannerHomeScrollPositions = {};
let ttLessonHistoryEditPlanId = "";
let ttAssistantNotice = "";
let ttAttendanceModalScrollY = 0;
let ttAttendancePriorScrollBehavior = "";
let ttAttendanceActivitySaveTimer = null;
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
let ttNativeProjectionMode = "stage";
let ttGroupDay = null; // "1" | "2" | null (null = show full group lesson)
const ttStudentDisplayStorageKey = "teachToday.studentDisplayPayload.v1";
const ttStudentDisplayChannel = "BroadcastChannel" in window ? new BroadcastChannel("teachTodayStudentDisplay.v1") : null;
let ttStudentDisplayScreens = [];
let ttStudentDisplayFollowFrame = null;
let ttStudentDisplayFollowKey = "";
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

function ttApplyEnhancedChartPageToLesson(lesson, skill) {
  const page = ttEnhancedPlanning()?.findPage?.(
    skill?.id || lesson?.substep,
    lesson?.readerLevel || "AB",
    lesson?.wordlistPageNumber
  );
  const words = uniqueWords(page?.w || []).filter(isUsableReaderWord);
  if (!lesson || words.length < 15) return lesson;
  lesson.realWords = words.slice(0, 15);
  lesson.nonsenseWords = words.slice(15, 30);
  lesson.planningIndexVersion = window.teachTodayEnhancedPlanningIndex?.schemaVersion || lesson.planningIndexVersion;
  lesson.planningSource = "enhanced-chart-page";
  return lesson;
}

function ttBuildLesson() {
  const group = ttActiveGroup();
  const skill = activeStep(group);
  ttLesson = createLesson(group, skill, 0, 1);
  ttApplyEnhancedChartPageToLesson(ttLesson, skill);
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
  const intro21Button = ttById("ttOpenIntro21");
  if (intro21Button) intro21Button.hidden = skill.id !== "2.1";
  const intro21DiscoveryButton = ttById("ttOpenIntro21Discovery");
  if (intro21DiscoveryButton) intro21DiscoveryButton.hidden = skill.id !== "2.1";
  const intro35DiscoveryButton = ttById("ttOpenIntro35Discovery");
  if (intro35DiscoveryButton) intro35DiscoveryButton.hidden = skill.id !== "3.5";
  const intro21B2Button = ttById("ttOpenIntro21B2");
  if (intro21B2Button) intro21B2Button.hidden = skill.id !== "2.1";
  const intro21DiscoveryB2Button = ttById("ttOpenIntro21DiscoveryB2");
  if (intro21DiscoveryB2Button) intro21DiscoveryB2Button.hidden = skill.id !== "2.1";
  const intro35DiscoveryB2Button = ttById("ttOpenIntro35DiscoveryB2");
  if (intro35DiscoveryB2Button) intro35DiscoveryB2Button.hidden = skill.id !== "3.5";
  const intro35SpellingButton = ttById("ttOpenIntro35Spelling");
  if (intro35SpellingButton) intro35SpellingButton.hidden = skill.id !== "3.5";
  const activeIntroSubstep = ttIntro21Variant === "discovery35" ? "3.5" : "2.1";
  if (ttIntro21Open && skill.id !== activeIntroSubstep) ttCloseIntro21();
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
  ttUpdateAttendanceReminder();
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
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2BWord("review", word)
  });
  ttFillWordRow(ttById("ttCurrentWordsB2"), lesson.sectionTwoCurrentWordsB2 || [], {
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2BWord("current", word)
  });
  ttFillWordRow(ttById("ttLastMissedWordsB2"), lesson.sectionTwoLastMissedWords || [], {
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("lastMisses", word)
  });
  ttFillWordRow(ttById("ttPriorityMissedWordsB2"), lesson.sectionTwoPriorityMissedWords || [], {
    onSelect: (word) => ttShowSection2BWordByDeck(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("priorityMisses", word)
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
  ttFillSection2BReplacementTools(lesson, skill);
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

function ttStudentDisplayCurrentSectionId() {
  if (document.body.classList.contains("home-mode")) return "";
  return ttCurrentPaceSectionId();
}

function ttStudentDisplayFollowResolution(sectionId) {
  if (ttIntro21Open) return "cards";
  const modes = {
    section1: "poster",
    section1b: "poster",
    section2: "cards",
    section2b: "cards",
    section3: "cards",
    section4: "chart",
    section5: "sentence",
    section6: "sounds",
    section7: "journal",
    section8: "dictation-paper",
    section9: "passage"
  };
  return modes[sectionId] || "private";
}

function ttStudentDisplayCardPayload(sectionId, lesson, skill) {
  if (ttIntro21Open) return ttIntro21CardDisplayPayload();
  const stageSection = sectionId || ttStudentDisplayCurrentSectionId();
  if (stageSection === "section2" || stageSection === "section2b") {
    const isDay2 = stageSection === "section2b";
    const word = isDay2 ? ttSection2BWord : ttSection2Word;
    const cards = word ? section2CardsForWord(word, skill.id) : null;
    return {
      key: `${stageSection}-${lesson.id || skill.id}-${word || "empty"}`,
      sectionLabel: ttStudentDisplaySectionLabel(stageSection),
      word,
      label: isDay2 ? "Day 2 word building" : "Word building",
      position: isDay2
        ? `${ttSection2BIndex + 1} of ${ttSection2BDeck.length}`
        : `${ttSection2Index + 1} of ${ttSection2Deck.length}`,
      items: (cards?.items || []).map((item) => ({
        text: section2DisplayCardText(item),
        type: item.type || "syllable"
      }))
    };
  }
  if (stageSection === "section7") {
    const word = document.querySelector("#ttPart7WordCards .section7-word-card.selected-display-word")?.dataset.word || "";
    const cards = word ? section2CardsForWord(word, skill.id) : null;
    return {
      key: `section7-${lesson.id || skill.id}-${word || "empty"}`,
      sectionLabel: "Section 7",
      word,
      label: "Spelling word cards",
      position: "",
      items: (cards?.items || []).map((item) => ({
        text: section2DisplayCardText(item),
        type: item.type || "syllable"
      }))
    };
  }
  const card = ttCardDeck[ttCardIndex] || {};
  return {
    key: `section3-${lesson.id || skill.id}-${ttCardMode}-${ttCardIndex}-${card.word || "empty"}`,
    sectionLabel: "Section 3",
    word: card.word || "",
    label: card.typeLabel || card.label || "Word card",
    position: ttCardDeck.length ? `${ttCardIndex + 1} of ${ttCardDeck.length}` : "",
    items: []
  };
}

function ttStudentDisplaySectionLabel(sectionId) {
  const labels = {
    section1: "Section 1",
    section1b: "Section 1B",
    section2: "Section 2",
    section2b: "Section 2B",
    section3: "Section 3",
    section4: "Section 4",
    section5: "Section 5",
    section6: "Section 6",
    section7: "Section 7",
    section8: "Section 8",
    section9: "Section 9",
    section10: "Section 10"
  };
  return labels[sectionId] || "Lesson";
}

function ttStudentDisplaySoundReferencePayload(skill) {
  return {
    key: `sounds-${skill.id}`,
    groups: [
      { title: "Vowels", items: vowelSoundList(skill.id) },
      { title: "Consonants", items: consonantSoundList(skill.id) },
      {
        title: "Welded / glued sounds",
        items: knownWeldedAndExceptions
          .filter(([introduced]) => isAtLeastSubstep(skill.id, introduced))
          .map(([, value]) => value)
      },
      { title: "Word elements", items: wordElementList(skill.id) }
    ].map((group) => ({
      title: group.title,
      items: [...new Set(group.items)].filter(Boolean).slice(0, 36)
    }))
  };
}

function ttStudentDisplayPayload(mode = ttStudentDisplayMode) {
  const group = ttActiveGroup();
  const lesson = ttLesson || ttBuildLesson();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  const displayMode = mode || "private";
  const sourceSection = displayMode === "follow" || displayMode === "cards"
    ? (ttIntro21Open ? ttIntroSourceSection : ttStudentDisplayCurrentSectionId())
    : "";
  const resolvedMode = displayMode === "follow" ? ttStudentDisplayFollowResolution(sourceSection) : displayMode;
  const poster = ttSection1PhotoForSubstep(skill.id);
  const hfwWords = hfwWordsForSubstep(skill.id, lesson).filter(Boolean).slice(0, 12);
  const passage = ttPassageById(lesson.section9Story?.passageId);
  const passageText = lesson.passage || `Use Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} for Section #9.`;
  return {
    mode: resolvedMode,
    displayMode,
    sourceSection,
    sectionLabel: ttStudentDisplaySectionLabel(sourceSection),
    updatedAt: new Date().toISOString(),
    lessonId: lesson.id || "",
    groupName: "Teach Today",
    substep: skill.id,
    skillTitle: skill.title || "",
    poster,
    cardDisplay: ttStudentDisplayCardPayload(sourceSection, lesson, skill),
    highFrequencyWords: hfwWords,
    sentence: ttById("ttSentenceDisplay")?.querySelector("p")?.textContent || lesson.readerSentences?.[0] || "",
    notebookSentence: "Copy the sentence your teacher gives you.",
    chart: ttStudentDisplayChartPayload(lesson, skill),
    soundReference: ttStudentDisplaySoundReferencePayload(skill),
    journal: {
      key: `journal-${lesson.id || skill.id}`,
      prompt: "Build the word your teacher dictates."
    },
    dictationPaper: {
      key: `dictation-${lesson.id || skill.id}`,
      prompt: "Listen, repeat, tap the sounds, and write."
    },
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
  const displayMode = payload.displayMode || payload.mode || "private";
  localStorage.setItem(ttStudentDisplayStorageKey, JSON.stringify(payload));
  localStorage.setItem("teachToday.studentDisplayMode", displayMode);
  ttStudentDisplayChannel?.postMessage(payload);
  if (ttStudentDisplayWindow && !ttStudentDisplayWindow.closed) {
    ttStudentDisplayWindow.postMessage({ type: "teachTodayStudentDisplay", payload }, window.location.origin);
  }
  try {
    window.webkit?.messageHandlers?.teachTodayStage?.postMessage(payload);
  } catch {
    /* The native Stage bridge is optional in ordinary browsers. */
  }
  ttUpdateStudentDisplayStatus(displayMode, payload);
}

function ttIsNativeIpadShell() {
  return document.documentElement.dataset.teachTodayNative === "ipad"
    && Boolean(window.webkit?.messageHandlers?.teachTodayProjectionMode);
}

// The installed iPad Stage app is deliberately local-first. Its WebKit data
// store is the authority while teaching; Firebase must never restore over it
// or reintroduce an older active-lesson pointer in the background.
function ttStageLocalOnlyMode() {
  return ttIsNativeIpadShell();
}

function ttStageLocalOnlyStatus() {
  return "Stage local mode: saved on this iPad. Automatic Firebase sync is paused.";
}

function ttBackupCurrentStageState(options = {}) {
  if (!ttStageLocalOnlyMode()) return Promise.resolve();
  const payload = ttFirebasePayload();
  const driveReady = localStorage.getItem(ttIndependentBackupEnabledKey) === "true" && Boolean(ttDriveAccessToken);
  return ttEnsureIndependentBackups({
    payload,
    revisionId: `stage-local-${ttFirebasePayloadSignature(payload)}`
  }, {
    force: Boolean(options.force),
    manual: Boolean(options.manual),
    nativeOnly: !driveReady
  });
}

function ttSetNativeProjectionMode(mode = "stage") {
  if (!ttIsNativeIpadShell()) return false;
  const nextMode = mode === "mirror" ? "mirror" : "stage";
  try {
    window.webkit?.messageHandlers?.teachTodayProjectionMode?.postMessage({ mode: nextMode });
  } catch {
    return false;
  }
  ttNativeProjectionMode = nextMode;
  ttUpdateStudentDisplayStatus(ttStudentDisplayMode);
  return true;
}

function ttEnableNativeTeacherMirror() {
  if (!ttIsNativeIpadShell()) return;
  const confirmed = window.confirm(
    "Mirror Teacher will project everything visible on this iPad, including student names, scores, notes, or open records. Continue only when the teacher screen is safe for students to see."
  );
  if (!confirmed) return;
  ttSetNativeProjectionMode("mirror");
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
  ttSetNativeProjectionMode("stage");
  if (ttIntro21Open && ttIntroTeacherMirror) {
    ttIntroTeacherMirror = false;
    ttUpdateIntroDisplayControls();
  }
  ttStudentDisplayMode = mode || "private";
  ttStudentDisplayFollowKey = "";
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
  else {
    try {
      window.webkit?.messageHandlers?.teachTodayStage?.postMessage(payload);
    } catch {
      /* The native Stage bridge is optional in ordinary browsers. */
    }
    ttUpdateStudentDisplayStatus(ttStudentDisplayMode, payload);
  }
}

function ttStudentDisplayFollowSignature(payload) {
  return [
    payload.lessonId,
    payload.sourceSection,
    payload.mode,
    payload.substep,
    payload.cardDisplay?.key,
    payload.sentence,
    payload.chart?.key,
    payload.soundReference?.key,
    payload.journal?.key,
    payload.dictationPaper?.key,
    payload.passagePdf?.passageId
  ].filter(Boolean).join("|");
}

function ttSyncFollowingStudentDisplay({ force = false } = {}) {
  if (ttStudentDisplayMode !== "follow") return;
  const payload = ttStudentDisplayPayload("follow");
  const signature = ttStudentDisplayFollowSignature(payload);
  if (!force && signature === ttStudentDisplayFollowKey) return;
  ttStudentDisplayFollowKey = signature;
  ttSendStudentDisplay(payload);
}

function ttQueueStudentDisplayFollowSync() {
  if (ttStudentDisplayMode !== "follow" || ttStudentDisplayFollowFrame) return;
  ttStudentDisplayFollowFrame = requestAnimationFrame(() => {
    ttStudentDisplayFollowFrame = null;
    ttSyncFollowingStudentDisplay();
  });
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
      ttTrackConfirmedAttendanceActivity({ part: ttGroupDay });
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
  ttTrackConfirmedAttendanceActivity({ sectionId, state: next || "unmarked" });
  if (sectionId === "section9" && next === "done") ttClearPassageInk({ save: false, allStories: true });
  if (ttLesson.savedPlanId) ttSaveCurrentLesson({ render: false, reason: `Updated ${sectionId.replace("section", "Section ")} progress` });
  else ttSaveDraftLesson({ status: false });
  ttInitSectionCompletion();
  ttRenderLessonIdentity();
}

function ttUpdateStudentDisplayStatus(mode = ttStudentDisplayMode, payload = null) {
  const status = ttById("ttDisplayStatus");
  const labels = {
    follow: "Following the lesson",
    private: "Privacy screen ready",
    poster: "Showing Section 1 poster",
    cards: "Showing lesson cards",
    hfw: "Showing high-frequency words",
    sentence: "Showing Section 5 sentence",
    chart: "Showing Section 4 chart",
    sounds: "Showing sound reference",
    journal: "Showing magnetic journal",
    "dictation-paper": "Showing dictation paper",
    passage: "Showing Section 9 passage",
    game: "Showing game hub"
  };
  const followStatus = mode === "follow" && payload?.sourceSection
    ? `Following ${payload.sectionLabel}: ${labels[payload.mode] || "student-safe display"}`
    : "";
  if (status) {
    status.textContent = ttNativeProjectionMode === "mirror"
      ? "Mirroring the visible teacher screen"
      : followStatus || labels[mode] || "Student display ready";
  }
  ttById("ttDisplayPanel")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.classList.toggle("active", ttNativeProjectionMode === "stage" && button.dataset.displayMode === mode);
  });
  ttById("ttPresentDisplayTray")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.classList.toggle("active", ttNativeProjectionMode === "stage" && button.dataset.displayMode === mode);
  });
  document.querySelectorAll("[data-native-projection-mode='mirror']").forEach((button) => {
    button.classList.toggle("active", ttNativeProjectionMode === "mirror");
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
  const lastManualBackup = localStorage.getItem("teachToday.lastBackupAt");
  const lastNativeBackup = localStorage.getItem("teachToday.lastIndependentNativeAt");
  const lastDriveBackup = localStorage.getItem("teachToday.lastIndependentDriveAt");
  const lastBackup = ttStageLocalOnlyMode() && lastNativeBackup ? lastNativeBackup : lastManualBackup;
  const lastCloudSync = localStorage.getItem("teachToday.lastCloudSyncAt");
  const cloudStatus = localStorage.getItem("teachToday.cloudSyncStatus") || "Choose a local backup folder to save a file on this Mac.";
  const cloudFolder = localStorage.getItem("teachToday.cloudSyncFolderName");
  const driveStatus = localStorage.getItem("teachToday.driveStatus") || (ttStageLocalOnlyMode()
    ? "Google Drive backup is not connected. Tap Connect Google Drive backup to authorize it."
    : "Connect Google Drive to upload audio into your Drive.");
  const lastFirebaseSync = localStorage.getItem("teachToday.lastFirebaseSyncAt");
  const firebaseStatus = localStorage.getItem("teachToday.firebaseSyncStatus") || "Firebase internet sync is ready.";
  const independentStatus = localStorage.getItem("teachToday.independentBackupStatus.v1") || "Automatic iPad Files and Google Drive backups are ready for setup.";
  const records = appState.masterRecords?.length || 0;
  const lessons = (appState.groups || []).reduce((sum, group) => sum + (group.history?.length || 0), 0);
  const dictation = (appState.groups || []).reduce((sum, group) => sum + (group.dictationMisses?.length || 0), 0);
  const encoding = (appState.groups || []).reduce((sum, group) => sum + (group.encodingObservations?.length || 0), 0);
  const lastSaveEl = ttById("ttLastInternalSave");
  const lastBackupEl = ttById("ttLastBackup");
  const lastDriveBackupEl = ttById("ttLastDriveBackup");
  const lastCloudSyncEl = ttById("ttLastCloudSync");
  const lastFirebaseSyncEl = ttById("ttLastFirebaseSync");
  const countsEl = ttById("ttDataCounts");
  const cloudStatusEl = ttById("ttCloudSyncStatus");
  const driveStatusEl = ttById("ttDriveSyncStatus");
  const firebaseStatusEl = ttById("ttFirebaseSyncStatus");
  const independentStatusEl = ttById("ttIndependentBackupStatus");
  const secureLegacyButton = ttById("ttSecureLegacyStudentData");
  const recoveryButton = ttById("ttDownloadRecovery");
  const recoveryBundleButton = ttById("ttDownloadRecoveryBundle");
  const stageParkedDataActions = [
    "ttBackupData",
    "ttDownloadRecovery",
    "ttDownloadRecoveryBundle",
    "ttConnectCloudSync",
    "ttSyncCloudNow",
    "ttDriveConnect",
    "ttFirebaseLoadProtected",
    "ttFirebaseSyncNow",
    "ttRestoreData",
    "ttImportHistoricalWrs",
    "ttExportCsv",
    "ttFirebaseTimelineRefresh"
  ];
  stageParkedDataActions.forEach((id) => {
    const button = ttById(id);
    if (!button) return;
    const parked = ttStageLocalOnlyMode();
    button.disabled = parked;
    button.classList.toggle("stage-parked-control", parked);
    if (parked) {
      button.setAttribute("aria-disabled", "true");
      button.title = "Not needed during normal Stage use";
    } else {
      button.removeAttribute("aria-disabled");
      if (button.title === "Not needed during normal Stage use") button.removeAttribute("title");
    }
  });
  if (lastSaveEl) lastSaveEl.textContent = lastSave ? formatDateTime(lastSave) : "Not saved yet";
  if (lastBackupEl) {
    lastBackupEl.textContent = lastBackup ? formatDateTime(new Date(lastBackup)) : "No backup yet";
    if (ttStageLocalOnlyMode() && lastBackupEl.nextElementSibling) lastBackupEl.nextElementSibling.textContent = "Last verified iPad backup";
  }
  if (lastDriveBackupEl) lastDriveBackupEl.textContent = lastDriveBackup ? formatDateTime(new Date(lastDriveBackup)) : "Not connected";
  if (lastCloudSyncEl) lastCloudSyncEl.textContent = lastCloudSync ? formatDateTime(new Date(lastCloudSync)) : "Not connected";
  if (lastFirebaseSyncEl) lastFirebaseSyncEl.textContent = ttStageLocalOnlyMode()
    ? "Paused in Stage"
    : (lastFirebaseSync ? formatDateTime(new Date(lastFirebaseSync)) : "Not synced");
  if (countsEl) countsEl.textContent = `${records} / ${lessons}${dictation || encoding ? ` / ${dictation + encoding}` : ""}`;
  if (cloudStatusEl) cloudStatusEl.textContent = `${cloudFolder ? `${cloudFolder}: ` : ""}${cloudStatus} Local browser storage is still saved first.`;
  if (driveStatusEl) driveStatusEl.textContent = `${driveStatus} Local browser storage is still saved first.`;
  if (firebaseStatusEl) firebaseStatusEl.textContent = `${ttStageLocalOnlyMode() ? ttStageLocalOnlyStatus() : firebaseStatus} Local browser storage is still saved first.`;
  if (independentStatusEl) independentStatusEl.textContent = independentStatus;
  if (secureLegacyButton) secureLegacyButton.hidden = !ttFirebaseUser || Boolean(localStorage.getItem("teachToday.privacyMigrationReceipt"));
  if (recoveryButton) recoveryButton.hidden = !ttRecoveryIndex().length;
  if (recoveryBundleButton) recoveryBundleButton.hidden = !ttRecoveryIndex().length;
}

function ttShowConnectionNotice(message, title = "Cloud connection issue", options = {}) {
  if (ttWorkOffline) return;
  const panel = ttById("ttConnectionNotice");
  if (!panel) return;
  const conflict = options.conflict ?? /another (?:signed-in browser|device) saved newer/i.test(message);
  ttConnectionConflict = Boolean(conflict);
  panel.dataset.mode = conflict ? "conflict" : "connection";
  ttById("ttConnectionTitle").textContent = title;
  ttById("ttConnectionMessage").textContent = message;
  const retry = ttById("ttConnectionRetry");
  const offline = ttById("ttConnectionOffline");
  const backup = ttById("ttConnectionBackup");
  if (retry) retry.textContent = conflict ? "Load cloud copy" : "Keep trying";
  if (offline) offline.textContent = conflict ? "Keep this device offline" : "Work offline";
  if (backup) backup.hidden = !conflict;
  panel.hidden = false;
}

function ttHideConnectionNotice() {
  const panel = ttById("ttConnectionNotice");
  if (panel) {
    panel.hidden = true;
    panel.dataset.mode = "connection";
  }
  ttConnectionConflict = false;
}

async function ttResolveFirebaseConflictFromCloud() {
  return ttLoadProtectedFirebaseCopy();
}

function ttHandleConnectionPrimaryAction() {
  if (ttConnectionConflict) return ttResolveFirebaseConflictFromCloud();
  return ttRetryCloudConnections();
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
  if (ttStageLocalOnlyMode()) {
    localStorage.setItem("teachToday.firebaseSyncStatus", ttStageLocalOnlyStatus());
    ttHideConnectionNotice();
    ttRenderDataCenter();
    await ttBackupCurrentStageState().catch((error) => {
      ttSetIndependentBackupStatus(`iPad backup needs attention. ${error.message}`, { notify: true });
    });
    return;
  }
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
  appState.attendanceSessions ||= {};
  appState.attendanceActivity ||= {};
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

function ttRosterProfileById(studentId) {
  return (appState.rosterStudents || [])
    .map((student) => typeof student === "string" ? { name: student } : student)
    .find((student) => student.studentId === studentId) || null;
}

function ttRosterProfileByName(name) {
  const normalized = String(name || "").trim().toLocaleLowerCase();
  return (appState.rosterStudents || [])
    .map((student) => typeof student === "string" ? { name: student } : student)
    .find((student) => [student.name, student.displayName, student.fullName, ...(student.aliases || [])]
      .filter(Boolean)
      .some((value) => String(value).trim().toLocaleLowerCase() === normalized)) || null;
}

function ttStudentIdForName(name, group = null) {
  return group?.studentIds?.[name] || ttRosterProfileByName(name)?.studentId || "";
}

function ttStudentDisplayName(studentId, fallback = "Student") {
  const profile = ttRosterProfileById(studentId);
  return profile?.name || profile?.displayName || fallback;
}

function ttStudentHomeGroupId(studentId, schoolYearId = appState.activeSchoolYearId) {
  return (appState.groups || []).find((group) => group.schoolYearId === schoolYearId
    && (group.students || []).some((name) => ttStudentIdForName(name, group) === studentId))?.id || "";
}

function ttTeachingDate(group = ttActiveGroup(), lesson = ttLesson) {
  if (lesson?.scheduledDate) return dateKey(lesson.scheduledDate);
  const plan = group ? ttActiveOpenPlan(group) : null;
  const day = plan ? ttPlanSessionDay(plan, plan.lessons?.[0]) : "1";
  if (plan?.sessions?.[day]?.date) return dateKey(plan.sessions[day].date);
  if (plan?.scheduledDate) return dateKey(plan.scheduledDate);
  if (ttPlannerDraft?.groupId === group?.id && ttPlannerDraft.scheduledDate) return dateKey(ttPlannerDraft.scheduledDate);
  return ttTodayKey();
}

function ttCombinationFor(group = ttActiveGroup(), dayKey = ttTeachingDate(group)) {
  return group?.temporaryCombinations?.[dateKey(dayKey)] || null;
}

function ttTeachingStudentEntries(group = ttActiveGroup(), dayKey = ttTeachingDate(group)) {
  if (!group) return [];
  const combination = ttCombinationFor(group, dayKey);
  const sourceIds = [group.id, ...(combination?.sourceGroupIds || [])];
  const seen = new Set();
  return sourceIds.flatMap((groupId) => {
    const sourceGroup = (appState.groups || []).find((item) => item.id === groupId);
    if (!sourceGroup) return [];
    return (sourceGroup.students || []).flatMap((name) => {
      const studentId = ttStudentIdForName(name, sourceGroup);
      const key = studentId || String(name).trim().toLocaleLowerCase();
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{
        studentId,
        name: ttStudentDisplayName(studentId, name),
        homeGroupId: sourceGroup.id,
        homeGroupName: sourceGroup.name
      }];
    });
  });
}

function ttTeachingStudents(group = ttActiveGroup(), dayKey = ttTeachingDate(group)) {
  return ttTeachingStudentEntries(group, dayKey).map((entry) => entry.name);
}

function ttApplyPlanRosterSnapshot(plan, group, lesson = plan?.lessons?.[0]) {
  if (!plan || !group) return plan;
  if (plan.rosterSnapshotLocked && Array.isArray(plan.rosterSnapshot)) {
    plan.hostGroupId ||= group.id;
    plan.participatingGroupIds = [...new Set([
      plan.hostGroupId,
      ...plan.rosterSnapshot.map((entry) => entry.homeGroupId)
    ].filter(Boolean))];
    plan.participantStudentIds = [...new Set(plan.rosterSnapshot.map((entry) => entry.studentId).filter(Boolean))];
    return plan;
  }
  const dayKey = dateKey(lesson?.scheduledDate || plan.scheduledDate || ttTeachingDate(group, lesson));
  const combination = ttCombinationFor(group, dayKey);
  const entries = ttTeachingStudentEntries(group, dayKey);
  plan.hostGroupId = group.id;
  plan.participatingGroupIds = [group.id, ...(combination?.sourceGroupIds || [])];
  plan.participatingGroupIds = [...new Set(plan.participatingGroupIds.filter(Boolean))];
  plan.participantStudentIds = [...new Set(entries.map((entry) => entry.studentId).filter(Boolean))];
  plan.rosterSnapshot = entries.map((entry) => ({ ...entry }));
  plan.combinationDate = combination ? dayKey : "";
  plan.guestLessonNumbers ||= {};
  plan.participatingGroupIds.filter((groupId) => groupId !== group.id).forEach((groupId) => {
    const guest = (appState.groups || []).find((item) => item.id === groupId);
    if (guest && !plan.guestLessonNumbers[groupId]) plan.guestLessonNumbers[groupId] = Number(guest.lessonSerial || 0) + 1;
  });
  if (plan.hasStudentData || ["Taught", "Complete"].includes(plan.status)) plan.rosterSnapshotLocked = true;
  return plan;
}

function ttSyncCombinedLessonLinks(plan, hostGroup) {
  if (!plan || !hostGroup) return;
  ttApplyPlanRosterSnapshot(plan, hostGroup, plan.lessons?.[0]);
  const participantIds = new Set(plan.participatingGroupIds || []);
  (appState.groups || []).forEach((group) => {
    if (group.id === hostGroup.id) return;
    group.history ||= [];
    const linkId = `combined-link-${plan.id}-${group.id}`;
    const existingIndex = group.history.findIndex((item) => item.id === linkId);
    if (!participantIds.has(group.id)) {
      if (existingIndex >= 0 && !group.history[existingIndex].hasStudentData) {
        group.history.splice(existingIndex, 1);
        ttRecalculateLessonSerial(group);
      }
      return;
    }
    const guestLessonNumber = plan.guestLessonNumbers?.[group.id] || Number(group.lessonSerial || 0) + 1;
    const lesson = ttClone(plan.lessons?.[0] || {});
    lesson.savedPlanId = linkId;
    lesson.lessonSequence = guestLessonNumber;
    const link = {
      id: linkId,
      hostPlanId: plan.id,
      hostGroupId: hostGroup.id,
      hostGroupNameAtTime: hostGroup.name,
      combinedParticipation: true,
      readOnly: true,
      source: "CombinedSession",
      schoolYearId: group.schoolYearId,
      groupIdAtTime: group.id,
      lessonNumber: guestLessonNumber,
      title: `Combined with ${hostGroup.name} · Lesson ${guestLessonNumber}`,
      tabLabel: `Combined · ${hostGroup.name}`,
      created: plan.created,
      savedAt: plan.savedAt,
      dailyKey: plan.dailyKey,
      scheduledDate: plan.scheduledDate,
      status: plan.status,
      substep: plan.substep,
      hasStudentData: plan.hasStudentData,
      participantStudentIds: (plan.rosterSnapshot || [])
        .filter((entry) => entry.homeGroupId === group.id && entry.studentId)
        .map((entry) => entry.studentId),
      lessons: [lesson]
    };
    if (existingIndex >= 0) group.history[existingIndex] = link;
    else group.history.push(link);
    group.history = group.history.slice(-50);
    group.lessonSerial = Math.max(Number(group.lessonSerial || 0), Number(guestLessonNumber || 0));
  });
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

function ttNextPlanningDateKey(value) {
  const nextAfterLesson = ttNextInstructionDateKey(value || ttTodayKey());
  const today = ttTodayKey();
  if (nextAfterLesson >= today) return nextAfterLesson;
  const todayDate = ttDateFromKey(today);
  return [0, 5, 6].includes(todayDate.getDay()) ? ttNextInstructionDateKey(today) : today;
}

function ttContinuityRecord(groupId, planId) {
  const group = (appState.groups || []).find((item) => item.id === groupId);
  const plan = (group?.history || []).find((item) => item.id === planId);
  if (!group || !plan?.lessons?.[0]) return null;
  return { group, plan, lesson: plan.lessons[0] };
}

function ttContinuityPlan(groupId, planId) {
  const current = ttContinuityRecord(groupId, planId);
  if (!current || current.plan.excludedFromLessonSequence || ["Complete", "Incomplete", "Test"].includes(current.plan.status)) return null;
  return current;
}

function ttCloseOpenPlanFromHome(groupId, planId, nextDate) {
  const current = ttContinuityRecord(groupId, planId);
  if (!current || current.plan.excludedFromLessonSequence || current.plan.status === "Test") return false;
  const { group, plan, lesson } = current;
  const now = new Date().toISOString();
  const day = ttPlanSessionDay(plan, lesson);
  plan.sessions ||= {};
  const planDate = plan.sessions[day]?.date || lesson.scheduledDate || plan.scheduledDate || ttTodayKey();
  if (!["Complete", "Incomplete"].includes(plan.status)) {
    plan.status = "Incomplete";
    plan.closedAt = now;
    plan.closedReason = "Teacher chose to start a new lesson";
    plan.sessions[day] = {
      ...plan.sessions[day],
      date: planDate,
      status: "Incomplete",
      closedAt: now
    };
    ttSyncCombinedLessonLinks(plan, group);
  }
  if (group.activeLessonPlanId === plan.id) group.activeLessonPlanId = "";
  ttPlannerGroupId = group.id;
  ttPlannerDraft = {};
  ttEnsurePlannerDraft(group).scheduledDate = nextDate || ttNextPlanningDateKey(planDate);
  saveState();
  return true;
}

function ttResumeOpenPlanFromHome(groupId, planId, sessionDate) {
  const current = ttContinuityPlan(groupId, planId);
  if (!current) return false;
  const { group, plan, lesson } = current;
  const day = ttPlanSessionDay(plan, lesson);
  const date = sessionDate || plan.sessions?.[day]?.date || lesson.scheduledDate || plan.scheduledDate || ttTodayKey();
  appState.selectedGroupId = group.id;
  ttPlannerGroupId = group.id;
  group.activeLessonPlanId = plan.id;
  plan.sessions ||= {};
  plan.sessions[day] = {
    ...plan.sessions[day],
    date,
    status: "In progress",
    startedAt: plan.sessions[day]?.startedAt || new Date().toISOString()
  };
  plan.activeDay = day;
  plan.status = "In progress";
  lesson.scheduledDate = date;
  lesson.activeGroupDay = day;
  const opened = ttOpenPlanInApp(plan.id, group.id);
  if (!opened || !ttLesson?.savedPlanId) return false;
  // ttOpenPlanInApp has already persisted the selected plan and loaded its
  // lesson. Do not run a second save here: on iPad Stage that extra lookup can
  // race the freshly loaded state and incorrectly turn a successful reopen
  // into a failure. Presentation is an enhancement, not a condition of being
  // able to teach the reopened lesson.
  try {
    ttOpenTeachFlow({ transition: false, presentation: true });
  } catch (error) {
    console.error("Teach Today: reopened lesson, but presentation mode could not start.", error);
    try {
      ttOpenTeachFlow({ transition: false, presentation: false });
    } catch (fallbackError) {
      console.error("Teach Today: lesson remains loaded after view transition failure.", fallbackError);
    }
  }
  return true;
}

function ttRecordPlanRevision(plan, lesson, reason = "Saved changes") {
  if (!plan || !lesson) return;
  const snapshot = ttClone(lesson);
  delete snapshot.savedPlanId;
  const fingerprint = teachTodayStateFingerprint(snapshot);
  if (plan.lastRevisionFingerprint === fingerprint) return;
  plan.revisions ||= [];
  plan.revisions.push({ id: `revision-${Date.now()}`, savedAt: new Date().toISOString(), reason });
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
  const students = ttTeachingStudents(group);
  if (!students.includes(group.activeStudent)) group.activeStudent = students[0] || "";
  students.forEach((student) => {
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
  ttTeachingStudents(group).forEach((student) => {
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
  return dateKey(date);
}

function ttAttendanceSession(group = ttActiveGroup(), dayKey = ttAttendanceKey(), create = false) {
  ttNormalizeTeachTodayState();
  if (!group?.id || !dayKey) return null;
  appState.attendanceSessions[group.id] ||= {};
  if (create && !appState.attendanceSessions[group.id][dayKey]) {
    appState.attendanceSessions[group.id][dayKey] = {
      date: dayKey,
      status: "unconfirmed",
      attendance: {},
      planIds: [],
      lessonNumbers: [],
      lessonParts: [],
      createdAt: new Date().toISOString(),
      audit: []
    };
  }
  return appState.attendanceSessions[group.id][dayKey] || null;
}

function ttTodaysAttendance(group = ttActiveGroup(), dayKey = ttAttendanceKey()) {
  ttNormalizeTeachTodayState();
  const session = ttAttendanceSession(group, dayKey);
  if (session?.status === "confirmed") return session.attendance || {};
  return appState.attendanceRecords?.[group.id]?.[dayKey] || {};
}

function ttAttendanceContext(group = document.body.classList.contains("home-mode") ? ttPlannerGroup() : ttActiveGroup()) {
  const plan = group ? ttActiveOpenPlan(group) || (group.id === ttActiveGroup()?.id ? ttCurrentPlan() : null) : null;
  const lesson = plan?.lessons?.[0] || (group?.id === ttActiveGroup()?.id ? ttLesson : null) || {};
  const lessonNumber = plan ? ttPlanLessonNumber(plan, lesson, group) : Number(group?.lessonSerial || 0) + 1;
  const planId = plan?.id || lesson?.savedPlanId || "";
  return { group, plan, lesson, lessonNumber, planId };
}

function ttAttendanceLessonParts(session, lesson, plan, group = ttActiveGroup(), dayKey = ttAttendanceKey()) {
  const saved = Array.isArray(session?.lessonParts) ? session.lessonParts.map(String) : [];
  if (session) return [...new Set(saved)];
  const detected = ttDetectedLessonParts(ttAttendanceActivity(group, dayKey));
  if (detected.length) return detected;
  const active = String(plan?.activeDay || lesson?.activeGroupDay || ttGroupDay || "1");
  return active === "2" ? ["2"] : ["1"];
}

function ttUpdateAttendanceReminder() {
  const button = ttById("ttAttendanceReminder");
  if (!button) return;
  const viewingArchive = document.body.classList.contains("home-mode")
    && ttById("ttHomeSchoolYear")?.value
    && ttById("ttHomeSchoolYear").value !== appState.activeSchoolYearId;
  const { group, lessonNumber } = ttAttendanceContext();
  const session = group ? ttAttendanceSession(group) : null;
  const resolved = session && ["confirmed", "no-session"].includes(session.status);
  button.hidden = !group || viewingArchive || resolved;
  if (!button.hidden) {
    button.innerHTML = `<span aria-hidden="true">✓</span><strong>Attendance</strong><small>${escapeHtml(group.name)} · Lesson ${escapeHtml(lessonNumber)}</small>`;
    button.setAttribute("aria-label", `Confirm attendance for ${group.name} today`);
  }
}

function ttAttendanceActivity(group = ttActiveGroup(), dayKey = ttAttendanceKey(), create = false) {
  ttNormalizeTeachTodayState();
  if (!group?.id || !dayKey) return null;
  appState.attendanceActivity[group.id] ||= {};
  if (create && !appState.attendanceActivity[group.id][dayKey]) {
    const { planId, lessonNumber } = ttAttendanceContext(group);
    appState.attendanceActivity[group.id][dayKey] = {
      date: dayKey,
      planId,
      lessonNumber,
      sections: {},
      createdAt: new Date().toISOString()
    };
  }
  return appState.attendanceActivity[group.id][dayKey] || null;
}

function ttSectionDisplayName(sectionId) {
  return String(sectionId || "").replace(/^section/i, "").toUpperCase();
}

function ttSortedDetectedSections(activity) {
  const order = ["section1", "section1b", "section2", "section2b", "section3", "section4", "section5", "section6", "section7", "section8", "section9", "section10"];
  return Object.keys(activity?.sections || {}).sort((a, b) => {
    const left = order.indexOf(a);
    const right = order.indexOf(b);
    return (left < 0 ? 99 : left) - (right < 0 ? 99 : right);
  });
}

function ttDetectedLessonParts(activity) {
  return [...new Set(Object.values(activity?.sections || {}).map((item) => String(item.lessonPart || "")).filter((part) => ["1", "2"].includes(part)))].sort();
}

function ttQueueAttendanceActivitySave() {
  if (ttAttendanceActivitySaveTimer) return;
  ttAttendanceActivitySaveTimer = setTimeout(() => {
    ttAttendanceActivitySaveTimer = null;
    saveState();
  }, 400);
}

function ttRecordSectionInteraction(sectionId, source = "control") {
  const modal = ttById("ttAttendanceSessionModal");
  if (!sectionId || document.body.classList.contains("home-mode") || (modal && !modal.hidden)) return;
  const group = ttActiveGroup();
  const activity = ttAttendanceActivity(group, ttAttendanceKey(), true);
  const plan = ttCurrentPlan();
  const activePart = String(plan?.activeDay || ttLesson?.activeGroupDay || ttGroupDay || "");
  const now = new Date().toISOString();
  const existing = activity.sections[sectionId];
  activity.sections[sectionId] = {
    firstAt: existing?.firstAt || now,
    lastAt: now,
    lessonPart: ["1", "2"].includes(activePart) ? activePart : existing?.lessonPart || "",
    sources: [...new Set([...(existing?.sources || []), source])]
  };
  activity.planId ||= plan?.id || ttLesson?.savedPlanId || "";
  activity.lessonNumber ||= ttPlanLessonNumber(plan, ttLesson, group);
  activity.updatedAt = now;
  ttTrackConfirmedAttendanceActivity({ part: activePart, sectionId, state: "detected" });
  if (!existing || existing.lessonPart !== activity.sections[sectionId].lessonPart || !(existing.sources || []).includes(source)) ttQueueAttendanceActivitySave();
}

function ttTrackConfirmedAttendanceActivity({ part = "", sectionId = "", state = "" } = {}) {
  const group = ttActiveGroup();
  const session = ttAttendanceSession(group);
  if (session?.status !== "confirmed") return;
  const plan = ttCurrentPlan();
  const lesson = plan?.lessons?.[0] || ttLesson || {};
  const activePart = String(part || plan?.activeDay || lesson.activeGroupDay || ttGroupDay || "");
  session.lessonParts ||= [];
  session.planIds ||= [];
  session.lessonNumbers ||= [];
  if (["1", "2"].includes(activePart) && !session.lessonParts.includes(activePart)) {
    session.lessonParts.push(activePart);
    session.lessonParts.sort();
  }
  if (plan?.id && !session.planIds.includes(plan.id)) session.planIds.push(plan.id);
  const lessonNumber = ttPlanLessonNumber(plan, lesson, group);
  if (lessonNumber && !session.lessonNumbers.map(String).includes(String(lessonNumber))) session.lessonNumbers.push(lessonNumber);
  if (sectionId) {
    session.sectionActivity ||= {};
    const prior = session.sectionActivity[sectionId] || {};
    session.sectionActivity[sectionId] = { ...prior, state: ["done", "skipped"].includes(prior.state) && state === "detected" ? prior.state : state || "visited", lessonPart: activePart || prior.lessonPart || "", updatedAt: new Date().toISOString() };
  }
  session.updatedAt = new Date().toISOString();
}

function ttAttendanceCalendarState(group, dayKey) {
  const session = ttAttendanceSession(group, dayKey);
  if (session?.status === "confirmed") return { className: "confirmed", label: "Confirmed" };
  if (session?.status === "no-session") return { className: "no-session", label: "No session" };
  if (appState.attendanceRecords?.[group.id]?.[dayKey]) return { className: "review", label: "Review" };
  return { className: "blank", label: "No record" };
}

function ttAttendanceHistoryCalendarHtml(group, selectedDayKey) {
  const today = ttDateFromKey(ttAttendanceKey());
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  const start = new Date(currentWeekStart);
  start.setDate(start.getDate() - 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 27);
  const rangeLabel = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("");
  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dayKey = dateKey(date);
    const state = ttAttendanceCalendarState(group, dayKey);
    const future = date.getTime() > today.getTime();
    const label = `${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}: ${future ? "Future date" : state.label}`;
    return `<button type="button" class="attendance-history-day ${state.className}${dayKey === selectedDayKey ? " selected" : ""}${future ? " future" : ""}" data-attendance-edit-date="${escapeHtml(dayKey)}" aria-label="${escapeHtml(label)}" ${future ? "disabled" : ""}><b>${date.getDate()}</b><small>${future ? "" : state.label}</small></button>`;
  }).join("");
  return `<div class="attendance-history-heading"><strong>Last four calendar weeks</strong><span>${escapeHtml(rangeLabel)}</span></div><div class="attendance-history-legend"><span class="confirmed">Confirmed</span><span class="review">Needs review</span><span class="no-session">No session</span></div><div class="attendance-history-weekdays">${weekdays}</div><div class="attendance-history-calendar">${days}</div>`;
}

function ttLockAttendanceModalScroll() {
  if (document.body.classList.contains("attendance-modal-open")) return;
  ttAttendanceModalScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
  ttAttendancePriorScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.classList.add("attendance-modal-open");
  document.body.classList.add("attendance-modal-open");
  document.body.style.top = `-${ttAttendanceModalScrollY}px`;
}

function ttUnlockAttendanceModalScroll() {
  if (!document.body.classList.contains("attendance-modal-open")) return;
  document.documentElement.classList.remove("attendance-modal-open");
  document.body.classList.remove("attendance-modal-open");
  document.body.style.top = "";
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, ttAttendanceModalScrollY);
  requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ttAttendancePriorScrollBehavior; });
}

function ttAttendanceModalElement() {
  let overlay = ttById("ttAttendanceSessionModal");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "ttAttendanceSessionModal";
  overlay.className = "attendance-session-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `<div class="attendance-session-backdrop" data-attendance-close></div><section class="attendance-session-card" role="dialog" aria-modal="true" aria-labelledby="ttAttendanceSessionTitle"><button class="attendance-session-close" type="button" data-attendance-close aria-label="Close">×</button><div id="ttAttendanceSessionBody"></div></section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-attendance-close]")) ttCloseAttendanceSessionModal();
  });
  return overlay;
}

function ttAttendanceStatusButton(student, status) {
  if (status === true) status = "present";
  if (status === false) status = "absent";
  const label = status === "present" ? "Present" : status === "absent" ? "Absent" : "Not marked";
  return `<button type="button" class="attendance-person-status ${escapeHtml(status || "unmarked")}" data-attendance-student="${escapeHtml(student)}" data-attendance-status="${escapeHtml(status || "unmarked")}">${escapeHtml(student)}<span>${label}</span></button>`;
}

function ttOpenAttendanceSessionModal(dayKey = ttAttendanceKey(), options = {}) {
  const overlay = ttAttendanceModalElement();
  const body = ttById("ttAttendanceSessionBody");
  const requestedGroup = options.groupId
    ? (appState.groups || []).find((item) => item.id === options.groupId)
    : null;
  const { group, plan, lesson, lessonNumber, planId } = ttAttendanceContext(requestedGroup || undefined);
  if (!group || !body) return;
  const existing = ttAttendanceSession(group, dayKey);
  const legacyAttendance = appState.attendanceRecords?.[group.id]?.[dayKey] || {};
  const isToday = dayKey === ttAttendanceKey();
  const isFreshToday = isToday && !existing && !Object.keys(legacyAttendance).length;
  const attendance = { ...(existing?.attendance || legacyAttendance) };
  ttTeachingStudentEntries(group, dayKey).forEach(({ name, studentId }) => {
    if (attendance[name] === undefined && existing?.attendanceByStudentId?.[studentId] !== undefined) attendance[name] = existing.attendanceByStudentId[studentId];
  });
  const sessionStudents = ttTeachingStudents(group, dayKey);
  if (!existing) sessionStudents.forEach((student) => {
    if (attendance[student] === undefined) attendance[student] = true;
  });
  const activity = ttAttendanceActivity(group, dayKey);
  const detectedSections = ttSortedDetectedSections(activity);
  const detectedLabel = detectedSections.length
    ? `Detected from lesson controls: ${detectedSections.map((sectionId) => `Section ${ttSectionDisplayName(sectionId)}`).join(", ")}`
    : isToday ? "Coverage will update as you use lesson controls." : "No section interactions were detected for this date.";
  const parts = ttAttendanceLessonParts(existing, lesson, plan, group, dayKey);
  const lessonPlans = ttOfficialLessonPlans(group);
  const selectedPlanId = existing?.planIds?.[0] || planId;
  const lessonOptions = lessonPlans.slice().reverse().map((item) => {
    const itemLesson = item.lessons?.[0] || {};
    const number = ttPlanLessonNumber(item, itemLesson, group);
    return `<option value="${escapeHtml(item.id)}" data-lesson-number="${escapeHtml(number)}" ${item.id === selectedPlanId ? "selected" : ""}>Lesson ${escapeHtml(number)} · ${escapeHtml(item.status || "Saved")}</option>`;
  }).join("");
  const displayLessonNumber = existing?.lessonNumbers?.join(" + ") || lessonNumber;
  body.innerHTML = `<header><span>${isToday ? "TODAY'S SESSION" : "EDIT ATTENDANCE"}</span><h2 id="ttAttendanceSessionTitle">${escapeHtml(group.name)} · ${escapeHtml(ttLongLessonDate(dayKey))}</h2><p>Lesson ${escapeHtml(displayLessonNumber)}. Opening or preparing this lesson does not count as attendance.</p></header>
    <div class="attendance-identity-fields"><label class="attendance-date-field">Attendance date<input id="ttAttendanceEditDate" type="date" value="${escapeHtml(dayKey)}"></label><label class="attendance-date-field">Lesson used<select id="ttAttendancePlanSelect">${lessonOptions || `<option value="${escapeHtml(planId)}" data-lesson-number="${escapeHtml(lessonNumber)}">Lesson ${escapeHtml(lessonNumber)}</option>`}</select></label></div>
    <details class="attendance-coverage" ${!isFreshToday || detectedSections.length ? "open" : ""}><summary><strong>Lesson coverage</strong><span>${escapeHtml(detectedLabel)}</span></summary><fieldset class="attendance-parts"><legend>Adjust lesson portions if needed</legend><label><input type="checkbox" value="1" ${parts.includes("1") ? "checked" : ""}> Day 1 portions</label><label><input type="checkbox" value="2" ${parts.includes("2") ? "checked" : ""}> Day 2 portions</label></fieldset></details>
    <div class="attendance-people">${sessionStudents.map((student) => ttAttendanceStatusButton(student, attendance[student])).join("") || "<p>No students are assigned to this group.</p>"}</div>
    <label class="attendance-note-field">Group-day note<textarea id="ttAttendanceSessionNote" rows="2" placeholder="Testing day, ARD conflict, teacher absent, school event…">${escapeHtml(existing?.note || "")}</textarea></label>
    <div class="attendance-reasons" aria-label="Common no-session reasons"><span>Quick reasons:</span>${["Testing day", "Teacher assigned to testing", "ARD conflict", "Teacher absent", "School or class event"].map((reason) => `<button type="button" data-attendance-reason="${escapeHtml(reason)}">${escapeHtml(reason)}</button>`).join("")}</div>
    <div class="attendance-session-actions"><button type="button" data-attendance-all>Reset all present</button><button type="button" class="attendance-confirm" data-attendance-confirm>Confirm attendance</button><button type="button" class="attendance-no-session" data-attendance-none>No session held</button></div>
    <details class="attendance-history" ${options.history ? "open" : ""}><summary>Edit a previous date</summary>${ttAttendanceHistoryCalendarHtml(group, dayKey)}</details>`;
  overlay.hidden = false;
  ttLockAttendanceModalScroll();

  body.querySelector("#ttAttendanceEditDate")?.addEventListener("change", (event) => ttOpenAttendanceSessionModal(event.target.value || dayKey, options));
  body.querySelectorAll("[data-attendance-student]").forEach((button) => button.addEventListener("click", () => {
    const next = button.dataset.attendanceStatus === "present" ? "absent" : "present";
    button.dataset.attendanceStatus = next;
    button.className = `attendance-person-status ${next}`;
    button.querySelector("span").textContent = next === "present" ? "Present" : next === "absent" ? "Absent" : "Not marked";
  }));
  body.querySelector("[data-attendance-all]")?.addEventListener("click", () => {
    body.querySelectorAll("[data-attendance-student]").forEach((button) => {
      button.dataset.attendanceStatus = "present";
      button.className = "attendance-person-status present";
      button.querySelector("span").textContent = "Present";
    });
  });
  body.querySelectorAll("[data-attendance-reason]").forEach((button) => button.addEventListener("click", () => {
    const note = body.querySelector("#ttAttendanceSessionNote");
    if (note) note.value = button.dataset.attendanceReason || "";
  }));
  const selectedIdentity = () => {
    const select = body.querySelector("#ttAttendancePlanSelect");
    return { planId: select?.value || planId, lessonNumber: select?.selectedOptions?.[0]?.dataset.lessonNumber || lessonNumber };
  };
  body.querySelector("[data-attendance-confirm]")?.addEventListener("click", () => ttConfirmAttendanceSession(group, dayKey, selectedIdentity()));
  body.querySelector("[data-attendance-none]")?.addEventListener("click", () => ttSaveNoAttendanceSession(group, dayKey, selectedIdentity()));
  body.querySelectorAll("[data-attendance-edit-date]").forEach((button) => button.addEventListener("click", () => ttOpenAttendanceSessionModal(button.dataset.attendanceEditDate, { ...options, history: true })));
}

function ttAttendanceModalValues() {
  const body = ttById("ttAttendanceSessionBody");
  const attendance = {};
  let unmarked = 0;
  body?.querySelectorAll("[data-attendance-student]").forEach((button) => {
    const status = button.dataset.attendanceStatus;
    if (status === "present") attendance[button.dataset.attendanceStudent] = true;
    else if (status === "absent") attendance[button.dataset.attendanceStudent] = false;
    else unmarked += 1;
  });
  return {
    attendance,
    unmarked,
    parts: [...body?.querySelectorAll(".attendance-parts input:checked") || []].map((input) => input.value),
    note: body?.querySelector("#ttAttendanceSessionNote")?.value.trim() || ""
  };
}

function ttSyncCombinedAttendanceToSourceGroups(hostGroup, dayKey, hostSession, identity = {}) {
  const combination = ttCombinationFor(hostGroup, dayKey);
  if (!combination?.sourceGroupIds?.length || !hostSession) return;
  appState.attendanceSessions ||= {};
  appState.attendanceRecords ||= {};
  combination.sourceGroupIds.forEach((groupId) => {
    const group = (appState.groups || []).find((item) => item.id === groupId);
    if (!group) return;
    const hostPlan = (hostGroup.history || []).find((plan) => plan.id === identity.planId);
    const linkedPlanId = hostPlan ? `combined-link-${hostPlan.id}-${group.id}` : identity.planId || "";
    const guestLessonNumber = hostPlan?.guestLessonNumbers?.[group.id] || identity.lessonNumber;
    appState.attendanceSessions[group.id] ||= {};
    appState.attendanceRecords[group.id] ||= {};
    const existing = appState.attendanceSessions[group.id][dayKey];
    if (existing?.status === "confirmed" && existing.combinedHostGroupId && existing.combinedHostGroupId !== hostGroup.id) return;
    if (existing?.status === "confirmed" && !existing.combinedHostGroupId) {
      existing.audit ||= [];
      existing.audit.push({ at: new Date().toISOString(), action: "combined-session-linked", hostGroupId: hostGroup.id, planId: linkedPlanId });
      existing.combinedPlanIds = [...new Set([...(existing.combinedPlanIds || []), linkedPlanId].filter(Boolean))];
      return;
    }
    const attendance = {};
    const attendanceByStudentId = {};
    (group.students || []).forEach((name) => {
      const studentId = ttStudentIdForName(name, group);
      if (!studentId || hostSession.attendanceByStudentId?.[studentId] === undefined) return;
      attendance[name] = hostSession.attendanceByStudentId[studentId];
      attendanceByStudentId[studentId] = hostSession.attendanceByStudentId[studentId];
    });
    const synced = {
      ...(existing || {}),
      date: dayKey,
      status: "confirmed",
      attendance,
      attendanceByStudentId,
      note: existing?.note || `Combined session hosted by ${hostGroup.name}`,
      planIds: linkedPlanId ? [linkedPlanId] : [],
      lessonNumbers: guestLessonNumber ? [guestLessonNumber] : [],
      lessonParts: ttClone(hostSession.lessonParts || []),
      sectionActivity: ttClone(hostSession.sectionActivity || {}),
      combinedHostGroupId: hostGroup.id,
      combinedPlanIds: [...new Set([...(existing?.combinedPlanIds || []), linkedPlanId].filter(Boolean))],
      confirmedAt: hostSession.confirmedAt,
      updatedAt: new Date().toISOString(),
      audit: [...(existing?.audit || []), { at: new Date().toISOString(), action: "combined-session-synced", hostGroupId: hostGroup.id, planId: linkedPlanId }]
    };
    appState.attendanceSessions[group.id][dayKey] = synced;
    appState.attendanceRecords[group.id][dayKey] = { ...attendance };
  });
}

function ttConfirmAttendanceSession(group, dayKey, identity = {}) {
  const values = ttAttendanceModalValues();
  if (values.unmarked) {
    alert(`Mark all ${values.unmarked} remaining student${values.unmarked === 1 ? "" : "s"} present or absent before confirming.`);
    return;
  }
  const session = ttAttendanceSession(group, dayKey, true);
  const before = session.status;
  const previous = before === "unconfirmed" ? null : {
    status: before,
    attendance: ttClone(session.attendance || {}),
    attendanceByStudentId: ttClone(session.attendanceByStudentId || {}),
    lessonParts: ttClone(session.lessonParts || []),
    sectionActivity: ttClone(session.sectionActivity || {}),
    planIds: ttClone(session.planIds || []),
    lessonNumbers: ttClone(session.lessonNumbers || []),
    note: session.note || ""
  };
  session.status = "confirmed";
  session.attendance = values.attendance;
  session.attendanceByStudentId = Object.entries(values.attendance).reduce((result, [name, present]) => {
    const studentId = ttStudentIdForName(name, group);
    if (studentId) result[studentId] = present;
    return result;
  }, {});
  session.note = values.note;
  session.lessonParts = [...new Set(values.parts)].sort();
  const detectedActivity = ttAttendanceActivity(group, dayKey);
  session.sectionActivity = {
    ...(session.sectionActivity || {}),
    ...ttClone(detectedActivity?.sections || {})
  };
  session.planIds = identity.planId ? [identity.planId] : [];
  session.lessonNumbers = identity.lessonNumber ? [identity.lessonNumber] : [];
  session.confirmedAt = new Date().toISOString();
  session.updatedAt = session.confirmedAt;
  session.audit ||= [];
  session.audit.push({ at: session.updatedAt, action: before === "confirmed" ? "corrected" : "confirmed", ...(previous ? { previous } : {}) });
  appState.attendanceRecords[group.id] ||= {};
  appState.attendanceRecords[group.id][dayKey] = { ...values.attendance };
  const attendedPlan = (group.history || []).find((plan) => plan.id === identity.planId);
  if (attendedPlan) {
    ttApplyPlanRosterSnapshot(attendedPlan, group, attendedPlan.lessons?.[0]);
    attendedPlan.rosterSnapshotLocked = true;
    ttSyncCombinedLessonLinks(attendedPlan, group);
  }
  ttSyncCombinedAttendanceToSourceGroups(group, dayKey, session, identity);
  saveState();
  ttCloseAttendanceSessionModal();
  ttRenderAttendancePanel(group);
  ttRenderWrapUpPanel(group, ttLesson);
  ttUpdateAttendanceReminder();
}

function ttSaveNoAttendanceSession(group, dayKey, identity = {}) {
  const session = ttAttendanceSession(group, dayKey, true);
  const previous = session.status === "unconfirmed" ? null : {
    status: session.status,
    attendance: ttClone(session.attendance || {}),
    attendanceByStudentId: ttClone(session.attendanceByStudentId || {}),
    lessonParts: ttClone(session.lessonParts || []),
    sectionActivity: ttClone(session.sectionActivity || {}),
    planIds: ttClone(session.planIds || []),
    lessonNumbers: ttClone(session.lessonNumbers || []),
    note: session.note || ""
  };
  session.status = "no-session";
  session.attendance = {};
  session.attendanceByStudentId = {};
  session.note = ttById("ttAttendanceSessionNote")?.value.trim() || "";
  session.lessonParts = [];
  session.sectionActivity = {};
  session.planIds = identity.planId ? [identity.planId] : [];
  session.lessonNumbers = identity.lessonNumber ? [identity.lessonNumber] : [];
  session.updatedAt = new Date().toISOString();
  session.audit ||= [];
  session.audit.push({ at: session.updatedAt, action: "marked-no-session", ...(previous ? { previous } : {}) });
  saveState();
  ttCloseAttendanceSessionModal();
  ttUpdateAttendanceReminder();
}

function ttCloseAttendanceSessionModal() {
  const overlay = ttById("ttAttendanceSessionModal");
  if (overlay) overlay.hidden = true;
  ttUnlockAttendanceModalScroll();
  const url = new URL(location.href);
  if (url.searchParams.has("editAttendance")) {
    url.searchParams.delete("editAttendance");
    history.replaceState(null, "", url);
  }
  if (!ttById("ttAttendanceCentral")?.hidden) ttRenderAttendanceCentral();
}

function ttRenderAttendancePanel(group) {
  const panel = ttById("ttAttendancePanel");
  if (!panel) return;
  const session = ttAttendanceSession(group);
  const attendance = session?.status === "confirmed" ? session.attendance : {};
  panel.innerHTML = ttTeachingStudents(group).map((student) => {
    const status = attendance[student] === true ? "Present" : attendance[student] === false ? "Absent" : "Not marked";
    return `<span class="attendance-chip ${status === "Present" ? "present" : status === "Absent" ? "absent" : ""}">${status} - ${escapeHtml(student)}</span>`;
  }).join("") + `<button type="button" class="attendance-panel-edit" data-open-attendance>${session?.status === "confirmed" ? "Edit today's attendance" : "Confirm today's attendance"}</button><button type="button" class="attendance-panel-history" data-open-attendance-history>Edit previous dates</button>`;
  panel.querySelector("[data-open-attendance]")?.addEventListener("click", () => ttOpenAttendanceSessionModal());
  panel.querySelector("[data-open-attendance-history]")?.addEventListener("click", () => ttOpenAttendanceSessionModal(ttAttendanceKey(), { history: true }));
}

// Attendance Central is a calendar projection over the existing attendance,
// lesson, and evidence stores. Its only writes go through the audited
// attendance-session editor above, so complete app backups include them.
let ttAttendanceCentralView = "month";
let ttAttendanceCentralDate = new Date();

function ttAttendanceCentralGroups(yearId) {
  return (appState.groups || []).filter((group) => group.schoolYearId === yearId);
}

function ttAttendanceCentralYearBounds(yearId) {
  const startYear = Number(String(yearId || currentSchoolYearId()).slice(0, 4)) || new Date().getFullYear();
  return { start: new Date(startYear, 6, 1), end: new Date(startYear + 1, 5, 30) };
}

function ttAttendanceCentralPlanForDay(group, dayKey, session = ttAttendanceSession(group, dayKey)) {
  const plans = ttOfficialLessonPlans(group);
  const linked = (session?.planIds || []).map((id) => plans.find((plan) => plan.id === id)).find(Boolean);
  if (linked) return linked;
  return plans.find((plan) => {
    const lesson = plan.lessons?.[0] || {};
    return [lesson.scheduledDate, lesson.day1Date, lesson.day2Date, plan.scheduledDate, dateKey(plan.savedAt || plan.created)]
      .filter(Boolean).includes(dayKey);
  }) || null;
}

function ttAttendanceCentralEvidence(group, plan, dayKey) {
  const planId = plan?.id || "";
  const lesson = plan?.lessons?.[0] || {};
  const lessonId = lesson.id || lesson.lessonId || "";
  const onDay = (record) => !dayKey || [record.date, record.displayDate, record.dailyKey, record.savedAt, record.createdAt, record.timestamp]
    .some((value) => value && dateKey(value) === dayKey);
  const exactLesson = (record) => Boolean((planId && record.planId === planId) || (lessonId && record.lessonId === lessonId));
  const compatibleDayFallback = (record) => onDay(record)
    && (!lesson.substep || !record.substep || record.substep === lesson.substep)
    && (!lesson.wordlistPageNumber || !record.wordlistPage || String(record.wordlistPage) === String(lesson.wordlistPageNumber));
  const belongs = (record) => exactLesson(record) || compatibleDayFallback(record);
  const charts = (appState.masterRecords || []).filter((record) => (record.groupId === group.id || record.group === group.name) && belongs(record));
  const encoding = (group.encodingObservations || []).filter((record) => ["section6", "section7", "section8"].includes(record.section) && belongs(record));
  const dictation = (group.dictationMisses || []).filter(belongs).map((record) => ({ ...record, section: "section8", note: "encoding miss", observationCode: "Miss", observationKind: "missed-item" }));
  const seen = new Set();
  const sections = encoding.concat(dictation).filter((record) => {
    const key = [record.section, record.studentId || record.student, record.category, record.item || record.word, record.observationCode || record.note].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { charts, sections };
}

function ttAttendanceCentralStatus(group, dayKey) {
  const session = ttAttendanceSession(group, dayKey);
  if (session?.status === "confirmed") return "confirmed";
  if (session?.status === "no-session") return "no-session";
  if (appState.attendanceRecords?.[group.id]?.[dayKey]) return "review";
  return "blank";
}

function ttAttendanceCentralGroupOrder(left, right) {
  const details = (group) => {
    const name = String(group?.name || "").trim();
    const numbered = name.match(/^group\s*(\d+)\b/i);
    if (numbered) return { tier: 0, number: Number(numbered[1]), name };
    if (/^(demo|sample)\b/i.test(name)) return { tier: 2, number: 0, name };
    return { tier: 1, number: 0, name };
  };
  const a = details(left), b = details(right);
  return a.tier - b.tier || a.number - b.number || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function ttAttendanceCentralDayButton(day, groups) {
  const key = dateKey(day);
  const statuses = groups.map((group) => ttAttendanceCentralStatus(group, key));
  const held = statuses.filter((status) => status === "confirmed").length;
  const missed = statuses.filter((status) => status === "no-session").length;
  const activity = groups.some((group) => ttAttendanceCentralPlanForDay(group, key) || ttAttendanceSession(group, key));
  const scheduled = day.getDay() > 0 && day.getDay() < 6
    ? groups.slice().sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))).map((group) => `${group.time || "—"} ${group.name || "Group"}`)
    : [];
  return `<button type="button" class="ac-calendar-day${activity ? " has-activity" : ""}" data-ac-day="${key}"><b>${day.getDate()}</b>${held ? `<span>${held} held</span>` : ""}${missed ? `<small>${missed} no session</small>` : ""}${scheduled.length ? `<em>${escapeHtml(scheduled.slice(0, 3).join(" · "))}${scheduled.length > 3 ? ` · +${scheduled.length - 3}` : ""}</em>` : ""}</button>`;
}

function ttAttendanceCentralMonthHtml(monthDate, groups, compact = false) {
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const blanks = "<i></i>".repeat(first.getDay());
  const days = Array.from({ length: last.getDate() }, (_, index) => ttAttendanceCentralDayButton(new Date(year, month, index + 1), groups)).join("");
  return `<article class="ac-month${compact ? " compact" : ""}"><button type="button" class="ac-month-title" data-ac-month="${year}-${String(month + 1).padStart(2, "0")}">${monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</button><div class="ac-weekdays"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="ac-month-grid">${blanks}${days}</div></article>`;
}

function ttAttendanceCentralPerformanceHtml(group, plan, dayKey) {
  const { charts, sections } = ttAttendanceCentralEvidence(group, plan, dayKey);
  const lesson = plan?.lessons?.[0] || {};
  const skill = scopeMap.find((item) => item.id === lesson.substep);
  const rankedCharts = charts.slice().sort((a, b) => Number(b.correct || 0) - Number(a.correct || 0) || Number(a.seconds || 9999) - Number(b.seconds || 9999) || String(a.student || "").localeCompare(String(b.student || "")));
  const page = rankedCharts[0]?.wordlistPage || lesson.wordlistPageNumber || lesson.wordlistPage || "—";
  const concept = rankedCharts[0]?.concept || skill?.title || lesson.wordlistMeta || lesson.substep || "";
  const chartRows = rankedCharts.map((record) => {
    const total = Number(record.total || 15), correct = Number(record.correct || 0);
    const level = correct / Math.max(1, total) >= .9 ? "good" : correct / Math.max(1, total) >= .8 ? "watch" : "needs";
    const misses = (record.wordRecords || []).filter((item) => !item.correct && item.word).map((item) => item.said ? `${item.word}→${item.said}` : item.word);
    const fallback = (record.wrongWords || []).filter(Boolean);
    return `<li class="${level}"><strong>${escapeHtml(record.student || "Student")}</strong><b>${correct}/${total}</b><span>${escapeHtml(record.seconds || "—")} sec</span><em>Missed: ${escapeHtml((misses.length ? misses : fallback).join(", ") || "none")}</em></li>`;
  }).join("");
  const missCounts = new Map();
  rankedCharts.forEach((record) => {
    const words = (record.wordRecords || []).filter((item) => !item.correct && item.word).map((item) => item.word).concat(record.wordRecords?.length ? [] : (record.wrongWords || []));
    words.forEach((word) => { const clean = String(word || "").trim(); if (clean) missCounts.set(clean, (missCounts.get(clean) || 0) + 1); });
  });
  const rankedMisses = [...missCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([word, count]) => `${word}${count > 1 ? ` ×${count}` : ""}`);
  const chartHtml = rankedCharts.length
    ? `<section class="ac-performance"><header><strong>Charting · Reader ${escapeHtml(rankedCharts[0]?.reader || lesson.reader || "—")}, p. ${escapeHtml(page)}</strong>${concept ? `<span>${escapeHtml(concept)}</span>` : ""}</header><ol>${chartRows}</ol>${rankedMisses.length ? `<p><strong>Most missed:</strong> ${escapeHtml(rankedMisses.join(" · "))}</p>` : ""}</section>`
    : `<p class="ac-empty">No charting saved for this lesson.</p>`;
  const missedSections = sections.filter((record) => record.item || record.word || record.observationKind === "missed-item" || record.note === "encoding miss" || /miss/i.test(record.observationCode || ""));
  const sectionLabels = {
    section6: "Section 6 sounds missed",
    section7: "Section 7 words missed",
    section8: "Section 8 dictation missed"
  };
  const sectionHtml = ["section6", "section7", "section8"].map((section) => {
    const records = missedSections.filter((record) => record.section === section);
    if (!records.length) return "";
    const items = records.map((record) => `${record.student || "Student"}: ${record.item || record.word || record.category || "miss"}${section === "section8" && record.category ? ` (${record.category})` : ""}`);
    return `<p><strong>${sectionLabels[section]}:</strong> ${escapeHtml(items.join(" · "))}</p>`;
  }).filter(Boolean).join("");
  return `${chartHtml}${sectionHtml ? `<section class="ac-section-misses">${sectionHtml}</section>` : `<p class="ac-empty">No Section 6–8 misses saved for this lesson.</p>`}`;
}

function ttAttendanceCentralDayHtml(day, groups) {
  const dayKey = dateKey(day);
  const cards = groups.slice().sort(ttAttendanceCentralGroupOrder).map((group) => {
    const session = ttAttendanceSession(group, dayKey);
    const status = ttAttendanceCentralStatus(group, dayKey);
    const plan = ttAttendanceCentralPlanForDay(group, dayKey, session);
    const lesson = plan?.lessons?.[0] || {};
    const attendance = session?.attendance || appState.attendanceRecords?.[group.id]?.[dayKey] || {};
    const present = Object.entries(attendance).filter(([, value]) => value === true).map(([name]) => name);
    const absent = Object.entries(attendance).filter(([, value]) => value === false).map(([name]) => name);
    const page = lesson.wordlistPageNumber || lesson.wordlistPage || "";
    return `<article class="ac-day-card ${status}"><header><div><span>${escapeHtml(group.time || "Time not set")}</span><h3>${escapeHtml(group.name || "Group")}</h3></div><b>${status === "confirmed" ? "Attendance confirmed" : status === "no-session" ? "No session" : status === "review" ? "Needs review" : "Not recorded"}</b></header>
      <div class="ac-day-facts"><p><strong>Lesson</strong>${plan ? `Lesson ${escapeHtml(ttPlanLessonNumber(plan, lesson, group))} · ${escapeHtml(lesson.substep || plan.substep || "")}${page ? ` · chart p. ${escapeHtml(page)}` : ""}` : "No lesson linked"}</p><p><strong>Present</strong>${escapeHtml(present.join(", ") || "—")}</p><p><strong>Absent</strong>${escapeHtml(absent.join(", ") || "—")}</p></div>
      ${ttAttendanceCentralPerformanceHtml(group, plan, dayKey)}${session?.note ? `<p class="ac-day-note"><strong>Group-day note:</strong> ${escapeHtml(session.note)}</p>` : ""}
      <footer><button type="button" data-ac-attendance="${escapeHtml(group.id)}" data-ac-date="${dayKey}">${session ? "Edit attendance / note" : "Add attendance / note"}</button>${plan ? `<button type="button" data-ac-plan="${escapeHtml(plan.id)}" data-ac-group="${escapeHtml(group.id)}">Open lesson</button>${String(plan.status || "").toLowerCase().includes("complete") ? `<button type="button" data-ac-pdf="${escapeHtml(plan.id)}" data-ac-group="${escapeHtml(group.id)}">Open completed PDF</button>` : ""}` : ""}<button type="button" data-edit-group="${escapeHtml(group.id)}">Edit group time</button></footer></article>`;
  }).join("");
  return `<div class="ac-day-heading"><h2>${escapeHtml(ttLongLessonDate(dayKey))}</h2><p>Lesson and student evidence below is view-only.</p></div><div class="ac-day-list">${cards || "<p>No groups are assigned to this school year.</p>"}</div>`;
}

async function ttAttendanceCentralOpenPdf(groupId, planId) {
  try {
    const group = (appState.groups || []).find((item) => item.id === groupId);
    const plan = (group?.history || []).find((item) => item.id === planId);
    const lesson = plan?.lessons?.[0];
    if (!group || !plan || !lesson) throw new Error("The completed lesson could not be found.");
    const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
    const savedDate = new Date(plan.completedAt || plan.savedAt || lesson.scheduledDate || Date.now());
    const bytes = await ttBuildWilsonLessonPlanPdf(group, skill, lesson, plan, savedDate, { fillable: true });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    ttOpenExportViewer({ url, title: `${group.name} — Completed Lesson PDF`, filename: `${ttLessonExportBaseName(group, lesson, plan, savedDate)} - Completed.pdf`, contentType: "pdf", bytes, archiveDownload: false });
  } catch (error) { alert(error.message || error); }
}

function ttShowAttendanceCentral() {
  const home = ttById("ttHomeScreen"), flow = document.querySelector(".teach-flow"), central = ttById("ttAttendanceCentral");
  if (home) home.hidden = true;
  if (flow) flow.hidden = true;
  if (central) central.hidden = false;
  document.body.classList.add("home-mode", "attendance-central-mode");
  ttAttendanceCentralDate = new Date();
  ttRenderAttendanceCentral();
  window.scrollTo(0, 0);
}

function ttCloseAttendanceCentral() {
  const central = ttById("ttAttendanceCentral");
  if (central) central.hidden = true;
  document.body.classList.remove("attendance-central-mode");
  ttShowHomeScreen();
}

function ttRenderAttendanceCentral() {
  const central = ttById("ttAttendanceCentral"), content = ttById("ttAttendanceCentralContent"), yearSelect = ttById("ttAttendanceCentralYear");
  if (!central || central.hidden || !content || !yearSelect) return;
  const years = (appState.schoolYears || []).slice().sort((a, b) => b.id.localeCompare(a.id));
  const selected = years.some((year) => year.id === yearSelect.value) ? yearSelect.value : appState.activeSchoolYearId || currentSchoolYearId();
  yearSelect.innerHTML = years.map((year) => `<option value="${escapeHtml(year.id)}">${escapeHtml(year.label || year.id)}${year.id === appState.activeSchoolYearId ? " (Current)" : ""}</option>`).join("");
  yearSelect.value = selected;
  const groups = ttAttendanceCentralGroups(selected);
  central.querySelectorAll("[data-ac-view]").forEach((button) => button.classList.toggle("active", button.dataset.acView === ttAttendanceCentralView));
  const period = ttById("ttAttendanceCentralPeriod");
  if (ttAttendanceCentralView === "year") {
    const bounds = ttAttendanceCentralYearBounds(selected);
    if (period) period.textContent = selected;
    content.innerHTML = `<div class="ac-year-grid">${Array.from({ length: 12 }, (_, index) => ttAttendanceCentralMonthHtml(new Date(bounds.start.getFullYear(), bounds.start.getMonth() + index, 1), groups, true)).join("")}</div>`;
  } else if (ttAttendanceCentralView === "month") {
    if (period) period.textContent = ttAttendanceCentralDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    content.innerHTML = ttAttendanceCentralMonthHtml(ttAttendanceCentralDate, groups);
  } else {
    if (period) period.textContent = ttLongLessonDate(dateKey(ttAttendanceCentralDate));
    content.innerHTML = ttAttendanceCentralDayHtml(ttAttendanceCentralDate, groups);
  }
}

function ttBindAttendanceCentral() {
  ttById("ttHomeAttendanceCentral")?.addEventListener("click", ttShowAttendanceCentral);
  ttById("ttAttendanceCentralBack")?.addEventListener("click", ttCloseAttendanceCentral);
  ttById("ttAttendanceCentralYear")?.addEventListener("change", ttRenderAttendanceCentral);
  const central = ttById("ttAttendanceCentral");
  central?.addEventListener("click", (event) => {
    const view = event.target.closest("[data-ac-view]");
    if (view) { ttAttendanceCentralView = view.dataset.acView; ttRenderAttendanceCentral(); return; }
    const day = event.target.closest("[data-ac-day]");
    if (day) { ttAttendanceCentralDate = ttDateFromKey(day.dataset.acDay); ttAttendanceCentralView = "day"; ttRenderAttendanceCentral(); return; }
    const month = event.target.closest("[data-ac-month]");
    if (month) { ttAttendanceCentralDate = ttDateFromKey(`${month.dataset.acMonth}-01`); ttAttendanceCentralView = "month"; ttRenderAttendanceCentral(); return; }
    if (event.target.closest("[data-ac-today]")) { ttAttendanceCentralDate = new Date(); ttRenderAttendanceCentral(); return; }
    const move = event.target.closest("[data-ac-move]");
    if (move) { const amount = Number(move.dataset.acMove); if (ttAttendanceCentralView === "day") ttAttendanceCentralDate.setDate(ttAttendanceCentralDate.getDate() + amount); else ttAttendanceCentralDate.setMonth(ttAttendanceCentralDate.getMonth() + amount); ttRenderAttendanceCentral(); return; }
    const attendance = event.target.closest("[data-ac-attendance]");
    if (attendance) { ttOpenAttendanceSessionModal(attendance.dataset.acDate, { groupId: attendance.dataset.acAttendance, history: true }); return; }
    const plan = event.target.closest("[data-ac-plan]");
    if (plan) { ttOpenPlanInApp(plan.dataset.acPlan, plan.dataset.acGroup); ttOpenTeachFlow({ transition: false }); return; }
    const pdf = event.target.closest("[data-ac-pdf]");
    if (pdf) { ttAttendanceCentralOpenPdf(pdf.dataset.acGroup, pdf.dataset.acPdf); return; }
    const edit = event.target.closest("[data-edit-group]");
    if (edit) ttOpenEditGroupModal(edit.dataset.editGroup);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ttBindAttendanceCentral);
else ttBindAttendanceCentral();

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

function ttSharedDataButtonIds(panelType) {
  return panelType === "saved"
    ? ["ttSavedToggle", "ttHomeSavedToggle"]
    : ["ttDataToggle", "ttHomeDataToggle"];
}

function ttSetSharedDataButtonState(panelType, open) {
  ttSharedDataButtonIds(panelType).forEach((buttonId) => {
    const button = ttById(buttonId);
    button?.classList.toggle("active", open);
    button?.setAttribute("aria-expanded", String(open));
  });
}

function ttMountSharedDataPanels(hostId) {
  const host = ttById(hostId);
  if (!host) return;
  ["ttSavedPanel", "ttDataPanel"].forEach((panelId) => {
    const panel = ttById(panelId);
    if (panel && panel.parentElement !== host) host.appendChild(panel);
  });
}

function ttCloseSharedDataPanels() {
  const savedPanel = ttById("ttSavedPanel");
  const dataPanel = ttById("ttDataPanel");
  if (savedPanel) savedPanel.hidden = true;
  if (dataPanel) dataPanel.hidden = true;
  ttSetSharedDataButtonState("saved", false);
  ttSetSharedDataButtonState("data", false);
}

function ttToggleSharedDataPanel(panelType, hostId) {
  ttMountSharedDataPanels(hostId);
  const isSaved = panelType === "saved";
  const panel = ttById(isSaved ? "ttSavedPanel" : "ttDataPanel");
  const otherPanel = ttById(isSaved ? "ttDataPanel" : "ttSavedPanel");
  if (!panel) return;
  const isOpen = !panel.hidden;
  if (otherPanel) otherPanel.hidden = true;
  ttSetSharedDataButtonState(isSaved ? "data" : "saved", false);
  ttCloseSmallDropdownMenus();
  panel.hidden = isOpen;
  ttSetSharedDataButtonState(panelType, !isOpen);
  if (panel.hidden) return;
  if (isSaved) ttRenderSavedLessons(ttActiveGroup());
  else {
    ttRenderDataCenter();
    ttLoadFirebaseTimeline();
  }
}

function ttToggleSmallDropdown(trigger, options = {}) {
  const button = ttById(trigger);
  const menu = ttDropdownMenuForButton(button);
  if (!button || !menu) return;
  const isOpen = !menu.hidden;
  ttCloseSharedDataPanels();
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

function ttCloseCombineGroupsModal() {
  ttById("ttCombineGroupsModal")?.remove();
}

function ttSyncCombinationPlansForDate(group, dayKey, { attachHistorical = false } = {}) {
  const matchesDate = (plan) => [
    plan.dailyKey,
    plan.scheduledDate,
    plan.lessons?.[0]?.scheduledDate,
    ...Object.values(plan.sessions || {}).map((session) => session?.date)
  ].filter(Boolean).some((value) => dateKey(value) === dayKey);
  ttOfficialLessonPlans(group).filter(matchesDate).forEach((plan) => {
    if (plan.rosterSnapshotLocked) return;
    const hasHistoricalData = Boolean(plan.hasStudentData || ["Taught", "Complete"].includes(plan.status));
    if (hasHistoricalData && !attachHistorical) return;
    ttSyncCombinedLessonLinks(plan, group);
  });
}

function ttOpenCombineGroupsModal(groupId) {
  const group = (appState.groups || []).find((item) => item.id === groupId);
  if (!group || group.schoolYearId !== appState.activeSchoolYearId) return;
  ttCloseCombineGroupsModal();
  const draftDate = ttPlannerDraft?.groupId === group.id ? ttPlannerDraft.scheduledDate : "";
  const scheduledDate = dateKey(draftDate || ttTodayKey());
  const available = (appState.groups || []).filter((item) => item.id !== group.id && item.schoolYearId === group.schoolYearId && item.status !== "archived");
  const current = ttCombinationFor(group, scheduledDate);
  const overlay = document.createElement("div");
  overlay.id = "ttCombineGroupsModal";
  overlay.className = "combine-groups-overlay";
  overlay.innerHTML = `<div class="combine-groups-backdrop" data-combine-close></div>
    <section class="combine-groups-card" role="dialog" aria-modal="true" aria-labelledby="ttCombineGroupsTitle">
      <button type="button" class="combine-groups-close" data-combine-close aria-label="Close">×</button>
      <header><span>TEMPORARY ROSTER</span><h2 id="ttCombineGroupsTitle">Combine groups for one session</h2>
        <p>${escapeHtml(group.name)} stays the host group. The other groups and every student keep their permanent assignment.</p></header>
      <label class="combine-groups-date">Session date<input id="ttCombineGroupsDate" type="date" value="${escapeHtml(scheduledDate)}"></label>
      <fieldset><legend>Groups joining ${escapeHtml(group.name)}</legend>
        ${available.map((item) => `<label><input type="checkbox" value="${escapeHtml(item.id)}" ${(current?.sourceGroupIds || []).includes(item.id) ? "checked" : ""}><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml((item.students || []).join(", ") || "No students")}</small></span></label>`).join("") || "<p>No other current groups are available.</p>"}
      </fieldset>
      <div class="combine-groups-safety"><strong>No permanent roster changes</strong><span>The saved lesson and attendance will be linked to every selected group by permanent student ID. Past and future assignments remain intact.</span></div>
      <footer><button type="button" data-combine-clear>Clear this date</button><button type="button" class="combine-groups-save" data-combine-save>Use combined roster</button></footer>
    </section>`;
  document.body.appendChild(overlay);
  const reopenForDate = () => {
    const nextDate = overlay.querySelector("#ttCombineGroupsDate")?.value || scheduledDate;
    const priorSelection = group.temporaryCombinations?.[nextDate];
    overlay.querySelectorAll('fieldset input[type="checkbox"]').forEach((input) => {
      input.checked = (priorSelection?.sourceGroupIds || []).includes(input.value);
    });
  };
  overlay.querySelector("#ttCombineGroupsDate")?.addEventListener("change", reopenForDate);
  overlay.querySelectorAll("[data-combine-close]").forEach((button) => button.addEventListener("click", ttCloseCombineGroupsModal));
  overlay.querySelector("[data-combine-clear]")?.addEventListener("click", () => {
    const dayKey = overlay.querySelector("#ttCombineGroupsDate")?.value || scheduledDate;
    if (group.temporaryCombinations) delete group.temporaryCombinations[dayKey];
    ttSyncCombinationPlansForDate(group, dayKey);
    saveState();
    ttCloseCombineGroupsModal();
    ttRenderHomeScreen();
  });
  overlay.querySelector("[data-combine-save]")?.addEventListener("click", () => {
    const dayKey = overlay.querySelector("#ttCombineGroupsDate")?.value || scheduledDate;
    const sourceGroupIds = [...overlay.querySelectorAll('fieldset input[type="checkbox"]:checked')].map((input) => input.value);
    group.temporaryCombinations ||= {};
    if (sourceGroupIds.length) {
      group.temporaryCombinations[dayKey] = {
        id: `combination-${group.id}-${dayKey}`,
        date: dayKey,
        sourceGroupIds,
        createdAt: group.temporaryCombinations[dayKey]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      delete group.temporaryCombinations[dayKey];
    }
    ttSyncCombinationPlansForDate(group, dayKey, { attachHistorical: sourceGroupIds.length > 0 });
    if (ttPlannerDraft?.groupId === group.id) ttPlannerDraft.scheduledDate = dayKey;
    saveState();
    ttCloseCombineGroupsModal();
    ttRenderHomeScreen();
  });
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
  const attendanceCentral = ttById("ttAttendanceCentral");
  if (home) home.hidden = false;
  if (flow) flow.hidden = true;
  if (attendanceCentral) attendanceCentral.hidden = true;
  if (ttById("ttLessonIdentity")) ttById("ttLessonIdentity").hidden = true;
  document.body.classList.remove("attendance-central-mode");
  document.body.classList.add("home-mode");
  ttCloseSharedDataPanels();
  ttMountSharedDataPanels("ttHomeDataPanels");
  ttRenderHomeScreen();
  ttRestoreHomeScroll(groupId);
  // Returning Home is the classroom lesson-exit checkpoint. The action state
  // is already durable locally; now create the independent verified Files copy.
  ttQueueStageNativeBackup({ immediate: true }).catch((error) => {
    ttSetIndependentBackupStatus(`iPad backup needs attention. ${error.message}`, { notify: true });
  });
}

function ttResetHomeContinuityTransientUi() {
  const continuity = ttById("ttHomeContinuity");
  if (!continuity) return;
  const confirmation = continuity.querySelector("[data-continuity-confirm]");
  const status = continuity.querySelector("[data-continuity-status]");
  if (confirmation) confirmation.hidden = true;
  if (status) {
    status.textContent = "";
    status.classList.remove("is-error");
  }
}

function ttRefreshHomeAfterPageRestore(event) {
  if (!event?.persisted || !document.body.classList.contains("home-mode")) return;
  const requestedGroupId = ttPlannerGroupId;
  appState = loadState();
  const groupId = (appState.groups || []).some((group) => group.id === requestedGroupId)
    ? requestedGroupId
    : appState.selectedGroupId || appState.groups?.[0]?.id || "";
  ttPlannerGroupId = groupId;
  ttPlannerDraft = {};
  ttResetHomeContinuityTransientUi();
  ttShowHomeScreen(groupId);
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
  const students = ttTeachingStudents(group, lesson?.scheduledDate).filter(Boolean);
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
    if (ttById("ttAttendanceCentral")) ttById("ttAttendanceCentral").hidden = true;
    document.body.classList.remove("attendance-central-mode");
    document.body.classList.remove("home-mode", "lesson-home-exit");
    ttCloseSharedDataPanels();
    ttMountSharedDataPanels("ttLessonDataPanels");
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
  ttUpdateHomeFirebaseStatus();
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
        ttPlannerEditingPlanId = "";
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
    list.querySelectorAll("[data-combine-group]").forEach((button) => {
      button.addEventListener("click", () => ttOpenCombineGroupsModal(button.dataset.combineGroup));
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
  ttUpdateAttendanceReminder();
}

function ttRenderHomeContinuity(enabled = true) {
  const container = ttById("ttHomeContinuity");
  const group = ttPlannerGroup();
  if (!container) return;
  container.hidden = !enabled || !group;
  if (container.hidden) return;
  const openPlan = ttActiveOpenPlan(group);
  if (!openPlan) {
    container.hidden = true;
    return;
  }
  const lesson = openPlan.lessons[0];
  const day = ttPlanSessionDay(openPlan, lesson);
  const summary = ttCompletedSectionSummary(lesson);
  const sessionDate = openPlan.sessions?.[day]?.date || openPlan.scheduledDate;
  const canContinueDay2 = ["group", "part1", "part2"].includes(lesson.lessonType) && day === "1" && !openPlan.sessions?.["2"];
  const plannedDay2Date = openPlan.plannedDay2Date || ttNextInstructionDateKey(openPlan.sessions?.["1"]?.date || sessionDate);
  const nextPlanDate = ttNextPlanningDateKey(openPlan.sessions?.[day]?.date || sessionDate);
  const nextPlanNumber = Number(ttPlanLessonNumber(openPlan, lesson, group)) + 1;
  container.innerHTML = `<div class="continuity-copy"><span>Current lesson</span>
      <strong>${escapeHtml(group.name)} · Lesson ${escapeHtml(ttPlanLessonNumber(openPlan, lesson, group))} · Substep ${escapeHtml(lesson.substep || group.substep || "--")}</strong>
      <small>${escapeHtml(ttLongLessonDate(sessionDate))} · Reader ${escapeHtml(lesson.reader || "--")}, wordlist p. ${escapeHtml(lesson.wordlistPageNumber || "--")}${summary.done.length ? ` · Finished sections: ${escapeHtml(summary.done.join(", "))}` : ""}${summary.skipped.length ? ` · Skipped: ${escapeHtml(summary.skipped.join(", "))}` : ""}</small></div>
    <div class="continuity-actions">
      <label>Day ${escapeHtml(day)} date<input type="date" value="${escapeHtml(sessionDate || ttTodayKey())}" data-continuity-session-date></label>
      <button class="continuity-primary" type="button" data-continuity="resume">Continue Lesson</button>
      <button class="continuity-edit" type="button" data-continuity="edit">Edit Lesson Plan</button>
      <button type="button" data-continuity="new">Close as incomplete &amp; plan new</button>
      ${canContinueDay2 ? `<details class="continuity-more"><summary>Day 1 options</summary><div><label>Day 2 date<input type="date" value="${escapeHtml(plannedDay2Date)}" data-continuity-date></label><button type="button" data-continuity="day2">Start Day 2</button><button type="button" data-continuity="complete-day1">Finish Lesson As Is</button></div></details>` : ""}
      <div class="continuity-inline-confirm" data-continuity-confirm hidden>
        <div><strong>Close Lesson ${escapeHtml(ttPlanLessonNumber(openPlan, lesson, group))} as incomplete?</strong><span>Its saved work stays preserved. The planner will prepare Lesson ${escapeHtml(nextPlanNumber)} for ${escapeHtml(ttLongLessonDate(nextPlanDate))}.</span></div>
        <button type="button" data-continuity-cancel-close>Keep lesson open</button>
        <button type="button" class="continuity-confirm-close" data-continuity-confirm-close>Close lesson &amp; show planner</button>
      </div>
      <p class="continuity-action-status" data-continuity-status aria-live="polite"></p>
    </div>`;
  const showActionStatus = (message, isError = false) => {
    const actionStatus = container.querySelector("[data-continuity-status]");
    if (!actionStatus) return;
    actionStatus.textContent = message;
    actionStatus.classList.toggle("is-error", isError);
  };
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
    if (heading) heading.textContent = `${group.name} · Lesson ${ttPlanLessonNumber(openPlan, lesson, group)} · Substep ${lesson.substep || group.substep || "--"}`;
    const details = container.querySelector(".continuity-copy small");
    if (details) details.textContent = `${ttLongLessonDate(date)} · Reader ${lesson.reader || "--"}, wordlist p. ${lesson.wordlistPageNumber || "--"}${summary.done.length ? ` · Finished sections: ${summary.done.join(", ")}` : ""}${summary.skipped.length ? ` · Skipped: ${summary.skipped.join(", ")}` : ""}`;
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
    showActionStatus("Opening the saved lesson…");
    try {
      const resumed = ttResumeOpenPlanFromHome(group.id, openPlan.id, container.querySelector("[data-continuity-session-date]")?.value || sessionDate);
      if (!resumed) showActionStatus("This lesson could not be reopened. Its saved work remains preserved.", true);
    } catch (error) {
      console.error("Teach Today could not resume the selected lesson:", error);
      showActionStatus("This lesson could not be reopened. Its saved work remains preserved.", true);
    }
  });
  container.querySelector('[data-continuity="edit"]')?.addEventListener("click", () => {
    if (!ttBeginEditingOpenPlan(group.id, openPlan.id)) {
      showActionStatus("This lesson plan could not be opened for editing. Its saved version remains unchanged.", true);
    }
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
    ttSyncCombinedLessonLinks(openPlan, group);
    saveState();
    ttRenderHomeScreen();
  });
  container.querySelector('[data-continuity="new"]')?.addEventListener("click", () => {
    const inlineConfirm = container.querySelector("[data-continuity-confirm]");
    if (inlineConfirm) inlineConfirm.hidden = false;
  });
  container.querySelector("[data-continuity-cancel-close]")?.addEventListener("click", () => {
    const inlineConfirm = container.querySelector("[data-continuity-confirm]");
    if (inlineConfirm) inlineConfirm.hidden = true;
    showActionStatus("");
  });
  container.querySelector("[data-continuity-confirm-close]")?.addEventListener("click", () => {
    showActionStatus("Closing only this lesson and preserving its saved work…");
    try {
      const closed = ttCloseOpenPlanFromHome(group.id, openPlan.id, nextPlanDate);
      if (!closed) {
        showActionStatus("This lesson was already closed or could not be found. Its saved work remains preserved.", true);
        return;
      }
      ttRenderHomeScreen();
    } catch (error) {
      console.error("Teach Today could not close the selected lesson:", error);
      showActionStatus("This lesson could not be closed. Its saved work remains preserved.", true);
    }
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
  return (group?.history || []).filter((plan) => ["TeachToday", "CombinedSession"].includes(plan.source) && plan.lessons?.[0] && !plan.excludedFromLessonSequence && plan.status !== "Test");
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
    return `<option value="${escapeHtml(plan.id)}">Lesson ${escapeHtml(ttPlanLessonNumber(plan, lesson, group))} · ${plan.combinedParticipation ? `Combined with ${escapeHtml(plan.hostGroupNameAtTime || "another group")} · ` : ""}${escapeHtml(plan.status || "Saved")} · ${escapeHtml(ttLongLessonDate(date))}</option>`;
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
    const selectedId = container.querySelector("select")?.value || "";
    const selectedPlan = plans.find((plan) => plan.id === selectedId);
    if (selectedPlan?.combinedParticipation) {
      alert(`This lesson is linked from ${selectedPlan.hostGroupNameAtTime || "the host group"}. Open the host lesson to make a correction without creating two versions.`);
      return;
    }
    ttLessonHistoryEditPlanId = selectedId;
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
  const lastPlan = recentHistory.find((plan) => ["TeachToday", "CombinedSession"].includes(plan.source) && plan.lessons?.[0] && !plan.excludedFromLessonSequence)
    || recentHistory.find((plan) => !plan.excludedFromLessonSequence);
  const lastLesson = lastPlan?.lessons?.[0];
  const records = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id || record.group === group.name)
    .sort((a, b) => new Date(b.date || b.displayDate || 0) - new Date(a.date || a.displayDate || 0));
  const lastRecord = records[0];
  const students = (group.students || []).join(", ");
  const todayCombination = group.temporaryCombinations?.[ttTodayKey()];
  const combinedNames = (todayCombination?.sourceGroupIds || []).map((groupId) => (appState.groups || []).find((item) => item.id === groupId)?.name).filter(Boolean);
  const active = group.id === ttPlannerGroupId ? " active" : "";
  const lastText = lastLesson
    ? `${lastLesson.substep} / Reader ${lastLesson.reader}, p. ${lastLesson.wordlistPageNumber || "--"}`
    : `${group.substep || "--"} / no saved lesson yet`;
  const chartText = lastRecord
    ? `${ttStudentDisplayName(lastRecord.studentId, lastRecord.student)}: ${lastRecord.correct ?? "--"}/${lastRecord.total || 15}${lastRecord.seconds ? ` in ${lastRecord.seconds}s` : ""}`
    : "No charting saved";
  const preferredType = ttPlannerFormatLabel(ttPreferredLessonType(group));
  return `<div class="home-group-card-shell" style="--group-color: ${color};">
    <button type="button" class="home-group-card${active}" data-home-group="${escapeHtml(group.id)}" aria-pressed="${group.id === ttPlannerGroupId ? "true" : "false"}">
      <span>${escapeHtml(group.time || "Group")}</span>
      <strong>${escapeHtml(group.name || "Unnamed group")}</strong>
      ${ttSubstepProgressBar(group)}
      <em>${escapeHtml(students || "No students yet")}</em>
      ${combinedNames.length ? `<small class="home-group-combined">Today: combined with ${escapeHtml(combinedNames.join(", "))}</small>` : ""}
      <small>Last lesson: ${escapeHtml(lastText)}</small>
      <small>Last chart: ${escapeHtml(chartText)}</small>
      <small class="home-group-preference">Preferred: ${escapeHtml(preferredType)}</small>
    </button>
    ${editable ? `<div class="home-group-card-actions"><button type="button" class="home-group-combine" data-combine-group="${escapeHtml(group.id)}" aria-label="Combine ${escapeHtml(group.name || "group")} for one session" title="Combine groups for one session">Combine</button><button type="button" class="home-group-edit" data-edit-group="${escapeHtml(group.id)}" aria-label="Edit ${escapeHtml(group.name || "group")}" title="Edit group">Edit</button></div>` : ""}
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
  container.hidden = !enabled || !group || Boolean(ttActiveOpenPlan(group));
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

function ttEnhancedPlanning() {
  return window.TeachTodayEnhancedPlanning || null;
}

function ttRecommendedSentenceSelection(skill, level, wordlistPage, fallbackPage = "") {
  const enhanced = ttEnhancedPlanning();
  const recommendation = enhanced?.findSentenceRecommendation?.(skill?.id, level, wordlistPage) || null;
  const availablePages = skill ? pageList(skill, "sentences", level || "AB") : [];
  const recommendedPage = Number(recommendation?.p || 0);
  const usableRecommendation = recommendedPage && availablePages.includes(recommendedPage) ? recommendation : null;
  return {
    page: usableRecommendation?.p || fallbackPage || "",
    level: usableRecommendation?.l || level || "AB",
    recommendation: usableRecommendation,
    mode: usableRecommendation?.p ? "enhanced-chart-page" : "ordered-fallback"
  };
}

function ttResetPlannerPageSelections(group, skill, level) {
  const wordlistPage = pageAssignment(group, skill, "wordlist", 0, level).page || "";
  const fallbackSentence = pageAssignment(group, skill, "sentences", 0, level).page || "";
  const sentence = ttRecommendedSentenceSelection(skill, level, wordlistPage, fallbackSentence);
  ttPlannerDraft.wordlist = wordlistPage;
  ttPlannerDraft.sentence = sentence.page;
  ttPlannerDraft.sentenceSelectionMode = sentence.mode;
  ttPlannerDraft.sentenceRecommendation = sentence.recommendation || null;
}

function ttSyncRecommendedSentenceForWordlist(group, skill) {
  const level = ttPlannerDraft.level || group.readerLevel || "AB";
  const fallbackSentence = pageAssignment(group, skill, "sentences", 0, level).page || "";
  const sentence = ttRecommendedSentenceSelection(skill, level, ttPlannerDraft.wordlist, fallbackSentence);
  ttPlannerDraft.sentence = sentence.page;
  ttPlannerDraft.sentenceSelectionMode = sentence.mode;
  ttPlannerDraft.sentenceRecommendation = sentence.recommendation || null;
}

function ttEnsurePlannerDraft(group) {
  if (!group) return {};
  if (ttPlannerDraft.groupId === group.id) return ttPlannerDraft;
  const skill = scopeMap.find((item) => item.id === group.substep) || activeStep(group);
  const level = group.readerLevel || "AB";
  const wordlistPage = pageAssignment(group, skill, "wordlist", 0, level).page || "";
  const fallbackSentence = pageAssignment(group, skill, "sentences", 0, level).page || "";
  const sentenceSelection = ttRecommendedSentenceSelection(skill, level, wordlistPage, fallbackSentence);
  ttPlannerDraft = {
    groupId: group.id,
    substep: skill.id,
    level,
    wordlist: wordlistPage,
    sentence: sentenceSelection.page,
    sentenceSelectionMode: sentenceSelection.mode,
    sentenceRecommendation: sentenceSelection.recommendation || null,
    planningIndexVersion: window.teachTodayEnhancedPlanningIndex?.schemaVersion || "legacy-index",
    passageId: ttDefaultPassageFor(group, skill)?.id || "",
    passageApproach: group.section9Story?.approach || "comprehension-sos",
    reviewSubsteps: [priorSubstep(skill.id)],
    lessonType: ttPreferredLessonType(group),
    scheduledDate: ttTodayKey(),
    flashSections: ["1", "2", "3", "5"]
  };
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttReviewWordFilters = {};
  ttSection8RealSlots = [];
  ttSection8SoundElementsManual = false;
  ttSectionReviewSubsteps = ttDefaultSectionReviewSubsteps(skill, level);
  return ttPlannerDraft;
}

function ttBeginEditingOpenPlan(groupId, planId) {
  const current = ttContinuityPlan(groupId, planId);
  if (!current) return false;
  const { group, plan, lesson } = current;
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  const level = lesson.readerLevel || group.readerLevel || "AB";
  const planning = lesson.planningSelections || {};
  const dictation = lesson.dictationPlanOverride || [];
  const dictationValues = (label) => (dictation.find((block) => String(block.label || "").toLowerCase().includes(label))?.values || []).slice();
  const reverse = planning.section6 || lesson.reverseDrillOverride || [];
  const reverseValues = (groupLabel) => reverse
    .filter((item) => String(item.group || "").toLowerCase().includes(groupLabel))
    .map((item) => item.value)
    .filter(Boolean);
  const scheduledDate = plan.sessions?.[ttPlanSessionDay(plan, lesson)]?.date
    || lesson.scheduledDate
    || plan.scheduledDate
    || ttTodayKey();

  ttPlannerGroupId = group.id;
  appState.selectedGroupId = group.id;
  ttPlannerEditingPlanId = plan.id;
  ttPlannerDraft = {
    groupId: group.id,
    editingPlanId: plan.id,
    substep: lesson.substep || group.substep,
    level,
    wordlist: lesson.wordlistPageNumber || "",
    sentence: lesson.sentencePageNumber || "",
    sentenceSelectionMode: lesson.planningAnchor?.sentenceSelectionMode || "saved-plan",
    planningIndexVersion: lesson.planningIndexVersion || window.teachTodayEnhancedPlanningIndex?.schemaVersion || "legacy-index",
    passageId: lesson.section9Story?.passageId || lesson.section9Story?.id || "",
    passageApproach: lesson.section9Story?.approach || "comprehension-sos",
    reviewSubsteps: [priorSubstep(lesson.substep || group.substep)],
    lessonType: ttNormalizeLessonType(lesson.lessonType || "full"),
    scheduledDate,
    flashSections: (lesson.flashSections || ["1", "2", "3", "5"]).slice()
  };
  ttPickerSelections = {
    section2Review: (planning.section2?.review || lesson.sectionTwoReviewWords || []).slice(),
    section2Current: (planning.section2?.current || lesson.sectionTwoCurrentWords || []).slice(),
    section2ReviewB2: (planning.section2?.reviewDay2 || lesson.sectionTwoReviewWordsB2 || []).slice(),
    section2CurrentB2: (planning.section2?.currentDay2 || lesson.sectionTwoCurrentWordsB2 || []).slice(),
    section3Review: (planning.section3?.review || lesson.sectionThreeReviewWords || []).slice(),
    section3Current: (planning.section3?.current || lesson.sectionThreeCurrentWords || []).slice(),
    section6Vowels: reverseValues("sounds"),
    section6Consonants: reverseValues("consonants"),
    section6Welded: reverseValues("welded"),
    section6Elements: reverseValues("pfx"),
    section7Review: (planning.section7?.review || lesson.sectionSevenReviewWords || []).slice(),
    section7Current: (planning.section7?.current || lesson.sectionSevenCurrentWords || []).slice(),
    section7Nonsense: (planning.section7?.nonsense || lesson.sectionSevenNonsenseWords || []).slice(),
    section7Hfw: (planning.section7?.highFrequency || lesson.sectionSevenHighFrequencyWords || []).slice(),
    dictationSounds: dictationValues("sounds"),
    dictationElements: dictationValues("word elements"),
    dictationReal: dictationValues("real words"),
    dictationNonsense: dictationValues("nonsense"),
    dictationPhrases: dictationValues("phrases"),
    dictationSentences: dictationValues("sentences")
  };
  ttPickerSubstepCache = {};
  ttReviewWordFilters = {};
  ttSection8RealSlots = ttPickerSelections.dictationReal.slice(0, 5).map((word, index) => ({
    substep: index < 3 ? priorSubstep(skill.id) : skill.id,
    word
  }));
  ttSection8SoundElementsManual = true;
  ttSectionReviewSubsteps = {
    ...ttDefaultSectionReviewSubsteps(skill, level),
    section3: [planning.section3?.reviewSubstep || lesson.sectionThreeReviewSubstep || priorSubstep(skill.id)],
    section3Current: [planning.section3?.currentSubstep || lesson.sectionThreeCurrentSubstep || skill.id]
  };
  ttAssistantNotice = `Editing Lesson ${ttPlanLessonNumber(plan, lesson, group)}. Saving updates this lesson only.`;
  ttRenderHomeScreen();
  requestAnimationFrame(() => ttById("ttQuickPlanner")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  return true;
}

function ttRandomSection3ReviewSubstep(skill, level = "AB") {
  const currentIndex = scopeMap.findIndex((item) => item.id === skill?.id);
  if (currentIndex <= 0) return skill?.id || scopeMap[0]?.id || "1.1";
  const candidates = scopeMap.slice(0, currentIndex)
    .map((item) => item.id)
    .filter((substep) => readerWordsFromSubstep(substep, level).length || readerNonsenseWordsFromSubstep(substep).length);
  return candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : priorSubstep(skill.id);
}

function ttDefaultSectionReviewSubsteps(skill, level = "AB") {
  const priorStep = priorSubstep(skill.id);
  return {
    section2: [priorStep],
    section2B: [priorStep],
    section3: [ttRandomSection3ReviewSubstep(skill, level)],
    section3Current: [skill.id],
    section7: [priorStep],
    section8Real: [skill.id]
  };
}

function ttRenderPlannerPanel() {
  const panel = ttById("ttQuickPlanner");
  if (!panel) return;
  const group = ttPlannerGroup();
  const openPlan = group ? ttActiveOpenPlan(group) : null;
  const editingOpenPlan = Boolean(openPlan && ttPlannerEditingPlanId === openPlan.id && ttPlannerDraft.editingPlanId === openPlan.id);
  panel.hidden = !group || Boolean(openPlan);
  if (editingOpenPlan) panel.hidden = false;
  if (!editingOpenPlan) {
    if (!group || openPlan) return;
  }
  const draft = ttEnsurePlannerDraft(group);
  const skill = scopeMap.find((item) => item.id === draft.substep) || activeStep(group);
  const level = draft.level || group.readerLevel || "AB";
  ttById("ttPlannerTitle").textContent = editingOpenPlan
    ? `${group.name || "Group"} · Edit Lesson ${ttPlanLessonNumber(openPlan, openPlan.lessons?.[0], group)}`
    : group.name || "Lesson builder";
  const plannerEyebrow = panel.querySelector(".planner-head .eyebrow");
  if (plannerEyebrow) plannerEyebrow.textContent = editingOpenPlan ? "Edit Current Lesson" : "Plan New Lesson";
  const customizeTitle = panel.querySelector(".planner-customize-heading strong");
  if (customizeTitle) customizeTitle.textContent = editingOpenPlan ? "Review or change the saved lesson" : "Review or customize before teaching";
  ttById("ttPlannerLastLesson").textContent = ttPlannerLastLessonText(group);
  ttFillPlannerCoreSelects(group, skill, level);
  ttRenderModePicker();
  const lesson = ttPlannerPreviewLesson(group);
  ttById("ttPlannerSections").innerHTML = ttPlannerSectionsHtml(group, skill, lesson);
  ttBindPlannerChips();
  ttRenderPlannerPreview(group, skill, lesson);
  ttRenderLessonAssistant(group, skill, lesson);
  ttRenderPlannerCustomizeState();
  const resetButton = ttById("ttPlannerUseDefaults");
  if (resetButton) resetButton.textContent = editingOpenPlan ? "Reset to Saved Plan" : "Reset to Best Plan";
  const reteachButton = ttById("ttPlannerDuplicatePrevious");
  if (reteachButton) {
    const unavailable = !ttPreviousTeachPlan(group);
    reteachButton.hidden = unavailable;
    reteachButton.closest(".assistant-reteach-action").hidden = unavailable;
  }
  ttUpdateHomeReferenceLinks();
}

function ttRenderPlannerCustomizeState() {
  const panel = ttById("ttPlannerCustomizePanel");
  if (panel) panel.hidden = false;
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
  if (!ttTeachingStudents(group, lesson?.scheduledDate).length) missing.push("students");
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
  const teachingStudents = ttTeachingStudents(group, lesson?.scheduledDate);
  const rows = teachingStudents.map((student) => {
    const records = typeof recordsForStudent === "function"
      ? recordsForStudent(student)
      : (appState.masterRecords || []).filter((record) => record.student === student);
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
      <strong>${escapeHtml(teachingStudents.length)} student${teachingStudents.length === 1 ? "" : "s"}</strong>
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
      ["Step/Substep", `${String(activeSkill.id).split(".")[0] || "--"} / ${activeSkill.id}`],
      ["Instruction", ttInstructionalLessonType(group, lesson)],
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
  if (sectionId === "8") {
    ttSection8RealSlots = [];
    ttSection8SoundElementsManual = false;
  }
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

function ttPreviousTeachPlan(group) {
  return (group?.history || []).slice().reverse().find((plan) =>
    plan.source === "TeachToday" && plan.lessons?.[0] && !plan.excludedFromLessonSequence
  ) || null;
}

function ttFreshReteachSelection(pool, excluded, count) {
  const cleanPool = uniqueWords(pool || []).filter(Boolean);
  const blocked = new Set(uniqueWords(excluded || []).map((word) => String(word).toLowerCase()));
  const fresh = shuffled(cleanPool.filter((word) => !blocked.has(String(word).toLowerCase())));
  const fallback = shuffled(cleanPool.filter((word) => !fresh.includes(word)));
  return uniqueWords(fresh.concat(fallback)).slice(0, count);
}

function ttDuplicatePreviousLesson() {
  const group = ttPlannerGroup();
  if (!group) return;
  const lastPlan = ttPreviousTeachPlan(group);
  const previous = lastPlan?.lessons?.[0];
  if (!previous) {
    ttAssistantNotice = "No previous charting-page lesson is available to redo yet.";
    ttRenderPlannerPanel();
    return;
  }
  const skill = scopeMap.find((item) => item.id === previous.substep) || activeStep(group);
  const level = previous.readerLevel || group.readerLevel || "AB";
  const previousDate = lastPlan.sessions?.[lastPlan.activeDay || "1"]?.date
    || lastPlan.scheduledDate
    || previous.scheduledDate
    || ttTodayKey();
  ttPlannerDraft = {
    groupId: group.id,
    substep: previous.substep || group.substep,
    level,
    wordlist: previous.wordlistPageNumber || "",
    sentence: previous.sentencePageNumber || "",
    passageId: previous.section9Story?.passageId || previous.section9Story?.id || "",
    passageApproach: previous.section9Story?.approach || "comprehension-sos",
    reviewSubsteps: [priorSubstep(previous.substep || group.substep)],
    lessonType: previous.lessonType || "full",
    scheduledDate: ttNextInstructionDateKey(previousDate),
    flashSections: (previous.flashSections || ["1", "2", "3", "5"]).slice()
  };
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttReviewWordFilters = {};
  ttSection8RealSlots = [];
  ttSection8SoundElementsManual = false;
  const preview = ttPlannerPreviewLesson(group);
  const chartPool = uniqueWords([].concat(preview.realWords || [], preview.nonsenseWords || []));
  const oldCurrent = uniqueWords([].concat(previous.sectionTwoCurrentWords || [], previous.sectionTwoCurrentWordsB2 || []));
  const currentDay1 = ttFreshReteachSelection(chartPool, oldCurrent, 6);
  const isGroupReteach = ttNormalizeLessonType(ttPlannerDraft.lessonType) === "group";
  const currentDay2 = isGroupReteach
    ? ttFreshReteachSelection(chartPool, oldCurrent.concat(currentDay1), 6)
    : [];
  const skillIndex = scopeMap.findIndex((item) => item.id === skill.id);
  const priorSubsteps = scopeMap.slice(Math.max(0, skillIndex - 8), Math.max(0, skillIndex)).map((item) => item.id);
  const reviewPool = ttPlannerReviewWordPool(priorSubsteps, level);
  const oldReview = uniqueWords([].concat(previous.sectionTwoReviewWords || [], previous.sectionTwoReviewWordsB2 || []));
  const reviewDay1 = ttFreshReteachSelection(reviewPool, oldReview.concat(currentDay1, currentDay2), 6);
  const reviewDay2 = isGroupReteach
    ? ttFreshReteachSelection(reviewPool, oldReview.concat(reviewDay1, currentDay1, currentDay2), 6)
    : [];
  ttPickerSelections = {
    section2Current: currentDay1,
    section2CurrentB2: currentDay2,
    section2Review: reviewDay1,
    section2ReviewB2: reviewDay2
  };
  ttSectionReviewSubsteps = ttDefaultSectionReviewSubsteps(skill, level);
  group.preferredLessonType = ttNormalizeLessonType(ttPlannerDraft.lessonType);
  saveState();
  const freshCount = currentDay1.filter((word) => !oldCurrent.includes(word)).length
    + currentDay2.filter((word) => !oldCurrent.includes(word)).length;
  const freshReviewCount = reviewDay1.filter((word) => !oldReview.includes(word)).length
    + reviewDay2.filter((word) => !oldReview.includes(word)).length;
  ttAssistantNotice = freshCount === currentDay1.length + currentDay2.length
      && freshReviewCount === reviewDay1.length + reviewDay2.length
    ? "Prepared the same charting page with fresh Section 2 practice words."
    : "Prepared the same charting page with as many fresh practice words as the indexed page allows.";
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
  const lastPlan = (group.history || []).slice().reverse().find((plan) => ["TeachToday", "CombinedSession"].includes(plan.source) && plan.lessons?.[0]);
  if (!lastPlan?.lessons?.[0]) return "No saved lesson yet. Smart defaults use this group’s current substep.";
  const lesson = lastPlan.lessons[0];
  const saved = lastPlan.savedAt ? formatDateTime(new Date(lastPlan.savedAt)) : lastPlan.created || "";
  return `Last taught: ${lesson.substep}, Reader ${lesson.reader}, wordlist p. ${lesson.wordlistPageNumber || "--"}${lastPlan.combinedParticipation ? ` · combined with ${lastPlan.hostGroupNameAtTime || "another group"}` : ""}${saved ? ` · ${saved}` : ""}`;
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
    const recommendedPage = Number(draft.sentenceRecommendation?.p || 0);
    sentence.innerHTML = pages.map((page, index) => {
      const recommended = page === recommendedPage ? " · recommended for charting page" : "";
      return `<option value="${page}"${page === Number(draft.sentence) ? " selected" : ""}>p. ${page} (${index + 1}/${pages.length})${recommended}</option>`;
    }).join("");
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
  const enhancedPage = ttEnhancedPlanning()?.findPage?.(skill.id, level, selectedWordPage) || null;
  ttApplyEnhancedChartPageToLesson(lesson, skill);
  lesson.planningIndexVersion = draft.planningIndexVersion || window.teachTodayEnhancedPlanningIndex?.schemaVersion || "legacy-index";
  lesson.planningSource = enhancedPage ? "enhanced-chart-page" : "legacy-index-fallback";
  lesson.planningAnchor = {
    substep: skill.id,
    level,
    wordlistPage: selectedWordPage || lesson.wordlistPageNumber || null,
    sentencePage: selectedSentencePage || lesson.sentencePageNumber || null,
    sentenceSelectionMode: draft.sentenceSelectionMode || "ordered-fallback"
  };
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

function ttSection8RealSlotsInit(skill, lesson = null) {
  const currentIdx = scopeMap.findIndex((s) => s.id === skill.id);
  const upTo = (subIds) => subIds.filter((id) => {
    const i = scopeMap.findIndex((s) => s.id === id);
    return i >= 0 && i <= currentIdx;
  });
  const level = ttPlannerDraft?.level || "AB";

  const activeLesson = lesson || ttPlannerPreviewLesson(ttPlannerGroup());
  const prior = priorSubstep(skill.id);
  const sectionSeven = activeLesson ? ttBuildSectionSevenWordSets(activeLesson, skill) : { review: [], nonsense: [], current: [] };
  const sectionSevenKeys = new Set([].concat(sectionSeven.review, sectionSeven.nonsense, sectionSeven.current).map(ttWordKey));
  const dictationReview = ttDictationBookReviewWordPool([prior], level)
    .filter((word) => !sectionSevenKeys.has(ttWordKey(word)));
  const dictationCurrent = (activeLesson ? ttDictationBookCurrentWordPool(activeLesson, skill) : [])
    .filter((word) => !sectionSevenKeys.has(ttWordKey(word)));
  if (dictationReview.length || dictationCurrent.length) {
    const review = ttDeterministicTake(dictationReview, 3);
    const used = new Set(review.map(ttWordKey));
    const current = ttDeterministicTake(
      dictationCurrent.filter((word) => !used.has(ttWordKey(word))),
      2
    );
    const selected = fillToCount(review.concat(current), dictationReview.concat(dictationCurrent), 5);
    ttSection8RealSlots = selected.slice(0, 5).map((word, index) => ({
      substep: index < Math.min(3, review.length) ? prior : skill.id,
      word
    }));
    return;
  }
  const enhanced = ttEnhancedPlanning();
  if (enhanced?.isCovered?.(skill.id) && activeLesson) {
    const review = ttDeterministicTake(ttEnhancedReviewWords(activeLesson, skill), 3);
    const used = new Set(review.map(ttWordKey));
    const current = ttDeterministicTake(
      ttEnhancedPageWords(activeLesson, skill).filter((word) => !used.has(ttWordKey(word))),
      2
    );
    const words = fillToCount(review.concat(current), ttCurrentRealWordPool(activeLesson, skill), 5);
    ttSection8RealSlots = words.slice(0, 5).map((word, index) => ({
      substep: index < 3 ? (enhanced.wordSourceSubstep?.(skill.id, word) || skill.id) : skill.id,
      word
    }));
    return;
  }

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

function ttSection8RealSlotsHtml(skill, lesson = null) {
  if (!ttSection8RealSlots.length) ttSection8RealSlotsInit(skill, lesson);
  const currentIdx = scopeMap.findIndex((s) => s.id === skill.id);
  const substepOptions = scopeMap.slice(Math.max(0, currentIdx - 8), currentIdx + 1).map((s) => s.id).reverse();
  const level = ttPlannerDraft?.level || "AB";
  const activeLesson = lesson || ttPlannerPreviewLesson(ttPlannerGroup());
  const reviewSubstep = priorSubstep(skill.id);
  const currentPage = activeLesson?.wordlistPageNumber;
  const slotHints = [
    `review · ${reviewSubstep}`,
    `review · ${reviewSubstep}`,
    `review · ${reviewSubstep}`,
    currentPage ? `current · Reader p. ${currentPage}` : "current substep",
    currentPage ? `current · Reader p. ${currentPage}` : "current substep"
  ];

  const slotHtml = ttSection8RealSlots.map((slot, i) => {
    const wordPool = (slot.substep === skill.id && activeLesson
      ? ttDictationBookCurrentWordPool(activeLesson, skill)
      : ttDictationBookWordsFor(slot.substep, level, "real")).slice(0, 80);
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
      5 Real Words · Dictation Book
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

function ttDerivedDictationTargets(skill, words) {
  const enhanced = ttEnhancedPlanning();
  const availableSounds = uniqueWords([].concat(
    vowelSoundList(skill.id),
    consonantSoundList(skill.id),
    ttKnownWeldedValues(skill.id)
  ));
  let soundTargets = [];
  let elementTargets = [];
  if (enhanced?.isCovered?.(skill.id)) {
    const groups = enhanced.soundGroups(skill.id, words);
    soundTargets = uniqueWords([].concat(
      (groups.vowels || []).map(ttIndexedVowelLabel),
      groups.consonants || [],
      groups.welded || []
    )).filter((value) => availableSounds.includes(value));
    elementTargets = enhanced.wordElements(skill.id, words)
      .filter((value) => wordElementList(skill.id).includes(value));
  }
  return {
    sounds: fillToCount(soundTargets, soundsFromWords(words, skill.id).concat(availableSounds), 5),
    elements: fillToCount(elementTargets, elementsFromWords(words, skill.id).concat(wordElementList(skill.id)), 5)
  };
}

function ttSyncSection8RealSelectionState() {
  const words = ttSection8RealWords();
  ttPickerSelections.dictationReal = words;
  if (ttSection8SoundElementsManual) return;
  const group = ttPlannerGroup();
  const skill = scopeMap.find((item) => item.id === (ttPlannerDraft.substep || group?.substep)) || (group ? activeStep(group) : null);
  if (!skill) return;
  const derived = ttDerivedDictationTargets(skill, words);
  ttPickerSelections.dictationSounds = derived.sounds;
  ttPickerSelections.dictationElements = derived.elements;
  [
    ["dictationSounds", derived.sounds],
    ["dictationElements", derived.elements]
  ].forEach(([pickerId, values]) => {
    const picker = ttById("ttPlannerSections")?.querySelector(`[data-picker="${pickerId}"]`);
    if (!picker) return;
    const selected = new Set(values);
    picker.querySelectorAll(".planner-chip-row button").forEach((button) => {
      button.classList.toggle("selected", selected.has(button.dataset.value));
    });
    ttPickerUpdateStatus(picker);
  });
}

function ttPlannerSectionsHtml(group, skill, lesson) {
  const originalSelectedGroupId = appState.selectedGroupId;
  appState.selectedGroupId = group.id;
  ttEnsurePlannerDraft(group);
  const sectionSeven = ttBuildSectionSevenWordSets(lesson, skill);
  if (!ttSection8RealSlots.length) ttSection8RealSlotsInit(skill, lesson);
  ttSyncSection8RealSelectionState();
  const dictationPlan = ttDictationPlan(lesson, skill, { avoidWordKeys: new Set() });
  const dictationBlock = (label) => dictationPlan.find((block) => block.label.toLowerCase().includes(label))?.values || [];
  const chartWords = uniqueWords([].concat(lesson.realWords || [], lesson.nonsenseWords || []));
  const fallbackPrior = [priorSubstep(skill.id)];
  const sec2Substeps = ttSectionReviewSubsteps.section2?.length ? ttSectionReviewSubsteps.section2 : fallbackPrior;
  const sec3Substeps = ttSectionReviewSubsteps.section3?.length ? ttSectionReviewSubsteps.section3 : fallbackPrior;
  const sec7Substeps = ttSectionReviewSubsteps.section7?.length ? ttSectionReviewSubsteps.section7 : fallbackPrior;
  const level = lesson.readerLevel || "AB";
  const reviewPool = ttPlannerReviewWordPool(sec2Substeps, level).slice(0, 64);
  const sec3ReviewPool = ttPlannerReviewWordPool(sec3Substeps, level).slice(0, 36);
  const sec7ReviewPool = ttDictationBookReviewWordPool(sec7Substeps, level).slice(0, 80);
  const currentPool = chartWords.slice(0, 30);
  const sec7CurrentPool = ttDictationBookCurrentWordPool(lesson, skill).slice(0, 80);
  const section3Review = uniqueWords([].concat(section3ReviewCards(lesson), sec3ReviewPool)).slice(0, 36);
  const section3Current = uniqueWords([].concat(section3CurrentCards(lesson), chartWords)).slice(0, 36);
  const vowels = vowelSoundList(skill.id);
  const consonants = consonantSoundList(skill.id);
  const welded = ttKnownWeldedValues(skill.id);
  const elements = wordElementList(skill.id);
  const sounds = uniqueWords([].concat(vowels, consonants, welded)).slice(0, 80);
  const nonsense = ttDictationBookNonsensePool(skill.id).slice(0, 80);
  const phraseRows = currentDictationPhraseRows(skill.id);
  const section7Hfw = uniqueWords([].concat(lesson.highFrequencyWords || [], hfwWordsForSubstep(skill.id, lesson))).slice(0, 32);
  const dictationSentences = uniqueWords(currentDictationSentencesForLesson(lesson, skill, group)).slice(0, 30);
  const readerSentences = uniqueWords(currentReaderSentencesForDictation(lesson, skill)).slice(0, 24);
  const lessonType = ttPlannerDraft.lessonType || "full";
  const enhancedReviewDefaults = ttEnhancedPlanning()?.isCovered?.(skill.id)
    ? ttEnhancedReviewWords(lesson, skill, 16)
    : [];

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
    ttPlannerReviewPickerHtml("section2Review", "Review words", reviewPool, enhancedReviewDefaults.slice(0, 6).length ? enhancedReviewDefaults.slice(0, 6) : (lesson.sectionTwoReviewWords || []), 6, "section2", skill) +
    ttPlannerPickerHtml("section2Current", "Current words", currentPool, lesson.sectionTwoCurrentWords || [], 6),
    "", "5 min"
  );

  // Part 2 uses a distinct set of Section 2 words (Day 2 — different from Day 1)
  const row2Encoding = plannerRow(2, "#10b981", "§2B · Teach & Review Concepts", "Day 2 words — different from Day 1 §2",
    ttPlannerReviewPickerHtml("section2ReviewB2", "Review words (Day 2)", reviewPool, enhancedReviewDefaults.slice(6, 12).length ? enhancedReviewDefaults.slice(6, 12) : (lesson.sectionTwoReviewWordsB2 || []), 6, "section2B", skill) +
    ttPlannerPickerHtml("section2CurrentB2", "Current words (Day 2)", currentPool, lesson.sectionTwoCurrentWordsB2 || [], 6),
    "", "5 min"
  );

  const row3 = plannerRow(3, "#3b82f6", "Word Cards", "Review cards first, then current",
    ttPlannerReviewPickerHtml("section3Review", "Review cards · one concept", section3Review, section3ReviewCards(lesson), 8, "section3", skill, {
      autoConcept: true,
      conceptOnly: true,
      selectionDriven: true
    }) +
    ttPlannerReviewPickerHtml("section3Current", "Current cards · one concept", section3Current, section3CurrentCards(lesson), 8, "section3Current", skill, {
      fixedSubstep: skill.id,
      showSubsteps: false,
      conceptOnly: true,
      selectionDriven: true,
      preferredPage: ttPlannerDraft.wordlist
    }),
    "", "5 min"
  );

  const reverseDefaults = ttBuildReverseDrillOverride(skill, lesson);
  const reverseValues = (groupName) => reverseDefaults.filter((item) => item.group === groupName).map((item) => item.value);
  const row6 = plannerRow(6, "#f97316", "Quick Drill in Reverse", "Sounds to practice encoding",
    ttPlannerPickerHtml("section6Vowels", "Vowels", vowels, reverseValues("Sounds"), 5) +
    ttPlannerPickerHtml("section6Consonants", "Consonants", consonants, reverseValues("Consonants / digraphs"), 5) +
    ttPlannerPickerHtml("section6Welded", "Welded / glued", welded, reverseValues("Welded / glued"), 3) +
    ttPlannerPickerHtml("section6Elements", "Word elements", elements, reverseValues("Pfx / Sfx"), 2),
    `<button type="button" class="planner-select-all-btn" data-sec-target="6" onclick="ttToggleSection6All(this)">Select all</button>`,
    "3 min"
  );

  const row7 = plannerRow(7, "#f43f5e", "Teach & Review for Spelling", "Words students will spell",
    ttPlannerReviewPickerHtml("section7Review", "Review words · Dictation Book", uniqueWords([].concat(sectionSeven.review, sec7ReviewPool)), sectionSeven.review, 5, "section7", skill, { selectionDriven: true }) +
    ttPlannerPickerHtml("section7Current", "Current words · Dictation Book", uniqueWords([].concat(sectionSeven.current, sec7CurrentPool)), sectionSeven.current, 5) +
    ttPlannerPickerHtml("section7Nonsense", "Nonsense words · Dictation Book", uniqueWords([].concat(sectionSeven.nonsense, nonsense)), sectionSeven.nonsense, 3) +
    ttPlannerPickerHtml("section7Hfw", "High-frequency words", section7Hfw, section7Hfw.slice(0, 8), 8),
    "", "10 min"
  );

  const row8 = plannerRow(8, "#6366f1", "Dictation", "Sounds, words, phrases and sentences to dictate",
    ttPlannerPickerHtml("dictationSounds", "Sounds", sounds, dictationBlock("sounds"), 5) +
    ttPlannerPickerHtml("dictationElements", "Word elements", elements, dictationBlock("word elements"), 5) +
    ttSection8RealSlotsHtml(skill, lesson) +
    ttPlannerPickerHtml("dictationNonsense", "Nonsense words", nonsense, dictationBlock("nonsense"), 3) +
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
  const allPrior = ["section2", "section2B", "section3"].includes(sectionKey);
  const firstIndex = allPrior ? 0 : Math.max(0, currentIndex - 8);
  const endIndex = sectionKey === "section3" && currentIndex > 0 ? currentIndex : currentIndex + 1;
  const options = scopeMap.slice(firstIndex, endIndex).map((item) => item.id).reverse();
  const current = (ttSectionReviewSubsteps[sectionKey] || [])[0];
  return `<div class="planner-substep-row" data-substep-section="${escapeHtml(sectionKey)}">
    <span class="planner-substep-label">From:</span>
    ${options.map((id) => `<button type="button" class="planner-substep-btn${current === id ? " selected" : ""}" data-value="${escapeHtml(id)}" data-substep-section="${escapeHtml(sectionKey)}">${escapeHtml(id)}</button>`).join("")}
    ${sectionKey === "section3" ? "" : `<button type="button" class="planner-substep-btn planner-substep-n-btn${current === "N" ? " selected" : ""}" data-value="N" data-substep-section="${escapeHtml(sectionKey)}" title="Nonsense words">N</button>`}
  </div>`;
}

function ttReviewConceptLabel(concepts) {
  const values = new Set((concepts || []).map((value) => String(value || "").trim().toLowerCase()));
  const exact = [...values].sort().join("|");
  const exactLabels = {
    "ng|nk": "ng & nk words",
    "suffix": "+ suffix",
    "all": "all words",
    "am|an": "am & an words",
    "blend|digraph": "Digraphs & blends",
    "closed_exception": "Closed exceptions",
    "mixed": "Mixed practice",
    "blend|welded_sound": "Blends & welded sounds",
    "odd_vowel_sound_v_e|r_controlled_v_e|silent_e|v_e_syllable|v_e_with_r|vowel_consonant_e": "V E Syllable - V-r-e",
    "closed_syllable|final_e_marker|final_se|final_ve|se_ve_closed_syllables": "Closed Syllable - Final E Marker - Final se ve",
    "latin_base|latin_base_practice_page": "Latin bases",
    "compound_word|cw|syllable_division": "Compound words",
    "cactus_word|syllable_division|vccv": "VCCV / cactus words",
    "relish_word|syllable_division|vcv": "VCV / relish words"
  };
  if (exactLabels[exact]) return exactLabels[exact];
  const ignored = /^(all_taught_elements|upper_steps|mixed_syllable_types|complex_baseword|base_word|latin_base_practice_page)$/;
  const friendly = [...values]
    .filter((value) => !ignored.test(value) && !value.startsWith("substep_") && !value.startsWith("prefix_set_"))
    .map((value) => ({
      prefix: "Prefixes",
      suffix: "+ suffix",
      latin_base: "Latin bases",
      syllable_division: "Syllable division",
      schwa: "Schwa",
      nonsense: "Nonsense words"
    }[value] || value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())))
    .filter((value, index, list) => list.indexOf(value) === index);
  return friendly.slice(0, 3).join(" · ") || "Reader concept";
}

function ttReaderPagesForWords(pageGroups, words) {
  const wanted = new Set((words || []).map((word) => String(word || "").trim().toLowerCase()));
  return [...new Set((pageGroups || []).flatMap((group) => (
    (group.pageWords || []).filter((page) => (
      (page.words || []).some((word) => wanted.has(String(word || "").trim().toLowerCase()))
    )).map((page) => Number(page.page))
  )))].filter(Number.isFinite).sort((left, right) => left - right);
}

function ttIntroducedReviewFilters(substep, pool, pageGroups) {
  const wordKey = (value) => String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  const candidates = [];
  knownWeldedAndExceptions
    .filter(([introduced]) => introduced === substep)
    .forEach(([, value]) => {
      const pattern = wordKey(value);
      if (pattern && !String(value).includes(" ")) {
        candidates.push({ key: `sound:${pattern}`, label: `/${pattern}/`, matches: (word) => wordKey(word).includes(pattern) });
      }
    });
  knownPrefixes
    .filter(([introduced]) => introduced === substep)
    .forEach(([, value]) => {
      const pattern = wordKey(value);
      candidates.push({ key: `prefix:${pattern}`, label: `${pattern}-`, matches: (word) => wordKey(word).startsWith(pattern) });
    });
  knownSuffixes
    .filter(([introduced]) => introduced === substep)
    .forEach(([, value]) => {
      const pattern = wordKey(value);
      candidates.push({ key: `suffix:${pattern}`, label: `-${pattern}`, matches: (word) => wordKey(word).endsWith(pattern) });
    });
  knownLatinBases
    .filter(([introduced]) => introduced === substep)
    .forEach(([, value]) => {
      const pattern = wordKey(value);
      candidates.push({ key: `base:${pattern}`, label: `-${pattern}-`, matches: (word) => wordKey(word).includes(pattern) });
    });
  return candidates.map((candidate) => ({
    key: candidate.key,
    kind: "element",
    label: candidate.label,
    title: `Words containing ${candidate.label}`,
    words: pool.filter(candidate.matches),
    pages: ttReaderPagesForWords(pageGroups, pool.filter(candidate.matches))
  })).filter((filter) => filter.words.length);
}

function ttReviewWordFilterModel(pickerId, substep, level, pool, options = {}) {
  const wordKey = (value) => String(value || "").trim().toLowerCase();
  const poolByKey = new Map(pool.map((word) => [wordKey(word), word]));
  const pageGroups = ttEnhancedPlanning()?.pageConceptGroups?.(substep, level) || [];
  const allPages = [...new Set(pageGroups.flatMap((group) => group.pages || []))].sort((left, right) => left - right);
  const filters = [{ key: "all", kind: "all", label: `All ${substep}`, title: `Show every ${substep} word`, words: pool.slice(), pages: allPages }];
  const classified = new Set();
  let hasRegularPages = pageGroups.length === 0;
  let regularWords = [];
  let regularPages = [];

  pageGroups.forEach((group) => {
    const words = uniqueWords((group.words || []).map((word) => poolByKey.get(wordKey(word))).filter(Boolean));
    if (!group.concepts?.length) {
      hasRegularPages = true;
      regularWords.push(...words);
      regularPages.push(...(group.pages || []));
      return;
    }
    if (group.concepts.includes("nonsense") || !words.length) return;
    words.forEach((word) => classified.add(wordKey(word)));
    filters.push({
      key: `concept:${group.key}`,
      kind: "concept",
      label: ttReviewConceptLabel(group.concepts),
      title: `Reader pages ${group.pages.join(", ")}`,
      words,
      pages: group.pages || []
    });
  });

  const unmatched = pool.filter((word) => !classified.has(wordKey(word)));
  regularWords = uniqueWords(regularWords.concat(unmatched));
  if (regularWords.length) {
    const regularLabel = hasRegularPages && substep === "1.4"
      ? "Bonus Letter 1.4"
      : hasRegularPages ? `Regular ${substep}` : `Other ${substep}`;
    filters.push({
      key: "regular",
      kind: "regular",
      label: regularLabel,
      title: hasRegularPages ? `Words from ${substep} pages without a subtitle` : `Other indexed ${substep} words`,
      words: regularWords,
      pages: [...new Set(regularPages)].sort((left, right) => left - right)
    });
  }
  const nonsenseGroup = ttEnhancedPlanning()?.nonsensePageGroup?.(substep);
  const nonsenseWords = uniqueWords(nonsenseGroup?.words || []).filter(isValidDictationWord);
  if (nonsenseWords.length) {
    filters.push({
      key: "nonsense",
      kind: "nonsense",
      label: "N words",
      title: `Nonsense words from Reader pages ${(nonsenseGroup.pages || []).join(", ")}`,
      words: nonsenseWords,
      pages: nonsenseGroup.pages || []
    });
    if (substep === "1.4") {
      const nonsenseAllWords = nonsenseWords.filter((word) => wordKey(word).includes("all"));
      if (nonsenseAllWords.length) {
        filters.push({
          key: "nonsense:sound:all",
          kind: "nonsense-concept",
          label: "N /all/ words",
          title: "Nonsense words containing /all/",
          words: nonsenseAllWords,
          pages: ttReaderPagesForWords([{ pageWords: nonsenseGroup.pageWords || [] }], nonsenseAllWords)
        });
      }
    }
  }
  filters.push(...ttIntroducedReviewFilters(substep, pool, pageGroups));

  const uniqueFilters = filters.filter((filter, index, list) => (
    list.findIndex((candidate) => candidate.key === filter.key) === index
  ));
  const visibleFilters = options.conceptOnly
    ? uniqueFilters.filter((filter) => filter.key !== "all")
    : uniqueFilters;
  if (!visibleFilters.length) visibleFilters.push(uniqueFilters[0]);
  let requested = ttReviewWordFilters[pickerId] || "";
  if (!requested && options.preferredPage) {
    requested = visibleFilters.find((filter) => (filter.pages || []).includes(Number(options.preferredPage)))?.key || "";
  }
  if (!requested && options.autoConcept) {
    const conceptFilters = visibleFilters.filter((filter) => ["concept", "regular", "nonsense"].includes(filter.kind));
    const candidates = conceptFilters.length ? conceptFilters : visibleFilters;
    requested = candidates[Math.floor(Math.random() * candidates.length)]?.key || "";
  }
  const fallbackKey = visibleFilters[0]?.key || "all";
  const active = visibleFilters.some((filter) => filter.key === requested) ? requested : fallbackKey;
  ttReviewWordFilters[pickerId] = active;
  return {
    active,
    filters: visibleFilters,
    words: visibleFilters.find((filter) => filter.key === active)?.words || pool
  };
}

function ttReviewPageLabel(pages) {
  const numbers = [...new Set((pages || []).map(Number).filter(Number.isFinite))].sort((left, right) => left - right);
  if (!numbers.length) return "";
  const parts = [];
  let start = numbers[0];
  let previous = numbers[0];
  for (let index = 1; index <= numbers.length; index += 1) {
    const current = numbers[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    const span = previous - start >= 2 ? `${start}–${previous}` : previous === start ? `${start}` : `${start},${previous}`;
    parts.push(span);
    start = current;
    previous = current;
  }
  return `(p.${parts.join(",")})`;
}

function ttReviewWordFiltersHtml(model) {
  if (!model?.filters?.length) return "";
  return `<div class="planner-concept-row" data-review-filter-row>
    <span class="planner-concept-label">Narrow by:</span>
    ${model.filters.map((filter) => `<button type="button" class="planner-concept-btn${model.active === filter.key ? " selected" : ""}" data-review-filter="${escapeHtml(filter.key)}" data-review-filter-label="${escapeHtml(filter.label)}" title="${escapeHtml(filter.title || filter.label)}">${escapeHtml(filter.label)} <small class="planner-concept-count">${filter.words.length}</small>${filter.pages?.length ? ` <small class="planner-concept-pages">${escapeHtml(ttReviewPageLabel(filter.pages))}</small>` : ""}</button>`).join("")}
  </div>`;
}

function ttPlannerReviewPickerHtml(id, title, items, selected, targetCount, sectionKey, skill, options = {}) {
  const level = ttPlannerDraft?.level || "AB";
  const numTarget = Number(targetCount) || 0;
  const currentSubstep = options.fixedSubstep
    || (ttSectionReviewSubsteps[sectionKey] || [])[0]
    || priorSubstep(skill.id);
  const isNView = currentSubstep === "N";
  const supportsConceptFilters = ["section2", "section2B", "section3", "section3Current"].includes(sectionKey);

  // Build display pool for the current substep
  const nsWords = new Set(readerNonsenseWordsFromSubstep(currentSubstep));
  const currentPool = sectionKey === "section7"
    ? ttDictationBookReviewWordPool([currentSubstep], level)
    : isNView
    ? ttReviewNonsensePool(skill.id)
    : uniqueWords(
        readerWordsFromSubstep(currentSubstep, level).concat(dictationWordsFor(currentSubstep, level))
      ).filter(isValidDictationWord);

  // Cache current substep pool
  ttPickerSubstepCache[`${id}::${currentSubstep}`] = currentPool;
  const filterModel = supportsConceptFilters
    ? (isNView
      ? { active: "all", filters: [{ key: "all", label: "All nonsense", title: "Show nonsense words", words: currentPool }], words: currentPool }
      : ttReviewWordFilterModel(id, currentSubstep, level, currentPool, {
          autoConcept: Boolean(options.autoConcept),
          conceptOnly: Boolean(options.conceptOnly),
          preferredPage: options.preferredPage || null
        }))
    : { active: "all", filters: [], words: currentPool };

  // Initial preselection: spread across multiple substeps + 1-2 nonsense
  if (!ttPickerSelections[id]) {
    ttPickerSelections[id] = options.selectionDriven && sectionKey === "section7" && (selected || []).length
      ? uniqueWords(selected).slice(0, numTarget)
      : options.selectionDriven
      ? ttSmartPreselect(filterModel.words, numTarget)
      : (selected || []).length
        ? uniqueWords(selected).slice(0, numTarget)
        : ttBuildReviewPreselect(id, skill, numTarget, level);
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

  return `<article class="planner-picker${selectedSet.size >= numTarget && numTarget > 0 ? " picker-complete" : ""}" data-picker="${escapeHtml(id)}" data-review-section="${escapeHtml(sectionKey)}" data-target-count="${numTarget}" data-selection-driven="${options.selectionDriven ? "true" : "false"}" data-auto-concept="${options.autoConcept ? "true" : "false"}" data-concept-only="${options.conceptOnly ? "true" : "false"}"${options.preferredPage ? ` data-preferred-page="${escapeHtml(options.preferredPage)}"` : ""}>
    <header>
      <strong>${escapeHtml(title)}</strong>
      <span class="picker-target-pill">${numTarget} target</span>
      ${completeBadge}${crossBadge}
      ${reshuffleBtn}${clearBtn}${undoBtn}
    </header>
    ${options.showSubsteps === false ? "" : ttSubstepBubblesHtml(sectionKey, skill)}
    ${ttReviewWordFiltersHtml(filterModel)}
    <div class="planner-chip-row">
      ${filterModel.words.map((item) => {
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
  if (pickerId === "dictationSounds" || pickerId === "dictationElements") ttSection8SoundElementsManual = true;
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
  if (pickerId === "dictationSounds" || pickerId === "dictationElements") ttSection8SoundElementsManual = true;
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
  if (pickerId === "dictationSounds" || pickerId === "dictationElements") ttSection8SoundElementsManual = true;
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
  if (pickerId === "dictationSounds" || pickerId === "dictationElements") ttSection8SoundElementsManual = true;
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
  ttById("ttPlannerSections")?.querySelectorAll(".planner-concept-btn").forEach((button) => {
    button.addEventListener("click", () => ttSetReviewWordFilter(button));
  });
}

function ttSetReviewWordFilter(button) {
  const picker = button.closest("[data-picker]");
  const pickerId = picker?.dataset.picker;
  const sectionKey = picker?.dataset.reviewSection;
  if (!pickerId || !sectionKey) return;
  ttReviewWordFilters[pickerId] = button.dataset.reviewFilter || "all";
  ttUpdateSectionReviewChips(sectionKey);
  ttRefreshPreview();
}

function ttTogglePlannerChip(button) {
  const picker = button.closest("[data-picker]");
  const pickerId = picker?.dataset.picker || "";
  if (pickerId === "dictationSounds" || pickerId === "dictationElements") ttSection8SoundElementsManual = true;
  const willSelect = !button.classList.contains("selected");
  if (button.classList.contains("planner-substep-btn")) {
    const sectionKey = button.dataset.substepSection;
    const substepRow = button.closest(".planner-substep-row");
    substepRow.querySelectorAll(".planner-substep-btn").forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");
    ttSectionReviewSubsteps[sectionKey] = [button.dataset.value];
    ttReviewWordFilters[pickerId] = picker.dataset.autoConcept === "true" ? "" : "all";
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

  const pickerIdMap = {
    section2: "section2Review",
    section2B: "section2ReviewB2",
    section3: "section3Review",
    section3Current: "section3Current",
    section7: "section7Review",
    section8Real: "dictationReal"
  };
  const pickerId = pickerIdMap[sectionKey];
  if (!pickerId) return;
  const currentSubstep = sectionKey === "section3Current"
    ? skill.id
    : (ttSectionReviewSubsteps[sectionKey] || [priorSubstep(skill.id)])[0];

  const picker = ttById("ttPlannerSections")?.querySelector(`[data-picker="${pickerId}"]`);
  if (!picker) return;

  const isNView = currentSubstep === "N";
  const nsWordsSet = new Set(readerNonsenseWordsFromSubstep(currentSubstep));

  // Build pool for new substep
  const newPool = sectionKey === "section7"
    ? ttDictationBookReviewWordPool([currentSubstep], level)
    : isNView
    ? ttReviewNonsensePool(skill.id)
    : uniqueWords(
        readerWordsFromSubstep(currentSubstep, level).concat(dictationWordsFor(currentSubstep, level))
      ).filter(isValidDictationWord);

  // Cache it
  ttPickerSubstepCache[`${pickerId}::${currentSubstep}`] = newPool;

  const supportsConceptFilters = ["section2", "section2B", "section3", "section3Current"].includes(sectionKey);
  const filterModel = supportsConceptFilters
    ? (isNView
      ? { active: "all", filters: [{ key: "all", label: "All nonsense", title: "Show nonsense words", words: newPool }], words: newPool }
      : ttReviewWordFilterModel(pickerId, currentSubstep, level, newPool, {
          autoConcept: picker.dataset.autoConcept === "true",
          conceptOnly: picker.dataset.conceptOnly === "true",
          preferredPage: picker.dataset.preferredPage || null
        }))
    : { active: "all", filters: [], words: newPool };

  if (picker.dataset.selectionDriven === "true") {
    ttPickerSelections[pickerId] = ttSmartPreselect(filterModel.words, Number(picker.dataset.targetCount) || 0);
  }
  const currentSels = ttPickerSelections[pickerId] || [];
  const selectedSet = new Set(currentSels);
  // Cross-substep count badge update
  const crossCount = currentSels.filter((w) => !newPool.includes(w)).length;
  const crossBadge = picker.querySelector(".picker-cross-badge");
  if (crossBadge) {
    crossBadge.textContent = crossCount > 0 ? `+${crossCount} other` : "";
    crossBadge.hidden = crossCount === 0;
  }

  const filterRow = picker.querySelector("[data-review-filter-row]");
  if (filterRow) {
    const replacement = document.createElement("div");
    replacement.innerHTML = ttReviewWordFiltersHtml(filterModel);
    const newFilterRow = replacement.firstElementChild;
    if (newFilterRow) {
      filterRow.replaceWith(newFilterRow);
      newFilterRow.querySelectorAll(".planner-concept-btn").forEach((button) => {
        button.addEventListener("click", () => ttSetReviewWordFilter(button));
      });
    }
  }

  // Update chip row — only the active substep/filter view. Selections stay intact.
  const chipRow = picker.querySelector(".planner-chip-row");
  if (!chipRow) return;
  chipRow.innerHTML = filterModel.words.map((item) => {
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
  if (ttPlannerEditingPlanId && ttPlannerDraft.editingPlanId === ttPlannerEditingPlanId) {
    ttBeginEditingOpenPlan(group.id, ttPlannerEditingPlanId);
    ttAssistantNotice = "Restored the original saved lesson plan selections.";
    return;
  }
  const lessonType = ttNormalizeLessonType(ttPlannerDraft.lessonType || ttPreferredLessonType(group));
  ttPlannerDraft = {};
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttReviewWordFilters = {};
  ttSection8RealSlots = [];
  ttSection8SoundElementsManual = false;
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
  const openPlan = ttActiveOpenPlan(group);
  const editingOpenPlan = openPlan && ttPlannerEditingPlanId === openPlan.id && ttPlannerDraft.editingPlanId === openPlan.id;
  if (openPlan && !editingOpenPlan) {
    alert(`Lesson ${ttPlanLessonNumber(openPlan, openPlan.lessons?.[0], group)} is still open. Continue it or close it as incomplete before planning another lesson.`);
    ttRenderHomeScreen();
    return;
  }
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
  const planned = ttPlannerDraftLessonWithSelections(group);
  const originalLesson = editingOpenPlan ? ttClone(openPlan.lessons?.[0] || {}) : null;
  ttLesson = originalLesson ? { ...originalLesson, ...planned.lesson } : planned.lesson;
  ttLesson.id = originalLesson?.id || `lesson-${Date.now()}-0`;
  ttLesson.groupId = group.id;
  ttLesson.groupName = group.name;
  ttLesson.savedPlanId = originalLesson?.savedPlanId || (editingOpenPlan ? openPlan.id : "");
  ttLesson.lessonSequence = originalLesson?.lessonSequence || ttLesson.lessonSequence;
  ttLesson.completedSections = originalLesson?.completedSections || ttLesson.completedSections;
  ttLesson.activeGroupDay = originalLesson?.activeGroupDay || ttLesson.activeGroupDay;
  ttLesson.scheduledDate = draft.scheduledDate || originalLesson?.scheduledDate || ttTodayKey();
  ttApplySection9StoryToLesson(ttLesson, group, skill, {
    passageId: draft.passageId,
    approach: draft.passageApproach
  });
  if (editingOpenPlan) {
    ttSaveCurrentLesson({ render: false, reason: "Edited lesson plan" });
    ttPlannerEditingPlanId = "";
    ttPlannerDraft = {};
    ttAssistantNotice = "Lesson plan changes saved.";
    ttOpenTeachFlow({ transition: false, presentation: true });
    return;
  }
  ttSaveDraftLesson({ status: false });
  saveState();
  const lessonTypeForPicker = (ttLesson?.lessonType === "part1" || ttLesson?.lessonType === "part2") ? "group" : (ttLesson?.lessonType || "full");
  if (lessonTypeForPicker === "group") {
    ttShowGroupDayPicker(group, (choice) => {
      const day = choice && typeof choice === "object" ? choice.day : choice;
      const scheduledDate = choice && typeof choice === "object" ? choice.date : ttLesson.scheduledDate;
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
  const enhancedPage = ttEnhancedPlanning()?.findPage?.(
    skill.id,
    ttLesson.readerLevel || group.readerLevel || "AB",
    ttLesson.wordlistPageNumber
  ) || null;
  ttLesson.planningIndexVersion = draft.planningIndexVersion || window.teachTodayEnhancedPlanningIndex?.schemaVersion || "legacy-index";
  ttLesson.planningSource = enhancedPage ? "enhanced-chart-page" : "legacy-index-fallback";
  ttLesson.dictationWordIndexVersion = window.teachTodayDictationWordIndex?.schemaVersion || "legacy-dictation-words";
  ttLesson.dictationWordSource = window.teachTodayDictationWordIndex ? "official-dictation-book-pages" : "legacy-fallback";
  ttLesson.planningAnchor = {
    substep: skill.id,
    level: ttLesson.readerLevel || group.readerLevel || "AB",
    wordlistPage: ttLesson.wordlistPageNumber || null,
    sentencePage: Number(draft.sentence || ttLesson.sentencePageNumber || 0) || null,
    sentenceSelectionMode: draft.sentenceSelectionMode || "ordered-fallback"
  };
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
    sectionSevenNonsenseWords: ttPlannerSelected("section7Nonsense"),
    sectionSevenHighFrequencyWords: ttPlannerSelected("section7Hfw")
  };
  Object.entries(selected).forEach(([key, values]) => {
    if (values.length) ttLesson[key] = values;
  });
  const section3ReviewFilter = ttById("ttPlannerSections")?.querySelector('[data-picker="section3Review"] .planner-concept-btn.selected');
  const section3CurrentFilter = ttById("ttPlannerSections")?.querySelector('[data-picker="section3Current"] .planner-concept-btn.selected');
  ttLesson.sectionThreeReviewSubstep = (ttSectionReviewSubsteps.section3 || [priorSubstep(skill.id)])[0];
  ttLesson.sectionThreeReviewConcept = section3ReviewFilter?.dataset.reviewFilterLabel || "Review concept";
  ttLesson.sectionThreeCurrentSubstep = skill.id;
  ttLesson.sectionThreeCurrentConcept = section3CurrentFilter?.dataset.reviewFilterLabel || "Current concept";
  const readerDictationSentences = ttPlannerSelected("readerSentences");
  const dictationSentences = ttPlannerSelected("dictationSentences").concat(readerDictationSentences).slice(0, 3);
  const selectedRealWords = ttSection8RealWords().length ? ttSection8RealWords() : ttPlannerSelected("dictationReal");
  const derivedTargets = ttDerivedDictationTargets(skill, selectedRealWords);
  ttLesson.dictationPlanOverride = [
    { label: "5 sounds", values: ttPlannerSelected("dictationSounds").length ? ttPlannerSelected("dictationSounds") : derivedTargets.sounds },
    { label: "5 word elements", values: ttPlannerSelected("dictationElements").length ? ttPlannerSelected("dictationElements") : derivedTargets.elements },
    { label: "5 real words", values: selectedRealWords },
    { label: "3 nonsense words", values: ttPlannerSelected("dictationNonsense") },
    { label: "3 phrases", values: ttPlannerSelected("dictationPhrases") },
    { label: "2 sentences", values: dictationSentences }
  ].map((block) => ({ ...block, values: block.values.filter(Boolean) }));
  const reverseSelections = []
    .concat(ttPlannerSelected("section6Vowels").map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(ttPlannerSelected("section6Consonants").map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat(ttPlannerSelected("section6Welded").map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat(ttPlannerSelected("section6Elements").map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
  ttLesson.reverseDrillOverride = reverseSelections.length ? reverseSelections : ttBuildReverseDrillOverride(skill, ttLesson);
  ttLesson.planningSelections = {
    section2: {
      review: (ttLesson.sectionTwoReviewWords || []).slice(),
      current: (ttLesson.sectionTwoCurrentWords || []).slice(),
      reviewDay2: (ttLesson.sectionTwoReviewWordsB2 || []).slice(),
      currentDay2: (ttLesson.sectionTwoCurrentWordsB2 || []).slice()
    },
    section3: {
      review: (ttLesson.sectionThreeReviewWords || []).slice(),
      current: (ttLesson.sectionThreeCurrentWords || []).slice(),
      reviewSubstep: ttLesson.sectionThreeReviewSubstep,
      reviewConcept: ttLesson.sectionThreeReviewConcept,
      currentSubstep: ttLesson.sectionThreeCurrentSubstep,
      currentConcept: ttLesson.sectionThreeCurrentConcept
    },
    section6: ttLesson.reverseDrillOverride.map((item) => ({ ...item })),
    section7: {
      review: (ttLesson.sectionSevenReviewWords || []).slice(),
      current: (ttLesson.sectionSevenCurrentWords || []).slice(),
      nonsense: (ttLesson.sectionSevenNonsenseWords || []).slice(),
      highFrequency: (ttLesson.sectionSevenHighFrequencyWords || []).slice()
    },
    section8: ttLesson.dictationPlanOverride.map((block) => ({ label: block.label, values: block.values.slice() }))
  };
}

function ttKnownWeldedValues(substep) {
  return knownWeldedAndExceptions
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value);
}

function ttTrueNonsensePool(substep) {
  const dictationBookWords = ttDictationBookNonsensePool(substep);
  if (dictationBookWords.length) return dictationBookWords;
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
        <button id="ttPlannerOpen" class="preview-open-btn" type="button">Start Planned Lesson</button>
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
        ["Current", sectionSeven.current || []],
        ["HFW", activeLesson.sectionSevenHighFrequencyWords || []]
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
  const previewOpen = preview.querySelector(".preview-open-btn");
  if (previewOpen && ttPlannerEditingPlanId && ttPlannerDraft.editingPlanId === ttPlannerEditingPlanId) {
    previewOpen.textContent = "Save Changes & Continue Lesson";
  }
  ttBindPlannerPreviewActions(preview);
  appState.selectedGroupId = originalSelectedGroupId;
}

function ttBindPlannerPreviewActions(preview) {
  preview.querySelector(".preview-open-btn")?.addEventListener("click", () => ttBuildPlannerLesson({ startTeaching: true }));
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
  const attendanceSession = ttAttendanceSession(group);
  const attendance = attendanceSession?.status === "confirmed" ? attendanceSession.attendance || {} : {};
  const teachingStudents = ttTeachingStudents(group, lesson?.scheduledDate);
  const presentStudents = teachingStudents.filter((student) => attendance[student] === true);
  const absentStudents = teachingStudents.filter((student) => attendance[student] === false);
  const chartCount = data.chart.length;
  const dictationCount = data.dictation.length;
  const encodingCount = data.encoding.length;
  const completeLabel = plan?.wrapUp?.completedAt ? `Completed ${formatDateTime(new Date(plan.wrapUp.completedAt))}` : "Ready to complete";

  summary.innerHTML = `
    <article><strong>${escapeHtml(group.name || "Group")}</strong><span>${escapeHtml(lesson?.substep || group.substep || "--")} / Reader ${escapeHtml(lesson?.reader || "")}</span></article>
    <article><strong>${attendanceSession?.status === "confirmed" ? `${presentStudents.length}/${teachingStudents.length}` : "Not confirmed"}</strong><span>Attendance</span></article>
    <article><strong>${chartCount}</strong><span>Chart record${chartCount === 1 ? "" : "s"}</span></article>
    <article><strong>${dictationCount + encodingCount}</strong><span>Miss / encoding mark${dictationCount + encodingCount === 1 ? "" : "s"}</span></article>
    <article><strong>${escapeHtml(completeLabel)}</strong><span>Lesson status</span></article>
  `;

  const attendancePanel = ttById("ttWrapAttendance");
  if (attendancePanel) {
    attendancePanel.innerHTML = teachingStudents.map((student) => {
      const status = attendance[student] === true ? "Present" : attendance[student] === false ? "Absent" : "Not marked";
      return `<button type="button" class="attendance-chip ${status === "Present" ? "present" : status === "Absent" ? "absent" : ""}" data-open-wrap-attendance>${status} - ${escapeHtml(student)}</button>`;
    }).join("");
    attendancePanel.querySelectorAll("[data-open-wrap-attendance]").forEach((button) => button.addEventListener("click", () => ttOpenAttendanceSessionModal()));
  }

  const studentData = ttById("ttWrapStudentData");
  if (studentData) {
    const rows = teachingStudents.map((student) => {
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
  const attendanceSession = ttAttendanceSession(group);
  plan.wrapUp = {
    completedAt: new Date().toISOString(),
    note,
    attendance: ttClone(attendanceSession?.status === "confirmed" ? attendanceSession.attendance || {} : {}),
    attendanceStatus: attendanceSession?.status || "unconfirmed",
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
  ttSyncCombinedLessonLinks(plan, group);
  saveState();
  ttArchiveCurrentLessonPlanPdf("Completed").catch((error) => {
    console.warn("Teach Today could not archive the completed lesson PDF:", error);
    ttShowBackupToast(`Completed lesson PDF needs attention. ${error.message || error}`, "warning");
  });
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
  const direct = typeof value === "string" ? value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/) : null;
  if (direct && !String(value).includes("T")) return direct[1];
  const date = value instanceof Date ? value : new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const recommendation = ttEnhancedPlanning()?.findSentenceRecommendation?.(skill.id, level, pages[index]);
  if (recommendation?.p) {
    const sentencePages = pageList(skill, "sentences", level);
    const sentenceIndex = sentencePages.indexOf(Number(recommendation.p));
    if (sentenceIndex >= 0) group.pageProgress.sentences = sentenceIndex;
  }
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
  ttById("ttReverse").innerHTML = `<details class="reverse-reference">
    <summary>Show full sound reference</summary>
    <div class="reverse-reference-groups">${html}</div>
  </details>`;
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
  if (section === "section6") {
    observationGroups[1] = observationGroups[1].filter(([, shortLabel]) => shortLabel !== "HFW");
  }
  const visibleItems = ttNormalizeEncodingItems(items).slice(0, 32);
  const lessonId = ttLesson?.id || "";
  container.innerHTML = `
    <div class="encoding-row">
      <strong>${escapeHtml(label)} data</strong>
      <span class="encoding-selected">Tap under each student to save for this lesson</span>
    </div>
    <div class="encoding-student-grid"></div>
  `;
  const grid = container.querySelector(".encoding-student-grid");
  ttTeachingStudents(group).forEach((student) => {
    const studentId = ttStudentIdForName(student, group);
    const belongsToStudent = (record) => record.studentId
      ? record.studentId === studentId
      : record.student === student;
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
        const alreadySaved = (group.encodingObservations || []).some((record) =>
          record.lessonId === lessonId
          && belongsToStudent(record)
          && record.section === section
          && record.category === label
          && record.note === note
          && !(record.item || "")
        );
        if (alreadySaved) quickButton.classList.add("saved", "encoding-selected-item");
        quickButton.addEventListener("click", () => {
          let saved;
          if (groupIndex === 0) {
            saved = ttSetExclusiveEncodingObservation(quickButton, student, section, label, note);
          } else {
            saved = ttToggleEncodingObservation(quickButton, student, section, label, note, "");
          }
          container.querySelector(".encoding-selected").textContent = saved
            ? `Saved to ${student}'s profile: ${shortLabel}`
            : `Removed from ${student}'s profile: ${shortLabel}`;
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
        const itemCategory = item.category || label;
        const itemSaved = (group.encodingObservations || []).some((record) =>
          record.lessonId === lessonId
          && belongsToStudent(record)
          && record.section === section
          && record.category === itemCategory
          && record.note === "encoding miss"
          && (record.item || "") === item.value
        );
        if (itemSaved) itemButton.classList.add("saved", "encoding-selected-item");
        const suggestedTags = ttEnhancedPlanning()?.difficultyTags?.(ttLesson?.substep || group.substep, item.value, {
          nonsense: /nonsense/i.test(itemCategory),
          hfw: /hfw|high-frequency/i.test(itemCategory)
        }) || [];
        if (suggestedTags.length) itemButton.title = `Possible tags: ${suggestedTags.join(", ")} (teacher confirms)`;
        itemButton.addEventListener("click", () => {
          const saved = ttToggleEncodingObservation(itemButton, student, section, itemCategory, "encoding miss", item.value);
          const suggested = new Set(suggestedTags);
          column.querySelectorAll(".encoding-code-row-skill button").forEach((button) => {
            button.classList.toggle("suggested", suggested.has(button.textContent));
          });
          container.querySelector(".encoding-selected").textContent = saved
            ? `Saved to ${student}'s profile: missed ${item.value}`
            : `Removed from ${student}'s profile: ${item.value}`;
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
  const studentId = ttStudentIdForName(student, group);
  const sameStudent = (record) => record.studentId ? record.studentId === studentId : record.student === student;
  const exclusiveNotes = new Set([
    "automatic encoding; no struggle",
    "accurate encoding; minor struggle",
    "struggling to identify and segment sounds properly"
  ]);
  const wasSaved = group.encodingObservations.some((record) =>
    record.lessonId === lessonId
    && sameStudent(record)
    && record.section === section
    && record.category === category
    && record.note === note
    && !(record.item || "")
  );
  group.encodingObservations = group.encodingObservations.filter((record) =>
    !(record.lessonId === lessonId
      && sameStudent(record)
      && record.section === section
      && record.category === category
      && exclusiveNotes.has(record.note)
      && !(record.item || ""))
  );
  button.closest(".encoding-code-row")?.querySelectorAll("button").forEach((item) => item.classList.remove("saved", "encoding-selected-item"));
  if (!wasSaved) {
    ttSaveEncodingObservation(student, section, category, note, "");
    button.classList.add("saved", "encoding-selected-item");
  } else {
    saveState();
  }
  return !wasSaved;
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
  const student = group.activeStudent || ttTeachingStudents(group)[0];
  ttToggleEncodingObservation(button, student, section, category, "encoding miss", value);
}

function ttToggleEncodingObservation(button, student, section, category, note, item = "") {
  const group = ttActiveGroup();
  group.encodingObservations ||= [];
  const lessonId = ttLesson?.id || "";
  const studentId = ttStudentIdForName(student, group);
  const existingIndex = group.encodingObservations.findIndex((record) =>
    record.lessonId === lessonId
    && (record.studentId ? record.studentId === studentId : record.student === student)
    && record.section === section
    && record.category === category
    && record.note === note
    && (record.item || "") === (item || "")
  );
  if (existingIndex >= 0) {
    group.encodingObservations.splice(existingIndex, 1);
    button.classList.remove("saved", "encoding-selected-item");
    saveState();
  } else {
    ttSaveEncodingObservation(student, section, category, note, item);
    button.classList.add("saved", "encoding-selected-item");
  }
  return existingIndex < 0;
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
  const studentId = ttStudentIdForName(student, group);
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  const observedAt = new Date().toISOString();
  const observationCodes = {
    "automatic encoding; no struggle": "Auto",
    "accurate encoding; minor struggle": "Acc",
    "struggling to identify and segment sounds properly": "Strug",
    "struggles mainly with nonsense words": "NS",
    "struggles with consonant blends": "Blends",
    "struggles differentiating vowel sounds": "Vowel Diff",
    "struggles with high-frequency words": "HFW",
    "struggles with words that have suffixes": "Sfx"
  };
  const observationCode = note === "encoding miss" ? "Miss" : observationCodes[note] || "Observation";
  const observationKind = note === "encoding miss"
    ? "missed-item"
    : ["Auto", "Acc", "Strug"].includes(observationCode) ? "session-status" : "difficulty-tag";
  group.encodingObservations ||= [];
  const record = {
    id: `encoding-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: observedAt,
    student,
    studentId,
    homeGroupIdAtTime: ttStudentHomeGroupId(studentId, group.schoolYearId) || group.id,
    groupIdAtTime: group.id,
    schoolYearId: group.schoolYearId || appState.activeSchoolYearId || "",
    section,
    substep: ttLesson?.substep || group.substep,
    category,
    item,
    note,
    observationCode,
    observationKind,
    savedImmediately: true,
    ...lessonMeta
  };
  group.encodingObservations.push(record);
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
  return record;
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
  if (!lesson) return;
  const group = ttActiveGroup();
  const lessonKey = [
    group?.id || "group",
    lesson.savedPlanId || lesson.id || lesson.created || lesson.date || lesson.substep || "lesson"
  ].join("|");
  const isNewLesson = lessonKey !== ttCardModeLessonKey;
  if (isNewLesson) {
    ttCardModeLessonKey = lessonKey;
    ttCardMode = "lesson";
    ttFatStackThreshold = "all";
  }
  const section = ttById("section3");
  if (section) section.dataset.cardMode = ttCardMode;
  document.querySelectorAll(".card-mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === ttCardMode);
  });
  const currentHfwSelect = ttById("ttSection3HfwStep");
  const reviewHfwSelect = ttById("ttSection3HfwReviewStep");
  ttFillHfwStepChoicesForSelect(currentHfwSelect, lesson.substep);
  ttFillSection3HfwReviewChoices(reviewHfwSelect, lesson.substep);
  if (isNewLesson && currentHfwSelect) currentHfwSelect.value = lesson.substep;
  if (isNewLesson && reviewHfwSelect) reviewHfwSelect.value = priorSubstep(lesson.substep);
  const hfwControls = ttById("ttSection3HfwControls");
  if (hfwControls) hfwControls.hidden = ttCardMode !== "hfw";
  const fatFilters = ttById("ttFatStackFilters");
  if (fatFilters) fatFilters.hidden = ttCardMode !== "fat";
  const fatEntries = ttFatStackEntries(group);
  const fatCounts = {
    all: fatEntries.length,
    1: fatEntries.filter((entry) => entry.count === 1).length,
    2: fatEntries.filter((entry) => entry.count === 2).length,
    3: fatEntries.filter((entry) => entry.count >= 3).length
  };
  document.querySelectorAll("[data-fat-threshold]").forEach((button) => {
    const threshold = button.dataset.fatThreshold;
    const labels = { all: "All", 1: "Once", 2: "Twice", 3: "3+" };
    button.textContent = `${labels[threshold] || threshold} (${fatCounts[threshold] || 0})`;
    button.classList.toggle("active", threshold === ttFatStackThreshold);
  });
  const deckData = section3DeckForMode(lesson, ttCardMode);
  ttCardDeck = deckData.deck;
  const reviewTitle = ttById("ttReviewCardsTitle");
  const currentTitle = ttById("ttCurrentCardsTitle");
  const reviewRow = ttById("ttReviewCards");
  const currentRow = ttById("ttCurrentCards");
  reviewTitle.textContent = deckData.reviewTitle;
  currentTitle.textContent = deckData.currentTitle;
  reviewTitle.hidden = Boolean(deckData.hideReview);
  reviewRow.hidden = Boolean(deckData.hideReview);
  currentTitle.hidden = Boolean(deckData.hideCurrent);
  currentRow.hidden = Boolean(deckData.hideCurrent);
  ttFillWordRow(reviewRow, deckData.review, {
    markable: ttCardMode === "words",
    source: `section3-${ttCardMode}-review`,
    onSelect: (word) => ttShowCardByWord(word),
    onReplace: ttCardMode === "words" ? (word) => ttReplaceSection3Word("review", word) : null
  });
  ttFillWordRow(currentRow, deckData.current, {
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
  if (mode === "lesson") return ttSection3LessonDeck(lesson);
  if (mode === "fat") {
    const entries = ttFatStackForThreshold(ttFatStackEntries(ttActiveGroup()), ttFatStackThreshold);
    const deck = entries.map((entry) => ttFatStackCard(entry));
    return {
      reviewTitle: `Fat Stack · ${entries.length} ${entries.length === 1 ? "word" : "words"}`,
      currentTitle: "",
      review: entries.map((entry) => entry.word),
      current: [],
      deck,
      hideCurrent: true
    };
  }
  if (mode === "hfw") {
    const currentSubstep = ttById("ttSection3HfwStep")?.value || lesson.substep;
    const reviewSubstep = ttById("ttSection3HfwReviewStep")?.value || priorSubstep(lesson.substep);
    const current = hfwWordsForSubstep(currentSubstep, lesson);
    const review = reviewSubstep === currentSubstep && currentSubstep === scopeMap[0]?.id
      ? []
      : hfwWordsForSubstep(reviewSubstep, lesson);
    return {
      reviewTitle: `${reviewSubstep} review HFW`,
      currentTitle: `${currentSubstep} current HFW`,
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review HFW", label: `${reviewSubstep} HFW review` }))
        .concat(current.map((word) => ({ word, type: "Current HFW", label: `${currentSubstep} current HFW` })))
    };
  }
  if (mode === "words") {
    const review = section3ReviewCards(lesson);
    const current = section3CurrentCards(lesson);
    return {
      reviewTitle: `${lesson.sectionThreeReviewSubstep || priorSubstep(lesson.substep)} · ${lesson.sectionThreeReviewConcept || "Review cards"}`,
      currentTitle: `${lesson.sectionThreeCurrentSubstep || lesson.substep} · ${lesson.sectionThreeCurrentConcept || "Current cards"}`,
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review", label: lesson.sectionThreeReviewConcept || `${lesson.substep} review` }))
        .concat(current.map((word) => ({ word, type: "Current", label: lesson.sectionThreeCurrentConcept || `${lesson.substep}${lesson.readerLevel || "AB"}` })))
    };
  }

  const cards = wordPartCardsForMode(lesson.substep, mode);
  const title = modeTitle(mode);
  return {
    reviewTitle: `${title} known up to ${lesson.substep}`,
    currentTitle: "Tap a card to flash it",
    review: [],
    current: cards.map((card) => card.word),
    deck: cards
  };
}

function ttFillSection3HfwReviewChoices(select, currentSubstep) {
  if (!select) return;
  const previousValue = select.value;
  const currentIndex = scopeMap.findIndex((skill) => skill.id === currentSubstep);
  const priorSkills = currentIndex > 0 ? scopeMap.slice(0, currentIndex) : [];
  select.innerHTML = "";
  priorSkills.forEach((skill) => {
    const option = document.createElement("option");
    option.value = skill.id;
    option.textContent = skill.id;
    select.appendChild(option);
  });
  if (!priorSkills.length) {
    const option = document.createElement("option");
    option.value = currentSubstep;
    option.textContent = "No prior step";
    select.appendChild(option);
  }
  const defaultStep = priorSubstep(currentSubstep);
  select.value = priorSkills.some((skill) => skill.id === previousValue) ? previousValue : defaultStep;
}

function ttFatStackEntries(group = ttActiveGroup()) {
  if (!group) return [];
  const schoolYearId = group.schoolYearId || appState.activeSchoolYearId || ttAcademicSchoolYearId();
  const byWord = new Map();
  ttGroupChartRecords(group)
    .filter((record) => ttSchoolYearForChartRecord(record) === schoolYearId)
    .forEach((record) => {
      const missedAt = ttRecordTime(record);
      ttMissWordsFromChartRecord(record).forEach((word) => {
        const key = ttWordKey(word);
        if (!key) return;
        const prior = byWord.get(key) || { word, count: 0, lastMissedAt: 0 };
        prior.count += 1;
        prior.lastMissedAt = Math.max(prior.lastMissedAt, missedAt);
        byWord.set(key, prior);
      });
    });
  return [...byWord.values()].sort((a, b) => (
    b.count - a.count
    || b.lastMissedAt - a.lastMissedAt
    || a.word.localeCompare(b.word)
  ));
}

function ttFatStackForThreshold(entries, threshold = "all") {
  if (threshold === "1") return entries.filter((entry) => entry.count === 1);
  if (threshold === "2") return entries.filter((entry) => entry.count === 2);
  if (threshold === "3") return entries.filter((entry) => entry.count >= 3);
  return entries;
}

function ttFatStackCard(entry) {
  return {
    word: entry.word,
    type: "fat",
    label: `Missed ${entry.count} ${entry.count === 1 ? "time" : "times"}`,
    typeLabel: "Fat Stack"
  };
}

function ttStableDeckUnit(seed, value) {
  const input = `${seed}|${value}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) + 1) / 4294967297;
}

function ttWeightedFatStackSample(entries, count, seed) {
  return entries
    .map((entry) => ({
      entry,
      score: Math.pow(ttStableDeckUnit(seed, entry.word), 1 / Math.max(1, entry.count))
    }))
    .sort((a, b) => b.score - a.score || b.entry.count - a.entry.count)
    .slice(0, count)
    .map(({ entry }) => entry);
}

function ttSection3IntroducedCards(substep, mode, limit = 2) {
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
  return (sources[mode] || [])
    .filter(([introduced]) => introduced === substep)
    .slice(0, limit)
    .map(([introduced, word]) => ({
      word: displayWordPart(word, mode),
      type: mode,
      label: `${introduced} · newly introduced`,
      typeLabel: typeLabels[mode]
    }));
}

function ttSection3LessonDeck(lesson) {
  const seed = [
    ttActiveGroup()?.id || "group",
    lesson.savedPlanId || lesson.id || lesson.substep,
    lesson.sectionThreeDeckSeed || "default"
  ].join("|");
  const fat = ttWeightedFatStackSample(ttFatStackEntries(ttActiveGroup()), 10, seed)
    .map(ttFatStackCard);
  const review = section3ReviewCards(lesson).slice(0, 3)
    .map((word) => ({ word, type: "Review", label: lesson.sectionThreeReviewConcept || "Review concept" }));
  const current = section3CurrentCards(lesson).slice(0, 3)
    .map((word) => ({ word, type: "Current", label: lesson.sectionThreeCurrentConcept || "Current concept" }));
  const hfw = hfwWordsForSubstep(lesson.substep, lesson)
    .map((word) => ({ word, type: "Current HFW", label: `${lesson.substep} current HFW` }));
  const wordParts = [
    ...ttSection3IntroducedCards(lesson.substep, "welded", 2),
    ...ttSection3IntroducedCards(lesson.substep, "latin", 2),
    ...ttSection3IntroducedCards(lesson.substep, "prefixes", 2),
    ...ttSection3IntroducedCards(lesson.substep, "suffixes", 2)
  ];
  const deck = [...fat, ...review, ...current, ...hfw, ...wordParts];
  return {
    reviewTitle: `Lesson Deck · ${deck.length} cards`,
    currentTitle: "",
    review: deck.map((card) => card.word),
    current: [],
    deck,
    hideCurrent: true
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
    .filter((item) => item
      && item.correct === false
      && (!record?.chartHalf || !item.section || item.section === record.chartHalf))
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

const TT_INTRO_21_NG = [
  { text: "ang", keyword: "fang", imageKey: "ang", type: "welded" },
  { text: "ing", keyword: "ring", imageKey: "ing", type: "welded" },
  { text: "ong", keyword: "song", imageKey: "ong", type: "welded" },
  { text: "ung", keyword: "lung", imageKey: "ung", type: "welded" }
];

const TT_INTRO_21_NK = [
  { text: "ank", keyword: "bank", imageKey: "ank", type: "welded" },
  { text: "ink", keyword: "pink", imageKey: "ink", type: "welded" },
  { text: "onk", keyword: "honk", imageKey: "onk", type: "welded" },
  { text: "unk", keyword: "junk", imageKey: "unk", type: "welded" }
];

const TT_INTRO_21_CARD_IMAGE_PATHS = Object.freeze({
  ang: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/ang-sound-card-high-res.png",
  ing: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/ing-sound-card-high-res.png",
  ong: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/ong-sound-card-high-res.png",
  ung: "Pics%20for%20Lessons%20and%20Stuff/ung%20sound%20card.png",
  ank: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/ank-sound-card-high-res.png",
  ink: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/ink-sound-card-high-res.png",
  onk: "Pics%20for%20Lessons%20and%20Stuff/high-res-sound-cards/onk-sound-card-high-res.png",
  unk: "Pics%20for%20Lessons%20and%20Stuff/unk%20sound%20card.png"
});

const TT_INTRO_21_MOUTH_IMAGE_PATHS = Object.freeze({
  a: "Pics%20for%20Lessons%20and%20Stuff/short%20a.png",
  i: "Pics%20for%20Lessons%20and%20Stuff/short%20i.png",
  o: "Pics%20for%20Lessons%20and%20Stuff/short%20o%20aw.png",
  u: "Pics%20for%20Lessons%20and%20Stuff/short%20u.png"
});

const TT_INTRO_21_SCENES = [
  {
    id: "welcome",
    layout: "welcome",
    kicker: "Listen closely",
    headline: "Some sounds stick together.",
    subhead: "We call them welded sounds because their sounds are hard to pull apart.",
    cue: "Say: Today we will meet sounds that are welded together. Listen first, then say each one with me."
  },
  {
    id: "ang",
    layout: "family",
    kicker: "The -ng family",
    headline: "ang",
    subhead: "ang - fang - /ang/",
    items: TT_INTRO_21_NG.slice(0, 1),
    cue: "Point to ang. Say: ang - fang - /ang/. Have students repeat."
  },
  {
    id: "ing",
    layout: "family",
    kicker: "The -ng family",
    headline: "Add ing",
    subhead: "ing - ring - /ing/",
    items: TT_INTRO_21_NG.slice(0, 2),
    cue: "Point to ing. Say: ing - ring - /ing/. Students repeat, then read ang and ing."
  },
  {
    id: "ong",
    layout: "family",
    kicker: "The -ng family",
    headline: "Add ong",
    subhead: "ong - song - /ong/",
    items: TT_INTRO_21_NG.slice(0, 3),
    cue: "Point to ong. Say: ong - song - /ong/. Students repeat, then read across."
  },
  {
    id: "ung",
    layout: "family",
    kicker: "The -ng family",
    headline: "Add ung",
    subhead: "ung - lung - /ung/",
    items: TT_INTRO_21_NG,
    cue: "Point to ung. Say: ung - lung - /ung/. Model the row once; students repeat and then read it independently."
  },
  {
    id: "ank",
    layout: "family",
    kicker: "The -nk family",
    headline: "ank",
    subhead: "ank - bank - /ank/",
    items: TT_INTRO_21_NK.slice(0, 1),
    cue: "Begin the second family. Point to ank. Say: ank - bank - /ank/. Students repeat."
  },
  {
    id: "ink",
    layout: "family",
    kicker: "The -nk family",
    headline: "Add ink",
    subhead: "ink - pink - /ink/",
    items: TT_INTRO_21_NK.slice(0, 2),
    cue: "Point to ink. Say: ink - pink - /ink/. Students repeat, then read ank and ink."
  },
  {
    id: "onk",
    layout: "family",
    kicker: "The -nk family",
    headline: "Add onk",
    subhead: "onk - honk - /onk/",
    items: TT_INTRO_21_NK.slice(0, 3),
    cue: "Point to onk. Say: onk - honk - /onk/. Students repeat, then read across."
  },
  {
    id: "unk",
    layout: "family",
    kicker: "The -nk family",
    headline: "Add unk",
    subhead: "unk - junk - /unk/",
    items: TT_INTRO_21_NK,
    cue: "Point to unk. Say: unk - junk - /unk/. Model the row once; students repeat and then read it independently."
  },
  {
    id: "pairs",
    layout: "pairs",
    kicker: "Read across",
    headline: "Match the vowel. Notice the ending.",
    subhead: "/ang/ - /ank/   /ing/ - /ink/   /ong/ - /onk/   /ung/ - /unk/",
    pairs: [["ang", "ank"], ["ing", "ink"], ["ong", "onk"], ["ung", "unk"]],
    cue: "Point across each pair and say both sounds. Students repeat, then read all four rows independently."
  },
  {
    id: "one-unit",
    layout: "focus",
    kicker: "One welded unit",
    headline: "Three letters stay together.",
    subhead: "The sounds are closely welded, so we read the whole green card as one unit.",
    items: [{ text: "ink", keyword: "pink", type: "welded" }],
    cue: "Keep the explanation simple. Do not introduce digraph-versus-blend terminology unless a student asks."
  },
  {
    id: "tap-sink",
    layout: "build",
    kicker: "Watch the tap",
    headline: "Tap sink in two parts.",
    subhead: "/s/ - /ink/ - sink",
    word: "sink",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ink", type: "welded", tap: 3 }
    ],
    cue: "Tap /s/ once. Then bring three fingers down together for /ink/. Blend: sink."
  },
  {
    id: "build-sang",
    layout: "build",
    kicker: "Build and blend",
    headline: "Slide s in front of ang.",
    subhead: "/s/ - /ang/ - sang",
    word: "sang",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ang", type: "welded", tap: 3 }
    ],
    cue: "Model the two taps, then sweep beneath the cards and blend the word: sang."
  },
  {
    id: "swap-sank",
    layout: "build",
    kicker: "Change one card",
    headline: "Swap ang for ank.",
    subhead: "/s/ - /ank/ - sank",
    word: "sank",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ank", type: "welded", tap: 3 }
    ],
    cue: "Point out that only the welded card changed. Students tap and blend sank."
  },
  {
    id: "turn-hung",
    layout: "build",
    kicker: "Your turn",
    headline: "Tap it. Blend it.",
    subhead: "What word do these cards make?",
    word: "hung",
    items: [
      { text: "h", type: "consonant", tap: 1 },
      { text: "ung", type: "welded", tap: 3 }
    ],
    cue: "Pause. Let students tap and blend independently. Reveal the spoken word only after they respond."
  },
  {
    id: "turn-pink",
    layout: "build",
    kicker: "Your turn",
    headline: "Tap it. Blend it.",
    subhead: "What word do these cards make?",
    word: "pink",
    items: [
      { text: "p", type: "consonant", tap: 1 },
      { text: "ink", type: "welded", tap: 3 }
    ],
    cue: "Pause again for an independent response. If accurate, move on without requiring tapping on every later word."
  },
  {
    id: "suffix-rings",
    layout: "build",
    kicker: "Add a suffix",
    headline: "Read the base word first.",
    subhead: "ring - rings",
    word: "rings",
    wordNote: "Tap ring only if needed. The suffix is not tapped.",
    items: [
      { text: "r", type: "consonant", tap: 1 },
      { text: "ing", type: "welded", tap: 3 },
      { text: "-s", type: "suffix", tap: 0 }
    ],
    cue: "Read the base word ring. Then add -s and read rings. Do not tap the suffix."
  },
  {
    id: "box-it",
    layout: "mark",
    kicker: "Mark the concept",
    headline: "Box the welded sound.",
    subhead: "The box shows the letters that stay together.",
    items: [
      { text: "long", mark: "ong" },
      { text: "ring", mark: "ing" },
      { text: "hung", mark: "ung" },
      { text: "bank", mark: "ank" },
      { text: "think", mark: "ink" },
      { text: "junk", mark: "unk" }
    ],
    cue: "Have students box the welded sound in each word. This matches the 2.1 notebook marking routine."
  },
  {
    id: "finish",
    layout: "finish",
    kicker: "Ready to practice",
    headline: "Eight welded sounds. One strong idea.",
    subhead: "Read each green card as one welded unit.",
    items: TT_INTRO_21_NG.concat(TT_INTRO_21_NK),
    cue: "Quickly point in mixed order. Students read each sound. Then close the intro and continue with the regular Section 2 practice words."
  }
];

const TT_INTRO_21_DISCOVERY_SCENES = [
  {
    id: "discover-ng",
    layout: "notice",
    kicker: "Visual discovery",
    headline: "What do you notice?",
    subhead: "Look across the four cards. What stays the same? What changes?",
    items: TT_INTRO_21_NG,
    cue: "Wait. Let students name anything they notice. If needed, ask: What are the last two letters on every card?"
  },
  {
    id: "reveal-ng",
    layout: "pattern",
    kicker: "Check the pattern",
    headline: "The ending stays the same.",
    subhead: "Each card ends in ng. Only the first vowel changes.",
    items: TT_INTRO_21_NG.map((item) => ({ ...item, mark: "ng" })),
    cue: "Trace the shared ng ending from left to right. Have students name the changing vowels: a, i, o, u."
  },
  {
    id: "discover-nk",
    layout: "notice",
    kicker: "Visual discovery",
    headline: "Can you find the next pattern?",
    subhead: "What stays the same in this row? What changes?",
    items: TT_INTRO_21_NK,
    cue: "Pause again. Students should discover the shared nk ending and the changing vowel."
  },
  {
    id: "reveal-nk",
    layout: "pattern",
    kicker: "Check the pattern",
    headline: "The ending is nk this time.",
    subhead: "The vowels still change in the same order: a, i, o, u.",
    items: TT_INTRO_21_NK.map((item) => ({ ...item, mark: "nk" })),
    cue: "Confirm what students noticed. Read only after they have described the visual pattern."
  },
  {
    id: "discover-pairs",
    layout: "pairs",
    kicker: "Compare across",
    headline: "What changes in each pair?",
    subhead: "The vowel stays put. Look closely at the last letter.",
    pairs: [["ang", "ank"], ["ing", "ink"], ["ong", "onk"], ["ung", "unk"]],
    cue: "Students compare each pair. Ask: Which letter changed? What happened to the sound when g became k?"
  },
  {
    id: "reveal-pairs",
    layout: "pairs",
    kicker: "Check the pattern",
    headline: "g changes to k.",
    subhead: "The vowel matches across every row.",
    pairs: [["ang", "ank"], ["ing", "ink"], ["ong", "onk"], ["ung", "unk"]],
    cue: "Point to the matching vowel in each row, then to the final g and k. Read the pairs together."
  },
  {
    id: "keywords-ng",
    layout: "keywords",
    kicker: "Keyword check",
    headline: "Which picture helps each sound?",
    subhead: "Name the picture, then say the welded sound.",
    items: TT_INTRO_21_NG,
    cue: "Invite students to identify the pictures before you say the keywords: fang, ring, song, lung. Then use the routine sound - keyword - sound."
  },
  {
    id: "keywords-nk",
    layout: "keywords",
    kicker: "Keyword check",
    headline: "Match the second family.",
    subhead: "Use the picture when the vowel sound feels uncertain.",
    items: TT_INTRO_21_NK,
    cue: "Students identify bank, pink, honk, and junk. Practice sound - keyword - sound."
  },
  {
    id: "listen-first",
    layout: "listen",
    kicker: "Auditory discovery",
    headline: "Listen without looking.",
    subhead: "What changes when you hear /ang/, /ing/, /ong/, /ung/?",
    cue: "Have students close their eyes. Say the four sounds slowly without naming letters. Ask what changed and what stayed alike."
  },
  {
    id: "listen-check",
    layout: "pattern",
    kicker: "Connect sound to print",
    headline: "The vowel changes what we hear.",
    subhead: "The ng ending stays welded together.",
    items: TT_INTRO_21_NG.map((item) => ({ ...item, mark: item.text.charAt(0) })),
    cue: "Reveal the print. Point to each vowel as students repeat the sound they heard."
  },
  {
    id: "ang-ing",
    layout: "contrast",
    kicker: "Common mix-up",
    headline: "Can your mouth show the difference?",
    subhead: "Compare ang and ing before naming either one.",
    items: [TT_INTRO_21_NG[0], TT_INTRO_21_NG[1]],
    wordNote: "ang: open wide for the a sound | ing: smaller mouth for the i sound",
    cue: "This is a frequent 2.1 error. Students often make ang sound like ing when the mouth does not open enough. Let them observe your mouth, mirror it, then use fang and ring to check."
  },
  {
    id: "ank-ink",
    layout: "contrast",
    kicker: "Common mix-up",
    headline: "Try the same mouth check.",
    subhead: "Compare ank and ink. Which one needs the wider opening?",
    items: [TT_INTRO_21_NK[0], TT_INTRO_21_NK[1]],
    wordNote: "ank: open wide for the a sound | ink: smaller mouth for the i sound",
    cue: "This is another frequent error. Have students discover that ank begins with the wider a mouth. Use bank and pink as the correction keywords."
  },
  {
    id: "ong-ung",
    layout: "contrast",
    kicker: "Listen closely",
    headline: "Do these vowels sound the same?",
    subhead: "Compare ong and ung, then use the pictures to check.",
    items: [TT_INTRO_21_NG[2], TT_INTRO_21_NG[3]],
    wordNote: "ong: song | ung: lung",
    cue: "Students also confuse ong and ung. Elicit the difference first, then anchor each response to song or lung rather than overexplaining the mouth position."
  },
  {
    id: "ang-ong",
    layout: "contrast",
    kicker: "A less common mix-up",
    headline: "Which keyword proves it?",
    subhead: "Compare ang and ong without guessing from the ending.",
    items: [TT_INTRO_21_NG[0], TT_INTRO_21_NG[2]],
    wordNote: "ang: fang | ong: song",
    cue: "Some students occasionally confuse ang and ong. Ask for the keyword that matches each sound, then contrast fang and song."
  },
  {
    id: "tap-sink-discovery",
    layout: "build",
    kicker: "Discover the tap",
    headline: "How many taps will sink need?",
    subhead: "Decide before the dots confirm it.",
    word: "sink",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ink", type: "welded", tap: 3 }
    ],
    cue: "Ask first. Then point to the dots: one finger for /s/, three fingers together for /ink/. Blend sink."
  },
  {
    id: "build-sang-discovery",
    layout: "build",
    kicker: "Build from the pattern",
    headline: "Which welded card finishes sang?",
    subhead: "Choose it, tap it, then blend.",
    word: "sang",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ang", type: "welded", tap: 3 }
    ],
    cue: "Let students supply ang before reading the card. Tap and blend only after they explain their choice."
  },
  {
    id: "swap-sank-discovery",
    layout: "build",
    kicker: "Change one thing",
    headline: "How could sang become sank?",
    subhead: "Find the one letter that must change.",
    word: "sank",
    items: [
      { text: "s", type: "consonant", tap: 1 },
      { text: "ank", type: "welded", tap: 3 }
    ],
    cue: "Students explain that final g changes to k while the vowel stays a. Then tap and blend sank."
  },
  {
    id: "suffix-rings-discovery",
    layout: "build",
    kicker: "Add a suffix",
    headline: "What changes when -s joins ring?",
    subhead: "Read the base word first, then add the suffix.",
    word: "rings",
    wordNote: "Tap ring only if needed. The suffix is not tapped.",
    items: [
      { text: "r", type: "consonant", tap: 1 },
      { text: "ing", type: "welded", tap: 3 },
      { text: "-s", type: "suffix", tap: 0 }
    ],
    cue: "Notice the wider suffix card and its hyphen. Students read ring, attach -s, and read rings without tapping the suffix."
  },
  {
    id: "mark-ng-question",
    layout: "mark",
    kicker: "Your eyes do the work",
    headline: "Which welded sound should we box?",
    subhead: "Tell me what you see in each word. The next click checks your answer.",
    items: [{ text: "long" }, { text: "ring" }, { text: "hung" }],
    cue: "Do not advance until students name ong, ing, and ung. Ask them to explain where each box begins and ends."
  },
  {
    id: "mark-ng-answer",
    layout: "mark",
    kicker: "Check the marking",
    headline: "Did your boxes match?",
    subhead: "Each box holds the complete welded sound.",
    items: [{ text: "long", mark: "ong" }, { text: "ring", mark: "ing" }, { text: "hung", mark: "ung" }],
    cue: "Confirm or correct. Read each word once after checking the box."
  },
  {
    id: "mark-nk-question",
    layout: "mark",
    kicker: "Try the nk family",
    headline: "Where would your box go?",
    subhead: "Name the welded sound first. Click Next to reveal it.",
    items: [{ text: "bank" }, { text: "junk" }, { text: "think" }],
    cue: "Students identify ank, unk, and ink and describe the box placement before the reveal."
  },
  {
    id: "mark-nk-answer",
    layout: "mark",
    kicker: "Check the marking",
    headline: "The welded unit stays inside the box.",
    subhead: "Read the whole word after checking the concept.",
    items: [{ text: "bank", mark: "ank" }, { text: "junk", mark: "unk" }, { text: "think", mark: "ink" }],
    cue: "Confirm each response and connect it back to the matching keyword if pronunciation needs support."
  },
  {
    id: "notebook",
    layout: "notebook",
    kicker: "Add to Notebook",
    headline: "Record the two welded-sound families.",
    subhead: "Student Notebook pages 6 and 7",
    items: TT_INTRO_21_NG.concat(TT_INTRO_21_NK),
    cue: "Students add or review the ng entry on page 6 and the nk entry on page 7. Include each sound, keyword, and sound pronunciation, then box the welded sounds in the example words shown."
  },
  {
    id: "discovery-finish",
    layout: "finish",
    kicker: "Say what you discovered",
    headline: "What makes these eight sounds a family?",
    subhead: "Explain the pattern in your own words before practice begins.",
    items: TT_INTRO_21_NG.concat(TT_INTRO_21_NK),
    cue: "Listen for: the vowels change; ng or nk stays together; the three-letter welded sound is read as one unit. Then continue with the first 2.1 charting page."
  }
];

const TT_INTRO_35_DISCOVERY_SCENES = [
  {
    id: "suffix-memory-question",
    layout: "build",
    kicker: "Visual discovery",
    headline: "What changed when -s joined bug?",
    subhead: "Read the small word first. Then look at the yellow card.",
    word: "bug → bugs",
    items: [
      { text: "bug", type: "base" },
      { text: "-s", type: "suffix" }
    ],
    cue: "Pause for student observations. Listen for: bug stayed the same, -s was added at the end, and the word became bugs."
  },
  {
    id: "suffix-memory-answer",
    layout: "build",
    kicker: "Check the idea",
    headline: "The base word stays. The suffix joins the end.",
    subhead: "A suffix is a word element added to the end of a base word.",
    word: "bug + -s = bugs",
    wordNote: "-s begins with a consonant, so it is a consonant suffix.",
    items: [
      { text: "bug", type: "base" },
      { text: "-s", type: "suffix" }
    ],
    cue: "Name the two parts: base word bug and suffix -s. Briefly review that suffixes may begin with a consonant or a vowel."
  },
  {
    id: "new-suffixes-question",
    layout: "suffixes",
    kicker: "Meet two new endings",
    headline: "What do you notice about -ed and -ing?",
    subhead: "Look at the first letter of each suffix before naming the kind.",
    items: [
      { text: "-ed", type: "suffix" },
      { text: "-ing", type: "suffix" }
    ],
    cue: "Wait. Students should notice that both endings begin with a vowel. Keep the yellow suffix cards separate from the base word."
  },
  {
    id: "new-suffixes-answer",
    layout: "suffixes",
    kicker: "Check the pattern",
    headline: "Both are vowel suffixes.",
    subhead: "-ed begins with e. -ing begins with i.",
    items: [
      { text: "-ed", type: "suffix", mark: "e" },
      { text: "-ing", type: "suffix", mark: "i" }
    ],
    cue: "Confirm that vowel suffix means the suffix begins with a vowel. Students read and spell each suffix from the yellow card."
  },
  {
    id: "rent-base",
    layout: "build",
    kicker: "Start with the base",
    headline: "Read this word before anything is added.",
    subhead: "This is the word we will protect every time.",
    word: "rent",
    items: [{ text: "rent", type: "base" }],
    cue: "Students read rent. Identify it as the base word. Do not add a suffix until rent is secure."
  },
  {
    id: "rent-ing-question",
    layout: "build",
    kicker: "Add a vowel suffix",
    headline: "Which part should we read first?",
    subhead: "Think before reading the whole word.",
    word: "?",
    items: [
      { text: "rent", type: "base" },
      { text: "-ing", type: "suffix" }
    ],
    cue: "Pause. Require the response rent before students blend the whole word. Ask: What is the suffix?"
  },
  {
    id: "rent-ing-answer",
    layout: "build",
    kicker: "Base first",
    headline: "rent — renting",
    subhead: "Read the word without the suffix, then the whole word.",
    word: "rent → renting",
    wordNote: "Base word: rent   •   Suffix: -ing",
    items: [
      { text: "rent", type: "base" },
      { text: "-ing", type: "suffix" }
    ],
    cue: "Use the exact base-first oral routine: rent—renting. Then ask students to name the base word and suffix."
  },
  {
    id: "rent-ed-question",
    layout: "build",
    kicker: "Change one card",
    headline: "What changes when -ed replaces -ing?",
    subhead: "Name the base word and suffix before reading the result.",
    word: "?",
    items: [
      { text: "rent", type: "base" },
      { text: "-ed", type: "suffix" }
    ],
    cue: "Let students supply rent and -ed. Ask what -ed tells us about the action."
  },
  {
    id: "rent-ed-answer",
    layout: "build",
    kicker: "Past action",
    headline: "rent — rented",
    subhead: "-ed shows that the action happened in the past.",
    word: "rent → rented",
    wordNote: "For now, -ed says /ĕd/ or /id/.",
    items: [
      { text: "rent", type: "base" },
      { text: "-ed", type: "suffix" }
    ],
    cue: "Read rent—rented. Explain that the e in this -ed sound is a schwa and may sound like /id/. Do not introduce /d/ or /t/ pronunciations yet."
  },
  {
    id: "ed-sound-guardrail",
    layout: "listen",
    kicker: "Auditory discovery",
    headline: "What ending do you hear?",
    subhead: "rented   landed   melted",
    wordNote: "Right now, -ed says /ĕd/ or /id/.",
    cue: "Say rented, landed, and melted. Students repeat and identify the extra syllable. Use only current 3.5 words whose -ed ending says /ĕd/ or /id/."
  },
  {
    id: "base-hunt-question",
    layout: "base-hunt",
    kicker: "Find what stayed",
    headline: "Say each word without its suffix.",
    subhead: "Do the thinking before the next click reveals the bases.",
    items: [
      { text: "fishing", type: "word" },
      { text: "landed", type: "word" },
      { text: "melting", type: "word" },
      { text: "funded", type: "word" }
    ],
    cue: "Students say fish, land, melt, and fund. Ask them to name each suffix too. Do not reveal the bases early."
  },
  {
    id: "base-hunt-answer",
    layout: "base-hunt",
    kicker: "Check the bases",
    headline: "The base word is still inside.",
    subhead: "Read base first, then whole word.",
    items: [
      { text: "fishing", type: "word", keyword: "fish", mark: "ing" },
      { text: "landed", type: "word", keyword: "land", mark: "ed" },
      { text: "melting", type: "word", keyword: "melt", mark: "ing" },
      { text: "funded", type: "word", keyword: "fund", mark: "ed" }
    ],
    cue: "Point to each whole word. Students respond fish—fishing, land—landed, melt—melting, fund—funded."
  },
  {
    id: "base-first-question",
    layout: "base-hunt",
    kicker: "Use the routine",
    headline: "What should your voice say first?",
    subhead: "planting   rested   checking",
    items: [
      { text: "planting", type: "word" },
      { text: "rested", type: "word" },
      { text: "checking", type: "word" }
    ],
    cue: "Pause for plant, rest, and check. Ask students why naming the base first makes a longer word easier to read and spell."
  },
  {
    id: "base-first-answer",
    layout: "base-hunt",
    kicker: "Read in two steps",
    headline: "Base word first. Whole word second.",
    subhead: "Keep this order every time.",
    items: [
      { text: "planting", type: "word", keyword: "plant", mark: "ing" },
      { text: "rested", type: "word", keyword: "rest", mark: "ed" },
      { text: "checking", type: "word", keyword: "check", mark: "ing" }
    ],
    cue: "Choral read: plant—planting, rest—rested, check—checking. Keep the pace brisk once the routine is accurate."
  },
  {
    id: "meaning-contrast",
    layout: "meaning",
    kicker: "Meaning discovery",
    headline: "Which word shows an action that happened in the past?",
    subhead: "Read the word without the suffix first: rest—resting; rest—rested.",
    items: [
      { text: "resting", type: "suffix", keyword: "suffix: -ing", mark: "ing" },
      { text: "rested", type: "suffix", keyword: "-ed: action happened in the past", mark: "ed" }
    ],
    cue: "Use Wilson's questions: What is the word without the suffix? What is the suffix? What does -ed mean when it is added to a word? Confirm that rested shows an action that happened in the past."
  },
  {
    id: "mark-reading-question",
    layout: "suffix-mark",
    kicker: "Your eyes do the work",
    headline: "Where are the base and suffix?",
    subhead: "Tell where you would underline and circle. Then check.",
    items: [
      { text: "drafted", type: "word" },
      { text: "checking", type: "word" }
    ],
    cue: "Students identify draft + ed and check + ing. Ask which part is underlined and which part is circled."
  },
  {
    id: "mark-reading-answer",
    layout: "suffix-mark",
    kicker: "Check the marking",
    headline: "Underline the base. Circle the suffix.",
    subhead: "The marks show the two word elements.",
    items: [
      { text: "drafted", type: "word", keyword: "draft", mark: "ed" },
      { text: "checking", type: "word", keyword: "check", mark: "ing" }
    ],
    cue: "Confirm the marking, then read draft—drafted and check—checking."
  },
  {
    id: "first-lesson-roadmap",
    layout: "roadmap",
    kicker: "Start here",
    headline: "Today, keep the base word unchanged.",
    subhead: "Begin with one-syllable base words. Longer structures come in later lessons.",
    items: [
      { text: "rent + -ing", type: "today", keyword: "Today: one-syllable base" },
      { text: "publish + -ing", type: "later", keyword: "Later: multisyllabic base" },
      { text: "un- + fold + -ed", type: "later", keyword: "Later: prefix + base + suffix" }
    ],
    cue: "This boundary follows the manual. Do not teach multisyllabic, prefixed, or complex-base examples in the introductory lesson; show them only as a future roadmap."
  },
  {
    id: "spell-bridge",
    layout: "routine",
    kicker: "Section 7 • Spelling",
    headline: "Use the Wilson spelling prompts in order.",
    subhead: "Tap a one-syllable base. For a multisyllabic base, say each syllable.",
    items: [
      { text: "1", keyword: "Say the whole word" },
      { text: "2", keyword: "Say it without the suffix" },
      { text: "3", keyword: "Tap it out • or say each syllable" },
      { text: "4", keyword: "Spell the base word" },
      { text: "5", keyword: "Say and spell the suffix" }
    ],
    cue: "Follow Wilson's sequence: Say the whole word. Say it without the suffix. For a one-syllable base, tap it out; for a multisyllabic base, say each syllable. Spell the base word. Then touch, say, and spell the suffix."
  },
  {
    id: "spell-landed-hidden",
    layout: "spell",
    kicker: "Spelling discovery",
    headline: "Say landed.",
    subhead: "Say it without the suffix.",
    word: "landed",
    items: [
      { text: "?", type: "syllable-blank", keyword: "base word" },
      { text: "?", type: "suffix-blank", keyword: "suffix" }
    ],
    cue: "Place a blank white Syllable Card and the yellow -ed Suffix Card facedown. Dictate landed. Prompt: Say landed. Say it without the suffix. The student says land."
  },
  {
    id: "spell-landed-base",
    layout: "spell",
    kicker: "Spell the base first",
    headline: "Tap out land. Then spell l-a-n-d.",
    subhead: "Touch and say the base word before spelling it.",
    word: "land",
    items: [
      { text: "land", type: "base", keyword: "l-a-n-d" },
      { text: "?", type: "suffix-blank", keyword: "suffix waits" }
    ],
    cue: "Prompt: Tap out land. Then have the student touch and say the base word land and spell l-a-n-d. Keep the suffix facedown until the base word is complete."
  },
  {
    id: "spell-landed-suffix",
    layout: "spell",
    kicker: "Add the suffix",
    headline: "Touch and say /ĕd/. Spell e-d.",
    subhead: "Read the word without the suffix first: land—landed.",
    word: "land → landed",
    items: [
      { text: "land", type: "base", keyword: "l-a-n-d" },
      { text: "-ed", type: "suffix", keyword: "e-d" }
    ],
    cue: "Have the student touch and say the suffix /ĕd/, then spell e-d. To check, the student immediately reads the word without the suffix first and then the whole word: land—landed."
  },
  {
    id: "spell-melting-question",
    layout: "spell",
    kicker: "Try the routine",
    headline: "Say melting. Say it without the suffix.",
    subhead: "Tap out melt. Spell the base before adding the suffix.",
    word: "melting",
    items: [
      { text: "?", type: "syllable-blank", keyword: "base word" },
      { text: "?", type: "suffix-blank", keyword: "suffix" }
    ],
    cue: "Prompt in order: Say melting. Say it without the suffix. Tap out melt. Then have the student touch and say melt and spell m-e-l-t."
  },
  {
    id: "spell-melting-answer",
    layout: "spell",
    kicker: "Check the parts",
    headline: "Touch and say -ing. Spell i-n-g.",
    subhead: "Read the word without the suffix first: melt—melting.",
    word: "melt → melting",
    items: [
      { text: "melt", type: "base", keyword: "m-e-l-t" },
      { text: "-ing", type: "suffix", keyword: "i-n-g" }
    ],
    cue: "Have the student touch and say the suffix -ing and spell i-n-g. To check, read the word without the suffix first and then the whole word: melt—melting. Practice lasted, lasting, funded, or funding the same way."
  },
  {
    id: "mark-spelling-question",
    layout: "suffix-mark",
    kicker: "Mark what you spelled",
    headline: "Show the base and suffix.",
    subhead: "Decide where the underline and circle belong before the reveal.",
    items: [
      { text: "drafted", type: "word" },
      { text: "checking", type: "word" }
    ],
    cue: "Students point to the base and suffix in each word. Ask them to explain which mark belongs to each element."
  },
  {
    id: "mark-spelling-answer",
    layout: "suffix-mark",
    kicker: "Check the word elements",
    headline: "Base underlined. Suffix circled.",
    subhead: "The dash stays on the left side of a suffix card.",
    items: [
      { text: "drafted", type: "word", keyword: "draft", mark: "ed" },
      { text: "checking", type: "word", keyword: "check", mark: "ing" }
    ],
    cue: "Confirm the markings. Point out the left-side dash on -ed and -ing; a prefix card would place the dash on the right."
  },
  {
    id: "suffix-notebook",
    layout: "suffix-notebook",
    kicker: "Add to Notebook",
    headline: "Add the 3.5 entries on pages 23 and 24.",
    subhead: "Student Notebook • Word Elements • Suffixes",
    items: [
      { text: "-ing", type: "suffix", keyword: "fishing", mark: "ing" },
      { text: "-ed", type: "suffix", keyword: "rented", mark: "ed" },
      { text: "checking", type: "word", keyword: "check", mark: "ing" }
    ],
    cue: "Page 23: add fishing and rented under The Most Common Suffixes and review marking check(ing). Page 24: add fishing beside -ing and rented beside the /ĕd/ form of -ed under Vowel Suffixes."
  },
  {
    id: "suffix-finish",
    layout: "routine",
    kicker: "Say what you discovered",
    headline: "Use the same spelling sequence every time.",
    subhead: "Say it → say it without the suffix → tap or syllabicate → spell the base → spell the suffix.",
    items: [
      { text: "1", keyword: "Say the whole word" },
      { text: "2", keyword: "Say it without the suffix" },
      { text: "3", keyword: "Tap it out • or say each syllable" },
      { text: "4", keyword: "Spell the base word" },
      { text: "5", keyword: "Say and spell the suffix" }
    ],
    cue: "Have students repeat Wilson's sequence in order. Then read the word without the suffix first and the whole word to check. Remind them that 3.5 uses unchanged base words and -ed only as /ĕd/ or /id/."
  }
];

function ttIntro21Scene() {
  const scenes = ttIntro21Scenes();
  return scenes[ttIntro21Index] || scenes[0];
}

function ttIntro21Scenes() {
  if (ttIntro21Variant === "discovery35") return TT_INTRO_35_DISCOVERY_SCENES;
  return ttIntro21Variant === "discovery" ? TT_INTRO_21_DISCOVERY_SCENES : TT_INTRO_21_SCENES;
}

function ttIntro21SoundCardsHtml(items = []) {
  return `<div class="intro-family-grid">${items.map((item) => `
    <article class="intro-sound-card">
      <strong>${escapeHtml(item.text)}</strong>
      ${item.keyword ? `<span>${escapeHtml(item.keyword)} - /${escapeHtml(item.text)}/</span>` : ""}
    </article>
  `).join("")}</div>`;
}

function ttIntro21PatternCardsHtml(items = []) {
  return `<div class="intro-family-grid intro-pattern-grid">${items.map((item) => {
    const text = String(item.text || "");
    const mark = String(item.mark || "");
    const index = mark ? text.indexOf(mark) : -1;
    const marked = index < 0
      ? escapeHtml(text)
      : `${escapeHtml(text.slice(0, index))}<b>${escapeHtml(mark)}</b>${escapeHtml(text.slice(index + mark.length))}`;
    return `<article class="intro-sound-card"><strong>${marked}</strong></article>`;
  }).join("")}</div>`;
}

function ttIntro21KeywordArtHtml(item, compact = false) {
  const imageKey = String(item?.imageKey || item?.text || "").toLowerCase();
  const imageSrc = TT_INTRO_21_CARD_IMAGE_PATHS[imageKey] || "";
  return `<article class="intro-keyword-card ${compact ? "compact" : ""}">
    ${imageSrc ? `<img class="intro-keyword-art" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.keyword || imageKey)} keyword card">` : ""}
    <div><strong>${escapeHtml(item.text || "")}</strong><span>${escapeHtml(item.keyword || "")} - /${escapeHtml(item.text || "")}/</span></div>
  </article>`;
}

function ttIntro21KeywordGridHtml(items = [], compact = false) {
  return `<div class="intro-keyword-grid ${compact ? "compact" : ""}">${items.map((item) => ttIntro21KeywordArtHtml(item, compact)).join("")}</div>`;
}

function ttIntro21MouthGridHtml(items = []) {
  return `<div class="intro-mouth-grid">${items.map((item) => {
    const vowel = String(item?.text || "").charAt(0).toLowerCase();
    const imageSrc = TT_INTRO_21_MOUTH_IMAGE_PATHS[vowel] || "";
    return imageSrc ? `<figure><img src="${escapeHtml(imageSrc)}" alt="Short ${escapeHtml(vowel)} mouth position"><figcaption>short ${escapeHtml(vowel)}</figcaption></figure>` : "";
  }).join("")}</div>`;
}

function ttIntro21BuildHtml(scene) {
  return `<div class="intro-build-stage">
    <div class="intro-build-row">${(scene.items || []).map((item) => `
      <span class="intro-build-card ${escapeHtml(item.type || "consonant")}">
        ${Number(item.tap || 0) ? `<span class="intro-tap-cue" aria-label="${Number(item.tap)} finger tap">${Array.from({ length: Number(item.tap) }, () => "<i></i>").join("")}</span>` : ""}
        ${escapeHtml(item.text)}
      </span>
    `).join("")}</div>
    <div class="intro-build-word">${escapeHtml(scene.word || "")}${scene.wordNote ? `<small>${escapeHtml(scene.wordNote)}</small>` : ""}</div>
  </div>`;
}

function ttIntro21MarkedWordHtml(item) {
  const word = String(item?.text || "");
  const mark = String(item?.mark || "");
  const index = mark ? word.lastIndexOf(mark) : -1;
  if (index < 0) return `<span class="intro-mark-word">${escapeHtml(word)}</span>`;
  return `<span class="intro-mark-word">${escapeHtml(word.slice(0, index))}<b>${escapeHtml(mark)}</b>${escapeHtml(word.slice(index + mark.length))}</span>`;
}

function ttIntro35SegmentedWordHtml(item, className = "") {
  const word = String(item?.text || "");
  const suffix = String(item?.mark || "");
  const index = suffix ? word.lastIndexOf(suffix) : -1;
  if (index < 0) return `<span class="${escapeHtml(className)}">${escapeHtml(word)}</span>`;
  const base = word.slice(0, index);
  return `<span class="${escapeHtml(className)}"><u>${escapeHtml(base)}</u><b>${escapeHtml(suffix)}</b></span>`;
}

function ttIntro35VisualHtml(scene) {
  const items = scene.items || [];
  if (scene.layout === "build") return ttIntro21BuildHtml(scene);
  if (scene.layout === "suffixes") {
    return `<div class="intro-suffix-grid">${items.map((item) => {
      const text = String(item.text || "");
      const mark = String(item.mark || "");
      const index = mark ? text.indexOf(mark) : -1;
      const display = index < 0
        ? escapeHtml(text)
        : `${escapeHtml(text.slice(0, index))}<b>${escapeHtml(mark)}</b>${escapeHtml(text.slice(index + mark.length))}`;
      return `<article><strong>${display}</strong><span>yellow suffix card</span></article>`;
    }).join("")}</div>`;
  }
  if (scene.layout === "listen") {
    return `<div class="intro-listen intro-suffix-listen" aria-label="Listen carefully">
      <div class="intro-listen-bars" aria-hidden="true">${Array.from({ length: 7 }, () => "<i></i>").join("")}</div>
      <strong>rented · landed · melted</strong>
      ${scene.wordNote ? `<small>${escapeHtml(scene.wordNote)}</small>` : ""}
    </div>`;
  }
  if (scene.layout === "base-hunt") {
    return `<div class="intro-base-hunt-grid">${items.map((item) => `<article>
      ${ttIntro35SegmentedWordHtml(item, "intro-base-hunt-word")}
      <span>${item.keyword ? `base: ${escapeHtml(item.keyword)}` : "Find the base word"}</span>
    </article>`).join("")}</div>`;
  }
  if (scene.layout === "meaning") {
    return `<div class="intro-meaning-grid">${items.map((item) => `<article>
      ${ttIntro35SegmentedWordHtml(item, "intro-meaning-word")}
      <span>${escapeHtml(item.keyword || "")}</span>
    </article>`).join("")}</div>`;
  }
  if (scene.layout === "suffix-mark") {
    return `<div class="intro-suffix-mark-grid">${items.map((item) => ttIntro35SegmentedWordHtml(item, "intro-suffix-mark-word")).join("")}</div>`;
  }
  if (scene.layout === "roadmap") {
    return `<div class="intro-roadmap">${items.map((item) => `<article class="${escapeHtml(item.type || "later")}">
      <span>${escapeHtml(item.keyword || "")}</span><strong>${escapeHtml(item.text || "")}</strong>
    </article>`).join("")}</div>`;
  }
  if (scene.layout === "routine") {
    return `<div class="intro-routine-grid">${items.map((item) => `<article>
      <strong>${escapeHtml(item.text || "")}</strong><span>${escapeHtml(item.keyword || "")}</span>
    </article>`).join("")}</div>`;
  }
  if (scene.layout === "spell") {
    return `<div class="intro-spell-stage">
      <strong>${escapeHtml(scene.word || "")}</strong>
      <div>${items.map((item) => `<article class="${escapeHtml(item.type || "base")}">
        <b>${escapeHtml(item.text || "")}</b><span>${escapeHtml(item.keyword || "")}</span>
      </article>`).join("")}</div>
    </div>`;
  }
  if (scene.layout === "suffix-notebook") {
    const suffixes = items.filter((item) => item.type === "suffix");
    const markedWord = items.find((item) => item.type === "word");
    const ing = suffixes.find((item) => item.text === "-ing");
    const ed = suffixes.find((item) => item.text === "-ed");
    return `<div class="intro-suffix-notebook-pages">
      <article class="intro-suffix-notebook">
        <header><span>Word Elements</span><em>page 23</em></header>
        <h3>Suffixes</h3>
        <div class="intro-notebook-equations">
          <p><span>fish + ing =</span><strong>${escapeHtml(ing?.keyword || "fishing")}</strong></p>
          <p><span>rent + ed =</span><strong>${escapeHtml(ed?.keyword || "rented")}</strong></p>
        </div>
        <footer><span>Mark Words</span>${ttIntro35SegmentedWordHtml(markedWord, "intro-suffix-mark-word")}</footer>
      </article>
      <article class="intro-suffix-notebook">
        <header><span>Word Elements</span><em>page 24</em></header>
        <h3>Vowel Suffixes</h3>
        <div class="intro-notebook-vowels">
          <p><b>-ing</b><strong>${escapeHtml(ing?.keyword || "fishing")}</strong></p>
          <p><b>-ed /ĕd/</b><strong>${escapeHtml(ed?.keyword || "rented")}</strong></p>
        </div>
      </article>
    </div>`;
  }
  return "";
}

function ttIntro21VisualHtml(scene) {
  if (ttIntro21Variant === "discovery35") return ttIntro35VisualHtml(scene);
  if (scene.layout === "welcome") {
    return `<div class="intro-welcome">
      <div class="intro-welcome-mark" aria-label="Three letters welded together"><span>i</span><span>n</span><span>k</span></div>
      <strong>See it. Say it. Tap it. Blend it.</strong>
    </div>`;
  }
  if (scene.layout === "family" || scene.layout === "notice") {
    const items = scene.layout === "notice"
      ? (scene.items || []).map((item) => ({ ...item, keyword: "" }))
      : scene.items;
    return ttIntro21SoundCardsHtml(items);
  }
  if (scene.layout === "pattern") return ttIntro21PatternCardsHtml(scene.items);
  if (scene.layout === "keywords") return ttIntro21KeywordGridHtml(scene.items);
  if (scene.layout === "pairs") {
    return `<div class="intro-pair-grid">${scene.pairs.map((pair) => `
      <div class="intro-pair"><span>${escapeHtml(pair[0])}</span><span class="intro-pair-arrow">to</span><span>${escapeHtml(pair[1])}</span></div>
    `).join("")}</div>`;
  }
  if (scene.layout === "focus") {
    return `<div class="intro-focus-sound">
      ${ttIntro21SoundCardsHtml(scene.items)}
      <div class="intro-letter-count"><span><i></i><i></i><i></i> three letters</span><span>one welded card</span></div>
    </div>`;
  }
  if (scene.layout === "build") return ttIntro21BuildHtml(scene);
  if (scene.layout === "mark") {
    return `<div class="intro-mark-grid">${(scene.items || []).map(ttIntro21MarkedWordHtml).join("")}</div>`;
  }
  if (scene.layout === "listen") {
    return `<div class="intro-listen" aria-label="Listen carefully">
      <div class="intro-listen-bars" aria-hidden="true">${Array.from({ length: 7 }, () => "<i></i>").join("")}</div>
      <strong>Listen. Compare. Tell what changed.</strong>
    </div>`;
  }
  if (scene.layout === "contrast") {
    const notes = String(scene.wordNote || "").split("|").map((note) => note.trim()).filter(Boolean);
    return `<div class="intro-contrast">
      ${ttIntro21KeywordGridHtml(scene.items, true)}
      ${ttIntro21MouthGridHtml(scene.items)}
      <div class="intro-mouth-cues">${notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}</div>
    </div>`;
  }
  if (scene.layout === "notebook") {
    const ng = (scene.items || []).filter((item) => String(item.text || "").endsWith("ng"));
    const nk = (scene.items || []).filter((item) => String(item.text || "").endsWith("nk"));
    const sheet = (title, page, items, examples) => `<article class="intro-notebook-sheet">
      <header><span>Welded Sounds</span><strong>${escapeHtml(title)}</strong><em>p. ${escapeHtml(page)}</em></header>
      <div class="intro-notebook-entries">${items.map((item) => `<div><b>${escapeHtml(item.text)}</b><span>${escapeHtml(item.keyword)}</span><i>/${escapeHtml(item.text)}/</i></div>`).join("")}</div>
      <footer><span>Mark Words</span>${examples.map(ttIntro21MarkedWordHtml).join("")}</footer>
    </article>`;
    return `<div class="intro-notebook-grid">
      ${sheet("ng", "6", ng, [{ text: "long", mark: "ong" }, { text: "ring", mark: "ing" }, { text: "hung", mark: "ung" }])}
      ${sheet("nk", "7", nk, [{ text: "bank", mark: "ank" }, { text: "junk", mark: "unk" }, { text: "think", mark: "ink" }])}
    </div>`;
  }
  if (scene.layout === "finish") {
    return `<div class="intro-finish">${ttIntro21SoundCardsHtml(scene.items)}<strong>Ready for word practice</strong></div>`;
  }
  return "";
}

function ttIntro21CardDisplayPayload() {
  const scene = ttIntro21Scene();
  const scenes = ttIntro21Scenes();
  const isIntro35 = ttIntro21Variant === "discovery35";
  const intro35SpellingStart = scenes.findIndex((item) => item.id === "spell-bridge");
  const isIntro35Spelling = isIntro35 && intro35SpellingStart >= 0 && ttIntro21Index >= intro35SpellingStart;
  const pairItems = (scene.pairs || []).flatMap((pair, pairIndex) => pair.map((text) => ({ text, type: "welded", pair: String(pairIndex) })));
  return {
    kind: isIntro35 ? "intro-35" : "intro-21",
    variant: ttIntro21Variant,
    layout: scene.layout,
    key: `${isIntro35 ? "intro-35" : "intro-21"}-${scene.id}`,
    sectionLabel: isIntro35
      ? `${isIntro35Spelling || ttIntroSourceSection === "section7"
        ? "Section 7"
        : ttIntroSourceSection === "section2b" ? "Section 2B" : "Section 2"} - Intro 3.5`
      : `${ttIntroSourceSection === "section2b" ? "Section 2B" : "Section 2"} - Intro 2.1`,
    headline: scene.headline || "",
    subhead: scene.subhead || "",
    word: scene.word || "",
    wordNote: scene.wordNote || "",
    label: isIntro35 ? "Suffix discovery" : "Welded sounds introduction",
    position: `${ttIntro21Index + 1} of ${scenes.length}`,
    teacherMirror: ttIntroTeacherMirror,
    teacherView: {
      substepLabel: isIntro35 ? "Substep 3.5" : "Substep 2.1",
      title: isIntro35
        ? "Suffixes -ed and -ing Visual Discovery"
        : ttIntro21Variant === "discovery"
          ? "Welded Sounds Visual Discovery"
          : "Welded Sounds Introduction",
      kicker: scene.kicker || (isIntro35 ? "Intro 3.5" : "Intro 2.1"),
      headline: scene.headline || "",
      subhead: scene.subhead || "",
      visualHtml: ttIntro21VisualHtml(scene),
      cue: scene.cue || "",
      progress: `${ttIntro21Index + 1} of ${scenes.length}`,
      progressIndex: ttIntro21Index,
      progressTotal: scenes.length
    },
    items: (scene.items || pairItems).map((item) => ({
      text: item.text || "",
      type: item.type || "welded",
      keyword: item.keyword || "",
      imageKey: item.imageKey || "",
      pair: item.pair || "",
      tap: Number(item.tap || 0),
      mark: item.mark || ""
    }))
  };
}

function ttRenderIntro21() {
  const overlay = ttById("ttIntro21");
  const target = ttById("ttIntro21Scene");
  if (!overlay || !target || overlay.hidden) return;
  const scene = ttIntro21Scene();
  const scenes = ttIntro21Scenes();
  const substepLabel = ttById("ttIntro21SubstepLabel");
  if (substepLabel) {
    substepLabel.textContent = ttIntro21Variant === "discovery35" ? "Substep 3.5" : "Substep 2.1";
  }
  target.classList.remove("intro-scene-enter");
  target.innerHTML = `<div class="intro-scene-inner">
    <header class="intro-scene-heading">
      <span class="intro-scene-kicker">${escapeHtml(scene.kicker || "Intro 2.1")}</span>
      <h2>${escapeHtml(scene.headline || "")}</h2>
      <p>${escapeHtml(scene.subhead || "")}</p>
    </header>
    <div class="intro-scene-visual">${ttIntro21VisualHtml(scene)}</div>
  </div>`;
  requestAnimationFrame(() => target.classList.add("intro-scene-enter"));
  ttById("ttIntro21Cue").textContent = scene.cue || "";
  ttById("ttIntro21Title").textContent = ttIntro21Variant === "discovery35"
    ? "Suffixes -ed and -ing Visual Discovery"
    : ttIntro21Variant === "discovery"
      ? "Welded Sounds Visual Discovery"
      : "Welded Sounds Introduction";
  ttById("ttIntro21Progress").textContent = `${ttIntro21Index + 1} of ${scenes.length}`;
  ttById("ttIntro21Dots").innerHTML = scenes.map((_, index) => `<i class="${index === ttIntro21Index ? "active" : index < ttIntro21Index ? "complete" : ""}"></i>`).join("");
  ttById("ttIntro21Back").disabled = ttIntro21Index === 0;
  ttById("ttIntro21Next").textContent = ttIntro21Index === scenes.length - 1 ? "Finish" : "Next";
  ttUpdateIntroDisplayControls();
  ttSendStudentDisplay(ttStudentDisplayPayload("follow"));
}

function ttUpdateIntroDisplayControls() {
  const mirrorButton = ttById("ttIntroMirrorToggle");
  if (mirrorButton) {
    mirrorButton.textContent = ttIntroTeacherMirror ? "Use Stage view" : "Mirror teacher";
    mirrorButton.classList.toggle("active", ttIntroTeacherMirror);
    mirrorButton.setAttribute("aria-pressed", String(ttIntroTeacherMirror));
  }
}

function ttToggleIntroTeacherMirror() {
  ttIntroTeacherMirror = !ttIntroTeacherMirror;
  if (ttIsNativeIpadShell()) {
    ttSetNativeProjectionMode(ttIntroTeacherMirror ? "mirror" : "stage");
  } else {
    if (!ttStudentDisplayWindow || ttStudentDisplayWindow.closed) ttOpenStudentDisplay("follow");
    else ttSendStudentDisplay(ttStudentDisplayPayload("follow"));
  }
  ttUpdateIntroDisplayControls();
}

function ttSetIntro21BackgroundInert(active) {
  const overlay = ttById("ttIntro21");
  [...document.body.children].forEach((element) => {
    if (
      element === overlay
      || element.tagName === "SCRIPT"
      || element.matches?.(".presentation-dock, #ttGlobalInkPalette, #ttGlobalInkCanvas, #ttLaserCanvas")
    ) return;
    element.inert = active;
    if (active) {
      element.dataset.ttIntro21AriaHidden = element.hasAttribute("aria-hidden")
        ? element.getAttribute("aria-hidden")
        : "__none__";
      element.setAttribute("aria-hidden", "true");
    } else if (element.dataset.ttIntro21AriaHidden !== undefined) {
      const previous = element.dataset.ttIntro21AriaHidden;
      if (previous === "__none__") element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", previous);
      delete element.dataset.ttIntro21AriaHidden;
    }
  });
}

function ttOpenIntro21(variant = "guided", sourceSection = "section2", launchButtonId = "") {
  const overlay = ttById("ttIntro21");
  if (!overlay) return;
  ttIntro21Index = 0;
  ttIntro21Variant = variant === "discovery" ? "discovery" : "guided";
  ttIntroSourceSection = sourceSection === "section2b" ? "section2b" : "section2";
  ttIntroLaunchButtonId = launchButtonId || (ttIntro21Variant === "discovery" ? "ttOpenIntro21Discovery" : "ttOpenIntro21");
  ttIntro21Open = true;
  ttIntroTeacherMirror = false;
  overlay.hidden = false;
  ttSetIntro21BackgroundInert(true);
  document.body.classList.add("intro-lesson-open");
  ttSetNativeProjectionMode("stage");
  ttStudentDisplayMode = "follow";
  localStorage.setItem("teachToday.studentDisplayMode", "follow");
  ttToggleGlobalInkPalette(true);
  ttSetGlobalInkActive(false);
  ttRenderIntro21();
  ttById("ttIntro21Next")?.focus();
}

function ttOpenIntro35(startSceneId = "suffix-memory-question", sourceSection = "section2", launchButtonId = "ttOpenIntro35Discovery") {
  const overlay = ttById("ttIntro21");
  if (!overlay) return;
  ttIntro21Variant = "discovery35";
  ttIntro21Index = Math.max(0, TT_INTRO_35_DISCOVERY_SCENES.findIndex((scene) => scene.id === startSceneId));
  ttIntroSourceSection = ["section2b", "section7"].includes(sourceSection) ? sourceSection : "section2";
  ttIntroLaunchButtonId = launchButtonId;
  ttIntro21Open = true;
  ttIntroTeacherMirror = false;
  overlay.hidden = false;
  overlay.setAttribute("aria-label", "Substep 3.5 visual discovery lesson");
  ttSetIntro21BackgroundInert(true);
  document.body.classList.add("intro-lesson-open");
  ttSetNativeProjectionMode("stage");
  ttStudentDisplayMode = "follow";
  localStorage.setItem("teachToday.studentDisplayMode", "follow");
  ttToggleGlobalInkPalette(true);
  ttSetGlobalInkActive(false);
  ttRenderIntro21();
  ttById("ttIntro21Next")?.focus();
}

function ttCloseIntro21() {
  const overlay = ttById("ttIntro21");
  if (!overlay) return;
  overlay.hidden = true;
  ttIntro21Open = false;
  ttIntroTeacherMirror = false;
  ttSetNativeProjectionMode("stage");
  ttToggleLaser(false);
  ttSetGlobalInkActive(false);
  ttClearGlobalInk();
  ttSetIntro21BackgroundInert(false);
  document.body.classList.remove("intro-lesson-open");
  ttToggleGlobalInkPalette(document.body.classList.contains("presentation-mode"));
  ttStudentDisplayFollowKey = "";
  ttSyncFollowingStudentDisplay({ force: true });
  overlay.setAttribute("aria-label", "Substep 2.1 introductory lesson");
  ttById(ttIntroLaunchButtonId)?.focus();
}

function ttStepIntro21(direction) {
  const scenes = ttIntro21Scenes();
  const nextIndex = ttIntro21Index + direction;
  if (nextIndex >= scenes.length) {
    ttCloseIntro21();
    return;
  }
  ttIntro21Index = Math.max(0, nextIndex);
  ttRenderIntro21();
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

function ttFillSection2BReplacementTools(lesson, skill) {
  const currentSelect = ttById("ttCurrentWordSelectB2");
  if (currentSelect) {
    const words = [...new Set([].concat(lesson.realWords || [], lesson.nonsenseWords || []).filter(isUsableReaderWord))];
    currentSelect.innerHTML = `<option value="">Pick from charting page...</option>${words.map((word) => `<option value="${escapeHtml(word)}">${escapeHtml(word)}</option>`).join("")}`;
  }
  const categorySelect = ttById("ttReviewCategoryB2");
  if (categorySelect) {
    const categories = section2ReviewCategories();
    categorySelect.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join("");
    ttFillSection2BReviewCategoryWords(categorySelect.value || categories[0]?.id || "", skill.id);
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

function ttFillSection2BReviewCategoryWords(categoryId, currentSubstep) {
  const container = ttById("ttReviewReplacementWordsB2");
  if (!container) return;
  const words = section2ReviewWordsForCategory(categoryId, currentSubstep).slice(0, 18);
  container.innerHTML = "";
  words.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = word;
    button.addEventListener("click", () => ttShowSection2BWordByDeck(word, currentSubstep));
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

function ttReplaceSection2BWord(kind, oldWord) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const key = kind === "current" ? "sectionTwoCurrentWordsB2" : "sectionTwoReviewWordsB2";
  const current = ttLesson[key] || [];
  const pool = kind === "current"
    ? (ttLesson.realWords || []).concat(ttLesson.nonsenseWords || [])
    : section2ReviewWordsForCategory(ttById("ttReviewCategoryB2")?.value || "blends", skill.id)
      .concat(dictationReviewWords(skill.id, ttLesson.readerLevel || "AB"), priorDictationWords(skill.id, ttLesson.readerLevel || "AB"));
  ttLesson[key] = current.map((word) => word === oldWord ? ttPickReplacement(pool, current, oldWord) : word);
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
  const editor = ttById("ttSection2EditorB2");
  if (!display || !hint) return;
  if (!options.preserveDeckIndex) {
    const deckIndex = ttSection2BDeck.findIndex((card) => card.word === word);
    if (deckIndex >= 0) ttSection2BIndex = deckIndex;
  }
  ttSection2BWord = word;
  display.innerHTML = "";
  if (editor) editor.hidden = true;
  if (!word) {
    display.innerHTML = "<span>Tap a Day 2 word</span>";
    ttRenderSection2BCount();
    hint.textContent = "One-syllable words show sound cards. Multisyllabic words show syllable cards.";
    ttRenderMarkedWords();
    ttSyncFollowingStudentDisplay({ force: true });
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
  ttRenderSection2BCount();
  ttRenderMarkedWords();
  ttSyncFollowingStudentDisplay({ force: true });
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
    ttLesson.sectionThreeDeckSeed = `${Date.now()}-${seedIndex}`;
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

function ttDeterministicTake(items, count, offset = 0) {
  const values = uniqueWords((items || []).filter(Boolean));
  if (!values.length || count <= 0) return [];
  const start = Math.abs(Number(offset) || 0) % values.length;
  return values.slice(start).concat(values.slice(0, start)).slice(0, count);
}

function ttRecentLessonEvidenceWords(group = ttActiveGroup(), limit = 40) {
  const rows = [];
  const push = (value, date, source) => {
    const clean = String(value || "").trim();
    if (clean) rows.push({ value: clean, date: Date.parse(date || 0) || 0, source });
  };
  (group?.encodingObservations || []).forEach((record) => {
    if (record.note === "encoding miss" && record.item) push(record.item, record.date, record.section || "encoding");
  });
  (group?.dictationMisses || []).forEach((record) => push(record.item || record.word, record.date, "dictation"));
  (group?.markedReviewWords || []).forEach((record) => push(record.word || record.item, record.date, record.source || "review"));
  rows.sort((left, right) => right.date - left.date);
  return uniqueWords(rows.map((row) => row.value)).slice(0, limit);
}

function ttEnhancedPageWords(lesson, skill) {
  const enhanced = ttEnhancedPlanning();
  const page = enhanced?.findPage?.(
    skill.id,
    lesson.readerLevel || "AB",
    lesson.wordlistPageNumber
  );
  return uniqueWords(page?.w || lesson.realWords || []).filter(isValidDictationWord);
}

function ttEnhancedReviewWords(lesson, skill, limit = 80) {
  const enhanced = ttEnhancedPlanning();
  const evidence = ttRecentLessonEvidenceWords(ttActiveGroup(), limit);
  const indexed = enhanced?.reviewWordsBefore?.(skill.id, lesson.readerLevel || "AB", limit) || [];
  return ttRealWordCandidates(evidence.concat(indexed, ttReviewRealWordPool(lesson, skill)), lesson, skill).slice(0, limit);
}

function ttIndexedVowelLabel(value) {
  const labels = { a: "ă", e: "ĕ", i: "ĭ", o: "ŏ", u: "ŭ" };
  const clean = String(value || "").trim().toLowerCase();
  return labels[clean] || value;
}

function ttEnhancedReverseDrillOverride(skill, lesson) {
  const enhanced = ttEnhancedPlanning();
  if (!enhanced?.isCovered?.(skill.id)) return null;
  const sourceWords = ttEnhancedReviewWords(lesson, skill, 24);
  const soundGroups = enhanced.soundGroups(skill.id, sourceWords);
  const indexedElements = enhanced.wordElements(skill.id, sourceWords);
  const seed = Number(lesson.reverseDrillSeed || 0);
  const vowels = ttDeterministicTake(
    uniqueWords((soundGroups.vowels || []).map(ttIndexedVowelLabel)).filter((value) => vowelSoundList(skill.id).includes(value)),
    5,
    seed
  );
  const consonants = ttDeterministicTake(
    uniqueWords(soundGroups.consonants || []).filter((value) => consonantSoundList(skill.id).includes(value)),
    5,
    seed
  );
  const welded = ttDeterministicTake(
    uniqueWords(soundGroups.welded || []).filter((value) => ttKnownWeldedValues(skill.id).includes(value)),
    3,
    seed
  );
  const elements = ttDeterministicTake(
    uniqueWords(indexedElements).filter((value) => wordElementList(skill.id).includes(value)),
    2,
    seed
  );
  return []
    .concat(fillToCount(vowels, vowelSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(fillToCount(consonants, consonantSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat(fillToCount(welded, ttKnownWeldedValues(skill.id), 3).map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat(fillToCount(elements, wordElementList(skill.id), 2).map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
}

function ttBuildReverseDrillOverride(skill, lesson) {
  const enhanced = ttEnhancedReverseDrillOverride(skill, lesson);
  if (enhanced?.length) return enhanced;
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
  const dictationCurrent = ttDictationBookCurrentWordPool(lesson, skill);
  const dictationReview = ttDictationBookReviewWordPool([priorSubstep(skill.id)], lesson.readerLevel || "AB");
  const dictationNonsense = ttDictationBookNonsensePool(skill.id);
  if (dictationCurrent.length || dictationReview.length || dictationNonsense.length) {
    const offset = Number(lesson.sectionSevenSeed || 0);
    const review = ttDeterministicTake(dictationReview, 5, offset);
    const nonsense = ttDeterministicTake(dictationNonsense, 3, offset);
    const used = new Set(review.concat(nonsense).map(ttWordKey));
    const current = ttDeterministicTake(
      dictationCurrent.filter((word) => !used.has(ttWordKey(word))),
      5,
      offset
    );
    return { review, nonsense, current };
  }
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
  const dictationBookWords = ttDictationBookNonsensePool(skill.id);
  if (dictationBookWords.length) return dictationBookWords;
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
  const dictationBookWords = ttDictationBookCurrentWordPool(lesson, skill);
  if (dictationBookWords.length) return dictationBookWords;
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
    ttSyncFollowingStudentDisplay({ force: true });
    return;
  }
  ttCardIndex = (index + ttCardDeck.length) % ttCardDeck.length;
  const card = ttCardDeck[ttCardIndex];
  ttById("ttCardDisplay").querySelector("strong").textContent = card.word;
  ttById("ttCardLabel").textContent = card.label;
  ttById("ttCardDisplay").dataset.type = /hfw/i.test(card.type) ? "hfw" : card.type.toLowerCase();
  ttById("ttCardCount").textContent = `${ttCardIndex + 1} of ${ttCardDeck.length}`;
  ttSyncFollowingStudentDisplay({ force: true });
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
    ttSyncFollowingStudentDisplay({ force: true });
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
  ttSyncFollowingStudentDisplay({ force: true });
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

function ttUseCustomSection2BWord() {
  const input = ttById("ttSection2CustomWordB2");
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
  ttShowSection2BWord(clean, substep);
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

function ttCurrentSection2BCards() {
  if (!ttSection2BWord) return null;
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  return section2CardsForWord(ttSection2BWord, substep);
}

function ttEditSection2BCards() {
  const editor = ttById("ttSection2EditorB2");
  const input = ttById("ttSection2EditInputB2");
  if (!editor || !input || !ttSection2BWord) return;
  const cards = ttCurrentSection2BCards();
  input.value = cards?.items?.length ? cards.items.map(section2EditInputText).join(" ") : "";
  editor.hidden = false;
  input.focus();
  input.select();
}

function ttCancelSection2BEdit() {
  const editor = ttById("ttSection2EditorB2");
  if (editor) editor.hidden = true;
}

function ttSaveSection2BCards() {
  const input = ttById("ttSection2EditInputB2");
  const editor = ttById("ttSection2EditorB2");
  if (!input || !ttSection2BWord) return;
  const items = parseSection2CardInput(input.value, ttLesson?.substep || ttActiveGroup().substep);
  if (!items.length) return;
  const clean = cleanCardWord(ttSection2BWord);
  const overrides = section2CardOverrides();
  overrides[clean] = {
    mode: section2ModeForItems(items),
    items,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
  input.value = "";
  if (editor) editor.hidden = true;
  ttShowSection2BWord(ttSection2BWord, ttLesson?.substep || ttActiveGroup().substep);
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
  const dailyPlan = options.upsertDaily === false ? null : ttDailyPlanFor(group, scheduled);
  const existing = dailyPlan && !["Complete", "Incomplete", "Test"].includes(dailyPlan.status) ? dailyPlan : null;
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
    ttSyncCombinedLessonLinks(existing, group);
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
  ttSyncCombinedLessonLinks(plan, group);
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
  ttSyncCombinedLessonLinks(plan, group);
  saveState();
  ttUpdateSaveStatus(plan);
  ttRenderLessonTabs();
  ttRenderSavedLessons(group);
}

function ttStartCurrentLesson() {
  if (!ttLesson) ttBuildLesson();
  const group = ttActiveGroup();
  const openPlan = ttActiveOpenPlan(group);
  if (openPlan && openPlan.id !== ttLesson?.savedPlanId) {
    alert(`Lesson ${ttPlanLessonNumber(openPlan, openPlan.lessons?.[0], group)} is still open. Continue it or close it as incomplete before starting another lesson.`);
    ttShowHomeScreen(group.id);
    return;
  }
  ttLesson.scheduledDate ||= ttTodayKey();
  ttSaveCurrentLesson({ render: false, starting: true, reason: "Started teaching" });
  ttArchiveCurrentLessonPlanPdf("Planned").catch((error) => {
    console.warn("Teach Today could not archive the planned lesson PDF:", error);
    ttShowBackupToast(`Planned lesson PDF needs attention. ${error.message || error}`, "warning");
  });
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
    openPlan.closedAt = new Date().toISOString();
    openPlan.closedReason = "Teacher chose End & Plan New";
    group.activeLessonPlanId = "";
    ttSyncCombinedLessonLinks(openPlan, group);
  } else if (openPlan && openPlan.id === ttLesson?.savedPlanId) {
    if (!confirm(`This lesson is still unfinished. Keep it as incomplete and plan a new lesson?`)) return;
    openPlan.status = "Incomplete";
    openPlan.closedAt = new Date().toISOString();
    openPlan.closedReason = "Teacher chose End & Plan New";
    group.activeLessonPlanId = "";
    ttSyncCombinedLessonLinks(openPlan, group);
  }
  ttSection2Word = "";
  ttPlannerGroupId = group.id;
  ttPlannerDraft = {};
  ttPickerSelections = {};
  ttPickerSubstepCache = {};
  ttReviewWordFilters = {};
  ttSection8RealSlots = [];
  ttSection8SoundElementsManual = false;
  const draft = ttEnsurePlannerDraft(group);
  draft.scheduledDate = ttTodayKey();
  history.replaceState(null, "", location.pathname);
  saveState();
  ttShowHomeScreen(group.id);
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
  ttSyncCombinedLessonLinks(plan, group);
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

function ttOpenExportViewer({ url, title, filename, contentType = "pdf", bytes = null, archiveDownload = false }) {
  const overlay = ttById("ttExportViewer");
  const frame = ttById("ttExportViewerFrame");
  const titleEl = ttById("ttExportViewerTitle");
  if (!overlay || !frame) return;
  overlay._exportBlobUrl = url;
  overlay._exportFilename = filename;
  overlay._exportContentType = contentType;
  overlay._exportBytes = bytes;
  overlay._archiveDownload = archiveDownload;
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
  overlay._exportBytes = null;
  overlay._archiveDownload = false;
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
      contentType: "pdf",
      bytes: pdfBytes,
      archiveDownload: fillable
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

function ttDocumentBytesBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function ttDocumentSha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ttLessonPlanArchiveFileName(group, lesson, plan, stage) {
  const date = dateKey(lesson?.scheduledDate || plan?.scheduledDate || new Date());
  const lessonNumber = lesson?.lessonSequence || plan?.lessonNumber || group?.lessonSerial || "Lesson";
  const archiveIdentity = ttLessonPlanArchiveIdentity(lesson, plan);
  const safeGroup = String(group?.name || "Group")
    .replace(/[^a-z0-9 ._()-]+/gi, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Group";
  return `${date} - ${safeGroup} - Lesson ${lessonNumber} - ${archiveIdentity} - ${stage.toLowerCase()}.pdf`;
}

function ttLessonPlanArchiveIdentity(lesson = ttLesson, plan = ttCurrentPlan()) {
  const source = String(plan?.id || lesson?.savedPlanId || lesson?.id || [
    lesson?.scheduledDate || plan?.scheduledDate || "",
    lesson?.lessonSequence || plan?.lessonNumber || "",
    plan?.savedAt || lesson?.created || ""
  ].join("|"));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `id-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function ttLessonPlanGroupFolderName(group = ttActiveGroup()) {
  return String(group?.name || "Group")
    .replace(/[^a-z0-9 ._()-]+/gi, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Group";
}

function ttNativeDocumentAvailable() {
  return document.documentElement.dataset.teachTodayNativeDocuments === "1"
    && Boolean(window.webkit?.messageHandlers?.teachTodayDocument);
}

function ttSaveNativeLessonPlanPdf(bytes, digest, fileName, stage, groupFolder) {
  return new Promise((resolve, reject) => {
    if (!ttNativeDocumentAvailable()) {
      reject(new Error("Run the latest Stage build from Xcode to enable automatic lesson-plan files."));
      return;
    }
    const requestId = crypto.randomUUID?.() || `document-${Date.now()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("teachTodayNativeDocumentResult", onResult);
      reject(new Error("The iPad lesson-plan file did not finish saving."));
    }, 20000);
    function onResult(event) {
      if (event.detail?.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener("teachTodayNativeDocumentResult", onResult);
      if (!event.detail.ok) {
        reject(new Error(event.detail.error || "The iPad lesson-plan file failed."));
        return;
      }
      resolve(event.detail);
    }
    window.addEventListener("teachTodayNativeDocumentResult", onResult);
    window.webkit.messageHandlers.teachTodayDocument.postMessage({
      requestId,
      contentBase64: ttDocumentBytesBase64(bytes),
      sha256: digest,
      fileName,
      stage,
      groupFolder
    });
  });
}

async function ttSaveDriveLessonPlanPdf(bytes, fileName, stage, groupFolder) {
  if (!ttDriveAccessToken) throw new Error("Google Drive is not connected in this app session.");
  const root = await ttDriveNamedFolder(ttIndependentDriveFolderName);
  const lessonPlans = await ttDriveNamedFolder("Lesson Plans", root);
  const groupFolderId = await ttDriveNamedFolder(groupFolder, lessonPlans);
  const stageFolder = await ttDriveNamedFolder(stage, groupFolderId);
  const blob = new Blob([bytes], { type: "application/pdf" });
  return ttDriveUpsertBackup(stageFolder, fileName, blob, "application/pdf");
}

async function ttSaveDownloadedLessonPlanPdf(bytes, fileName) {
  const stage = "Downloaded";
  const groupFolder = ttLessonPlanGroupFolderName();
  const archiveIdentity = ttLessonPlanArchiveIdentity();
  const archiveBaseName = String(fileName || "Teach Today Fillable Lesson Plan")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9 ._()-]+/gi, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 145) || "Teach Today Fillable Lesson Plan";
  const archiveFileName = `${archiveBaseName} - ${archiveIdentity}.pdf`;
  const digest = await ttDocumentSha256Hex(bytes);
  const saved = [];
  const failures = [];
  try {
    await ttSaveNativeLessonPlanPdf(bytes, digest, archiveFileName, stage, groupFolder);
    saved.push("iPad Files");
  } catch (error) {
    failures.push(`iPad Files: ${error.message}`);
  }
  if (localStorage.getItem(ttIndependentBackupEnabledKey) === "true") {
    if (!ttDriveAccessToken) {
      failures.push("Google Drive: reconnect Drive backup in Records for this app session.");
    } else {
      try {
        await ttSaveDriveLessonPlanPdf(bytes, archiveFileName, stage, groupFolder);
        saved.push("Google Drive");
      } catch (error) {
        failures.push(`Google Drive: ${ttFriendlyDriveError(error)}`);
      }
    }
  }
  if (saved.length) ttShowBackupToast(`Downloaded fillable lesson plan saved to ${saved.join(" and ")}.`, failures.length ? "warning" : "success");
  if (failures.length) ttShowBackupToast(`Downloaded lesson plan needs attention. ${failures.join(" ")}`, "warning");
  if (!saved.length) throw new Error(failures.join(" ") || "No lesson-plan destination was available.");
}

async function ttArchiveCurrentLessonPlanPdf(stage = "Planned") {
  if (!ttIsNativeIpadShell() || !ttLesson) return;
  const group = ttActiveGroup();
  const plan = ttCurrentPlan();
  if (!group || !plan) return;
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(group);
  const savedDate = plan.savedAt ? new Date(plan.savedAt) : new Date();
  const pdfBytes = await ttBuildWilsonLessonPlanPdf(group, skill, ttLesson, plan, savedDate, { fillable: true });
  const digest = await ttDocumentSha256Hex(pdfBytes);
  const fileName = ttLessonPlanArchiveFileName(group, ttLesson, plan, stage);
  const groupFolder = ttLessonPlanGroupFolderName(group);
  const results = { savedAt: new Date().toISOString(), fileName, localPath: "", driveFileId: "" };
  const failures = [];

  try {
    const local = await ttSaveNativeLessonPlanPdf(pdfBytes, digest, fileName, stage, groupFolder);
    results.localPath = local.path || `Lesson Plans/${groupFolder}/${stage}/${fileName}`;
  } catch (error) {
    failures.push(`iPad Files: ${error.message}`);
  }
  if (localStorage.getItem(ttIndependentBackupEnabledKey) === "true") {
    if (!ttDriveAccessToken) {
      failures.push("Google Drive: reconnect Drive backup in Records for this app session; the iPad copy is safe.");
    } else {
      try {
        const drive = await ttSaveDriveLessonPlanPdf(pdfBytes, fileName, stage, groupFolder);
        results.driveFileId = drive.id || "";
        results.driveWebViewLink = drive.webViewLink || "";
      } catch (error) {
        failures.push(`Google Drive: ${ttFriendlyDriveError(error)}`);
      }
    }
  }

  plan.lessonPlanArchives ||= {};
  plan.lessonPlanArchives[stage.toLowerCase()] = results;
  saveState();
  const destination = [results.localPath ? "iPad Files" : "", results.driveFileId ? "Google Drive" : ""].filter(Boolean).join(" and ");
  if (destination) ttShowBackupToast(`${stage} fillable lesson plan saved to ${destination}.`, failures.length ? "warning" : "success");
  if (failures.length) {
    ttShowBackupToast(`${stage} lesson plan needs attention. ${failures.join(" ")}`, "warning");
    console.warn("Teach Today lesson-plan archive:", failures.join(" "));
  }
}

function ttWilsonCompletedLessonSummary(group, lesson, plan) {
  if (plan?.status !== "Complete") return "";
  const wrapUp = plan.wrapUp || {};
  const attendance = Object.entries(wrapUp.attendance || {});
  const present = attendance.filter(([, value]) => value === true).map(([name]) => name);
  const absent = attendance.filter(([, value]) => value === false).map(([name]) => name);
  const evidence = ttTodaysLessonData(group, lesson);
  const observedItems = uniqueWords(evidence.dictation.concat(evidence.encoding)
    .map((record) => record.item || record.note || record.category)
    .filter(Boolean))
    .slice(0, 12);
  return [
    wrapUp.note ? `Teacher notes: ${wrapUp.note}` : "",
    attendance.length ? `Attendance: ${present.length}/${attendance.length} present${absent.length ? `; absent: ${absent.join(", ")}` : ""}` : "",
    `Saved evidence: ${wrapUp.chartRecordCount ?? evidence.chart.length} chart record(s); ${(wrapUp.dictationMissCount ?? evidence.dictation.length) + (wrapUp.encodingMarkCount ?? evidence.encoding.length)} Section 6-8 mark(s).`,
    observedItems.length ? `Observed/missed items: ${observedItems.join(", ")}` : "",
    wrapUp.recommendation ? `Next step: ${wrapUp.recommendation}` : ""
  ].filter(Boolean).join("\n");
}

function ttWilsonCompletedLessonNotes(group, lesson, plan) {
  if (plan?.status !== "Complete") return "";
  const evidence = ttTodaysLessonData(group, lesson);
  const studentName = (record) => record?.student || "Group";
  const students = uniqueWords(ttTeachingStudents(group, lesson?.scheduledDate).concat(
    evidence.chart.concat(evidence.dictation, evidence.encoding).map(studentName)
  ));
  const chartLines = students.flatMap((student) => evidence.chart
    .filter((record) => studentName(record) === student)
    .map((record) => {
      const half = titleCase(record.chartHalf || "chart");
      const status = record.automaticity ? "Auto" : record.accuracy ? "Acc" : "Strug";
      const wordRecords = (record.wordRecords || []).filter((item) => !record.chartHalf || item.section === record.chartHalf);
      const correctWords = wordRecords.filter((item) => item.correct).map((item) => item.word).filter(Boolean);
      const missedWords = wordRecords.filter((item) => !item.correct).map((item) => {
        if (!item.word) return "";
        return item.said ? `${item.word} -> ${item.said}` : item.word;
      }).filter(Boolean);
      const fallbackMisses = (record.wrongWords || []).filter(Boolean);
      const misses = missedWords.length ? missedWords : fallbackMisses;
      return [
        `${student} - CHARTING: Reader ${record.reader || lesson?.reader || "--"}, p. ${record.wordlistPage || lesson?.wordlistPageNumber || "--"}, ${half}; ${record.correct ?? "--"}/${record.total || 15}, ${record.seconds || "--"} sec, ${record.wcpm || wcpmForRecord(record) || "--"} wcpm, ${status}.`,
        correctWords.length ? `  Correct: ${correctWords.join(", ")}.` : "",
        `  Missed: ${misses.length ? misses.join(", ") : "none"}.`,
        record.notes ? `  Chart notes: ${record.notes}` : "",
        record.recommendation ? `  Recommendation: ${record.recommendation}` : ""
      ].filter(Boolean).join("\n");
    }));

  const sectionEightDictationKeys = new Set(evidence.dictation.map((record) => [
    studentName(record),
    String(record.category || "").toLowerCase(),
    String(record.item || record.word || "").toLowerCase()
  ].join("|")));
  const observationRecords = evidence.encoding.filter((record) => {
    if (record.section !== "section8" || record.note !== "encoding miss") return true;
    return !sectionEightDictationKeys.has([
      studentName(record),
      String(record.category || "").toLowerCase(),
      String(record.item || "").toLowerCase()
    ].join("|"));
  }).concat(evidence.dictation.map((record) => ({ ...record, section: "section8", note: "encoding miss" })));
  const observationLines = students.flatMap((student) => ["section6", "section7", "section8"].map((section) => {
    const records = observationRecords.filter((record) => studentName(record) === student && record.section === section);
    if (!records.length) return "";
    const details = [];
    const seen = new Set();
    records.forEach((record) => {
      const code = record.observationCode || (record.note === "encoding miss" ? "Miss" : record.note) || "Observation";
      const target = record.item || record.category || "general";
      const category = record.item && record.category ? ` (${record.category})` : "";
      const detail = `${target}${category}: ${code}`;
      const key = detail.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        details.push(detail);
      }
    });
    return `${student} - SECTION ${section.replace("section", "")}: ${details.join("; ")}.`;
  }).filter(Boolean));

  return [ttWilsonCompletedLessonSummary(group, lesson, plan)].concat(chartLines, observationLines).filter(Boolean).join("\n\n");
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
    "Student Name/Group": ttTeachingStudents(group, lesson?.scheduledDate).join(", "),
    "Substep": skill.id,
    "CONCEPTS TO WEAVE": concept,
    "TROUBLE SPOTS": ttWilsonTroubleSpots(group, lesson),
    "1 SQD Vowels": sounds.vowels,
    "1 SQD CONSONANTS": sounds.consonants,
    "1 SQD WELDED": sounds.welded,
    "1 SQD ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "1 SQD DRILL LEADER IF GROUP": ttTeachingStudents(group, lesson?.scheduledDate).join(", "),
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
    "10 LRF Notes": ttWilsonCompletedLessonSummary(group, lesson, plan),
    "Additional Notes": ttWilsonCompletedLessonNotes(group, lesson, plan)
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
    const length = String(value || "").length;
    if (name === "Additional Notes") {
      field.enableMultiline();
      field.setFontSize(length > 5200 ? 6 : length > 3400 ? 6.75 : length > 1800 ? 7.5 : 8.25);
    } else if (length > 120 || String(value || "").includes("\n")) field.setFontSize(7.5);
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
  const students = ttTeachingStudents(group, lesson?.scheduledDate).map((student) => `<span>${escapeHtml(student)}</span>`).join("");
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
const ttFirebaseSafetyDbName = "teachTodayFirebaseSafety.v1";
const ttFirebaseSafetyStore = "snapshots";
const ttFirebaseBaselineKey = "firebase-baseline";
const ttFirebaseSharedSignatureKey = "teachToday.firebaseSharedSignature.v1";
const ttFirebaseRecoveryIndexKey = "teachToday.firebaseRecoveryIndex.v1";
const ttFirebaseDeviceIdKey = "teachToday.firebaseDeviceId.v1";
const ttDriveScope = "https://www.googleapis.com/auth/drive.file";
const ttDriveFolderName = "Teach Today Recordings";
const ttIndependentDriveFolderName = "Teach Today Backups";
const ttIndependentBackupEnabledKey = "teachToday.independentDriveBackupsEnabled.v1";
const ttIndependentBackupStatusKey = "teachToday.independentBackupStatus.v1";
let ttFirebaseSdkPromise = null;
let ttFirebaseTimer = null;
let ttFirebaseBusy = false;
let ttFirebasePending = false;
let ttFirebaseUser = null; // set after Google sign-in
let ttFirebaseUnsubscribe = null;
let ttFirebaseWritingRevisionId = "";
let ttDriveAccessToken = "";
let ttDriveFolderId = localStorage.getItem("teachToday.driveFolderId") || "";
let ttWorkOffline = localStorage.getItem("teachToday.workOffline") === "true";
let ttConnectionConflict = false;
let ttFirebaseSafetyDbPromise = null;
let ttIndependentBackupBusy = false;
let ttIndependentBackupInFlight = null;
let ttBackupToastTimer = null;
let ttStageBackupTimer = null;
let ttStageBackupPending = false;
let ttStageBackupInFlight = null;

function ttQueueStageNativeBackup(options = {}) {
  if (!ttStageLocalOnlyMode()) return Promise.resolve();
  ttStageBackupPending = true;
  if (ttStageBackupTimer) {
    clearTimeout(ttStageBackupTimer);
    ttStageBackupTimer = null;
  }
  if (options.immediate) return ttFlushStageNativeBackup(options);
  ttStageBackupTimer = setTimeout(() => {
    ttStageBackupTimer = null;
    ttFlushStageNativeBackup().catch((error) => {
      ttSetIndependentBackupStatus(`iPad backup needs attention. ${error.message}`, { notify: true });
    });
  }, 1200);
  return Promise.resolve();
}

function ttFlushStageNativeBackup(options = {}) {
  if (!ttStageLocalOnlyMode()) return Promise.resolve();
  if (ttStageBackupTimer) {
    clearTimeout(ttStageBackupTimer);
    ttStageBackupTimer = null;
  }
  if (ttStageBackupInFlight) {
    ttStageBackupPending = true;
    return ttStageBackupInFlight;
  }
  if (!ttStageBackupPending && !options.force) return Promise.resolve();
  ttStageBackupPending = false;
  ttStageBackupInFlight = ttBackupCurrentStageState(options).finally(() => {
    ttStageBackupInFlight = null;
    if (ttStageBackupPending) ttQueueStageNativeBackup();
  });
  return ttStageBackupInFlight;
}

function ttFirebaseDeviceId() {
  let value = localStorage.getItem(ttFirebaseDeviceIdKey);
  if (!value) {
    value = crypto.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(ttFirebaseDeviceIdKey, value);
  }
  return value;
}

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

function ttBackupDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ttBackupWeekKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = monday.getDay() || 7;
  monday.setDate(monday.getDate() - weekday + 1);
  return ttBackupDateKey(monday);
}

async function ttSha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ttShowBackupToast(message, tone = "warning") {
  const toast = ttById("ttBackupToast");
  if (!toast) return;
  clearTimeout(ttBackupToastTimer);
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.hidden = false;
  ttBackupToastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}

function ttSetIndependentBackupStatus(message, options = {}) {
  const now = new Date().toISOString();
  localStorage.setItem(ttIndependentBackupStatusKey, message);
  localStorage.setItem("teachToday.lastIndependentBackupCheckAt", now);
  if (options.success) localStorage.setItem("teachToday.lastIndependentBackupAt", now);
  ttRenderDataCenter();
  if (options.notify) ttShowBackupToast(message, options.success ? "success" : "warning");
}

function ttIndependentBackupArtifact(envelope) {
  const payload = ttNormalizeFirebasePayload(envelope?.payload) || ttFirebasePayload();
  return {
    kind: "TeachTodayBackup",
    version: 2,
    exportedAt: new Date().toISOString(),
    appState: payload.appState,
    section2CardOverrides: payload.section2CardOverrides || {},
    source: {
      type: envelope?.revisionId ? "firebase-revision" : "local-shared-copy",
      revisionId: envelope?.revisionId || ""
    },
    backupPolicy: { dailyKeep: 10, weeklyKeep: "school-year", cleanupEnabled: false }
  };
}

function ttFirebaseSafety() {
  return window.TeachTodaySyncSafety;
}

function ttFirebasePayload(now = new Date(), state = appState, overrides = section2CardOverrides()) {
  const safety = ttFirebaseSafety();
  return {
    kind: "TeachTodayFirebaseShared",
    version: 2,
    exportedAt: now.toISOString(),
    appState: safety ? safety.sharedState(state) : state,
    section2CardOverrides: overrides || {}
  };
}

function ttNormalizeFirebasePayload(payload) {
  if (!payload) return null;
  const state = payload.appState || payload;
  if (!state?.groups || !Array.isArray(state.groups)) return null;
  const safety = ttFirebaseSafety();
  return {
    kind: "TeachTodayFirebaseShared",
    version: 2,
    exportedAt: payload.exportedAt || state.lastSavedAt || new Date().toISOString(),
    appState: safety ? safety.sharedState(state) : state,
    section2CardOverrides: payload.section2CardOverrides || {}
  };
}

function ttFirebasePayloadSignature(payload) {
  const normalized = ttNormalizeFirebasePayload(payload);
  if (!normalized) return "";
  return ttFirebaseSafety().signature({
    appState: normalized.appState,
    section2CardOverrides: normalized.section2CardOverrides
  });
}

function ttCurrentFirebaseSignature() {
  return ttFirebasePayloadSignature(ttFirebasePayload());
}

function ttFirebaseSafetyDb() {
  if (ttFirebaseSafetyDbPromise) return ttFirebaseSafetyDbPromise;
  ttFirebaseSafetyDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(ttFirebaseSafetyDbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ttFirebaseSafetyStore)) {
        request.result.createObjectStore(ttFirebaseSafetyStore);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return ttFirebaseSafetyDbPromise;
}

async function ttFirebaseSafetySet(key, value) {
  const db = await ttFirebaseSafetyDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(ttFirebaseSafetyStore, "readwrite");
    transaction.objectStore(ttFirebaseSafetyStore).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function ttFirebaseSafetyGet(key) {
  const db = await ttFirebaseSafetyDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(ttFirebaseSafetyStore, "readonly").objectStore(ttFirebaseSafetyStore).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function ttRecoveryIndex() {
  try {
    return JSON.parse(localStorage.getItem(ttFirebaseRecoveryIndexKey) || "[]");
  } catch {
    return [];
  }
}

async function ttPreserveLocalRecovery(reason = "Before cloud reconciliation") {
  const now = new Date();
  const key = `recovery:${now.toISOString()}:${ttFirebaseDeviceId()}`;
  const entry = { key, savedAt: now.toISOString(), reason, payload: ttBackupPayload(now) };
  await ttFirebaseSafetySet(key, entry);
  const index = [{ key, savedAt: entry.savedAt, reason }, ...ttRecoveryIndex().filter((item) => item.key !== key)].slice(0, 50);
  localStorage.setItem(ttFirebaseRecoveryIndexKey, JSON.stringify(index));
  localStorage.setItem("teachToday.lastRecoveryAt", entry.savedAt);
  ttRenderDataCenter();
  return entry;
}

async function ttStoreFirebaseBaseline(envelope) {
  if (!envelope?.payload) return;
  await ttFirebaseSafetySet(ttFirebaseBaselineKey, {
    revisionId: envelope.revisionId || "",
    payload: ttNormalizeFirebasePayload(envelope.payload),
    savedAt: new Date().toISOString()
  });
}

function ttDownloadPayload(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function ttDownloadLatestRecovery() {
  const latest = ttRecoveryIndex()[0];
  if (!latest) return;
  const entry = await ttFirebaseSafetyGet(latest.key);
  if (!entry?.payload) return;
  const stamp = latest.savedAt.slice(0, 16).replace("T", "-").replace(":", "");
  ttDownloadPayload(entry.payload, `teach-today-recovery-${stamp}.json`);
}

async function ttDownloadRecoveryBundle() {
  const recoveries = [];
  for (const item of ttRecoveryIndex()) {
    const entry = await ttFirebaseSafetyGet(item.key);
    if (!entry?.payload) continue;
    recoveries.push({
      savedAt: entry.savedAt || item.savedAt || "",
      reason: entry.reason || item.reason || "Protected recovery",
      payload: entry.payload
    });
  }
  if (!recoveries.length) return;
  const now = new Date();
  ttDownloadPayload({
    kind: "TeachTodayRecoveryBundle",
    version: 1,
    exportedAt: now.toISOString(),
    recoveries
  }, `teach-today-recovery-bundle-${ttBackupFileStamp(now)}.json`);
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
    return "Google Drive permission was denied. Open Records and connect Google Drive backup again.";
  }
  if (message.includes("401") || message.includes("invalid_token")) {
    return "Google Drive permission expired. Open Records and connect Google Drive backup again.";
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
    localStorage.setItem("teachToday.driveStatus", "Google Drive is connected for backups and audio.");
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

async function ttDriveUploadMultipart(metadata, blob, fileId = "") {
  if (!(await ttEnsureDrivePermission())) throw new Error("Google Drive permission was not granted.");
  const boundary = `teach_today_${Date.now()}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${blob.type || "audio/webm"}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  const target = fileId ? `/${encodeURIComponent(fileId)}` : "";
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files${target}?uploadType=multipart&fields=id,name,size,md5Checksum,webViewLink`, {
    method: fileId ? "PATCH" : "POST",
    headers: ttDriveHeaders(body.type),
    body
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Drive upload failed (${response.status}): ${detail}`);
  }
  return response.json();
}

function ttDriveQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function ttDriveNamedFolder(name, parentId = "") {
  const key = `teachToday.driveBackupFolder.${parentId || "root"}.${name}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  const clauses = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${ttDriveQueryValue(name)}'`,
    "trashed=false"
  ];
  if (parentId) clauses.push(`'${ttDriveQueryValue(parentId)}' in parents`);
  const result = await ttDriveRequest(`files?q=${encodeURIComponent(clauses.join(" and "))}&spaces=drive&fields=files(id,name)&pageSize=1`);
  let folderId = result.files?.[0]?.id || "";
  if (!folderId) {
    const folder = await ttDriveCreateMetadata({
      name,
      parents: parentId ? [parentId] : undefined,
      mimeType: "application/vnd.google-apps.folder"
    });
    folderId = folder.id || "";
  }
  if (folderId) localStorage.setItem(key, folderId);
  return folderId;
}

async function ttDriveUpsertBackup(folderId, name, blob, mimeType = "application/json") {
  const query = [`name='${ttDriveQueryValue(name)}'`, `'${ttDriveQueryValue(folderId)}' in parents`, "trashed=false"].join(" and ");
  const found = await ttDriveRequest(`files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name,size)&pageSize=1`);
  const existingId = found.files?.[0]?.id || "";
  const file = await ttDriveUploadMultipart({
    name,
    parents: existingId ? undefined : [folderId],
    mimeType
  }, blob, existingId);
  if (Number(file.size) !== blob.size) throw new Error(`Drive verification failed for ${name}.`);
  return file;
}

async function ttSaveIndependentDriveBackup(content, names, revisionId) {
  const root = await ttDriveNamedFolder(ttIndependentDriveFolderName);
  const daily = await ttDriveNamedFolder("Daily", root);
  const weekly = await ttDriveNamedFolder("Weekly", root);
  const blob = new Blob([content], { type: "application/json" });
  await ttDriveUpsertBackup(daily, names.daily, blob);
  await ttDriveUpsertBackup(weekly, names.weekly, blob);
  localStorage.setItem("teachToday.lastIndependentDriveRevision", revisionId);
  localStorage.setItem("teachToday.lastIndependentDriveAt", new Date().toISOString());
  localStorage.setItem("teachToday.lastIndependentDriveDate", names.daily.slice("teach-today-daily-".length, -".json".length));
}

function ttNativeBackupAvailable() {
  return document.documentElement.dataset.teachTodayNativeBackup === "1"
    && Boolean(window.webkit?.messageHandlers?.teachTodayBackup);
}

function ttSaveIndependentNativeBackup(content, digest, names, revisionId) {
  return new Promise((resolve, reject) => {
    if (!ttNativeBackupAvailable()) {
      reject(new Error("This Stage app needs one Xcode update before iPad Files backups can run."));
      return;
    }
    const requestId = crypto.randomUUID?.() || `backup-${Date.now()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("teachTodayNativeBackupResult", onResult);
      reject(new Error("The iPad Files backup did not finish."));
    }, 20000);
    function onResult(event) {
      if (event.detail?.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener("teachTodayNativeBackupResult", onResult);
      if (!event.detail.ok) {
        reject(new Error(event.detail.error || "The iPad Files backup failed."));
        return;
      }
      const verifiedAt = new Date().toISOString();
      localStorage.setItem("teachToday.lastIndependentNativeRevision", revisionId);
      localStorage.setItem("teachToday.lastIndependentNativeAt", verifiedAt);
      localStorage.setItem("teachToday.lastIndependentNativeDate", names.daily.slice("teach-today-daily-".length, -".json".length));
      localStorage.setItem("teachToday.lastIndependentNativeDailyPath", event.detail.dailyPath || `Backups/Daily/${names.daily}`);
      resolve(event.detail);
    }
    window.addEventListener("teachTodayNativeBackupResult", onResult);
    window.webkit.messageHandlers.teachTodayBackup.postMessage({
      requestId,
      content,
      sha256: digest,
      dailyName: names.daily,
      weeklyName: names.weekly
    });
  });
}

async function ttEnsureIndependentBackups(envelope, options = {}) {
  if (ttIndependentBackupInFlight) await ttIndependentBackupInFlight;
  const revisionId = envelope?.revisionId || ttFirebasePayloadSignature(envelope?.payload || ttFirebasePayload());
  const needsNative = ttIsNativeIpadShell() && (
    options.force
    || localStorage.getItem("teachToday.lastIndependentNativeDate") !== ttBackupDateKey()
    || localStorage.getItem("teachToday.lastIndependentNativeRevision") !== revisionId
  );
  const driveEnabled = localStorage.getItem(ttIndependentBackupEnabledKey) === "true";
  const needsDrive = !options.nativeOnly && driveEnabled && (
    options.force
    || localStorage.getItem("teachToday.lastIndependentDriveDate") !== ttBackupDateKey()
    || localStorage.getItem("teachToday.lastIndependentDriveRevision") !== revisionId
  );
  if (!needsNative && !needsDrive) return;
  ttIndependentBackupBusy = true;
  ttIndependentBackupInFlight = (async () => {
    const now = new Date();
    const names = {
      daily: `teach-today-daily-${ttBackupDateKey(now)}.json`,
      weekly: `teach-today-weekly-${ttBackupWeekKey(now)}.json`
    };
    const content = JSON.stringify(ttIndependentBackupArtifact(envelope));
    const digest = await ttSha256Hex(content);
    const failures = [];
    const jobs = [];
    if (needsNative) jobs.push(ttSaveIndependentNativeBackup(content, digest, names, revisionId).catch((error) => failures.push(`iPad Files: ${error.message}`)));
    if (needsDrive) {
      if (!ttDriveAccessToken && !options.requestDrivePermission) {
        failures.push("Google Drive needs permission. Open Records and tap Connect Drive backups.");
      } else {
        try {
          if (options.requestDrivePermission) await ttEnsureDrivePermission();
          if (!ttDriveAccessToken) throw new Error("Google Drive permission was not granted.");
          jobs.push(ttSaveIndependentDriveBackup(content, names, revisionId).catch((error) => failures.push(`Google Drive: ${ttFriendlyDriveError(error)}`)));
        } catch (error) {
          failures.push(`Google Drive: ${ttFriendlyDriveError(error)}`);
        }
      }
    }
    await Promise.all(jobs);
    if (failures.length) {
      const nativeFailed = failures.some((failure) => failure.startsWith("iPad Files:"));
      const safeLocalPrefix = needsNative && !nativeFailed
        ? `iPad backup verified (${names.daily}). `
        : "";
      ttSetIndependentBackupStatus(`${safeLocalPrefix}Backup needs attention. ${failures.join(" ")}`, { notify: true });
    } else {
      const destinations = [needsNative ? "iPad Files" : "", needsDrive ? "Google Drive" : ""].filter(Boolean).join(" and ");
      const verifiedAt = new Date();
      const nativeDetail = needsNative
        ? ` Daily file verified ${formatDateTime(verifiedAt)} (${names.daily}).`
        : "";
      ttSetIndependentBackupStatus(`Backup verified in ${destinations}.${nativeDetail}`, { success: true, notify: options.manual });
    }
  })();
  try {
    await ttIndependentBackupInFlight;
  } finally {
    ttIndependentBackupInFlight = null;
    ttIndependentBackupBusy = false;
  }
}

async function ttRunIndependentBackup(options = {}) {
  if (options.connectDrive) localStorage.setItem(ttIndependentBackupEnabledKey, "true");
  let envelope = null;
  if (ttFirebaseUser && !ttStageLocalOnlyMode()) envelope = await ttFirebaseReadEnvelope();
  if (!envelope) envelope = { payload: ttFirebasePayload(), revisionId: "" };
  await ttEnsureIndependentBackups(envelope, { force: true, manual: true, requestDrivePermission: options.connectDrive });
}

async function ttRunNativeBackupNow() {
  if (!ttStageLocalOnlyMode()) return ttRunIndependentBackup();
  ttSetIndependentBackupStatus("Saving a complete Stage backup to iPad Files…");
  await ttBackupCurrentStageState({ force: true, manual: true, nativeOnly: true });
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

async function ttFirebaseReadEnvelope() {
  if (!ttFirebaseUser) return null;
  const { firestoreDb, doc, getDoc } = await ttFirebaseSdk();
  const path = ttFirebaseDocPath();
  const snapshot = await getDoc(doc(firestoreDb, ...path));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data?.payload) {
    return {
      payload: ttNormalizeFirebasePayload(data.payload),
      revisionId: data.revisionId || "",
      exportedAt: data.exportedAt || data.payload?.exportedAt || "",
      version: data.version || 1
    };
  }
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
      error.remoteRevisionId = data.revisionId || "";
      throw error;
    }
    chunks.push(chunkSnapshot.data()?.text || "");
  }
  try {
    return {
      payload: ttNormalizeFirebasePayload(JSON.parse(chunks.join(""))),
      revisionId: data.revisionId || "",
      exportedAt: data.exportedAt || "",
      version: data.version || 1
    };
  } catch (error) {
    error.code = "teach-today/corrupt-chunks";
    error.remoteExportedAt = data.exportedAt || "";
    error.remoteRevisionId = data.revisionId || "";
    throw error;
  }
}

async function ttFirebaseReadRevisionEnvelope(revisionId) {
  if (!ttFirebaseUser || !revisionId) return null;
  const { firestoreDb, doc, getDoc } = await ttFirebaseSdk();
  const path = ttFirebaseDocPath();
  const manifestSnapshot = await getDoc(doc(firestoreDb, ...path, "revisions", revisionId));
  if (!manifestSnapshot.exists()) return null;
  const manifest = manifestSnapshot.data() || {};
  const chunkCount = Number(manifest.chunkCount || 0);
  if (!Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 100) {
    throw new Error("This recovery point has an invalid chunk manifest.");
  }
  const chunks = [];
  for (let index = 0; index < chunkCount; index += 1) {
    const id = String(index).padStart(4, "0");
    const chunkSnapshot = await getDoc(doc(firestoreDb, ...path, "revisions", revisionId, "chunks", id));
    if (!chunkSnapshot.exists()) throw new Error(`Recovery point chunk ${id} is missing.`);
    chunks.push(chunkSnapshot.data()?.text || "");
  }
  const payload = ttNormalizeFirebasePayload(JSON.parse(chunks.join("")));
  if (!payload) throw new Error("This recovery point does not contain valid Teach Today data.");
  return {
    payload,
    revisionId,
    exportedAt: manifest.exportedAt || payload.exportedAt || "",
    version: manifest.version || 4,
    manifest
  };
}

async function ttInstallFirebaseEnvelope(envelope, options = {}) {
  const payload = ttNormalizeFirebasePayload(envelope?.payload);
  if (!payload) return false;
  if (options.preserveLocal) {
    const recoveryReason = options.reason || "Before loading cloud data";
    await ttPreserveLocalRecovery(recoveryReason);
    if (ttFirebaseUser && options.archiveLocal !== false) {
      await ttArchiveFirebaseBranch(
        ttFirebasePayload(),
        recoveryReason,
        localStorage.getItem("teachToday.lastFirebaseRevisionId") || ""
      );
    }
  }
  const safety = ttFirebaseSafety();
  const restoredState = safety.applySharedState(appState, payload.appState);
  restoredState.lastSavedAt = payload.exportedAt || new Date().toISOString();
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides || {}));
  localStorage.setItem("teachToday.lastFirebaseSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.lastFirebaseSyncedLocalSaveAt", restoredState.lastSavedAt);
  localStorage.setItem("teachToday.lastFirebaseRevisionId", envelope.revisionId || "");
  localStorage.setItem(ttFirebaseSharedSignatureKey, ttFirebasePayloadSignature(payload));
  await ttStoreFirebaseBaseline({ ...envelope, payload });
  localStorage.setItem("teachToday.firebaseSyncStatus", options.status || "Loaded the authoritative Firebase copy.");
  if (options.reload !== false) location.reload();
  return true;
}

async function ttFirebaseRestoreIfNewer(options = {}) {
  const envelope = await ttFirebaseReadEnvelope();
  if (!envelope?.payload) return false;
  const remoteSignature = ttFirebasePayloadSignature(envelope.payload);
  const localSignature = ttCurrentFirebaseSignature();
  const knownRevision = localStorage.getItem("teachToday.lastFirebaseRevisionId") || "";
  if (remoteSignature === localSignature) {
    localStorage.setItem("teachToday.lastFirebaseRevisionId", envelope.revisionId || "");
    localStorage.setItem(ttFirebaseSharedSignatureKey, remoteSignature);
    localStorage.setItem("teachToday.lastFirebaseSyncAt", envelope.exportedAt || new Date().toISOString());
    await ttStoreFirebaseBaseline(envelope);
    return false;
  }
  const baseline = await ttFirebaseSafetyGet(ttFirebaseBaselineKey);
  if (!options.force && baseline?.payload && baseline.revisionId === knownRevision) {
    const baselineSignature = ttFirebasePayloadSignature(baseline.payload);
    if (localSignature !== baselineSignature) return false;
  }
  return ttInstallFirebaseEnvelope(envelope, {
    preserveLocal: localSignature !== ttFirebasePayloadSignature(baseline?.payload),
    archiveLocal: options.archiveLocal !== false,
    reason: "Before loading a different Firebase copy",
    status: "Loaded Firebase data. The previous device copy was preserved in Recovery."
  });
}

function ttFirebasePayloadSummary(payload) {
  const state = ttNormalizeFirebasePayload(payload)?.appState || {};
  return {
    groups: (state.groups || []).length,
    profiles: (state.rosterStudents || []).length,
    records: (state.masterRecords || []).length,
    lessons: (state.groups || []).reduce((sum, group) => sum + (group.history || []).length, 0)
  };
}

function ttFirebaseSummaryText(summary) {
  return `${summary.records} records, ${summary.lessons} lessons, ${summary.groups} groups, and ${summary.profiles} student profiles`;
}

function ttFirebaseTimelineDate(manifest = {}) {
  const serverDate = manifest.createdAt?.toDate?.();
  if (serverDate && !Number.isNaN(serverDate.getTime())) return serverDate;
  const exportedDate = new Date(manifest.exportedAt || "");
  if (!Number.isNaN(exportedDate.getTime())) return exportedDate;
  const revisionTime = Number(String(manifest.revisionId || "").split("-")[0]);
  return Number.isFinite(revisionTime) ? new Date(revisionTime) : new Date(0);
}

function ttFirebaseTimelineSize(byteLength) {
  const bytes = Number(byteLength || 0);
  if (!bytes) return "size unavailable";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ttFirebaseDailyBackupKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ttFirebaseDailyBackupBucket(date = new Date()) {
  const startHour = Math.floor(date.getHours() / 4) * 4;
  return `${String(startHour).padStart(2, "0")}-${String(startHour + 3).padStart(2, "0")}`;
}

async function ttRecordDailyBackupIndex(revision) {
  if (!ttFirebaseUser || !revision?.revisionId || !revision.manifest) return;
  const { firestoreDb, doc, runTransaction } = await ttFirebaseSdk();
  const now = new Date();
  const dateKey = ttFirebaseDailyBackupKey(now);
  const bucket = ttFirebaseDailyBackupBucket(now);
  const dailyRef = doc(firestoreDb, ...ttFirebaseDocPath(), "dailyBackups", dateKey);
  const checkpoint = {
    revisionId: revision.revisionId,
    exportedAt: revision.manifest.exportedAt || now.toISOString(),
    byteLength: revision.manifest.byteLength || 0,
    summary: revision.manifest.summary || {},
    reason: revision.manifest.reason || "Automatic sync"
  };
  await runTransaction(firestoreDb, async (transaction) => {
    const snapshot = await transaction.get(dailyRef);
    const existing = snapshot.exists() ? snapshot.data() : {};
    transaction.set(dailyRef, {
      kind: "TeachTodayDailyBackupIndex",
      version: 1,
      dateKey,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
      firstRevisionId: existing.firstRevisionId || revision.revisionId,
      firstSavedAt: existing.firstSavedAt || checkpoint.exportedAt,
      latestRevisionId: revision.revisionId,
      latestSavedAt: checkpoint.exportedAt,
      checkpoints: { ...(existing.checkpoints || {}), [bucket]: checkpoint }
    });
  });
}

function ttFirebaseDailyManifests(snapshot) {
  return snapshot.docs.flatMap((item) => {
    const data = item.data() || {};
    return Object.values(data.checkpoints || {}).map((checkpoint) => ({
      kind: "TeachTodayFirebaseRevision",
      ...checkpoint,
      revisionId: checkpoint.revisionId || ""
    }));
  }).filter((item) => item.revisionId);
}

function ttRenderFirebaseTimeline(manifests = []) {
  const timeline = ttById("ttFirebaseTimeline");
  if (!timeline) return;
  if (!manifests.length) {
    timeline.textContent = "No cloud recovery points were found. The next successful Firebase data save will create one automatically.";
    return;
  }
  const currentRevisionId = localStorage.getItem("teachToday.lastFirebaseRevisionId") || "";
  let dayKey = "";
  timeline.innerHTML = manifests.map((manifest) => {
    const date = ttFirebaseTimelineDate(manifest);
    const nextDayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dayHeading = nextDayKey === dayKey
      ? ""
      : `<div class="firebase-backup-timeline-day">${escapeHtml(date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }))}</div>`;
    dayKey = nextDayKey;
    const summary = manifest.summary || {};
    const countText = Number.isFinite(summary.records) && Number.isFinite(summary.lessons)
      ? `${summary.records} records · ${summary.lessons} lessons · `
      : "";
    const isCurrent = manifest.revisionId === currentRevisionId;
    const kind = manifest.kind === "TeachTodayFirebaseRecoveryRevision" ? "Protected branch" : "Automatic backup";
    return `${dayHeading}<article class="firebase-backup-timeline-entry${isCurrent ? " is-current" : ""}">
      <div>
        <strong>${escapeHtml(date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }))} · ${escapeHtml(kind)}${isCurrent ? " · Current" : ""}</strong>
        <span>${escapeHtml(countText)}${escapeHtml(ttFirebaseTimelineSize(manifest.byteLength))} · ${escapeHtml(manifest.reason || "Saved to Firebase")}</span>
      </div>
      <button type="button" data-firebase-revision-download="${escapeHtml(manifest.revisionId)}">Download</button>
    </article>`;
  }).join("");
}

async function ttLoadFirebaseTimeline(options = {}) {
  const timeline = ttById("ttFirebaseTimeline");
  const refresh = ttById("ttFirebaseTimelineRefresh");
  if (!timeline) return;
  if (!ttFirebaseUser) {
    timeline.textContent = "Sign in to view private cloud recovery points.";
    timeline.dataset.loadedForUid = "";
    return;
  }
  if (!options.force && timeline.dataset.loadedForUid === ttFirebaseUser.uid) return;
  timeline.textContent = "Loading private cloud recovery points...";
  if (refresh) refresh.disabled = true;
  try {
    const { firestoreDb, collection, getDocs, query, orderBy, limit } = await ttFirebaseSdk();
    const revisionsRef = collection(firestoreDb, ...ttFirebaseDocPath(), "revisions");
    const dailyRef = collection(firestoreDb, ...ttFirebaseDocPath(), "dailyBackups");
    const [dailySnapshot, recentSnapshot] = await Promise.all([
      getDocs(query(dailyRef, orderBy("dateKey", "desc"), limit(400))),
      getDocs(query(revisionsRef, orderBy("createdAt", "desc"), limit(120)))
    ]);
    const recentManifests = recentSnapshot.docs
      .map((item) => ({ ...item.data(), revisionId: item.id }));
    const seen = new Set();
    const manifests = [...ttFirebaseDailyManifests(dailySnapshot), ...recentManifests]
      .filter((item) => item.revisionId && !seen.has(item.revisionId) && seen.add(item.revisionId))
      .sort((a, b) => ttFirebaseTimelineDate(b) - ttFirebaseTimelineDate(a));
    ttRenderFirebaseTimeline(manifests);
    timeline.dataset.loadedForUid = ttFirebaseUser.uid;
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    timeline.textContent = `Cloud backup timeline could not load (${detail}). Live data was not changed.`;
  } finally {
    if (refresh) refresh.disabled = false;
  }
}

async function ttDownloadFirebaseRevision(revisionId, button = null) {
  if (!revisionId || !ttFirebaseUser) return;
  const priorLabel = button?.textContent || "Download";
  if (button) {
    button.disabled = true;
    button.textContent = "Preparing...";
  }
  try {
    const envelope = await ttFirebaseReadRevisionEnvelope(revisionId);
    if (!envelope?.payload) throw new Error("Recovery point not found.");
    const date = ttFirebaseTimelineDate(envelope.manifest);
    ttDownloadPayload({
      kind: "TeachTodayCloudRecoveryPoint",
      version: 1,
      revisionId,
      savedAt: date.toISOString(),
      reason: envelope.manifest.reason || "Firebase recovery point",
      payload: envelope.payload
    }, `teach-today-cloud-recovery-${ttBackupFileStamp(date)}.json`);
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    localStorage.setItem("teachToday.firebaseSyncStatus", `Recovery point could not download (${detail}). Live data was not changed.`);
    ttRenderDataCenter();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = priorLabel;
    }
  }
}

async function ttLoadProtectedFirebaseCopy() {
  if (!ttFirebaseUser) {
    localStorage.setItem("teachToday.firebaseSyncStatus", "Sign in with Google before loading the protected Firebase copy.");
    ttRenderDataCenter();
    return false;
  }
  const button = ttById("ttFirebaseLoadProtected");
  if (button) {
    button.disabled = true;
    button.textContent = "Checking Firebase...";
  }
  try {
    const envelope = await ttFirebaseReadEnvelope();
    if (!envelope?.payload) {
      localStorage.setItem("teachToday.firebaseSyncStatus", "No usable protected Firebase copy was found. This device was not changed.");
      ttRenderDataCenter();
      return false;
    }
    const remoteSignature = ttFirebasePayloadSignature(envelope.payload);
    if (remoteSignature === ttCurrentFirebaseSignature()) {
      await ttMarkFirebaseSynced(envelope, "This device already matches the protected Firebase copy.");
      ttHideConnectionNotice();
      ttRenderDataCenter();
      return false;
    }
    const cloud = ttFirebasePayloadSummary(envelope.payload);
    const device = ttFirebasePayloadSummary(ttFirebasePayload());
    const approved = window.confirm(
      `Load the protected Firebase copy on this device?\n\nFirebase: ${ttFirebaseSummaryText(cloud)}.\nThis device: ${ttFirebaseSummaryText(device)}.\n\nTeach Today will first preserve this device's current copy in local Recovery. This action reads Firebase but does not upload, merge, delete, or change the protected Firebase copy.`
    );
    if (!approved) {
      localStorage.setItem("teachToday.firebaseSyncStatus", "Protected Firebase load canceled. Nothing was changed.");
      ttRenderDataCenter();
      return false;
    }
    await ttPreserveLocalRecovery("Before read-only protected Firebase load");
    ttWorkOffline = false;
    localStorage.setItem("teachToday.workOffline", "false");
    localStorage.setItem("teachToday.firebaseSyncStatus", "Loading the protected Firebase copy without writing to Firebase...");
    ttHideConnectionNotice();
    ttRenderDataCenter();
    return ttInstallFirebaseEnvelope(envelope, {
      preserveLocal: false,
      archiveLocal: false,
      status: "Loaded the protected Firebase copy. The previous device copy remains available in local Recovery."
    });
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    localStorage.setItem("teachToday.firebaseSyncStatus", `Protected Firebase copy could not load (${detail}). This device and Firebase were not changed.`);
    ttShowConnectionNotice(`Protected Firebase copy could not load (${detail}). This device and Firebase were not changed.`);
    return false;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Load protected Firebase copy";
    }
    ttRenderDataCenter();
  }
}

async function ttWriteFirebaseRevisionDocuments(payload, metadata = {}) {
  const { firestoreDb, doc, setDoc, serverTimestamp } = await ttFirebaseSdk();
  const path = ttFirebaseDocPath();
  const now = new Date();
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
  const manifest = {
    kind: metadata.kind || "TeachTodayFirebaseRevision",
    version: 4,
    revisionId,
    createdAt: serverTimestamp(),
    exportedAt: payload.exportedAt,
    chunkCount,
    chunkSize: ttFirebaseChunkSize,
    byteLength: new Blob([serialized]).size,
    summary: ttFirebasePayloadSummary(payload),
    deviceId: ttFirebaseDeviceId(),
    parentRevisionId: metadata.parentRevisionId || "",
    mergeParentRevisionIds: metadata.mergeParentRevisionIds || [],
    reason: metadata.reason || "Automatic sync"
  };
  await setDoc(doc(firestoreDb, ...path, "revisions", revisionId), manifest);
  return { revisionId, manifest };
}

async function ttArchiveFirebaseBranch(payload, reason, parentRevisionId = "") {
  const revision = await ttWriteFirebaseRevisionDocuments(payload, {
    kind: "TeachTodayFirebaseRecoveryRevision",
    parentRevisionId,
    reason
  });
  const { firestoreDb, doc, setDoc, serverTimestamp } = await ttFirebaseSdk();
  await setDoc(doc(firestoreDb, ...ttFirebaseDocPath(), "devices", ttFirebaseDeviceId()), {
    latestRecoveryRevisionId: revision.revisionId,
    latestRecoveryAt: serverTimestamp(),
    reason
  }, { merge: true });
  return revision.revisionId;
}

async function ttCommitFirebaseRevision(payload, expectedRevisionId, metadata = {}) {
  const { firestoreDb, doc, setDoc, serverTimestamp, runTransaction } = await ttFirebaseSdk();
  const path = ttFirebaseDocPath();
  const revision = await ttWriteFirebaseRevisionDocuments(payload, metadata);
  ttFirebaseWritingRevisionId = revision.revisionId;
  const mainRef = doc(firestoreDb, ...path);
  await runTransaction(firestoreDb, async (transaction) => {
    const currentSnapshot = await transaction.get(mainRef);
    const currentRevisionId = currentSnapshot.exists() ? (currentSnapshot.data()?.revisionId || "") : "";
    if (currentRevisionId !== (expectedRevisionId || "")) {
      const conflict = new Error("Another signed-in device saved newer Teach Today data.");
      conflict.code = "teach-today/sync-conflict";
      throw conflict;
    }
    transaction.set(mainRef, {
      kind: "TeachTodayFirebaseSync",
      version: 4,
      revisionId: revision.revisionId,
      updatedAt: serverTimestamp(),
      exportedAt: payload.exportedAt,
      chunkCount: revision.manifest.chunkCount,
      chunkSize: ttFirebaseChunkSize,
      byteLength: revision.manifest.byteLength,
      deviceId: ttFirebaseDeviceId(),
      parentRevisionId: metadata.parentRevisionId || "",
      mergeParentRevisionIds: metadata.mergeParentRevisionIds || []
    });
  });
  await setDoc(doc(firestoreDb, ...path, "devices", ttFirebaseDeviceId()), {
    latestRevisionId: revision.revisionId,
    latestSyncAt: serverTimestamp()
  }, { merge: true });
  try {
    await ttRecordDailyBackupIndex(revision);
  } catch (error) {
    console.warn("Teach Today daily backup timeline could not update:", error);
  }
  return revision.revisionId;
}

async function ttMarkFirebaseSynced(envelope, reason) {
  const payload = ttNormalizeFirebasePayload(envelope.payload);
  localStorage.setItem("teachToday.lastFirebaseSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.lastFirebaseSyncedLocalSaveAt", appState.lastSavedAt || payload.exportedAt);
  localStorage.setItem("teachToday.lastFirebaseRevisionId", envelope.revisionId || "");
  localStorage.setItem(ttFirebaseSharedSignatureKey, ttFirebasePayloadSignature(payload));
  localStorage.setItem("teachToday.firebaseSyncStatus", reason);
  await ttStoreFirebaseBaseline({ ...envelope, payload });
  const timeline = ttById("ttFirebaseTimeline");
  if (timeline && !ttById("ttDataPanel")?.hidden) {
    timeline.dataset.loadedForUid = "";
    ttLoadFirebaseTimeline({ force: true });
  }
  ttEnsureIndependentBackups({ ...envelope, payload }).catch((error) => {
    ttSetIndependentBackupStatus(`Backup needs attention. ${error.message}`, { notify: true });
  });
}

async function ttFirebaseSyncWrite(reason = "Saved to Firebase.") {
  if (ttStageLocalOnlyMode()) {
    localStorage.setItem("teachToday.firebaseSyncStatus", ttStageLocalOnlyStatus());
    ttUpdateHomeFirebaseStatus();
    await ttBackupCurrentStageState().catch((error) => {
      ttSetIndependentBackupStatus(`iPad backup needs attention. ${error.message}`, { notify: true });
    });
    return;
  }
  if (!ttFirebaseUser) return; // require sign-in
  if (ttFirebaseBusy) {
    ttFirebasePending = true;
    return;
  }
  ttFirebaseBusy = true;
  ttUpdateHomeFirebaseStatus();
  try {
    let remoteEnvelope = null;
    let corruptRemoteRevisionId = "";
    try {
      remoteEnvelope = await ttFirebaseReadEnvelope();
    } catch (readError) {
      if (readError?.code !== "teach-today/corrupt-chunks") throw readError;
      corruptRemoteRevisionId = readError.remoteRevisionId || "";
      localStorage.setItem("teachToday.firebaseSyncStatus", "Repairing an interrupted legacy Firebase sync from this browser's intact local copy...");
      ttRenderDataCenter();
    }
    let localPayload = ttFirebasePayload();
    const localSignature = ttFirebasePayloadSignature(localPayload);
    const remoteSignature = ttFirebasePayloadSignature(remoteEnvelope?.payload);
    const knownRevision = localStorage.getItem("teachToday.lastFirebaseRevisionId") || "";

    if (remoteEnvelope && localSignature === remoteSignature) {
      await ttMarkFirebaseSynced(remoteEnvelope, reason);
      return;
    }

    if (remoteEnvelope && remoteEnvelope.revisionId !== knownRevision) {
      const baseline = await ttFirebaseSafetyGet(ttFirebaseBaselineKey);
      await ttPreserveLocalRecovery("Before reconciling with a newer Firebase revision");
      await ttArchiveFirebaseBranch(localPayload, "Preserved device branch before reconciliation", knownRevision);
      if (!baseline?.payload || baseline.revisionId !== knownRevision) {
        await ttInstallFirebaseEnvelope(remoteEnvelope, {
          preserveLocal: false,
          status: "Firebase is authoritative online. This device's previous copy was preserved in Recovery."
        });
        return;
      }
      const merged = ttFirebaseSafety().mergePayloads(baseline.payload, localPayload, remoteEnvelope.payload);
      localPayload = ttFirebasePayload(new Date(), merged.appState, merged.section2CardOverrides);
      const revisionId = await ttCommitFirebaseRevision(localPayload, remoteEnvelope.revisionId, {
        parentRevisionId: remoteEnvelope.revisionId,
        mergeParentRevisionIds: [knownRevision, remoteEnvelope.revisionId].filter(Boolean),
        reason: "Automatic three-way reconciliation"
      });
      const mergedEnvelope = { payload: localPayload, revisionId, exportedAt: localPayload.exportedAt, version: 4 };
      const mergeStatus = merged.conflicts.length
        ? `Merged device changes. ${merged.conflicts.length} same-field choice(s) used the cloud value; the device branch is preserved in Recovery.`
        : "Merged changes from both devices without losing records.";
      await ttMarkFirebaseSynced(mergedEnvelope, mergeStatus);
      await ttInstallFirebaseEnvelope(mergedEnvelope, { reload: true, preserveLocal: false, status: mergeStatus });
      return;
    }

    const expectedRevisionId = remoteEnvelope?.revisionId || corruptRemoteRevisionId || "";
    const revisionId = await ttCommitFirebaseRevision(localPayload, expectedRevisionId, {
      parentRevisionId: expectedRevisionId,
      reason
    });
    await ttMarkFirebaseSynced({ payload: localPayload, revisionId, exportedAt: localPayload.exportedAt, version: 4 }, reason);
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    if (detail === "teach-today/sync-conflict") {
      ttFirebasePending = false;
      localStorage.setItem("teachToday.firebaseSyncStatus", "Another device saved during reconciliation. Retrying without overwriting either copy.");
      ttFirebasePending = true;
      return;
    }
    console.warn("Teach Today Firebase sync failed:", error);
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase could not save (${detail}).`);
    ttShowConnectionNotice(`Firebase could not save right now (${detail}). You can keep trying or work offline.`);
  } finally {
    ttFirebaseWritingRevisionId = "";
    ttFirebaseBusy = false;
    ttRenderDataCenter();
    ttUpdateHomeFirebaseStatus();
    if (ttFirebasePending) {
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
  if (ttStageLocalOnlyMode()) {
    localStorage.setItem("teachToday.firebaseSyncStatus", ttStageLocalOnlyStatus());
    ttUpdateHomeFirebaseStatus();
    // saveState() has already persisted the classroom action. A complete Files
    // checkpoint is intentionally reserved for lesson/app lifecycle boundaries;
    // preparing a multi-megabyte backup after ordinary taps can stall WKWebView.
    if (document.visibilityState === "hidden") ttQueueStageNativeBackup();
    return;
  }
  if (ttFirebaseUser && !ttHasUnsyncedFirebaseChanges()) {
    localStorage.setItem("teachToday.firebaseSyncStatus", "Firebase is up to date.");
    ttUpdateHomeFirebaseStatus();
    return;
  }
  if (ttFirebaseUser) {
    localStorage.setItem("teachToday.firebaseSyncStatus", "Changes saved locally. Syncing automatically...");
    ttUpdateHomeFirebaseStatus();
  }
  ttFirebaseTimer = setTimeout(() => ttFirebaseSyncWrite(), 1200);
}

async function ttSyncFirebaseAndLocalNow() {
  await Promise.all([
    ttFirebaseSyncWrite("Saved to Firebase now."),
    ttCloudSyncWrite("Saved local backup file now.")
  ]);
}

// --- Auth UI helpers ---
function ttUpdateHomeFirebaseStatus() {
  const signInBtn = ttById("ttHomeFirebaseSignIn");
  const signOutBtn = ttById("ttHomeFirebaseSignOut");
  const badge = ttById("ttHomeFirebaseUserBadge");
  const message = localStorage.getItem("teachToday.firebaseSyncStatus") || "Firebase sync is ready.";
  const needsAttention = /could not|failed|conflict|newer data|refresh|not overwrite/i.test(message);
  if (ttFirebaseUser) {
    if (signInBtn) signInBtn.hidden = true;
    if (signOutBtn) {
      signOutBtn.hidden = false;
      signOutBtn.dataset.state = needsAttention ? "attention" : "ready";
      signOutBtn.title = message;
    }
    if (badge) {
      badge.textContent = ttFirebaseUser.displayName || ttFirebaseUser.email;
      badge.hidden = false;
      badge.title = message;
    }
  } else {
    if (signInBtn) {
      signInBtn.hidden = false;
      signInBtn.title = message;
    }
    if (signOutBtn) signOutBtn.hidden = true;
    if (badge) badge.hidden = true;
  }
}

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
  ttUpdateHomeFirebaseStatus();
}

function ttHasUnsyncedFirebaseChanges() {
  const syncedSignature = localStorage.getItem(ttFirebaseSharedSignatureKey);
  if (syncedSignature) return ttCurrentFirebaseSignature() !== syncedSignature;
  const localSave = new Date(appState?.lastSavedAt || 0).getTime() || 0;
  const syncedSave = new Date(localStorage.getItem("teachToday.lastFirebaseSyncedLocalSaveAt") || 0).getTime() || 0;
  return localSave > syncedSave + 1000;
}

async function ttStartFirebaseRevisionListener() {
  if (ttFirebaseUnsubscribe) {
    ttFirebaseUnsubscribe();
    ttFirebaseUnsubscribe = null;
  }
  if (!ttFirebaseUser || ttStageLocalOnlyMode()) return;
  const { firestoreDb, doc, onSnapshot } = await ttFirebaseSdk();
  const mainRef = doc(firestoreDb, ...ttFirebaseDocPath());
  let receivedInitialSnapshot = false;
  ttFirebaseUnsubscribe = onSnapshot(mainRef, async (snapshot) => {
    if (!snapshot.exists()) return;
    const revisionId = snapshot.data()?.revisionId || "";
    if (!receivedInitialSnapshot) {
      receivedInitialSnapshot = true;
      return;
    }
    if (!revisionId || revisionId === localStorage.getItem("teachToday.lastFirebaseRevisionId")) return;
    if (revisionId === ttFirebaseWritingRevisionId) {
      localStorage.setItem("teachToday.lastFirebaseRevisionId", revisionId);
      return;
    }
    if (ttFirebaseBusy) {
      ttFirebasePending = true;
      return;
    }
    if (ttHasUnsyncedFirebaseChanges()) {
      localStorage.setItem("teachToday.firebaseSyncStatus", "Another device changed Firebase. Reconciling both copies safely...");
      ttQueueFirebaseSync();
      return;
    }
    localStorage.setItem("teachToday.firebaseSyncStatus", "Newer Firebase data detected. Updating this device...");
    ttUpdateHomeFirebaseStatus();
    await ttFirebaseRestoreIfNewer({ force: true, revisionId, archiveLocal: true });
  }, (error) => {
    const detail = error?.code || error?.message || "unknown error";
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase change detection paused (${detail}). Local saves are still protected.`);
    ttRenderDataCenter();
    ttUpdateHomeFirebaseStatus();
  });
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
      if (localStorage.getItem(ttIndependentBackupEnabledKey) === "true") {
        ttRunIndependentBackup().catch((error) => ttSetIndependentBackupStatus(`Backup needs attention. ${ttFriendlyDriveError(error)}`, { notify: true }));
      }
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
        if (ttStageLocalOnlyMode()) {
          localStorage.setItem("teachToday.firebaseSyncStatus", ttStageLocalOnlyStatus());
          localStorage.setItem("teachToday.workOffline", "true");
          ttWorkOffline = true;
          await ttBackupCurrentStageState().catch((error) => {
            ttSetIndependentBackupStatus(`iPad backup needs attention. ${error.message}`, { notify: true });
          });
          ttRenderDataCenter();
          return;
        }
        localStorage.setItem("teachToday.firebaseSyncStatus", `Signed in as ${user.email}. Checking cloud data…`);
        ttRenderDataCenter();
        if (!wasSignedIn) await ttFirebaseMigrateLegacyData();
        const restored = await ttFirebaseRestoreIfNewer({ archiveLocal: true });
        if (restored) return;
        await ttStartFirebaseRevisionListener();
        if (ttHasUnsyncedFirebaseChanges()) {
          ttQueueFirebaseSync();
        } else {
          localStorage.setItem("teachToday.firebaseSyncStatus", `Signed in as ${user.email}. Firebase is up to date.`);
        }
        // Do not retry pending Firebase Storage audio automatically on startup.
        // A failed background retry changes shared record metadata; with more than
        // one signed-in device that can create revision/reload ping-pong. Teachers
        // can still connect Google Drive audio deliberately from Records.
        if (!ttDriveAccessToken) {
          localStorage.setItem("teachToday.driveStatus", "Google Drive needs permission for this browser session. Click Google Drive audio in Records.");
        }
        if (ttHasUnsyncedFirebaseChanges()) {
          localStorage.setItem("teachToday.firebaseSyncStatus", `Signed in as ${user.email}. Syncing automatically.`);
        }
      } else {
        if (ttFirebaseUnsubscribe) ttFirebaseUnsubscribe();
        ttFirebaseUnsubscribe = null;
        localStorage.setItem("teachToday.firebaseSyncStatus", "Sign in with Google to sync across all your devices.");
        const timeline = ttById("ttFirebaseTimeline");
        if (timeline) {
          timeline.dataset.loadedForUid = "";
          timeline.textContent = "Sign in to view private cloud recovery points.";
        }
      }
      ttRenderDataCenter();
      if (user && !ttById("ttDataPanel")?.hidden) ttLoadFirebaseTimeline({ force: true });
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
  const stamp = now.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  ttDownloadPayload(payload, `teach-today-backup-${stamp}.json`);
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
    await ttCloudSyncWrite("Connected and saved local backup file.");
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

function ttOpenPlanInApp(planId, preferredGroupId = "", visitedPlanIds = new Set()) {
  ttRememberScroll();
  if (!planId || visitedPlanIds.has(planId)) return false;
  visitedPlanIds.add(planId);
  const preferredGroup = preferredGroupId
    ? (appState.groups || []).find((group) => group.id === preferredGroupId)
    : null;
  let found = preferredGroup
    ? { group: preferredGroup, plan: (preferredGroup.history || []).find((item) => item.id === planId) }
    : null;
  if (!found?.plan) {
    for (const group of (appState.groups || [])) {
      const plan = (group.history || []).find((item) => item.id === planId);
      if (plan) {
        found = { group, plan };
        break;
      }
    }
  }
  if (found?.plan?.combinedParticipation && found.plan.hostPlanId) {
    const openedHost = ttOpenPlanInApp(found.plan.hostPlanId, found.plan.hostGroupId || "", visitedPlanIds);
    if (openedHost) return true;
    // A participant lesson remains a complete, teachable snapshot even when an
    // older host pointer is unavailable on this device. Open it locally rather
    // than stranding the teacher or changing any saved evidence.
  }
  if (!found?.plan?.lessons?.[0]) return false;
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
  return true;
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
    const section2BContainer = button.closest("#ttReviewWordsB2, #ttCurrentWordsB2, #ttLastMissedWordsB2, #ttPriorityMissedWordsB2");
    if (section2BContainer) {
      const isDay2Core = section2BContainer.matches("#ttReviewWordsB2, #ttCurrentWordsB2");
      button.classList.toggle("marked-word", !isDay2Core && isMarkedReviewWord(button.textContent));
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
  ttFillHfwDisplayWords(
    (lesson.sectionSevenHighFrequencyWords || []).length
      ? lesson.sectionSevenHighFrequencyWords
      : hfwWordsForSubstep(ttById("ttHfwStep")?.value || skill.id, lesson),
    ttById("ttHfwStep")?.value || skill.id
  );
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
      : ttDictationBookReviewWordPool([priorSubstep(skill.id)], ttLesson.readerLevel || "AB");
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
  if (ttStudentDisplayMode === "cards") ttSendStudentDisplay(ttStudentDisplayPayload("cards"));
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
    const bank = ttDictationBookWordsFor(prior.id, level, "real");
    candidates.push(...bank.filter(isUsableReaderWord));
    if (candidates.length < 5) {
      candidates.push(...readerWordsFromSubstep(prior.id, level));
    }
  }
  return chooseEasyReviewWords(candidates, 3, group?.trouble || []);
}

function dictationCurrentWords(substep, level = "AB", pageWords = []) {
  const bank = ttDictationBookWordsFor(substep, level, "real");
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
  ttSyncFollowingStudentDisplay({ force: true });
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

  const sharedList = document.createElement("details");
  sharedList.className = "dictation-shared-list";
  const summary = document.createElement("summary");
  summary.textContent = "Show shared dictation list";
  summary.title = "The same items already appear in each student box above";
  sharedList.appendChild(summary);
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
  sharedList.appendChild(sheet);
  container.appendChild(sharedList);
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
  if (/real words/i.test(label)) return ttSection8RealWords().concat(
    ttDictationBookCurrentWordPool(lesson, skill),
    ttDictationBookReviewWordPool([priorSubstep(skill.id)], lesson.readerLevel || "AB")
  );
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
  const studentId = ttStudentIdForName(student, group);
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  group.dictationMisses ||= [];
  group.dictationMisses.push({
    id: `dictation-miss-${Date.now()}`,
    date: new Date().toISOString(),
    student,
    studentId,
    homeGroupIdAtTime: ttStudentHomeGroupId(studentId, group.schoolYearId) || group.id,
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
  const enhanced = ttEnhancedPlanning();
  const enhancedCovered = Boolean(enhanced?.isCovered?.(skill.id));
  const indexedSentenceRows = enhancedCovered
    ? enhanced.findDictationRecommendations(skill.id, level, lesson.wordlistPageNumber)
    : [];
  const indexedSentences = uniqueWords(indexedSentenceRows.map((row) => row.t).filter(Boolean));
  const sentenceLevel = dictationSentenceLevel(level);
  const phraseRows = currentDictationPhraseRows(substep);
  const phraseBank = phraseRowsToPhrases(phraseRows);
  const sentenceBank = uniqueWords(indexedSentences.concat(currentDictationSentencesForLesson(lesson, skill, group)));
  const rankedSentences = rankedCurrentDictationSentences(sentenceBank, lesson, skill, group);
  const sentences = enhancedCovered && indexedSentences.length
    ? fillToCount(indexedSentences, rankedSentences.concat(currentReaderSentencesForDictation(lesson, skill)), 2)
    : fillToCount(rankedSentences, sentenceBank.concat(currentReaderSentencesForDictation(lesson, skill)), 2);
  const sentenceTokens = tokenSet(sentences.join(" "));
  const sentenceHfw = highFrequencyWordsFromTexts(sentences, lesson);
  const dictationCurrentWordPool = ttDictationBookCurrentWordPool(lesson, skill);
  const dictationReviewWordPool = ttDictationBookReviewWordPool([priorSubstep(skill.id)], level);
  const currentWordPool = dictationCurrentWordPool.length
    ? dictationCurrentWordPool
    : enhancedCovered ? ttEnhancedPageWords(lesson, skill) : ttCurrentRealWordPool(lesson, skill);
  const reviewWordPool = dictationReviewWordPool.length
    ? dictationReviewWordPool
    : enhancedCovered ? ttEnhancedReviewWords(lesson, skill) : ttReviewRealWordPool(lesson, skill);
  const currentWords = ttWithoutWordKeys(currentWordPool, avoidWordKeys).slice(0, 2);
  const reviewWords = ttWithoutWordKeys(reviewWordPool, avoidWordKeys);
  const priorWords = ttWithoutWordKeys(reviewWordPool, avoidWordKeys);
  const fallbackCurrentWords = ttWithoutWordKeys(currentWordPool.concat(reviewWordPool), avoidWordKeys);
  const selectedSlotWords = ttWithoutWordKeys(ttSection8RealWords(), avoidWordKeys);
  const indexedWords = fillToCount(reviewWords, priorWords, 3)
    .concat(fillToCount(currentWords, fallbackCurrentWords, 2))
    .slice(0, 5);
  const words = selectedSlotWords.length ? fillToCount(selectedSlotWords, indexedWords, 5) : indexedWords;
  const phraseMatches = rankedCurrentDictationPhraseRows(phraseRows, lesson, skill, sentenceTokens, sentenceHfw);
  const phrases = fillToCount(phraseMatches, phraseBank, 3);
  const derivedTargets = ttDerivedDictationTargets(skill, words);
  const soundTargets = derivedTargets.sounds;
  const elementTargets = derivedTargets.elements;
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

function ttDictationBookEntry(substep) {
  return window.teachTodayDictationWordIndex?.substeps?.[substep] || null;
}

function ttDictationBookWordsFor(substep, level = "AB", kind = "real") {
  const entry = ttDictationBookEntry(substep);
  if (!entry) return [];
  const words = kind === "nonsense" ? (entry.n || []) : (entry.r || []);
  const requested = ttRealReaderLevel(level || "AB");
  const direct = words.filter((word) => (entry.l?.[word] || []).includes(requested));
  if (direct.length) return direct.filter(isValidDictationWord);
  const fallbackLevels = requested === "A" ? ["AB"] : requested === "B" ? ["AB"] : ["A", "B"];
  const fallback = words.filter((word) => (entry.l?.[word] || []).some((item) => fallbackLevels.includes(item)));
  return uniqueWords((fallback.length ? fallback : words)).filter(isValidDictationWord);
}

function ttDictationFeatureKeys(metadata = {}) {
  return uniqueWords([].concat(
    metadata.p || [],
    metadata.s || [],
    metadata.v || [],
    metadata.d || [],
    metadata.g || [],
    metadata.k || [],
    metadata.e || [],
    metadata.y || [],
    metadata.l || []
  )).map((value) => String(value).toLowerCase());
}

function ttDictationBookCurrentWordPool(lesson, skill) {
  const substep = lesson?.substep || skill?.id;
  const level = lesson?.readerLevel || "AB";
  const bookWords = ttDictationBookWordsFor(substep, level, "real");
  if (!bookWords.length) return [];
  const bookKeys = new Set(bookWords.map(ttWordKey));
  const page = ttEnhancedPlanning()?.findPage?.(substep, level, lesson?.wordlistPageNumber) || null;
  const pageWords = uniqueWords(page?.w || [].concat(lesson?.realWords || [], lesson?.nonsenseWords || []))
    .filter(isValidDictationWord);
  const exact = pageWords.filter((word) => bookKeys.has(ttWordKey(word)));
  if (exact.length >= 5) return exact;

  const enhanced = ttEnhancedPlanning();
  const pageFeatures = new Set(pageWords.flatMap((word) =>
    ttDictationFeatureKeys(enhanced?.wordMetadata?.(substep, word) || {})
  ));
  const rankedFallback = bookWords
    .filter((word) => !exact.some((item) => ttWordKey(item) === ttWordKey(word)))
    .map((word, index) => {
      const features = ttDictationFeatureKeys(enhanced?.wordMetadata?.(substep, word) || {});
      return { word, index, score: features.filter((feature) => pageFeatures.has(feature)).length };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.word);
  return uniqueWords(exact.concat(rankedFallback));
}

function ttDictationBookReviewWordPool(substeps, level = "AB") {
  return uniqueWords((substeps || []).flatMap((substep) =>
    ttDictationBookWordsFor(substep, level, "real")
  )).filter(isValidDictationWord);
}

function ttDictationBookNonsensePool(substep) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const words = [];
  for (let index = currentIndex; index >= 0; index -= 1) {
    const candidate = scopeMap[index]?.id;
    if (!candidate) continue;
    words.push(...ttDictationBookWordsFor(candidate, "AB", "nonsense"));
  }
  return uniqueWords(words).filter(isValidDictationWord);
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
  const dictationBookWords = ttDictationBookNonsensePool(substep);
  if (dictationBookWords.length) return dictationBookWords.slice(0, 3);
  const candidates = ["2.2", "2.4", "2.5", "3.1", "3.2", "4.1", "4.2", substep]
    .flatMap((step) => readerNonsenseWordsForReview(step, substep));
  return [...new Set(candidates)].filter(isUsableReaderWord).slice(0, 3);
}

function ttAcademicSchoolYearId(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function ttSchoolYearForChartRecord(record) {
  const datedYear = ttAcademicSchoolYearId(record?.date || record?.displayDate);
  if (datedYear) return datedYear;
  if (record?.schoolYearId) return record.schoolYearId;
  const groupId = record?.groupIdAtTime || record?.groupId || "";
  const linkedGroup = (appState.groups || []).find((group) => group.id === groupId);
  if (linkedGroup?.schoolYearId) return linkedGroup.schoolYearId;
  return appState.activeSchoolYearId
    || ttAcademicSchoolYearId();
}

function ttSection4StudentRecords(student, group = ttActiveGroup()) {
  const studentId = ttStudentIdForName(student, group);
  return (appState.masterRecords || []).filter((record) => {
    const identityMatch = studentId
      ? record.studentId === studentId || (!record.studentId && record.student === student)
      : record.student === student;
    const isCharting = record.type !== "soundsDrill"
      && (record.correct !== undefined || record.wordlistPage || record.chartHalf);
    return identityMatch && isCharting;
  });
}

function ttSection4HistoryYears(records) {
  const ids = new Set((appState.schoolYears || []).map((year) => year.id).filter(Boolean));
  records.forEach((record) => {
    const id = ttSchoolYearForChartRecord(record);
    if (id) ids.add(id);
  });
  ids.add(appState.activeSchoolYearId || ttAcademicSchoolYearId());
  return [...ids].sort((a, b) => b.localeCompare(a));
}

function ttSection4HistoryWcpm(record) {
  if (record.wcpm) return Number(record.wcpm) || 0;
  const seconds = Number(record.seconds || 0);
  return seconds ? Math.round((Number(record.correct || 0) / seconds) * 60) : 0;
}

function ttRenderSection4History() {
  const panel = ttById("ttSection4History");
  if (!panel) return;
  const group = ttActiveGroup();
  const students = ttTeachingStudents(group);
  const selectedStudent = students.includes(panel.dataset.student)
    ? panel.dataset.student
    : group.activeStudent || students[0] || "";
  panel.dataset.student = selectedStudent;
  const allRecords = ttSection4StudentRecords(selectedStudent, group);
  const years = ttSection4HistoryYears(allRecords);
  const currentYear = appState.activeSchoolYearId || ttAcademicSchoolYearId();
  const selectedYear = years.includes(panel.dataset.schoolYear)
    ? panel.dataset.schoolYear
    : currentYear;
  panel.dataset.schoolYear = selectedYear;
  const labels = new Map((appState.schoolYears || []).map((year) => [year.id, year.label || year.id]));
  const records = allRecords
    .filter((record) => ttSchoolYearForChartRecord(record) === selectedYear)
    .sort((a, b) => ttRecordTime(b) - ttRecordTime(a));
  const rows = records.map((record) => {
    const wrong = record.wrongCount ?? Math.max(Number(record.total || 15) - Number(record.correct || 0), 0);
    return `<tr>
      <td>${escapeHtml(record.displayDate || (record.date ? new Date(record.date).toLocaleDateString() : "--"))}</td>
      <td>${escapeHtml(record.substep || "--")}</td>
      <td>Reader ${escapeHtml(record.reader || "--")}, p. ${escapeHtml(record.wordlistPage || "--")}</td>
      <td>${escapeHtml(titleCase(record.chartHalf || "--"))}</td>
      <td><strong>${escapeHtml(record.correct ?? "--")}/${escapeHtml(record.total || 15)}</strong></td>
      <td>${escapeHtml(wrong)}</td>
      <td>${escapeHtml(record.seconds || "--")}</td>
      <td>${escapeHtml(ttSection4HistoryWcpm(record) || "--")}</td>
      <td>${escapeHtml((record.wrongWords || []).join(", ") || "none")}</td>
      <td>${escapeHtml(record.notes || "")}</td>
    </tr>`;
  }).join("");
  panel.innerHTML = `
    <div class="section4-history-head">
      <div><h3>Previous charting</h3><p>${escapeHtml(selectedYear)} · ${records.length} saved record${records.length === 1 ? "" : "s"}</p></div>
      <div class="section4-history-controls">
        <label for="ttSection4HistoryYear">School year</label>
        <select id="ttSection4HistoryYear">${years.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(labels.get(id) || id)}${id === currentYear ? " (Current)" : ""}</option>`).join("")}</select>
      </div>
    </div>
    <div class="section4-history-students" aria-label="Choose a student">${students.map((student) => `<button type="button" class="${student === selectedStudent ? "active" : ""}" data-history-student="${escapeHtml(student)}">${escapeHtml(student)}</button>`).join("")}</div>
    ${records.length ? `<div class="section4-history-table-wrap"><table>
      <thead><tr><th>Date</th><th>Substep</th><th>Page</th><th>Half</th><th>Correct</th><th>Wrong</th><th>sec/15w</th><th>WCPM</th><th>Wrong words</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>` : `<p class="section4-history-empty">No charting records are saved for ${escapeHtml(selectedStudent || "this student")} in ${escapeHtml(selectedYear)}.</p>`}
  `;
  const yearSelect = ttById("ttSection4HistoryYear");
  if (yearSelect) {
    yearSelect.value = selectedYear;
    yearSelect.addEventListener("change", () => {
      panel.dataset.schoolYear = yearSelect.value;
      ttRenderSection4History();
    });
  }
  panel.querySelectorAll("[data-history-student]").forEach((button) => {
    button.addEventListener("click", () => {
      panel.dataset.student = button.dataset.historyStudent;
      ttRenderSection4History();
    });
  });
}

function ttToggleSection4History() {
  const panel = ttById("ttSection4History");
  const button = ttById("ttSection4HistoryToggle");
  if (!panel || !button) return;
  panel.hidden = !panel.hidden;
  button.setAttribute("aria-expanded", String(!panel.hidden));
  button.textContent = panel.hidden ? "Charting history" : "Hide history";
  if (!panel.hidden) ttRenderSection4History();
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
  if (!ttById("ttSection4History")?.hidden) ttRenderSection4History();
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
  ttTeachingStudents(group).forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `student-pill${student === group.activeStudent ? " active" : ""}`;
    button.dataset.student = student;
    const savedCount = ttCurrentLessonChartRecords(student, group).length;
    const saved = savedCount > 0;
    button.title = saved
      ? `${student} has ${savedCount} charting record${savedCount === 1 ? "" : "s"} saved for this lesson.`
      : `${student} has not been charted for this lesson yet.`;
    button.setAttribute("aria-label", `${student}. ${saved ? "Charting saved for this lesson" : "Not charted for this lesson"}.`);
    button.innerHTML = `
      <span class="lesson-chart-status${saved ? " saved" : ""}" aria-hidden="true">${saved ? "&#10003;" : ""}</span>
      <span>${escapeHtml(student)}</span>
      ${saved ? '<span class="lesson-chart-saved-label">Saved</span>' : ""}
    `;
    button.addEventListener("click", () => ttSelectStudent(student));
    container.appendChild(button);
  });
}

function ttCurrentLessonChartRecords(student, group = ttActiveGroup()) {
  const meta = ttCurrentLessonRecordMeta(ttLesson);
  const studentId = ttStudentIdForName(student, group);
  return (appState.masterRecords || []).filter((record) => {
    if (studentId ? record.studentId !== studentId && record.student !== student : record.student !== student) return false;
    if (record.groupId && record.groupId !== group.id) return false;
    if (!record.groupId && record.group !== group.name) return false;
    if (meta.planId) return record.planId === meta.planId;
    return Boolean(meta.lessonId) && record.lessonId === meta.lessonId;
  });
}

window.ttRefreshSection4StudentPills = () => {
  if (ttById("ttStudentPills")) ttFillStudentPills(ttActiveGroup());
};

async function ttSelectStudent(student) {
  if (student !== ttActiveGroup().activeStudent) {
    await ttFinalizeSection4Record({ automatic: true });
  }
  selectActiveStudent(student, { sourceCard: ttChartCard, resetSource: true });
  ttById("ttStudent").value = student;
  ttById("ttTitle").textContent = `${ttActiveGroup().name} - ${ttLesson?.substep || ttActiveGroup().substep}`;
  ttFillFrontStudents(ttActiveGroup());
  ttFillStudentPills(ttActiveGroup());
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
  ttRecordSectionInteraction(currentId, "section-navigation");
  if (currentId === "section4" && targetId !== "section4") {
    ttFinalizeSection4Record({ automatic: true });
  }
  ttById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  ttPaceGuideState.activeSectionId = targetId;
  ttPaceGuideState.sectionStartedAt = Date.now();
  ttUpdatePaceGuide();
  ttQueueStudentDisplayFollowSync();
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
    ttToggleGlobalInkPalette(true);
    ttSetGlobalInkActive(false);
    requestAnimationFrame(ttResizeGlobalPresentationCanvases);
    requestAnimationFrame(() => ttSyncFollowingStudentDisplay({ force: true }));
  } else {
    ttTogglePresentDisplayTray(false);
    ttToggleGlobalInkPalette(false);
    ttToggleLaser(false);
    ttToggleNotes(false);
    ttClearGlobalInk();
    document.body.classList.remove("present-menu-open");
    if (ttPresentationMenuTimer) {
      clearTimeout(ttPresentationMenuTimer);
      ttPresentationMenuTimer = null;
    }
    ttStudentDisplayFollowKey = "";
    ttSyncFollowingStudentDisplay({ force: true });
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
  if (ttNotesEnabled) {
    if (ttLaserEnabled) ttToggleLaser(false);
    ttSetGlobalInkActive(false);
  }
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

function ttResizeGlobalPresentationCanvases() {
  ttResizeCanvas("ttGlobalInkCanvas");
  ttResizeCanvas("ttLaserCanvas");
  ttRedrawGlobalInk();
}

function ttGlobalInkPoint(event) {
  const point = ttCanvasPoint(event);
  return {
    x: point.x / Math.max(1, window.innerWidth),
    y: point.y / Math.max(1, window.innerHeight)
  };
}

function ttDrawGlobalInkStroke(ctx, stroke) {
  const points = stroke?.points || [];
  if (!ctx || !points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color || "#ef4444";
  ctx.fillStyle = stroke.color || "#ef4444";
  ctx.lineWidth = Number(stroke.size || 5);
  if (stroke.mode === "highlight") {
    ctx.globalAlpha = 0.26;
    ctx.globalCompositeOperation = "multiply";
    ctx.lineWidth = Math.max(10, Number(stroke.size || 14));
  }
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x * window.innerWidth, points[0].y * window.innerHeight, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = point.x * window.innerWidth;
      const y = point.y * window.innerHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function ttRedrawGlobalInk() {
  const canvas = ttById("ttGlobalInkCanvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  (ttGlobalInkState.strokes || []).forEach((stroke) => ttDrawGlobalInkStroke(ctx, stroke));
  if (ttGlobalInkState.activeStroke) ttDrawGlobalInkStroke(ctx, ttGlobalInkState.activeStroke);
}

function ttSetGlobalInkActive(active) {
  ttGlobalInkState.active = Boolean(active);
  document.body.classList.toggle("global-ink-mode", ttGlobalInkState.active);
  document.querySelectorAll("[data-global-ink-mode]").forEach((button) => {
    button.classList.toggle("active", ttGlobalInkState.active && button.dataset.globalInkMode === ttGlobalInkState.mode);
  });
  ttById("ttGlobalInkInteract")?.classList.toggle("active", !ttGlobalInkState.active);
}

function ttSetGlobalInkMode(mode) {
  if (ttNotesEnabled) ttToggleNotes(false, false);
  if (ttLaserEnabled) ttToggleLaser(false);
  ttGlobalInkState.mode = mode === "highlight" ? "highlight" : "pen";
  if (ttGlobalInkState.mode === "highlight" && ttGlobalInkState.size < 10) {
    ttGlobalInkState.size = 14;
    const size = ttById("ttGlobalInkSize");
    if (size) size.value = "14";
  }
  ttSetGlobalInkActive(true);
}

function ttToggleGlobalInkPalette(force = null) {
  const palette = ttById("ttGlobalInkPalette");
  const shouldOpen = force ?? !ttGlobalInkState.open;
  ttGlobalInkState.open = shouldOpen;
  if (palette) palette.hidden = !shouldOpen;
  ttById("ttGlobalInkToggle")?.classList.toggle("active", shouldOpen);
  ttById("ttGlobalInkToggle")?.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) ttResizeGlobalPresentationCanvases();
  else ttSetGlobalInkActive(false);
}

function ttGlobalInkStart(event) {
  if (!ttGlobalInkState.active || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  ttResizeGlobalPresentationCanvases();
  ttGlobalInkState.drawing = true;
  ttGlobalInkState.activeStroke = {
    mode: ttGlobalInkState.mode,
    color: ttGlobalInkState.color,
    size: ttGlobalInkState.size,
    points: [ttGlobalInkPoint(event)]
  };
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  ttRedrawGlobalInk();
}

function ttGlobalInkMove(event) {
  if (!ttGlobalInkState.active || !ttGlobalInkState.drawing || !ttGlobalInkState.activeStroke) return;
  event.preventDefault();
  ttGlobalInkState.activeStroke.points.push(ttGlobalInkPoint(event));
  ttRedrawGlobalInk();
}

function ttGlobalInkEnd(event) {
  if (!ttGlobalInkState.drawing || !ttGlobalInkState.activeStroke) return;
  event.preventDefault();
  try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  ttGlobalInkState.strokes.push(ttGlobalInkState.activeStroke);
  ttGlobalInkState.activeStroke = null;
  ttGlobalInkState.drawing = false;
  ttRedrawGlobalInk();
}

function ttUndoGlobalInk() {
  ttGlobalInkState.strokes.pop();
  ttRedrawGlobalInk();
}

function ttClearGlobalInk() {
  ttGlobalInkState.strokes = [];
  ttGlobalInkState.activeStroke = null;
  ttGlobalInkState.drawing = false;
  ttRedrawGlobalInk();
}

function ttRenderLaser(now = performance.now()) {
  const canvas = ttById("ttLaserCanvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const lifetime = 720;
  ttLaserPoints = ttLaserPoints.filter((point) => now - point.time < lifetime);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (ttLaserPoints.length || ttLaserCurrentPoint) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    ctx.shadowColor = "rgba(239, 68, 68, 0.75)";
    ctx.shadowBlur = 12;
    for (let index = 1; index < ttLaserPoints.length; index += 1) {
      const from = ttLaserPoints[index - 1];
      const to = ttLaserPoints[index];
      const alpha = Math.max(0, 1 - ((now - to.time) / lifetime));
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    const tip = ttLaserCurrentPoint;
    if (tip) {
      ctx.fillStyle = "rgba(220, 38, 38, 1)";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ttLaserPoints.length) {
    ttLaserFrame = requestAnimationFrame(ttRenderLaser);
  } else {
    ttLaserFrame = null;
  }
}

function ttAddLaserPoint(event) {
  const point = ttCanvasPoint(event);
  ttLaserCurrentPoint = { x: point.x, y: point.y };
  ttLaserPoints.push({ x: point.x, y: point.y, time: performance.now() });
  if (ttLaserPoints.length > 80) ttLaserPoints.splice(0, ttLaserPoints.length - 80);
  if (!ttLaserFrame) ttLaserFrame = requestAnimationFrame(ttRenderLaser);
}

function ttIsLaserControlTarget(target) {
  return Boolean(target?.closest?.(
    ".presentation-dock, .global-ink-palette, .present-menu-logo, .teach-bar, "
    + "button, a[href], input, select, textarea, label, summary, [role='button'], [onclick], [contenteditable='true']"
  ));
}

function ttLaserPointerDown(event) {
  if (!ttLaserEnabled || ttLaserTouchMode !== "scoop") return;
  if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
  if (ttIsLaserControlTarget(event.target)) return;
  if (event.cancelable) event.preventDefault();
  ttLaserActivePointerId = event.pointerId;
  try { event.target?.setPointerCapture?.(event.pointerId); } catch {}
  ttAddLaserPoint(event);
}

function ttLaserMove(event) {
  if (!ttLaserEnabled) return;
  if (event.target?.closest?.("#ttLaserScrollPad")) return;
  if (event.pointerType === "touch" && ttLaserTouchMode !== "scoop") return;
  if (event.pointerType === "touch" && ttLaserActivePointerId !== event.pointerId) return;
  if ((event.pointerType === "touch" || event.pointerType === "pen") && event.cancelable) event.preventDefault();
  ttAddLaserPoint(event);
}

function ttLaserEnd(event) {
  if (!ttLaserEnabled || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
  if (ttLaserActivePointerId === event.pointerId) {
    try { event.target?.releasePointerCapture?.(event.pointerId); } catch {}
    ttLaserActivePointerId = null;
  }
  ttLaserCurrentPoint = null;
  if (!ttLaserFrame && ttLaserPoints.length) ttLaserFrame = requestAnimationFrame(ttRenderLaser);
}

function ttLaserTouchMoveLock(event) {
  if (!ttLaserEnabled || ttLaserTouchMode !== "scoop") return;
  if (ttIsLaserControlTarget(event.target)) return;
  if (event.cancelable) event.preventDefault();
}

function ttResetLaserScrollPad() {
  ttLaserScrollPadPointerId = null;
  ttLaserScrollPadLastY = 0;
  ttById("ttLaserScrollPad")?.classList.remove("active");
}

function ttLaserScrollPadStart(event) {
  if (!ttLaserEnabled || ttLaserTouchMode !== "scoop") return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  ttLaserScrollPadPointerId = event.pointerId;
  ttLaserScrollPadLastY = event.clientY;
  event.currentTarget.classList.add("active");
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
}

function ttLaserScrollPadMove(event) {
  if (ttLaserScrollPadPointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  const deltaY = event.clientY - ttLaserScrollPadLastY;
  ttLaserScrollPadLastY = event.clientY;
  const scrollingElement = document.scrollingElement || document.documentElement;
  scrollingElement.scrollTop += deltaY * ttLaserScrollPadSpeed;
}

function ttLaserScrollPadEnd(event) {
  if (ttLaserScrollPadPointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  ttLaserScrollPadPointerId = null;
  ttLaserScrollPadLastY = 0;
  event.currentTarget.classList.remove("active");
  try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
}

function ttLaserLeave() {
  if (!ttLaserEnabled) return;
  ttLaserCurrentPoint = null;
  ttLaserPoints = [];
  if (ttLaserFrame) cancelAnimationFrame(ttLaserFrame);
  ttLaserFrame = null;
  ttClearCanvas("ttLaserCanvas");
}

function ttSetLaserTouchMode(mode) {
  ttLaserTouchMode = mode === "scroll" ? "scroll" : "scoop";
  const scoopMode = ttLaserTouchMode === "scoop";
  document.body.classList.toggle("laser-scoop-mode", ttLaserEnabled && scoopMode);
  document.documentElement.classList.toggle("laser-scoop-mode", ttLaserEnabled && scoopMode);
  if (!scoopMode) {
    ttLaserActivePointerId = null;
    ttResetLaserScrollPad();
  }
  const button = ttById("ttLaserInputMode");
  if (button) {
    button.textContent = scoopMode ? "Scoop" : "Scroll";
    button.title = scoopMode
      ? "Laser captures touch gestures for scooping"
      : "Finger and touch stylus gestures scroll the lesson";
    button.setAttribute("aria-pressed", String(scoopMode));
    button.classList.toggle("active", scoopMode);
  }
}

function ttToggleLaser(force = null) {
  ttLaserEnabled = force ?? !ttLaserEnabled;
  if (ttLaserEnabled) {
    if (ttNotesEnabled) ttToggleNotes(false, false);
    ttSetGlobalInkActive(false);
    ttResizeGlobalPresentationCanvases();
  } else {
    ttLaserActivePointerId = null;
    ttResetLaserScrollPad();
    ttLaserCurrentPoint = null;
    ttLaserPoints = [];
    if (ttLaserFrame) cancelAnimationFrame(ttLaserFrame);
    ttLaserFrame = null;
    ttClearCanvas("ttLaserCanvas");
  }
  document.body.classList.toggle("laser-mode", ttLaserEnabled);
  ttSetLaserTouchMode(ttLaserEnabled ? "scoop" : ttLaserTouchMode);
  ttById("ttLaserToggle")?.classList.toggle("active", ttLaserEnabled);
  ttById("ttLaserToggle")?.setAttribute("aria-pressed", String(ttLaserEnabled));
}

function ttOpenWhiteboard(word = ttSection2Word, sectionLabel = "Section 2") {
  const board = ttById("ttWhiteboard");
  if (!board) return;
  ttWhiteboardWord = word || "";
  if (ttNotesEnabled) ttToggleNotes(false, false);
  board.hidden = false;
  document.body.classList.add("whiteboard-mode");
  ttById("ttWhiteboardTitle").textContent = ttWhiteboardWord ? `Whiteboard - ${ttWhiteboardWord}` : `${sectionLabel} Whiteboard`;
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
  const word = ttWhiteboardWord || ttSection2Word || (ttLesson?.sectionTwoCurrentWords || [])[0] || "";
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
  if (ttStageLocalOnlyMode()) {
    document.querySelectorAll(".mic-toggle").forEach((button) => {
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
    });
  }
  ttById("ttGroup").addEventListener("change", (event) => {
    ttRememberScroll();
    if (appStateSwitchGroup(event.target.value)) return;
  });

  ttById("ttHome")?.addEventListener("click", () => {
    if (!document.body.classList.contains("home-mode")) ttRememberScroll();
    ttStopPaceGuide();
    ttShowHomeScreen(ttActiveGroup().id);
  });
  ttById("ttHomeFirebaseSignIn")?.addEventListener("click", () => ttFirebaseSignIn());
  ttById("ttHomeFirebaseSignOut")?.addEventListener("click", () => ttFirebaseSignOut());
  ttById("ttPlannerUseDefaults")?.addEventListener("click", () => ttUsePlannerDefaults());
  ttById("ttPlannerDuplicatePrevious")?.addEventListener("click", () => ttDuplicatePreviousLesson());
  ["ttPlannerSubstep", "ttPlannerLevel", "ttPlannerWordlist", "ttPlannerSentence", "ttPlannerPassage", "ttPlannerPassageApproach"].forEach((id) => {
    ttById(id)?.addEventListener("change", () => {
      const group = ttPlannerGroup();
      if (!group) return;
      ttEnsurePlannerDraft(group);
      if (id === "ttPlannerSubstep") {
        ttPlannerDraft.substep = ttById(id).value;
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttResetPlannerPageSelections(group, skill, ttPlannerDraft.level || group.readerLevel || "AB");
        ttPlannerDraft.passageId = ttDefaultPassageFor(group, skill)?.id || "";
      }
      if (id === "ttPlannerLevel") {
        ttPlannerDraft.level = ttById(id).value;
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttResetPlannerPageSelections(group, skill, ttPlannerDraft.level);
      }
      if (id === "ttPlannerWordlist") {
        ttPlannerDraft.wordlist = ttById(id).value;
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttSyncRecommendedSentenceForWordlist(group, skill);
      }
      if (id === "ttPlannerSentence") {
        ttPlannerDraft.sentence = ttById(id).value;
        ttPlannerDraft.sentenceSelectionMode = "teacher-selected";
      }
      if (id === "ttPlannerPassage") ttPlannerDraft.passageId = ttById(id).value;
      if (id === "ttPlannerPassageApproach") ttPlannerDraft.passageApproach = ttById(id).value;
      if (["ttPlannerSubstep", "ttPlannerLevel", "ttPlannerWordlist"].includes(id)) {
        const skill = scopeMap.find((item) => item.id === ttPlannerDraft.substep) || activeStep(group);
        ttPickerSelections = {};
        ttPickerSubstepCache = {};
        ttReviewWordFilters = {};
        ttSection8RealSlots = [];
        ttSection8SoundElementsManual = false;
        ttSectionReviewSubsteps = ttDefaultSectionReviewSubsteps(skill, ttPlannerDraft.level || group.readerLevel || "AB");
      }
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
  ttById("ttSaveLesson").addEventListener("click", () => ttSaveCurrentLesson());
  ttById("ttPdfPlan").addEventListener("click", () => ttOpenPdfLessonPlan());
  ttById("ttWilsonPlan").addEventListener("click", () => ttOpenWilsonLessonPlan());
  ttById("ttWilsonFillablePlan")?.addEventListener("click", () => ttOpenFillableWilsonLessonPlan());
  ttById("ttExportViewerClose")?.addEventListener("click", () => ttCloseExportViewer());
  ttById("ttExportViewerPrint")?.addEventListener("click", () => {
    const frame = ttById("ttExportViewerFrame");
    try { frame?.contentWindow?.print(); } catch (_) {}
  });
  ttById("ttExportViewerDownload")?.addEventListener("click", async () => {
    const overlay = ttById("ttExportViewer");
    if (!overlay?._exportBlobUrl) return;
    const button = ttById("ttExportViewerDownload");
    if (overlay._archiveDownload && overlay._exportBytes && ttIsNativeIpadShell()) {
      const priorLabel = button?.textContent || "Download";
      let archived = false;
      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }
      try {
        await ttSaveDownloadedLessonPlanPdf(overlay._exportBytes, overlay._exportFilename || "Teach Today Fillable Lesson Plan.pdf");
        archived = true;
      } catch (error) {
        console.warn("Teach Today could not save the downloaded lesson plan:", error);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = priorLabel;
        }
      }
      if (archived) return;
    }
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
  ttById("ttAttendanceReminder")?.addEventListener("click", () => ttOpenAttendanceSessionModal());
  ttById("ttPresent").addEventListener("click", () => ttTogglePresentation());
  ttById("ttOpenIntro21")?.addEventListener("click", () => ttOpenIntro21("guided"));
  ttById("ttOpenIntro21Discovery")?.addEventListener("click", () => ttOpenIntro21("discovery"));
  ttById("ttOpenIntro35Discovery")?.addEventListener("click", () => ttOpenIntro35());
  ttById("ttOpenIntro21B2")?.addEventListener("click", () => ttOpenIntro21("guided", "section2b", "ttOpenIntro21B2"));
  ttById("ttOpenIntro21DiscoveryB2")?.addEventListener("click", () => ttOpenIntro21("discovery", "section2b", "ttOpenIntro21DiscoveryB2"));
  ttById("ttOpenIntro35DiscoveryB2")?.addEventListener("click", () => ttOpenIntro35("suffix-memory-question", "section2b", "ttOpenIntro35DiscoveryB2"));
  ttById("ttOpenIntro35Spelling")?.addEventListener("click", () => ttOpenIntro35("spell-bridge", "section7", "ttOpenIntro35Spelling"));
  ttById("ttIntroMirrorToggle")?.addEventListener("click", () => ttToggleIntroTeacherMirror());
  ttById("ttIntro21Close")?.addEventListener("click", () => ttCloseIntro21());
  ttById("ttIntro21Restart")?.addEventListener("click", () => {
    ttIntro21Index = 0;
    ttRenderIntro21();
  });
  ttById("ttIntro21Back")?.addEventListener("click", () => ttStepIntro21(-1));
  ttById("ttIntro21Next")?.addEventListener("click", () => ttStepIntro21(1));
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
  const trackSectionControl = (event, source) => {
    const card = event.target.closest?.(".teach-card[id^='section']");
    if (!card) return;
    const meaningful = event.target.closest?.("button, a, input, select, textarea, canvas, [role='button'], [contenteditable='true']");
    if (meaningful) ttRecordSectionInteraction(card.id, source);
  };
  document.addEventListener("click", (event) => trackSectionControl(event, "click"), true);
  document.addEventListener("change", (event) => trackSectionControl(event, "change"), true);
  document.addEventListener("input", (event) => trackSectionControl(event, "input"), true);
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("canvas")) trackSectionControl(event, "canvas");
  }, true);
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
  document.querySelectorAll("[data-native-projection-mode='mirror']").forEach((button) => {
    button.hidden = !ttIsNativeIpadShell();
    button.addEventListener("click", () => ttEnableNativeTeacherMirror());
  });
  window.addEventListener("teachTodayNativeProjectionMode", (event) => {
    ttNativeProjectionMode = event.detail?.mode === "mirror" ? "mirror" : "stage";
    ttUpdateStudentDisplayStatus(ttStudentDisplayMode);
  });
  ttById("ttDockDisplay")?.addEventListener("click", () => ttTogglePresentDisplayTray());
  ttById("ttPresentDisplayOpen")?.addEventListener("click", () => ttOpenStudentDisplay(ttStudentDisplayMode));
  ttById("ttPresentDisplayProjector")?.addEventListener("click", () => ttProjectStudentDisplay());
  ttById("ttPresentDisplayTray")?.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.addEventListener("click", () => ttSetStudentDisplayMode(button.dataset.displayMode));
  });
  ttById("ttExitPresent").addEventListener("click", () => {
    if (ttIntro21Open) ttCloseIntro21();
    else ttTogglePresentation(false);
  });
  ttById("ttNotesToggle").addEventListener("click", () => ttToggleNotes());
  ttById("ttLaserToggle")?.addEventListener("click", () => ttToggleLaser());
  ttById("ttLaserInputMode")?.addEventListener("click", () => {
    ttSetLaserTouchMode(ttLaserTouchMode === "scoop" ? "scroll" : "scoop");
  });
  const laserScrollPad = ttById("ttLaserScrollPad");
  laserScrollPad?.addEventListener("pointerdown", ttLaserScrollPadStart);
  laserScrollPad?.addEventListener("pointermove", ttLaserScrollPadMove);
  laserScrollPad?.addEventListener("pointerup", ttLaserScrollPadEnd);
  laserScrollPad?.addEventListener("pointercancel", ttLaserScrollPadEnd);
  laserScrollPad?.addEventListener("lostpointercapture", ttLaserScrollPadEnd);
  laserScrollPad?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const scrollingElement = document.scrollingElement || document.documentElement;
    scrollingElement.scrollTop += event.key === "ArrowUp" ? -240 : 240;
  });
  ttById("ttGlobalInkInteract")?.addEventListener("click", () => ttSetGlobalInkActive(false));
  ttById("ttGlobalInkUndo")?.addEventListener("click", () => ttUndoGlobalInk());
  ttById("ttGlobalInkClear")?.addEventListener("click", () => ttClearGlobalInk());
  ttById("ttGlobalInkPalette")?.querySelectorAll("[data-global-ink-mode]").forEach((button) => {
    button.addEventListener("click", () => ttSetGlobalInkMode(button.dataset.globalInkMode));
  });
  ttById("ttGlobalInkPalette")?.querySelectorAll("[data-global-ink-color]").forEach((button) => {
    button.addEventListener("click", () => {
      ttGlobalInkState.color = button.dataset.globalInkColor || ttGlobalInkState.color;
      ttById("ttGlobalInkPalette")?.querySelectorAll("[data-global-ink-color]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
    });
  });
  ttById("ttGlobalInkSize")?.addEventListener("input", (event) => {
    ttGlobalInkState.size = Number(event.target.value) || 5;
  });
  ttById("ttDockPrevSection")?.addEventListener("click", () => {
    if (ttIntro21Open) ttStepIntro21(-1);
    else ttGoToTeachingSection(-1);
  });
  ttById("ttDockNextSection")?.addEventListener("click", () => {
    if (ttIntro21Open) ttStepIntro21(1);
    else ttGoToTeachingSection(1);
  });
  ttById("ttDockTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.addEventListener("keydown", (event) => {
    const attendanceModal = ttById("ttAttendanceSessionModal");
    if (event.key === "Escape" && attendanceModal && !attendanceModal.hidden) {
      event.preventDefault();
      ttCloseAttendanceSessionModal();
      return;
    }
    if (ttIntro21Open) {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        ttStepIntro21(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        ttStepIntro21(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        ttIntro21Index = 0;
        ttRenderIntro21();
      } else if (event.key === "Escape") {
        event.preventDefault();
        ttCloseIntro21();
      }
      return;
    }
    if (event.key === "Escape" && document.body.classList.contains("present-menu-open")) {
      ttSetPresentationMenu(false);
    } else if (event.key === "Escape" && ttLaserEnabled) {
      ttToggleLaser(false);
    } else if (event.key === "Escape" && ttGlobalInkState.active) {
      ttSetGlobalInkActive(false);
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
  const globalInkCanvas = ttById("ttGlobalInkCanvas");
  globalInkCanvas?.addEventListener("pointerdown", ttGlobalInkStart);
  globalInkCanvas?.addEventListener("pointermove", ttGlobalInkMove);
  globalInkCanvas?.addEventListener("pointerup", ttGlobalInkEnd);
  globalInkCanvas?.addEventListener("pointercancel", ttGlobalInkEnd);
  window.addEventListener("pointerdown", ttLaserPointerDown, { passive: false, capture: true });
  window.addEventListener("pointermove", ttLaserMove, { passive: false });
  window.addEventListener("pointerup", ttLaserEnd, { passive: false });
  window.addEventListener("pointercancel", ttLaserEnd, { passive: false });
  document.addEventListener("touchmove", ttLaserTouchMoveLock, { passive: false, capture: true });
  document.documentElement.addEventListener("pointerleave", ttLaserLeave);
  window.addEventListener("blur", ttLaserLeave);
  window.addEventListener("resize", () => {
    if (ttNotesEnabled) {
      ttResizeNotesCanvas();
      ttClearCanvas("ttNotesCanvas");
    }
    if (!ttById("ttWhiteboard")?.hidden) {
      ttResizeWhiteboardCanvases();
    }
    if (document.body.classList.contains("presentation-mode")) {
      ttResizeGlobalPresentationCanvases();
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
  ["ttSavedToggle", "ttHomeSavedToggle"].forEach((buttonId) => {
    ttById(buttonId)?.addEventListener("click", () => ttToggleSharedDataPanel(
      "saved",
      buttonId === "ttHomeSavedToggle" ? "ttHomeDataPanels" : "ttLessonDataPanels"
    ));
  });
  ttById("ttSavedClose")?.addEventListener("click", () => {
    ttById("ttSavedPanel").hidden = true;
    ttSetSharedDataButtonState("saved", false);
  });
  ["ttDataToggle", "ttHomeDataToggle"].forEach((buttonId) => {
    ttById(buttonId)?.addEventListener("click", () => ttToggleSharedDataPanel(
      "data",
      buttonId === "ttHomeDataToggle" ? "ttHomeDataPanels" : "ttLessonDataPanels"
    ));
  });
  ttById("ttDataClose")?.addEventListener("click", () => {
    ttById("ttDataPanel").hidden = true;
    ttSetSharedDataButtonState("data", false);
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
  ["ttProfile", "ttHomeProfile"].forEach((buttonId) => {
    ttById(buttonId)?.addEventListener("click", () => ttOpenStudentProfile());
  });
  ttById("ttBackupData").addEventListener("click", () => ttBackupData());
  ttById("ttDownloadRecovery")?.addEventListener("click", () => ttDownloadLatestRecovery());
  ttById("ttDownloadRecoveryBundle")?.addEventListener("click", () => ttDownloadRecoveryBundle());
  ttById("ttFirebaseTimelineRefresh")?.addEventListener("click", () => ttLoadFirebaseTimeline({ force: true }));
  ttById("ttFirebaseTimeline")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-firebase-revision-download]");
    if (!button) return;
    ttDownloadFirebaseRevision(button.dataset.firebaseRevisionDownload, button);
  });
  ttById("ttConnectCloudSync").addEventListener("click", () => ttConnectCloudSync());
  ttById("ttSyncCloudNow").addEventListener("click", () => ttCloudSyncWrite("Saved local backup file now."));
  ttById("ttDriveConnect")?.addEventListener("click", () => ttUploadPendingAudioToDrive().catch((err) => {
    localStorage.setItem("teachToday.driveStatus", `Google Drive audio failed: ${ttFriendlyDriveError(err)}`);
    ttRenderDataCenter();
  }));
  ttById("ttDriveBackupConnect")?.addEventListener("click", async () => {
    localStorage.setItem(ttIndependentBackupEnabledKey, "true");
    try {
      await ttRunIndependentBackup({ connectDrive: true });
    } catch (error) {
      ttSetIndependentBackupStatus(`Backup needs attention. ${ttFriendlyDriveError(error)}`, { notify: true });
    }
  });
  ttById("ttIndependentBackupNow")?.addEventListener("click", () => ttRunNativeBackupNow().catch((error) => {
    ttSetIndependentBackupStatus(`Backup needs attention. ${ttFriendlyDriveError(error)}`, { notify: true });
  }));
  ttById("ttFirebaseLoadProtected")?.addEventListener("click", () => ttLoadProtectedFirebaseCopy());
  ttById("ttFirebaseSyncNow").addEventListener("click", () => ttSyncFirebaseAndLocalNow());
  ttById("ttSecureLegacyStudentData")?.addEventListener("click", () => ttSecureLegacyStudentData());
  ttById("ttConnectionBackup")?.addEventListener("click", () => ttBackupData());
  ttById("ttConnectionRetry")?.addEventListener("click", () => ttHandleConnectionPrimaryAction());
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
  ttById("ttEditSection2CardsB2")?.addEventListener("click", () => ttEditSection2BCards());
  ttById("ttSaveSection2CardsB2")?.addEventListener("click", () => ttSaveSection2BCards());
  ttById("ttCancelSection2EditB2")?.addEventListener("click", () => ttCancelSection2BEdit());
  ttById("ttSection2EditInputB2")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttSaveSection2BCards();
    if (event.key === "Escape") ttCancelSection2BEdit();
  });
  ttById("ttCurrentWordSelectB2")?.addEventListener("change", (event) => {
    if (event.target.value) ttShowSection2BWordByDeck(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttReviewCategoryB2")?.addEventListener("change", (event) => {
    ttFillSection2BReviewCategoryWords(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttUseCustomWordB2")?.addEventListener("click", () => ttUseCustomSection2BWord());
  ttById("ttSection2CustomWordB2")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttUseCustomSection2BWord();
  });
  ttById("ttOpenWhiteboardB2")?.addEventListener("click", () => ttOpenWhiteboard(ttSection2BWord, "Section 2B"));
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
  ttById("ttSection3HfwReviewStep")?.addEventListener("change", () => {
    ttCardMode = "hfw";
    ttFillSection3Cards(ttLesson);
  });
  document.querySelectorAll("[data-fat-threshold]").forEach((button) => {
    button.addEventListener("click", () => {
      ttFatStackThreshold = button.dataset.fatThreshold || "all";
      ttCardMode = "fat";
      ttFillSection3Cards(ttLesson);
    });
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
  ttById("ttSection4HistoryToggle")?.addEventListener("click", () => ttToggleSection4History());
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
  ttById("section4").querySelector(".stop-timer").addEventListener("click", () => {
    ttFinalizeSection4Record({ automatic: true, force: true });
  });
  ttById("section4").querySelector(".mute-toggle")?.addEventListener("click", () => {
    if (isSpeechMuted) unmuteSpeech(ttChartCard);
    else muteSpeech(ttChartCard, 8);
  });
  ttById("section4").querySelector(".save-live-record").addEventListener("click", () => {
    ttFinalizeSection4Record({ automatic: false, force: true });
  });
}

let ttSection4FinalizePromise = null;
let ttSection4WasVisible = false;

function ttFinalizeSection4Record({ automatic = true, force = false } = {}) {
  if (!ttChartCard) return Promise.resolve(false);
  if (ttSection4FinalizePromise) return ttSection4FinalizePromise;

  ttSection4FinalizePromise = (async () => {
    const hasActivity = force
      || ttChartCard.classList.contains("is-timing")
      || hasUnsavedLiveData(ttChartCard);
    if (!hasActivity) return false;
    stopLiveTimer(ttChartCard, false);
    if (typeof activeRecognition !== "undefined" && activeRecognition) {
      try { activeRecognition.stop(); } catch (_) {}
      // eslint-disable-next-line no-global-assign
      activeRecognition = null;
    }
    const shouldSave = force || hasUnsavedLiveData(ttChartCard);
    await stopAudioRecording(shouldSave);
    if (!shouldSave) return false;
    showAudioPlayerInCard(ttChartCard);
    saveLiveRecord(ttChartCard, { automatic });
    ttFillStudentPills(ttActiveGroup());
    return true;
  })().finally(() => {
    ttSection4FinalizePromise = null;
  });
  return ttSection4FinalizePromise;
}

function ttMonitorSection4AutoSave() {
  const section = ttChartCard || ttById("section4");
  if (!section || ttById("ttTeachFlow")?.hidden) {
    ttSection4WasVisible = false;
    return;
  }
  const rect = section.getBoundingClientRect();
  const visible = rect.bottom > 120 && rect.top < window.innerHeight - 120;
  if (ttSection4WasVisible && !visible) {
    ttFinalizeSection4Record({ automatic: true });
  }
  ttSection4WasVisible = visible;
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
  const student = group.activeStudent || ttTeachingStudents(group)[0] || "";
  if (!student) return;
  const studentId = ttStudentIdForName(student, group);
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
window.addEventListener("beforeunload", () => {
  ttFinalizeActivePassageStroke();
  if (ttChartCard && !ttSection4FinalizePromise) saveLiveRecordIfNeeded(ttChartCard);
});
window.addEventListener("pagehide", ttResetHomeContinuityTransientUi);
window.addEventListener("pageshow", ttRefreshHomeAfterPageRestore);
window.addEventListener("scroll", () => {
  ttQueueStudentDisplayFollowSync();
  ttMonitorSection4AutoSave();
}, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && ttChartCard && !ttSection4FinalizePromise) {
    saveLiveRecordIfNeeded(ttChartCard);
  }
  if (document.visibilityState === "hidden" && ttStageLocalOnlyMode()) {
    ttQueueStageNativeBackup({ immediate: true }).catch(() => {});
  }
});
window.addEventListener("resize", ttQueueStudentDisplayFollowSync, { passive: true });
ttRender();
if (!ttLoadedPlan) ttShowHomeScreen();
if (ttStageLocalOnlyMode()) {
  setTimeout(() => ttQueueStageNativeBackup({ immediate: true }).catch(() => {}), 5000);
}
const ttAttendanceEditDate = new URLSearchParams(location.search).get("editAttendance");
if (ttAttendanceEditDate) requestAnimationFrame(() => ttOpenAttendanceSessionModal(ttAttendanceEditDate, { history: true }));
ttHandleDeveloperRoute();
