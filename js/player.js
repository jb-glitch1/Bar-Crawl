// Player entity: position (feet-center), 4-directional movement, tile collision.
(function () {
  const BC = window.BC || (window.BC = {});

  function Player(x, y) {
    this.x = x;
    this.y = y;
    this.dir = 'down';
    this.frame = 0;
    this.anim = 0;
    this.moving = false;
    this.speed = 60; // px/sec on foot
    this.vehicle = 'walk';
    this.colors = { shirt: '#c0444f', hair: '#2f2218', pants: '#33384a' };
  }

  // feet hitbox relative to (x,y) which is the center-bottom of the sprite
  Player.prototype.box = function (nx, ny) {
    return { x: (nx == null ? this.x : nx) - 5, y: (ny == null ? this.y : ny) - 6, w: 10, h: 6 };
  };

  Player.prototype.update = function (dt, screen) {
    const I = BC.input;
    let dx = 0, dy = 0;
    if (I.down('left')) dx -= 1;
    if (I.down('right')) dx += 1;
    if (I.down('up')) dy -= 1;
    if (I.down('down')) dy += 1;

    this.moving = !!(dx || dy);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

    if (dx < 0) this.dir = 'left';
    else if (dx > 0) this.dir = 'right';
    else if (dy < 0) this.dir = 'up';
    else if (dy > 0) this.dir = 'down';

    const sp = this.speed * (BC.speedMul ? BC.speedMul() : 1);
    this._moveAxis(dx * sp * dt, 0, screen);
    this._moveAxis(0, dy * sp * dt, screen);

    if (this.moving) {
      this.anim += dt * (this.speed / 9);
      this.frame = (this.anim | 0) & 1;
    } else {
      this.frame = 0;
    }
  };

  Player.prototype._moveAxis = function (mx, my, screen) {
    const nx = this.x + mx, ny = this.y + my;
    const b = this.box(nx, ny);
    if (!solidBox(screen, b)) { this.x = nx; this.y = ny; }
  };

  function solidBox(screen, b) {
    const t0x = Math.floor(b.x / 16), t1x = Math.floor((b.x + b.w - 1) / 16);
    const t0y = Math.floor(b.y / 16), t1y = Math.floor((b.y + b.h - 1) / 16);
    for (let ty = t0y; ty <= t1y; ty++)
      for (let tx = t0x; tx <= t1x; tx++)
        if (BC.world.solidAt(screen, tx, ty)) return true;
    return false;
  }

  BC.Player = Player;
  BC.solidBox = solidBox;
})();
