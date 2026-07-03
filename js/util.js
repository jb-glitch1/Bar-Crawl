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

    // deterministic tipsy text-mangling (same input -> same output, no flicker)
    drunkify(str, tier, salt) {
      if (!tier || tier < 2 || !str) return str;
      let h = 2166136261 >>> 0;
      const s = str + '|' + (salt || 0);
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
      const pick = (n) => { h = ((h * 1103515245 + 12345) & 0x7fffffff) >>> 0; return h % n; };
      const chars = str.split('');
      const letters = [];
      for (let i = 0; i < chars.length; i++) if (/[a-z]/i.test(chars[i])) letters.push(i);
      if (!letters.length) return str;
      if (tier >= 2) { const i = letters[pick(letters.length)]; chars.splice(i, 0, chars[i]); } // douubled letter
      if (tier >= 3) {
        const i = letters[pick(letters.length)];
        if (i + 1 < chars.length && /[a-z]/i.test(chars[i + 1])) {
          const t = chars[i]; chars[i] = chars[i + 1]; chars[i + 1] = t; // adjacent swpa
        }
      }
      return chars.join('');
    },

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
