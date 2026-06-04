// The Hail Mary: bar trivia. Answer most correctly for the stamp.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const POOL = [
    { q: 'A standard US "shot" is how big?', o: ['1.5 oz', '5 oz', 'half a pint'], a: 0 },
    { q: 'A drink served "neat" is...', o: ['over ice', 'no ice, no chill', 'blended'], a: 1 },
    { q: '"Last call" means...', o: ['first round', 'the final order', 'free drinks'], a: 1 },
    { q: 'A Martini is classically garnished with...', o: ['an olive', 'a pickle', 'a gummy bear'], a: 0 },
    { q: 'Which is NOT a real cocktail?', o: ['Negroni', 'Sidecar', 'Sad Wizard'], a: 2 },
    { q: 'IPA stands for...', o: ['India Pale Ale', 'Intensely Plain Ale', 'I Prefer Ales'], a: 0 },
    { q: 'Tipping your bartender is...', o: ['optional', 'the right thing to do', 'against the law'], a: 1 },
    { q: 'A drink "on the rocks" has...', o: ['actual rocks', 'ice', 'gravel'], a: 1 }
  ];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; }

  S.mg_trivia = {
    enter(args) {
      this.barId = args.barId; this.done = false;
      this.qs = shuffle(POOL).slice(0, 5);
      this.i = 0; this.sel = 0; this.right = 0;
      this.flash = 0; this.flashOk = false;
    },
    update(dt) {
      if (this.done) return;
      if (this.flash > 0) {
        this.flash -= dt;
        if (this.flash <= 0) {
          this.i++; this.sel = 0;
          if (this.i >= this.qs.length) { this.phase = 'done'; this.pass = this.right >= 4; }
        }
        return;
      }
      if (BC.input.pressed('b')) return this.finish(false);
      if (this.phase === 'done') { if (BC.input.pressed('a')) this.finish(this.pass); return; }
      const q = this.qs[this.i];
      if (BC.input.pressed('up')) { this.sel = (this.sel + q.o.length - 1) % q.o.length; BC.audio && BC.audio.sfx('blip'); }
      if (BC.input.pressed('down')) { this.sel = (this.sel + 1) % q.o.length; BC.audio && BC.audio.sfx('blip'); }
      if (BC.input.pressed('a')) {
        this.flashOk = (this.sel === q.a);
        if (this.flashOk) { this.right++; BC.audio && BC.audio.sfx('confirm'); } else BC.audio && BC.audio.sfx('cancel');
        this.flash = 0.7;
      }
    },
    finish(ok) { if (this.done) return; this.done = true; BC.afterMinigame(this.barId, ok, this.right); },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#101826');
      BC.text(ctx, 'TUESDAY TRIVIA', BC.W / 2, 12, { color: '#ffe27a', size: 11, align: 'center' });
      if (this.phase === 'done') {
        BC.text(ctx, this.pass ? 'TRIVIA CHAMP!' : 'BUZZER...', BC.W / 2, 90, { color: this.pass ? '#7ed07e' : '#ff8a8a', size: 14, align: 'center' });
        BC.text(ctx, 'Score: ' + this.right + ' / ' + this.qs.length, BC.W / 2, 116, { color: '#cfe', size: 10, align: 'center' });
        BC.text(ctx, 'Z to continue', BC.W / 2, BC.H - 24, { color: '#889', size: 8, align: 'center' });
        return;
      }
      const q = this.qs[this.i];
      BC.text(ctx, 'Q' + (this.i + 1) + '/' + this.qs.length + '   (' + this.right + ' right)', BC.W / 2, 30, { color: '#9ab', size: 8, align: 'center' });
      // wrap question
      const words = q.q.split(' '); let line = '', y = 50;
      for (const w of words) { if ((line + ' ' + w).length > 34) { BC.text(ctx, line, BC.W / 2, y, { color: '#fff', size: 9, align: 'center' }); y += 13; line = w; } else line = line ? line + ' ' + w : w; }
      if (line) { BC.text(ctx, line, BC.W / 2, y, { color: '#fff', size: 9, align: 'center' }); }
      q.o.forEach((o, i) => {
        const yy = 96 + i * 24, on = i === this.sel;
        let col = on ? '#ffe27a' : '#bcd';
        if (this.flash > 0) { if (i === q.a) col = '#7ed07e'; else if (i === this.sel) col = '#ff6b6b'; }
        BC.panel(ctx, 30, yy, BC.W - 60, 20, { border: on ? '#ffe27a' : '#556' });
        BC.text(ctx, o, BC.W / 2, yy + 6, { color: col, size: 9, align: 'center', shadow: false });
      });
      BC.text(ctx, 'up/down pick   Z answer   X quit', BC.W / 2, BC.H - 16, { color: '#778', size: 8, align: 'center' });
    }
  };
})();
