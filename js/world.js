// World: tile definitions, screen builder, and the overworld map of screens.
(function () {
  const BC = window.BC || (window.BC = {});

  const T = {
    FLOOR: 0, WALL: 1, RUG: 2, DOOR: 3, GRASS: 4, ROAD: 5,
    SIDEWALK: 6, BUILDING: 7, TREE: 8, WATER: 9, COUNTER: 10
  };
  const SOLID = new Set([T.WALL, T.BUILDING, T.TREE, T.WATER, T.COUNTER]);

  const LEGEND = {
    '#': T.WALL, '.': T.FLOOR, ',': T.RUG, 'D': T.DOOR, 'd': T.DOOR, 'X': T.DOOR,
    'B': T.BUILDING, 'S': T.SIDEWALK, 'R': T.ROAD, 'g': T.GRASS,
    'T': T.TREE, '~': T.WATER, 'C': T.COUNTER, '@': T.FLOOR
  };

  function hash(tx, ty) {
    let h = (tx * 73856093) ^ (ty * 19349663);
    return (h >>> 0);
  }

  function drawTile(ctx, type, x, y, tx, ty) {
    const h = hash(tx, ty);
    switch (type) {
      case T.GRASS:
        gfx(ctx, x, y, '#3f7a44');
        if (h % 5 === 0) gfx(ctx, x + (h % 12), y + (h % 10), '#357040', 2, 1);
        if (h % 7 === 0) gfx(ctx, x + (h % 9) + 2, y + (h % 8) + 3, '#4a8a4e', 1, 1);
        break;
      case T.ROAD:
        gfx(ctx, x, y, '#34343d');
        if (h % 3 === 0) gfx(ctx, x + (h % 13), y + (h % 12), '#2c2c34', 2, 1);
        break;
      case T.SIDEWALK:
        gfx(ctx, x, y, '#8b8b95');
        gfx(ctx, x, y, '#7c7c86', 16, 1);
        gfx(ctx, x, y, '#7c7c86', 1, 16);
        break;
      case T.BUILDING:
        gfx(ctx, x, y, '#574a6b');
        gfx(ctx, x, y, '#473b58', 16, 2);
        // windows
        if ((tx + ty) % 2 === 0) {
          const lit = (h % 4 === 0);
          gfx(ctx, x + 3, y + 4, lit ? '#e7cd84' : '#2a2438', 4, 5);
          gfx(ctx, x + 9, y + 4, (h % 3 === 0) ? '#e7cd84' : '#2a2438', 4, 5);
        }
        break;
      case T.TREE:
        gfx(ctx, x, y, '#3f7a44');
        gfx(ctx, x + 7, y + 9, '#6b4a2a', 2, 6);
        gfx(ctx, x + 3, y + 1, '#2f6b39', 10, 9);
        gfx(ctx, x + 5, y + 2, '#3c8048', 6, 5);
        break;
      case T.WATER:
        gfx(ctx, x, y, '#2a6aa0');
        if (h % 4 === 0) gfx(ctx, x + (h % 11), y + (h % 12), '#3f86c0', 3, 1);
        break;
      case T.WALL:
        gfx(ctx, x, y, '#4a4a5a');
        gfx(ctx, x, y + 14, '#3a3a48', 16, 2);
        break;
      case T.FLOOR:
        gfx(ctx, x, y, '#3a3340');
        if ((tx + ty) % 2 === 0) gfx(ctx, x, y, '#342e3a');
        break;
      case T.RUG:
        gfx(ctx, x, y, '#7a2f3f');
        gfx(ctx, x + 2, y + 2, '#9a3f52', 12, 12);
        break;
      case T.DOOR:
        gfx(ctx, x, y, '#3a2f3a');
        gfx(ctx, x + 3, y + 1, '#caa15a', 10, 15);
        gfx(ctx, x + 10, y + 8, '#5a4020', 1, 2);
        break;
      case T.COUNTER:
        gfx(ctx, x, y, '#7a5a3a');
        gfx(ctx, x, y, '#5a4028', 16, 3);
        break;
      default:
        gfx(ctx, x, y, '#202028');
    }
  }

  function gfx(ctx, x, y, c, w, hh) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w || 16, hh || 16);
  }

  function fromAscii(name, rows, opts) {
    opts = opts || {};
    const legend = Object.assign({}, LEGEND, opts.legend || {});
    const w = 16, h = 15;
    const tiles = new Uint8Array(w * h);
    const doors = [];
    let spawn = null, exitDoor = null;
    for (let ty = 0; ty < h; ty++) {
      const row = rows[ty] || '';
      for (let tx = 0; tx < w; tx++) {
        const ch = row[tx] || '.';
        let type = (ch in legend) ? legend[ch] : T.FLOOR;
        if (ch === '@') type = (opts.spawnTile != null ? opts.spawnTile : T.FLOOR);
        tiles[ty * w + tx] = type;
        if (ch === '@') spawn = { x: tx * 16 + 8, y: ty * 16 + 14 };
        if (ch === 'X') exitDoor = { tx, ty };
        if (ch === 'D' || ch === 'd') doors.push({ tx, ty, ch });
      }
    }
    return { name, w, h, tiles, doors, spawn, exitDoor, meta: opts.meta || { interactions: {}, props: [], signs: [] } };
  }

  // ---- town layout -------------------------------------------------------
  function setc(s, i, c) { return s.substring(0, i) + c + s.substring(i + 1); }

  // plus-shaped street block: walkable bands at cols 7-8 (vertical) and rows 7-8 (horizontal),
  // plus sidewalk bands, with buildings filling the quadrants. Edges align across screens.
  function street(opts) {
    opts = opts || {};
    const rows = [
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'RRRRRRRRRRRRRRRR',
      'RRRRRRRRRRRRRRRR',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB'
    ];
    (opts.doors || []).forEach(d => { rows[d.ty] = setc(rows[d.ty], d.tx, 'D'); });
    if (opts.spawn) rows[opts.spawn.ty] = setc(rows[opts.spawn.ty], opts.spawn.tx, '@');
    return rows;
  }

  function park() {
    return [
      'gggggggggggggggg',
      'ggTTgggggggTTggg',
      'gggggggggggggggg',
      'ggggg~~~~~~ggggg',
      'gggg~~~~~~~~gggg',
      'gggg~~~~~~~~gggg',
      'ggggg~~~~~~ggggg',
      'gggggggggggggggg',
      'ggTggggggggggTgg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggTTgggggTTgggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg'
    ];
  }

  function wireBar(s, tx, ty, id, sign) {
    s.meta.interactions[tx + ',' + ty] = () => BC.enterBar(id);
    s.meta.signs.push({ tx, ty, text: sign });
  }
  function addScooter(s, tx, ty) {
    s.meta.props.push({ tx, ty, type: 'scooter' });
    s.meta.interactions[tx + ',' + ty] = (g) => {
      g.rentScooter();
      BC.ui.toast('Scooter unlocked: ' + g.run.scooterPct + '% battery (yikes).');
      BC.audio && BC.audio.sfx('confirm');
    };
  }
  function addBike(s, tx, ty) {
    s.meta.props.push({ tx, ty, type: 'bike' });
    s.meta.interactions[tx + ',' + ty] = (g) => {
      if (!g.hasItem('bike')) {
        g.giveItem('bike');
        BC.ui.toast('A free bike! Yours for good now. (Press X to ride.)', { good: true });
        BC.audio && BC.audio.sfx('stamp');
      } else {
        BC.ui.toast('An empty bike rack. You already have a bike.');
      }
    };
  }

  function wireSpeakeasy(s, tx, ty) {
    s.meta.signs.push({ tx, ty, text: "REGGIE'S FRIDGES" });
    s.meta.interactions[tx + ',' + ty] = (g) => {
      if (g.tipsyTier() < 1) { BC.ui.toast('"Reggie\'s Reliable Refrigeration." Dark. Smells of freon and secrets.'); return; }
      if (!g.knows('password')) { BC.ui.say(['A slot slides open at eye level. "Password?"', '...you\'ve got nothing. Maybe somebody tipsy knows it.'], { speaker: 'The Slot' }); return; }
      BC.enterBar('speakeasy');
    };
  }

  function buildTown(world) {
    const S = world.screens;
    // Row 0 — uptown / early tier
    S['0,0'] = fromAscii('Maple Street', street({ doors: [{ tx: 3, ty: 2 }], spawn: { tx: 8, ty: 4 } }), { spawnTile: T.SIDEWALK });
    wireBar(S['0,0'], 3, 2, 'tipsy_newt', 'THE TIPSY NEWT');

    S['1,0'] = fromAscii('Downtown', street({ doors: [{ tx: 3, ty: 2 }] }));
    wireBar(S['1,0'], 3, 2, 'hail_mary', 'THE HAIL MARY');
    addScooter(S['1,0'], 11, 3);

    S['2,0'] = fromAscii('The Strip', street({ doors: [{ tx: 3, ty: 2 }, { tx: 12, ty: 2 }] }));
    wireBar(S['2,0'], 3, 2, 'off_key_west', 'OFF-KEY WEST');
    wireBar(S['2,0'], 12, 2, 'pour_decisions', 'POUR DECISIONS');

    // Row 1 — midtown / weird tier
    S['0,1'] = fromAscii('Riverside Park', park(), { meta: { interactions: {}, props: [], signs: [], park: true } });
    addBike(S['0,1'], 8, 10);

    S['1,1'] = fromAscii('Old Town', street({ doors: [{ tx: 3, ty: 2 }, { tx: 12, ty: 2 }] }));
    wireBar(S['1,1'], 3, 2, 'sticky_floor', 'THE STICKY FLOOR');
    wireBar(S['1,1'], 12, 2, 'cellar_door', 'THE CELLAR DOOR');

    S['2,1'] = fromAscii('Backstreets', street({ doors: [{ tx: 3, ty: 2 }, { tx: 12, ty: 2 }] }));
    wireBar(S['2,1'], 3, 2, 'witz_end', 'WITZ END');
    wireSpeakeasy(S['2,1'], 12, 2);

    // Row 2 — downtown / bespoke-strange tier
    S['0,2'] = fromAscii('Frostgate', street({ doors: [{ tx: 3, ty: 2 }] }));
    wireBar(S['0,2'], 3, 2, 'sleigh', "SLEIGH IT AIN'T SO");

    S['1,2'] = fromAscii('Night Market', street({ doors: [{ tx: 3, ty: 2 }] }));
    wireBar(S['1,2'], 3, 2, 'sobering_thoughts', 'SOBERING THOUGHTS');

    S['2,2'] = fromAscii('The Fringe', street({ doors: [{ tx: 3, ty: 2 }] }));
    wireBar(S['2,2'], 3, 2, 'deja_brew', 'DEJA BREW');
  }

  const world = {
    T, SOLID, fromAscii, drawTile, buildTown,
    screens: {},
    startKey: '0,0',
    _built: false,

    init() {
      if (this._built) return;
      this._built = true;
      buildTown(this);
    },

    screen(key) { return this.screens[key]; },

    solidAt(screen, tx, ty) {
      if (tx < 0 || ty < 0 || tx >= screen.w || ty >= screen.h) return false;
      return SOLID.has(screen.tiles[ty * screen.w + tx]);
    },

    draw(ctx, screen, ox, oy) {
      ox = ox || 0; oy = oy || 0;
      for (let ty = 0; ty < screen.h; ty++) {
        for (let tx = 0; tx < screen.w; tx++) {
          drawTile(ctx, screen.tiles[ty * screen.w + tx], ox + tx * 16, oy + ty * 16, tx, ty);
        }
      }
    }
  };

  BC.world = world;
})();
