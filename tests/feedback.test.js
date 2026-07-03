// Playtest feedback fixes: home re-entry works, benches skip time.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, frame, settle } = boot();
  const g = BC.game;

  // home door on Maple Street actually lets you back in (was a toast-only dead end)
  g.newRun();
  BC.setScene('overworld', { key: '0,0' });
  const homeDoor = BC.world.screens['0,0'].meta.interactions['12,4'];
  t.ok('home door has an interaction', typeof homeDoor === 'function');
  g.run.minutes = 200; // mid-night re-entry
  homeDoor(g);
  for (let i = 0; i < 30 && BC.sceneName !== 'home'; i++) frame();
  settle(6);
  t.ok('walking into home re-enters the apartment', BC.sceneName === 'home');

  // and the bed still works from there (nap +60)
  const home = BC.scenes.home;
  home.player.x = 2 * 16 + 8; home.player.y = 4 * 16 + 8; home.player.dir = 'up';
  const m0 = g.run.minutes;
  frame(0.25, 'KeyZ');
  t.ok('bed offers the nap on re-entry', BC.ui.blocking);
  frame(0.25, 'KeyZ');
  t.ok('nap works mid-night', g.run.minutes >= m0 + 59);

  // walking out the door returns to town
  const ed = home.screen.exitDoor;
  home.player.x = ed.tx * 16 + 8; home.player.y = ed.ty * 16 + 8;
  for (let i = 0; i < 40 && BC.sceneName !== 'overworld'; i++) frame(0.25, 'KeyZ');
  t.ok('door leads back to town', BC.sceneName === 'overworld');
  settle(6);

  // benches: every district that has one skips +30 on sit
  g.newRun();
  BC.setScene('overworld', { key: '1,0' });
  const bench = BC.world.screens['1,0'].meta.interactions['12,10'];
  t.ok('Downtown bench is sittable', typeof bench === 'function');
  const m1 = g.run.minutes;
  bench(g);
  frame(0.25, 'KeyZ'); // confirm "Watch the town"
  t.ok('bench sit skips 30 minutes', g.run.minutes >= m1 + 29.9);
  const nearCap = g.nightLen() - 10;
  g.run.minutes = nearCap;
  bench(g);
  frame(0.25, 'KeyZ');
  t.ok('bench sit caps before last call', g.run.minutes === g.nightLen() - 1 && !g.run.ended);

  // bench count: at least one in 8 districts
  let benches = 0;
  for (const k of Object.keys(BC.world.screens)) {
    benches += BC.world.screens[k].meta.props.filter((p) => p.type === 'bench').length;
  }
  t.ok('benches placed around town (' + benches + ')', benches >= 8);

  return t.done();
};
