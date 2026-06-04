// Engine: canvas setup, scene manager, fixed-timestep-ish game loop, boot.
(function () {
  const BC = window.BC || (window.BC = {});
  BC.W = 256; BC.H = 240; BC.TILE = 16;

  let canvas, ctx, last = 0;

  BC.scenes = BC.scenes || {};

  BC.setScene = function (name, args) {
    if (BC.scene && BC.scene.exit) BC.scene.exit();
    BC.scene = BC.scenes[name];
    BC.sceneName = name;
    if (!BC.scene) { console.error('No scene: ' + name); return; }
    if (BC.scene.enter) BC.scene.enter(args || {});
  };

  // text helper with optional drop shadow
  BC.text = function (ctx, str, x, y, opt) {
    opt = opt || {};
    ctx.font = (opt.size || 8) + 'px "Courier New", monospace';
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.baseline || 'top';
    if (opt.shadow !== false) {
      ctx.fillStyle = opt.shadowColor || 'rgba(0,0,0,0.7)';
      ctx.fillText(str, (x | 0) + 1, (y | 0) + 1);
    }
    ctx.fillStyle = opt.color || '#fff';
    ctx.fillText(str, x | 0, y | 0);
  };

  BC.rect = function (ctx, x, y, w, h, c) {
    ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w, h);
  };

  // rounded-ish panel (a classic dialogue/menu box)
  BC.panel = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    ctx.fillStyle = opt.fill || 'rgba(12,12,24,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = opt.border || '#e8e8f4';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = opt.border2 || 'rgba(120,120,160,0.6)';
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  };

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.1) dt = 0.1; // clamp after tab-out
    BC.dt = dt;
    if (BC.scene) {
      if (BC.scene.update) BC.scene.update(dt);
      if (BC.scene.render) BC.scene.render(ctx);
    }
    BC.input.clear();
  }

  BC.boot = function () {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    BC.canvas = canvas;
    BC.ctx = ctx;
    BC.setScene(BC.firstScene || 'overworld');
    requestAnimationFrame(frame);
  };

  BC.boot();
})();
