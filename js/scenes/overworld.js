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
          placeSafe(screen, player);
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

      // hop on / off the bike (once you own one)
      if (BC.input.pressed('b') && g.hasItem('bike')) {
        const onBike = g.run.vehicle === 'bike';
        g.setVehicle(onBike ? 'walk' : 'bike');
        BC.ui.toast(onBike ? 'Off the bike.' : 'On your bike.');
      }

      // dev hotkeys
      if (BC.config.debug) {
        if (BC.input.pressed('one')) g.drink(14);
        if (BC.input.pressed('two')) g.eat(25);
        if (BC.input.pressed('three')) cycleVehicle();
        if (BC.input.pressed('four')) g.run.minutes = Math.min(g.config.nightMinutes, g.run.minutes + 30);
      }

      // step onto a bar door = walk straight in
      const ctx2 = Math.floor(player.x / 16), cty2 = Math.floor(player.y / 16);
      if (screen.tiles[cty2 * screen.w + ctx2] === BC.world.T.DOOR) {
        const inter = screen.meta.interactions && screen.meta.interactions[ctx2 + ',' + cty2];
        if (inter) { inter(g); return; }
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
        drawProps(ctx, screen, 0, 0);
        BC.gfx.actor(ctx, player.x - 8, player.y - 16, player.dir, player.frame, player.colors);
        drawSigns(ctx, screen, 0, 0);
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

  function placeSafe(scr, p) {
    if (!BC.solidBox(scr, p.box())) return;
    for (let r = 1; r <= 7; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = Math.floor(p.x / 16) + dx, ty = Math.floor(p.y / 16) + dy;
          if (tx < 0 || ty < 0 || tx >= scr.w || ty >= scr.h) continue;
          const cx = tx * 16 + 8, cy = ty * 16 + 12;
          if (!BC.solidBox(scr, p.box(cx, cy))) { p.x = cx; p.y = cy; return; }
        }
      }
    }
  }

  function drawProps(ctx, scr, ox, oy) {
    const props = scr.meta && scr.meta.props;
    if (!props) return;
    for (const pr of props) {
      const x = ox + pr.tx * 16, y = oy + pr.ty * 16;
      if (pr.type === 'scooter') {
        BC.rect(ctx, x + 6, y + 2, 4, 13, '#445'); // post
        BC.rect(ctx, x + 2, y - 4, 12, 7, '#1c2740'); // sign
        BC.text(ctx, 'SCOOT', x + 3, y - 3, { color: '#7ad0ff', size: 6, shadow: false });
        BC.rect(ctx, x + 1, y + 13, 14, 2, '#222');
      } else if (pr.type === 'bike') {
        if (BC.game.hasItem('bike')) {
          BC.rect(ctx, x + 2, y + 10, 12, 2, '#556'); // empty rack
          BC.rect(ctx, x + 3, y + 6, 2, 5, '#556');
          BC.rect(ctx, x + 11, y + 6, 2, 5, '#556');
        } else {
          BC.gfx.px(ctx, x + 2, y + 11, 4, 4, '#222'); // wheels
          BC.gfx.px(ctx, x + 10, y + 11, 4, 4, '#222');
          BC.gfx.px(ctx, x + 3, y + 12, 2, 2, '#777');
          BC.gfx.px(ctx, x + 11, y + 12, 2, 2, '#777');
          BC.rect(ctx, x + 4, y + 8, 8, 2, '#c43'); // frame
          BC.rect(ctx, x + 7, y + 5, 2, 4, '#c43');
        }
      }
    }
  }

  function drawSigns(ctx, scr, ox, oy) {
    const signs = scr.meta && scr.meta.signs;
    if (!signs) return;
    for (const s of signs) {
      const cx = ox + s.tx * 16 + 8, ty = oy + (s.ty - 1) * 16 + 4;
      const w = s.text.length * 4 + 6;
      BC.rect(ctx, cx - w / 2, ty, w, 9, 'rgba(10,10,20,0.85)');
      BC.text(ctx, s.text, cx, ty + 1, { color: '#ffe27a', size: 7, align: 'center', shadow: false });
    }
  }

  BC.overworld = { interactFront, frontTile, placeSafe };

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
