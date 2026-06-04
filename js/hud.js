// Compact always-on HUD: a small countdown clock and a tipsiness meter, tucked
// into the top corners so they don't cover the world. Hidden in menus/title.
(function () {
  const BC = window.BC || (window.BC = {});

  const TIERS = ['SOBER', 'TIPSY', 'DRUNK', 'WASTED'];
  const COLS = ['#7ed07e', '#ffd166', '#ff9a4a', '#ff6b6b'];

  BC.hud = {
    draw(ctx) {
      const s = BC.sceneName;
      if (s !== 'overworld' && s !== 'bar' && s !== 'home') return;
      const g = BC.game; if (!g || !g.run) return;
      clock(ctx, g);
      tipsy(ctx, g);
    }
  };

  function pill(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(10,10,18,0.78)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(180,180,210,0.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  function clock(ctx, g) {
    const x = 3, y = 3, w = 64, h = 15;
    pill(ctx, x, y, w, h);
    const cx = x + 9, cy = y + 8, r = 5;
    ctx.fillStyle = '#12121c'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cfd2dd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const frac = g.run.minutes / g.config.nightMinutes, a = -Math.PI / 2 + frac * Math.PI * 2;
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2)); ctx.stroke();
    BC.text(ctx, g.timeString(), x + 18, y + 2, { size: 8, color: '#dfe7ff' });
    const left = 1 - frac, bx = x + 18, by = y + 11, bw = w - 22;
    BC.rect(ctx, bx, by, bw, 2, '#222');
    BC.rect(ctx, bx, by, Math.max(0, bw * left), 2, left > 0.4 ? '#7ed07e' : left > 0.18 ? '#ffd166' : '#ff6b6b');
  }

  function tipsy(ctx, g) {
    const w = 56, h = 15, x = BC.W - w - 3, y = 3;
    pill(ctx, x, y, w, h);
    const tier = g.tipsyTier();
    BC.text(ctx, TIERS[tier], x + 5, y + 2, { size: 7, color: COLS[tier] });
    const bx = x + 5, by = y + 10, bw = w - 10;
    BC.rect(ctx, bx, by, bw, 3, '#222');
    BC.rect(ctx, bx, by, Math.max(0, bw * g.run.tipsy / 100), 3, COLS[tier]);
  }
})();
