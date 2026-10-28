const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const intro = require('../intro-42.js');
const teacher = fs.readFileSync(require.resolve('../teach-today.js'), 'utf8');

test('4.2 native-whitelisted scene fields reproduce the teacher visual without cues', () => {
  for (const scene of intro.scenes) {
    const nativeCard = { layout: scene.layout, items: scene.items.map(({ text, type, keyword }) => ({ text, type, keyword })) };
    assert.equal(intro.render(scene), intro.render(nativeCard), scene.id);
    assert.ok(intro.render(nativeCard).length > 40);
    assert.ok(!intro.render(nativeCard).includes(scene.cue));
  }
});

test('4.2 spelling keeps both and then the second syllable hidden until the reveal', () => {
  for (const word of ['sunshine', 'misname', 'forecast']) {
    const hidden = intro.scenes.find(s => s.id === `spell-${word}-hidden`);
    assert.deepEqual(hidden.items.map(i => i.text), ['?', '?']);
    assert.ok(!JSON.stringify({ headline: hidden.headline, subhead: hidden.subhead, items: hidden.items }).includes(word));
    assert.equal(intro.scenes.find(s => s.id === `spell-${word}-first`).items[1].text, '?');
    assert.ok(intro.scenes.find(s => s.id === `spell-${word}-answer`).items.every(i => i.text !== '?'));
  }
  assert.ok(!intro.render(intro.scenes.find(s => s.id === 'baseball-answer')).includes('vowel breve'));
});

test('4.2 launch paths start full discovery or spelling, and preserve return targets', () => {
  const fn = teacher.slice(teacher.indexOf('function ttOpenIntro42('), teacher.indexOf('function ttCloseIntro21('));
  const nodes = new Map();
  const context = { ttLesson: null, TTIntro42: intro, ttIntro42Lesson: "compounds", ttById: id => { if (!nodes.has(id)) nodes.set(id, { setAttribute() {}, focus() {} }); return nodes.get(id); }, ttSetIntro21BackgroundInert() {}, document: { body: { classList: { add() {} } } }, ttSetNativeProjectionMode() {}, localStorage: { setItem() {} }, ttToggleGlobalInkPalette() {}, ttSetGlobalInkActive() {}, ttRenderIntro21() {} };
  vm.createContext(context); vm.runInContext(fn, context);
  context.ttOpenIntro42();
  assert.equal(context.ttIntro21Index, 0); assert.equal(context.ttIntro21Variant, 'discovery42');
  context.ttOpenIntro42('section2b', 'ttOpenIntro42DiscoveryB2');
  assert.equal(context.ttIntroSourceSection, 'section2b'); assert.equal(context.ttIntroLaunchButtonId, 'ttOpenIntro42DiscoveryB2');
  context.ttOpenIntro42('section7', 'ttOpenIntro42Spelling');
  assert.equal(intro.getScenes(context.ttIntro42Lesson, true)[context.ttIntro21Index].id, 'spell-bridge');
  assert.equal(context.ttIntroLaunchButtonId, 'ttOpenIntro42Spelling');
});


test('4.2 reading stays short and spelling offers three guided words', () => {
  assert.equal(Object.keys(intro.lessons).length, 5);
  for (const lesson of Object.values(intro.lessons)) {
    assert.ok(lesson.reading.length <= 9);
    assert.ok(lesson.spelling.length <= 11);
    assert.ok(lesson.reinforcement.length <= 6);
    assert.equal(new Set(lesson.spelling.map(s => s.practiceWord).filter(Boolean)).size, 3);
    assert.equal(lesson.spelling[0].id, 'spell-bridge');
  }
  assert.ok(!JSON.stringify(intro.lessons.compounds.reading).includes('conclude'));
  assert.ok(!JSON.stringify(intro.lessons.compounds.reading).includes('forecast'));
  assert.match(intro.lessons.compounds.label, /p\.50/);
  assert.match(intro.lessons.prefixes.label, /p\.51/);
  assert.match(intro.lessons.fore.label, /bridge/);
  assert.ok(intro.lessons.complex.reading.some(s => s.id === 'complex-suffix'));
});


