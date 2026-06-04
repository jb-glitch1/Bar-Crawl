// Keyboard input: edge-triggered "pressed" + held "down" state.
(function () {
  const BC = window.BC || (window.BC = {});
  const down = {};
  const pressed = {};

  const MAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a',
    KeyX: 'b', ShiftLeft: 'b', ShiftRight: 'b', Backspace: 'b',
    KeyM: 'start', Tab: 'start', Escape: 'start',
    Digit1: 'one', Digit2: 'two', Digit3: 'three', Digit4: 'four'
  };

  BC.input = {
    down(k) { return !!down[k]; },
    pressed(k) { return !!pressed[k]; },
    any() {
      for (const k in pressed) if (pressed[k]) return true;
      return false;
    },
    clear() { for (const k in pressed) pressed[k] = false; }
  };

  window.addEventListener('keydown', (e) => {
    const k = MAP[e.code];
    if (k) {
      if (!down[k]) pressed[k] = true;
      down[k] = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = MAP[e.code];
    if (k) { down[k] = false; e.preventDefault(); }
  });
  // drop held keys if focus is lost so the player doesn't "stick"
  window.addEventListener('blur', () => { for (const k in down) down[k] = false; });
})();
