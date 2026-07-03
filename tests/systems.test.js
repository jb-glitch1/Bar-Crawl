// Game systems: blackout drop/recovery, reorder pours, dungeon menu, tasting shuffle.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, frame, settle } = boot();

  // --- blackout drop -> walkable tile -> walk-over recovery (10 cycles) ---
  let walkable = true, recovered = true, drops = 0;
  for (let n = 0; n < 10; n++) {
    BC.game.newRun();
    BC.setScene('overworld', { key: '0,0' });
    BC.game.meta.dropped = null;
    BC.game.giveItem('bike');
    BC.game.drink(100); // blackout
    for (let i = 0; i < 200 && BC.sceneName !== 'home'; i++) frame(0.25, 'KeyZ');
    settle(12); // let the fade tail finish
    const dr = BC.game.meta.dropped;
    if (!dr) break;
    drops++;
    const scr = BC.world.screens[dr.key], tile = scr.tiles[dr.ty * scr.w + dr.tx];
    if (BC.world.SOLID.has(tile) || tile === BC.world.T.DOOR) walkable = false;
    BC.setScene('overworld', { key: dr.key });
    BC.player.x = dr.tx * 16 + 8; BC.player.y = dr.ty * 16 + 12;
    frame(1 / 60);
    if (!(BC.game.hasItem('bike') && BC.game.meta.dropped === null)) recovered = false;
  }
  t.ok('10 blackouts all recorded a drop', drops === 10);
  t.ok('drops always walkable', walkable);
  t.ok('drops always recoverable', recovered);

  // --- reordering pours the bar amount (18 at the dive), not 12 ---
  BC.game.newRun();
  BC.game.run.stamps.sticky_floor = true;
  BC.setScene('bar', { id: 'sticky_floor', ret: { key: '1,1', tx: 3, ty: 4 } });
  settle(12);
  const bar = BC.scenes.bar, before = BC.game.run.tipsy;
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  frame(0.25, 'KeyZ');           // close repeat dialogue -> choice opens
  frame(0.05, 'ArrowDown');      // select "Order ..."
  frame(0.25, 'KeyZ');           // confirm
  t.ok('reorder pours per-bar amount', Math.abs(BC.game.run.tipsy - before - 18) < 0.001);

  // --- dungeon: X opens menu, Z no longer resets ---
  BC.game.newRun();
  BC.setScene('mg_dungeon', { barId: 'cellar_door' });
  settle(12);
  const d = BC.scenes.mg_dungeon;
  d.kegs[0].tx += 1; // make progress
  const kx = d.kegs[0].tx;
  frame(0.25, 'KeyZ');
  t.ok('Z does not reset the room', d.kegs[0].tx === kx);
  frame(0.25, 'KeyX');
  t.ok('X opens a menu', BC.ui.blocking);
  frame(0.05, 'ArrowDown');      // "Reset the room"
  frame(0.25, 'KeyZ');
  t.ok('menu reset works', d.kegs[0].tx === kx - 1);

  // --- tasting: correct answer position varies (was always slot 1) ---
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    BC.scenes.mg_tasting.enter({ barId: 'pour_decisions' });
    seen.add(BC.scenes.mg_tasting.opts.findIndex((o) => o.correct));
  }
  t.ok('tasting options shuffle (' + seen.size + ' positions seen)', seen.size >= 2);

  return t.done();
};
