// Off-Key West: a falling-notes rhythm game. The drunker you are, the more they wobble.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const KEYS = ['left', 'up', 'down', 'right'];
  const GLYPH = ['◀', '▲', '▼', '▶'];
  const LANEX = [64, 112, 160, 208];
  const HITY = 188;
  const SPEED = 74;

  S.mg_rhythm = {
    enter(args) {
      this.barId = args.barId; this.done = false;
      this.t = 0; this.notes = []; this.spawnIdx = 0; this.hits = 0; this.misses = 0;
      this.schedule = [];
      let tt = 1.0;
      for (let i = 0; i < 18; i++) { this.schedule.push({ t: tt, lane: (Math.random() * 4) | 0 }); tt += (0.55 + Math.random() * 0.25); }
      this.total = this.schedule.length;
      this.phase = 'play'; this.flash = [0, 0, 0, 0];
    },
    update(dt) {
      if (this.done) return;
      if (BC.input.pressed('b')) return this.finish(false);
      if (this.phase === 'done') { if (BC.input.pressed('a')) this.finish(this.pass); return; }

      this.t += dt;
      while (this.spawnIdx < this.schedule.length && this.t >= this.schedule[this.spawnIdx].t) {
        this.notes.push({ lane: this.schedule[this.spawnIdx].lane, y: -10, alive: true });
        this.spawnIdx++;
      }
      const win = Math.max(12, 18 - BC.game.tipsyTier() * 2);
      for (const n of this.notes) {
        if (!n.alive) continue;
        n.y += SPEED * dt;
        if (n.y > HITY + win + 6) { n.alive = false; this.misses++; BC.audio && BC.audio.sfx('cancel'); }
      }
      for (let l = 0; l < 4; l++) {
        if (this.flash[l] > 0) this.flash[l] -= dt;
        if (BC.input.pressed(KEYS[l])) {
          this.flash[l] = 0.12;
          let best = null, bd = 1e9;
          for (const n of this.notes) { if (n.alive && n.lane === l) { const d = Math.abs(n.y - HITY); if (d < bd) { bd = d; best = n; } } }
          if (best && bd <= win) { best.alive = false; this.hits++; BC.audio && BC.audio.sfx('confirm'); }
        }
      }
      if (this.spawnIdx >= this.schedule.length && !this.notes.some(n => n.alive)) {
        this.phase = 'done'; this.pass = (this.hits / this.total) >= 0.6;
      }
    },
    finish(ok) { if (this.done) return; this.done = true; BC.afterMinigame(this.barId, ok); },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0e1420');
      BC.text(ctx, 'OFF-KEY WEST', BC.W / 2, 10, { color: '#ffe27a', size: 11, align: 'center' });
      // lanes + hit line
      for (let l = 0; l < 4; l++) {
        BC.rect(ctx, LANEX[l] - 16, 24, 32, HITY + 8, 'rgba(255,255,255,0.03)');
        const fl = this.flash[l] > 0;
        BC.panel(ctx, LANEX[l] - 14, HITY - 12, 28, 24, { border: fl ? '#ffe27a' : '#456' });
        BC.text(ctx, GLYPH[l], LANEX[l], HITY - 8, { color: fl ? '#ffe27a' : '#9ab', size: 12, align: 'center', shadow: false });
      }
      const tier = BC.game.tipsyTier();
      for (const n of this.notes) {
        if (!n.alive) continue;
        const wob = Math.sin((n.y + n.lane * 50) / 26 + this.t * 4) * tier * 4;
        BC.rect(ctx, LANEX[n.lane] - 9 + wob, n.y - 6, 18, 12, '#ff6b9a');
        BC.rect(ctx, LANEX[n.lane] - 9 + wob, n.y - 6, 18, 3, '#ffd1e0');
      }
      if (this.phase === 'done') {
        BC.rect(ctx, 0, 96, BC.W, 48, 'rgba(0,0,0,0.7)');
        BC.text(ctx, this.pass ? 'WHAT A SET!' : 'PITCHY...', BC.W / 2, 104, { color: this.pass ? '#7ed07e' : '#ff8a8a', size: 14, align: 'center' });
        BC.text(ctx, 'Hits: ' + this.hits + ' / ' + this.total + '   Z to continue', BC.W / 2, 126, { color: '#cfe', size: 9, align: 'center' });
      } else {
        BC.text(ctx, 'hits ' + this.hits + '/' + this.total, 6, 22, { color: '#9ab', size: 8 });
        BC.text(ctx, 'arrows = hit   X = quit', BC.W / 2, BC.H - 12, { color: '#778', size: 8, align: 'center' });
      }
    }
  };
})();
