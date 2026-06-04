// World: tile definitions, screen builder, and the overworld map of screens.
(function () {
  const BC = window.BC || (window.BC = {});

  const T = {
    FLOOR: 0, WALL: 1, RUG: 2, DOOR: 3, GRASS: 4, ROAD: 5,
    SIDEWALK: 6, BUILDING: 7, TREE: 8, WATER: 9, COUNTER: 10,
    PATH: 11, FENCE: 12, HEDGE: 13, PROP: 14
  };
  const SOLID = new Set([T.WALL, T.BUILDING, T.TREE, T.WATER, T.COUNTER, T.FENCE, T.HEDGE, T.PROP]);

  const LEGEND = {
    '#': T.WALL, '.': T.FLOOR, ',': T.RUG, 'D': T.DOOR, 'd': T.DOOR, 'X': T.DOOR,
    'B': T.BUILDING, 'S': T.SIDEWALK, 'R': T.ROAD, 'g': T.GRASS,
    'T': T.TREE, '~': T.WATER, 'C': T.COUNTER, '@': T.GRASS,
    'p': T.PATH, 'r': T.ROAD, 'f': T.FENCE, 'h': T.HEDGE
  };

  function hash(tx, ty) {
    let h = (tx * 73856093) ^ (ty * 19349663);
    return (h >>> 0);
  }

  // distinct building facades, picked per ~quadrant so each building reads differently
  const FACADES = [
    { wall: '#a85a4a', trim: '#7a4636', win: '#cfe6f0' }, // brick red
    { wall: '#c6ac7a', trim: '#9c8255', win: '#eef2e2' }, // tan stucco
    { wall: '#6f82a4', trim: '#54627e', win: '#e2ecf4' }, // blue-gray
    { wall: '#7f9070', trim: '#5f6e52', win: '#eef2df' }, // sage
    { wall: '#9070a0', trim: '#6e5470', win: '#f2e6f2' }  // mauve
  ];

  // 0 = daytime, 1 = full night — drives window lights and the sky tint
  function nightFactor() {
    const g = BC.game;
    if (!g || !g.run) return 0;
    return Math.max(0, Math.min(1, (g.run.minutes - 150) / 150));
  }

  function drawTile(ctx, type, x, y, tx, ty) {
    const h = hash(tx, ty);
    switch (type) {
      case T.GRASS:
        gfx(ctx, x, y, '#5aa45f');
        if (h % 4 === 0) gfx(ctx, x + (h % 12), y + (h % 10), '#4d9152', 2, 1);
        if (h % 6 === 0) gfx(ctx, x + (h % 9) + 2, y + (h % 8) + 3, '#6fbf6f', 1, 1);
        if (h % 11 === 0) { // little flowers
          const fc = ['#f2d24a', '#f06a8a', '#ffffff'][h % 3];
          gfx(ctx, x + 3 + (h % 8), y + 3 + (h % 7), fc, 2, 2);
        }
        break;
      case T.ROAD:
        gfx(ctx, x, y, '#56565f');
        if (h % 3 === 0) gfx(ctx, x + (h % 13), y + (h % 12), '#4a4a52', 2, 1);
        if (h % 6 === 0) gfx(ctx, x + (h % 10), y + (h % 10), '#3e3e46', 3, 1);
        if ((tx + ty) % 4 === 0) gfx(ctx, x + 6, y + 7, '#c9b34a', 4, 2); // lane dash
        break;
      case T.SIDEWALK:
        gfx(ctx, x, y, '#bdb9b0');
        gfx(ctx, x, y, '#a9a59c', 16, 1);
        gfx(ctx, x, y, '#a9a59c', 1, 16);
        if (h % 9 === 0) gfx(ctx, x + 4, y + 5, '#9a968d', 8, 6);   // grate
        if (h % 13 === 0) gfx(ctx, x + (h % 9) + 2, y + (h % 9) + 2, '#a8a49b', 2, 2);
        break;
      case T.PATH:
        gfx(ctx, x, y, '#cbb78a');
        if (h % 3 === 0) gfx(ctx, x + (h % 12), y + (h % 11), '#bda878', 2, 1);
        if (h % 7 === 0) gfx(ctx, x + (h % 10), y + (h % 9), '#d8c79c', 2, 1);
        break;
      case T.FENCE:
        gfx(ctx, x, y, '#5aa45f');
        gfx(ctx, x, y + 6, '#7a5630', 16, 2);
        gfx(ctx, x + 1, y + 2, '#8a6238', 2, 10);
        gfx(ctx, x + 7, y + 2, '#8a6238', 2, 10);
        gfx(ctx, x + 13, y + 2, '#8a6238', 2, 10);
        break;
      case T.HEDGE:
        gfx(ctx, x, y, '#2f7a3f');
        gfx(ctx, x + 1, y + 1, '#3c9050', 14, 13);
        if (h % 2 === 0) gfx(ctx, x + (h % 11) + 1, y + (h % 10) + 1, '#4aa85e', 2, 2);
        break;
      case T.BUILDING: {
        const f = FACADES[hash(Math.floor(tx / 7), Math.floor(ty / 5)) % FACADES.length];
        gfx(ctx, x, y, f.wall);
        gfx(ctx, x, y, f.trim, 16, 2);
        gfx(ctx, x, y + 14, 'rgba(0,0,0,0.16)', 16, 2);
        if ((tx + ty) % 2 === 0) {
          const nf = nightFactor();
          [3, 9].forEach(wx => {
            const lit = ((hash(tx * 5 + wx, ty * 5) >> 2) % 100) < (10 + 72 * nf);
            gfx(ctx, x + wx, y + 4, lit ? '#ffe27a' : f.win, 4, 5);
            gfx(ctx, x + wx, y + 3, 'rgba(20,16,28,0.6)', 4, 1);
          });
        }
        break;
      }
      case T.TREE:
        gfx(ctx, x, y, '#5aa45f');
        gfx(ctx, x + 7, y + 9, '#7a5630', 2, 6);
        gfx(ctx, x + 3, y + 1, '#2f8a44', 10, 9);
        gfx(ctx, x + 5, y + 2, '#46a85a', 6, 5);
        gfx(ctx, x + 6, y + 3, '#6fc97a', 3, 3);
        break;
      case T.WATER:
        gfx(ctx, x, y, '#2f86c0');
        if (h % 4 === 0) gfx(ctx, x + (h % 11), y + (h % 12), '#5aa6e0', 3, 1);
        if (h % 6 === 0) gfx(ctx, x + (h % 9), y + (h % 10), '#2a72a8', 2, 1);
        break;
      case T.WALL:
        gfx(ctx, x, y, '#4a4a5a');
        gfx(ctx, x, y + 14, '#3a3a48', 16, 2);
        break;
      case T.FLOOR:
      case T.PROP:
        gfx(ctx, x, y, '#3a3340');
        if ((tx + ty) % 2 === 0) gfx(ctx, x, y, '#342e3a');
        break;
      case T.RUG:
        gfx(ctx, x, y, '#7a2f3f');
        gfx(ctx, x + 2, y + 2, '#9a3f52', 12, 12);
        break;
      case T.DOOR:
        gfx(ctx, x, y, '#4a3a2a');
        gfx(ctx, x + 2, y + 1, '#8a5a30', 12, 15);
        gfx(ctx, x + 2, y + 1, '#9a6a3a', 12, 2);
        gfx(ctx, x + 10, y + 8, '#e8d27a', 1, 2);
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

  // ---- town layout (spread-out, Pokemon-style lots) ----------------------
  // themed building exteriors, keyed by bar id
  const EXT = {
    tipsy_newt: { wall: '#8a6a4a', roof: '#3a6a4a', door: '#5a3a20', decor: 'lantern', sign: 'THE TIPSY NEWT' },
    hail_mary: { wall: '#6a7a9a', roof: '#33425e', door: '#2a3a5a', decor: 'pennant', sign: 'THE HAIL MARY' },
    off_key_west: { wall: '#1f9a9a', roof: '#e0a040', door: '#0a5a5a', decor: 'neon', sign: 'OFF-KEY WEST' },
    pour_decisions: { wall: '#7a3040', roof: '#3a1828', door: '#2a1018', decor: 'awning', sign: 'POUR DECISIONS' },
    sticky_floor: { wall: '#5a5a52', roof: '#3a3a34', door: '#222', decor: 'neon', sign: 'THE STICKY FLOOR' },
    cellar_door: { wall: '#80808c', roof: '#565662', door: '#3a2a1a', decor: 'stone', sign: 'THE CELLAR DOOR' },
    witz_end: { wall: '#3a3a6a', roof: '#26264a', door: '#1a1a3a', decor: 'column', sign: 'WITZ END' },
    reggies: { wall: '#9a9a8a', roof: '#6a6a5a', door: '#5a5a4a', decor: 'fridge', sign: "REGGIE'S FRIDGES" },
    sleigh: { wall: '#aa3030', roof: '#2a7a3a', door: '#6a1818', decor: 'snow', sign: "SLEIGH IT AIN'T SO" },
    sobering_thoughts: { wall: '#c4c4cc', roof: '#d04040', door: '#444', decor: 'diner', sign: 'SOBERING THOUGHTS' },
    deja_brew: { wall: '#6a4a7a', roof: '#3a2450', door: '#2a163a', decor: 'spiral', sign: 'DEJA BREW' },
    home: { wall: '#c6ac7a', roof: '#8a5a4a', door: '#5a3a20', decor: 'home', sign: 'HOME' },
    store: { wall: '#e2e2ea', roof: '#2a9a5a', door: '#2a7a4a', decor: 'neon', sign: 'CORNER STORE' }
  };

  function blankGrid() { const g = []; for (let y = 0; y < 15; y++) g.push('gggggggggggggggg'.split('')); return g; }
  function gridRows(g) { return g.map(r => r.join('')); }
  function bldRect(q) {
    switch (q) {
      case 'TL': return { x: 1, y: 2, w: 5, h: 3, dx: 3, dy: 4, dir: 'down' };
      case 'TR': return { x: 10, y: 2, w: 5, h: 3, dx: 12, dy: 4, dir: 'down' };
      case 'BL': return { x: 1, y: 10, w: 5, h: 3, dx: 3, dy: 10, dir: 'up' };
      case 'BR': return { x: 10, y: 10, w: 5, h: 3, dx: 12, dy: 10, dir: 'up' };
    }
  }

  // build an open lot: grass + a plus path/road, tree borders with openings only
  // where a neighbor screen exists, themed buildings in the quadrants.
  function lot(opts) {
    const g = blankGrid();
    const E = opts.exits || {};
    // central junction, then roads/paths extend ONLY toward real exits (no dead ends)
    for (let x = 6; x <= 9; x++) { g[7][x] = 'r'; g[8][x] = 'r'; }
    for (let y = 6; y <= 9; y++) { if (g[y][7] !== 'r') { g[y][7] = 'p'; g[y][8] = 'p'; } }
    if (E.up) for (let y = 0; y < 6; y++) { g[y][7] = 'p'; g[y][8] = 'p'; }
    if (E.down) for (let y = 10; y < 15; y++) { g[y][7] = 'p'; g[y][8] = 'p'; }
    if (E.left) for (let x = 0; x < 6; x++) { g[7][x] = 'r'; g[8][x] = 'r'; }
    if (E.right) for (let x = 10; x < 16; x++) { g[7][x] = 'r'; g[8][x] = 'r'; }
    // tree border everywhere except the exit openings (physical block on dead ends)
    for (let x = 0; x < 16; x++) { g[0][x] = (E.up && (x === 7 || x === 8)) ? 'p' : 'T'; g[14][x] = (E.down && (x === 7 || x === 8)) ? 'p' : 'T'; }
    for (let y = 0; y < 15; y++) { g[y][0] = (E.left && (y === 7 || y === 8)) ? 'r' : 'T'; g[y][15] = (E.right && (y === 7 || y === 8)) ? 'r' : 'T'; }
    const builds = [];
    (opts.buildings || []).forEach(b => {
      const r = bldRect(b.quad);
      for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) g[yy][xx] = 'B';
      g[r.dy][r.dx] = 'D';
      if (r.dir === 'down') { for (let yy = r.dy + 1; yy <= 6; yy++) g[yy][r.dx] = 'p'; }
      else { for (let yy = 9; yy < r.dy; yy++) g[yy][r.dx] = 'p'; }
      builds.push(Object.assign({ id: b.id }, r));
    });
    (opts.water || []).forEach(([x, y]) => { if (g[y][x] === 'g') g[y][x] = '~'; });
    (opts.trees || []).forEach(([x, y]) => { if (g[y][x] === 'g') g[y][x] = 'T'; });
    if (opts.spawn) g[opts.spawn[1]][opts.spawn[0]] = '@';
    return { rows: gridRows(g), builds };
  }

  function cornerStore(g) {
    BC.ui.choose('CORNER STORE   (you have $' + g.run.cash + ')', [
      'Energy Drink - $4  (sober up + get wired)',
      'Bottled Water - $1  (a small sober-up)',
      'Leave'
    ], (i) => {
      if (i === 0) {
        if (g.run.cash >= 4) { g.run.cash -= 4; g.eat(24); g.run.energized = 10; BC.ui.toast('ZAP! Wired and a little less drunk.', { good: true }); BC.audio && BC.audio.sfx('confirm'); }
        else BC.ui.toast('"No cash, no caffeine, pal."');
      } else if (i === 1) {
        if (g.run.cash >= 1) { g.run.cash -= 1; g.eat(10); BC.ui.toast('Hydration. Responsible of you.'); BC.audio && BC.audio.sfx('confirm'); }
        else BC.ui.toast('"That one\'s not free either, pal."');
      }
    });
  }

  function speakeasyGate(g) {
    if (g.tipsyTier() < 1) { BC.ui.toast('"Reggie\'s Reliable Refrigeration." Closed. Smells of freon and secrets.'); return; }
    if (!g.knows('password')) { BC.ui.say(['A slot slides open. "Password?"', '...you\'ve got nothing. Maybe somebody tipsy knows it.'], { speaker: 'The Slot' }); return; }
    BC.enterBar('speakeasy');
  }
  function addScooter(s, tx, ty) {
    s.meta.props.push({ tx, ty, type: 'scooter' });
    s.meta.interactions[tx + ',' + ty] = (g) => { g.rentScooter(); BC.ui.toast('Scooter unlocked: ' + g.run.scooterPct + '% battery (yikes).'); BC.audio && BC.audio.sfx('confirm'); };
  }
  function addBike(s, tx, ty) {
    s.meta.props.push({ tx, ty, type: 'bike' });
    s.meta.interactions[tx + ',' + ty] = (g) => {
      if (!g.hasItem('bike')) { g.giveItem('bike'); BC.ui.toast('A free bike! Yours for good now. (Press X to ride.)', { good: true }); BC.audio && BC.audio.sfx('stamp'); }
      else BC.ui.toast('An empty bike rack. You already have a bike.');
    };
  }

  function makeScreen(S, key, name, opts) {
    const { rows, builds } = lot(opts);
    const E = opts.exits || {};
    const s = fromAscii(name, rows, { spawnTile: T.GRASS, meta: { interactions: {}, props: [], signs: [], buildings: [], actors: opts.actors || [], park: !!opts.park, throughRoad: !!(E.left && E.right) } });
    builds.forEach(b => {
      const ext = EXT[b.id] || EXT.home;
      s.meta.buildings.push({ x: b.x, y: b.y, w: b.w, h: b.h, dx: b.dx, dy: b.dy, dir: b.dir, ext });
      const key2 = b.dx + ',' + b.dy;
      if (b.id === 'reggies') s.meta.interactions[key2] = speakeasyGate;
      else if (b.id === 'store') s.meta.interactions[key2] = cornerStore;
      else if (b.id === 'home') s.meta.interactions[key2] = () => BC.ui.toast("Your place. The night's still young.");
      else s.meta.interactions[key2] = () => BC.enterBar(b.id);
    });
    S[key] = s;
    return s;
  }

  function buildTown(world) {
    const S = world.screens;
    const X = (u, d, l, r) => ({ up: u, down: d, left: l, right: r });

    makeScreen(S, '0,0', 'Maple Street', { exits: X(0, 1, 0, 1), spawn: [4, 11], buildings: [{ quad: 'TL', id: 'tipsy_newt' }, { quad: 'TR', id: 'home' }], trees: [[2, 12], [13, 12]], actors: [
      { x: 168, y: 198, type: 'person', colors: { shirt: '#2a6ad0' }, name: 'Neighbor', lines: ['Big night ahead? The bars close at 2 AM sharp.', 'Pace yourself. ...Or don\'t. Not my business.'] },
      { x: 96, y: 206, type: 'dog', colors: { body: '#caa06a' }, name: 'Biscuit' }
    ] });
    makeScreen(S, '1,0', 'Downtown', { exits: X(0, 1, 1, 1), buildings: [{ quad: 'TL', id: 'hail_mary' }, { quad: 'TR', id: 'store' }] });
    addScooter(S['1,0'], 6, 11);
    makeScreen(S, '2,0', 'The Strip', { exits: X(0, 1, 1, 0), buildings: [{ quad: 'TL', id: 'off_key_west' }, { quad: 'TR', id: 'pour_decisions' }] });

    makeScreen(S, '0,1', 'Riverside Park', { exits: X(1, 1, 0, 1), park: true, water: [[10, 10], [11, 10], [12, 10], [10, 11], [11, 11], [12, 11], [11, 12]], trees: [[2, 2], [4, 2], [13, 2], [2, 11], [13, 12]], actors: [
      { x: 64, y: 40, type: 'person', colors: { shirt: '#3a9d5a' }, name: 'Jogger', lines: ['On your left! ...Sorry. Force of habit.'] },
      { x: 120, y: 200, type: 'dog', colors: { body: '#5a5a5a' }, name: 'Rex' },
      { x: 200, y: 56, type: 'dog', colors: { body: '#e0c89a', dark: '#b89a6a' }, name: 'Daisy' }
    ] });
    addBike(S['0,1'], 4, 11);
    makeScreen(S, '1,1', 'Old Town', { exits: X(1, 1, 1, 1), buildings: [{ quad: 'TL', id: 'sticky_floor' }, { quad: 'TR', id: 'cellar_door' }] });
    makeScreen(S, '2,1', 'Backstreets', { exits: X(1, 1, 1, 0), buildings: [{ quad: 'TL', id: 'witz_end' }, { quad: 'TR', id: 'reggies' }] });

    makeScreen(S, '0,2', 'Frostgate', { exits: X(1, 0, 0, 1), buildings: [{ quad: 'TL', id: 'sleigh' }], trees: [[11, 3], [13, 4], [11, 11]] });
    makeScreen(S, '1,2', 'Night Market', { exits: X(1, 0, 1, 1), buildings: [{ quad: 'TL', id: 'sobering_thoughts' }] });
    makeScreen(S, '2,2', 'The Fringe', { exits: X(1, 0, 1, 0), buildings: [{ quad: 'TL', id: 'deja_brew' }], actors: [
      { x: 170, y: 200, type: 'person', colors: { shirt: '#6a2a7a', hair: '#211' }, name: '???', lines: ['Have we met? We\'ve met. We\'ll meet again.', '...Loops, man.'] },
      { x: 110, y: 56, type: 'dog', colors: { body: '#8a8a8a' }, name: 'Echo' }
    ] });
  }

  const world = {
    T, SOLID, fromAscii, drawTile, buildTown, nightFactor, EXT,
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
    },

    // interiors: recolor walls/floor/counter per a bar's palette
    drawInterior(ctx, screen, ox, oy, pal) {
      ox = ox || 0; oy = oy || 0; pal = pal || {};
      const wall = pal.wall || '#46465a', floor = pal.floor || '#3a3340', floor2 = pal.floor2 || '#342e3a', counter = pal.counter || '#7a5a3a';
      for (let ty = 0; ty < screen.h; ty++) {
        for (let tx = 0; tx < screen.w; tx++) {
          const t = screen.tiles[ty * screen.w + tx], x = ox + tx * 16, y = oy + ty * 16;
          if (t === T.WALL) { gfx(ctx, x, y, wall); gfx(ctx, x, y, 'rgba(255,255,255,0.06)', 16, 2); gfx(ctx, x, y + 14, 'rgba(0,0,0,0.28)', 16, 2); }
          else if (t === T.FLOOR || t === T.PROP) { gfx(ctx, x, y, floor); if ((tx + ty) % 2 === 0) gfx(ctx, x, y, floor2); }
          else if (t === T.COUNTER) { gfx(ctx, x, y, counter); gfx(ctx, x, y, 'rgba(0,0,0,0.28)', 16, 3); gfx(ctx, x, y, 'rgba(255,255,255,0.08)', 16, 1); }
          else drawTile(ctx, t, x, y, tx, ty);
        }
      }
    }
  };

  BC.world = world;
})();
