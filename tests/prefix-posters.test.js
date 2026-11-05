const test = require('node:test');
const assert = require('node:assert/strict');
const poster = require('../prefix-posters.js');
test('review remains cumulative with two distinct 3.2 sets and exact substep boundaries', () => {
  for (const [step,count] of [['3.1',6],['3.2-first',12],['3.2',19],['4.2',20],['5.1',26],['5.5',27]]) {
    assert.equal(poster.selected(step).flatMap(g=>g.cards).length,count);
  }
  assert.equal(poster.defaultThrough('2.3'),'none');
  assert.equal(poster.defaultThrough('3.2'),'3.2');
  assert.equal(poster.defaultThrough('4.1'),'3.2');
  assert.equal(poster.defaultThrough('5.4'),'5.1');
  assert.equal(poster.defaultThrough('12.1'),'5.5');
  assert.equal(poster.defaultThrough(''),'none');
  assert.equal(poster.selected('bogus').length,0);
});
test('each example starts with the circled prefix and no later per- card is included', () => {
  const cards=poster.groups.flatMap(g=>g.cards);
  assert.equal(new Set(cards.map(c=>c[0])).size,27);
  for (const [prefix,meaning,word] of cards) { assert(word.startsWith(prefix)); assert(meaning); }
  assert(!cards.some(c=>c[0]==='per'));
  assert.equal((poster.render().match(/class="prefix-circle"/g)||[]).length,27);
});
test('native projection uses only curriculum selector fields in the installed whitelist', () => {
  const data=poster.payload('3.2-first');
  assert.deepEqual(data.cardDisplay,{kind:'prefix-poster',key:'prefix-poster:3.2-first',variant:'3.2-first'});
  assert.equal(data.mode,'cards');
  assert.equal(data.groupName,'Teach Today');
});
