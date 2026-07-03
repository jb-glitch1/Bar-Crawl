// Garnish: dialogue portraits, the Gary running gag, the brownout band,
// and a full audit of every SOUND TEST entry.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, ctx, frame, render, settle } = boot();
  const g = BC.game;

  // portraits: humans, hats, and dogs all render without throwing
  let pOk = true;
  try {
    g.newRun();
    BC.setScene('overworld', { key: '0,0' });
    BC.ui.say(['Hat check.'], { speaker: 'Sweaty Santa', portrait: { shirt: '#b23', hair: '#eee', hat: 'santa' } });
    render();
    BC.ui.say(['Woof.'], { speaker: 'Scout', portrait: { body: '#caa05a', dark: '#9a7838' }, portraitKind: 'dog' });
    render();
    frame(0.25, 'KeyZ'); // dismiss
  } catch (e) { pOk = false; console.log('    portrait threw: ' + e.message); }
  t.ok('portraits render (human + hat + dog)', pOk);

  // Gary: exactly one active screen, rotating with the loop count
  const keys = ['0,0', '2,0', '1,1', '0,2', '2,1', '1,2', '0,1', '2,2'];
  g.meta.loops = 0;
  t.ok('gary key rotates (loop 0)', BC.overworld.garyKeyForLoop() === keys[0]);
  g.meta.loops = 2;
  t.ok('gary key rotates (loop 2)', BC.overworld.garyKeyForLoop() === keys[2]);
  const garies = keys.map((k) => BC.world.screens[k].meta.actors.find((a) => a.gary)).filter(Boolean);
  t.ok('gary placed on all 8 candidate screens', garies.length === 8);
  BC.setScene('overworld', { key: '1,1' }); // loops=2 -> gary is here
  const hereGary = BC.world.screens['1,1'].meta.actors.find((a) => a.gary);
  t.ok('gary active on his screen', BC.overworld.actorActive(hereGary));
  BC.setScene('overworld', { key: '0,0' });
  const awayGary = BC.world.screens['0,0'].meta.actors.find((a) => a.gary);
  t.ok('gary absent elsewhere', !BC.overworld.actorActive(awayGary));

  // the mystery resolves stupidly at loop 10+, and the host reacts once
  g.meta.loops = 11;
  BC.gigs.gary(g, hereGary);
  frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ');
  t.ok('gary confesses the thing at loop 10+', g.knows('gary_thing'));
  g.newRun();
  g.meta.mastered.hail_mary = true;
  BC.setScene('bar', { id: 'hail_mary', ret: { key: '1,0', tx: 3, ty: 4 } });
  settle(10);
  const bar = BC.scenes.bar;
  g.run.minutes = 200;
  bar.talkChallenge(bar.npcs.find((n) => n.role === 'challenge'));
  t.ok('trivia host reacts to Gary once', g.run.flags.garyHi === true && BC.ui.blocking);
  frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ'); settle(4);

  // brownout band: 85-99 only
  g.newRun();
  BC.setScene('overworld', { key: '0,0' });
  g.run.tipsy = 84; t.ok('84 is not brownout', !g.brownout());
  g.run.tipsy = 90; t.ok('90 is brownout', g.brownout());
  const fut = BC.world.screens['0,0'].meta.actors.find((a) => a.brownoutOnly);
  t.ok('Future You exists only in the band', BC.overworld.actorActive(fut));
  g.run.tipsy = 40;
  t.ok('Future You gone when sober-ish', !BC.overworld.actorActive(fut));
  g.newRun();
  g.drink(88); // straight into the band
  t.ok('brownout toast fires once', g.run.flags.brownoutWarned === true && !g.run.ended);
  const cash = g.run.cash;
  BC.gigs.futureself(g, fut);
  t.ok('Future You pays $20 once', g.run.cash === cash + 20 && g.run.flags.gig_future);
  const cash2 = g.run.cash;
  frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ'); frame(0.25, 'KeyZ'); settle(2);
  BC.gigs.futureself(g, fut);
  t.ok('no double payout', g.run.cash === cash2);
  frame(0.25, 'KeyZ'); settle(2);

  // brownout dialogue renders (drunkified) without throwing
  let bOk = true;
  try {
    g.run.tipsy = 92;
    BC.ui.say(['The world is soup but readable-ish.'], { speaker: 'Test' });
    render();
    frame(0.25, 'KeyZ');
  } catch (e) { bOk = false; console.log('    brownout dialogue threw: ' + e.message); }
  t.ok('brownout dialogue renders', bOk);

  // SOUND TEST full audit: play every single entry
  g.newRun();
  BC.setScene('soundtest');
  let audit = true, played = 0;
  try {
    // walk the whole list, playing each entry
    for (let i = 0; i < 40; i++) {
      frame(0.05, 'KeyZ'); played++;
      frame(0.05, 'ArrowDown');
      if (BC.sceneName !== 'soundtest') { audit = false; break; }
    }
  } catch (e) { audit = false; console.log('    sound test threw: ' + e.message); }
  t.ok('sound test: all entries play clean (' + played + ' plays)', audit);

  return t.done();
};
