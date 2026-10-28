const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const intro = require('../intro-23.js');
const teacher = fs.readFileSync(require.resolve('../teach-today.js'), 'utf8');

test('2.3 introduces each exception separately with the correct keyword and welded tap', () => {
  assert.equal(intro.scenes.length, 26);
  const cards = intro.scenes.filter(s => s.id.startsWith('card-'));
  assert.deepEqual(cards.map(s => s.items[0].text), ['ind','ild','old','olt','ost']);
  assert.deepEqual(cards.map(s => s.items[0].keyword.split(' · ')[0]), ['find','wild','cold','colt','post']);
  assert.ok(cards.every(s => s.items.length === 1 && s.items[0].type === 'welded'));
  assert.equal(intro.scenes.find(s => s.id === 'mnemonic').subhead, 'You will find the wild, cold colt on the post.');
  assert.deepEqual(intro.scenes.find(s => s.id === 'tap').items.map(i => i.text), ['c', 'old']);
  assert.match(intro.scenes.find(s => s.id === 'tap').cue, /three fingers welded together/);
  assert.match(intro.scenes.find(s => s.id === 'check').cue, /Reader AB p.64/);
});

test('2.3 native-whitelisted fields reconstruct every visual without teacher cues', () => {
  for (const scene of intro.scenes) {
    const projected = { layout: scene.layout, items: scene.items.map(({text,type,keyword}) => ({text,type,keyword})) };
    assert.equal(intro.render(scene), intro.render(projected), scene.id);
    assert.ok(!intro.render(projected).includes(scene.cue));
  }
  assert.match(intro.render({layout:'words',items:[{text:'<script>'}]}), /&lt;script&gt;/);
  const display = fs.readFileSync(require.resolve('../student-display.js'), 'utf8');
  assert.match(display, /card.kind === "intro-23"/);
  assert.match(display, /TTIntro23.render\(card\)/);
});

test('2.3 launches at the beginning from either reading section without classroom writes', () => {
  const fn = teacher.slice(teacher.indexOf('function ttOpenIntro23('), teacher.indexOf('function ttOpenIntro35('));
  const classroom = { substep:'2.3', wordlistPageNumber:64, attendance:{}, chartRecords:[], status:'draft' };
  const before = JSON.stringify(classroom);
  const context = { ttLesson:classroom, ttById:()=>({setAttribute(){},focus(){}}), ttSetIntro21BackgroundInert(){}, document:{body:{classList:{add(){}}}}, ttSetNativeProjectionMode(){}, localStorage:{setItem(){}}, ttToggleGlobalInkPalette(){}, ttSetGlobalInkActive(){}, ttRenderIntro21(){} };
  vm.createContext(context); vm.runInContext(fn, context);
  context.ttOpenIntro23();
  assert.equal(context.ttIntro21Variant,'discovery23'); assert.equal(context.ttIntro21Index,0);
  assert.equal(context.ttIntroSourceSection,'section2');
  context.ttOpenIntro23('section2b','ttOpenIntro23DiscoveryB2');
  assert.equal(context.ttIntroSourceSection,'section2b');
  assert.equal(context.ttIntroLaunchButtonId,'ttOpenIntro23DiscoveryB2');
  assert.equal(JSON.stringify(classroom),before);
});

 test('every new sound is heard before spellings and the card are revealed', () => {
  for (const letters of ['ind','ild','old','olt','ost']) {
    const index = intro.scenes.findIndex(s => s.id === `listen-${letters}`);
    const listen = intro.scenes[index];
    const look = intro.scenes[index + 1];
    const card = intro.scenes[index + 2];
    assert.equal(look.id, `look-${letters}`);
    assert.equal(card.id, `card-${letters}`);
    const studentText = JSON.stringify({headline:listen.headline,subhead:listen.subhead,items:listen.items});
    assert.ok(!studentText.includes(letters));
    for (const word of look.items.map(i => i.text)) {
      assert.ok(listen.cue.includes(word));
      assert.ok(!studentText.includes(word));
    }
    assert.match(look.cue, /vowel is short or says its name/);
  }
  assert.ok(intro.scenes.findIndex(s => s.id === 'name') > intro.scenes.findIndex(s => s.id === 'card-ost'));
});

test('2.3 marking boxes the glued letters while keeping the full syllable scoop', () => {
  const answer = intro.scenes.find(s => s.id === 'mark-answer');
  const html = intro.render(answer);
  assert.match(html, /t<span class="intro-23-glued-box">ōld<\/span>/);
  assert.match(html, /intro-23-scoop/);
  assert.match(answer.cue, /Boxing is part/);
  assert.ok(intro.scenes.filter(s => s.id.startsWith('look-')).every(s => /box the matching glued letters/.test(s.cue)));
});
