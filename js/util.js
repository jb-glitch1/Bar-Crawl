// Small shared utilities.
(function () {
  const BC = window.BC || (window.BC = {});
  const U = {
    clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(a, b) { return a + Math.random() * (b - a); },
    randint(a, b) { return (a + Math.floor(Math.random() * (b - a + 1))); },
    choice(arr) { return arr[(Math.random() * arr.length) | 0]; },
    chance(p) { return Math.random() < p; },

    // minutes elapsed since 5:00 PM -> "11:42 PM"
    formatTime(minFrom5) {
      let total = 17 * 60 + Math.floor(minFrom5);
      let h = Math.floor(total / 60) % 24;
      let m = total % 60;
      const ap = h >= 12 && h < 24 ? 'PM' : 'AM';
      let h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
    }
  };
  BC.util = U;
})();
