const assert = require('node:assert/strict');
const test = require('node:test');
const progress = require('../lesson-progress.js');
const clone = value => JSON.parse(JSON.stringify(value));
const firstAt = '2026-10-17T13:00:00.000Z';
const nextAt = '2026-10-17T13:10:00.000Z';

function fixture() {
  const lesson = { id: 'lesson', savedPlanId: 'plan' };
  const plan = { id: 'plan', source: 'TeachToday', status: 'In progress', lessons: [lesson] };
  const group = { id: 'group', schoolYearId: '2026-2027', activeLessonPlanId: 'plan', history: [plan] };
  return { group, plan, lesson, activeSchoolYearId: '2026-2027', homeMode: false };
}

test('progress can track only the saved active current-year host lesson', () => {
  const f = fixture();
  const before = clone(f);
  assert.equal(progress.canTrack(f), true);
  assert.deepEqual(f, before);
  delete f.group.activeLessonPlanId;
  assert.equal(progress.canTrack(f), true, 'legacy plans without an active pointer remain usable');
  const changes = [
    f => { f.homeMode = true; },
    f => { f.group.schoolYearId = '2025-2026'; },
    f => { f.lesson.schoolYearId = '2025-2026'; },
    f => { f.plan.schoolYearId = '2025-2026'; },
    f => { f.group.activeLessonPlanId = 'another-plan'; },
    f => { f.lesson.savedPlanId = 'another-plan'; },
    f => { f.plan.lessons = [{ id: 'another-lesson' }]; },
    f => { f.group.history = []; },
    f => { f.plan.groupIdAtTime = 'another-group'; },
    f => { f.plan.hostGroupId = 'another-group'; },
    f => { f.plan.source = 'CombinedSession'; },
    f => { f.plan.readOnly = true; },
    f => { f.plan.combinedParticipation = true; },
    f => { f.plan.excludedFromLessonSequence = true; },
    f => { delete f.lesson.savedPlanId; },
    ...['Complete', 'Incomplete', 'Test', ' complete '].map(status => f => { f.plan.status = status; })
  ];
  changes.forEach(change => {
    const blocked = fixture();
    change(blocked);
    const original = clone(blocked);
    assert.equal(progress.canTrack(blocked), false);
    assert.deepEqual(blocked, original, 'eligibility checks never mutate state');
  });
  assert.equal(progress.canTrack(), false);
});

test('activity records only the first meaningful interaction and never infers completion', () => {
  const lesson = {};
  assert.equal(progress.activity(lesson, 'section6', { at: firstAt }), true);
  const before = clone(lesson);
  for (let n = 0; n < 100; n++) assert.equal(progress.activity(lesson, 'section6', { at: nextAt }), false);
  assert.deepEqual(lesson, before);
  assert.equal(lesson.completedSections, undefined);
  assert.deepEqual(lesson.sectionProgress.section6, { state: 'inprogress', source: 'activity', startedAt: firstAt });
  assert.equal(progress.summary(lesson).statuses.section6, 'inprogress');
});

test('completion is idempotent, retains first activity, and stores compatibility state', () => {
  const lesson = {};
  progress.activity(lesson, 'section2', { at: firstAt });
  assert.equal(progress.mark(lesson, 'section2', { source: 'next', at: nextAt }), true);
  assert.equal(lesson.completedSections.section2, 'done');
  assert.equal(lesson.sectionProgress.section2.startedAt, firstAt);
  assert.equal(lesson.sectionProgress.section2.completedAt, nextAt);
  const before = clone(lesson);
  assert.equal(progress.mark(lesson, 'section2', { source: 'another-next', at: firstAt }), false);
  assert.equal(progress.activity(lesson, 'section2', { at: nextAt }), false);
  assert.deepEqual(lesson, before);
});

