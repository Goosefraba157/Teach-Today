const assert=require('node:assert/strict');const test=require('node:test');const fs=require('node:fs');
const api=require('../lesson-library.js');
function fixture(){return {activeSchoolYearId:'2026-2027',rosterStudents:[{studentId:'s-a',name:'Student Alpha'},{studentId:'s-b',name:'Student Beta'}],groups:[
 {id:'g-old',name:'Group 1',schoolYearId:'2026-2027',students:['Student Beta'],studentIds:{'Student Beta':'s-b'},history:[
  {id:'p-a',status:'Complete',participantStudentIds:['s-a'],rosterSnapshot:[{studentId:'s-a',name:'Student Alpha'}],lessons:[{id:'l-a',lessonSequence:1,lessonStartDate:'2026-09-01'}]},
  {id:'p-b',status:'Complete',participantStudentIds:['s-b'],lessons:[{id:'l-b',lessonSequence:2,lessonStartDate:'2026-09-02'}]},
  {id:'weekly',lessons:[{id:'week-1',scheduledDate:'2026-09-03'},{id:'week-2',scheduledDate:'2026-09-04'}]}
 ]},
 {id:'g-new',name:'Group 2',schoolYearId:'2026-2027',students:['Student Alpha'],studentIds:{'Student Alpha':'s-a'},history:[{id:'p-new',status:'In progress',participantStudentIds:['s-a'],lessons:[{id:'l-new',scheduledDate:'2026-09-08'}]}]},
 {id:'archive',name:'Archived',schoolYearId:'2025-2026',history:[{id:'p-arch',participantStudentIds:['s-a'],lessons:[{id:'l-arch'}]}]}
],masterRecords:[{studentId:'s-a',planId:'weekly',lessonId:'week-1'}],attendanceSessions:{'g-old':{
 '2026-09-01':{status:'confirmed',planIds:['p-a'],attendanceByStudentId:{'s-a':true}},
 '2026-09-02':{status:'confirmed',planIds:['p-b'],attendanceByStudentId:{'s-b':false}}
}}};}

test('student library follows saved identities through a move, without inferring old lessons from today\'s roster',()=>{
 const state=fixture();const before=JSON.stringify(state);const rows=api.entries(state,{studentId:'s-a'});
 assert.deepEqual(rows.map(r=>r.lesson.id),['l-new','week-1','l-a']);
 assert.equal(rows.find(r=>r.lesson.id==='l-a').participation,'Confirmed present');
 assert.equal(rows.find(r=>r.lesson.id==='l-new').participation,'Saved lesson participant — attendance unconfirmed');
 assert.equal(rows.find(r=>r.lesson.id==='week-1').participation,'Linked student evidence');
 assert.equal(JSON.stringify(state),before);
});

test('year/group/status filters preserve all saved lessons, including multi-lesson plans and explicit absences',()=>{
 const state=fixture();assert.equal(api.entries(state,{groupId:'g-old'}).length,4);
 assert.equal(api.entries(state,{groupId:'g-old',status:'completed'}).length,2);
 assert.equal(api.entries(state,{studentId:'s-b'})[0].participation,'Confirmed absent');
 assert.deepEqual(api.entries(state,{year:'2025-2026',studentId:'s-a'}).map(r=>r.plan.id),['p-arch']);
 const students=api.students(state,{groupId:'g-old'});assert.ok(students.some(s=>s.id==='s-a'));
});

test('a weekly plan-only link cannot falsely attribute all its lessons to a student',()=>{
 const state=fixture();state.masterRecords=[{studentId:'s-a',planId:'weekly'}];
 state.attendanceSessions['g-old']['2026-09-03']={status:'confirmed',planIds:['weekly'],attendanceByStudentId:{'s-a':true}};
 assert.ok(!api.entries(state,{studentId:'s-a'}).some(r=>r.plan.id==='weekly'));
});

test('combined lessons deduplicate to the host while a guest group can still view its linked original PDF',()=>{
 const state=fixture();const host=state.groups[0].history[0];
 const link={id:'link',combinedParticipation:true,hostGroupId:'g-old',hostPlanId:host.id,participantStudentIds:['s-a'],lessons:[{...host.lessons[0],lessonSequence:9}]};
 state.groups[1].history.push(link);
 assert.equal(api.entries(state,{studentId:'s-a'}).filter(r=>r.lesson.id==='l-a').length,1);
 const row=api.entries(state,{groupId:'g-new'}).find(r=>r.plan.id==='link');
 assert.equal(api.documentFor(state,row).plan.id,host.id);
 state.groups[0].history.shift();assert.equal(api.documentFor(state,row).plan.id,'link');
 assert.ok(api.entries(state,{studentId:'s-a'}).some(r=>r.plan.id==='link'));
});

test('library queries do not mutate evidence, attendance, rosters, or saved plans',()=>{
 const state=fixture();const before=JSON.stringify(state);for(const options of [{},{groupId:'g-old'},{studentId:'s-a'},{year:'2025-2026'}]){api.entries(state,options);api.students(state,options);}
 assert.equal(JSON.stringify(state),before);
 const source=fs.readFileSync('teach-today.js','utf8');const readOnly=source.slice(source.indexOf('function ttOpenLessonLibrary'),source.indexOf('function ttPrintGroupLessonPlans'));
 assert.doesNotMatch(readOnly,/saveState\(|ttOpenPlanInApp\(/);
});

test('explicit plan school year takes precedence over its current group year',()=>{
 const state=fixture();const plan=state.groups[0].history[0];plan.schoolYearId='2025-2026';
 assert.ok(!api.entries(state,{groupId:'g-old'}).some(r=>r.plan.id==='p-a'));
 assert.deepEqual(api.entries(state,{groupId:'g-old',year:'2025-2026'}).map(r=>r.plan.id),['p-a']);
 assert.ok(api.students(state,{groupId:'g-old',year:'2025-2026'}).some(s=>s.id==='s-a'));
});
