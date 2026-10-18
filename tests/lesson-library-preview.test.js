const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('lesson-library-preview.js','utf8');
const pending = () => { let resolve; const promise = new Promise(r => { resolve=r; }); return {promise,resolve}; };
const tick = () => new Promise(setImmediate);
function fixture(getDocument) {
  let swaps = 0;
  const ownerDocument = {createElement:() => canvas()};
  function canvas() { return {id:'canvas',style:{},ownerDocument,hidden:false,width:0,height:0,
    setAttribute(k,v){this[k]=v;},getContext:()=>({}),replaceWith(){swaps++;}}; }
  const context=vm.createContext({document:{baseURI:'http://localhost/'},URL,Promise,Math,setTimeout,clearTimeout,devicePixelRatio:2});
  vm.runInContext(source,context);
  const viewport={clientWidth:800,clientHeight:650,setAttribute(k,v){this[k]=v;}};
  const message={};const pages=[];
  const viewer=new context.TeachTodayLessonPdfPreview({viewport,canvas:canvas(),message,
    onPageChange:info=>pages.push(info),pdfjsLoader:async()=>({getDocument})});
  return {viewer,message,pages,swaps:()=>swaps};
}
function document(render = () => ({promise:Promise.resolve(),cancel(){}})) {
  return {numPages:3,getPage:async number=>({getViewport:({scale})=>({width:612*scale,height:792*scale}),
    render:options=>render(number,options)})};
}

test('PDF preview renders copied bytes, turns pages, bounds zoom, and releases its document on close',async()=>{
  let received,destroyed=0;const pdf=document();
  const f=fixture(options=>{received=options;return {promise:Promise.resolve(pdf),destroy(){destroyed++;}};});
  const bytes=new Uint8Array([1,2,3]);assert.equal(await f.viewer.load(bytes),true);
  assert.notEqual(received.data,bytes);assert.equal(received.isEvalSupported,false);assert.equal(received.useWasm,false);
  assert.equal(f.viewer.page,1);assert.equal(f.viewer.total,3);assert.equal(f.message.hidden,true);
  assert.equal(f.viewer.canvas['aria-label'],'Lesson-plan page 1 of 3');
  await f.viewer.goTo(99);assert.equal(f.viewer.page,3);
  await f.viewer.setView({fit:'page',zoom:1});assert.ok(parseInt(f.viewer.canvas.style.height)<=626);
  await f.viewer.setView({zoom:20});assert.equal(f.viewer.zoom,2);assert.ok(f.viewer.canvas.width*f.viewer.canvas.height<=8000000+10000);
  f.viewer.clear();assert.equal(destroyed,1);assert.equal(f.viewer.total,0);assert.equal(f.viewer.canvas.hidden,true);
});

test('late completion of an older lesson cannot replace a newly selected PDF',async()=>{
  const old=pending();let oldDestroyed=0;
  const latest=document();const f=fixture(({data})=>data[0]===1
    ? {promise:old.promise,destroy(){oldDestroyed++;}}
    : {promise:Promise.resolve(latest),destroy(){}});
  const first=f.viewer.load(new Uint8Array([1]));await tick();
  assert.equal(await f.viewer.load(new Uint8Array([2])),true);
  old.resolve(document());assert.equal(await first,false);
  assert.equal(f.viewer.pdf,latest);assert.equal(oldDestroyed,1);assert.equal(f.swaps(),1);
});

test('a late old-page render cannot paint over the page selected afterward',async()=>{
  const oldPage=pending();let canceled=0;
  const pdf=document(number=>number===2?{promise:oldPage.promise,cancel(){canceled++;}}:{promise:Promise.resolve(),cancel(){}});
  const f=fixture(()=>({promise:Promise.resolve(pdf),destroy(){}}));await f.viewer.load(new Uint8Array([1]));
  const second=f.viewer.goTo(2);await tick();await f.viewer.goTo(3);oldPage.resolve();await second;
  assert.equal(canceled,1);assert.equal(f.viewer.canvas['aria-label'],'Lesson-plan page 3 of 3');assert.equal(f.swaps(),2);
});

test('closing while a PDF loads prevents a later hidden document from rendering',async()=>{
  const load=pending();let destroyed=0;
  const f=fixture(()=>({promise:load.promise,destroy(){destroyed++;}}));const result=f.viewer.load(new Uint8Array([1]));
  await tick();f.viewer.clear();load.resolve(document());assert.equal(await result,false);
  assert.equal(destroyed,1);assert.equal(f.swaps(),0);assert.equal(f.viewer.canvas.hidden,true);
});

test('a PDF load failure leaves an actionable fallback instead of a stale page',async()=>{
  const f=fixture(()=>({promise:Promise.reject(Error('Synthetic PDF failure')),destroy(){}}));
  assert.equal(await f.viewer.load(new Uint8Array([1])),false);
  assert.match(f.message.textContent,/Use View PDF or Preview PDF/);assert.equal(f.viewer.canvas.hidden,true);
});

test('saved PDF preparation detaches legacy groups and plans before PDF helpers run',async()=>{
  const code=fs.readFileSync('teach-today.js','utf8');const group={name:'Group 1',history:[]};
  const plan={status:'Complete',lessons:[{substep:'2.2'}],lessonPlanVersions:{completed:{fields:{text:{},checks:[]}}}};
  group.history.push(plan);const before=JSON.stringify({group,plan});
  const context=vm.createContext({Date,ttClone:value=>JSON.parse(JSON.stringify(value)),scopeMap:[{id:'2.2'}],
    ttBuildWilsonLessonPlanPdf:async(g,s,l,p)=>{g.changed=true;l.changed=true;p.changed=true;return new Uint8Array([1]);},
    ttLessonPlanArchiveFileName:()=> 'lesson.pdf',ttLessonPlanGroupFolderName:()=> 'Group 1'});
  vm.runInContext(code.slice(code.indexOf('async function ttSavedLessonPlanPdfDocument'),code.indexOf('async function ttOpenSavedLessonPlanPdf')),context);
  await context.ttSavedLessonPlanPdfDocument(group,plan);
  assert.equal(JSON.stringify({group,plan}),before);
});
