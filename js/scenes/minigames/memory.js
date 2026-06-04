// Tipsy Newt: memorize 3 regulars' usual orders, then serve them. Drunk = less study time.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});
  const U = BC.util;

  const NAMES = ['Marge', 'Dave', 'Sal', 'Rhonda', 'Chuck', 'Bev', 'Lou'];
  const DRINKS = ['Lager', 'Stout', 'Cider', 'Martini', 'Whiskey', 'Soda', 'Red Wine', 'Old Fashioned'];

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; }

  S.mg_memory = {
    enter(args) {
      this.barId = args.barId; this.done = false;
      const names = shuffle(NAMES).slice(0, 3);
      this.regs = names.map(nm => {
        const correct = U.choice(DRINKS);
        const others = shuffle(DRINKS.filter(d => d !== correct)).slice(0, 2);
        return { name: nm, correct, options: shuffle([correct, ...others]) };
      });
      this.phase = 'show';
      this.timer = Math.max(1.6, 3.4 - BC.game.tipsyTier() * 0.55);
      this.idx = 0; this.sel = 0; this.right = 0;
    },

    update(dt) {
      if (this.done) return;
      if (BC.input.pressed('b')) return this.finish(false);

      if (this.phase === 'show') {
        this.timer -= dt;
        if (BC.input.pressed('a') || this.timer <= 0) { this.phase = 'recall'; this.idx = 0; this.sel = 0; }
      } else if (this.phase === 'recall') {
        const r = this.regs[this.idx];
        if (BC.input.pressed('left')) { this.sel = (this.sel + 2) % 3; BC.audio && BC.audio.sfx('blip'); }
        if (BC.input.pressed('right')) { this.sel = (this.sel + 1) % 3; BC.audio && BC.audio.sfx('blip'); }
        if (BC.input.pressed('a')) {
          if (r.options[this.sel] === r.correct) { this.right++; BC.audio && BC.audio.sfx('confirm'); }
          else BC.audio && BC.audio.sfx('cancel');
          this.idx++; this.sel = 0;
          if (this.idx >= this.regs.length) { this.phase = 'done'; this.pass = this.right >= 2; }
        }
      } else if (this.phase === 'done') {
        if (BC.input.pressed('a')) this.finish(this.pass);
      }
    },

    finish(ok) { if (this.done) return; this.done = true; BC.afterMinigame(this.barId, ok); },

    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#16121c');
      BC.text(ctx, 'COVER THE BAR', BC.W / 2, 12, { color: '#ffe27a', size: 11, align: 'center' });

      if (this.phase === 'show') {
        BC.text(ctx, 'Memorize their usuals!  (' + Math.ceil(this.timer) + ')', BC.W / 2, 34, { color: '#cfe', size: 9, align: 'center' });
        this.regs.forEach((r, i) => {
          const y = 64 + i * 30;
          BC.gfx.actor(ctx, 40, y - 8, 'right', 0, { shirt: ['#8a5a3a', '#3a6a9a', '#7a3a6a'][i] });
          BC.text(ctx, r.name + ' always orders:', 70, y - 6, { color: '#fff', size: 9 });
          BC.text(ctx, r.correct, 70, y + 6, { color: '#9ef', size: 10 });
        });
        BC.text(ctx, 'Z = ready', BC.W / 2, BC.H - 20, { color: '#889', size: 8, align: 'center' });
      } else if (this.phase === 'recall') {
        const r = this.regs[this.idx];
        BC.text(ctx, 'Regular ' + (this.idx + 1) + ' of 3', BC.W / 2, 34, { color: '#9ab', size: 9, align: 'center' });
        BC.gfx.actor(ctx, BC.W / 2 - 8, 52, 'down', 0, { shirt: ['#8a5a3a', '#3a6a9a', '#7a3a6a'][this.idx] });
        BC.text(ctx, r.name + ': "The usual, please."', BC.W / 2, 78, { color: '#fff', size: 9, align: 'center' });
        r.options.forEach((o, i) => {
          const x = 40 + i * 64, y = 130;
          const onSel = i === this.sel;
          BC.panel(ctx, x, y, 56, 22, { border: onSel ? '#ffe27a' : '#556' });
          BC.text(ctx, o, x + 28, y + 7, { color: onSel ? '#ffe27a' : '#bcd', size: 8, align: 'center', shadow: false });
        });
        BC.text(ctx, '<- ->  pick   Z  serve', BC.W / 2, BC.H - 20, { color: '#889', size: 8, align: 'center' });
      } else {
        BC.text(ctx, this.pass ? 'NAILED IT!' : 'CLOSE...', BC.W / 2, 80, { color: this.pass ? '#7ed07e' : '#ff8a8a', size: 14, align: 'center' });
        BC.text(ctx, 'Correct: ' + this.right + ' / 3', BC.W / 2, 108, { color: '#cfe', size: 10, align: 'center' });
        BC.text(ctx, 'Z to continue', BC.W / 2, BC.H - 24, { color: '#889', size: 8, align: 'center' });
      }
      BC.text(ctx, 'X = give up', 6, BC.H - 12, { color: '#667', size: 7 });
    }
  };
})();
