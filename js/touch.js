// On-screen touch controls for phones/tablets. Builds a DOM overlay (analog
// d-pad + A/B + MENU) and feeds BC.input.touch() so the rest of the game is
// unchanged. Uses Pointer Events, so multi-touch (move + press) just works.
(function () {
  const BC = window.BC || (window.BC = {});
  const isTouch = ('ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof location !== 'undefined' && /[?&]touch/.test(location.search));

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function bindButton(node, action) {
    node.addEventListener('pointerdown', (e) => { node.setPointerCapture(e.pointerId); node.classList.add('on'); BC.input.touch(action, true); e.preventDefault(); });
    const up = () => { node.classList.remove('on'); BC.input.touch(action, false); };
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
  }

  function build() {
    if (BC.touch && BC.touch.built) return;
    document.body.classList.add('touch');

    const pad = el('div', 'tc tc-pad');
    const knob = el('div', 'tc-knob'); pad.appendChild(knob);
    const aBtn = el('div', 'tc tc-btn tc-a', 'A');
    const bBtn = el('div', 'tc tc-btn tc-b', 'B');
    const mBtn = el('div', 'tc tc-menu', 'MENU');
    document.body.append(pad, aBtn, bBtn, mBtn);
    bindButton(aBtn, 'a'); bindButton(bBtn, 'b'); bindButton(mBtn, 'start');

    // analog d-pad -> 8-way digital, so diagonals work for walking
    const DIRS = ['up', 'down', 'left', 'right'];
    let padId = null;
    function setDir(dx, dy) {
      const on = { up: false, down: false, left: false, right: false };
      if (Math.hypot(dx, dy) > 10) {            // deadzone
        const d = Math.atan2(dy, dx) * 180 / Math.PI;  // y is down: +90 = down
        const R = (a, b) => d >= a && d < b;
        if (R(-67.5, -22.5)) { on.up = on.right = true; }
        else if (R(-22.5, 22.5)) { on.right = true; }
        else if (R(22.5, 67.5)) { on.down = on.right = true; }
        else if (R(67.5, 112.5)) { on.down = true; }
        else if (R(112.5, 157.5)) { on.down = on.left = true; }
        else if (d >= 157.5 || d < -157.5) { on.left = true; }
        else if (R(-157.5, -112.5)) { on.up = on.left = true; }
        else { on.up = true; }
      }
      for (const k of DIRS) BC.input.touch(k, on[k]);
    }
    function moveKnob(cx, cy) {
      const r = pad.getBoundingClientRect(), px = r.left + r.width / 2, py = r.top + r.height / 2;
      let dx = cx - px, dy = cy - py; const max = r.width * 0.34, mag = Math.hypot(dx, dy);
      if (mag > max) { dx = dx / mag * max; dy = dy / mag * max; }
      knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      setDir(cx - px, cy - py);
    }
    pad.addEventListener('pointerdown', (e) => { padId = e.pointerId; pad.setPointerCapture(padId); pad.classList.add('on'); moveKnob(e.clientX, e.clientY); e.preventDefault(); });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) { moveKnob(e.clientX, e.clientY); e.preventDefault(); } });
    function padUp(e) { if (e.pointerId !== padId) return; padId = null; pad.classList.remove('on'); knob.style.transform = ''; for (const k of DIRS) BC.input.touch(k, false); }
    pad.addEventListener('pointerup', padUp);
    pad.addEventListener('pointercancel', padUp);

    // tap the play area itself = A (advance dialogue / interact / confirm)
    const cv = document.getElementById('game');
    if (cv) {
      cv.addEventListener('pointerdown', (e) => { try { cv.setPointerCapture(e.pointerId); } catch (err) {} BC.input.touch('a', true); e.preventDefault(); });
      const up = () => BC.input.touch('a', false);
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
    }

    BC.touch = { built: true, isTouch: true };
  }

  BC.enableTouchControls = build;   // callable from console for desktop testing
  if (isTouch) {
    if (document.body) build();
    else window.addEventListener('DOMContentLoaded', build);
  }
})();
