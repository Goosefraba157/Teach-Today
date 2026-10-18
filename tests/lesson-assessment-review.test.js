const assert = require('node:assert/strict');
const test = require('node:test');
const helper = require('../lesson-assessment-review.js');
const clone = x => JSON.parse(JSON.stringify(x));
function fixture() {
  return { group: { id:'group', schoolYearId:'2026-2027', encodingObservations:[], dictationAssessments:[] },
    lesson:{id:'lesson', completedSections:{section8:'done'}}, plan:{id:'plan', lessonNumber:3},
    entries:[{studentId:'a',name:'Student A'},{studentId:'b',name:'Student B'},{studentId:'c',name:'Student C'}],
    session:{status:'confirmed', attendanceByStudentId:{a:true,b:false}},
    categories:{'5 real words':['cat','hat','mat','sat','bat']}, at:'2026-10-18T12:00:00.000Z' };
}
test('review preselects only confirmed present; absent disabled; unknown is explicit',()=>{
  const f=fixture(), before=clone(f), rows=helper.model(f).rows;
  assert.deepEqual(rows.map(r=>[r.studentId,r.checked,r.disabled]),[['a',true,false],['b',false,true],['c',false,false]]);
  assert.deepEqual(f,before);
  f.session.status='unconfirmed';assert.ok(helper.model(f).rows.every(r=>!r.checked&&!r.disabled));
});
test('section progress alone never creates a score; review adds only chosen non-absent students',()=>{
  const f=fixture();const history={id:'prior',lessonId:'old',studentId:'a',categories:{Words:['old']}};
  f.group.dictationAssessments.push(history);
  f.group.encodingObservations=[{studentId:'a',student:'Student A',lessonId:'lesson',planId:'plan',section:'section8',category:'5 real words',item:'cat',note:'encoding miss'},
    {studentId:'c',lessonId:'lesson',section:'section8',category:'5 real words',item:'hat',note:'encoding miss'},
    {studentId:'a',lessonId:'other',planId:'plan',section:'section8',category:'5 real words',item:'mat',note:'encoding miss'}];
  const evidence=clone(f.group.encodingObservations), prior=clone(history);
  assert.equal(helper.model(f).needed,true);assert.equal(f.group.dictationAssessments.length,1);
  assert.equal(helper.apply({...f,selectedIds:['a','b']}),1);
  const created=f.group.dictationAssessments[1];
  assert.equal(created.studentId,'a');assert.equal(created.assessmentStatus,'assessed');
  assert.deepEqual(created.missesByCategory['5 real words'],['cat']);
  assert.deepEqual(f.group.encodingObservations,evidence);assert.deepEqual(history,prior);
  f.categories['5 real words'].push('later');assert.equal(created.categories['5 real words'].length,5);
  assert.equal(helper.model(f).needed,false);
  assert.equal(helper.apply({...f,selectedIds:['a']}),0);
});
test('no activity, empty identity, old sibling lesson, and unchecked students do not fabricate scores',()=>{
  const f=fixture();delete f.lesson.completedSections;
  f.group.encodingObservations=[{section:'section8',lessonId:'sibling',planId:'plan'}];
  assert.equal(helper.model(f).needed,false);
  f.group.encodingObservations=[{section:'section8',lessonId:'',planId:''}];assert.equal(helper.model(f).needed,false);
  f.lesson.sectionProgress={section8:{state:'inprogress'}};assert.equal(helper.model(f).needed,true);
  helper.apply({...f,selectedIds:[]});assert.deepEqual(f.group.dictationAssessments,[]);
  assert.deepEqual(f.lesson.section8Review.assessedStudentIds,[]);
});
test('existing snapshots remain unchanged and new activity can reopen a pending student review',()=>{
  const f=fixture();const old={id:'old',lessonId:'lesson',studentId:'a',categories:{'5 real words':['old']}};
  f.group.dictationAssessments.push(old);const before=clone(old);
  helper.apply({...f,selectedIds:['a','c']});assert.deepEqual(old,before);
  assert.equal(f.group.dictationAssessments.length,2);
  f.group.encodingObservations.push({section:'section8',lessonId:'lesson',studentId:'b',date:'2026-10-19T12:00:00.000Z'});
  assert.equal(helper.model(f).needed,true);
});
