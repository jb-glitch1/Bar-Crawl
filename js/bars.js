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

  // per-bar generative music themes (passed to BC.audio.setMood).
  // mel = scale-degree phrase (null = rest), drums = K kick / S snare / h hat /
  // b sleigh bell per step, rhy = step-length multipliers (swing).
  const M = {
    cozy:    { tempo: 0.27, wave: 'triangle', root: 220.0, scale: [0, 2, 4, 7, 9], bassEvery: 3, gain: 0.15,
               mel: [0, 1, 2, 4, 2, 1, 0, 2, 1, 2, 3, 2, 1, 0, 1, null], drums: 'K.h' },
    sports:  { tempo: 0.15, wave: 'sawtooth', root: 174.6, scale: [0, 4, 7, 11], bassEvery: 2, gain: 0.13,
               mel: [0, 1, 2, 3, 2, 1, 0, 1], drums: 'K.h.S.h.' },
    karaoke: { tempo: 0.20, wave: 'square',   root: 261.6, scale: [0, 2, 4, 5, 7, 9], bassEvery: 4, gain: 0.13,
               mel: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, null], drums: 'K.h.S.h.' },
    dive:    { tempo: 0.34, wave: 'sawtooth', root: 130.8, scale: [0, 3, 5, 7, 10], bassEvery: 4, gain: 0.13,
               mel: [0, 2, 3, 4, 3, 2, 0, null, 2, 3, 2, 0, 1, 0, null, null], drums: 'K..S..h.', rhy: [1.4, 0.6] },
    wine:    { tempo: 0.30, wave: 'triangle', root: 233.1, scale: [0, 2, 4, 5, 9, 11], bassEvery: 4, gain: 0.12,
               mel: [0, 2, 4, 5, 4, 2, 1, 0], drums: 'h.......', rhy: [1, 1, 1.5, 0.5] },
    wits:    { tempo: 0.16, wave: 'square',   root: 155.6, scale: [0, 2, 3, 5, 7, 8, 11], bassEvery: 2, gain: 0.13,
               mel: [0, 0, 3, 0, 0, 4, 0, 5], drums: 'K.h.K.hh' },
    dungeon: { tempo: 0.24, wave: 'square',   root: 164.8, scale: [0, 2, 3, 7, 8], bassEvery: 4, gain: 0.13,
               mel: [0, 2, 1, 3, 2, 4, 1, 0], drums: 'K...S...' },
    xmas:    { tempo: 0.22, wave: 'square',   root: 261.6, scale: [0, 2, 4, 5, 7, 9, 11], bassEvery: 4, gain: 0.13,
               mel: [2, 2, 2, null, 2, 2, 2, null, 2, 4, 0, 1, 2, null, null, null], drums: 'b.b.b.b.' },
    diner:   { tempo: 0.26, wave: 'triangle', root: 196.0, scale: [0, 3, 5, 7, 10], bassEvery: 4, gain: 0.13,
               mel: [0, 2, 3, 4, 3, 2, 0, 2], drums: 'K..h', rhy: [1.3, 0.7] },
    deja:    { tempo: 0.32, wave: 'sawtooth', root: 138.6, scale: [0, 1, 4, 6, 8, 10], bassEvery: 8, gain: 0.12,
               mel: [0, 1, 2, 3, 3, 2, 1, 0], drums: '....h...' },
    speak:   { tempo: 0.30, wave: 'sawtooth', root: 146.8, scale: [0, 3, 5, 6, 7, 10], bassEvery: 4, gain: 0.12,
               mel: [0, 2, 3, 4, 3, 2, 4, 2], drums: 'K..h', rhy: [1.5, 0.5] }
  };

  BC.bars = {
    // ---- Tier 1: normal ---------------------------------------------------
    tipsy_newt: {
      name: 'The Tipsy Newt', room: INTERIOR, mood: M.cozy, door: { key: '0,0', tx: 3, ty: 4 },
      intro: ['The Tipsy Newt. Low light, spilled cider, jokes older than you are.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Pat', colors: { shirt: '#3a7d5a', hair: '#caa' }, role: 'challenge', challenge: 'memory',
          greet: ['Oh thank GOD, a warm body. Cover the bar one sec?', 'Three regulars, three usuals. Get ’em right and you’re a legend.'],
          repeat: ['You again! The shift’s yours anytime, legend.', 'Pat slides you a free pretzel. The highest honor here.'] },
        { x: 56, y: 120, dir: 'right', name: 'Old Regular', colors: { shirt: '#8a5a3a' }, role: 'flavor',
          lines: ['I’ve come here since before it was cool.', '...It was never cool.'] },
        { x: 198, y: 132, dir: 'left', name: 'Newt the Cat', colors: { shirt: '#888', hair: '#999' }, role: 'cat',
          lines: ['The bar cat blinks at you slowly. High praise, apparently.'] }
      ]
    },

    hail_mary: {
      name: 'The Hail Mary', room: INTERIOR, mood: M.sports, door: { key: '1,0', tx: 3, ty: 4 },
      intro: ['The Hail Mary. Forty screens, thirty-nine showing a game you don’t care about.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Trivia Host', colors: { shirt: '#c4423a', hat: 'cap' }, role: 'challenge', challenge: 'trivia',
          greet: ['TUESDAY TRIVIA, baby! Buzz in, big shot.', 'Get most of ’em right and the stamp is yours.'],
          repeat: ['Our reigning champ returns! No pressure.'] },
        { x: 60, y: 128, dir: 'right', name: 'Superfan', colors: { shirt: '#2a6ad0' }, role: 'password_giver', password: 'FLAMINGO',
          lines: ['We are DEFINITELY winning this one.', 'We are not winning this one.'] }
      ]
    },

    off_key_west: {
      name: 'Off-Key West', room: INTERIOR, mood: M.karaoke, door: { key: '2,0', tx: 3, ty: 4 },
      intro: ['Off-Key West. Tropical shirts, zero pitch, infinite confidence.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'The KJ', colors: { shirt: '#1aa3a3', hair: '#eee', hat: 'lei' }, role: 'challenge', challenge: 'rhythm',
          greet: ['You’re up next! Hit the notes, ride the wave.', 'Fair warning: the drunker you are, the more they wobble.'],
          repeat: ['Encore! The crowd (one guy) demands it.'] },
        { x: 64, y: 130, dir: 'right', name: 'Tiki Bartender', colors: { shirt: '#d08a2a' }, role: 'ingredient', ingredient: 'umbrella',
          lines: ['Every drink here comes with a tiny paper umbrella. Every one.'] }
      ]
    },

    sticky_floor: {
      name: 'The Sticky Floor', room: INTERIOR, mood: M.dive, door: { key: '1,1', tx: 3, ty: 4 },
      intro: ['The Sticky Floor. That’s the name. It’s on the sign. The sign is also sticky.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Darts Shark', colors: { shirt: '#555', hair: '#321' }, role: 'challenge', challenge: 'aim',
          greet: ['Wanna throw? Board’s open.', 'Tip: a little buzzed and you start seeing the SECRET bullseye. Trust me.'],
          repeat: ['Back for more darts? Respect.'] },
        { x: 196, y: 126, dir: 'left', name: 'Top Shelf', colors: { shirt: '#3a7d44' }, role: 'ingredient', ingredient: 'whiskey',
          lines: ['That dusty bottle up top? Allegedly the good stuff.'] }
      ]
    },

    // ---- Tier 2: weird ----------------------------------------------------
    pour_decisions: {
      name: 'Pour Decisions', room: INTERIOR, mood: M.wine, door: { key: '2,0', tx: 12, ty: 4 },
      intro: ['Pour Decisions. Candlelit, smug, and judging your shoes.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Sommelier', colors: { shirt: '#5a2030', hair: '#222', hat: 'bow' }, role: 'challenge', challenge: 'tasting',
          greet: ['Ah. A "palate." Prove it — describe these vintages.', 'Pretension is rewarded. Honesty is not.'],
          repeat: ['The connoisseur returns. Bravo.'] },
        { x: 64, y: 128, dir: 'right', name: 'Garden Mint', colors: { shirt: '#3a8a5a' }, role: 'ingredient', ingredient: 'mint',
          lines: ['A pot of suspiciously perfect mint sits on the bar.'] }
      ]
    },

    cellar_door: {
      name: 'The Cellar Door', room: INTERIOR, mood: M.dungeon, door: { key: '1,1', tx: 12, ty: 4 },
      intro: ['The Cellar Door. A craft-beer cave. The good stuff is... downstairs.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Cellar Keeper', colors: { shirt: '#4a3a2a', hair: '#322' }, role: 'challenge', challenge: 'dungeon',
          greet: ['Want the rare cask? It’s down in the cellar.', 'Fair warning: I "redecorated" with kegs. Find the opener.'],
          repeat: ['Back to the cellar, brave soul?'] }
      ]
    },

    // Reggie's — entered only via the gated storefront in Backstreets
    speakeasy: {
      name: "Reggie's", room: INTERIOR, mood: M.speak, door: { key: '2,1', tx: 12, ty: 4 },
      intro: ['Behind the fridge: velvet, candlelight, and zero refrigerators. You’re IN.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Reggie', colors: { shirt: '#222', hair: '#111', hat: 'fedora' }, role: 'speakeasy',
          greet: ['You found us. Most folks just see a sad fridge shop.', 'Welcome to the real party. Stamp’s yours, VIP.'],
          repeat: ['The usual booth’s open, VIP.'] },
        { x: 64, y: 130, dir: 'right', name: 'Lounge Singer', colors: { shirt: '#6a2a4a' }, role: 'flavor',
          lines: ['*croons a speakeasy classic you definitely don’t recognize*'] }
      ]
    },

    // ---- Tier 3: bespoke-strange -----------------------------------------
    witz_end: {
      name: 'Witz End', room: INTERIOR, mood: M.wits, door: { key: '2,1', tx: 3, ty: 4 },
      intro: ['Witz End. Where arguments go to become legend. Or to die.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Reginald III', colors: { shirt: '#3a3a7a', hair: '#a88' }, role: 'challenge', challenge: 'wits',
          greet: ['You THERE. I challenge you to a BATTLE OF WITS.', 'No fists. Only devastating remarks. Ready your dignity.'],
          repeat: ['I yield. You are, regrettably, funnier than me.'] },
        { x: 196, y: 126, dir: 'left', name: 'Heckler', colors: { shirt: '#7a5a2a' }, role: 'flavor',
          lines: ['Boooo. ...I mean, you got this. ...Boooo.'] }
      ]
    },

    deja_brew: {
      name: 'Deja Brew', room: INTERIOR, mood: M.deja, door: { key: '2,2', tx: 3, ty: 4 },
      intro: ['Deja Brew. You feel like you’ve been here before. You have. Many times.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'The Bartender', colors: { shirt: '#33384a', hair: '#556' }, role: 'deja' },
        { x: 196, y: 126, dir: 'left', name: 'Mysterious Patron', colors: { shirt: '#5a2a6a', hair: '#211' }, role: 'quest_cocktail' }
      ]
    },

    sleigh: {
      name: "Sleigh It Ain't So", room: INTERIOR, mood: M.xmas, door: { key: '0,2', tx: 3, ty: 4 },
      intro: ['SLEIGH IT AIN’T SO. It is 90 degrees out. Inside: fake snow, real sweat, a heater running next to the AC.'],
      npcs: [
        { x: 150, y: 56, dir: 'down', name: 'Sweaty Santa', colors: { shirt: '#b23', hair: '#eee', hat: 'santa' }, role: 'flavor',
          lines: ['HO ho... ho. *mops brow* Why is the heater ON? COMMITMENT, friend.'] },
        { x: 96, y: 120, dir: 'down', name: 'Elf Bouncer', colors: { shirt: '#2a7d3a', hair: '#caa', hat: 'elf' }, role: 'nicelist',
          greet: ['No stamp till you make the NICE LIST, pal.'],
          repeat: ['Nice List veteran! Go on in.'] }
      ]
    },

    sobering_thoughts: {
      name: 'Sobering Thoughts', room: INTERIOR, mood: M.diner, door: { key: '1,2', tx: 3, ty: 4 },
      intro: ['Sobering Thoughts — 24-hr diner. Grease so honest it could testify.'],
      drinkOnWin: 0,
      onStamp: (g) => { g.eat(40); BC.ui.toast('The grease soaks up the night. (much less tipsy)'); },
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Line Cook', colors: { shirt: '#ddd', hair: '#321', hat: 'chef' }, role: 'challenge', challenge: 'burrito',
          greet: ['You want THE EVERYTHING BURRITO. Of course you do.', 'Finish it and you’re a legend. Also you’ll sober right up.'],
          repeat: ['The burrito remembers you. It’s afraid.'] },
        { x: 64, y: 128, dir: 'right', name: 'Short-Order Sage', colors: { shirt: '#aaa' }, role: 'eatery',
          lines: ['Grab some fries, kid. Soaks up the night.'] }
      ]
    }
  };

  // ---- themed interior palettes + furniture ------------------------------
  const PAL = {
    tipsy_newt: { wall: '#5a4636', floor: '#46362a', floor2: '#402f24', counter: '#7a5a3a' },
    hail_mary: { wall: '#2a3a4a', floor: '#2e3a46', floor2: '#28333e', counter: '#3a4a5a' },
    off_key_west: { wall: '#264a4a', floor: '#1f3a3a', floor2: '#1a3434', counter: '#1f9a9a' },
    pour_decisions: { wall: '#3a2230', floor: '#2e1c26', floor2: '#281620', counter: '#5a2030' },
    sticky_floor: { wall: '#3a3a36', floor: '#2e2e2a', floor2: '#282824', counter: '#5a5a52' },
    cellar_door: { wall: '#4a4a52', floor: '#3a3a40', floor2: '#34343a', counter: '#6a5a4a' },
    witz_end: { wall: '#26264a', floor: '#22223e', floor2: '#1e1e36', counter: '#3a3a6a' },
    deja_brew: { wall: '#2e1e3a', floor: '#261a34', floor2: '#22162e', counter: '#5a3a6a' },
    sleigh: { wall: '#3a2a2a', floor: '#2e3a2e', floor2: '#283428', counter: '#aa3030' },
    sobering_thoughts: { wall: '#3a4048', floor: '#c0c0c8', floor2: '#aeaeb8', counter: '#c4c4cc' },
    speakeasy: { wall: '#2a2030', floor: '#241a28', floor2: '#1e1622', counter: '#3a2a3a' }
  };
  // f(type, tx, ty[, color])
  const f = (type, tx, ty, color) => ({ type, tx, ty, color });
  const FURN = {
    tipsy_newt: [f('fireplace', 11, 1), f('table', 2, 7), f('stool', 2, 6), f('stool', 4, 6), f('table', 11, 8), f('plant', 13, 6), f('rug', 6, 9)],
    hail_mary: [f('tv', 2, 1), f('tv', 6, 1, '#3a4a8a'), f('tv', 10, 1, '#7a2a2a'), f('table', 2, 8), f('table', 11, 8), f('stool', 4, 6), f('stool', 11, 6)],
    off_key_west: [f('stage', 6, 1), f('jukebox', 1, 6), f('table', 2, 9), f('table', 12, 9), f('plant', 13, 6)],
    pour_decisions: [f('shelf', 1, 1), f('shelf', 14, 1), f('table', 3, 8), f('table', 11, 8), f('rug', 6, 9), f('plant', 1, 10)],
    sticky_floor: [f('pooltable', 5, 8), f('dartboard', 13, 1), f('jukebox', 1, 6), f('stool', 2, 6), f('stool', 13, 6)],
    cellar_door: [f('shelf', 1, 1), f('shelf', 14, 1), f('table', 2, 8), f('table', 12, 8), f('stool', 11, 6)],
    witz_end: [f('booth', 1, 9), f('booth', 12, 9), f('plant', 1, 6), f('plant', 14, 6), f('rug', 6, 6)],
    deja_brew: [f('booth', 2, 9), f('jukebox', 14, 6), f('plant', 1, 8), f('table', 11, 8)],
    sleigh: [f('xmastree', 1, 6), f('xmastree', 13, 6), f('fireplace', 7, 1), f('table', 4, 9), f('table', 10, 9)],
    sobering_thoughts: [f('booth', 1, 8), f('booth', 12, 8), f('tv', 6, 1), f('stool', 4, 6), f('stool', 11, 6)],
    speakeasy: [f('booth', 1, 9), f('shelf', 14, 1), f('jukebox', 1, 6), f('table', 11, 9), f('rug', 6, 6)]
  };
  const DRINKS = {
    tipsy_newt: { name: 'a pint of cider', amount: 14 },
    hail_mary: { name: 'a tall lager', amount: 14 },
    off_key_west: { name: 'a mai tai', amount: 16 },
    pour_decisions: { name: 'a bold red', amount: 15 },
    sticky_floor: { name: 'a well whiskey', amount: 18 },
    cellar_door: { name: 'a rare cask ale', amount: 16 },
    witz_end: { name: 'a stiff martini', amount: 17 },
    speakeasy: { name: 'a secret cocktail', amount: 17 }
  };
  const TAGS = {
    tipsy_newt: 'Neighborhood Pub', hail_mary: 'Sports Bar', off_key_west: 'Karaoke Bar',
    pour_decisions: 'Wine Bar', sticky_floor: 'Dive Bar', cellar_door: 'Craft-Beer Cellar',
    witz_end: 'Cocktail Lounge', deja_brew: 'A Bar You Know', sleigh: 'Christmas in July',
    sobering_thoughts: '24-Hour Diner', speakeasy: 'Speakeasy'
  };
  Object.keys(BC.bars).forEach(id => {
    if (PAL[id]) BC.bars[id].palette = PAL[id];
    if (FURN[id]) BC.bars[id].furniture = FURN[id];
    if (DRINKS[id]) BC.bars[id].drink = DRINKS[id];
    if (TAGS[id]) BC.bars[id].tag = TAGS[id];
  });

  // ---- opening hours + happy hour (the routing layer) --------------------
  // minutes are from 5 PM: 120 = 7 PM, 180 = 8 PM, 240 = 9 PM, 420 = midnight
  BC.bars.tipsy_newt.happyHourUntil = 120;
  BC.bars.hail_mary.opensAt = 180;
  BC.bars.hail_mary.hoursMsg = ['"Trivia\'s at EIGHT, champ. Doors at eight. Energy: also eight."'];
  BC.bars.sobering_thoughts.opensAt = 420;
  BC.bars.sobering_thoughts.hoursMsg = ['"The Everything Burrito is a MIDNIGHT special. House rules."', '"The burrito sleeps till 12. Respect that."'];
})();
