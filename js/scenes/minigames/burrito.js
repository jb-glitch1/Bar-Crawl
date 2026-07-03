// The Everything Burrito: late-night diner eating challenge.
// A sweeping CHOMP indicator — hit the sweet-spot to take a clean bite.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const TIMER_MAX = 17;   // seconds to finish
  const BAR_X = 28, BAR_Y = 172, BAR_W = 200, BAR_H = 10;
  const ZONE_X = 24, ZONE_Y = 150, ZONE_W = 208, ZONE_H = 14;
  const MARKER_Y = ZONE_Y + ZONE_H / 2;

  const QUIPS = [
    '...is that a whole pickle?',
    'extra everything',
    'was that a marshmallow??',
    'the chef warned you about the beans',
    'mystery meat unlocked',
    'three sauces at once',
    'a rogue olive!',
    'crunch. was that a chip?',
    'jalapeño overload',
    'is this guac or a lime?',
    'hot sauce: ??? rating',
    'found the lucky bean',
  ];

  S.mg_burrito = {
    enter(args) {
      this.barId = args.barId;
      this.done = false;
      this.t = 0;
      this.timer = TIMER_MAX;
      this.progress = 0;        // 0..100
      this.phase = 'play';
      this.won = false;

      // sweeping marker state
      this.markerX = ZONE_X;
      this.markerDir = 1;

      // bite flash
      this.biteFlash = 0;       // >0 = flash frame count
      this.biteClean = false;
      this.quip = '';
      this.quipTimer = 0;

      // hiccup state
      this.hiccup = 0;

      // sweet-spot width and sweep speed vary with tipsiness
      this._refreshDifficulty();
    },

    _refreshDifficulty() {
      const tier = BC.game.tipsyTier();
      // sober: wide zone, slow sweep. drunk: narrow zone, faster sweep.
      this.sweetW = Math.max(22, 52 - tier * 8 - (BC.game.brownout() ? 6 : 0));
      // sweet-spot centre drifts a bit when drunk
      const drift = tier >= 2 ? (Math.sin(this.t * 1.8) * 20) : 0;
      this.sweetCX = ZONE_X + ZONE_W / 2 + drift;
      this.sweepSpeed = 80 + tier * 35;   // px/sec
    },

    update(dt) {
      if (this.done) return;

      if (BC.input.pressed('b')) {
        BC.audio && BC.audio.sfx('cancel');
        return this._finish(false);
      }

      if (this.phase === 'result') {
        if (BC.input.pressed('a')) this._finish(this.won);
        return;
      }

      this.t += dt;
      this.timer -= dt;
      this._refreshDifficulty();

      // advance sweeping marker
      this.markerX += this.sweepSpeed * this.markerDir * dt;
      if (this.markerX >= ZONE_X + ZONE_W - 2) { this.markerX = ZONE_X + ZONE_W - 2; this.markerDir = -1; }
      if (this.markerX <= ZONE_X) { this.markerX = ZONE_X; this.markerDir = 1; }

      // hiccup penalty counter
      if (this.hiccup > 0) this.hiccup -= dt;

      // quip display timer
      if (this.quipTimer > 0) this.quipTimer -= dt;

      // bite flash
      if (this.biteFlash > 0) this.biteFlash -= dt;

      // bite input
      if (BC.input.pressed('a')) {
        const inSweet = Math.abs(this.markerX - this.sweetCX) <= this.sweetW / 2;
        if (inSweet) {
          // clean bite
          this.progress = Math.min(100, this.progress + 14 + Math.random() * 6);
          this.biteClean = true;
          this.quip = QUIPS[(Math.random() * QUIPS.length) | 0];
          this.quipTimer = 1.8;
          BC.audio && BC.audio.sfx('eat');
        } else {
          // sloppy bite
          this.progress = Math.min(100, this.progress + 4 + Math.random() * 4);
          this.biteClean = false;
          // hiccup on sloppy bite when tipsy
          if (BC.game.tipsyTier() >= 1 && Math.random() < 0.5) {
            this.hiccup = 0.6;
            BC.audio && BC.audio.sfx('error');
          } else {
            BC.audio && BC.audio.sfx('blip');
          }
        }
        this.biteFlash = 0.18;
      }

      // check win / loss
      if (this.progress >= 100) {
        this.phase = 'result';
        this.won = true;
        BC.audio && BC.audio.sfx('stamp');
      } else if (this.timer <= 0) {
        this.timer = 0;
        this.phase = 'result';
        this.won = false;
        BC.audio && BC.audio.sfx('cancel');
      }
    },

    _finish(ok) {
      if (this.done) return;
      this.done = true;
      BC.afterMinigame(this.barId, ok, Math.round(this.progress + this.timer * 2));
    },

    render(ctx) {
      // background — diner vibe
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#1a120a');

      // title
      BC.text(ctx, 'THE EVERYTHING BURRITO', BC.W / 2, 7,
        { color: '#ffe27a', size: 9, align: 'center' });
      BC.text(ctx, 'late-night diner challenge', BC.W / 2, 18,
        { color: '#a07848', size: 7, align: 'center', shadow: false });

      // burrito drawing — shrinks as progress increases
      this._drawBurrito(ctx);

      // quip callout
      if (this.quipTimer > 0) {
        const alpha = Math.min(1, this.quipTimer / 0.4);
        const col = 'rgba(255,220,100,' + alpha.toFixed(2) + ')';
        BC.text(ctx, '"' + this.quip + '"', BC.W / 2, 100,
          { color: col, size: 7, align: 'center', shadow: false });
      }

      // hiccup display
      if (this.hiccup > 0) {
        BC.text(ctx, '*HICCUP*', BC.W / 2, 114,
          { color: '#ff7a50', size: 9, align: 'center' });
      }

      // sweep zone background
      BC.rect(ctx, ZONE_X, ZONE_Y, ZONE_W, ZONE_H, '#2a1a0a');
      BC.rect(ctx, ZONE_X, ZONE_Y, ZONE_W, ZONE_H - 1, '#3a2510');

      // sweet-spot highlight
      const sL = (this.sweetCX - this.sweetW / 2) | 0;
      BC.rect(ctx, sL, ZONE_Y, this.sweetW | 0, ZONE_H, '#3a6a20');
      BC.rect(ctx, sL, ZONE_Y, this.sweetW | 0, 2, '#5aaa30');

      // zone border
      ctx.strokeStyle = '#604030';
      ctx.lineWidth = 1;
      ctx.strokeRect(ZONE_X + 0.5, ZONE_Y + 0.5, ZONE_W - 1, ZONE_H - 1);

      // CHOMP marker
      const mCol = (this.biteFlash > 0 && this.biteClean) ? '#ffff60'
        : (this.biteFlash > 0) ? '#ff6040' : '#ffffff';
      BC.rect(ctx, (this.markerX | 0) - 1, ZONE_Y - 2, 3, ZONE_H + 4, mCol);

      // zone label
      BC.text(ctx, 'CHOMP', ZONE_X + ZONE_W / 2, ZONE_Y - 11,
        { color: '#c09060', size: 7, align: 'center', shadow: false });

      // EATEN progress bar
      BC.rect(ctx, BAR_X - 1, BAR_Y - 1, BAR_W + 2, BAR_H + 2, '#201408');
      BC.rect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, '#2a1a08');
      const fillW = (BAR_W * this.progress / 100) | 0;
      if (fillW > 0) {
        BC.rect(ctx, BAR_X, BAR_Y, fillW, BAR_H, '#7cba30');
        BC.rect(ctx, BAR_X, BAR_Y, fillW, 3, '#a0e040');
      }
      BC.text(ctx, 'EATEN  ' + (this.progress | 0) + '%', BAR_X, BAR_Y - 10,
        { color: '#90b060', size: 7, shadow: false });

      // timer
      const tLeft = Math.max(0, this.timer);
      const tCol = tLeft < 5 ? '#ff5050' : tLeft < 9 ? '#ffb030' : '#8ec8f0';
      BC.text(ctx, 'TIME  ' + tLeft.toFixed(1) + 's', BAR_X + BAR_W, BAR_Y - 10,
        { color: tCol, size: 7, align: 'right', shadow: false });

      // result overlay
      if (this.phase === 'result') {
        BC.rect(ctx, 0, 90, BC.W, 60, 'rgba(0,0,0,0.78)');
        BC.text(ctx, this.won ? 'DEMOLISHED!' : 'DEFEATED BY A BURRITO', BC.W / 2, 98,
          { color: this.won ? '#7ed07e' : '#ff7a50', size: 12, align: 'center' });
        BC.text(ctx, this.won ? 'you ate every last bite' : 'it beat you. it wins.',
          BC.W / 2, 116, { color: '#c0a070', size: 8, align: 'center', shadow: false });
        BC.text(ctx, 'Z to continue', BC.W / 2, 136,
          { color: '#778', size: 8, align: 'center', shadow: false });
      } else {
        BC.text(ctx, 'Z = bite    X = give up', BC.W / 2, BC.H - 10,
          { color: '#604030', size: 7, align: 'center', shadow: false });
      }
    },

    _drawBurrito(ctx) {
      // burrito shrinks as progress grows
      const scale = 1 - this.progress / 100 * 0.55;
      const bW = (72 * scale) | 0;
      const bH = (26 * scale) | 0;
      const bX = (BC.W / 2 - bW / 2) | 0;
      const bY = 42;

      if (bW < 4) return;

      // foil wrap (silvery ends)
      BC.rect(ctx, bX, bY, 10, bH, '#9090a0');
      BC.rect(ctx, bX + bW - 10, bY, 10, bH, '#9090a0');
      // foil highlight
      BC.rect(ctx, bX + 1, bY + 1, 8, 3, '#c8c8d8');
      BC.rect(ctx, bX + bW - 9, bY + 1, 8, 3, '#c8c8d8');

      // tortilla body
      BC.rect(ctx, bX + 8, bY, bW - 16, bH, '#d4a660');
      BC.rect(ctx, bX + 8, bY, bW - 16, 3, '#e8c080');
      BC.rect(ctx, bX + 8, bY + bH - 3, bW - 16, 3, '#b88840');

      // filling peek (centre gap when partially eaten)
      if (this.progress > 10) {
        const gapW = Math.min((bW - 20) | 0, ((this.progress / 100) * 20) | 0);
        const gX = (BC.W / 2 - gapW / 2) | 0;
        BC.rect(ctx, gX, bY + 5, gapW, bH - 10, '#3a8a30');   // green filling
        BC.rect(ctx, gX + 2, bY + 7, Math.max(0, gapW - 4), 3, '#c04040');  // red filling
      }

      // steam wisps when fresh
      if (this.progress < 30) {
        const sx = BC.W / 2;
        const sw = Math.sin(this.t * 3.2) * 2;
        BC.rect(ctx, sx + sw, bY - 8, 1, 5, 'rgba(200,200,220,0.4)');
        BC.rect(ctx, sx + 8 + sw * -1, bY - 6, 1, 4, 'rgba(200,200,220,0.3)');
      }
    }
  };
})();
