const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../card-motion.js'), 'utf8');
const teacher = fs.readFileSync(require.resolve('../teach-today.js'), 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {setProperty(){}};
    this.hidden = false; this._text = ''; this.effects = [];
    this.ownerDocument = {createElementNS: (_, tag) => new Element(tag)};
    this.className = '';
    this.classList = {
      contains: c => this.className.split(' ').includes(c),
      add: c => { if (!this.classList.contains(c)) this.className += ` ${c}`; },
      remove: c => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); },
      toggle: (c, on) => on ? this.classList.add(c) : this.classList.remove(c)
    };
  }
  set textContent(s) { this._text = s; this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set innerHTML(s) { this._text = s; this.children = []; }
  setAttribute(k, v) { this.attrs[k] = v; if (k === 'class') this.className = v; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  remove() { this.parent.children = this.parent.children.filter(c => c !== this); }
  querySelectorAll(selector) {
    const classes = selector.split(',').map(x => x.trim().slice(1));
    return this.children.flatMap(c => [ ...(classes.some(x => c.classList.contains(x)) ? [c] : []), ...c.querySelectorAll(selector)]);
  }
  animate(frames, options) {
    const effect = {frames, options, cancelled: false, cancel(){ this.cancelled = true; }};
    this.effects.push(effect); return effect;
  }
}
function setup({reduced = false, saved = null, blocked = false} = {}) {
  const writes = [];
  const context = {window: null, Date, matchMedia:()=>({matches:reduced}), localStorage:{
    getItem:()=> { if (blocked) throw Error('blocked'); return saved; },
    setItem:(...args)=> { if (blocked) throw Error('blocked'); writes.push(args); }
  }};
  context.window = context; vm.createContext(context); vm.runInContext(source, context);
  return {api:context.TTCardMotion, context, writes};
}
function board(items) {
  const root = new Element();
  items.forEach(({text,type}) => { const card = new Element('span'); card.className = `build-card ${type}`; card.textContent = text; root.appendChild(card); });
  return root;
}
const corrected = [
  {text:'be',type:'syllable'}, {text:'long',type:'syllable'}, {text:'ing',type:'suffix'}, {text:'s',type:'suffix'}
];
function signature(root) { return root.children.map(c => ({text:c.textContent, type:c.className.split(' ').filter(x=>x!=='tt-card-written').join(' ')})); }
function functionSource(name) {
  const start = teacher.indexOf(`function ${name}(`);
  const end = teacher.indexOf('\nfunction ', start + 1);
  return teacher.slice(start, end);
}

test('Classic is the default; preference writes only a separate device key and handles denied storage', () => {
  const {api,writes} = setup(); assert.equal(api.style(),'classic'); assert.deepEqual(writes,[]);
  api.setStyle('animated'); assert.deepEqual(writes,[['teachToday.cardMotion.v1','animated']]);
  assert.equal(setup({saved:'animated'}).api.style(),'animated');
  const denied = setup({blocked:true}).api; denied.setStyle('animated'); assert.equal(denied.style(),'animated');
});

test('animation, replay, Show all and Classic preserve the exact corrected card nodes/text/order/types', () => {
  const {api} = setup(); const root = board(corrected); const original = signature(root); const nodes = [...root.children];
  api.apply(root,{animated:true}); assert.deepEqual(signature(root),original); assert.deepEqual(root.children,nodes);
  assert.equal(root.querySelectorAll('.tt-card-ink').length,4);
  assert.ok(root.querySelectorAll('.tt-card-ink').every(svg=>svg.attrs['aria-hidden']==='true'));
  const old = root.children.flatMap(c=>c.effects);
  api.apply(root,{animated:true}); assert.ok(old.every(x=>x.cancelled)); assert.equal(root.querySelectorAll('.tt-card-ink').length,4);
  api.apply(root,{animated:true,still:true}); assert.equal(api.snapshot(root).variant,'still');
  assert.deepEqual(signature(root),original);
  api.apply(root,{animated:false}); assert.deepEqual(signature(root),original); assert.equal(root.querySelectorAll('.tt-card-ink').length,0);
  assert.equal(root.classList.contains('tt-physical-cards'),false);
});

test('reduced motion and missing animation APIs keep the complete word available', () => {
  const {api} = setup({reduced:true}); const root=board(corrected); api.apply(root,{animated:true});
  assert.equal(api.snapshot(root).variant,'still'); assert.equal(root.children.flatMap(c=>c.effects).length,0);
  const plain=board(corrected); plain.children[0].animate=undefined; api.apply(plain,{animated:true});
  assert.equal(plain.textContent,'belongings'); assert.equal(plain.querySelectorAll('.tt-card-ink').length,0);
});

test('unsupported glyphs and animation errors fall back to readable original text', () => {
  const {api} = setup(); const root=board([{text:'Élan',type:'syllable'}]); api.apply(root,{animated:true});
  assert.equal(root.textContent,'Élan'); assert.equal(root.querySelectorAll('.tt-card-ink').length,0);
  const failure=board(corrected); failure.children[1].animate=()=>{throw Error('cancelled');};
  api.apply(failure,{animated:true}); assert.equal(failure.textContent,'belongings');
  assert.equal(failure.querySelectorAll('.tt-card-ink').length,0); assert.equal(failure.classList.contains('tt-physical-cards'),false);
});

test('Stage can resume an existing build epoch rather than restart on repeated payloads', () => {
  const {api} = setup(); const root=board([{text:'t',type:'consonant'},{text:'a',type:'vowel'}]);
  const epoch=Date.now()-10000; api.apply(root,{animated:true,startedAt:epoch});
  assert.equal(api.snapshot(root).variant,String(epoch));
  assert.ok(root.children.every(c=>c.effects.at(-1).options.delay < -9000));
  assert.equal(root.querySelectorAll('.tt-card-ink').length,0); // Sound cards remain printed.
});

test('both real teacher renderers reuse canonical corrected cards and preserve classroom state in either style', () => {
  for (const day2 of [false,true]) {
    const {api,context} = setup(); const ids = {};
    const displayId=day2?'ttSection2BDisplay':'ttSection2Display';
    for (const id of [displayId,day2?'ttSection2BHint':'ttSection2Hint',day2?'ttSection2EditorB2':'ttSection2Editor']) ids[id]=new Element();
    const lesson = {id:'synthetic',substep:'6.4',chartRecords:[],attendance:{},sectionTwoCurrentWords:['belongings']};
    Object.assign(context, {
      ttLesson:lesson, ttById:id=>ids[id], ttActiveGroup:()=>({substep:'6.4'}),
      ttSection2Deck:[{word:'belongings'}], ttSection2BDeck:[{word:'belongings'}],
      section2CardsForWord:()=>({mode:'syllables',items:corrected}),
      section2DisplayCardText:item=>item.text, ttRenderSection2Count(){},ttRenderSection2BCount(){},
      ttRenderMarkedWords(){},ttSyncFollowingStudentDisplay(){},
      document:{createElement:tag=>new Element(tag)}
    });
    const before=JSON.stringify(lesson); vm.runInContext(functionSource('ttApplyCardMotion'),context);
    const fn=day2?'ttShowSection2BWord':'ttShowSection2Word'; vm.runInContext(functionSource(fn),context);
    context[fn]('belongings','6.4'); const classic=signature(ids[displayId]);
    api.setStyle('animated'); context[fn]('belongings','6.4'); assert.deepEqual(signature(ids[displayId]),classic);
    assert.equal(JSON.stringify(lesson),before); assert.equal(corrected.length,4);
  }
});

test('style switching and Stage payloads do not alter lesson evidence or stored split overrides', () => {
  const {api,context,writes}=setup(); const day1=board(corrected),day2=board(corrected);
  const lesson={id:'synthetic',substep:'6.4',chartRecords:[],attendance:{},sectionProgress:{}};
  const before=JSON.stringify(lesson); const splits=JSON.stringify(corrected);
  Object.assign(context, {ttLesson:lesson, ttById:id=>id==='ttSection2Display'?day1:day2,
    ttUpdateCardMotionControls(){},ttSyncStudentDisplay(){},ttIntro21Open:false,
    ttSection2Word:'belongings',ttSection2BWord:'belongings',ttSection2Index:0,ttSection2BIndex:0,
    ttSection2Deck:[{}],ttSection2BDeck:[{}],ttStudentDisplaySectionLabel:id=>id,
    section2CardsForWord:()=>({mode:'syllables',items:corrected}),section2DisplayCardText:item=>item.text
  });
  for(const fn of ['ttApplyCardMotion','ttSetCardMotionStyle','ttStudentDisplayCardPayload']) vm.runInContext(functionSource(fn),context);
  context.ttSetCardMotionStyle('animated');
  for(const id of ['section2','section2b']) {
    const payload=context.ttStudentDisplayCardPayload(id,lesson,{id:'6.4'});
    assert.equal(payload.layout,'physical-cards'); assert.equal(payload.items.map(i=>i.text).join(''),'belongings');
    assert.deepEqual(Object.keys(api.snapshot(id==='section2'?day1:day2)).sort(),['layout','variant']);
  }
  context.ttSetCardMotionStyle('classic'); assert.equal(context.ttStudentDisplayCardPayload('section2',lesson,{id:'6.4'}).layout,undefined);
  assert.equal(JSON.stringify(lesson),before); assert.equal(JSON.stringify(corrected),splits);
  assert.ok(writes.every(([key])=>key==='teachToday.cardMotion.v1'));
});
