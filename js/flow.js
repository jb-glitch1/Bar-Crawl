// End-of-night orchestration: the graceful 2 AM ride home vs. the ungraceful blackout,
// then the Majora's-Mask loop (or the win).
(function () {
  const BC = window.BC || (window.BC = {});
  const U = BC.util;

  const WAKE = [
    'You come to on a park bench, wearing one extra scarf and no memory of it.',
    'You wake up on a stranger\'s lawn. A sprinkler is judging you.',
    'You regain consciousness at the bus shelter. The bus left hours ago.',
    'You blink awake in a kiddie pool two blocks from anywhere.'
  ];
  // repeat offenders unlock premium wake-ups
  function wakeLine(g) {
    const pool = WAKE.slice();
    if (g.meta.blackouts >= 2) pool.push('You wake up holding a trophy. It reads: WORLD\'S OKAYEST.');
    if (g.meta.blackouts >= 3) pool.push('You come to. Scout is guarding you. Good girl, Scout.');
    if (g.meta.blackouts >= 4) pool.push('You wake up tucked under newspaper. The raccoon wants no thanks.');
    return U.choice(pool);
  }
  const LOOP = [
    'Morning. 5:00 PM again, somehow. The night resets — but you remember.',
    'You wake at home. The clock says 5:00 PM. You know things now.',
    'Back to 5:00 PM. Same town, same bars. Sharper you.'
  ];

  function droppable(g) {
    return g.itemList().filter(id => id !== 'map'); // map is knowledge-ish; keep it
  }

  // somewhere in town = a real, walkable tile (never inside a building/water/door)
  function dropSpot() {
    const keys = Object.keys(BC.world.screens);
    for (let i = 0; i < 80; i++) {
      const key = U.choice(keys);
      const scr = BC.world.screens[key];
      const tx = U.randint(1, scr.w - 2), ty = U.randint(2, scr.h - 2);
      const t = scr.tiles[ty * scr.w + tx];
      if (!BC.world.SOLID.has(t) && t !== BC.world.T.DOOR) return { key, tx, ty };
    }
    return { key: BC.world.startKey, tx: 7, ty: 10 }; // center path: always walkable
  }

  function dropSomething(g) {
    const opts = droppable(g);
    if (!opts.length) return;
    const item = U.choice(opts);
    g.takeItem(item);
    const spot = dropSpot();
    g.meta.dropped = { item, key: spot.key, tx: spot.tx, ty: spot.ty };
    g.save();
    BC.ui.toast('You dropped your ' + g.itemName(item) + ' somewhere in ' + BC.world.screens[spot.key].name + '...');
  }

  BC.flow = {
    // casual mode: a blackout costs an hour, not the night
    softBlackout(g) {
      BC.ui.cutscene([
        { fadeOut: 1, dur: 0.6, color: '#000' },
        { text: ['Everything goes sideways... briefly.', 'A kind stranger walks you home. You lose an hour. Casual mode is merciful.'] },
        { do: () => { g.run.tipsy = 30; g.run.minutes = Math.min(g.nightLen() - 1, g.run.minutes + 60); BC.setScene('home', { skipIntro: true }); } },
        { fadeIn: 0, dur: 0.6 }
      ]);
    },

    endNight(reason, won) {
      const g = BC.game;
      if (reason === 'blackout' && BC.fx) BC.fx.shake(4, 0.7);
      const steps = [];
      steps.push({ fadeOut: 1, dur: 0.8, color: '#000' });

      if (reason === 'complete') {
        steps.push({ text: ['The final stamp lands on the card.', 'You did it — with time to spare. The night, for once, is yours.'] });
      } else if (reason === 'lastcall') {
        steps.push({ text: ['2:00 AM. The lights come up, merciless and fluorescent.', '"Last call was last call." A bouncer folds you into a waiting car.'] });
      } else if (reason === 'blackout') {
        steps.push({ text: ['Everything goes... sideways.', 'You black out.'] });
        steps.push({ do: () => dropSomething(g) });
        steps.push({ text: [wakeLine(g)] });
      }

      if (won) {
        steps.push({ do: () => { g.meta.wins++; g.save(); } });
        steps.push({ text: ['The last stamp lands. The whole card — punched.', '...and then 2 AM comes. And keeps going.', 'For the first time, the night does not reset.'] });
        steps.push({ do: () => BC.setScene('win') });
        steps.push({ fadeIn: 0, dur: 0.8 });
      } else {
        steps.push({ text: [U.choice(LOOP)] });
        steps.push({ do: () => { g.newRun(); BC.setScene('home', { skipIntro: false }); } });
        steps.push({ fadeIn: 0, dur: 0.9 });
      }
      BC.ui.cutscene(steps);
    }
  };
})();
