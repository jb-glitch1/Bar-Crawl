// The payoff: clear the whole card and, for the first time, 2 AM doesn't reset —
// the loop lets go and the sun comes up. A warm little sunrise scene.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});
  let t = 0;

  function mix(a, b, k) {
    return 'rgb(' + ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0) + ')';
  }
  const NIGHT_TOP = [14, 14, 38], NIGHT_HOR = [44, 32, 74];
  const DAWN_TOP = [86, 134, 202], DAWN_HOR = [255, 190, 120];
  function skyBand(yb, horizon, k) {
    const f = yb / horizon;
    const top = [NIGHT_TOP[0] + (DAWN_TOP[0] - NIGHT_TOP[0]) * k, NIGHT_TOP[1] + (DAWN_TOP[1] - NIGHT_TOP[1]) * k, NIGHT_TOP[2] + (DAWN_TOP[2] - NIGHT_TOP[2]) * k];
    const hor = [NIGHT_HOR[0] + (DAWN_HOR[0] - NIGHT_HOR[0]) * k, NIGHT_HOR[1] + (DAWN_HOR[1] - NIGHT_HOR[1]) * k, NIGHT_HOR[2] + (DAWN_HOR[2] - NIGHT_HOR[2]) * k];
    return mix(top, hor, f);
  }

  S.win = {
    enter() { t = 0; this._cf = 0; if (BC.audio) BC.audio.setMood('early'); if (BC.fx) BC.fx.confetti(); },
    update(dt) {
      t += dt;
      this._cf -= dt;
      if (this._cf <= 0 && BC.fx) { BC.fx.confetti(26); this._cf = 1.5; }
      if (t > 1.6 && (BC.input.pressed('a') || BC.input.pressed('start'))) {
        BC.game.newRun();
        BC.setScene('home', {});
      }
    },
    render(ctx) {
      const g = BC.game, W = BC.W, H = BC.H;
      const k = Math.min(1, t / 3.5);          // dawn progress
      const horizon = 150;
      for (let yb = 0; yb < horizon; yb += 3) BC.rect(ctx, 0, yb, W, 3, skyBand(yb, horizon, k));
      // rising sun
      const sunY = horizon - 6 - k * 64, sunX = W / 2;
      ctx.fillStyle = mix([255, 170, 90], [255, 246, 210], k);
      ctx.beginPath(); ctx.arc(sunX, sunY, 16, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.25 * k; ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      // skyline silhouette + ground
      const sil = mix([20, 18, 36], [60, 46, 70], k);
      for (let i = 0; i < 16; i++) { const bh = 16 + ((i * 53) % 34); BC.rect(ctx, i * 16, horizon - bh, 16, bh, sil); }
      BC.rect(ctx, 0, horizon, W, H - horizon, mix([22, 20, 34], [70, 90, 70], k));
      // the player, watching it, facing the sun — Scout watches too
      BC.gfx.actor(ctx, sunX - 8, horizon - 16, 'up', 0, { shirt: '#c0444f', hair: '#2f2218' });
      BC.gfx.dog(ctx, sunX - 30, horizon - 16, 'right', 0, { body: '#caa05a', dark: '#9a7838' });
      if (g.run && g.run.flags && g.run.flags.goodPerson) {
        BC.text(ctx, '* CERTIFIED GOOD PERSON *', W / 2, horizon + 6, { color: '#ffd1e0', size: 8, align: 'center' });
      }

      // words
      BC.rect(ctx, 0, horizon + 18, W, 68, 'rgba(8,8,18,0.55)');
      BC.text(ctx, 'THE LOOP LETS GO', W / 2, horizon + 22, { color: '#ffe27a', size: 13, align: 'center' });
      BC.text(ctx, '2 AM came... and the night just kept going.', W / 2, horizon + 38, { color: '#fff', size: 8, align: 'center' });
      BC.text(ctx, "Sun's up. You're not new here anymore - you're a regular.", W / 2, horizon + 50, { color: '#cfe', size: 8, align: 'center' });
      BC.text(ctx, 'Somewhere behind you, a raccoon salutes.', W / 2, horizon + 62, { color: '#cfe', size: 8, align: 'center' });
      const bottom = (t <= 1.6 || (t % 2.4) < 1.2)
        ? 'Cleared in ' + g.meta.loops + ' night' + (g.meta.loops === 1 ? '' : 's') + '   -   Wins: ' + g.meta.wins
        : 'Press Z for another go';
      BC.text(ctx, bottom, W / 2, horizon + 74, { color: '#9ab', size: 8, align: 'center' });
    }
  };
})();
