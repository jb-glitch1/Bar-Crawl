// Shared headless harness: boots the real game under a canvas/DOM mock in a VM.
// Used by every *.test.js. No dependencies.
const fs = require('fs'), vm = require('vm'), path = require('path');
const base = path.join(__dirname, '..');

function boot() {
  const ctx = new Proxy(
    { fillStyle: '', globalAlpha: 1, canvas: { width: 768, height: 720 } },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }
  );
  const mkEl = () => ({
    classList: { add() {}, remove() {}, contains() { return false; } }, style: {},
    appendChild() {}, append() {}, addEventListener() {}, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
  });
  const canvas = Object.assign(mkEl(), { width: 768, height: 720, getContext: () => ctx });
  const store = {}, listeners = {};
  const win = { addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); } };
  const sandbox = {
    window: win, navigator: { maxTouchPoints: 0 }, location: { search: '' },
    console, Math, Date, Object, Array, Set, JSON, isNaN, parseInt, parseFloat, String, Number,
    document: {
      getElementById: (id) => (id === 'game' ? canvas : null), addEventListener() {},
      createElement: () => mkEl(), body: mkEl(), readyState: 'complete'
    },
    setInterval: () => 0, clearInterval: () => {}, requestAnimationFrame: () => 0,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    }
  };
  win.requestAnimationFrame = sandbox.requestAnimationFrame;
  vm.createContext(sandbox);
  const files = fs.readFileSync(path.join(base, 'index.html'), 'utf8').match(/js\/[^"]+\.js/g);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });

  const BC = win.BC;
  function key(t, c) { (listeners[t] || []).forEach((fn) => fn({ code: c, preventDefault() {} })); }
  function press(c) { key('keyup', c); key('keydown', c); }
  // one frame, ordered like main.js: (optional tap) -> ui -> scene -> fx -> clear.
  // The tapped key is released after the frame so it never lingers as "held"
  // (a held arrow key walks the player around between assertions).
  function frame(dt, code) {
    if (code) { key('keyup', code); key('keydown', code); }
    BC.ui.update(dt || 0.25);
    if (BC.scene && BC.scene.update && !BC.ui.blocking) BC.scene.update(dt || 0.25);
    if (BC.fx) BC.fx.update(dt || 0.25);
    BC.input.clear();
    if (code) key('keyup', code);
  }
  function render() {
    if (BC.scene && BC.scene.render) BC.scene.render(ctx);
    BC.hud && BC.hud.draw(ctx);
    BC.ui.render(ctx);
  }
  function settle(n) { for (let i = 0; i < (n || 12); i++) frame(); } // let fades/cutscenes finish
  return { BC, ctx, key, press, frame, render, settle, listeners, store, files };
}

// minimal test-reporter factory
function T(name) {
  let fails = 0, total = 0;
  return {
    ok(label, cond) { total++; if (!cond) { fails++; console.log('  FAIL ' + label); } else console.log('  ok   ' + label); },
    done() { console.log(fails ? '  -> ' + fails + '/' + total + ' failed' : '  -> all ' + total + ' passed'); return fails; }
  };
}

module.exports = { boot, T, base };
