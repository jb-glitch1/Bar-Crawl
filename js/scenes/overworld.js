// Overworld scene: walk a flip-screen town (Zelda-style screen-to-screen camera).
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  let player, screen, screenKey, trans = null;
  const SLIDE = 0.34; // seconds per screen flip

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function neighbor(dx, dy) {
    const p = screenKey.split(',');
    const k = (parseInt(p[0], 10) + dx) + ',' + (parseInt(p[1], 10) + dy);
    return BC.world.screens[k] ? k : null;
  }

  S.overworld = {
    enter(args) {
      BC.world.init();
      screenKey = (args && args.key) || BC.world.startKey;
      screen = BC.world.screens[screenKey];
      const sp = screen.spawn || { x: 128, y: 120 };
      player = BC.player = new BC.Player(sp.x, sp.y);
      if (args && args.px != null) {
        player.x = args.px; player.y = args.py;
        player.dir = args.dir || 'down';
      }
      trans = null;
    },

    update(dt) {
      if (trans) {
        trans.t += dt / SLIDE;
        if (trans.t >= 1) {
          screenKey = trans.toKey;
          screen = BC.world.screens[screenKey];
          player.x = trans.px; player.y = trans.py;
          trans = null;
        }
        return;
      }

      player.update(dt, screen);

      const W = BC.W, H = BC.H;
      if (player.x > W) { startFlip('right', 1, 0, 6, player.y); }
      else if (player.x < 0) { startFlip('left', -1, 0, W - 6, player.y); }
      else if (player.y > H) { startFlip('down', 0, 1, player.x, 14); }
      else if (player.y < 0) { startFlip('up', 0, -1, player.x, H - 14); }
    },

    render(ctx) {
      ctx.clearRect(0, 0, BC.W, BC.H);
      if (trans) {
        const e = ease(trans.t), W = BC.W, H = BC.H;
        let fx = 0, fy = 0, tx = 0, ty = 0;
        if (trans.dir === 'right') { fx = -W * e; tx = W - W * e; }
        else if (trans.dir === 'left') { fx = W * e; tx = -W + W * e; }
        else if (trans.dir === 'down') { fy = -H * e; ty = H - H * e; }
        else if (trans.dir === 'up') { fy = H * e; ty = -H + H * e; }
        BC.world.draw(ctx, BC.world.screens[trans.fromKey], fx, fy);
        BC.world.draw(ctx, BC.world.screens[trans.toKey], tx, ty);
        BC.gfx.actor(ctx, trans.px - 8 + tx, trans.py - 16 + ty, player.dir, 0, player.colors);
      } else {
        BC.world.draw(ctx, screen, 0, 0);
        BC.gfx.actor(ctx, player.x - 8, player.y - 16, player.dir, player.frame, player.colors);
      }
      // location label
      const label = trans ? BC.world.screens[trans.toKey].name : screen.name;
      BC.text(ctx, label, 4, 4, { color: '#e6e6ff', size: 8 });
    }
  };

  function startFlip(dir, dx, dy, px, py) {
    const nk = neighbor(dx, dy);
    if (nk) {
      trans = { dir, t: 0, fromKey: screenKey, toKey: nk, px, py };
      player.dir = dir;
    } else {
      // no neighbor: clamp back on-screen
      player.x = Math.max(6, Math.min(BC.W - 6, player.x));
      player.y = Math.max(12, Math.min(BC.H - 4, player.y));
    }
  }
})();
