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
    if (success) BC.game.earnStamp(barId);
    BC.ui.cutscene([
      { fadeOut: 1, dur: 0.2 },
      { do: () => { BC.setScene('bar', { id: barId, fromMinigame: true }); if (!success) BC.ui.toast('Maybe next time.'); } },
      { fadeIn: 0, dur: 0.2 }
    ]);
  };

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
      const g = BC.game;
      if (n.role === 'challenge') {
        if (g.hasStamp(this.id)) {
          BC.ui.say(n.repeat || ['Good to see you again.'], { speaker: n.name });
        } else {
          const id = this.id, type = n.challenge;
          BC.ui.say(n.greet || ['Ready?'], { speaker: n.name }, () => BC.startChallenge(type, id));
        }
      } else {
        BC.ui.say(n.lines || ['...'], { speaker: n.name });
      }
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
