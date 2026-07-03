// Adaptive chiptune + SFX, fully synthesized via Web Audio (no audio files).
// Mood shifts with time of night; tipsiness lowers the filter and detunes everything.
(function () {
  const BC = window.BC || (window.BC = {});

  let ctx = null, master = null, filter = null, started = false, muted = false;
  let timer = null, nextTime = 0, step = 0, tipsy = 0;

  // mood / theme parameters — warm, bouncy, whimsical (Animal-Crossing-ish)
  const MOODS = {
    early: { tempo: 0.23, wave: 'triangle', root: 261.6, scale: [0, 2, 4, 7, 9, 12], bassEvery: 4, gain: 0.17 },
    mid:   { tempo: 0.205, wave: 'triangle', root: 220.0, scale: [0, 2, 4, 5, 7, 9, 11], bassEvery: 4, gain: 0.16 },
    late:  { tempo: 0.26, wave: 'triangle', root: 196.0, scale: [0, 2, 4, 6, 7, 9, 11], bassEvery: 8, gain: 0.15 }
  };
  let cur = MOODS.early;
  // a longer, springier phrase that reaches up an octave for that playful lilt
  const MEL = [0, 2, 4, 7, 4, 2, 5, 4, 0, 2, 4, 9, 7, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2];

  function makeCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = cur.gain;
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1900;
    master.connect(filter); filter.connect(ctx.destination);
    return true;
  }

  function ensure() {
    if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
    if (typeof window === 'undefined') return;
    if (!makeCtx()) return;
    started = true;
    nextTime = ctx.currentTime + 0.08;
    step = 0;
    timer = setInterval(scheduler, 25);
  }

  function scheduler() {
    if (!ctx || muted) return;
    // after a background-tab stall (throttled interval) or an unmute, skip the
    // backlog instead of scheduling every missed note at once
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime;
    const drag = 1 + (tipsy / 100) * 0.18; // drunk = draggy tempo
    while (nextTime < ctx.currentTime + 0.13) {
      playStep(step, nextTime);
      nextTime += cur.tempo * drag;
      step++;
    }
  }

  function playStep(s, t) {
    const sc = cur.scale, n = sc.length;
    const deg = MEL[s % MEL.length];
    const semis = sc[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
    const wob = (tipsy / 100) * (Math.random() * 2 - 1) * 38; // detune cents
    tone(cur.root * Math.pow(2, semis / 12), t, cur.tempo * 0.85, cur.wave, 0.5, wob);
    if (s % cur.bassEvery === 0) {
      const bd = sc[(Math.floor(s / cur.bassEvery)) % n];
      tone((cur.root / 2) * Math.pow(2, bd / 12), t, cur.tempo * 1.6, 'square', 0.55, 0);
    }
  }

  function tone(freq, t, dur, wave, vol, detune) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave; o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // short UI sounds, routed past the drunk filter so they stay crisp
  const SFX = {
    confirm: { f: [523, 784], d: 0.07, w: 'square', v: 0.2 },
    cancel:  { f: [392, 262], d: 0.07, w: 'square', v: 0.18 },
    drink:   { f: [180, 120], d: 0.12, w: 'sawtooth', v: 0.22 },
    eat:     { f: [300, 300], d: 0.06, w: 'triangle', v: 0.2 },
    stamp:   { f: [659, 880, 1175], d: 0.08, w: 'square', v: 0.22 },
    error:   { f: [140, 110], d: 0.14, w: 'square', v: 0.2 },
    blip:    { f: [880], d: 0.04, w: 'square', v: 0.15 }
  };
  function sfx(name) {
    ensure();
    if (!ctx || muted) return;
    const s = SFX[name]; if (!s) return;
    let t = ctx.currentTime;
    s.f.forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = s.w; o.frequency.value = freq;
      const st = t + i * s.d;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(s.v, st + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, st + s.d);
      o.connect(g); g.connect(ctx.destination);
      o.start(st); o.stop(st + s.d + 0.02);
    });
  }

  BC.audio = {
    ensure,
    setMood(m) {
      if (typeof m === 'object') { cur = m; }
      else { cur = MOODS[m] || cur; }
      if (master && ctx) master.gain.setTargetAtTime(cur.gain, ctx.currentTime, 0.3);
    },
    setTheme(themeObj) { this.setMood(themeObj); },
    clearTheme(mood) { this.setMood(mood || 'early'); },
    update(tp) {
      tipsy = tp || 0;
      if (filter && ctx) {
        const cut = BC.util.lerp(1900, 320, tipsy / 100);
        filter.frequency.setTargetAtTime(cut, ctx.currentTime, 0.25);
      }
    },
    sfx,
    toggleMute() { muted = !muted; if (master && ctx) master.gain.value = muted ? 0 : cur.gain; return muted; }
  };

  // start audio on first user gesture (autoplay policies)
  if (typeof window !== 'undefined' && window.addEventListener) {
    const kick = () => ensure();
    window.addEventListener('keydown', kick);
    window.addEventListener('pointerdown', kick);
  }
})();