test('teacher skipped and reopened states suppress automatic completion until explicitly finished', () => {
  const lesson = {};
  progress.mark(lesson, 'section8', { at: firstAt });
  assert.equal(progress.mark(lesson, 'section8', { manual: true, state: 'skipped', at: nextAt }), true);
  const skipped = clone(lesson);
  assert.equal(progress.mark(lesson, 'section8', { at: nextAt }), false);
  assert.equal(progress.mark(lesson, 'section8', { manual: true, state: 'skipped', at: firstAt }), false);
  assert.equal(progress.activity(lesson, 'section8', { at: nextAt }), false);
  assert.deepEqual(lesson, skipped);
  assert.equal(progress.mark(lesson, 'section8', { manual: true, state: null, at: nextAt }), true);
  assert.equal(lesson.completedSections.section8, undefined);
  assert.equal(lesson.sectionProgress.section8.manualOverride, true);
  assert.equal(lesson.sectionProgress.section8.completedAt, undefined);
  const reopened = clone(lesson);
  assert.equal(progress.mark(lesson, 'section8', { at: nextAt }), false);
  assert.equal(progress.activity(lesson, 'section8', { at: nextAt }), false);
  assert.deepEqual(lesson, reopened);
  assert.equal(progress.mark(lesson, 'section8', { manual: true, at: nextAt }), true);
  assert.equal(progress.summary(lesson).statuses.section8, 'done');
});

test('legacy done and skipped states remain authoritative without timestamp backfills', () => {
  const lesson = { completedSections: { section4: 'done', section9: 'skipped' }, sectionProgress: { section4: { state: 'inprogress', startedAt: firstAt } } };
  const original = clone(lesson);
  assert.equal(progress.summary(lesson).statuses.section4, 'done');
  assert.equal(progress.summary(lesson).statuses.section9, 'skipped');
  assert.equal(progress.mark(lesson, 'section4', { at: nextAt }), false);
  assert.equal(progress.mark(lesson, 'section9', { at: nextAt }), false);
  assert.equal(progress.activity(lesson, 'section9', { at: nextAt }), false);
  assert.deepEqual(lesson, original);
});

test('Day 1 and Day 2 sections have independent progress, with all 12 statuses reported', () => {
  const lesson = {};
  progress.mark(lesson, 'section1', { at: firstAt });
  progress.mark(lesson, 'section2', { at: firstAt });
  progress.activity(lesson, 'section1b', { at: nextAt });
  const result = progress.summary(lesson);
  assert.equal(Object.keys(result.statuses).length, 12);
  assert.deepEqual(result.done, ['section1', 'section2']);
  assert.deepEqual(result.inprogress, ['section1b']);
  assert.equal(result.statuses.section2b, 'unmarked');
  assert.equal(result.done.length + result.skipped.length + result.inprogress.length + result.unmarked.length, 12);
});

test('progress changes cannot fabricate assessment, attendance, or passage evidence', () => {
  const f = fixture();
  f.group.dictationAssessments = [{ id: 'assessment', categories: { Words: ['synthetic'] } }];
  f.group.encodingObservations = [{ id: 'miss', lessonId: 'lesson', section: 'section8', item: 'synthetic' }];
  f.group.chartResults = [{ recordId: 'chart' }];
  f.lesson.section9Ink = [{ points: [{ x: 0.1, y: 0.2 }] }];
  const historical = { id: 'old-plan', status: 'Complete', lessons: [{ id: 'old-lesson', completedSections: { section1: 'done' } }] };
  f.group.history.push(historical);
  const evidence = clone([f.group.dictationAssessments, f.group.encodingObservations, f.group.chartResults, f.lesson.section9Ink, historical]);
  for (const id of Object.keys(progress.summary(f.lesson).statuses)) progress.mark(f.lesson, id, { at: firstAt });
  assert.deepEqual([f.group.dictationAssessments, f.group.encodingObservations, f.group.chartResults, f.lesson.section9Ink, historical], evidence);
  assert.equal(f.plan.status, 'In progress');
  assert.equal(f.group.attendance, undefined);
});

test('unknown section IDs, invalid states, and invalid timestamps leave lessons untouched', () => {
  const lesson = {};
  for (const id of ['section11', '__proto__', '', 'section1B']) {
    assert.equal(progress.mark(lesson, id, { at: firstAt }), false);
    assert.equal(progress.activity(lesson, id, { at: firstAt }), false);
  }
  assert.equal(progress.mark(lesson, 'section1', { state: 'Complete', at: firstAt }), false);
  assert.equal(progress.mark(lesson, 'section1', { at: 'invalid' }), false);
  assert.equal(progress.activity(lesson, 'section1', { at: 'invalid' }), false);
  assert.deepEqual(lesson, {});
  assert.equal(progress.mark(null, 'section1'), false);
  assert.equal(progress.activity(null, 'section1'), false);
});
