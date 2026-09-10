const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const helpers = source.slice(source.indexOf('function restorePackedLessonScripts('), source.indexOf('function loadState('));
function context(stage = true) {
  const notices = new Map();
  const values = new Map();
  const c = vm.createContext({
    window: {webkit: stage ? {messageHandlers:{teachTodayProjectionMode:{}}} : undefined},
    document: {documentElement:{dataset:{teachTodayNative:stage?'ipad':''}},
      getElementById:id=>notices.get(id), createElement:()=>({style:{},setAttribute(){},remove(){notices.delete(this.id)}}),
      body:{appendChild:n=>notices.set(n.id,n)}},
    localStorage:{setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k),removeItem(){throw Error('must not delete')}},
    storageKey:'state', notices, values
  });
  vm.runInContext(helpers,c); return c;
}
const plain = v => JSON.parse(JSON.stringify(v));
function fixture() {
  const script = 'Teacher cue: preserve exact content.\r\n'+('Read, mark, blend.\n'.repeat(150))+'学生 😀\n';
  return {groups:[{id:'g',history:Array.from({length:12},(_,i)=>({id:`p${i}`,lessons:[{id:`l${i}`,scriptText:script,section9Ink:{points:[[.12,.42]]}}]})),encodingObservations:[{id:'o',score:2}]}],masterRecords:[{id:'r',score:13}],lessonDrafts:{draft:{scriptText:script}},notes:{scriptText:''}};
}
test('Stage storage round trips all fields and exact scripts without mutating input',()=>{
 const c=context(), state=fixture(), before=JSON.stringify(state);
 const packed=c.serializeTeachTodayState(state);
 assert.ok(packed.length < before.length/2);
 assert.equal(JSON.stringify(state),before);
 assert.deepEqual(plain(c.restorePackedLessonScripts(JSON.parse(packed))),state);
 assert.deepEqual(plain(c.restorePackedLessonScripts(JSON.parse(c.serializeTeachTodayState(JSON.parse(packed))))),state);
 assert.deepEqual(plain(c.restorePackedLessonScripts(JSON.parse(before))),state);
 assert.equal(context(false).serializeTeachTodayState(state),before);
});
test('invalid dictionaries and references fail closed',()=>{
 const c=context();
 for(const state of [{_scriptTextPoolV1:[null]}, {_scriptTextPoolV1:['x'],lesson:{_scriptTextLinesV1:[2]}},{_scriptTextPoolV1:['x'],lesson:{_scriptTextLinesV1:[0],scriptText:'other'}}]) assert.throws(()=>c.restorePackedLessonScripts(state));
});
test('failed writes preserve prior data, show a warning, and throw; successful retry clears warning',()=>{
 const c=context(); c.localStorage.setItem('state','previous');
 const write=c.localStorage.setItem;
 c.localStorage.setItem=()=>{const e=Error('full');e.name='QuotaExceededError';throw e;};
 assert.throws(()=>c.writeTeachTodayState(fixture()),{name:'QuotaExceededError'});
 assert.equal(c.values.get('state'),'previous');
 assert.match(c.notices.get('teachTodayStorageFailure').textContent,/NOT saved/);
 c.localStorage.setItem=write; c.writeTeachTodayState(fixture());
 assert.equal(c.notices.size,0);
 assert.deepEqual(plain(c.restorePackedLessonScripts(JSON.parse(c.values.get('state')))),fixture());
});
test('load errors retain the saved copy and save errors do not emit success',()=>{
 const c=context(); let successes=0;
 Object.assign(c,{upgradeTeachTodayState:x=>c.restorePackedLessonScripts(x), defaultTeachTodayState:()=>({}), applyStudentPrivacySchema:()=>{},compactLessonRevisionStorage:()=>{},appState:{lastSavedAt:'previous'},teachTodayStateChannel:{postMessage(){successes++;}},location:{pathname:'test'},CustomEvent:function(){}});
 c.window.dispatchEvent=()=>successes++;
 vm.runInContext(source.slice(source.indexOf('function loadState('),source.indexOf('\ntry {\n  writeTeachTodayState(appState);')),c);
 c.localStorage.setItem('state','{broken');assert.throws(()=>c.loadState());assert.equal(c.values.get('state'),'{broken');
 c.localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>c.saveState());assert.equal(c.appState.lastSavedAt,'previous');assert.equal(successes,0);
});
