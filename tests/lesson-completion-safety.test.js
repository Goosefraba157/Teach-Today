const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('teach-today.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
function functions(first, next) {
  const start = source.search(new RegExp(`^(?:async )?function ${first}\\(`, 'm'));
  const end = source.search(new RegExp(`^(?:async )?function ${next}\\(`, 'm'));
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
function runtime(code, values) {
  const context = vm.createContext({ Date, Promise, console: {error() {}, warn() {}}, ...values });
  vm.runInContext(code, context);
  return context;
}
function completionFixture(saveState) {
  const lesson = {id:'lesson', savedPlanId:'plan', lessonType:'group', substep:'3.5', completedSections:{section4:'done'}};
  const older = {id:'old', status:'Complete', lessons:[{id:'old-lesson'}]};
  const plan = {id:'plan', status:'In progress', lessons:[lesson], sessions:{'1':{date:'2026-10-13',status:'In progress'}}};
  const group = {id:'group', activeLessonPlanId:'plan', history:[older,plan], chartResults:[{id:'evidence'}]};
  const nodes = {ttCompleteLesson:{},ttWrapSavePdf:{},ttWrapNextLesson:{},ttWrapNote:{value:'Synthetic note'},ttWrapRecommendation:{textContent:'Synthetic next step'},ttSaveStatus:{}};
  let archives=0;
  const context=runtime(`var ttLessonCompletionInFlight=null; var ttLesson=fixtureLesson;\n${functions('ttCompleteLessonWrapUp','ttSaveWrapUpNoteDraft')}`,{
    fixtureLesson:lesson, ttById:id=>nodes[id], ttEnsureStageStorageReady:async()=>true,
    ttFinalizeSection4Record:async()=>{}, ttActiveGroup:()=>group,
    ttSaveCurrentLesson:options=>assert.equal(options.persist,false), ttCurrentPlan:()=>plan,
    ttTodaysLessonData:()=>({chart:[{id:'evidence'}],dictation:[],encoding:[]}),
    ttAttendanceSession:()=>null, ttClone:clone, ttPlanSessionDay:()=> '1', ttEnsureLessonWorkflow:()=>{},
    ttCaptureLessonPlanVersion:()=>{},ttSyncCombinedLessonLinks:()=>{},saveState,
    ttFinishLessonArchives:()=>{archives++;}, ttUpdateSaveStatus:()=>{},ttRenderSavedLessons:()=>{},ttRenderWrapUpPanel:()=>{},ttShowBackupToast:()=>{}
  });
  return {context,plan,group,older,nodes,archives:()=>archives};
}

test('completion waits for durable save, coalesces repeated taps, and preserves evidence',async()=>{
  let release; const saving=new Promise(resolve=>{release=resolve;});
  const f=completionFixture(()=>saving); const protectedBefore=clone([f.older,f.group.chartResults]);
  const first=f.context.ttCompleteLessonWrapUp({scroll:false});
  assert.equal(f.context.ttCompleteLessonWrapUp({scroll:false}),first);
  await new Promise(setImmediate);
  assert.equal(f.archives(),0);assert.equal(f.nodes.ttCompleteLesson.disabled,true);
  release(); assert.equal(await first,true);
  assert.equal(f.archives(),1);assert.equal(f.plan.status,'Complete');
  assert.equal(f.plan.sessions['1'].status,'Complete');assert.equal(f.group.activeLessonPlanId,'');
  assert.deepEqual([f.older,f.group.chartResults],protectedBefore);
  const timestamp=f.plan.completedAt;
  await f.context.ttCompleteLessonWrapUp({scroll:false});assert.equal(f.plan.completedAt,timestamp);
});

test('failed completion reports failure and never starts archive or next-lesson work',async()=>{
  const f=completionFixture(async()=>{throw Error('Synthetic storage failure');});
  assert.equal(await f.context.ttCompleteLessonWrapUp({scroll:false}),false);
  assert.equal(f.archives(),0);assert.match(f.nodes.ttSaveStatus.textContent,/NOT SAVED/);
  assert.equal(f.nodes.ttCompleteLesson.disabled,false);assert.equal(f.group.chartResults[0].id,'evidence');
});

test('planned document fields are detached, retained, and never fabricated for completed legacy lessons',()=>{
  const context=runtime(functions('ttCaptureLessonPlanVersion','ttFinishLessonArchives'),{
    scopeMap:[{id:'3.5'}],ttClone:clone, ttWilsonLessonPlanData:(_g,_s,lesson)=>({text:{words:lesson.words.slice()},checks:[]})
  });
  const lesson={substep:'3.5',words:['landed']};const plan={status:'In progress',savedAt:'2026-10-13T10:00:00Z'};
  context.ttCaptureLessonPlanVersion('Planned',{},lesson,plan);lesson.words.push('testing');
  context.ttCaptureLessonPlanVersion('Planned',{},lesson,plan);
  assert.deepEqual(plan.lessonPlanVersions.planned.fields.text.words,['landed']);
  plan.status='Complete';context.ttCaptureLessonPlanVersion('Completed',{},lesson,plan);
  assert.deepEqual(plan.lessonPlanVersions.completed.fields.text.words,['landed','testing']);
  const legacy={status:'Complete'};context.ttCaptureLessonPlanVersion('Planned',{},lesson,legacy);
  assert.equal(legacy.lessonPlanVersions.planned,undefined);
  assert.equal(JSON.stringify(clone(plan).lessonPlanVersions),JSON.stringify(plan.lessonPlanVersions));
});

test('print collection includes every same-date lesson beyond 50, filters year, and deduplicates combined links',()=>{
  const context=runtime(functions('ttCollectLessonPrintEntries','ttPrintAllLessonPlans'),{ttLessonStartDateKey:()=> '2026-10-13'});
  const plans=Array.from({length:61},(_,i)=>({id:`plan-${i}`,status:'Complete',lessonPlanVersions:{planned:{fields:{text:{}}},completed:{fields:{text:{}}}},lessons:[{id:`lesson-${i}`,lessonSequence:i+1}]}));
  const state={activeSchoolYearId:'2026-2027',groups:[{id:'g',name:'Group 1',schoolYearId:'2026-2027',history:plans},
    {id:'guest',name:'Group 2',schoolYearId:'2026-2027',history:[{id:'link',combinedParticipation:true,hostPlanId:'plan-0',status:'Complete',lessons:[{id:'linked'}]}]},
    {id:'old',name:'Archived',schoolYearId:'2025-2026',history:plans}]};
  const before=clone(state);
  assert.equal(context.ttCollectLessonPrintEntries(state,'','latest').entries.length,61);
  assert.equal(context.ttCollectLessonPrintEntries(state,'','both').entries.length,122);
  assert.equal(context.ttCollectLessonPrintEntries(state,'guest','latest').entries.length,1);
  assert.deepEqual(state,before);
});

test('random selection reaches the full pool without duplicates or source mutation',()=>{
  let seed=71;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const context=runtime(functions('ttSmartPreselect','ttCountSyllables'),{Math:math,uniqueWords:words=>[...new Set(words)]});
  const pool=Array.from({length:100},(_,i)=>`word-${i}`);const counts=new Map(pool.map(w=>[w,0]));
  for(let i=0;i<2000;i++){
    const chosen=context.ttSmartPreselect(pool.concat(pool[0]),6);
    assert.equal(new Set(chosen).size,6);chosen.forEach(w=>counts.set(w,counts.get(w)+1));
  }
  assert.ok([...counts.values()].every(n=>n>75&&n<165));assert.equal(pool[99],'word-99');
});

test('explicit cleared sound and dictation selections stay empty instead of regenerating defaults',()=>{
  const context=runtime(functions('targetSoundItemsForLesson','ttBuildReverseDrillOverride'),{});
  assert.deepEqual(context.targetSoundItemsForLesson({reverseDrillOverride:[]},{}),[]);
  const dictation=runtime(functions('ttActiveDictationPlan','ttReplaceDictationItem'),{ttClone:clone});
  const blocks=[{label:'5 real words',values:['teacher-custom']},{label:'5 sounds',values:[]}];
  assert.deepEqual(dictation.ttActiveDictationPlan({dictationPlanOverride:blocks},{}),blocks);
});

test('new plans and combined lessons retain history instead of deleting older lessons',()=>{
  assert.doesNotMatch(app,/group\.history\s*=\s*group\.history\.slice/);
  assert.doesNotMatch(source,/group\.history\s*=\s*group\.history\.slice/);
  const saved=functions('ttRenderSavedLessons','ttOpenPlanInApp');
  assert.doesNotMatch(saved,/seenDays/);assert.match(saved,/plan\.status === "Complete" \? "Complete"/);
});

test('archive failure keeps the last verified local file and reports the failed destination',async()=>{
  const plan={id:'plan',status:'Complete',lessonPlanArchives:{completed:{localPath:'existing.pdf',localVerifiedAt:'prior',savedAt:'prior'}}};
  const group={id:'group'};const lesson={substep:'3.5'};
  const context=runtime(functions('ttArchiveLessonPlanPdf','ttArchiveCurrentLessonPlanPdf'),{
    ttIsNativeIpadShell:()=>true, ttClone:clone, ttActiveGroup:()=>group, ttCurrentPlan:()=>plan,
    ttLesson:lesson,scopeMap:[{id:'3.5'}],ttBuildWilsonLessonPlanPdf:async()=>new Uint8Array([1,2]),
    ttDocumentSha256Hex:async()=> 'digest',ttLessonPlanArchiveFileName:()=> 'lesson.pdf',ttLessonPlanGroupFolderName:()=> 'Group',
    ttSaveNativeLessonPlanPdf:async()=>{throw Error('Synthetic Files failure');},
    localStorage:{getItem:()=> 'true'},ttIndependentBackupEnabledKey:'enabled',
    ttSaveDriveLessonPlanPdf:async()=>({id:'drive-id'}), ttFriendlyDriveError:e=>e.message,
    saveState:async()=>{},document:{body:{classList:{contains:()=>false}}},ttRenderSavedLessons:()=>{},ttShowBackupToast:()=>{}
  });
  const result=await context.ttArchiveLessonPlanPdf('Completed',{group,lesson,plan});
  assert.equal(result.localPath,'existing.pdf');assert.equal(result.localVerifiedAt,'prior');
  assert.equal(result.driveFileId,'drive-id');assert.equal(result.savedAt,'prior');
  assert.match(result.errors[0],/Files failure/);
});

test('a forced backup waits for a running copy and then saves the newer state',async()=>{
  let release;const first=new Promise(resolve=>{release=resolve;});let copies=0;
  const context=runtime(`var ttStageBackupTimer=null,ttStageBackupPending=true,ttStageBackupInFlight=null;\n${functions('ttFlushStageNativeBackup','ttFirebaseDeviceId')}`,{
    clearTimeout:()=>{},ttStageLocalOnlyMode:()=>true,ttBackupCurrentStageState:()=>++copies===1?first:Promise.resolve(),ttQueueStageNativeBackup:()=>{}
  });
  context.ttFlushStageNativeBackup();const forced=context.ttFlushStageNativeBackup({force:true});
  assert.equal(copies,1);release();await forced;assert.equal(copies,2);
});

test('Reader review uses the reviewed index rather than old OCR fragments, with explicit fallback coverage',()=>{
  const context=runtime('',{window:{}});
  for(const file of ['enhanced-planning-index.js','enhanced-planning.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  Object.assign(context,{ttEnhancedPlanning:()=>context.window.TeachTodayEnhancedPlanning,
    readerWordsFromSubstep:()=>['legacy-fallback'],readerNonsenseWordsFromSubstep:()=>[],
    uniqueWords:words=>[...new Set(words)],isValidDictationWord:()=>true,isUsableReaderWord:()=>true,ttWordKey:w=>w.toLowerCase()});
  vm.runInContext(functions('ttIsReaderPlanningWord','ttSection2ReviewPreselect'),context);
  const review=context.ttSection2ReaderRealWords('5.2','AB');
  assert.ok(context.ttSection2ReaderRealWords('7.5','AB').includes("kittens'"));
  assert.ok(review.includes('recall'));assert.ok(review.includes('reflex'));assert.ok(!review.includes('flect'));
  assert.deepEqual(Array.from(context.ttSection2ReaderRealWords('1.1','AB')),['legacy-fallback']);
  const index=context.window.teachTodayEnhancedPlanningIndex;
  assert.equal(Object.keys(index.pages).length,347);
  for(const [key,page] of Object.entries(index.pages)){
    assert.equal(key,`${page.s}|${page.l}|${page.p}`);
    assert.ok(index.coverage.substeps.includes(page.s));
    assert.ok(page.w.length>0);assert.ok(page.w.every(word=>index.words[page.s][word]));
  }
  for(const type of ['sentenceRecommendations','dictationRecommendations']) {
    for(const key of Object.keys(index[type])) {
      const [substep,,page]=key.split('|');
      assert.ok(Object.values(index.pages).some(entry=>entry.s===substep&&entry.p===Number(page)), key);
    }
  }
});
