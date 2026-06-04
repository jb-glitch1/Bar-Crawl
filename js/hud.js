// Always-on HUD: a countdown clock and a tipsiness meter. Drawn above the
// day/night tint so it stays readable. Hidden in menus/minigames/title.
(function () {
  const BC = window.BC || (window.BC = {});

  const TIERS = ['SOBER', 'TIPSY', 'DRUNK', 'HAMMERED'];
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

  function clock(ctx, g) {
    const x = 4, y = 4, w = 96, h = 27;
    BC.panel(ctx, x, y, w, h);
    // clock face + sweeping hand (5 PM -> 2 AM around the dial)
    const cx = x + 14, cy = y + 13, r = 8;
    ctx.fillStyle = '#12121c'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cfd2dd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const frac = g.run.minutes / g.config.nightMinutes;
    const a = -Math.PI / 2 + frac * Math.PI * 2;
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
    // time + countdown bar
    BC.text(ctx, g.timeString(), x + 27, y + 4, { size: 9, color: '#dfe7ff' });
    const left = 1 - frac;
    const bx = x + 27, by = y + 17, bw = w - 33, bh = 5;
    BC.rect(ctx, bx, by, bw, bh, '#222');
    const c = left > 0.4 ? '#7ed07e' : left > 0.18 ? '#ffd166' : '#ff6b6b';
    BC.rect(ctx, bx + 1, by + 1, Math.max(0, (bw - 2) * left), bh - 2, c);
    ctx.strokeStyle = '#556'; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  }

  function tipsy(ctx, g) {
    const w = 82, h = 27, x = BC.W - w - 4, y = 4;
    BC.panel(ctx, x, y, w, h);
    const tier = g.tipsyTier();
    BC.text(ctx, TIERS[tier], x + 7, y + 4, { size: 9, color: COLS[tier] });
    const bx = x + 7, by = y + 17, bw = w - 14, bh = 6;
    BC.rect(ctx, bx, by, bw, bh, '#222');
    BC.rect(ctx, bx + 1, by + 1, Math.max(0, (bw - 2) * g.run.tipsy / 100), bh - 2, COLS[tier]);
    ctx.strokeStyle = '#556'; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  }
})();
