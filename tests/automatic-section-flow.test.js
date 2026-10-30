const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const progress = require('../lesson-progress.js');
const source = fs.readFileSync('teach-today.js','utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function span(first,next) {
  const start=source.search(new RegExp(`^(?:async )?function ${first}\\(`,'m'));
  const end=source.search(new RegExp(`^(?:async )?function ${next}\\(`,'m'));
  assert.ok(start>=0&&end>start);return source.slice(start,end);
}
function fixture({save=async()=>{},ids=['section1','section2','section4','section10']}={}) {
  const lesson={id:'lesson',savedPlanId:'plan',section9Ink:[{points:[1,2]}]};
  const sibling={id:'sibling',evidence:['keep']};
  const plan={id:'plan',source:'TeachToday',status:'In progress',lessons:[lesson,sibling]};
  const group={id:'g',schoolYearId:'2026-2027',history:[plan],activeLessonPlanId:'plan',dictationAssessments:[],encodingObservations:[]};
  const calls={scroll:[],saves:0,render:0};
  const ctx=vm.createContext({
    window:{TeachTodayLessonProgress:progress},appState:{groups:[group],activeSchoolYearId:'2026-2027'},
    document:{body:{classList:{contains:()=>false}}},ttActiveGroup:()=>group,ttCurrentPlan:()=>plan,
    ttEnsureStageStorageReady:async()=>true,ttClone:clone,ttById:id=>({scrollIntoView:()=>calls.scroll.push(id)}),
    ttInitSectionCompletion:()=>{},ttRenderLessonIdentity:()=>{},ttUpdateSaveStatus:()=>{},ttShowBackupToast:()=>{},
    ttPaceGuideSectionIds:()=>ids,ttCurrentPaceSectionId:()=>ids[0],ttRecordSectionInteraction:()=>{},
    ttFinalizeSection4Record:async()=>{},ttConfirmSection4Complete:async()=>true,
    ttRenderWrapUpPanel:()=>calls.render++,ttUpdatePaceGuide:()=>{},ttQueueStudentDisplayFollowSync:()=>{},
    ttPaceGuideState:{},saveState:async()=>{calls.saves++;await save();},Date,Promise
  });
  ctx.fixtureLesson=lesson;
  vm.runInContext(`var ttLesson=fixtureLesson;\n${span('ttSectionProgressContext','ttToggleSectionDone')}\nlet ttSectionNavigationBusy=false;\n${span('ttGoToTeachingSection','ttSetPaceGuideLine')}`,ctx);
  return {ctx,lesson,plan,group,sibling,calls};
}
test('forward navigation waits for durable progress, coalesces taps, and preserves evidence',async()=>{
  let release;const pending=new Promise(resolve=>release=resolve);
  const f=fixture({save:()=>pending});const before=clone([f.sibling,f.lesson.section9Ink,f.group.dictationAssessments]);
  const moving=f.ctx.ttGoToTeachingSection(1,'section1');await new Promise(setImmediate);
  assert.deepEqual(f.calls.scroll,[]);await f.ctx.ttGoToTeachingSection(1,'section1');assert.equal(f.calls.saves,1);
  release();await moving;assert.equal(f.lesson.completedSections.section1,'done');assert.deepEqual(f.calls.scroll,['section2']);
  assert.equal(f.plan.lessons.length,2);assert.deepEqual([f.sibling,f.lesson.section9Ink,f.group.dictationAssessments],before);
});
test('Back, hidden section links, and historical lessons create no automatic completion',async()=>{
  const f=fixture();await f.ctx.ttGoToTeachingSection(-1,'section2');assert.equal(f.calls.saves,0);assert.equal(f.lesson.completedSections,undefined);
  await f.ctx.ttGoToTeachingSection(1,'section8');assert.equal(f.calls.saves,0);
  f.plan.status='Complete';await f.ctx.ttGoToTeachingSection(1,'section1');assert.equal(f.calls.saves,0);assert.equal(f.lesson.completedSections,undefined);
});
test('Section 4 return and group changes prevent automatic completion',async()=>{
  const f=fixture();f.ctx.ttConfirmSection4Complete=async()=>false;
  await f.ctx.ttGoToTeachingSection(1,'section4');assert.equal(f.calls.saves,0);assert.equal(f.lesson.completedSections,undefined);
  f.ctx.ttConfirmSection4Complete=async()=>true;
  f.ctx.ttFinalizeSection4Record=async()=>{f.ctx.ttLesson={id:'different'};};
  await f.ctx.ttGoToTeachingSection(1,'section4');assert.equal(f.calls.saves,0);assert.equal(f.lesson.completedSections,undefined);
});
test('failed section save restores progress and stays on the same section',async()=>{
  const f=fixture({save:async()=>{throw Error('storage full');}});
  await f.ctx.ttGoToTeachingSection(1,'section1');assert.equal(f.lesson.completedSections,undefined);
  assert.equal(f.lesson.sectionProgress,undefined);assert.equal(f.lesson.lastSectionActivity,undefined);assert.deepEqual(f.calls.scroll,[]);
});
test('Day 2 follows the visible order and final Next opens Wrap-Up',async()=>{
  const f=fixture({ids:['section1b','section2b','section6','section10']});
  await f.ctx.ttGoToTeachingSection(1,'section2b');assert.equal(f.lesson.completedSections.section2b,'done');
  assert.equal(f.lesson.completedSections.section2,undefined);assert.deepEqual(f.calls.scroll,['section6']);
  await f.ctx.ttGoToTeachingSection(1,'section10');assert.equal(f.lesson.completedSections.section10,'done');
  assert.equal(f.calls.scroll.at(-1),'ttWrapUpPanel');assert.equal(f.calls.render,1);assert.equal(f.plan.status,'In progress');
});
