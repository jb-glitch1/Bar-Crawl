// Battle of Wits: an Undertale-style verbal duel against an overconfident barfly.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const COMEBACKS = [
    "Oh yeah? I've been holding that one in since Tuesday.",
    "I once out-argued a philosophy professor. Accidentally.",
    "That's rich, coming from someone wearing that shirt.",
    "I've heard better comebacks from a fortune cookie.",
    "My therapist calls that 'projection.' I call it 'fair game.'",
    "Bold take from someone who just spilled his drink."
  ];

  const NONSENSE = [
    "That's a very interesting take and also you're wrong.",
    "I read a study about that. The study disagreed with you.",
    "Listen, the vibes alone are enough to discredit you.",
    "Statistically speaking, you're just describing yourself.",
    "My brain is a 10% IPA. What's your excuse?",
    "I would explain but honestly it's funnier watching you guess."
  ];

  const TOASTS = [
    "To this moment and to you losing it spectacularly!",
    "To whoever taught you to talk — they clearly gave up too soon!",
    "To the concept of being right, which I currently embody!",
    "I raise this glass and lower your entire argument!"
  ];

  const FIZZLE = [
    "You lift the glass dramatically... it slips. Ice everywhere.",
    "You begin a toast. You forget the words. You sit down.",
    "The dramatic moment arrives and you sneeze. Perfect."
  ];

  const TAUNTS = [
    { text: "You call that a comeback? My WIFI password is wittier.", dmg: [10, 15] },
    { text: "I've debated smarter toasters. And LOST.", dmg: [8, 13] },
    { text: "Bless your heart. That's a bar-napkin argument if I ever heard one.", dmg: [9, 14] },
    { text: "I once made a philosophy PhD cry. You're not even getting me warm.", dmg: [11, 16] },
    { text: "Did you rehearse that? In the shower? It shows.", dmg: [8, 12] },
    { text: "My grandmother can out-talk you and she only speaks Portuguese.", dmg: [10, 15] },
    { text: "Sorry, I was distracted by how confidently wrong you are.", dmg: [9, 13] }
  ];

  const MOVES = [
    "Devastating Comeback",
    "Confident Nonsense",
    "Order Another Round",
    "Dramatic Toast"
  ];

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function drawBar(ctx, label, val, max, x, y, w, h, color) {
    BC.rect(ctx, x, y, w, h, '#1a1a2a');
    ctx.strokeStyle = '#445';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const fill = Math.max(0, Math.floor((val / max) * (w - 2)));
    if (fill > 0) BC.rect(ctx, x + 1, y + 1, fill, h - 2, color);
    BC.text(ctx, label + ' ' + val, x + 2, y + 1, { color: '#eee', size: 7, shadow: false });
  }

  S.mg_wits = {
    enter(args) {
      this.barId = args.barId;
      this.done = false;
      this.phase = 'player';   // 'player' | 'resolve' | 'opponent' | 'result'
      this.sel = 0;

      this.dignity = 100;
      this.composure = rnd(100, 120);
      this.composureMax = this.composure;
      this.courage = 0;
      this.maxCourage = 4;

      this.won = false;
      this.resolveTimer = 0;
      this.opponentTimer = 0;

      this.banterLine = '"Oh great, ANOTHER one who thinks they can out-talk me."';
      this.resolveText = '';
      this.opponentText = '';

      this.frame = 0;
      this.animTimer = 0;
    },

    update(dt) {
      if (this.done) return;

      this.animTimer += dt;
      if (this.animTimer >= 0.35) { this.animTimer = 0; this.frame = (this.frame + 1) & 1; }

      if (this.phase === 'result') {
        if (BC.input.pressed('a') || BC.input.pressed('b')) this.finish(this.won);
        return;
      }

      if (BC.input.pressed('b')) { this.finish(false); return; }

      if (this.phase === 'player') {
        if (BC.input.pressed('up')) { this.sel = (this.sel + 3) % 4; BC.audio && BC.audio.sfx('blip'); }
        if (BC.input.pressed('down')) { this.sel = (this.sel + 1) % 4; BC.audio && BC.audio.sfx('blip'); }
        if (BC.input.pressed('a')) { this._doPlayerMove(); }
      } else if (this.phase === 'resolve') {
        this.resolveTimer -= dt;
        if (this.resolveTimer <= 0) { this._doOpponentMove(); }
      } else if (this.phase === 'opponent') {
        this.opponentTimer -= dt;
        if (this.opponentTimer <= 0) { this._afterOpponent(); }
      }
    },

    _doPlayerMove() {
      let dmg = 0;
      let line = '';

      if (this.sel === 0) {
        // Devastating Comeback — reliable damage
        dmg = rnd(14, 20);
        line = pick(COMEBACKS);
        BC.audio && BC.audio.sfx('confirm');
      } else if (this.sel === 1) {
        // Confident Nonsense — scales with drunkenness
        const tier = BC.game.tipsyTier();
        dmg = rnd(6 + tier * 9, 10 + tier * 9);
        line = pick(NONSENSE);
        BC.audio && BC.audio.sfx(tier >= 2 ? 'confirm' : 'blip');
      } else if (this.sel === 2) {
        // Order Another Round — gain Liquid Courage + small heal
        if (this.courage < this.maxCourage) this.courage++;
        const heal = rnd(4, 8);
        this.dignity = Math.min(100, this.dignity + heal);
        line = 'You order another round. (+' + heal + ' Dignity, +1 Courage)';
        BC.audio && BC.audio.sfx('drink');
        dmg = 0;
      } else if (this.sel === 3) {
        // Dramatic Toast — big hit, costs 2 Courage; fizzles if broke
        if (this.courage >= 2) {
          this.courage -= 2;
          dmg = rnd(30, 42);
          line = pick(TOASTS);
          BC.audio && BC.audio.sfx('stamp');
        } else {
          dmg = 0;
          line = pick(FIZZLE);
          BC.audio && BC.audio.sfx('error');
        }
      }

      if (dmg > 0) {
        this.composure = Math.max(0, this.composure - dmg);
        this.resolveText = '(-' + dmg + ' Composure)';
      } else {
        this.resolveText = '';
      }
      this.banterLine = '"' + line + '"';

      if (this.composure <= 0) {
        this.won = true;
        this.phase = 'result';
        BC.audio && BC.audio.sfx('stamp');
        return;
      }

      this.phase = 'resolve';
      this.resolveTimer = 1.4;
    },

    _doOpponentMove() {
      const taunt = pick(TAUNTS);
      const dmg = rnd(taunt.dmg[0], taunt.dmg[1]);
      this.dignity = Math.max(0, this.dignity - dmg);
      this.opponentText = '"' + taunt.text + '"';
      this.bannerNote = '(-' + dmg + ' Dignity)';
      this.phase = 'opponent';
      this.opponentTimer = 1.6;
      BC.audio && BC.audio.sfx('error');
    },

    _afterOpponent() {
      if (this.dignity <= 0) {
        this.won = false;
        this.phase = 'result';
        return;
      }
      this.banterLine = this.opponentText;
      this.resolveText = this.bannerNote;
      this.phase = 'player';
    },

    finish(ok) { if (this.done) return; this.done = true; BC.afterMinigame(this.barId, ok); },

    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0e0d1a');
      BC.text(ctx, 'BATTLE OF WITS!', BC.W / 2, 6, { color: '#ffe27a', size: 11, align: 'center' });

      // Rival — top right area
      BC.gfx.actor(ctx, 198, 24, 'left', this.frame, { shirt: '#6b3f8a', hair: '#111', pants: '#2a2a3a', skin: '#c89870' });
      BC.text(ctx, 'BARFLY', 196, 16, { color: '#c8a0e8', size: 7, align: 'center' });

      // Player — bottom left area
      BC.gfx.actor(ctx, 30, 120, 'right', this.phase === 'player' ? this.frame : 0,
        { shirt: '#3a6a9a', hair: '#4a3020', pants: '#2a3040' });
      BC.text(ctx, 'YOU', 38, 112, { color: '#9ef', size: 7, align: 'center' });

      // Health bars
      drawBar(ctx, 'DIGNITY', this.dignity, 100, 4, 146, 116, 11, '#4a9adf');
      drawBar(ctx, 'COMPOSURE', this.composure, this.composureMax, BC.W / 2 + 4, 146, 116, 11, '#8a44bb');

      // Liquid Courage pips
      BC.text(ctx, 'Liquid Courage:', 4, 160, { color: '#f0c040', size: 7 });
      for (let i = 0; i < this.maxCourage; i++) {
        const filled = i < this.courage;
        BC.rect(ctx, 96 + i * 13, 158, 11, 9, filled ? '#f0c040' : '#2a2a3a');
        ctx.strokeStyle = '#887030';
        ctx.lineWidth = 1;
        ctx.strokeRect(96.5 + i * 13, 158.5, 10, 8);
        if (filled) BC.text(ctx, 'C', 98 + i * 13, 159, { color: '#1a1005', size: 7, shadow: false });
      }

      // Move menu
      const menuX = 4; const menuY = 172; const menuW = BC.W - 8; const menuH = 60;
      BC.panel(ctx, menuX, menuY, menuW, menuH, { border: '#556' });

      if (this.phase === 'result') {
        BC.text(ctx, this.won ? 'YOU WIN THE ARGUMENT' : 'YOU LOSE YOUR DIGNITY',
          BC.W / 2, menuY + 10, { color: this.won ? '#7ed07e' : '#ff7070', size: 10, align: 'center' });
        BC.text(ctx, this.won ? 'The barfly sputters and stares at his drink.' : '"Okay yeah you should probably sit down."',
          BC.W / 2, menuY + 26, { color: '#ccc', size: 7, align: 'center' });
        BC.text(ctx, 'Z to continue', BC.W / 2, menuY + 44, { color: '#889', size: 8, align: 'center' });
        return;
      }

      if (this.phase === 'player') {
        MOVES.forEach((m, i) => {
          const on = i === this.sel;
          const ry = menuY + 4 + i * 13;
          if (on) BC.rect(ctx, menuX + 2, ry - 1, menuW - 4, 12, '#1e1e3a');
          const label = (i === 3) ? m + ' (need 2 Courage)' : m;
          BC.text(ctx, (on ? '> ' : '  ') + label, menuX + 6, ry + 1,
            { color: on ? '#ffe27a' : '#aab', size: 7, shadow: false });
          // Extra hint for Confident Nonsense
          if (i === 1 && on) {
            const tier = BC.game.tipsyTier();
            const dmgHint = (6 + tier * 9) + '-' + (10 + tier * 9);
            BC.text(ctx, '(' + dmgHint + ' dmg, tier ' + tier + ')', menuX + menuW - 6, ry + 1,
              { color: '#88f8a0', size: 7, align: 'right', shadow: false });
          }
        });
      } else if (this.phase === 'resolve' || this.phase === 'opponent') {
        const showLine = this.phase === 'opponent' ? this.opponentText : this.banterLine;
        const showNote = this.phase === 'opponent' ? this.bannerNote : this.resolveText;
        // Word-wrap banter
        const words = showLine.split(' ');
        let line = ''; let ly = menuY + 8;
        for (const w of words) {
          if ((line + ' ' + w).length > 38) {
            BC.text(ctx, line, menuX + 6, ly, { color: '#dde', size: 7, shadow: false });
            ly += 12; line = w;
          } else { line = line ? line + ' ' + w : w; }
        }
        if (line) BC.text(ctx, line, menuX + 6, ly, { color: '#dde', size: 7, shadow: false });
        if (showNote) BC.text(ctx, showNote, menuX + menuW - 6, menuY + menuH - 10,
          { color: '#f09050', size: 7, align: 'right', shadow: false });
      }

      BC.text(ctx, 'X = forfeit', 6, BC.H - 8, { color: '#667', size: 7 });
    }
  };
})();
