const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../teach-today.js'), 'utf8');
const names = ['ttPlanLessonNumber', 'ttPlanSessionDay', 'ttDateFromKey', 'ttLessonDate', 'ttDictationLessonReference'];
const context = { ttDictationDateVisible: false, ttTodayKey: () => '2026-10-29' };
vm.createContext(context);
for (const name of names) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}

test('dictation reference follows saved Day 2 date and lesson number without identities or writes', () => {
  const group = { name: 'PRIVATE GROUP', students: ['PRIVATE NAME'], lessonSerial: 99 };
  const lesson = { substep: '4.2', lessonType: 'group', lessonSequence: 6, scheduledDate: '2026-10-27' };
  const plan = { lessonNumber: 7, activeDay: '2', sessions: { '1': { date: '2026-10-27' }, '2': { date: '2026-10-29' } } };
  const before = JSON.stringify({group,lesson,plan});
  const result = context.ttDictationLessonReference(lesson, group, plan, true);
  assert.equal(result, 'Substep 4.2 · Lesson 7 · Date Oct 29, 2026');
  assert.equal(JSON.stringify({group,lesson,plan}), before);
  assert.ok(!result.includes('PRIVATE'));
});

test('draft reference uses the scheduled lesson date and existing number fallback', () => {
  const result = context.ttDictationLessonReference({ substep: '2.3', lessonSequence: 12, scheduledDate: '2026-10-30' }, {}, null, true);
  assert.equal(result, 'Substep 2.3 · Lesson 12 · Date Oct 30, 2026');
});

test('date stays absent until explicitly revealed and hides again without changing lesson identity', () => {
  const lesson = { substep: '4.2', lessonSequence: 7, scheduledDate: '2026-10-29' };
  assert.equal(context.ttDictationLessonReference(lesson, {}, null), 'Substep 4.2 · Lesson 7');
  assert.match(context.ttDictationLessonReference(lesson, {}, null, true), /Date Oct 29, 2026$/);
  assert.equal(context.ttDictationLessonReference(lesson, {}, null, false), 'Substep 4.2 · Lesson 7');
});
