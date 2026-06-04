// Generic bar interior: walk around, talk to the cast, beat the challenge, leave.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  // scene transitions (fade-wrapped so they feel intentional)
  BC.enterBar = (id) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.22 }, { do: () => BC.setScene('bar', { id }) }, { fadeIn: 0, dur: 0.22 }
  ]);
  BC.leaveBar = (key, px, py) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.22 }, { do: () => BC.setScene('overworld', { key, px, py, dir: 'down' }) }, { fadeIn: 0, dur: 0.22 }
  ]);
  BC.startChallenge = (type, id) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.2 }, { do: () => BC.setScene('mg_' + type, { barId: id }) }, { fadeIn: 0, dur: 0.2 }
  ]);
  BC.afterMinigame = (barId, success) => {
    if (success) {
      BC.game.earnStamp(barId);
      const def = BC.bars[barId];
      if (def && def.onStamp) def.onStamp(BC.game);
    }
    BC.ui.cutscene([
      { fadeOut: 1, dur: 0.2 },
      { do: () => { BC.setScene('bar', { id: barId, fromMinigame: true }); if (!success) BC.ui.toast('Maybe next time.'); } },
      { fadeIn: 0, dur: 0.2 }
    ]);
  };

  // "be nice" scenarios for the Sleigh It Ain't So elf (option 0 is the nice one)
  const NICE = [
    { q: 'A regular drops their wallet, cash showing. You...', opts: ['Return it, every cent.', '"Finders keepers."', 'Judge their old ID photo.'] },
    { q: 'Sweaty Santa needs a break. You...', opts: ['Cover his shift. Ho ho.', 'Steal the hat.', 'Remind him it is July.'] },
    { q: 'One cookie left on the plate. You...', opts: ['Give it away.', 'Eat it menacingly.', 'Crumble it "by accident."'] }
  ];

  S.bar = {
    enter(args) {
      const g = BC.game;
      this.def = BC.bars[args.id];
      this.id = args.id;
      this.screen = BC.world.fromAscii(this.def.name, this.def.room);
      const sp = this.screen.spawn || { x: 120, y: 200 };
      this.player = BC.player = new BC.Player(sp.x, sp.y);
      this.player.dir = 'up';
      this.npcs = (this.def.npcs || []).map(n => Object.assign({ frame: 0 }, n));

      g.run.flags.barTheme = true;
      if (BC.audio) BC.audio.setMood(this.def.mood || 'mid');

      if (!args.fromMinigame && this.def.intro && !g.run.flags['intro_' + this.id]) {
        g.run.flags['intro_' + this.id] = true;
        BC.ui.say(this.def.intro, { speaker: this.def.name });
      }
    },

    exit() {
      const g = BC.game;
      g.run.flags.barTheme = false;
      if (BC.audio) BC.audio.setMood(g.mood);
    },

    update(dt) {
      this.player.update(dt, this.screen);
      if (BC.input.pressed('a')) this.tryInteract();
    },

    tryInteract() {
      const p = this.player;
      let fx = p.x, fy = p.y - 2;
      if (p.dir === 'left') fx -= 12; else if (p.dir === 'right') fx += 12;
      else if (p.dir === 'up') fy -= 14; else fy += 8;

      let best = null, bd = 1e9;
      for (const n of this.npcs) { const d = Math.hypot(n.x - fx, n.y - fy); if (d < bd) { bd = d; best = n; } }
      if (best && bd < 26) { this.talk(best); return; }

      const ed = this.screen.exitDoor;
      if (ed) {
        const tx = Math.floor(fx / 16), ty = Math.floor(fy / 16);
        if (tx === ed.tx && ty === ed.ty) this.leave();
      }
    },

    talk(n) {
      switch (n.role) {
        case 'challenge': return this.talkChallenge(n);
        case 'password_giver': return this.talkPassword(n);
        case 'ingredient': return this.talkIngredient(n);
        case 'quest_cocktail': return this.talkCocktail(n);
        case 'deja': return this.talkDeja(n);
        case 'nicelist': return this.talkNice(n);
        case 'speakeasy': return this.talkSpeakeasy(n);
        case 'eatery': return this.talkEatery(n);
        default: return BC.ui.say(n.lines || ['...'], { speaker: n.name });
      }
    },

    talkChallenge(n) {
      const g = BC.game;
      if (g.hasStamp(this.id)) {
        BC.ui.say(n.repeat || ['Good to see you again.'], { speaker: n.name });
      } else {
        const id = this.id, type = n.challenge;
        BC.ui.say(n.greet || ['Ready?'], { speaker: n.name }, () => BC.startChallenge(type, id));
      }
    },

    talkPassword(n) {
      const g = BC.game;
      if (g.tipsyTier() >= 1) {
        g.learn('password');
        BC.ui.say(['*leans in, conspiratorial*', '"Psst. Tonight\'s word at Reggie\'s is... ' + n.password + '." *taps nose*'], { speaker: n.name });
      } else {
        BC.ui.say(n.lines || ['...'], { speaker: n.name });
      }
    },

    talkIngredient(n) {
      const g = BC.game, q = BC.quests.cocktail;
      if (!q.active(g)) { BC.ui.say(n.lines || ['...'], { speaker: n.name }); return; }
      if (q.has(g, n.ingredient)) { BC.ui.say(['You already grabbed that one.'], { speaker: n.name }); return; }
      q.give(g, n.ingredient);
      const ing = q.ingredients.find(i => i.id === n.ingredient);
      BC.ui.toast('Got: ' + (ing ? ing.label : n.ingredient), { good: true });
      BC.audio && BC.audio.sfx('stamp');
      BC.ui.say(['"For the perfect cocktail? Take it."'], { speaker: n.name });
    },

    talkCocktail(n) {
      const g = BC.game, q = BC.quests.cocktail;
      if (g.hasStamp('cocktail')) { BC.ui.say(['"Perfection. I\'ll never forget it. ...probably."'], { speaker: n.name }); return; }
      if (!q.active(g)) {
        q.start(g);
        BC.ui.say(['"Make me the PERFECT cocktail.', 'I need three things, from three bars:', 'mint (Pour Decisions), top-shelf whiskey (The Sticky Floor), and a tiny umbrella (Off-Key West)."'], { speaker: n.name });
        return;
      }
      if (q.complete(g)) {
        BC.ui.say(['You combine the three. The patron sips. A single tear forms.', '"...Perfect."'], { speaker: n.name }, () => g.earnStamp('cocktail'));
        return;
      }
      BC.ui.say(['"Still missing: ' + q.needList(g).join(', ') + '."'], { speaker: n.name });
    },

    talkDeja(n) {
      const g = BC.game;
      if (g.hasStamp('deja_brew')) { BC.ui.say(['"Back again. Of course you are. Time\'s a circle, friend."'], { speaker: n.name }); return; }
      BC.ui.say(['*the bartender studies you*', '"...You again. The 5-PM-to-2-AM one. The looper."', '"This is loop number ' + g.meta.loops + ' for you. Give or take."'], { speaker: n.name }, () => {
        BC.ui.choose('"Quick — do you remember how this night ends?"', ['"...No idea."', '"Every single time."', '"Wait — you KNOW?"'], () => {
          g.earnStamp('deja_brew');
          BC.ui.say(['*slides you a stamp without being asked*', '"Knew you\'d pick that. See you next loop."'], { speaker: n.name });
        });
      });
    },

    talkNice(n) {
      const g = BC.game;
      if (g.hasStamp('sleigh')) { BC.ui.say(n.repeat || ['Nice List veteran!'], { speaker: n.name }); return; }
      this.niceScore = 0;
      BC.ui.say((n.greet || ['Make the NICE LIST, pal.']).concat(['Three situations. Choose wisely. Santa\'s watching.']), { speaker: n.name }, () => this.runNice(n, 0));
    },
    runNice(n, i) {
      const g = BC.game;
      if (i >= NICE.length) {
        if (this.niceScore >= 2) {
          g.earnStamp('sleigh');
          BC.ui.say(['The elf stamps your card with a candy-cane flourish.', '"NICE LIST. Welcome, pal."'], { speaker: n.name });
        } else {
          BC.ui.say(['The elf squints. "...Naughty. Be nicer and come back, pal."'], { speaker: n.name });
        }
        return;
      }
      BC.ui.choose(NICE[i].q, NICE[i].opts, (k) => { if (k === 0) this.niceScore++; this.runNice(n, i + 1); });
    },

    talkSpeakeasy(n) {
      const g = BC.game;
      if (!g.hasStamp('speakeasy')) { g.earnStamp('speakeasy'); BC.ui.say(n.greet || ['Welcome.'], { speaker: n.name }); }
      else BC.ui.say(n.repeat || ['Welcome back, VIP.'], { speaker: n.name });
    },

    talkEatery(n) {
      const g = BC.game;
      g.eat(22);
      BC.ui.toast('You grab a bite. (a little less tipsy)');
      BC.ui.say(n.lines || ['Soaks up the night.'], { speaker: n.name });
    },

    leave() {
      const d = this.def.door;
      BC.leaveBar(d.key, d.tx * 16 + 8, (d.ty + 1) * 16 + 12);
    },

    render(ctx) {
      ctx.clearRect(0, 0, BC.W, BC.H);
      BC.world.draw(ctx, this.screen, 0, 0);
      // draw NPCs then player, sorted by y so overlaps look right
      const all = this.npcs.map(n => ({ n, y: n.y })).concat([{ player: this.player, y: this.player.y }]);
      all.sort((a, b) => a.y - b.y);
      for (const e of all) {
        if (e.player) BC.gfx.actor(ctx, this.player.x - 8, this.player.y - 16, this.player.dir, this.player.frame, this.player.colors);
        else BC.gfx.actor(ctx, e.n.x - 8, e.n.y - 16, e.n.dir, 0, e.n.colors);
      }
      // banner
      BC.rect(ctx, 0, 0, BC.W, 12, 'rgba(8,8,16,0.8)');
      BC.text(ctx, this.def.name, 4, 2, { color: '#ffe27a', size: 8 });
      BC.text(ctx, this.stampHint(), BC.W - 4, 2, { color: '#9ab', size: 8, align: 'right' });
    },

    stampHint() {
      return BC.game.hasStamp(this.id) ? 'STAMPED *' : 'press X by the door to leave';
    }
  };
})();
