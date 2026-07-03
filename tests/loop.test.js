// Loop Pack: the town remembers — lastEnd/blackouts/tab, loop-tiered dialogue,
// drunkify determinism, stamp flavor coverage.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, frame, settle } = boot();
  const g = BC.game;

  // loopPick tiers
  g.meta.loops = 1;
  t.ok('loopPick base tier', g.loopPick([[0, 'a'], [3, 'b'], [7, 'c']]) === 'a');
  g.meta.loops = 5;
  t.ok('loopPick mid tier', g.loopPick([[0, 'a'], [3, 'b'], [7, 'c']]) === 'b');
  g.meta.loops = 9;
  t.ok('loopPick top tier', g.loopPick([[0, 'a'], [3, 'b'], [7, 'c']]) === 'c');

  // blackout in a bar records the scene of the crime
  g.newRun();
  BC.setScene('bar', { id: 'sticky_floor', ret: { key: '1,1', tx: 3, ty: 4 } });
  settle(12);
  const bo = g.meta.blackouts, tab = g.meta.tab;
  g.drink(100);
  t.ok('lastEnd records blackout + bar', g.meta.lastEnd && g.meta.lastEnd.reason === 'blackout' && g.meta.lastEnd.barId === 'sticky_floor');
  t.ok('blackouts increments', g.meta.blackouts === bo + 1);
  t.ok('tab grows with every drink', g.meta.tab === tab + 7);
  for (let i = 0; i < 200 && BC.sceneName !== 'home'; i++) frame(0.25, 'KeyZ');
  settle(12);
  t.ok('blackout loops back home', BC.sceneName === 'home');

  // loop-aware NPC lines resolve as functions
  const neighbor = BC.world.screens['0,0'].meta.actors.find((a) => a.name === 'Neighbor');
  g.meta.loops = 12;
  const lines = neighbor.lines(g);
  t.ok('neighbor escalates by loop 12', Array.isArray(lines) && lines[0].indexOf('porch light') >= 0);

  // drunkify: deterministic, tier-gated
  const U = BC.util;
  t.ok('drunkify no-ops sober', U.drunkify('Order & play', 0, 1) === 'Order & play');
  const a1 = U.drunkify('Order & play', 3, 1), a2 = U.drunkify('Order & play', 3, 1);
  t.ok('drunkify deterministic', a1 === a2 && a1 !== 'Order & play');

  // every card stamp has a flavor line, and earning sets mastered
  const card = g.activeCard();
  t.ok('stamp flavor covers the whole card', card.every((id) => !!g.STAMP_FLAVOR[id]));
  g.newRun();
  g.earnStamp('tipsy_newt');
  t.ok('earnStamp marks mastered', g.meta.mastered.tipsy_newt === true);

  return t.done();
};
