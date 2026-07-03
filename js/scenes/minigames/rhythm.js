// Off-Key West: karaoke. Notes fall ON the beat of tonight's song, and HITTING
// a note is what plays it — you literally perform the track. Miss and the song
// goes quiet (like real karaoke). Drunker = wobblier notes, tighter windows.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});

  const KEYS = ['left', 'up', 'down', 'right'];
  const GLYPH = ['◀', '▲', '▼', '▶'];
  const LANEX = [64, 112, 160, 208];
  const HITY = 188;
  const SPEED = 74;
  const MAJ = [0, 2, 4, 5, 7, 9, 11];

  // beat slots (in beats) + melodies (major-scale degrees, one per note)
  const PAT_A = [0, 1, 2, 3, 4, 4.5, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 18.5, 19, 20, 21, 22];
  const PAT_B = [0, 1, 1.5, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 9.5, 10, 11, 12, 13, 13.5, 14, 15, 16, 16.5, 17, 18];
  const SONGS = [
    { title: "'Islands in the Sink'", bpm: 112, slots: PAT_A, mel: [0, 2, 4, 5, 4, 4, 2, 0, 2, 4, 5, 7, 7, 5, 4, 4, 5, 4, 2, 0, 0, 2, 4, 4, 2, 1, 0, 0] },
    { title: "'Sweet Home Alabarma'", bpm: 126, slots: PAT_A, mel: [4, 4, 2, 0, 0, 2, 4, 2, 0, 0, 2, 4, 4, 2, 2, 0, 4, 5, 7, 7, 5, 4, 5, 4, 2, 2, 0, 0] },
    { title: "'I Will Always Louvre You'", bpm: 96, slots: PAT_B, mel: [0, 4, 7, 7, 5, 4, 5, 4, 2, 4, 4, 2, 0, 0, 2, 4, 5, 4, 2, 2, 4, 2, 1, 0] },
    { title: "'Wonderwall.' (obviously)", bpm: 120, slots: PAT_B, mel: [2, 2, 4, 4, 5, 5, 4, 2, 2, 4, 5, 4, 2, 1, 0, 0, 1, 2, 2, 4, 4, 2, 1, 0] }
  ];
  const freqOf = (d) => 261.6 * Math.pow(2, (MAJ[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)) / 12);

  S.mg_rhythm = {
    enter(args) {
      this.barId = args.barId; this.done = false;
      this.t = 0; this.prevT = 0; this.notes = []; this.spawnIdx = 0; this.hits = 0; this.misses = 0;
      this.streak = 0; this.cheered = false;
      this.song = SONGS[(Math.random() * SONGS.length) | 0];
      const beat = 60 / this.song.bpm;
      const travel = (HITY + 10) / SPEED;
      // spawn so each note ARRIVES at the hit line exactly on its beat slot
      this.schedule = this.song.slots.map((sb, i) => ({ t: 0.6 + sb * beat, lane: (Math.random() * 4) | 0, pitch: freqOf(this.song.mel[i % this.song.mel.length]) }));
      this.travel = travel;
      this.total = this.schedule.length;
      this.phase = 'play'; this.flash = [0, 0, 0, 0];
      // after 9 PM the crowd shows up and carries you a little
      this.crowd = BC.game && BC.game.run && BC.game.run.minutes >= 240;
      if (this.crowd) BC.ui.toast('9 PM crowd. They are WITH you.', { good: true });
      if (BC.audio && BC.audio.setBackingMode) BC.audio.setBackingMode(true);
    },
    update(dt) {
      if (this.done) return;
      if (BC.input.pressed('b')) return this.finish(false);
      if (this.phase === 'done') { if (BC.input.pressed('a')) this.finish(this.pass); return; }

      this.prevT = this.t;
      this.t += dt;

      // the backing beat: kick on the downbeat, hats between (driven by game time)
      const beat = 60 / this.song.bpm;
      const b0 = Math.floor(this.prevT / beat), b1 = Math.floor(this.t / beat);
      if (b1 > b0 && BC.audio && BC.audio.tap) BC.audio.tap(b1 % 4 === 0 ? 'K' : 'h');

      while (this.spawnIdx < this.schedule.length && this.t >= this.schedule[this.spawnIdx].t) {
        const s = this.schedule[this.spawnIdx];
        this.notes.push({ lane: s.lane, pitch: s.pitch, y: -10, alive: true });
        this.spawnIdx++;
      }
      const win = Math.max(12, 18 - BC.game.tipsyTier() * 2);
      for (const n of this.notes) {
        if (!n.alive) continue;
        n.y += SPEED * dt;
        if (n.y > HITY + win + 6) {
          n.alive = false; this.misses++; this.streak = 0;
          BC.audio && BC.audio.sfx('thunk'); // the song stumbles
        }
      }
      for (let l = 0; l < 4; l++) {
        if (this.flash[l] > 0) this.flash[l] -= dt;
        if (BC.input.pressed(KEYS[l])) {
          this.flash[l] = 0.12;
          let best = null, bd = 1e9;
          for (const n of this.notes) { if (n.alive && n.lane === l) { const d = Math.abs(n.y - HITY); if (d < bd) { bd = d; best = n; } } }
          if (best && bd <= win) {
            best.alive = false; this.hits++; this.streak++;
            BC.audio && BC.audio.karaoke && BC.audio.karaoke(best.pitch); // YOU sing the note
            if (this.streak > 0 && this.streak % 8 === 0 && BC.audio && BC.audio.cheer) {
              BC.audio.cheer();
              BC.ui.toast('The crowd loses it!', { good: true });
            }
          }
        }
      }
      if (this.spawnIdx >= this.schedule.length && !this.notes.some(n => n.alive)) {
        this.phase = 'done'; this.pass = (this.hits / this.total) >= (this.crowd ? 0.62 : 0.68);
      }
    },
    finish(ok) {
      if (this.done) return;
      this.done = true;
      if (BC.audio && BC.audio.setBackingMode) BC.audio.setBackingMode(false);
      BC.afterMinigame(this.barId, ok, this.hits);
    },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0e1420');
      BC.text(ctx, 'OFF-KEY WEST', BC.W / 2, 6, { color: '#ffe27a', size: 11, align: 'center' });
      BC.text(ctx, 'TONIGHT: ' + this.song.title, BC.W / 2, 22, { color: '#7ad0ff', size: 7, align: 'center' });
      // lanes + hit line
      for (let l = 0; l < 4; l++) {
        BC.rect(ctx, LANEX[l] - 16, 30, 32, HITY + 2, 'rgba(255,255,255,0.03)');
        const fl = this.flash[l] > 0;
        BC.panel(ctx, LANEX[l] - 14, HITY - 12, 28, 24, { border: fl ? '#ffe27a' : '#456' });
        BC.text(ctx, GLYPH[l], LANEX[l], HITY - 8, { color: fl ? '#ffe27a' : '#9ab', size: 12, align: 'center', shadow: false });
      }
      const tier = BC.game.tipsyTier();
      for (const n of this.notes) {
        if (!n.alive) continue;
        const wob = Math.sin((n.y + n.lane * 50) / 26 + this.t * 4) * tier * 4;
        BC.rect(ctx, LANEX[n.lane] - 9 + wob, n.y - 6, 18, 12, '#ff6b9a');
        BC.rect(ctx, LANEX[n.lane] - 9 + wob, n.y - 6, 18, 3, '#ffd1e0');
      }
      if (this.phase === 'done') {
        BC.rect(ctx, 0, 96, BC.W, 48, 'rgba(0,0,0,0.7)');
        BC.text(ctx, this.pass ? 'WHAT A SET!' : 'PITCHY...', BC.W / 2, 104, { color: this.pass ? '#7ed07e' : '#ff8a8a', size: 14, align: 'center' });
        BC.text(ctx, 'Hits: ' + this.hits + ' / ' + this.total + '   Z to continue', BC.W / 2, 126, { color: '#cfe', size: 9, align: 'center' });
      } else {
        BC.text(ctx, 'hits ' + this.hits + '/' + this.total, 6, 22, { color: '#9ab', size: 8 });
        if (this.streak >= 4) BC.text(ctx, 'x' + this.streak, BC.W - 8, 22, { color: '#ffe27a', size: 9, align: 'right' });
        BC.text(ctx, 'arrows = sing   X = quit', BC.W / 2, BC.H - 10, { color: '#778', size: 8, align: 'center' });
      }
    }
  };
})();
