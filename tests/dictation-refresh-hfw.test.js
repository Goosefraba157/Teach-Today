const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync('teach-today.js','utf8'),profile=fs.readFileSync('student-profile.js','utf8');
test('HFW phrase targets include earlier taught HFW but exclude later untaught banks',()=>{
 const context=vm.createContext({ttLesson:{substep:'2.2',readerLevel:'AB'},scopeMap:[{id:'1.1'},{id:'2.2'},{id:'3.1'}],isAtLeastSubstep:(a,b)=>Number(a)>=Number(b),hfwWordsForSubstep:step=>({'1.1':['because'],'2.2':['there'],'3.1':['futureword']}[step]),dictationValues:()=>[],window:{}});
 vm.runInContext(source.slice(source.indexOf('function ttHighFrequencyItemsFromPhrases('),source.indexOf('function ttSelectDictationItem(')),context);
 const input=[{label:'3 phrases',values:['because there futureword']},{label:'2 sentences',values:['because futureword']}];
 assert.deepEqual(JSON.parse(JSON.stringify(context.ttHighFrequencyItemsFromPhrases(input).map(item=>item.value))),['because','there']);
});
test('an open Stage Profile refreshes its verified IndexedDB boot record before rendering a new lesson',async()=>{
 let version=1,boot=1,renders=[];
 const status={hidden:true};
 const context=vm.createContext({window:{TeachTodayStageStorage:{prepareBoot:async()=>{boot=version;}}},byId:()=>status,renderAll:()=>renders.push(boot)});
 vm.runInContext(profile.slice(profile.indexOf('let profileRefreshInFlight ='),profile.indexOf('window.addEventListener("storage"')),context);
 version=2;await context.refreshProfileState();assert.deepEqual(renders,[2]);assert.equal(status.hidden,true);
 version=3;await context.refreshProfileState();assert.deepEqual(renders,[2,3]);
 context.window.TeachTodayStageStorage.prepareBoot=async()=>{throw Error('Synthetic unreadable database');};
 await context.refreshProfileState();assert.deepEqual(renders,[2,3]);assert.equal(status.hidden,false);assert.match(status.textContent,/out of date/);
});
test('Progress Monitoring excludes real-word scores from a newly confirmed HFW-only assessment',()=>{
 const pm=fs.readFileSync('progress-monitoring.js','utf8');
 const group={schoolYearId:'2026-2027',dictationAssessments:[{studentId:'a',schoolYearId:'2026-2027',assessmentStatus:'assessed',assessedCategories:['HFW from phrase'],categories:{'5 real words':['cat'],'HFW from phrase':['you']}}]};
 const context=vm.createContext({pmYear:'2026-2027',pmGroups:()=>[group],pmTime:()=>0});
 for(const [first,next] of [['pmNormalize','pmFirst'],['pmMatches','pmGroups'],['pmRecordYear','pmMatches'],['pmRealRecords','pmScoreClass']])vm.runInContext(pm.slice(pm.indexOf('function '+first+'('),pm.indexOf('function '+next+'(')),context);
 assert.equal(context.pmRealRecords({id:'a'}).length,0);
 group.dictationAssessments[0].assessedCategories.push('5 real words');
 assert.equal(context.pmRealRecords({id:'a'}).length,1);
});
test('date-only profile labels retain the recorded day in the classroom timezone',()=>{
 const {execFileSync}=require('node:child_process');
 const code=profile.slice(profile.indexOf('function dateValue('),profile.indexOf('function academicYearId('));
 const result=execFileSync(process.execPath,['-e',code+"process.stdout.write(String(dateValue('2026-10-09').getDate()))"],{env:{...process.env,TZ:'America/Chicago'},encoding:'utf8'});
 assert.equal(result,'9');
});
