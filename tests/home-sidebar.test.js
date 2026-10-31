const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const helper = require('../home-sidebar.js');
const source = fs.readFileSync('home-sidebar.js', 'utf8');
function fixture({ narrow = false, reduced = false, stored, blockedStorage = false, withDay = false } = {}) {
  const writes = [];
  const store = new Map(stored ? [['teachToday.homeSidebar.v1', stored]] : []);
  let active;
  let now = 0;
  let nextFrame = 0;
  const queue = new Map();
  function element() {
    const listeners = new Map();
    const classes = new Set();
    return { dataset: {}, attributes: {}, style: { values: {}, setProperty(k,v) { this.values[k] = v; } },
      classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), toggle(k,v) { if(v)classes.add(k);else classes.delete(k); }, contains: k => classes.has(k) },
      addEventListener(k,f) { if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(f); },
      emit(k,e={}) { for(const f of listeners.get(k)||[])f(e); },
      setAttribute(k,v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k]; },
      focus() { active = this; }, contains(e) { return e === this; },
      getBoundingClientRect: () => ({width:210}), hidden: false, offsetWidth:64 };
  }
  const home = element(), panel = element(), handle = element(), close = element(), backdrop = element(), sound = element();
  const draws = [];
  const canvas = { width:192,height:192,getContext:()=>({clearRect(){},drawImage(...args){draws.push(args);}}) };
  home.children = [panel,handle,backdrop,element()];
  home.querySelector=()=>panel; handle.querySelector=()=>canvas;
  const captured = new Set();
  handle.setPointerCapture=id=>captured.add(id);
  handle.hasPointerCapture=id=>captured.has(id);
  handle.releasePointerCapture=id=>captured.delete(id);
  const elements = {ttHomeScreen:home,ttHomeTurtle:handle,ttHomeSidebarClose:close,ttHomeSidebarBackdrop:backdrop,ttHomeTurtleSound:sound};
  const day = withDay ? element() : undefined;
  if (day) elements.ttHomeAttendanceDay = day;
  const ticks = [];
  let clock = new Date(2026, 9, 30, 23, 59);
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [clock.getTime()])); } }
  const document = element();
  document.getElementById=id=>elements[id];document.querySelector=()=>null;document.readyState='complete';
  Object.defineProperty(document,'activeElement',{get:()=>active});
  const window = element();
  const media = query=>({matches:query.includes('600')?narrow:reduced});
  const storage = {getItem(k){if(blockedStorage)throw Error('blocked');return store.get(k)||null;},setItem(k,v){if(blockedStorage)throw Error('blocked');store.set(k,v);writes.push([k,v]);}};
  Object.assign(window,{document,localStorage:storage,setInterval:(f,ms)=>{ticks.push({f,ms});}});
  const ctx=vm.createContext({window,document,Date:ClockDate,localStorage:storage,matchMedia:media,Image:class {complete=true;naturalWidth=768;},
    performance:{now:()=>now},requestAnimationFrame:f=>{queue.set(++nextFrame,f);return nextFrame;},cancelAnimationFrame:id=>queue.delete(id)});
  vm.runInContext(source,ctx);
  function flush(){for(let i=0;queue.size&&i<20;i++){now+=60;const list=[...queue.values()];queue.clear();list.forEach(f=>f(now));}assert.equal(queue.size,0);}
  function pointer(kind,x,type='mouse',extra={}) {handle.emit(kind,{pointerId:1,isPrimary:true,pointerType:type,button:0,clientX:x,clientY:400,...extra});}
  const value=()=>Number(home.style.values['--home-sidebar-progress']);
  return {home,panel,handle,close,backdrop,sound,document,window,pointer,flush,value,store,writes,draws,day,ticks,setClock:value=>{clock=value;}};
}
test('roll interpolation is reversible and clamps both end poses',()=>{
  assert.deepEqual(helper.pose(1),{first:0,second:1,mix:0});
  assert.deepEqual(helper.pose(0),{first:8,second:8,mix:0});
  assert.equal(helper.pose(.5).first,4);
  assert.deepEqual(helper.pose(2),helper.pose(1));
  assert.deepEqual(helper.pose(-1),helper.pose(0));
  for(let n=0;n<=100;n++){const p=n/100;const pose=helper.pose(p);assert.equal(pose.first+pose.mix,(1-p)*8);}
});
test('mouse drag follows position, reverses before release, settles and persists only its UI preference',()=>{
  const f=fixture(); assert.equal(f.value(),1);
  f.pointer('pointerdown',210); f.pointer('pointermove',84); assert.ok(Math.abs(f.value()-.4)<.001);
  assert.equal(f.writes.length,0,'no storage writes while dragging');
  f.pointer('pointermove',168);assert.ok(Math.abs(f.value()-.8)<.001,'reverses with the pointer');
  f.pointer('pointermove',42); f.pointer('pointerup',42);f.flush();assert.equal(f.value(),0);
  assert.equal(f.panel.inert,true);assert.equal(f.handle.attributes['aria-expanded'],'false');
  assert.deepEqual(f.writes,[['teachToday.homeSidebar.v1','closed']]);
  f.handle.emit('click',{detail:1});f.flush();assert.equal(f.value(),0,'release click cannot toggle twice');
});
test('touch drag opens the closed menu and tap toggles it once',()=>{
  const f=fixture({narrow:true});assert.equal(f.value(),0);
  f.pointer('pointerdown',20,'touch');f.pointer('pointermove',170,'touch');assert.ok(f.value()>.7);
  f.pointer('pointerup',170,'touch');f.flush();assert.equal(f.value(),1);
  f.handle.emit('click',{detail:1});f.flush();assert.equal(f.value(),1);
  f.pointer('pointerdown',220,'touch');f.pointer('pointerup',220,'touch');f.flush();assert.equal(f.value(),0);
  f.handle.emit('click',{detail:1});f.flush();assert.equal(f.value(),0);
});
test('cancellation, lost capture and resize restore a stable endpoint without persisting a partial state',()=>{
  for(const cancel of ['pointercancel','lostpointercapture']){
    const f=fixture();f.pointer('pointerdown',210);f.pointer('pointermove',80);f.pointer(cancel,80);f.flush();
    assert.equal(f.value(),1);assert.equal(f.writes.length,0);
  }
  const f=fixture();f.pointer('pointerdown',210);f.pointer('pointermove',80);f.window.emit('resize');f.flush();assert.equal(f.value(),1);
});
test('keyboard, mobile dismissal, reload preference and unavailable storage remain usable',()=>{
  const f=fixture({stored:'closed'});assert.equal(f.value(),0);
  f.handle.emit('click',{detail:0});f.flush();assert.equal(f.value(),1);
  f.handle.emit('keydown',{key:'ArrowLeft',preventDefault(){}});f.flush();assert.equal(f.value(),0);
  f.handle.emit('keydown',{key:'ArrowRight',preventDefault(){}});f.flush();assert.equal(f.value(),1);
  const phone=fixture({narrow:true,stored:'open'});phone.backdrop.emit('click');phone.flush();assert.equal(phone.value(),0);
  phone.handle.emit('click',{detail:0});phone.flush();phone.document.emit('keydown',{key:'Escape'});phone.flush();assert.equal(phone.value(),0);
  const blocked=fixture({blockedStorage:true});blocked.handle.emit('click',{detail:0});blocked.flush();assert.equal(blocked.value(),0);
});
test('phone overlay removes covered controls from keyboard focus and keeps reference menus usable',()=>{
  const f=fixture({narrow:true,stored:'open'});
  assert.equal(f.home.children[3].inert,true);
  f.panel.emit('click',{target:{closest:()=>({getAttribute:()=> 'menu'})}});f.flush();assert.equal(f.value(),1);
  f.panel.emit('click',{target:{closest:()=>({getAttribute:()=> null})}});f.flush();assert.equal(f.value(),0);
  assert.equal(f.home.children[3].inert,false);
});
test('reduced motion settles without intermediate roll; other pointers cannot hijack a gesture',()=>{
  const f=fixture({reduced:true});f.pointer('pointerdown',210);f.pointer('pointermove',30,'touch',{pointerId:2});assert.equal(f.value(),1);
  f.pointer('pointerup',210);f.flush();assert.equal(f.value(),0);
  assert.ok(!f.handle.classList.contains('turtle-giggle'));
  assert.equal(f.draws.at(-1)[1],512);assert.equal(f.draws.at(-1)[2],512);
});
test('the animation asset and controller are cached and versioned with V1 only',()=>{
  const html=fs.readFileSync('TeachToday.html','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
  assert.match(html,/home-sidebar\.js\?v=20261030-home-bubbles-1/);
  assert.match(sw,/\.\/home-sidebar\.js/);assert.match(sw,/assets\/home-turtle\/roll.webp/);
  assert.doesNotMatch(source,/appState|saveState|fetch\(|getUserMedia|Firebase/);
  assert.ok(fs.statSync('assets/home-turtle/roll.webp').size<200000);
});

test('offline first use resolves the exact new versioned runtime from the install cache',async()=>{
  const sw=fs.readFileSync('service-worker.js','utf8');
  const handlers={};const installed=new Map();const origin='https://example.test/Teach-Today/';
  const cache={async addAll(paths){for(const path of paths)installed.set(new URL(path,origin).href,{kind:path});},async put(){}};
  const ctx=vm.createContext({URL,self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    caches:{open:async()=>cache,match:async request=>installed.get(new URL(typeof request==='string'?request:request.url,origin).href)},
    fetch:async()=>{throw Error('offline');}});
  vm.runInContext(sw,ctx);
  let installing;handlers.install({waitUntil:p=>installing=p});await installing;
  for(const path of ['home-sidebar.js?v=20261030-home-bubbles-1','teach-today.js?v=20261030-home-bubbles-1','teach-today.css?v=20261030-home-bubbles-1','assets/home-navigation/lesson-binder.webp','assets/home-navigation/charting-paper.webp','assets/home-navigation/profile-circles.webp']){
    let response;handlers.fetch({request:{url:origin+path,method:'GET',destination:path.includes('.css')?'style':'script'},respondWith:p=>response=p});
    assert.equal((await response).kind,'./'+path,'never return HTML for a new offline runtime request');
  }
});

test('Attendance watermark follows the local date across midnight, month end and foreground without any storage write',()=>{
  const f=fixture({withDay:true});
  assert.equal(f.day.textContent,'30');
  assert.equal(f.ticks.length,1);
  assert.equal(f.ticks[0].ms,60000);
  f.setClock(new Date(2026,9,31,0,0)); f.ticks[0].f();
  assert.equal(f.day.textContent,'31');
  f.setClock(new Date(2026,10,1,8)); f.document.emit('visibilitychange');
  assert.equal(f.day.textContent,'1');
  f.setClock(new Date(2026,10,2,8)); f.window.emit('focus');
  assert.equal(f.day.textContent,'2');
  assert.deepEqual(f.writes,[], 'calendar decoration must not persist attendance or preferences');
});
