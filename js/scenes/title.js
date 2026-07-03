// Title screen + a tongue-in-cheek age gate.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});
  BC.firstScene = 'title';

  let t = 0, phase = 'title', stars = null;

  function makeStars() {
    const a = [];
    for (let i = 0; i < 40; i++) a.push({ x: (Math.random() * 256) | 0, y: (Math.random() * 120) | 0, b: Math.random() });
    return a;
  }

  function startNight() {
    BC.ui.cutscene([
      { fadeOut: 1, dur: 0.5, color: '#000' },
      { text: ["It's 5:00 PM. The whole crawl is ahead of you.", 'Hit every bar, earn every stamp. The bars close at 2:00 AM.', "Miss last call and you're sent home... to do it all again."] },
      { do: () => BC.setScene('home', {}) },
      { fadeIn: 0, dur: 0.7 }
    ]);
  }

  function askAge() {
    BC.audio && BC.audio.ensure();
    const loops = (BC.game && BC.game.meta) ? BC.game.meta.loops : 0;
    const prompt = loops < 2 ? 'Real quick — are you 21 or older?'
      : 'Are you 21 or older? (You said yes yesterday. And yesterday. And—)';
    const opts = loops < 2 ? ['Yes', 'Obviously', '...also yes (legally distinct)']
      : ['Yes', 'Still yes', 'You literally asked me yesterday'];
    BC.ui.choose(prompt, opts, { cancelable: false }, () => askMode());
  }

  function askMode() {
    const g = BC.game, cur = g.meta.mode || 'night';
    const tag = (m) => (cur === m ? '  <' : '');
    BC.ui.choose('How big a night are we talking?', [
      'Casual stroll (long night, soft blackouts)' + tag('casual'),
      'A night out (the classic)' + tag('night'),
      'LAST CALL (short night, heavy pours)' + tag('lastcall')
    ], { cancelable: false }, (i) => {
      g.meta.mode = ['casual', 'night', 'lastcall'][i];
      g.save();
      startNight();
    });
  }

  S.title = {
    enter() { t = 0; phase = 'title'; stars = makeStars(); if (BC.audio) BC.audio.setMood('late'); },
    update(dt) {
      t += dt;
      if (phase === 'title' && t > 0.4 && (BC.input.pressed('a') || BC.input.pressed('start'))) {
        phase = 'gate'; askAge();
      }
    },
    render(ctx) {
      // night sky
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0a0a18');
      BC.rect(ctx, 0, 120, BC.W, 120, '#10101f');
      for (const s of stars) {
        const b = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + s.x));
        BC.rect(ctx, s.x, s.y, 1, 1, 'rgba(255,255,255,' + (s.b * b).toFixed(2) + ')');
      }
      // moon
      ctx.fillStyle = '#e8e6c8'; ctx.beginPath(); ctx.arc(212, 36, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a18'; ctx.beginPath(); ctx.arc(206, 32, 12, 0, Math.PI * 2); ctx.fill();

      // skyline silhouette
      for (let i = 0; i < 16; i++) {
        const h = 18 + ((i * 53) % 40);
        BC.rect(ctx, i * 16, 120 - h, 16, h, '#181826');
        if ((i % 2) === 0) BC.rect(ctx, i * 16 + 4, 120 - h + 4, 3, 3, '#caa15a');
      }

      // logo (subtitle admits the loop as the loops pile up)
      BC.text(ctx, 'BAR-CRAWL', BC.W / 2, 138, { color: '#ffe27a', size: 28, align: 'center' });
      const loops = (BC.game && BC.game.meta) ? BC.game.meta.loops : 0;
      const sub = loops <= 1 ? 'a night that never ends'
        : loops < 8 ? 'a night that STILL never ends'
        : 'night #' + (loops + 1) + '. hydrate.';
      BC.text(ctx, sub, BC.W / 2, 168, { color: '#9aa', size: 9, align: 'center' });
      const meta = BC.game && BC.game.meta;
      if (meta && meta.bestStamps > 0) {
        BC.text(ctx, 'best night: ' + meta.bestStamps + '/12 stamps   -   wins: ' + meta.wins, BC.W / 2, 181, { color: '#6a7', size: 8, align: 'center' });
      }

      // little wandering player
      const px = 30 + ((t * 24) % (BC.W - 60));
      BC.gfx.actor(ctx, px, 196, 'right', (t * 6) & 1, { shirt: '#c0444f', hair: '#2f2218' });

      if (phase === 'title' && (t % 1.0) < 0.6) {
        BC.text(ctx, 'Press Z to start', BC.W / 2, 214, { color: '#fff', size: 10, align: 'center' });
      }
      BC.text(ctx, 'Arrows move  -  Z confirm  -  X bike/cancel  -  M status', BC.W / 2, 232, { color: '#667', size: 7, align: 'center' });
    }
  };
})();
