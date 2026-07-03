// Adaptive chiptune + SFX, fully synthesized via Web Audio (no audio files).
// Mood shifts with time of night; tipsiness lowers the filter and detunes everything.
(function () {
  const BC = window.BC || (window.BC = {});

  let ctx = null, master = null, filter = null, started = false, muted = false;
  let timer = null, nextTime = 0, step = 0, tipsy = 0;

  // mood / theme parameters — warm, bouncy, whimsical (Animal-Crossing-ish)
  const MOODS = {
    early: { tempo: 0.23, wave: 'triangle', root: 261.6, scale: [0, 2, 4, 7, 9, 12], bassEvery: 4, gain: 0.17, drums: 'K.......' },
    mid:   { tempo: 0.205, wave: 'triangle', root: 220.0, scale: [0, 2, 4, 5, 7, 9, 11], bassEvery: 4, gain: 0.16, drums: 'K...h...' },
    late:  { tempo: 0.26, wave: 'triangle', root: 196.0, scale: [0, 2, 4, 6, 7, 9, 11], bassEvery: 8, gain: 0.15, drums: 'K.h.h.h.' }
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

  let urgency = 0;      // 0..1 — the final hours push the tempo and add a tick
  let backing = false;  // karaoke mode: the melody yields the stage to the player

  function scheduler() {
    if (!ctx || muted || backing) return;
    // after a background-tab stall (throttled interval) or an unmute, skip the
    // backlog instead of scheduling every missed note at once
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime;
    const drag = 1 + (tipsy / 100) * 0.18;      // drunk = draggy tempo
    const push = 1 - urgency * 0.12;            // late  = anxious tempo
    while (nextTime < ctx.currentTime + 0.13) {
      playStep(step, nextTime);
      const swing = cur.rhy ? cur.rhy[step % cur.rhy.length] : 1;
      nextTime += cur.tempo * drag * push * swing;
      step++;
    }
  }

  // ---- drums: synthesized kick/snare/hat/sleigh-bell, zero samples ----
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, (ctx.sampleRate * 0.3) | 0, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function drum(type, t) {
    if (!ctx) return;
    if (type === 'K') { // kick: a dropping sine thump
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.09);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.13);
      return;
    }
    const src = ctx.createBufferSource(); src.buffer = noise();
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    if (type === 'S') { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.26, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); }
    else if (type === 'b') { f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(0.10, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); } // sleigh bells
    else { f.type = 'highpass'; f.frequency.value = 6000; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035); } // hat
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.2);
  }

  function playStep(s, t) {
    const sc = cur.scale, n = sc.length;
    const mel = cur.mel || MEL;
    const deg = mel[s % mel.length];
    // null = a rest; a truly hammered band also drops the odd note
    if (deg != null && !(tipsy > 80 && Math.random() < 0.12)) {
      const semis = sc[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
      const wob = (tipsy / 100) * (Math.random() * 2 - 1) * 38; // detune cents
      tone(cur.root * Math.pow(2, semis / 12), t, cur.tempo * 0.85, cur.wave, 0.5, wob);
    }
    if (s % cur.bassEvery === 0) {
      const bd = sc[(Math.floor(s / cur.bassEvery)) % n];
      tone((cur.root / 2) * Math.pow(2, bd / 12), t, cur.tempo * 1.6, 'square', 0.55, 0);
    }
    if (cur.drums) {
      const ch = cur.drums[s % cur.drums.length];
      if (ch && ch !== '.') drum(ch, t);
    }
    if (urgency >= 0.5 && (s & 1)) drum('h', t); // the clock is audible now
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
    blip:    { f: [880], d: 0.04, w: 'square', v: 0.15 },
    chime:   { f: [784, 1176], d: 0.09, w: 'triangle', v: 0.18 },   // bar door
    thunk:   { f: [150, 90], d: 0.05, w: 'square', v: 0.26 },       // dart into cork
    cricket: { f: [4200, 4600], d: 0.04, w: 'triangle', v: 0.06 }   // park at night
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

  // short one-shot set pieces for the moments that deserve them
  function stTone(freq, t, dur, wave, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination); // crisp, past the drunk filter
    o.start(t); o.stop(t + dur + 0.02);
  }
  function sting(name) {
    ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + 0.02;
    if (name === 'stamp') {
      [0, 4, 7, 12, 16].forEach((s, i) => stTone(cur.root * Math.pow(2, s / 12), t0 + i * 0.07, 0.1, 'square', 0.2));
    } else if (name === 'win') {
      [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => stTone(261.6 * Math.pow(2, s / 12), t0 + i * 0.11, 0.16, 'triangle', 0.24));
      [0, 0.44, 0.88].forEach((d) => drum('K', t0 + d));
    } else if (name === 'blackout') {
      // the record slows down and the lights go out
      for (const det of [0, 7]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(320 + det * 9, t0);
        o.frequency.exponentialRampToValueAtTime(46, t0 + 1.3);
        g.gain.setValueAtTime(0.22, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.45);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + 1.5);
      }
      if (filter) { filter.frequency.setTargetAtTime(140, t0, 0.25); filter.frequency.setTargetAtTime(1900, t0 + 1.8, 0.5); }
    } else if (name === 'lastcall') {
      stTone(880, t0, 0.3, 'triangle', 0.22);
      stTone(660, t0 + 0.5, 0.34, 'triangle', 0.22);
    }
  }
  // a little crowd goes wild (noise swell)
  function cheer() {
    ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t0); src.stop(t0 + 0.75);
  }

  BC.audio = {
    ensure,
    setMood(m) {
      const next = (typeof m === 'object') ? m : (MOODS[m] || cur);
      if (next === cur) return;
      cur = next;
      step = 0; // new tune starts at the top of its phrase
      if (master && ctx) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0.002, now, 0.03);  // quick duck masks the splice
        master.gain.setTargetAtTime(muted ? 0 : cur.gain, now + 0.15, 0.09);
        nextTime = Math.max(nextTime, now + 0.18);
      }
    },
    setTheme(themeObj) { this.setMood(themeObj); },
    clearTheme(mood) { this.setMood(mood || 'early'); },
    update(tp, urg) {
      tipsy = tp || 0;
      urgency = urg || 0;
      if (filter && ctx) {
        const cut = BC.util.lerp(1900, 320, tipsy / 100);
        filter.frequency.setTargetAtTime(cut, ctx.currentTime, 0.25);
      }
    },
    sfx, sting, cheer,
    // karaoke hooks: the minigame drives the beat and the player sings the notes
    setBackingMode(b) { backing = !!b; },
    tap(type) { ensure(); if (!ctx || muted) return; drum(type, ctx.currentTime); },
    karaoke(freq) { ensure(); if (!ctx || muted) return; stTone(freq, ctx.currentTime, 0.16, 'square', 0.2); },
    setMuted(m) {
      muted = !!m;
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : cur.gain, ctx.currentTime, 0.05);
    },
    isMuted() { return muted; },
    toggleMute() { this.setMuted(!muted); return muted; }
  };

  // start audio on first user gesture (autoplay policies)
  if (typeof window !== 'undefined' && window.addEventListener) {
    const kick = () => ensure();
    window.addEventListener('keydown', kick);
    window.addEventListener('pointerdown', kick);
  }
})();
