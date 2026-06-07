// Juice: a tiny particle system + screen shake. Particles live in screen space
// and just look nice; shake offsets the whole scene briefly.
(function () {
  const BC = window.BC || (window.BC = {});
  let parts = [], shakeMag = 0, shakeT = 0;
  function add(p) { parts.push(p); if (parts.length > 220) parts.shift(); }
  const px = (x) => x == null ? (BC.player ? BC.player.x : BC.W / 2) : x;
  const py = (y) => y == null ? (BC.player ? BC.player.y - 8 : 80) : y;

  const fx = {
    shake(mag, dur) { shakeMag = Math.max(shakeMag, mag); shakeT = Math.max(shakeT, dur || 0.3); },
    offset() { if (shakeT <= 0) return null; const m = shakeMag * Math.min(1, shakeT * 3); return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m }; },

    coins(x, y, n) { x = px(x); y = py(y); n = n || 6; for (let i = 0; i < n; i++) add({ type: 'coin', x, y, vx: (Math.random() * 2 - 1) * 42, vy: -45 - Math.random() * 55, g: 150, life: .8 + Math.random() * .3, t: 0, c: '#ffd24a' }); },
    stars(x, y, n) { x = px(x); y = py(y); n = n || 12; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 18 + Math.random() * 55; add({ type: 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0, life: .5 + Math.random() * .4, t: 0, c: ['#ffe27a', '#fff', '#ffd24a'][i % 3] }); } },
    hearts(x, y, n) { x = px(x); y = py(y); n = n || 4; for (let i = 0; i < n; i++) add({ type: 'heart', x: x + (Math.random() * 8 - 4), y, vx: (Math.random() * 2 - 1) * 10, vy: -22 - Math.random() * 14, g: -8, life: .9 + Math.random() * .3, t: 0, c: '#ff6b9a' }); },
    bubbles(x, y, n) { x = px(x); y = py(y); n = n || 7; for (let i = 0; i < n; i++) add({ type: 'bubble', x: x + (Math.random() * 8 - 4), y, vx: (Math.random() * 2 - 1) * 8, vy: -16 - Math.random() * 14, g: -5, life: .7 + Math.random() * .4, t: 0, c: '#cfe8ff' }); },
    confetti(n) { n = n || 90; for (let i = 0; i < n; i++) add({ type: 'confetti', x: Math.random() * BC.W, y: -Math.random() * 40, vx: (Math.random() * 2 - 1) * 22, vy: 28 + Math.random() * 44, g: 36, life: 2.6 + Math.random() * 1.6, t: 0, c: ['#ff5a5a', '#5ad0ff', '#ffe27a', '#7ed07e', '#d09aff'][(Math.random() * 5) | 0] }); },

    update(dt) {
      if (shakeT > 0) shakeT -= dt;
      for (const p of parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      parts = parts.filter(p => p.t < p.life);
    },
    render(ctx) {
      for (const p of parts) {
        const a = Math.max(0, 1 - p.t / p.life);
        ctx.globalAlpha = a;
        if (p.type === 'coin') { ctx.fillStyle = p.c; ctx.fillRect(p.x - 1, p.y - 2, 3, 4); ctx.fillStyle = '#fff7c0'; ctx.fillRect(p.x, p.y - 1, 1, 2); }
        else if (p.type === 'star') { const s = 2 + (1 - a) * 3; ctx.fillStyle = p.c; ctx.fillRect(p.x - s / 2, p.y - 0.5, s, 1); ctx.fillRect(p.x - 0.5, p.y - s / 2, 1, s); }
        else if (p.type === 'heart') { ctx.fillStyle = p.c; ctx.fillRect(p.x - 1, p.y - 1, 3, 2); ctx.fillRect(p.x, p.y + 1, 1, 1); }
        else if (p.type === 'bubble') { ctx.fillStyle = p.c; ctx.globalAlpha = a * 0.6; ctx.fillRect(p.x, p.y, 2, 2); }
        else if (p.type === 'confetti') { ctx.fillStyle = p.c; ctx.fillRect(p.x - 1, p.y - 1, 3, 2); }
      }
      ctx.globalAlpha = 1;
    },
    clear() { parts = []; shakeT = 0; }
  };
  BC.fx = fx;
})();
