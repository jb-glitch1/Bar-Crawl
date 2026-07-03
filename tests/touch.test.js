// Touch layer: d-pad 8-way output, A/B/MENU edge-vs-held, canvas tap = A.
// Boots only util+input+touch with a pointer-capable fake DOM.
const fs = require('fs'), vm = require('vm'), path = require('path');
const { T, base } = require('./harness');

function makeEl(cls) {
  return {
    className: cls || '', _h: {}, style: {}, _rect: { left: 0, top: 0, width: 100, height: 100 },
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    appendChild() {}, setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect() { return this._rect; },
    addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
    fire(t, ev) { (this._h[t] || []).forEach((fn) => fn(ev)); }
  };
}

module.exports = function () {
  const t = T();
  const created = [];
  const game = makeEl('game');
  const body = makeEl('body'); body.append = (...n) => n.forEach((x) => created.push(x));
  const win = { addEventListener() {} };
  const sandbox = {
    window: win, navigator: { maxTouchPoints: 5 }, location: { search: '' }, console, Math, Date, Object, Array, Set, JSON,
    document: { readyState: 'complete', body, createElement: () => makeEl(), getElementById: (id) => (id === 'game' ? game : null) }
  };
  vm.createContext(sandbox);
  for (const f of ['js/util.js', 'js/input.js', 'js/touch.js']) {
    vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
  }
  const BC = win.BC;
  const find = (c) => created.find((e) => (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0);
  const pad = find('tc-pad'), a = find('tc-a'), b = find('tc-b'), m = find('tc-menu');
  t.ok('built pad/a/b/menu', !!(pad && a && b && m));
  const PD = (el, o) => el.fire('pointerdown', Object.assign({ preventDefault() {} }, o));

  PD(pad, { pointerId: 1, clientX: 95, clientY: 50 });
  t.ok('pad right', BC.input.down('right') && !BC.input.down('up') && !BC.input.down('left'));
  pad.fire('pointermove', { pointerId: 1, clientX: 50, clientY: 5, preventDefault() {} });
  t.ok('pad up releases right', BC.input.down('up') && !BC.input.down('right'));
  pad.fire('pointermove', { pointerId: 1, clientX: 95, clientY: 95, preventDefault() {} });
  t.ok('pad diagonal (down+right)', BC.input.down('down') && BC.input.down('right') && !BC.input.down('up'));
  pad.fire('pointerup', { pointerId: 1 });
  t.ok('pad release clears dirs', !BC.input.down('up') && !BC.input.down('down') && !BC.input.down('left') && !BC.input.down('right'));

  PD(a, { pointerId: 2 });
  t.ok('A press: edge + held', BC.input.pressed('a') && BC.input.down('a'));
  BC.input.clear();
  t.ok('after clear: edge gone, still held', !BC.input.pressed('a') && BC.input.down('a'));
  a.fire('pointerup', { pointerId: 2 });
  t.ok('A release', !BC.input.down('a'));

  PD(m, { pointerId: 3 }); t.ok('MENU -> start', BC.input.pressed('start')); m.fire('pointerup', {});
  PD(b, { pointerId: 4 }); t.ok('B -> b', BC.input.pressed('b')); b.fire('pointerup', {});

  BC.input.clear();
  game.fire('pointerdown', { pointerId: 5, preventDefault() {} });
  t.ok('canvas tap -> A', BC.input.pressed('a'));
  game.fire('pointerup', { pointerId: 5 });
  t.ok('canvas release -> A up', !BC.input.down('a'));

  return t.done();
};
