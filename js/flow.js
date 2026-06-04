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
  const LOOP = [
    'Morning. 5:00 PM again, somehow. The night resets — but you remember.',
    'You wake at home. The clock says 5:00 PM. You know things now.',
    'Back to 5:00 PM. Same town, same bars. Sharper you.'
  ];

  function droppable(g) {
    return g.itemList().filter(id => id !== 'map'); // map is knowledge-ish; keep it
  }

  function dropSomething(g) {
    const opts = droppable(g);
    if (!opts.length) return;
    const item = U.choice(opts);
    g.takeItem(item);
    // stash it on a random known screen
    const keys = Object.keys(BC.world.screens);
    const key = keys.length ? U.choice(keys) : BC.world.startKey;
    g.meta.dropped = { item, key, tx: U.randint(2, 13), ty: U.randint(4, 12) };
    g.save();
    BC.ui.toast('You dropped your ' + item + ' somewhere out there...');
  }

  BC.flow = {
    endNight(reason, won) {
      const g = BC.game;
      const steps = [];
      steps.push({ fadeOut: 1, dur: 0.8, color: '#000' });

      if (reason === 'lastcall') {
        steps.push({ text: ['2:00 AM. The lights come up, merciless and fluorescent.', '"Last call was last call." A bouncer folds you into a waiting car.'] });
      } else if (reason === 'blackout') {
        steps.push({ text: ['Everything goes... sideways.', 'You black out.'] });
        steps.push({ do: () => dropSomething(g) });
        steps.push({ text: [U.choice(WAKE)] });
      }

      if (won) {
        steps.push({ do: () => { g.meta.wins++; g.save(); } });
        steps.push({ text: ['You did it. The whole card — punched — before close.', 'Somewhere a bartender you\'ll never meet is quietly proud.'] });
        steps.push({ do: () => BC.setScene('win') });
        steps.push({ fadeIn: 0, dur: 0.8 });
      } else {
        steps.push({ text: [U.choice(LOOP)] });
        steps.push({ do: () => { g.newRun(); BC.setScene('overworld', { key: BC.world.startKey }); } });
        steps.push({ fadeIn: 0, dur: 0.9 });
      }
      BC.ui.cutscene(steps);
    }
  };
})();
