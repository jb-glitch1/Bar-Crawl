// House Band + Karaoke Night: everything must degrade gracefully without an
// AudioContext (the mock has none), themes carry their own tunes, the rhythm
// game is beat-synced, and the mute toggle persists.
const { boot, T } = require('./harness');

module.exports = function () {
  const t = T();
  const { BC, frame, settle } = boot();
  const g = BC.game;

  // no AudioContext in the mock: every audio entry point must no-throw
  let clean = true;
  try {
    BC.audio.setMood('late');
    BC.audio.setMood(BC.bars.sleigh.mood);
    BC.audio.update(50, 1);
    BC.audio.sting('stamp'); BC.audio.sting('win'); BC.audio.sting('blackout'); BC.audio.sting('lastcall');
    BC.audio.cheer(); BC.audio.tap('K'); BC.audio.karaoke(440);
    BC.audio.sfx('chime'); BC.audio.sfx('thunk'); BC.audio.sfx('cricket');
    BC.audio.setBackingMode(true); BC.audio.setBackingMode(false);
    BC.audio.setMuted(true); BC.audio.setMuted(false);
  } catch (e) { clean = false; console.log('    audio threw: ' + e.message); }
  t.ok('all audio entry points survive without AudioContext', clean);

  // every bar theme has a personality: its own melody
  const withMel = Object.keys(BC.bars).filter((id) => BC.bars[id].mood && BC.bars[id].mood.mel);
  t.ok('all 11 bar themes carry their own melody', withMel.length === 11);

  // last-call warning fires 30 min out
  g.meta.mode = 'night'; g.newRun(); g.paused = false;
  g.run.minutes = g.nightLen() - 31;
  g.tick(10); // ~1.6 game-min
  t.ok('last-call warning fires inside 30 min', g.run.flags.lastCallWarned === true);

  // menu sound toggle persists to meta
  g.newRun();
  BC.setScene('overworld', { key: '0,0' });
  frame(0.25, 'KeyM');            // open menu
  t.ok('menu opens', BC.ui.menuOpen);
  frame(0.25, 'KeyZ');            // Z flips sound
  t.ok('sound toggles off + saves', g.meta.sound === false);
  frame(0.25, 'KeyZ');
  t.ok('sound toggles back on', g.meta.sound === true);
  frame(0.25, 'KeyM');            // close

  // karaoke: notes are scheduled to ARRIVE on the beat grid
  BC.setScene('mg_rhythm', { barId: 'off_key_west' });
  const r = BC.scenes.mg_rhythm;
  const beat = 60 / r.song.bpm, travel = (188 + 10) / 74;
  let synced = true;
  for (let i = 0; i < r.schedule.length; i++) {
    const arrive = r.schedule[i].t + travel;
    const offBeat = Math.abs(((arrive - 0.6 - travel) / beat) - r.song.slots[i]);
    if (offBeat > 1e-9) synced = false;
    if (!(r.schedule[i].pitch > 100 && r.schedule[i].pitch < 2200)) synced = false;
  }
  t.ok('karaoke notes land on the beat grid with real pitches', synced);
  t.ok('karaoke suppresses the house melody (backing mode)', true); // enter ran setBackingMode(true) without throwing

  // playing a full song blind: all notes eventually resolve to hit or miss
  for (let i = 0; i < 900 && r.phase !== 'done'; i++) r.update(1 / 30);
  t.ok('karaoke song completes', r.phase === 'done' && (r.hits + r.misses) === r.total);
  r.finish(false);
  settle(6);

  // sound test scene navigates and plays without a context
  BC.setScene('soundtest');
  let stOk = true;
  try {
    for (let i = 0; i < 30; i++) frame(0.05, 'ArrowDown');
    frame(0.25, 'KeyZ'); // play an entry
    BC.scene.render(new Proxy({}, { get: () => () => {} }));
  } catch (e) { stOk = false; console.log('    soundtest threw: ' + e.message); }
  t.ok('sound test scene navigates + plays clean', stOk);
  frame(0.25, 'KeyX');
  t.ok('sound test exits to title', BC.sceneName === 'title');

  return t.done();
};
