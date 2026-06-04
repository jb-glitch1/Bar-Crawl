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
      const g = BC.game;

      // scooter battery drains embarrassingly fast; parks reject it outright
      g.drainScooter(dt, player.moving);
      if (screen.meta && screen.meta.park && g.run.vehicle === 'scooter') {
        g.ejectScooterFromPark();
      }

      // interact with whatever is in front of you
      if (BC.input.pressed('a')) interactFront();

      // dev hotkeys
      if (BC.config.debug) {
        if (BC.input.pressed('one')) g.drink(14);
        if (BC.input.pressed('two')) g.eat(25);
        if (BC.input.pressed('three')) cycleVehicle();
        if (BC.input.pressed('four')) g.run.minutes = Math.min(g.config.nightMinutes, g.run.minutes + 30);
      }

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

      // scooter "app" readout (diegetic — the only persistent HUD)
      if (BC.game.run.vehicle === 'scooter') {
        const pct = BC.game.run.scooterPct;
        const bx = BC.W - 60, by = BC.H - 16;
        BC.rect(ctx, bx - 2, by - 2, 58, 14, 'rgba(0,0,0,0.6)');
        BC.text(ctx, 'SCOOT', bx, by, { color: '#9ef', size: 8 });
        BC.rect(ctx, bx + 30, by + 1, 20, 7, '#222');
        const col = pct < 15 ? '#ff6b6b' : pct < 40 ? '#ffd166' : '#7ed07e';
        BC.rect(ctx, bx + 31, by + 2, Math.max(1, 18 * pct / 100), 5, col);
        BC.text(ctx, pct + '%', bx + 30, by - 9, { color: col, size: 7 });
      }
    }
  };

  function frontTile() {
    const d = player.dir; let fx = player.x, fy = player.y - 2;
    if (d === 'left') fx -= 10; else if (d === 'right') fx += 10;
    else if (d === 'up') fy -= 12; else fy += 6;
    return { tx: Math.floor(fx / 16), ty: Math.floor(fy / 16) };
  }

  function interactFront() {
    const f = frontTile();
    const key = f.tx + ',' + f.ty;
    const inter = screen.meta && screen.meta.interactions && screen.meta.interactions[key];
    if (inter) { inter(BC.game, { screenKey, tx: f.tx, ty: f.ty }); return; }
    // doors with no handler yet
    const t = screen.tiles[f.ty * screen.w + f.tx];
    if (t === BC.world.T.DOOR) BC.ui.toast("It's locked. (For now.)");
  }

  function cycleVehicle() {
    const g = BC.game, v = g.run.vehicle;
    if (v === 'walk') {
      if (!g.hasItem('bike')) g.giveItem('bike');
      g.setVehicle('bike'); BC.ui.toast('Bike');
    } else if (v === 'bike') {
      g.rentScooter(); BC.ui.toast('Scooter ' + g.run.scooterPct + '%');
    } else {
      g.setVehicle('walk'); BC.ui.toast('On foot');
    }
  }

  BC.overworld = { interactFront, frontTile };

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
