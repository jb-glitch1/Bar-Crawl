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
      { do: () => BC.setScene('overworld', { key: BC.world.startKey }) },
      { fadeIn: 0, dur: 0.7 }
    ]);
  }

  function askAge() {
    BC.audio && BC.audio.ensure();
    BC.ui.choose('Real quick — are you 21 or older?',
      ['Yes', 'Obviously', '...also yes (legally distinct)'],
      { cancelable: false }, () => startNight());
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

      // logo
      BC.text(ctx, 'BAR-CRAWL', BC.W / 2, 138, { color: '#ffe27a', size: 28, align: 'center' });
      BC.text(ctx, 'a night that never ends', BC.W / 2, 168, { color: '#9aa', size: 9, align: 'center' });

      // little wandering player
      const px = 30 + ((t * 24) % (BC.W - 60));
      BC.gfx.actor(ctx, px, 196, 'right', (t * 6) & 1, { shirt: '#c0444f', hair: '#2f2218' });

      if (phase === 'title' && (t % 1.0) < 0.6) {
        BC.text(ctx, 'Press Z to start', BC.W / 2, 214, { color: '#fff', size: 10, align: 'center' });
      }
      BC.text(ctx, 'Arrows move  -  Z confirm  -  X bike/cancel  -  Enter status', BC.W / 2, 232, { color: '#667', size: 7, align: 'center' });
    }
  };
})();
