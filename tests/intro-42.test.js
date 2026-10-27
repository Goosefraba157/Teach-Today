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
  const context = { TTIntro42: intro, ttIntro42Lesson: "compounds", ttById: id => { if (!nodes.has(id)) nodes.set(id, { setAttribute() {}, focus() {} }); return nodes.get(id); }, ttSetIntro21BackgroundInert() {}, document: { body: { classList: { add() {} } } }, ttSetNativeProjectionMode() {}, localStorage: { setItem() {} }, ttToggleGlobalInkPalette() {}, ttSetGlobalInkActive() {}, ttRenderIntro21() {} };
  vm.createContext(context); vm.runInContext(fn, context);
  context.ttOpenIntro42();
  assert.equal(context.ttIntro21Index, 0); assert.equal(context.ttIntro21Variant, 'discovery42');
  context.ttOpenIntro42('section2b', 'ttOpenIntro42DiscoveryB2');
  assert.equal(context.ttIntroSourceSection, 'section2b'); assert.equal(context.ttIntroLaunchButtonId, 'ttOpenIntro42DiscoveryB2');
  context.ttOpenIntro42('section7', 'ttOpenIntro42Spelling');
  assert.equal(intro.getScenes(context.ttIntro42Lesson, true)[context.ttIntro21Index].id, 'spell-bridge');
  assert.equal(context.ttIntroLaunchButtonId, 'ttOpenIntro42Spelling');
});


test('4.2 lessons stay short and keep later word types out of the first visit', () => {
  assert.equal(Object.keys(intro.lessons).length, 5);
  for (const lesson of Object.values(intro.lessons)) {
    assert.ok(lesson.reading.length <= 9);
    assert.ok(lesson.spelling.length <= 5);
    assert.equal(lesson.spelling[0].id, 'spell-bridge');
  }
  assert.ok(!JSON.stringify(intro.lessons.compounds.reading).includes('conclude'));
  assert.ok(!JSON.stringify(intro.lessons.compounds.reading).includes('forecast'));
  assert.match(intro.lessons.compounds.label, /p\.50/);
  assert.match(intro.lessons.prefixes.label, /p\.51/);
  assert.match(intro.lessons.fore.label, /bridge/);
  assert.ok(intro.lessons.complex.reading.some(s => s.id === 'complex-suffix'));
});