test('Day 2 compound examples are different and show two meaningful words', () => {
  const examples = intro.getScenes('compounds', false, true);
  assert.deepEqual(examples.filter(s => s.layout === 'word').map(s => s.items[0].text), ['campfire', 'flagpole', 'notepad']);
  const original = JSON.stringify(intro.lessons.compounds.reading);
  for (const word of ['campfire', 'flagpole', 'notepad']) assert.ok(!original.includes(word));
  for (const scene of examples.filter(s => s.layout === 'marked')) {
    assert.equal(scene.items.length, 2);
    assert.match(scene.headline, /Two words/);
  }
});

test('Every guided spelling word hides both cards, then reveals exactly one syllable', () => {
  for (const lesson of Object.values(intro.lessons)) {
    const words = [...new Set(lesson.spelling.map(s => s.practiceWord).filter(Boolean))];
    for (const word of words) {
      const frames = lesson.spelling.filter(s => s.practiceWord === word);
      assert.equal(frames.length, 3);
      assert.deepEqual(frames[0].items.map(i => i.text), ['?', '?']);
      assert.ok(!JSON.stringify({headline: frames[0].headline, subhead: frames[0].subhead, items: frames[0].items}).includes(word));
      assert.notEqual(frames[1].items[0].text, '?');
      assert.equal(frames[1].items[1].text, '?');
      assert.ok(frames[2].items.every(i => i.text !== '?'));
      assert.equal(frames[2].subhead, word);
    }
  }
});

test('Section 2B follows Section 2 rather than an independent topic', () => {
  const fn = teacher.slice(teacher.indexOf('function ttOpenIntro42('), teacher.indexOf('function ttCloseIntro21('));
  const context = { ttLesson: {intro42Topic:'compounds'}, TTIntro42:intro, ttById:id=>id==='ttIntro42Choice'?{value:'prefixes'}:id==='ttIntro42ChoiceB2'?{value:'complex'}:{setAttribute(){},focus(){}}, ttSetIntro21BackgroundInert(){}, document:{body:{classList:{add(){}}}}, ttSetNativeProjectionMode(){}, localStorage:{setItem(){}}, ttToggleGlobalInkPalette(){}, ttSetGlobalInkActive(){}, ttRenderIntro21(){} };
  vm.createContext(context); vm.runInContext(fn, context); context.ttOpenIntro42('section2b','ttOpenIntro42DiscoveryB2');
  assert.equal(context.ttIntro42Lesson,'prefixes');
});

test('Topic choice persists only lesson metadata without changing saved scores or status', async () => {
  const fn = teacher.slice(teacher.indexOf('async function ttChooseIntro42Topic('), teacher.indexOf('function ttUpdateIntro42WordPicker('));
  const saved = {id:'lesson-1', substep:'4.2', chartResults:[{correct:12}], completedSections:['1']};
  const plan = {lessons:[saved],status:'In progress'};
  const context = {ttLesson:JSON.parse(JSON.stringify(saved)),TTIntro42:intro,ttCurrentPlan:()=>plan,appState:{},ttFillIntro42Choices(){},saveState:async()=>{context.saves=(context.saves||0)+1},ttDraftKey:()=> 'demo',ttClone:value=>JSON.parse(JSON.stringify(value))};
  vm.createContext(context);vm.runInContext(fn,context);await context.ttChooseIntro42Topic('division');
  assert.equal(saved.intro42Topic,'division');assert.equal(context.saves,1);assert.equal(plan.status,'In progress');assert.deepEqual(saved.chartResults,[{correct:12}]);assert.deepEqual(saved.completedSections,['1']);
  context.ttCurrentPlan=()=>null;await context.ttChooseIntro42Topic('compounds');assert.equal(context.appState.lessonDrafts.demo.intro42Topic,'compounds');
});
