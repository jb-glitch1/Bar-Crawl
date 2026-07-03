// Core smoke: boot, world integrity, the title->home->overworld path,
// every scene renders, and the full win path reaches the sunrise.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, ctx, frame, render, settle } = boot();

  t.ok('boot: game/world/ui/scenes exist', BC.game && BC.world && BC.ui && BC.scenes && BC.scene);
  t.ok('boot: starts on title', BC.sceneName === 'title');
  t.ok('world: 9 screens', Object.keys(BC.world.screens).length === 9);

  // every screen's tile buffer is complete
  let worldOk = true;
  for (const k of Object.keys(BC.world.screens)) {
    const s = BC.world.screens[k];
    if (!s.tiles || s.tiles.length !== s.w * s.h) worldOk = false;
  }
  t.ok('world: screens parse', worldOk);

  // title -> age gate -> home (pump Z through the choice + cutscene text)
  for (let i = 0; i < 60 && BC.sceneName !== 'home'; i++) frame(0.25, 'KeyZ');
  t.ok('title flow reaches home', BC.sceneName === 'home');

  // dismiss the first-night intro, then walk out the door
  for (let i = 0; i < 20 && BC.ui.blocking; i++) frame(0.25, 'KeyZ');
  const home = BC.scenes.home;
  const ed = home.screen.exitDoor;
  home.player.x = ed.tx * 16 + 8; home.player.y = ed.ty * 16 + 8;
  for (let i = 0; i < 60 && BC.sceneName !== 'overworld'; i++) frame(0.25, 'KeyZ');
  t.ok('walking out the door reaches overworld', BC.sceneName === 'overworld');

  // every scene renders without throwing
  const scenes = Object.keys(BC.scenes);
  let renderOk = true;
  for (const name of scenes) {
    try {
      if (name.indexOf('mg_') === 0) BC.setScene(name, { barId: 'sticky_floor' });
      else if (name === 'bar') BC.setScene('bar', { id: 'tipsy_newt', ret: { key: '0,0', tx: 3, ty: 4 } });
      else BC.setScene(name, { key: '1,1' });
      for (let i = 0; i < 3; i++) { frame(1 / 60); render(); }
    } catch (e) { renderOk = false; console.log('    render threw in ' + name + ': ' + e.message); }
  }
  t.ok('all ' + scenes.length + ' scenes update+render clean', renderOk);

  // full-card win path -> sunrise scene, wins recorded
  BC.game.newRun();
  BC.setScene('overworld', { key: BC.world.startKey });
  BC.game.activeCard().forEach((id) => { BC.game.run.stamps[id] = true; });
  BC.game.tick(1 / 60);
  for (let i = 0; i < 200 && BC.sceneName !== 'win'; i++) frame(0.25, 'KeyZ');
  t.ok('win path reaches the sunrise scene', BC.sceneName === 'win');
  t.ok('win recorded in meta', BC.game.meta.wins >= 1);
  settle(12); // let the win cutscene's fade tail release input

  // trivia replay regression (PR #2)
  BC.game.newRun();
  BC.setScene('mg_trivia', { barId: 'hail_mary' });
  const tv = BC.scenes.mg_trivia;
  for (let q = 0; q < 5; q++) { frame(0.25, 'KeyZ'); for (let i = 0; i < 6; i++) frame(); }
  t.ok('trivia completes', tv.phase === 'done');
  tv.enter({ barId: 'hail_mary' });
  t.ok('trivia replay starts fresh', tv.phase === null && tv.pass === false);

  return t.done();
};
