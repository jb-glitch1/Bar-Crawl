// Generic bar interior: walk around, talk to the cast, beat the challenge, leave.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  // scene transitions (fade-wrapped so they feel intentional)
  // ret = { key, tx, ty } of the overworld door you came in through (so we can
  // put you back just outside it). Falls back to the bar's declared door.
  BC.enterBar = (id, ret) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.22 },
    { do: () => { BC.audio && BC.audio.sfx('chime'); BC.setScene('bar', { id, ret }); } },
    { fadeIn: 0, dur: 0.22 }
  ]);
  BC.leaveBar = (key, px, py) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.22 }, { do: () => BC.setScene('overworld', { key, px, py, dir: 'down' }) }, { fadeIn: 0, dur: 0.22 }
  ]);
  BC.startChallenge = (type, id) => BC.ui.cutscene([
    { fadeOut: 1, dur: 0.2 }, { do: () => BC.setScene('mg_' + type, { barId: id }) }, { fadeIn: 0, dur: 0.2 }
  ]);
  BC.afterMinigame = (barId, success, score) => {
    const g = BC.game, def = BC.bars[barId];
    if (score != null) {
      const isPB = g.setHighScore(barId, score);
      if (isPB && g.hasStamp(barId)) {
        g.run.cash += 5; // personal bests pay out
        BC.ui.toast('New high score: ' + score + '!  (+$5)', { good: true });
        if (BC.fx) BC.fx.coins();
      }
    }
    if (success) {
      g.earnStamp(barId);
      if (def && def.onStamp) def.onStamp(g);
    }
    if (g.run.ended) return; // a blackout (or 2 AM) just took over the night
    BC.ui.cutscene([
      { fadeOut: 1, dur: 0.2 },
      { do: () => { BC.setScene('bar', { id: barId, fromMinigame: true }); if (!success) BC.ui.toast('Maybe next time.'); } },
      { fadeIn: 0, dur: 0.2 }
    ]);
  };

  // the iconic glowing shelf of bottles behind any counter
  function drawBackbar(ctx, scene) {
    const scr = scene.screen, T = BC.world.T;
    let minTx = 99, maxTx = -1;
    for (let ty = 0; ty < scr.h; ty++) for (let tx = 0; tx < scr.w; tx++) {
      if (scr.tiles[ty * scr.w + tx] === T.COUNTER) { if (tx < minTx) minTx = tx; if (tx > maxTx) maxTx = tx; }
    }
    if (maxTx < 0) return;
    const x0 = minTx * 16 + 2, x1 = maxTx * 16 + 14, y = 4;
    BC.rect(ctx, x0, y, x1 - x0, 24, 'rgba(14,9,18,0.6)');            // recessed shelf
    BC.rect(ctx, x0, y + 10, x1 - x0, 1, 'rgba(255,255,255,0.15)');   // shelf lips
    BC.rect(ctx, x0, y + 21, x1 - x0, 1, 'rgba(255,255,255,0.15)');
    const cols = ['#7ed07e', '#ffd166', '#ff6b6b', '#7ad0ff', '#d09aff', '#f0a44a'];
    let h = 0;
    for (let i = 0; i < scene.id.length; i++) h = ((h * 31 + scene.id.charCodeAt(i)) >>> 0);
    for (let row = 0; row < 2; row++) {
      const by = y + 10 + row * 11;
      for (let bx = x0 + 4; bx < x1 - 5; bx += 8) {
        h = ((h * 1103515245 + 12345) & 0x7fffffff) >>> 0;
        const c = cols[h % cols.length], bh = 5 + ((h >> 6) % 4);
        BC.rect(ctx, bx, by - bh, 3, bh, c);
        BC.rect(ctx, bx + 1, by - bh - 2, 1, 2, c); // bottle neck
      }
    }
  }

  // "be nice" scenarios for the Sleigh It Ain't So elf (option 0 is the nice one)
  const NICE = [
    { q: 'A regular drops their wallet, cash showing. You...', opts: ['Return it, every cent.', '"Finders keepers."', 'Judge their old ID photo.'] },
    { q: 'Sweaty Santa needs a break. You...', opts: ['Cover his shift. Ho ho.', 'Steal the hat.', 'Remind him it is July.'] },
    { q: 'One cookie left on the plate. You...', opts: ['Give it away.', 'Eat it menacingly.', 'Crumble it "by accident."'] }
  ];

  S.bar = {
    enter(args) {
      const g = BC.game;
      if (BC.audio && BC.audio.setBackingMode) BC.audio.setBackingMode(false); // in case karaoke was abandoned
      this.def = BC.bars[args.id];
      this.id = args.id;
      if (args.ret) this.ret = args.ret;
      // you can't ride into a bar — a valet takes your wheels at the door
      if (args.fromMinigame) {
        this.titleT = 0;
      } else {
        this.prevVehicle = g.run.vehicle;
        if (g.run.vehicle !== 'walk') {
          const v = g.run.vehicle; g.setVehicle('walk');
          BC.ui.toast(v === 'scooter' ? 'A valet eyes your scooter, then parks it.' : 'A valet takes your bike. Classy.');
        }
        this.titleT = 2.6; // "now entering" card
      }
      this.screen = BC.world.fromAscii(this.def.name, this.def.room);
      // place furniture (solid pieces block movement)
      this.furniture = (this.def.furniture || []).map(f => Object.assign({}, f));
      for (const f of this.furniture) {
        if (!BC.furniture.solid(f.type)) continue;
        const sz = BC.furniture.size(f.type);
        for (let yy = 0; yy < sz[1]; yy++) for (let xx = 0; xx < sz[0]; xx++) {
          const tx = f.tx + xx, ty = f.ty + yy;
          if (tx >= 0 && ty >= 0 && tx < this.screen.w && ty < this.screen.h) this.screen.tiles[ty * this.screen.w + tx] = BC.world.T.PROP;
        }
      }
      const sp = this.screen.spawn || { x: 120, y: 200 };
      this.player = BC.player = new BC.Player(sp.x, sp.y);
      this.player.dir = 'up';
      this.npcs = (this.def.npcs || []).map(n => Object.assign({ frame: 0 }, n));

      g.run.flags.barTheme = true;
      if (BC.audio) BC.audio.setMood(this.def.mood || 'mid');

      if (!args.fromMinigame && this.def.intro && !g.run.flags['intro_' + this.id] && !g.meta.mastered[this.id]) {
        g.run.flags['intro_' + this.id] = true;
        BC.ui.say(this.def.intro, { speaker: this.def.name });
      } else if (!args.fromMinigame && g.meta.lastEnd && g.meta.lastEnd.reason === 'blackout' &&
                 g.meta.lastEnd.barId === this.id && !g.run.flags['shame_' + this.id]) {
        // the scene of last night's crime remembers you
        g.run.flags['shame_' + this.id] = true;
        BC.ui.say(['"Back again? Last night ended... let\'s say \'abruptly.\'"', '"We kept your tab open. Brave of us."'], { speaker: this.def.name });
      }
    },

    exit() {
      const g = BC.game;
      g.run.flags.barTheme = false;
      if (BC.audio) BC.audio.setMood(g.mood);
    },

    update(dt) {
      if (this.titleT > 0) this.titleT -= dt;
      this.player.update(dt, this.screen);
      // walk onto the exit doormat to leave (and you can also press Z facing it)
      const ed = this.screen.exitDoor;
      if (ed && Math.floor(this.player.x / 16) === ed.tx && Math.floor(this.player.y / 16) === ed.ty) {
        this.leave(); return;
      }
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

      // poke the furniture (it pokes back)
      const ftx = Math.floor(fx / 16), fty = Math.floor(fy / 16);
      for (const f of (this.furniture || [])) {
        const sz = BC.furniture.size(f.type);
        if (ftx >= f.tx && ftx < f.tx + sz[0] && fty >= f.ty && fty < f.ty + sz[1]) {
          if (this.pokeFurniture(f)) return;
          break;
        }
      }

      const ed = this.screen.exitDoor;
      if (ed) {
        const tx = Math.floor(fx / 16), ty = Math.floor(fy / 16);
        if (tx === ed.tx && ty === ed.ty) this.leave();
      }
    },

    pokeFurniture(f) {
      const JUKE = ["'Total Eclipse of the Bar Tab'", "'Sweet Child O' Wine'", "'Livin' on a Prayer (and $6)'", "'Wonderwall.' Obviously."];
      const M = {
        jukebox: () => { BC.ui.toast('Now playing: ' + BC.util.choice(JUKE)); BC.audio && BC.audio.sfx('blip'); },
        pooltable: () => BC.ui.toast('You line it up perfectly. The cue ball declines.'),
        dartboard: () => BC.ui.toast('The board has seen things.'),
        fireplace: () => BC.ui.toast('The fire crackles smugly.'),
        xmastree: () => BC.ui.toast('It is July. The tree does not care.'),
        tv: () => BC.ui.toast('Forty screens. Thirty-nine wrong games.'),
        shelf: () => BC.ui.toast('Bottles you cannot afford, sorted by smugness.')
      };
      if (M[f.type]) { M[f.type](); return true; }
      return false;
    },

    talk(n) {
      switch (n.role) {
        case 'cat':
          BC.ui.toast('You pet ' + n.name + '. The bar falls silent in respect.', { good: true });
          BC.audio && BC.audio.sfx('confirm');
          if (BC.fx) BC.fx.hearts(n.x, n.y - 8, 3);
          if (n.lines) BC.ui.say(n.lines, { speaker: n.name, portrait: n.colors });
          return;
        case 'challenge': return this.talkChallenge(n);
        case 'password_giver': return this.talkPassword(n);
        case 'ingredient': return this.talkIngredient(n);
        case 'quest_cocktail': return this.talkCocktail(n);
        case 'deja': return this.talkDeja(n);
        case 'nicelist': return this.talkNice(n);
        case 'speakeasy': return this.talkSpeakeasy(n);
        case 'eatery': return this.talkEatery(n);
        default: return BC.ui.say(n.lines || ['...'], { speaker: n.name, portrait: n.colors });
      }
    },

    talkChallenge(n) {
      const g = BC.game, id = this.id, type = n.challenge, bar = BC.bars[id];
      const noBooze = bar.drinkOnWin === 0;
      const drink = bar.drink || { name: 'a drink', amount: 12 };
      // some challenges keep hours — routing is the puzzle
      if (bar.opensAt && g.run.minutes < bar.opensAt) {
        BC.ui.say(bar.hoursMsg || ['"We start later. Come back."'], { speaker: n.name, portrait: n.colors });
        return;
      }
      // Gary's brother, at last
      if (id === 'hail_mary' && g.knows('gary_thing') && !g.run.flags.garyHi) {
        g.run.flags.garyHi = true;
        BC.ui.say(['"...GARY says hi? GARY?? He has never ONCE made it by eight."', '"The thing STARTED as a way to get him out of the house. Don\'t tell him."'], { speaker: n.name, portrait: n.colors });
        return;
      }
      if (g.hasStamp(id)) {
        BC.ui.say(n.repeat || ['Good to see you again.'], { speaker: n.name, portrait: n.colors }, () => {
          const opts = ['Play again  (best: ' + g.highScore(id) + ')'];
          if (!noBooze) opts.push('Order ' + drink.name + ' (+tipsy)');
          opts.push('Leave it');
          BC.ui.choose("What'll it be?", opts, (i) => {
            if (i === 0) BC.startChallenge(type, id);
            else if (!noBooze && i === 1) { g.drink(drink.amount); BC.ui.toast('*clink* another ' + drink.name + '.'); }
          });
        });
      } else {
        // regulars skip the pitch; ordering a drink is part of taking on the bar
        const greet = g.meta.mastered[id] ? ['"The usual?"'] : (n.greet || ['Ready?']);
        BC.ui.say(greet, { speaker: n.name, portrait: n.colors }, () => {
          if (noBooze) {
            BC.ui.choose('Take it on?', ["Let's go", 'Maybe later'], (i) => {
              if (i === 0) BC.startChallenge(type, id);
            });
            return;
          }
          // pick your pour: manage the meter (floor for secrets, ceiling for blackout)
          const happy = bar.happyHourUntil && g.run.minutes < bar.happyHourUntil;
          BC.ui.choose('Order ' + drink.name + '?' + (happy ? '  (HAPPY HOUR)' : ''),
            ['Easy pour', 'Regular pour', 'Make it STRONG', 'Maybe later'], (i) => {
              if (i < 0 || i === 3) return;
              const amt = [drink.amount - 5, drink.amount, drink.amount + 5][i] - (happy ? 4 : 0);
              g.drink(Math.max(4, amt));
              BC.ui.toast('You order ' + drink.name + '.' + (happy ? ' Gentle happy-hour pour.' : ''));
              if (g.run.ended) return;
              BC.startChallenge(type, id);
            });
        });
      }
    },

    talkPassword(n) {
      const g = BC.game;
      if (g.tipsyTier() >= 1) {
        g.learn('password');
        BC.ui.say(['*leans in, conspiratorial*', '"Psst. Tonight\'s word at Reggie\'s is... ' + n.password + '." *taps nose*'], { speaker: n.name, portrait: n.colors });
      } else {
        BC.ui.say(n.lines || ['...'], { speaker: n.name, portrait: n.colors });
      }
    },

    talkIngredient(n) {
      const g = BC.game, q = BC.quests.cocktail;
      if (!q.active(g)) { BC.ui.say(n.lines || ['...'], { speaker: n.name, portrait: n.colors }); return; }
      if (q.has(g, n.ingredient)) { BC.ui.say(['You already grabbed that one.'], { speaker: n.name, portrait: n.colors }); return; }
      q.give(g, n.ingredient);
      const ing = q.ingredients.find(i => i.id === n.ingredient);
      BC.ui.toast('Got: ' + (ing ? ing.label : n.ingredient), { good: true });
      BC.audio && BC.audio.sfx('stamp');
      BC.ui.say(['"For the perfect cocktail? Take it."'], { speaker: n.name, portrait: n.colors });
    },

    talkCocktail(n) {
      const g = BC.game, q = BC.quests.cocktail;
      if (g.hasStamp('cocktail')) { BC.ui.say(['"Perfection. I\'ll never forget it. ...probably."'], { speaker: n.name, portrait: n.colors }); return; }
      if (!q.active(g)) {
        q.start(g);
        BC.ui.say(['"Make me the PERFECT cocktail.', 'I need three things, from three bars:', 'mint (Pour Decisions), top-shelf whiskey (The Sticky Floor), and a tiny umbrella (Off-Key West)."'], { speaker: n.name, portrait: n.colors });
        return;
      }
      if (q.complete(g)) {
        BC.ui.say(['You combine the three. The patron sips. A single tear forms.', '"...Perfect."'], { speaker: n.name, portrait: n.colors }, () => g.earnStamp('cocktail'));
        return;
      }
      BC.ui.say(['"Still missing: ' + q.needList(g).join(', ') + '."'], { speaker: n.name, portrait: n.colors });
    },

    talkDeja(n) {
      const g = BC.game;
      if (g.hasStamp('deja_brew')) {
        BC.ui.say(g.meta.tab >= 21
          ? ['"Back again. Of course you are."', '"Tab\'s at $' + g.meta.tab + ', by the way. We both know money stopped mattering."']
          : ['"Back again. Of course you are. Time\'s a circle, friend."'], { speaker: n.name, portrait: n.colors });
        return;
      }
      BC.ui.say(['*the bartender studies you*', '"...You again. The 5-PM-to-2-AM one. The looper."', '"This is loop number ' + g.meta.loops + ' for you. Give or take."'], { speaker: n.name, portrait: n.colors }, () => {
        BC.ui.choose('"Quick — do you remember how this night ends?"', ['"...No idea."', '"Every single time."', '"Wait — you KNOW?"'], () => {
          g.earnStamp('deja_brew');
          BC.ui.say(['*slides you a stamp without being asked*', '"Wanna stop looping? Punch every card. The night you FINISH is the one that lets you wake up tomorrow."', '"...or keep comin\' back. I don\'t mind the company."'], { speaker: n.name, portrait: n.colors });
        });
      });
    },

    talkNice(n) {
      const g = BC.game;
      if (g.hasStamp('sleigh')) { BC.ui.say(n.repeat || ['Nice List veteran!'], { speaker: n.name, portrait: n.colors }); return; }
      this.niceScore = 0;
      BC.ui.say((n.greet || ['Make the NICE LIST, pal.']).concat(['Three situations. Choose wisely. Santa\'s watching.']), { speaker: n.name, portrait: n.colors }, () => this.runNice(n, 0));
    },
    runNice(n, i) {
      const g = BC.game;
      if (i >= NICE.length) {
        if (this.niceScore >= 2) {
          g.earnStamp('sleigh');
          BC.ui.say(['The elf stamps your card with a candy-cane flourish.', '"NICE LIST. Welcome, pal."'], { speaker: n.name, portrait: n.colors });
        } else {
          BC.ui.say(['The elf squints. "...Naughty. Be nicer and come back, pal."'], { speaker: n.name, portrait: n.colors });
        }
        return;
      }
      BC.ui.choose(NICE[i].q, NICE[i].opts, (k) => { if (k === 0) this.niceScore++; this.runNice(n, i + 1); });
    },

    talkSpeakeasy(n) {
      const g = BC.game;
      if (!g.hasStamp('speakeasy')) { g.earnStamp('speakeasy'); BC.ui.say(n.greet || ['Welcome.'], { speaker: n.name, portrait: n.colors }); }
      else BC.ui.say(n.repeat || ['Welcome back, VIP.'], { speaker: n.name, portrait: n.colors });
    },

    talkEatery(n) {
      const g = BC.game;
      g.eat(22);
      BC.ui.toast('You grab a bite. (a little less tipsy)');
      BC.ui.say(n.lines || ['Soaks up the night.'], { speaker: n.name, portrait: n.colors });
    },

    leave() {
      const g = BC.game;
      if (this.prevVehicle && this.prevVehicle !== 'walk') g.setVehicle(this.prevVehicle); // valet brings your ride back
      const d = this.ret || this.def.door;
      BC.leaveBar(d.key, d.tx * 16 + 8, (d.ty + 1) * 16 + 12);
    },

    render(ctx) {
      ctx.clearRect(0, 0, BC.W, BC.H);
      BC.world.drawInterior(ctx, this.screen, 0, 0, this.def.palette);
      drawBackbar(ctx, this);
      // depth-sort furniture, NPCs and the player by their base Y
      const all = [];
      for (const f of (this.furniture || [])) all.push({ y: BC.furniture.footY(f), f });
      for (const n of this.npcs) all.push({ y: n.y, n });
      all.push({ y: this.player.y, player: true });
      all.sort((a, b) => a.y - b.y);
      for (const e of all) {
        if (e.player) BC.gfx.actor(ctx, this.player.x - 8, this.player.y - 16, this.player.dir, this.player.frame, this.player.colors);
        else if (e.f) BC.furniture.draw(ctx, e.f);
        else BC.gfx.actor(ctx, e.n.x - 8, e.n.y - 16, e.n.dir, 0, e.n.colors);
      }
      // warm interior vignette (depth + lighting); skipped where gradients aren't supported
      const grd = ctx.createRadialGradient && ctx.createRadialGradient(BC.W / 2, BC.H / 2 - 10, 36, BC.W / 2, BC.H / 2, 175);
      if (grd && grd.addColorStop) { grd.addColorStop(0, 'rgba(255,220,150,0.05)'); grd.addColorStop(0.6, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, BC.W, BC.H); }
      // small persistent label (top-center, on a backdrop so the back-bar doesn't swallow it)
      const nm = this.def.name, nw = nm.length * 6 + 10;
      BC.rect(ctx, (BC.W - nw) / 2, 2, nw, 11, 'rgba(8,8,14,0.72)');
      BC.text(ctx, nm, BC.W / 2, 4, { color: '#cdd', size: 8, align: 'center' });
      // transient "now entering" title card
      if (this.titleT > 0) {
        let a = 1;
        if (this.titleT > 2.3) a = (2.6 - this.titleT) / 0.3;
        else if (this.titleT < 0.6) a = this.titleT / 0.6;
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        BC.rect(ctx, 0, 78, BC.W, 42, 'rgba(8,8,16,0.85)');
        BC.rect(ctx, 0, 78, BC.W, 1, '#ffe27a'); BC.rect(ctx, 0, 119, BC.W, 1, '#ffe27a');
        BC.text(ctx, this.def.name, BC.W / 2, 86, { color: '#ffe27a', size: 14, align: 'center' });
        if (this.def.tag) BC.text(ctx, this.def.tag, BC.W / 2, 106, { color: '#cfe', size: 8, align: 'center' });
        ctx.globalAlpha = 1;
      }
      // leave hint (bottom)
      BC.text(ctx, this.stampHint(), BC.W / 2, BC.H - 10, { color: '#99a', size: 7, align: 'center' });
    },

    stampHint() {
      return BC.game.hasStamp(this.id) ? 'stamped * - door to leave' : 'door (or X) to leave';
    }
  };
})();
