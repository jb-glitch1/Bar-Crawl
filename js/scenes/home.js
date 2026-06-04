// Home — your apartment. Every night (loop) begins here at 5 PM; step out the
// door into the town.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const ROOM = [
    '################',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#......@.......#',
    '#......X.......#',
    '################'
  ];
  const PALETTE = { wall: '#5a4a5a', floor: '#6a5444', floor2: '#615039', counter: '#7a5a3a' };
  const f = (type, tx, ty, c) => ({ type, tx, ty, color: c });
  const FURN = [f('bed', 1, 1, '#4a6a9a'), f('tv', 11, 1), f('couch', 10, 3, '#7a4a3a'), f('fridge', 1, 7), f('table', 6, 7), f('plant', 14, 8), f('rug', 6, 10, '#3a5a7a')];

  BC.enterHomeFrom = () => { /* re-entering from town does nothing special */ };

  S.home = {
    enter(args) {
      const g = BC.game;
      this.screen = BC.world.fromAscii('Home', ROOM);
      this.furniture = FURN.map(x => Object.assign({}, x));
      for (const fu of this.furniture) {
        if (!BC.furniture.solid(fu.type)) continue;
        const sz = BC.furniture.size(fu.type);
        for (let yy = 0; yy < sz[1]; yy++) for (let xx = 0; xx < sz[0]; xx++) {
          const tx = fu.tx + xx, ty = fu.ty + yy;
          if (tx >= 0 && ty >= 0 && tx < 16 && ty < 15) this.screen.tiles[ty * 16 + tx] = BC.world.T.PROP;
        }
      }
      const sp = this.screen.spawn || { x: 120, y: 200 };
      this.player = BC.player = new BC.Player(sp.x, sp.y);
      this.player.dir = 'up';
      if (BC.audio) BC.audio.setMood('early');
      if (!args.skipIntro) {
        if (!g.meta.seenIntro) {
          g.meta.seenIntro = true; g.save();
          BC.ui.say([
            'Your phone buzzes: tonight is THE BAR CRAWL.',
            'Rule 1 - hit every bar and earn its stamp. Twelve in all.',
            'Rule 2 - order a DRINK to take on each place. Watch your meter (top-right).',
            'Rule 3 - be home before 2 AM. Black out or miss last call and the night restarts... but you keep what you learned.',
            'Open the menu (M / Esc) anytime for your map + punch card. Now - out the door!'
          ], { speaker: 'Tonight' });
        } else {
          BC.ui.say(['5:00 PM again. You remember the route. Sharper this time.'], { speaker: 'Home' });
        }
      }
    },

    update(dt) {
      this.player.update(dt, this.screen);
      const ed = this.screen.exitDoor;
      if (ed && Math.floor(this.player.x / 16) === ed.tx && Math.floor(this.player.y / 16) === ed.ty) {
        BC.ui.cutscene([
          { fadeOut: 1, dur: 0.3 },
          { do: () => BC.setScene('overworld', { key: '0,0', px: 200, py: 92, dir: 'down' }) },
          { fadeIn: 0, dur: 0.4 }
        ]);
      }
    },

    render(ctx) {
      ctx.clearRect(0, 0, BC.W, BC.H);
      BC.world.drawInterior(ctx, this.screen, 0, 0, PALETTE);
      const all = [];
      for (const fu of this.furniture) all.push({ y: BC.furniture.footY(fu), f: fu });
      all.push({ y: this.player.y, player: true });
      all.sort((a, b) => a.y - b.y);
      for (const e of all) {
        if (e.player) BC.gfx.actor(ctx, this.player.x - 8, this.player.y - 16, this.player.dir, this.player.frame, this.player.colors);
        else BC.furniture.draw(ctx, e.f);
      }
      BC.rect(ctx, 0, 0, BC.W, 12, 'rgba(8,8,16,0.8)');
      BC.text(ctx, 'HOME', 4, 2, { color: '#ffe27a', size: 8 });
      BC.text(ctx, 'walk out the door to start', BC.W - 4, 2, { color: '#9ab', size: 8, align: 'right' });
    }
  };
})();
