const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('progress-monitoring.js','utf8');
test('Real Words scores use only the selected student and exact linked lesson',()=>{
  const group={schoolYearId:'2026-2027',dictationAssessments:['a','b'].map(studentId=>({id:studentId,studentId,lessonId:'lesson',planId:'plan',schoolYearId:'2026-2027',categories:{'5 real words':['cat','hat','mat','sat','bat']}})),encodingObservations:[
    {studentId:'a',section:'section8',lessonId:'lesson',planId:'plan',category:'5 real words',item:'cat'},
    {studentId:'b',section:'section8',lessonId:'different',planId:'plan',category:'5 real words',item:'hat'},
    {studentId:'b',section:'section8',lessonId:'',planId:'',category:'5 real words',item:'mat'}]};
  const context=vm.createContext({pmYear:'2026-2027',pmGroups:()=>[group],pmTime:()=>0});
  for(const [start,end] of [['pmNormalize','pmFirst'],['pmMatches','pmGroups'],['pmRecordYear','pmMatches'],['pmRealRecords','pmScoreClass']])
    vm.runInContext(source.slice(source.indexOf(`function ${start}(`),source.indexOf(`function ${end}(`)),context);
  assert.equal(context.pmRealRecords({id:'a'})[0].correct,4);
  assert.equal(context.pmRealRecords({id:'b'})[0].correct,5);
  group.dictationAssessments[1].missesByCategory={'5 real words':['bat']};
  assert.equal(context.pmRealRecords({id:'b'})[0].correct,4);
  group.dictationAssessments[1].assessmentStatus='not-assessed';assert.equal(context.pmRealRecords({id:'b'}).length,0);
  group.dictationAssessments[1].assessmentStatus='assessed';assert.equal(context.pmRealRecords({id:'b'}).length,1);
});
