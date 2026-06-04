// Procedural pixel graphics — no external image assets.
(function () {
  const BC = window.BC || (window.BC = {});
  const gfx = {};

  function px(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w, h);
  }
  gfx.px = px;

  // Draw a 16x16 humanoid actor with top-left at (x,y).
  // dir: 'up'|'down'|'left'|'right', frame: walk-cycle index, col: palette overrides.
  gfx.actor = function (ctx, x, y, dir, frame, col) {
    const C = Object.assign({
      skin: '#e8b890', hair: '#3a2a1f', shirt: '#c0444f',
      pants: '#2a3040', shoe: '#15161d', eye: '#1a1a22'
    }, col || {});
    const f = (frame | 0) & 1;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 15.5, 5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs + walk-bob shoes
    px(ctx, x + 5, y + 12, 2, 3, C.pants);
    px(ctx, x + 9, y + 12, 2, 3, C.pants);
    px(ctx, x + 5, y + 14 + (f ? 0 : 1), 2, 1, C.shoe);
    px(ctx, x + 9, y + 14 + (f ? 1 : 0), 2, 1, C.shoe);

    // body + arms
    px(ctx, x + 4, y + 7, 8, 5, C.shirt);
    px(ctx, x + 3, y + 7, 1, 4, C.shirt);
    px(ctx, x + 12, y + 7, 1, 4, C.shirt);
    px(ctx, x + 3, y + 11, 1, 1, C.skin);
    px(ctx, x + 12, y + 11, 1, 1, C.skin);

    // head
    px(ctx, x + 4, y + 2, 8, 6, C.skin);
    px(ctx, x + 4, y + 1, 8, 2, C.hair);
    if (dir === 'down') {
      px(ctx, x + 4, y + 2, 2, 2, C.hair);
      px(ctx, x + 10, y + 2, 2, 2, C.hair);
      px(ctx, x + 6, y + 5, 1, 1, C.eye);
      px(ctx, x + 9, y + 5, 1, 1, C.eye);
    } else if (dir === 'up') {
      px(ctx, x + 4, y + 2, 8, 3, C.hair);
    } else if (dir === 'left') {
      px(ctx, x + 4, y + 2, 3, 4, C.hair);
      px(ctx, x + 6, y + 5, 1, 1, C.eye);
    } else if (dir === 'right') {
      px(ctx, x + 9, y + 2, 3, 4, C.hair);
      px(ctx, x + 9, y + 5, 1, 1, C.eye);
    }
  };

  BC.gfx = gfx;
})();
