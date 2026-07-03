// Engine: canvas setup, scene manager, fixed-timestep-ish game loop, boot.
(function () {
  const BC = window.BC || (window.BC = {});
  BC.W = 256; BC.H = 240; BC.TILE = 16;

  let canvas, ctx, last = 0, gtime = 0;

  BC.scenes = BC.scenes || {};

  // the world sways as you get drunk (only in the walkable scenes)
  function drunkWobble() {
    if (!BC.game || !BC.game.run) return null;
    if (BC.sceneName !== 'overworld' && BC.sceneName !== 'bar') return null;
    const t = BC.game.run.tipsy;
    if (t < 35) return null;
    const a = ((t - 35) / 65) * 3.4;
    return { x: Math.sin(gtime * 4.0) * a, y: Math.cos(gtime * 5.3) * a * 0.7 };
  }
  function drunkTint() {
    if (!BC.game || !BC.game.run) return;
    const t = BC.game.run.tipsy;
    if (t <= 50) return;
    ctx.fillStyle = 'rgba(120,40,160,' + (((t - 50) / 50) * 0.13).toFixed(3) + ')';
    ctx.fillRect(0, 0, BC.W, BC.H);
  }

  // day -> golden hour -> dusk -> night as the clock runs from 5 PM to 2 AM
  const SKY = [
    [0, 255, 220, 170, 0.05], [100, 255, 200, 150, 0.08], [180, 235, 150, 120, 0.18],
    [260, 120, 95, 150, 0.30], [340, 45, 48, 98, 0.42], [540, 26, 30, 74, 0.46]
  ];
  function lerp(a, b, t) { return a + (b - a) * t; }
  function timeTint() {
    if (!BC.game || !BC.game.run) return;
    if (BC.sceneName !== 'overworld' && BC.sceneName !== 'home') return;
    const m = BC.game.run.minutes;
    let a = SKY[0], b = SKY[SKY.length - 1];
    for (let i = 0; i < SKY.length - 1; i++) { if (m >= SKY[i][0] && m <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; break; } }
    const t = (b[0] === a[0]) ? 0 : (m - a[0]) / (b[0] - a[0]);
    ctx.fillStyle = 'rgba(' + (lerp(a[1], b[1], t) | 0) + ',' + (lerp(a[2], b[2], t) | 0) + ',' + (lerp(a[3], b[3], t) | 0) + ',' + lerp(a[4], b[4], t).toFixed(3) + ')';
    ctx.fillRect(0, 0, BC.W, BC.H);
  }

  BC.setScene = function (name, args) {
    if (BC.scene && BC.scene.exit) BC.scene.exit();
    if (BC.ui && BC.ui.sceneCleanup) BC.ui.sceneCleanup();
    if (BC.fx) BC.fx.clear();
    BC.scene = BC.scenes[name];
    BC.sceneName = name;
    if (!BC.scene) { console.error('No scene: ' + name); return; }
    if (BC.scene.enter) BC.scene.enter(args || {});
  };

  // text via the bitmap pixel font (js/font.js) — crisp at every scale
  BC.text = function (ctx, str, x, y, opt) {
    opt = opt || {};
    const F = BC.font, size = opt.size || 8;
    str = F.normalize(str);
    const sc = F.scaleFor(size), w = str.length * 6 * sc;
    x = x | 0; y = y | 0;
    if (opt.align === 'center') x -= w >> 1;
    else if (opt.align === 'right') x -= w;
    if (opt.baseline === 'middle') y -= (7 * sc) >> 1;
    if (opt.shadow !== false) {
      if (opt.shadowColor) { // neon glow: 4-direction halo
        for (const o of [[-sc, 0], [sc, 0], [0, -sc], [0, sc]]) F.draw(ctx, str, x + o[0], y + o[1], size, opt.shadowColor);
      } else {
        F.draw(ctx, str, x + sc, y + sc, size, 'rgba(0,0,0,0.9)'); // retro drop shadow
      }
    }
    F.draw(ctx, str, x, y, size, opt.color || '#fff');
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
    gtime += dt; BC.now = gtime;
    if (BC.fx) BC.fx.update(dt);
    if (BC.ui) BC.ui.update(dt);
    if (BC.scene) {
      if (BC.scene.update && !(BC.ui && BC.ui.blocking)) BC.scene.update(dt);
      if (BC.scene.render) {
        const w = drunkWobble(), sh = BC.fx ? BC.fx.offset() : null;
        // integer offsets: the world shakes in whole pixels, staying chunky
        const ox = Math.round((w ? w.x : 0) + (sh ? sh.x : 0));
        const oy = Math.round((w ? w.y : 0) + (sh ? sh.y : 0));
        if (ox || oy) { ctx.save(); ctx.translate(ox, oy); BC.scene.render(ctx); ctx.restore(); }
        else BC.scene.render(ctx);
        // hammered: a faint second image drifts (canvas self-composite)
        if (BC.game && BC.game.run && BC.game.run.tipsy >= 80 && ctx.drawImage &&
            (BC.sceneName === 'overworld' || BC.sceneName === 'bar')) {
          try {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 0.14;
            ctx.drawImage(canvas, Math.round(Math.sin(gtime * 1.1) * 3 * BC.RES), 0);
            ctx.restore();
          } catch (e) { /* mocks without drawImage */ }
        }
      }
    }
    timeTint();
    drunkTint();
    if (BC.fx) BC.fx.render(ctx);
    if (BC.hud) BC.hud.draw(ctx);
    if (BC.game) BC.game.tick(dt);
    if (BC.ui) BC.ui.render(ctx);
    BC.input.clear();
  }

  BC.boot = function () {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // render at a higher backing resolution (3x: 768x720) for crisper text; all
    // game code keeps drawing in 256x240 logical space.
    BC.RES = (canvas.width / BC.W) || 1;
    ctx.scale(BC.RES, BC.RES);
    BC.canvas = canvas;
    BC.ctx = ctx;
    if (BC.world) BC.world.init();
    if (BC.game) BC.game.init();
    BC.setScene(BC.firstScene || 'overworld');
    requestAnimationFrame(frame);
  };

  BC.boot();
})();
