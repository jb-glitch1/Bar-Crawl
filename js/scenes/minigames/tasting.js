// Pour Decisions: bluff your way through a pretentious wine tasting. 3 rounds.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  // Each round: wine label, a swirl/sniff/sip flavour line, and 3 notes.
  // note index 0 = correct (convincingly pretentious), 1 = too plain, 2 = too unhinged.
  const ROUNDS = [
    {
      wine: 'Chateau Malaise 2019',
      action: 'You swirl. A single droplet escapes onto your cuff.',
      notes: [
        'Bold, with notes of wet library\nand quiet disappointment.',
        'Tastes like red wine.',
        'I detect the memory of a specific\ngrape\'s childhood trauma.'
      ]
    },
    {
      wine: 'Domaine du Vague Regret',
      action: 'You sniff. It smells... like time itself.',
      notes: [
        'Earthy finish, hints of pencil shavings\nand a cancelled dinner party.',
        'Kind of sour? I don\'t know.',
        'This wine has read Proust. I can taste\neach volume individually.'
      ]
    },
    {
      wine: 'Le Soupir Blanc 2021',
      action: 'You sip. The sommelier watches with unsettling intensity.',
      notes: [
        'Crisp acidity, whispers of lemon zest\nand unresolved ambition.',
        'Tastes like grape juice but worse.',
        'I am detecting a single specific\nraindrop from 1997.'
      ]
    }
  ];

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Build an option list that tracks which index is the "correct" one.
  function buildOptions(notes, tier) {
    // Map each note to { text, correct }
    const opts = notes.map((t, i) => ({ text: t, correct: i === 0 }));
    // At tier >= 2 (drunk), shuffle order so player can't rely on position memory.
    if (tier >= 2) {
      return shuffle(opts);
    }
    return opts;
  }

  S.mg_tasting = {
    enter(args) {
      this.barId = args.barId;
      this.done = false;
      this.phase = 'action';  // 'action' -> 'choose' -> 'flash' -> (next round) -> 'result'
      this.roundIdx = 0;
      this.right = 0;
      this.sel = 0;
      this.flash = 0;
      this.flashOk = false;
      this.actionTimer = 1.8;
      this._buildRound();
    },

    _buildRound() {
      const r = ROUNDS[this.roundIdx];
      this.opts = buildOptions(r.notes, BC.game ? BC.game.tipsyTier() : 0);
      this.sel = 0;
      this.phase = 'action';
      this.actionTimer = 1.8;
    },

    update(dt) {
      if (this.done) return;

      // 'b' = give up at any time
      if (BC.input.pressed('b')) { return this.finish(false); }

      if (this.phase === 'action') {
        this.actionTimer -= dt;
        // Allow skipping the flavour line with 'a'
        if (this.actionTimer <= 0 || BC.input.pressed('a')) {
          this.phase = 'choose';
        }
        return;
      }

      if (this.phase === 'flash') {
        this.flash -= dt;
        if (this.flash <= 0) {
          this.roundIdx++;
          if (this.roundIdx >= ROUNDS.length) {
            this.pass = this.right >= 2;
            this.phase = 'result';
            BC.audio && BC.audio.sfx(this.pass ? 'confirm' : 'cancel');
          } else {
            this._buildRound();
          }
        }
        return;
      }

      if (this.phase === 'result') {
        if (BC.input.pressed('a')) { this.finish(this.pass); }
        return;
      }

      // phase === 'choose'
      if (BC.input.pressed('up')) {
        this.sel = (this.sel + this.opts.length - 1) % this.opts.length;
        BC.audio && BC.audio.sfx('blip');
      }
      if (BC.input.pressed('down')) {
        this.sel = (this.sel + 1) % this.opts.length;
        BC.audio && BC.audio.sfx('blip');
      }
      if (BC.input.pressed('a')) {
        this.flashOk = this.opts[this.sel].correct;
        if (this.flashOk) { this.right++; BC.audio && BC.audio.sfx('confirm'); }
        else { BC.audio && BC.audio.sfx('cancel'); }
        this.flash = 0.75;
        this.phase = 'flash';
      }
    },

    finish(ok) {
      if (this.done) return;
      this.done = true;
      BC.afterMinigame(this.barId, ok, this.right);
    },

    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#1a0f1e');
      BC.text(ctx, 'POUR DECISIONS', BC.W / 2, 10, { color: '#c8a0e0', size: 11, align: 'center' });

      const tier = BC.game ? BC.game.tipsyTier() : 0;

      if (this.phase === 'result') {
        this._renderResult(ctx);
        BC.text(ctx, 'X = give up', 6, BC.H - 12, { color: '#667', size: 7 });
        return;
      }

      const r = ROUNDS[this.roundIdx];

      // Round counter
      BC.text(ctx, 'Round ' + (this.roundIdx + 1) + ' / ' + ROUNDS.length + '   (' + this.right + ' correct)', BC.W / 2, 26, { color: '#9ab', size: 8, align: 'center' });

      // Wine label panel
      BC.panel(ctx, 20, 36, BC.W - 40, 18, { border: '#c8a0e0' });
      BC.text(ctx, r.wine, BC.W / 2, 41, { color: '#ffe27a', size: 9, align: 'center', shadow: false });

      // Sommelier sprite (facing left, judging you)
      BC.gfx.actor(ctx, BC.W - 26, 56, 'left', 0, { shirt: '#2a2a4a', hair: '#1a0a0a', pants: '#1a1a2e', skin: '#d0a880' });

      if (this.phase === 'action') {
        // Flavour flourish line
        BC.panel(ctx, 14, 58, BC.W - 54, 40, { border: '#664488' });
        BC.text(ctx, r.action, 20, 64, { color: '#ddc0f0', size: 8, shadow: false });
        const pct = Math.max(0, this.actionTimer / 1.8);
        BC.rect(ctx, 20, 92, Math.round((BC.W - 68) * pct), 3, '#c8a0e0');
        BC.text(ctx, 'Z to taste now', BC.W / 2, BC.H - 20, { color: '#778', size: 8, align: 'center' });
      } else {
        // Drunk tier >= 2: show a comedic palate warning
        if (tier >= 2) {
          BC.text(ctx, tier >= 3 ? 'EVERYTHING TASTES PURPLE' : 'Your palate is... compromised.',
            BC.W / 2, 59, { color: '#ff8888', size: 8, align: 'center' });
        } else {
          BC.text(ctx, 'Choose the most convincing tasting note:',
            BC.W / 2, 59, { color: '#aa88cc', size: 8, align: 'center' });
        }

        // Option panels — 3 stacked entries
        this.opts.forEach((o, i) => {
          const yy = 72 + i * 46;
          const onSel = i === this.sel;
          let borderCol = onSel ? '#ffe27a' : '#445';
          if (this.phase === 'flash') {
            if (o.correct) borderCol = '#7ed07e';
            else if (i === this.sel) borderCol = '#ff6b6b';
          }
          BC.panel(ctx, 10, yy, BC.W - 20, 40, { border: borderCol });

          // Arrow cursor
          if (onSel && this.phase === 'choose') {
            BC.text(ctx, '>', 13, yy + 15, { color: '#ffe27a', size: 9, shadow: false });
          }

          // Option text — split on \n for two-line notes
          const lines = o.text.split('\n');
          const textCol = (this.phase === 'flash')
            ? (o.correct ? '#7ed07e' : (i === this.sel ? '#ff8888' : '#667'))
            : (onSel ? '#ffe27a' : '#ccc');
          BC.text(ctx, lines[0], BC.W / 2, yy + 8, { color: textCol, size: 8, align: 'center', shadow: false });
          if (lines[1]) {
            BC.text(ctx, lines[1], BC.W / 2, yy + 20, { color: textCol, size: 8, align: 'center', shadow: false });
          }
        });

        BC.text(ctx, 'up/down pick   Z confirm', BC.W / 2, BC.H - 20, { color: '#778', size: 8, align: 'center' });
      }

      BC.text(ctx, 'X = give up', 6, BC.H - 12, { color: '#667', size: 7 });
    },

    _renderResult(ctx) {
      const label = this.pass ? 'CONNOISSEUR' : 'PHILISTINE';
      const col   = this.pass ? '#ffe27a' : '#ff8a8a';
      const sub   = this.pass
        ? '"Your palate is as refined as\nyour student loan debt."'
        : '"Perhaps stick to boxed wine,\ndear."';

      BC.text(ctx, label, BC.W / 2, 68, { color: col, size: 14, align: 'center' });
      sub.split('\n').forEach((line, i) => {
        BC.text(ctx, line, BC.W / 2, 96 + i * 14, { color: '#bbb', size: 8, align: 'center' });
      });
      BC.text(ctx, 'Correct: ' + this.right + ' / ' + ROUNDS.length, BC.W / 2, 132, { color: '#9ef', size: 9, align: 'center' });
      BC.text(ctx, 'Z to continue', BC.W / 2, BC.H - 24, { color: '#889', size: 8, align: 'center' });
    }
  };
})();
