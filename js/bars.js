// Bar definitions: interiors, casts, music themes, and which stamp challenge each runs.
(function () {
  const BC = window.BC || (window.BC = {});

  const INTERIOR = [
    '################',
    '#..............#',
    '#.CCCCCCCCCCCC.#',
    '#.C..........C.#',
    '#.CCCCCCCCCCCC.#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#......@.......#',
    '#......X.......#',
    '################'
  ];

  // per-bar generative music themes (passed to BC.audio.setMood)
  const M = {
    cozy:   { tempo: 0.27, wave: 'triangle', root: 220.0, scale: [0, 2, 4, 7, 9], bassEvery: 4, gain: 0.15 },
    sports: { tempo: 0.15, wave: 'sawtooth', root: 174.6, scale: [0, 4, 7, 11], bassEvery: 2, gain: 0.13 },
    karaoke:{ tempo: 0.20, wave: 'square',   root: 261.6, scale: [0, 2, 4, 5, 7, 9], bassEvery: 4, gain: 0.13 },
    dive:   { tempo: 0.34, wave: 'sawtooth', root: 130.8, scale: [0, 3, 5, 7, 10], bassEvery: 4, gain: 0.13 }
  };

  BC.bars = {
    tipsy_newt: {
      name: 'The Tipsy Newt', room: INTERIOR, mood: M.cozy,
      door: { key: '0,0', tx: 3, ty: 2 },
      intro: ['The Tipsy Newt. Low light, spilled cider, jokes older than you are.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Pat', colors: { shirt: '#3a7d5a', hair: '#caa' }, role: 'challenge', challenge: 'memory',
          greet: ['Oh thank GOD, a warm body. Cover the bar one sec?', 'Three regulars, three usuals. Get ’em right and you’re a legend.'],
          repeat: ['You again! The shift’s yours anytime, legend.', 'Pat slides you a free pretzel. The highest honor here.'] },
        { x: 56, y: 120, dir: 'right', name: 'Old Regular', colors: { shirt: '#8a5a3a' }, role: 'flavor',
          lines: ['I’ve come here since before it was cool.', '...It was never cool.'] },
        { x: 198, y: 132, dir: 'left', name: 'Newt the Cat', colors: { shirt: '#888', hair: '#999' }, role: 'flavor',
          lines: ['The bar cat blinks at you slowly. High praise, apparently.'] }
      ]
    },

    hail_mary: {
      name: 'The Hail Mary', room: INTERIOR, mood: M.sports,
      door: { key: '1,0', tx: 3, ty: 2 },
      intro: ['The Hail Mary. Forty screens, thirty-nine of them showing a game you don’t care about.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Trivia Host', colors: { shirt: '#c4423a' }, role: 'challenge', challenge: 'trivia',
          greet: ['TUESDAY TRIVIA, baby! Buzz in, big shot.', 'Get most of ’em right and the stamp is yours.'],
          repeat: ['Our reigning champ returns! No pressure.'] },
        { x: 60, y: 128, dir: 'right', name: 'Superfan', colors: { shirt: '#2a6ad0' }, role: 'flavor',
          lines: ['We are DEFINITELY winning this one.', 'We are not winning this one.'] }
      ]
    },

    off_key_west: {
      name: 'Off-Key West', room: INTERIOR, mood: M.karaoke,
      door: { key: '2,0', tx: 12, ty: 2 },
      intro: ['Off-Key West. Tropical shirts, zero pitch, infinite confidence.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'The KJ', colors: { shirt: '#1aa3a3', hair: '#eee' }, role: 'challenge', challenge: 'rhythm',
          greet: ['You’re up next! Hit the notes, ride the wave.', 'Fair warning: the drunker you are, the more they wobble.'],
          repeat: ['Encore! The crowd (one guy) demands it.'] },
        { x: 64, y: 130, dir: 'right', name: 'Karaoke Diehard', colors: { shirt: '#d08a2a' }, role: 'flavor',
          lines: ['I’ve got "Bohemian Rhapsody" queued.', 'All six minutes. You’re welcome.'] }
      ]
    },

    sticky_floor: {
      name: 'The Sticky Floor', room: INTERIOR, mood: M.dive,
      door: { key: '1,1', tx: 3, ty: 2 },
      intro: ['The Sticky Floor. That’s the name. It’s on the sign. The sign is also sticky.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Darts Shark', colors: { shirt: '#555', hair: '#321' }, role: 'challenge', challenge: 'aim',
          greet: ['Wanna throw? Board’s open.', 'Tip: a little buzzed and you start seeing the SECRET bullseye. Trust me.'],
          repeat: ['Back for more darts? Respect.'] },
        { x: 196, y: 126, dir: 'left', name: 'Pool Guy', colors: { shirt: '#3a7d44' }, role: 'flavor',
          lines: ['I’d play you in pool but the eight ball’s, uh, "resting."'] }
      ]
    }
  };
})();
