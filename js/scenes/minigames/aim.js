// The Sticky Floor: darts. A drifting reticle; time your throw. Tipsy = wilder drift,
// but a SECRET bullseye only appears once you're a little buzzed.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const CX = 128, CY = 110;
  const RINGS = [[6, 50], [12, 30], [20, 20], [30, 10], [40, 5]];

  S.mg_aim = {
    enter(args) {
      this.barId = args.barId; this.done = false;
      this.t = 0; this.throws = 3; this.score = 0; this.darts = [];
      this.phase = 'aim'; this.secret = this.makeSecret();
    },
    makeSecret() {
      const ang = Math.random() * Math.PI * 2, r = 26 + Math.random() * 10;
      return { x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r, hit: false };
    },
    update(dt) {
      if (this.done) return;
      this.t += dt;
      if (BC.input.pressed('b')) return this.finish(false);
      if (this.phase === 'done') { if (BC.input.pressed('a')) this.finish(this.pass); return; }

      if (BC.input.pressed('a')) {
        const r = this.reticle();
        let pts = 0;
        const d = Math.hypot(r.x - CX, r.y - CY);
        for (const [rad, val] of RINGS) { if (d <= rad) { pts = val; break; } }
        // secret bullseye only "exists" when tipsy
        if (this.secretActive() && !this.secret.hit && Math.hypot(r.x - this.secret.x, r.y - this.secret.y) <= 7) {
          pts += 40; this.secret.hit = true;
          BC.ui.toast('SECRET BULLSEYE!  +40', { good: true });
          if (BC.fx) { BC.fx.stars(CX, CY, 16); BC.fx.shake(3, 0.3); }
        }
        this.score += pts;
        this.darts.push({ x: r.x, y: r.y, pts });
        BC.audio && BC.audio.sfx(pts >= 30 ? 'stamp' : pts > 0 ? 'confirm' : 'thunk');
        this.throws--;
        if (this.throws <= 0) { this.phase = 'done'; this.pass = this.score >= 70; }
      }
    },
    secretActive() { return BC.game.tipsyTier() >= 1; },
    reticle() {
      const k = 1 + BC.game.tipsyTier() * 0.5 + (BC.game.brownout() ? 0.4 : 0); // drunk = faster/wider drift
      const ax = 40 * (1 + BC.game.tipsyTier() * 0.18);
      const ay = 34 * (1 + BC.game.tipsyTier() * 0.18);
      return { x: CX + Math.sin(this.t * 2.3 * k) * ax, y: CY + Math.sin(this.t * 3.1 * k + 1.2) * ay };
    },
    finish(ok) { if (this.done) return; this.done = true; BC.afterMinigame(this.barId, ok, this.score); },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#161214');
      BC.text(ctx, 'DARTS', BC.W / 2, 8, { color: '#ffe27a', size: 11, align: 'center' });
      // board
      const ringCols = ['#e8e8e8', '#caa15a', '#b04040', '#3a7d44', '#2a3a5a'];
      for (let i = RINGS.length - 1; i >= 0; i--) {
        ctx.fillStyle = ringCols[i]; ctx.beginPath(); ctx.arc(CX, CY, RINGS[i][0], 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(CX, CY, 3, 0, Math.PI * 2); ctx.fill();
      // secret bullseye (only when buzzed)
      if (this.secretActive() && !this.secret.hit) {
        ctx.strokeStyle = 'rgba(255,120,200,0.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(this.secret.x, this.secret.y, 6, 0, Math.PI * 2); ctx.stroke();
        BC.text(ctx, '?', this.secret.x, this.secret.y - 4, { color: '#ff9ad0', size: 8, align: 'center', shadow: false });
      }
      // landed darts
      for (const d of this.darts) { BC.rect(ctx, d.x - 1, d.y - 1, 2, 2, '#fff'); BC.rect(ctx, d.x - 1, d.y - 5, 1, 4, '#9ad'); }
      // reticle
      if (this.phase === 'aim') {
        const r = this.reticle();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(r.x - 6, r.y); ctx.lineTo(r.x + 6, r.y); ctx.moveTo(r.x, r.y - 6); ctx.lineTo(r.x, r.y + 6); ctx.stroke();
      }
      BC.text(ctx, 'Score ' + this.score + '   Darts ' + this.throws, BC.W / 2, 168, { color: '#cfe', size: 9, align: 'center' });
      if (this.phase === 'done') {
        BC.text(ctx, this.pass ? 'SHARP SHOOTER!' : 'NICE TRY', BC.W / 2, 186, { color: this.pass ? '#7ed07e' : '#ff8a8a', size: 13, align: 'center' });
        BC.text(ctx, 'need 70  -  Z to continue', BC.W / 2, 206, { color: '#9ab', size: 8, align: 'center' });
      } else {
        BC.text(ctx, 'Z = throw    X = quit', BC.W / 2, 206, { color: '#778', size: 8, align: 'center' });
        if (!this.secretActive()) BC.text(ctx, '(sober eyes... something\'s hidden)', BC.W / 2, 222, { color: '#556', size: 7, align: 'center' });
      }
    }
  };
})();
