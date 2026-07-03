// Retro SOUND TEST: audition every theme, stinger, and sfx.
// Press X on the title screen to get here. The house band takes requests.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});
  let sel = 0, scroll = 0, list = null;

  function entries() {
    const E = [];
    E.push({ label: 'MOOD: early evening', fn: () => BC.audio.setMood('early') });
    E.push({ label: 'MOOD: mid evening', fn: () => BC.audio.setMood('mid') });
    E.push({ label: 'MOOD: late night', fn: () => BC.audio.setMood('late') });
    Object.keys(BC.bars).forEach((id) => {
      const b = BC.bars[id];
      if (b.mood) E.push({ label: 'BAR: ' + b.name, fn: () => BC.audio.setMood(b.mood) });
    });
    ['stamp', 'win', 'blackout', 'lastcall'].forEach((s) => E.push({ label: 'STING: ' + s, fn: () => BC.audio.sting(s) }));
    E.push({ label: 'CROWD: cheer', fn: () => BC.audio.cheer() });
    ['confirm', 'cancel', 'drink', 'eat', 'chime', 'thunk', 'cricket'].forEach((s) => E.push({ label: 'SFX: ' + s, fn: () => BC.audio.sfx(s) }));
    return E;
  }

  S.soundtest = {
    enter() { list = entries(); sel = 0; scroll = 0; BC.audio && BC.audio.ensure(); },
    update(dt) {
      if (BC.input.pressed('b') || BC.input.pressed('start')) { BC.setScene('title'); return; }
      if (BC.input.pressed('up')) { sel = (sel + list.length - 1) % list.length; BC.audio.sfx('blip'); }
      if (BC.input.pressed('down')) { sel = (sel + 1) % list.length; BC.audio.sfx('blip'); }
      if (BC.input.pressed('a')) list[sel].fn();
      const vis = 14;
      if (sel < scroll) scroll = sel;
      if (sel >= scroll + vis) scroll = sel - vis + 1;
    },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0c0c16');
      BC.text(ctx, 'SOUND TEST', BC.W / 2, 8, { color: '#ffe27a', size: 12, align: 'center' });
      BC.text(ctx, 'the house band takes requests', BC.W / 2, 24, { color: '#778', size: 7, align: 'center' });
      const vis = 14;
      for (let i = 0; i < vis && scroll + i < list.length; i++) {
        const idx = scroll + i, on = idx === sel;
        BC.text(ctx, (on ? '> ' : '  ') + list[idx].label, 20, 36 + i * 13, { color: on ? '#ffe27a' : '#9ab', size: 8 });
      }
      if (list.length > vis) BC.text(ctx, (sel + 1) + '/' + list.length, BC.W - 8, 24, { color: '#556', size: 7, align: 'right' });
      BC.text(ctx, 'Z play    X back', BC.W / 2, BC.H - 12, { color: '#667', size: 7, align: 'center' });
    }
  };
})();
