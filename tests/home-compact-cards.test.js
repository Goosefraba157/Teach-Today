const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('teach-today.js', 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const group = { id: 'g', substep: '4.2', lessonSerial: 99, history: [] };
  const state = { groups: [group], lessonDrafts: {} };
  const ctx = vm.createContext({ appState: state, Date });
  vm.runInContext(source.slice(source.indexOf('function ttHomeGroupLessonSummary('), source.indexOf('function ttHomeGroupCardHtml(')), ctx);
  const plan = (id, status, number, extra = {}) => ({ id, source: 'TeachToday', status, lessonNumber: number,
    lessons: [{ id: `lesson-${id}`, substep: '2.1', ...extra }] });
  return { group, state, ctx, plan, summary: () => ctx.ttHomeGroupLessonSummary(group) };
}
test('Home cards distinguish no lesson, saved plan, started lesson, completion and incomplete closure without writes', () => {
  const f = fixture();
  assert.equal(f.summary().status, 'No lesson yet');
  assert.equal(f.summary().number, '—', 'never invent the last number from the serial');
  f.group.history.push(f.plan('old', 'Complete', 17), f.plan('next', 'Saved', 18));
  const before = clone(f.state);
  assert.equal(f.summary().status, 'Next lesson planned · Not started');
  assert.equal(f.summary().number, 18);
  assert.equal(f.summary().substep, '2.1', 'use the shown lesson, not the later group substep');
  assert.deepEqual(f.state, before);
  f.group.history[1].status = 'In progress';
  assert.equal(f.summary().status, 'In progress');
  f.group.history[1].status = 'Complete';
  assert.equal(f.summary().status, 'Lesson completed');
  f.group.history[1].status = ' complete ';
  assert.equal(f.summary().status, 'Lesson completed');
  f.group.history[1].status = 'Incomplete';
  assert.equal(f.summary().status, 'Closed incomplete');
});
test('Home prefers the explicitly active plan, excludes tests, and supports combined participation', () => {
  const f = fixture();
  f.group.history.push(f.plan('active', 'In progress', 18), f.plan('later', 'Saved', 19), f.plan('test', 'Test', 20));
  f.group.activeLessonPlanId = 'active';
  assert.equal(f.summary().number, 18);
  f.group.history[0].excludedFromLessonSequence = true;
  assert.equal(f.summary().number, 19);
  f.group.history[1].source = 'CombinedSession';
  assert.equal(f.summary().number, 19);
  f.group.history[1].status = 'Complete';
  assert.equal(f.summary().status, 'Lesson completed');
});
test('Home uses chronological work, not the highest section; untimed legacy markers never invent a last section', () => {
  const f = fixture();
  const lesson = { sectionProgress: {
    section8: { state: 'done', completedAt: '2026-10-29T10:00:00Z' },
    section2b: { state: 'inprogress', startedAt: '2026-10-29T11:00:00Z' }
  }, completedSections: { section8: 'done' } };
  f.group.history.push(f.plan('p', 'Saved', 18, lesson));
  assert.equal(f.summary().lastSection, 'section2b');
  assert.equal(f.summary().status, 'In progress');
  f.group.history[0].lessons[0].lastSectionActivity = { sectionId: 'section4', at: '2026-10-29T12:00:00Z' };
  assert.equal(f.summary().lastSection, 'section4');
  delete f.group.history[0].lessons[0].lastSectionActivity;
  delete f.group.history[0].lessons[0].sectionProgress;
  assert.equal(f.summary().lastSection, '');
  assert.equal(f.summary().status, 'In progress');
});
test('An explicit saved draft is planned; merely rendering planner defaults is not', () => {
  const f = fixture();
  f.group.history.push(f.plan('finished', 'Complete', 18));
  assert.equal(f.summary().status, 'Lesson completed');
  f.state.lessonDrafts.g = { substep: '2.2', draftSavedAt: '2026-10-29T12:00:00Z' };
  assert.equal(f.summary().status, 'Draft planned · Not started');
  assert.equal(f.summary().number, 'Next');
  assert.equal(f.summary().substep, '2.2');
  f.group.history.push(f.plan('active', 'In progress', 19));
  assert.equal(f.summary().status, 'In progress', 'an active lesson takes priority over a draft');
});
test('Revisiting a section updates only lesson-position metadata, never section completion or educational evidence', () => {
  const progress = require('../lesson-progress.js');
  const lesson = { completedSections: { section4: 'done' }, sectionProgress: {}, lastSectionActivity: { sectionId: 'section8', at: '2026-10-29T11:00:00Z' } };
  const plan = { lessons: [lesson] };
  const context = { lesson, plan };
  let queued = 0;
  const ctx = vm.createContext({ window: { TeachTodayLessonProgress: progress }, ttSectionProgressContext: () => context,
    ttInitSectionCompletion: () => {}, ttQueueAttendanceActivitySave: () => queued++, Date });
  vm.runInContext(source.slice(source.indexOf('function ttTrackLessonSectionActivity('), source.indexOf('async function ttReviewSection8BeforeFinish(')), ctx);
  ctx.ttTrackLessonSectionActivity('section4');
  assert.equal(lesson.lastSectionActivity.sectionId, 'section4');
  assert.equal(lesson.completedSections.section4, 'done');
  assert.deepEqual(lesson.sectionProgress, {});
  assert.equal(queued, 1);
  ctx.ttTrackLessonSectionActivity('section4');
  ctx.ttTrackLessonSectionActivity('bogus');
  assert.equal(queued, 1, 'repeated same-section controls do not add writes');
});
