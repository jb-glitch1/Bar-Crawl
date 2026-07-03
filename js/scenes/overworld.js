// Overworld scene: walk a flip-screen town (Zelda-style screen-to-screen camera).
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  let player, screen, screenKey, trans = null, lastDoor = null;
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
      BC.world.here = screenKey;
      markVisited(screenKey);
      const sp = screen.spawn || { x: 128, y: 120 };
      player = BC.player = new BC.Player(sp.x, sp.y);
      if (args && args.px != null) {
        player.x = args.px; player.y = args.py;
        player.dir = args.dir || 'down';
      }
      placeSafe(screen, player); // never spawn embedded in a wall
      trans = null; lastDoor = null;
    },

    update(dt) {
      if (trans) {
        trans.t += dt / SLIDE;
        if (trans.t >= 1) {
          screenKey = trans.toKey;
          screen = BC.world.screens[screenKey];
          BC.world.here = screenKey;
          markVisited(screenKey);
          player.x = trans.px; player.y = trans.py;
          placeSafe(screen, player);
          trans = null;
        }
        return;
      }

      player.update(dt, screen);
      const g = BC.game;
      updateAmbient(dt, screen);

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

      // step onto a bar door = walk straight in (fire once per tile entry)
      const ctx2 = Math.floor(player.x / 16), cty2 = Math.floor(player.y / 16);
      const dk = ctx2 + ',' + cty2;
      if (screen.tiles[cty2 * screen.w + ctx2] === BC.world.T.DOOR) {
        const inter = screen.meta.interactions && screen.meta.interactions[dk];
        if (inter && lastDoor !== dk) { lastDoor = dk; inter(g); return; }
      } else {
        lastDoor = null;
      }

      // your blackout-dropped item, right where you left it
      const dr = g.meta.dropped;
      if (dr && dr.key === screenKey && ctx2 === dr.tx && cty2 === dr.ty) {
        g.meta.dropped = null;
        g.giveItem(dr.item); // giveItem saves, persisting the cleared drop too
        BC.ui.toast('You found your ' + g.itemName(dr.item) + '! Right where you left it.', { good: true });
        BC.audio && BC.audio.sfx('stamp');
        if (BC.fx) BC.fx.stars(player.x, player.y - 8);
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
        const sf = BC.world.screens[trans.fromKey], st = BC.world.screens[trans.toKey];
        BC.world.draw(ctx, sf, fx, fy);
        drawBuildings(ctx, sf, fx, fy);
        drawProps(ctx, sf, fx, fy);
        drawSigns(ctx, sf, fx, fy);
        BC.world.draw(ctx, st, tx, ty);
        drawBuildings(ctx, st, tx, ty);
        drawProps(ctx, st, tx, ty);
        drawSigns(ctx, st, tx, ty);
        drawRider(ctx, trans.px - 8 + tx, trans.py - 16 + ty, player.dir, 0);
      } else {
        BC.world.draw(ctx, screen, 0, 0);
        drawBuildings(ctx, screen, 0, 0);
        drawProps(ctx, screen, 0, 0);
        drawDropped(ctx);
        drawCars(ctx, screen, 0, 0);
        drawEntities(ctx, screen);
        drawSigns(ctx, screen, 0, 0);
      }
      // location label (top-center, between the HUD panels)
      const label = trans ? BC.world.screens[trans.toKey].name : screen.name;
      BC.text(ctx, label, BC.W / 2, 34, { color: '#fff', size: 9, align: 'center' });

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
    // people + dogs first (by proximity to the tile in front)
    let fx = player.x, fy = player.y - 2; const d = player.dir;
    if (d === 'left') fx -= 12; else if (d === 'right') fx += 12; else if (d === 'up') fy -= 12; else fy += 8;
    let best = null, bd = 1e9;
    for (const a of (screen.meta.actors || [])) { const dd = Math.hypot(a.x - fx, a.y - fy); if (dd < bd) { bd = dd; best = a; } }
    if (best && bd < 18) { talkActor(best); return; }

    const f = frontTile();
    const inter = screen.meta && screen.meta.interactions && screen.meta.interactions[f.tx + ',' + f.ty];
    if (inter) { inter(BC.game, { screenKey, tx: f.tx, ty: f.ty }); return; }
    const t = screen.tiles[f.ty * screen.w + f.tx];
    if (t === BC.world.T.DOOR) BC.ui.toast("It's locked. (For now.)");
  }

  // the cab needs to know where you've been tonight
  function markVisited(key) {
    const g = BC.game;
    if (!g || !g.run) return;
    g.run.flags.visited = g.run.flags.visited || {};
    g.run.flags.visited[key] = true;
  }

  // pet every animal in one night -> GOOD PERSON (affects nothing; matters completely)
  const ALL_PETS = ['Biscuit', 'Rex', 'Daisy', 'Scout', 'Echo', 'Alley Cat'];
  function markPet(name) {
    const g = BC.game, f = g.run.flags;
    f.petted = f.petted || {};
    if (f.petted[name]) return;
    f.petted[name] = true;
    const n = ALL_PETS.filter((p) => f.petted[p]).length;
    if (n === ALL_PETS.length && !f.goodPerson) {
      f.goodPerson = true;
      BC.ui.toast('* GOOD PERSON: every animal petted tonight *', { good: true });
      BC.audio && BC.audio.sfx('stamp');
      if (BC.fx) BC.fx.hearts(player.x, player.y - 10, 8);
    }
  }

  function talkActor(a) {
    if (a.gig && BC.gigs && BC.gigs[a.gig]) { BC.gigs[a.gig](BC.game, a); return; }
    // lines may be a function of game state (loop-aware dialogue)
    const lines = (typeof a.lines === 'function') ? a.lines(BC.game) : a.lines;
    if (a.type === 'dog') {
      BC.ui.toast('You pet ' + (a.name || 'the dog') + '. Good dog!', { good: true });
      BC.audio && BC.audio.sfx('confirm');
      if (BC.fx) BC.fx.hearts(a.x, a.y - 8);
      a.t = 0.3; a.mvx = 0; a.mvy = 0;
      if (a.leadTo) { a.hx = a.leadTo.x; a.hy = a.leadTo.y; } // Scout trots off toward the well
      markPet(a.name);
      if (lines) BC.ui.say(lines, { speaker: a.name });
    } else if (a.type === 'cat') {
      BC.ui.toast('You pet ' + (a.name || 'the cat') + '. It tolerates this. Briefly.', { good: true });
      BC.audio && BC.audio.sfx('confirm');
      if (BC.fx) BC.fx.hearts(a.x, a.y - 8, 2);
      a.t = 0.3; a.mvx = 0; a.mvy = 0;
      markPet(a.name);
      if (lines) BC.ui.say(lines, { speaker: a.name });
    } else {
      BC.ui.say(lines || ['Lovely night for it.'], { speaker: a.name || 'Townsperson' });
    }
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

  function drawRider(ctx, x, y, dir, frame) {
    const veh = BC.game.run.vehicle;
    // lift the rider so the vehicle (deck/wheels/handlebar) reads clearly beneath
    if (veh === 'scooter') { BC.gfx.scooter(ctx, x, y, dir); BC.gfx.actor(ctx, x, y - 4, dir, frame, player.colors); }
    else if (veh === 'bike') { BC.gfx.bike(ctx, x, y, dir); BC.gfx.actor(ctx, x, y - 3, dir, frame, player.colors); }
    else BC.gfx.actor(ctx, x, y, dir, frame, player.colors);
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
        BC.rect(ctx, x + 1, y + 16, 14, 2, 'rgba(0,0,0,0.3)'); // ground pad
        BC.gfx.scooter(ctx, x, y - 1, 'right');                // a parked rental scooter
        BC.gfx.px(ctx, x + 13, y, 1, 4, '#7ad0ff');           // app beacon
      } else if (pr.type === 'well') {
        BC.rect(ctx, x + 1, y + 17, 14, 2, 'rgba(0,0,0,0.25)');   // ground shadow
        BC.rect(ctx, x + 2, y + 8, 12, 8, '#8a8a92');             // stone base
        BC.rect(ctx, x + 2, y + 8, 12, 2, '#a4a4ac');
        BC.rect(ctx, x + 4, y + 10, 8, 5, '#15151c');             // dark opening
        BC.rect(ctx, x + 3, y - 2, 2, 11, '#6b4a2a');             // posts
        BC.rect(ctx, x + 11, y - 2, 2, 11, '#6b4a2a');
        BC.rect(ctx, x, y - 6, 16, 5, '#7a3030');                 // roof
        BC.rect(ctx, x, y - 6, 16, 1, '#9a4444');
        BC.rect(ctx, x + 6, y + 1, 4, 3, '#5a3a20');              // bucket
      } else if (pr.type === 'cab') {
        BC.rect(ctx, x + 5, y + 14, 8, 2, 'rgba(0,0,0,0.25)');  // shadow
        BC.rect(ctx, x + 7, y + 4, 2, 11, '#8a8a92');            // pole
        BC.rect(ctx, x + 1, y - 2, 14, 8, '#e8c22a');            // yellow sign
        BC.rect(ctx, x + 1, y - 2, 14, 1, '#fff0a0');
        BC.text(ctx, 'CAB', x + 8, y - 1, { size: 7, align: 'center', color: '#1a1a1a', shadow: false });
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

  // the item you lost in a blackout, waiting on its tile (with a come-get-me blink)
  function drawDropped(ctx) {
    const dr = BC.game.meta.dropped;
    if (!dr || dr.key !== screenKey) return;
    const x = dr.tx * 16, y = dr.ty * 16;
    BC.rect(ctx, x + 2, y + 12, 12, 2, 'rgba(0,0,0,0.25)');
    if (dr.item === 'bike') BC.gfx.bike(ctx, x, y - 2, 'right');
    else {
      BC.rect(ctx, x + 4, y + 5, 8, 7, '#9a6a3a');   // a small parcel
      BC.rect(ctx, x + 4, y + 8, 8, 1, '#6a4a26');
      BC.rect(ctx, x + 7, y + 5, 2, 7, '#e8d27a');
    }
    if (((BC.now || 0) % 0.9) < 0.45) BC.text(ctx, '!', x + 13, y - 6, { color: '#ffe27a', size: 8 });
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

  function drawBuildings(ctx, scr, ox, oy) {
    const bs = scr.meta && scr.meta.buildings; if (!bs) return;
    for (const b of bs) drawBuilding(ctx, b, ox, oy);
  }

  function drawBuilding(ctx, b, ox, oy) {
    const R = (x, y, w, h, c) => BC.rect(ctx, x, y, w, h, c);
    const px = ox + b.x * 16, py = oy + b.y * 16, W = b.w * 16, H = b.h * 16, ext = b.ext;
    R(px + 2, py + H - 1, W, 3, 'rgba(0,0,0,0.18)');         // ground shadow
    R(px, py + 9, W, H - 9, ext.wall);                       // wall
    R(px, py + 9, W, 2, 'rgba(255,255,255,0.10)');
    R(px, py + H - 3, W, 3, 'rgba(0,0,0,0.22)');
    R(px, py + 9, 2, H - 9, 'rgba(0,0,0,0.10)');
    R(px + W - 2, py + 9, 2, H - 9, 'rgba(0,0,0,0.18)');
    R(px - 3, py - 2, W + 6, 12, ext.roof);                  // roof overhang
    R(px - 3, py - 2, W + 6, 3, 'rgba(255,255,255,0.16)');
    R(px - 3, py + 8, W + 6, 2, 'rgba(0,0,0,0.25)');
    drawSign(ctx, ext, px, py + 10, W);                     // stylized sign on the facade
    const nf = BC.world.nightFactor();
    [px + 4, px + W - 12].forEach((wx, i) => {              // windows below the sign
      const lit = nf > 0.4 || i === 1;
      R(wx, py + 24, 8, 6, lit ? '#ffe27a' : '#bfe0ee');
      R(wx, py + 24, 8, 1, 'rgba(0,0,0,0.4)');
    });
    const dW = 12, dH = 14, dX = px + W / 2 - dW / 2, dY = (b.dir === 'down') ? py + H - dH : py + 9;
    R(dX - 1, dY - 1, dW + 2, dH + 1, '#2a1c10');           // door
    R(dX, dY, dW, dH, ext.door);
    R(dX, dY, dW, 2, 'rgba(255,255,255,0.12)');
    R(dX + dW - 3, dY + dH / 2, 2, 2, '#e8d27a');
    drawDecor(ctx, ext.decor, px, py, W, H);
  }

  // sign styling keyed off the building's decor (i.e., its bar type)
  const SIGN = {
    neon:    { bg: '#16121e', fg: '#5ad0ff', glow: '#1aa3d8' },
    snow:    { bg: '#7a1818', fg: '#ffffff', glow: '#e33b3b' },
    diner:   { bg: '#1a1a22', fg: '#ff6b6b', glow: '#ffd166' },
    awning:  { bg: '#2a1018', fg: '#ffe27a', glow: 0 },
    lantern: { bg: '#3a2616', fg: '#ffd9a0', glow: 0 },
    fridge:  { bg: '#3a3a32', fg: '#cfcfc0', glow: 0 },
    spiral:  { bg: '#241038', fg: '#d09aff', glow: '#7a3ad0' },
    column:  { bg: '#161636', fg: '#ffe27a', glow: 0 },
    stone:   { bg: '#2a2a32', fg: '#cfd2dd', glow: 0 },
    pennant: { bg: '#16243a', fg: '#9ed0ff', glow: 0 },
    home:    { bg: '#3a2616', fg: '#ffd9a0', glow: 0 }
  };
  function drawSign(ctx, ext, px, y, W) {
    const st = SIGN[ext.decor] || { bg: '#0a0a14', fg: '#ffe27a', glow: 0 };
    const cx = px + W / 2;
    BC.rect(ctx, px + 2, y, W - 4, 9, st.bg);
    BC.rect(ctx, px + 2, y, W - 4, 1, 'rgba(255,255,255,0.18)');
    BC.rect(ctx, px + 2, y + 8, W - 4, 1, 'rgba(0,0,0,0.35)');
    if (st.glow) {
      const on = !(BC.now && Math.sin(BC.now * 9 + px * 0.3) > 0.95); // occasional neon flicker
      ctx.globalAlpha = on ? 1 : 0.4;
      BC.text(ctx, ext.sign, cx, y + 1, { size: 7, align: 'center', color: st.fg, shadowColor: st.glow });
      ctx.globalAlpha = 1;
    } else {
      BC.text(ctx, ext.sign, cx, y + 1, { size: 7, align: 'center', color: st.fg, shadow: false });
    }
  }

  function drawDecor(ctx, d, x, y, W, H) {
    const R = (a, b, c, e, f) => BC.rect(ctx, a, b, c, e, f);
    if (d === 'snow') {
      R(x - 4, y - 4, W + 8, 5, '#eef5ff'); R(x - 4, y + 1, W + 8, 1, '#dfeaf5');
      const lc = ['#ff5a5a', '#ffe27a', '#7ed07e', '#7ad0ff'];
      for (let i = 0; i < W; i += 7) R(x + i, y + 9, 2, 2, lc[(i / 7) % 4 | 0]);
    } else if (d === 'neon') { R(x + 2, y + 12, W - 4, 2, '#ff5ab0'); R(x + 2, y + 12, W - 4, 1, '#ffd0ec'); }
    else if (d === 'pennant') { const pc = ['#ff5a5a', '#5a9aff', '#ffe27a']; for (let i = 0; i < W; i += 8) { R(x + i, y - 2, 6, 3, pc[(i / 8) % 3 | 0]); } }
    else if (d === 'awning') { for (let i = 0; i < W; i += 6) { R(x + i, y + 10, 3, 4, '#dcd4c4'); R(x + i + 3, y + 10, 3, 4, '#7a3040'); } }
    else if (d === 'stone') { for (let r = 0; r < 3; r++) for (let cc = 0; cc < W - 4; cc += 11) R(x + cc + (r % 2 ? 5 : 0), y + 14 + r * 5, 9, 4, 'rgba(0,0,0,0.10)'); }
    else if (d === 'column') { R(x + 3, y + 11, 3, H - 13, '#cfd2dd'); R(x + W - 6, y + 11, 3, H - 13, '#cfd2dd'); }
    else if (d === 'fridge') { R(x + 5, y + 15, 8, 9, '#e8e8ee'); R(x + 11, y + 18, 1, 3, '#888'); }
    else if (d === 'diner') { R(x + 2, y + 9, W - 4, 2, '#9adfff'); R(x + W / 2 - 9, y - 10, 18, 7, '#222'); BC.text(ctx, 'EAT', x + W / 2, y - 9, { size: 7, align: 'center', color: '#ff6b6b', shadow: false }); }
    else if (d === 'spiral') { R(x + W / 2 - 4, y + 14, 8, 8, '#1a0e26'); R(x + W / 2 - 2, y + 16, 4, 4, '#b07ad0'); R(x + W / 2 - 1, y + 17, 2, 2, '#1a0e26'); }
    else if (d === 'home') { R(x + W / 2 - 5, y + H - 2, 10, 2, '#7a4a3a'); R(x + 2, y + H - 7, 3, 5, '#3a7d44'); }
    else if (d === 'lantern') { R(x + W - 5, y + 12, 3, 4, '#ffe27a'); R(x + W - 5, y + 11, 3, 1, '#222'); }
  }

  function drawCars(ctx, scr, ox, oy) {
    for (const c of (scr.meta.cars || [])) BC.gfx.car(ctx, ox + c.x, oy + c.y, c.dir, c.color);
  }

  function drawEntities(ctx, scr) {
    const list = [{ y: player.y, player: true }];
    for (const a of (scr.meta.actors || [])) list.push({ y: a.y, a });
    list.sort((p, q) => p.y - q.y);
    for (const e of list) {
      if (e.player) drawRider(ctx, player.x - 8, player.y - 16, player.dir, player.frame);
      else if (e.a.type === 'dog' || e.a.type === 'cat') BC.gfx.dog(ctx, e.a.x - 8, e.a.y - 16, e.a.dir, e.a.frame, e.a.colors);
      else BC.gfx.actor(ctx, e.a.x - 8, e.a.y - 16, e.a.dir, e.a.frame, e.a.colors);
    }
  }

  function initAmbient(scr) {
    if (scr._amb) return;
    scr._amb = true;
    const colors = ['#d24', '#39c', '#7a7', '#ca5', '#849', '#c84'];
    scr.meta.cars = (!scr.meta.throughRoad || scr.meta.park) ? [] : [
      { x: -50 - Math.random() * 140, y: 109, dir: 'right', color: colors[(Math.random() * colors.length) | 0], speed: 26 + Math.random() * 16 },
      { x: BC.W + 30 + Math.random() * 140, y: 121, dir: 'left', color: colors[(Math.random() * colors.length) | 0], speed: 24 + Math.random() * 16 }
    ];
    (scr.meta.actors || []).forEach(a => { a.t = Math.random() * 2; a.dir = a.dir || 'down'; a.frame = 0; a.hx = a.x; a.hy = a.y; a.mvx = 0; a.mvy = 0; a.anim = 0; });
  }

  function updateAmbient(dt, scr) {
    initAmbient(scr);
    for (const c of scr.meta.cars) {
      c.x += (c.dir === 'right' ? 1 : -1) * c.speed * dt;
      if (c.dir === 'right' && c.x > BC.W + 30) c.x = -54;
      if (c.dir === 'left' && c.x < -54) c.x = BC.W + 30;
    }
    for (const a of (scr.meta.actors || [])) {
      a.t -= dt;
      const far = Math.hypot(a.x - a.hx, a.y - a.hy) > 40;
      if (far) {
        // head toward home / lead target
        const ang = Math.atan2(a.hy - a.y, a.hx - a.x);
        a.mvx = Math.cos(ang); a.mvy = Math.sin(ang);
        a.dir = Math.abs(a.mvx) > Math.abs(a.mvy) ? (a.mvx > 0 ? 'right' : 'left') : (a.mvy > 0 ? 'down' : 'up');
        a.t = 0.4;
      } else if (a.t <= 0) {
        a.t = 0.8 + Math.random() * 2.2;
        if (Math.random() < 0.4) { a.mvx = 0; a.mvy = 0; }
        else { const D = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']][(Math.random() * 4) | 0]; a.mvx = D[0]; a.mvy = D[1]; a.dir = D[2]; }
      }
      const sp = a.type === 'dog' ? 24 : 15;
      const nx = a.x + a.mvx * sp * dt, ny = a.y + a.mvy * sp * dt;
      if (nx > 8 && nx < BC.W - 8 && ny > 20 && ny < BC.H - 6 && !BC.solidBox(scr, { x: nx - 4, y: ny - 4, w: 8, h: 6 })) { a.x = nx; a.y = ny; }
      else { a.mvx = 0; a.mvy = 0; if (far) a.t = 0.6; }
      if (a.mvx || a.mvy) { a.anim += dt * 6; a.frame = (a.anim | 0) & 1; } else a.frame = 0;
    }
  }

  BC.overworld = { interactFront, frontTile, placeSafe, markPet };

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
