// Gameplay layer: difficulty modes, time tools, schedules, pours, cab, mercy systems.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, frame, settle } = boot();
  const g = BC.game;

  // difficulty modes change the night's length + pour weight
  g.meta.mode = 'night'; t.ok('night length classic', g.nightLen() === 540);
  g.meta.mode = 'casual'; t.ok('night length casual', g.nightLen() === 630);
  g.meta.mode = 'lastcall'; t.ok('night length lastcall', g.nightLen() === 450);
  g.newRun(); g.drink(10);
  t.ok('lastcall pours +3', Math.abs(g.run.tipsy - 13) < 0.001);

  // casual: blackout is soft — night continues from home, minus an hour
  g.meta.mode = 'casual'; g.newRun();
  BC.setScene('overworld', { key: '0,0' });
  const m0 = g.run.minutes;
  g.drink(100);
  t.ok('casual blackout does not end the night', !g.run.ended);
  for (let i = 0; i < 60 && BC.sceneName !== 'home'; i++) frame(0.25, 'KeyZ');
  settle(10);
  t.ok('casual blackout walks you home', BC.sceneName === 'home');
  t.ok('casual blackout costs ~an hour + sobers to 30', g.run.minutes >= m0 + 59 && g.run.tipsy === 30);

  // espresso slows the clock 20%
  g.meta.mode = 'night'; g.newRun();
  g.run.espresso = 0; g.paused = false;
  const a = g.run.minutes; g.tick(10); const plain = g.run.minutes - a;
  g.run.espresso = 120;
  const b = g.run.minutes; g.tick(10); const slowed = g.run.minutes - b;
  t.ok('espresso slows time', slowed < plain && Math.abs(slowed / plain - 0.8) < 0.01);

  // schedule gates: trivia waits for 8 PM, burrito for midnight, speakeasy for 10
  g.newRun();
  g.meta.mastered.hail_mary = true; // "The usual?" = one dialogue page, deterministic
  BC.setScene('bar', { id: 'hail_mary', ret: { key: '1,0', tx: 3, ty: 4 } });
  settle(10);
  const bar = BC.scenes.bar;
  g.run.minutes = 60; // 6 PM
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  frame(0.25, 'KeyZ'); // dismiss hours message
  t.ok('trivia gated before 8 PM (no order choice)', !BC.ui.blocking);
  g.run.minutes = 200; // 8:20 PM
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  frame(0.25, 'KeyZ');
  t.ok('trivia open after 8 PM (choice appears)', BC.ui.blocking);
  frame(0.05, 'ArrowDown'); frame(0.05, 'ArrowDown'); frame(0.05, 'ArrowDown');
  frame(0.25, 'KeyZ'); // "Maybe later"
  settle(4);

  // pours: strong = amount+5 (lager 14 -> 19)
  const tip0 = g.run.tipsy;
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  frame(0.25, 'KeyZ');            // greet -> pour choice
  frame(0.05, 'ArrowDown'); frame(0.05, 'ArrowDown'); // select STRONG
  frame(0.25, 'KeyZ');
  t.ok('STRONG pour = amount+5', Math.abs(g.run.tipsy - tip0 - 19) < 0.001);
  settle(10);

  // happy hour at the Newt: regular pour is 14-4=10 before 7 PM
  g.newRun();
  g.meta.mastered.tipsy_newt = true;
  BC.setScene('bar', { id: 'tipsy_newt', ret: { key: '0,0', tx: 3, ty: 4 } });
  settle(10);
  g.run.minutes = 30;
  const tip1 = g.run.tipsy;
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  frame(0.25, 'KeyZ'); frame(0.05, 'ArrowDown'); frame(0.25, 'KeyZ'); // Regular
  t.ok('happy hour discounts the pour', Math.abs(g.run.tipsy - tip1 - 10) < 0.001);
  settle(10);

  // nap: +60 minutes, a little sober
  g.newRun();
  BC.setScene('home', { skipIntro: true });
  const home = BC.scenes.home;
  home.player.x = 2 * 16 + 8; home.player.y = 4 * 16 + 8; home.player.dir = 'up';
  const mNap = g.run.minutes;
  frame(0.25, 'KeyZ');           // A at the bed -> choice
  t.ok('bed offers a nap', BC.ui.blocking);
  frame(0.25, 'KeyZ');           // sleep
  t.ok('nap advances an hour', g.run.minutes >= mNap + 59);

  // cab: $8, only to visited districts
  g.newRun();
  BC.setScene('overworld', { key: '1,0' }); // visits 1,0
  BC.setScene('overworld', { key: '0,0' }); // visits 0,0
  BC.setScene('overworld', { key: '1,0' });
  const cash0 = g.run.cash;
  BC.world.screens['1,0'].meta.interactions['2,6'](g);
  t.ok('cab opens destination choice', BC.ui.blocking);
  frame(0.25, 'KeyZ');           // first destination (Maple Street)
  for (let i = 0; i < 30 && BC.sceneName !== 'overworld'; i++) frame();
  settle(10);
  t.ok('cab charges $8', g.run.cash === cash0 - 8);
  t.ok('cab teleports to the district', BC.world.here === '0,0');

  // PB payout: replay high score pays $5
  g.newRun();
  g.run.stamps.sticky_floor = true;
  g.meta.highscores.sticky_floor = 10;
  const cash1 = g.run.cash;
  BC.afterMinigame('sticky_floor', false, 50);
  t.ok('new PB pays $5', g.run.cash === cash1 + 5 && g.meta.highscores.sticky_floor === 50);
  settle(10);

  // GOOD PERSON: pet all six animals
  g.newRun();
  BC.setScene('overworld', { key: '0,1' });
  ['Biscuit', 'Rex', 'Daisy', 'Scout', 'Echo', 'Alley Cat'].forEach((n) => BC.overworld.markPet(n));
  t.ok('pet-all sets GOOD PERSON', g.run.flags.goodPerson === true);

  return t.done();
};
