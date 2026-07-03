// The Cellar Door: a tiny Sokoban puzzle room. Push kegs onto switches to unlock the exit.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  // Tile type constants (local, never touches BC.world)
  var T = {
    FLOOR:   0,
    WALL:    1,
    SWITCH:  2,  // pressure plate
    DOOR:    3,  // locked door (solid until open)
    EXIT:    4,  // exit tile (walkable)
    KEY:     5,  // bottle-opener key (walkable, picked up on step)
  };

  // 16x15 initial layout — legend:
  //  # = wall,  . = floor,  @ = player start
  //  K = keg,   T = switch target,  D = locked door
  //  J = key tile,  X = exit tile
  //
  // Dividing wall at col 7 with locked door at (7,7).
  // Kegs start at (3,5) and (3,9); switches at (5,5) and (5,9).
  // Solution: push each keg right twice to land on its switch,
  //           door opens, walk through to key (10,7) then exit (13,7).
  var LAYOUT = [
    '################',
    '#......#.......#',
    '#......#.......#',
    '#......#.......#',
    '#......#.......#',
    '#..K.T.#.......#',
    '#......#.......#',
    '#@.....D..J..X.#',
    '#......#.......#',
    '#..K.T.#.......#',
    '#......#.......#',
    '#......#.......#',
    '#......#.......#',
    '#......#.......#',
    '################'
  ];

  // Parse the layout into tile arrays + object positions
  function parseLayout() {
    var tiles = [];           // [ty][tx] = T.*
    var kegs  = [];           // [{tx,ty}]
    var switches = [];        // [{tx,ty}]
    var player = { tx: 1, ty: 8 };
    var keyTile    = null;    // {tx,ty}
    var exitTile   = null;    // {tx,ty}
    var doorTile   = null;    // {tx,ty}

    for (var ty = 0; ty < 15; ty++) {
      var row = LAYOUT[ty] || '';
      tiles[ty] = [];
      for (var tx = 0; tx < 16; tx++) {
        var ch = row[tx] || '.';
        switch (ch) {
          case '#': tiles[ty][tx] = T.WALL;   break;
          case 'K': tiles[ty][tx] = T.FLOOR;  kegs.push({ tx: tx, ty: ty }); break;
          case 'T': tiles[ty][tx] = T.SWITCH; switches.push({ tx: tx, ty: ty }); break;
          case 'D': tiles[ty][tx] = T.DOOR;   doorTile = { tx: tx, ty: ty }; break;
          case 'J': tiles[ty][tx] = T.KEY;    keyTile  = { tx: tx, ty: ty }; break;
          case 'X': tiles[ty][tx] = T.EXIT;   exitTile = { tx: tx, ty: ty }; break;
          case '@': tiles[ty][tx] = T.FLOOR;  player   = { tx: tx, ty: ty }; break;
          default:  tiles[ty][tx] = T.FLOOR;  break;
        }
      }
    }
    return { tiles: tiles, kegs: kegs, switches: switches,
             player: player, keyTile: keyTile, exitTile: exitTile, doorTile: doorTile };
  }

  // Is a tile coordinate solid (wall or locked door)?
  function isSolid(state, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= 16 || ty >= 15) return true;
    var t = state.tiles[ty][tx];
    if (t === T.WALL) return true;
    if (t === T.DOOR && !state.doorOpen) return true;
    return false;
  }

  // Is a tile occupied by a keg?
  function kegAt(kegs, tx, ty) {
    for (var i = 0; i < kegs.length; i++) {
      if (kegs[i].tx === tx && kegs[i].ty === ty) return i;
    }
    return -1;
  }

  // Check win condition: both switches covered by kegs
  function checkSwitches(state) {
    var count = 0;
    for (var s = 0; s < state.switches.length; s++) {
      var sw = state.switches[s];
      if (kegAt(state.kegs, sw.tx, sw.ty) >= 0) count++;
    }
    return count >= state.switches.length;
  }

  // Pixel coordinates for a tile (top-left)
  function tpx(tx) { return tx * 16; }
  function tpy(ty) { return ty * 16; }

  // Draw a stone wall tile
  function drawWall(ctx, px, py) {
    BC.rect(ctx, px, py, 16, 16, '#5a5a6a');
    // mortar lines to make it look like stone blocks
    BC.rect(ctx, px,      py,      16, 1,  '#3a3a48');
    BC.rect(ctx, px,      py + 8,  16, 1,  '#3a3a48');
    BC.rect(ctx, px,      py,      1,  8,  '#3a3a48');
    BC.rect(ctx, px + 8,  py + 8,  1,  8,  '#3a3a48');
    BC.rect(ctx, px + 14, py,      1,  8,  '#3a3a48');
  }

  // Draw a stone floor tile
  function drawFloor(ctx, px, py, tx, ty) {
    var dark = (tx + ty) % 2 === 0;
    BC.rect(ctx, px, py, 16, 16, dark ? '#28283a' : '#2e2e40');
  }

  // Draw a pressure-plate switch tile (lit=covered by keg)
  function drawSwitch(ctx, px, py, lit) {
    BC.rect(ctx, px, py, 16, 16, '#2e2e40');
    if (lit) {
      BC.rect(ctx, px + 2, py + 2, 12, 12, '#b8a020');
      BC.rect(ctx, px + 4, py + 4, 8,  8,  '#ffe040');
    } else {
      BC.rect(ctx, px + 2, py + 2, 12, 12, '#484830');
      BC.rect(ctx, px + 4, py + 4, 8,  8,  '#606040');
    }
    // inset border
    BC.rect(ctx, px + 2, py + 2, 12, 1, '#1a1a28');
    BC.rect(ctx, px + 2, py + 13, 12, 1, '#1a1a28');
    BC.rect(ctx, px + 2, py + 2, 1, 12, '#1a1a28');
    BC.rect(ctx, px + 13, py + 2, 1, 12, '#1a1a28');
  }

  // Draw the locked door tile (bars) or open (passable)
  function drawDoor(ctx, px, py, open) {
    BC.rect(ctx, px, py, 16, 16, open ? '#2e2e40' : '#3a2a1a');
    if (!open) {
      // frame
      BC.rect(ctx, px,      py, 2,  16, '#6a5030');
      BC.rect(ctx, px + 14, py, 2,  16, '#6a5030');
      BC.rect(ctx, px, py,      16, 2,  '#6a5030');
      // bars
      for (var b = 0; b < 3; b++) {
        BC.rect(ctx, px + 4 + b * 3, py + 2, 2, 14, '#8a7050');
      }
      // lock
      BC.rect(ctx, px + 6, py + 6, 4, 4, '#c8a030');
    }
  }

  // Draw the exit tile
  function drawExit(ctx, px, py, unlocked) {
    BC.rect(ctx, px, py, 16, 16, '#2e2e40');
    if (unlocked) {
      BC.rect(ctx, px + 2, py + 2, 12, 12, '#204820');
      BC.rect(ctx, px + 5, py + 5, 6,  6,  '#40c040');
      // arrow up
      BC.rect(ctx, px + 7, py + 3, 2,  6,  '#a0ffa0');
      BC.rect(ctx, px + 5, py + 5, 6,  2,  '#a0ffa0');
    } else {
      BC.rect(ctx, px + 2, py + 2, 12, 12, '#382020');
      BC.rect(ctx, px + 5, py + 5, 6,  6,  '#604040');
    }
  }

  // Draw a keg/barrel
  function drawKeg(ctx, px, py) {
    // body (brown barrel)
    BC.rect(ctx, px + 3, py + 2,  10, 12, '#7a4a20');
    BC.rect(ctx, px + 3, py + 2,  10,  2,  '#9a6030');
    BC.rect(ctx, px + 3, py + 12, 10,  2,  '#9a6030');
    // metal hoops
    BC.rect(ctx, px + 2, py + 4,  12,  2,  '#8a8090');
    BC.rect(ctx, px + 2, py + 10, 12,  2,  '#8a8090');
    // highlight
    BC.rect(ctx, px + 4, py + 3,   2, 10,  '#c07840');
    // cap
    BC.rect(ctx, px + 5, py + 1,   6,  2,  '#6a3a10');
  }

  // Draw the bottle-opener key
  function drawKey(ctx, px, py) {
    // ring part
    BC.rect(ctx, px + 5, py + 4, 6, 5, '#d0a020');
    BC.rect(ctx, px + 6, py + 5, 4, 3, '#2e2e40'); // hole
    // shank
    BC.rect(ctx, px + 7, py + 9, 2, 5, '#d0a020');
    // teeth
    BC.rect(ctx, px + 9, py + 11, 2, 2, '#d0a020');
    BC.rect(ctx, px + 9, py + 13, 2, 1, '#d0a020');
  }

  S.mg_dungeon = {
    enter: function (args) {
      this.barId   = args.barId;
      this.done    = false;
      this.captionTimer = 2.5;
      this.solvedTimer  = 0;
      this._load();
    },

    _load: function () {
      var st = parseLayout();
      this.tiles    = st.tiles;
      this.kegs     = st.kegs;
      this.switches = st.switches;
      this.player   = st.player;
      this.keyTile  = st.keyTile;
      this.exitTile = st.exitTile;
      this.doorTile = st.doorTile;
      this.doorOpen = false;
      this.hasKey   = false;
      this.moveTimer = 0;   // grid-step cooldown
      this.playerDir = 'down';
      this.playerFrame = 0;
      this.animTimer = 0;
    },

    update: function (dt) {
      if (this.done) return;

      if (this.captionTimer > 0) {
        this.captionTimer -= dt;
      }

      // Solved animation
      if (this.solvedTimer > 0) {
        this.solvedTimer -= dt;
        if (this.solvedTimer <= 0) {
          if (!this.done) {
            this.done = true;
            BC.afterMinigame(this.barId, true);
          }
        }
        return;
      }

      // X opens the cellar menu — Z/taps no longer reset (a stray tap wiped progress)
      if (BC.input.pressed('b')) {
        BC.audio && BC.audio.sfx('blip');
        var self = this;
        BC.ui.choose('Kegs looking unpushable?', ['Keep trying', 'Reset the room', 'Leave the cellar'], function (i) {
          if (i === 1) { self._load(); BC.audio && BC.audio.sfx('blip'); }
          else if (i === 2 && !self.done) { self.done = true; BC.afterMinigame(self.barId, false); }
        });
        return;
      }

      // Grid movement with short cooldown to prevent too-fast sliding
      this.moveTimer -= dt;
      if (this.moveTimer > 0) return;

      var dx = 0, dy = 0;
      if (BC.input.down('left'))  { dx = -1; this.playerDir = 'left';  }
      if (BC.input.down('right')) { dx =  1; this.playerDir = 'right'; }
      if (BC.input.down('up'))    { dy = -1; this.playerDir = 'up';    }
      if (BC.input.down('down'))  { dy =  1; this.playerDir = 'down';  }

      if (dx === 0 && dy === 0) return;

      this.moveTimer = 0.14; // seconds between grid steps

      var nx = this.player.tx + dx;
      var ny = this.player.ty + dy;

      if (isSolid(this, nx, ny)) return; // wall or locked door

      // Check for keg at destination
      var ki = kegAt(this.kegs, nx, ny);
      if (ki >= 0) {
        var knx = nx + dx, kny = ny + dy;
        // Can push if destination is not solid and not another keg
        if (!isSolid(this, knx, kny) && kegAt(this.kegs, knx, kny) < 0) {
          this.kegs[ki].tx = knx;
          this.kegs[ki].ty = kny;
          BC.audio && BC.audio.sfx('blip');
          // Check win
          if (checkSwitches(this)) {
            this.doorOpen = true;
            BC.audio && BC.audio.sfx('confirm');
          }
        } else {
          return; // can't push, blocked
        }
      }

      this.player.tx = nx;
      this.player.ty = ny;

      // Animate walk cycle
      this.animTimer += 0.14;
      this.playerFrame = (this.animTimer | 0) & 1;

      // Pick up key
      if (this.keyTile && nx === this.keyTile.tx && ny === this.keyTile.ty) {
        if (this.doorOpen) {
          this.hasKey = true;
          this.keyTile = null;
          BC.audio && BC.audio.sfx('stamp');
        }
      }

      // Reach exit — win (door must be open)
      if (this.exitTile && nx === this.exitTile.tx && ny === this.exitTile.ty) {
        if (this.doorOpen) {
          BC.audio && BC.audio.sfx('confirm');
          this.solvedTimer = 1.8;
        }
      }
    },

    render: function (ctx) {
      // Draw tiles
      for (var ty = 0; ty < 15; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          var px = tpx(tx), py = tpy(ty);
          var tile = this.tiles[ty][tx];

          if (tile === T.WALL) {
            drawWall(ctx, px, py);
          } else if (tile === T.DOOR) {
            drawDoor(ctx, px, py, this.doorOpen);
          } else if (tile === T.EXIT) {
            drawExit(ctx, px, py, this.doorOpen);
          } else if (tile === T.SWITCH) {
            var lit = kegAt(this.kegs, tx, ty) >= 0;
            drawSwitch(ctx, px, py, lit);
          } else {
            drawFloor(ctx, px, py, tx, ty);
          }
        }
      }

      // Key (only if not yet picked up)
      if (this.keyTile) {
        var kx = tpx(this.keyTile.tx), ky = tpy(this.keyTile.ty);
        if (this.doorOpen) {
          // shimmer bg when reachable
          BC.rect(ctx, kx + 1, ky + 1, 14, 14, '#403820');
        }
        drawKey(ctx, kx, ky);
      }

      // Kegs
      for (var i = 0; i < this.kegs.length; i++) {
        drawKeg(ctx, tpx(this.kegs[i].tx), tpy(this.kegs[i].ty));
      }

      // Player (draw on top)
      BC.gfx.actor(ctx,
        tpx(this.player.tx),
        tpy(this.player.ty),
        this.playerDir,
        this.playerFrame,
        { shirt: '#3a6a9a' }
      );

      // HUD caption strip
      if (this.captionTimer > 0) {
        var a = Math.min(1, this.captionTimer);
        ctx.globalAlpha = a;
        BC.panel(ctx, 16, BC.H - 36, BC.W - 32, 28, {});
        BC.text(ctx, '"It\'s dangerous to go alone —', BC.W / 2, BC.H - 31, { color: '#ffe27a', size: 8, align: 'center' });
        BC.text(ctx, 'take this [lager]."', BC.W / 2, BC.H - 20, { color: '#cfe', size: 8, align: 'center' });
        ctx.globalAlpha = 1;
      }

      // Controls hint (bottom strip, only when no caption)
      if (this.captionTimer <= 0 && this.solvedTimer === 0) {
        BC.text(ctx, 'X = menu (reset / leave)', 2, BC.H - 10, { color: '#556', size: 7 });
        if (this.hasKey) {
          BC.text(ctx, 'KEY!', BC.W - 28, BC.H - 10, { color: '#ffe27a', size: 7 });
        }
      }

      // Solved overlay
      if (this.solvedTimer > 0) {
        BC.rect(ctx, 0, 0, BC.W, BC.H, 'rgba(0,0,0,0.45)');
        BC.text(ctx, 'SOLVED!', BC.W / 2, BC.H / 2 - 10, { color: '#7ed07e', size: 18, align: 'center' });
        BC.text(ctx, 'The cellar is yours.', BC.W / 2, BC.H / 2 + 14, { color: '#cfe', size: 9, align: 'center' });
      }
    }
  };
})();
