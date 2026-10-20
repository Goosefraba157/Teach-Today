const assert = require('node:assert/strict');
const test = require('node:test');
const profile = require('../dictation-profile.js');
const review = require('../lesson-assessment-review.js');
const real = '5 real words', nonsense = '3 nonsense words', hfw = 'HFW from phrase';
const clone = value => JSON.parse(JSON.stringify(value));
const base = {studentId:'synthetic-a', student:'Demo A.', lessonId:'lesson-a', planId:'plan-a', date:'2026-10-09T15:00:00Z', section:'section8'};
function assessment(extra = {}) { return {...base, id:'assessment-a', assessmentStatus:'assessed', categories:{[real]:['cat','hat','mat','sat','bat'], [nonsense]:['lat','zom','frib'], [hfw]:['you','there','why','should']}, ...extra}; }
function mark(item, category = real, extra = {}) { return {...base, id:'mark-'+item, item, category, observationKind:'missed-item', observationCode:'Miss', ...extra}; }

test('exact student, lesson, category and nonempty identity isolate scores', () => {
 const a = assessment();
 const marks = [mark('cat'),mark('hat',real,{studentId:'other'}),mark('mat',real,{lessonId:'sibling'}),mark('sat',real,{lessonId:'',planId:''}),mark('bat',nonsense)];
 const score = profile.score(a, real, marks);
 assert.equal(score.correct,4); assert.equal(score.total,5);
 assert.equal(profile.score({...a,lessonId:'',planId:''},real,marks).correct,5);
 assert.equal(review.sameLesson({planId:'p'},{id:'l'},{id:'p',lessons:[{id:'l'},{id:'other'}]}),false);
});
test('snapshot miss lists are authoritative, case-insensitive and cannot exceed the item list', () => {
 const a = assessment({missesByCategory:{[real]:['CAT','cat','not on list']}});
 const result = profile.score(a,real,[mark('hat')]);
 assert.equal(result.correct,4);
 assert.equal(result.words.filter(word=>!word.correct).length,1);
});
test('unknown totals and other categories stay visible without invented successes', () => {
 const input = {observations:[mark('cat'),mark('you',hfw,{date:'2026-10-12T15:00:00Z',lessonId:'lesson-b'})],assessments:[]};
 const result = profile.model(input);
 assert.equal(result.entries.length,2); assert.equal(result.scored.length,0);
 assert.equal(result.entries[0].words[0].correct,false);
 assert.equal(result.entries[1].words.length,0); assert.match(result.entries[1].status,/HFW/);
});
test('category-level confirmation excludes optional unassessed categories and not-assessed records', () => {
 const a = assessment({assessedCategories:[hfw],missesByCategory:{[hfw]:['why']}});
 assert.equal(profile.score(a,real),null);
 assert.equal(profile.score(a,nonsense),null);
 assert.equal(profile.score(a,hfw).correct,3);
 assert.equal(profile.score({...a,assessmentStatus:'not-assessed'},hfw),null);
 assert.equal(profile.score(assessment({categories:{[real]:['cat','cat']}}),real),null);
});
test('future reviewed lessons add all three graph categories using only explicitly assessed totals', () => {
 const group={id:'synthetic-group',schoolYearId:'2026-2027',encodingObservations:[mark('cat'),mark('frib',nonsense),mark('why',hfw)],dictationAssessments:[]};
 const lesson={id:'lesson-a',substep:'2.2',completedSections:{section8:'done'}};
 const options={group,lesson,plan:{id:'plan-a',lessonNumber:7},entries:[{name:'Demo A.',studentId:'synthetic-a'}],session:{status:'confirmed',attendanceByStudentId:{'synthetic-a':true}},categories:assessment().categories,selectedIds:['synthetic-a'],assessedCategoriesByStudent:{'synthetic-a':[real,nonsense,hfw]},sessionDate:'2026-10-09',at:'2026-10-09T16:00:00Z'};
 assert.equal(review.apply(options),1);
 const input={assessments:group.dictationAssessments,observations:group.encodingObservations};
 assert.equal(profile.model(input,'real').latest.score.correct,4);
 assert.equal(profile.model(input,'nonsense').latest.score.correct,2);
 assert.equal(profile.model(input,'hfw').latest.score.correct,3);
 assert.equal(review.apply(options),0,'A repeated completion must not duplicate assessments');
 const fresh={...options,lesson:{...lesson,id:'lesson-new'},plan:{id:'plan-new',lessonNumber:8},at:'2026-10-13T16:00:00Z',sessionDate:'2026-10-13',assessedCategoriesByStudent:{'synthetic-a':[real]}};
 assert.equal(review.apply(fresh),1);
 assert.equal(profile.model(input,'real').scored.length,2);
 assert.equal(profile.model(input,'nonsense').scored.length,1);
 assert.equal(profile.model(input,'hfw').scored.length,1);
});
test('partial-category confirmation never creates real-word progress for an HFW-only lesson', () => {
 const f={group:{id:'g',dictationAssessments:[]},lesson:{id:'l',completedSections:{section8:'done'}},plan:{id:'p'},entries:[{studentId:'a',name:'A'}],session:{status:'confirmed',attendanceByStudentId:{a:true}},categories:assessment().categories,selectedIds:['a'],assessedCategoriesByStudent:{a:[hfw]}};
 review.apply(f);
 assert.equal(profile.model({assessments:f.group.dictationAssessments},'real').scored.length,0);
 assert.equal(profile.model({assessments:f.group.dictationAssessments},'hfw').scored.length,1);
});
test('variable HFW lists use percentages and weighted totals rather than averaging percentages', () => {
 const input={assessments:[assessment({id:'one',categories:{[hfw]:['you','why']},missesByCategory:{[hfw]:['why']}}),assessment({id:'two',date:'2026-10-10',categories:{[hfw]:['a','b','c','d']},missesByCategory:{[hfw]:[]}})]};
 const data = profile.model(input,'hfw');
 assert.equal(data.percent,true);assert.equal(data.maximum,100);
 assert.equal(data.correct,5);assert.equal(data.total,6);assert.equal(data.scored.length,2);
});
test('historical plan-date snapshots use their sole evidence day without mutating source dates', () => {
 const a = assessment({date:'2026-10-01',source:'verified-historical-section8-checkpoint-v1',missesByCategory:{[real]:['cat']}});
 const input={assessments:[a],observations:[mark('cat',real,{date:'2026-10-09T15:00:00Z'})]};
 const before=clone(input), rows=profile.model(input).entries;
 assert.equal(rows.length,1);assert.equal(rows[0].date,'2026-10-09');assert.equal(rows[0].snapshotDate,'2026-10-01');
 assert.deepEqual(input,before);
 input.observations.push(mark('hat',real,{date:'2026-10-10T15:00:00Z'}));
 const separate=profile.model(input).entries;
 assert.equal(separate.length,3,'Ambiguous multi-day observations retain separate dates and the snapshot label');
});
test('multiple saved attempts on one day remain separate and counts do not use lesson numbers', () => {
 const a=assessment({lessonNumber:99,missesByCategory:{[real]:['cat']}});
 const input={assessments:[a,{...a,id:'recheck',missesByCategory:{[real]:[]}}],observations:[mark('cat')]};
 const result=profile.model(input);
 assert.equal(result.scored.length,2);assert.equal(result.total,10);assert.equal(result.correct,9);assert.equal(result.dates,1);
 assert.equal(result.entries.length,2);
 assert.equal(profile.model({assessments:[a,a]}).scored.length,1,'Identical assessment ID must not be counted twice');
});
test('written spelling responses must be explicitly recorded, never borrowed from reading said fields', () => {
 const a=assessment({missesByCategory:{[real]:['cat']}});
 assert.equal(profile.score(a,real,[mark('cat',real,{said:'reading error'})]).words[0].response,'');
 assert.equal(profile.score(a,real,[mark('cat',real,{writtenResponse:'kat'})]).words[0].response,'kat');
});
test('short and zero bars retain truthful numeric scores and enough uniformly scaled room', () => {
 const input={assessments:[assessment({missesByCategory:{[real]:['cat','hat','mat','sat']}})]};
 const data=profile.model(input);
 assert.equal(data.latest.score.correct,1);assert.ok(data.plotHeight/5>=5*29+24);
 input.assessments[0].missesByCategory[real].push('bat');
 assert.equal(profile.model(input).latest.score.correct,0);
});
test('teacher diagnostic tags remain distinct from scored word evidence and count recorded dates',()=>{
 const observations=[mark('cat'),...['2026-10-09','2026-10-10','2026-10-10'].map((date,index)=>({...base,id:'tag-'+index,date,category:'Dictation',item:'',observationCode:'Blends',observationKind:'difficulty-tag',note:'struggles with consonant blends'}))];
 const data=profile.model({assessments:[],observations});
 assert.equal(data.scored.length,0);assert.deepEqual(data.tags,[{label:'Blends',count:2}]);
});
test('finishing an older lesson retains a dictation-only missed record without rewriting it',()=>{
 const legacy={id:'legacy',student:'A',studentId:'a',lessonId:'l',planId:'p',category:real,item:'cat'};
 const group={id:'g',dictationMisses:[legacy],dictationAssessments:[]};
 const input={group,lesson:{id:'l',substep:'2.2'},plan:{id:'p'},entries:[{name:'A',studentId:'a'}],session:{status:'confirmed',attendanceByStudentId:{a:true}},categories:{[real]:['cat','hat']},selectedIds:['a'],assessedCategoriesByStudent:{a:[real]}};
 const before=clone(legacy);assert.equal(review.model(input).needed,true);review.apply(input);
 assert.deepEqual(group.dictationAssessments[0].missesByCategory[real],['cat']);assert.deepEqual(legacy,before);
});
