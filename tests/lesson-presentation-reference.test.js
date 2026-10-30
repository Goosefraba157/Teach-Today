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

const display = fs.readFileSync(require.resolve('../student-display.js'), 'utf8');
const readStart = display.indexOf('function dictationSheetReference(');
const readEnd = display.indexOf('\nfunction ', readStart + 1);
vm.runInContext(display.slice(readStart, readEnd), context);

test('installed native prompt renders separate on-sheet fields with an optional compact date', () => {
  const prompt = 'Substep 6.4 · Lesson 5 · Date Oct 29, 2026';
  const shown = context.dictationSheetReference({dictationPaper:{prompt}});
  assert.equal(shown.substep, '6.4'); assert.equal(shown.lesson, '5'); assert.equal(shown.date, '10/29/26');
  const hidden = context.dictationSheetReference({dictationPaper:{prompt:'Substep 6.4 · Lesson 5'}});
  assert.equal(hidden.date, ''); assert.equal(hidden.substep, shown.substep); assert.equal(hidden.lesson, shown.lesson);
});

test('legacy prompts and malformed references leave sheet fields blank', () => {
  for (const prompt of ['Listen, repeat, tap the sounds, and write.', 'Substep <script> · Lesson 5', 'PRIVATE NAME', '']) {
    const result = context.dictationSheetReference({dictationPaper:{prompt}});
    assert.equal(result.substep, ''); assert.equal(result.lesson, ''); assert.equal(result.date, '');
  }
});
