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
    cozy:    { tempo: 0.27, wave: 'triangle', root: 220.0, scale: [0, 2, 4, 7, 9], bassEvery: 4, gain: 0.15 },
    sports:  { tempo: 0.15, wave: 'sawtooth', root: 174.6, scale: [0, 4, 7, 11], bassEvery: 2, gain: 0.13 },
    karaoke: { tempo: 0.20, wave: 'square',   root: 261.6, scale: [0, 2, 4, 5, 7, 9], bassEvery: 4, gain: 0.13 },
    dive:    { tempo: 0.34, wave: 'sawtooth', root: 130.8, scale: [0, 3, 5, 7, 10], bassEvery: 4, gain: 0.13 },
    wine:    { tempo: 0.30, wave: 'triangle', root: 233.1, scale: [0, 2, 4, 5, 9, 11], bassEvery: 4, gain: 0.12 },
    wits:    { tempo: 0.16, wave: 'square',   root: 155.6, scale: [0, 2, 3, 5, 7, 8, 11], bassEvery: 2, gain: 0.13 },
    dungeon: { tempo: 0.24, wave: 'square',   root: 164.8, scale: [0, 2, 3, 7, 8], bassEvery: 4, gain: 0.13 },
    xmas:    { tempo: 0.22, wave: 'square',   root: 261.6, scale: [0, 2, 4, 5, 7, 9, 11], bassEvery: 4, gain: 0.13 },
    diner:   { tempo: 0.26, wave: 'triangle', root: 196.0, scale: [0, 3, 5, 7, 10], bassEvery: 4, gain: 0.13 },
    deja:    { tempo: 0.32, wave: 'sawtooth', root: 138.6, scale: [0, 1, 4, 6, 8, 10], bassEvery: 8, gain: 0.12 },
    speak:   { tempo: 0.30, wave: 'sawtooth', root: 146.8, scale: [0, 3, 5, 6, 7, 10], bassEvery: 4, gain: 0.12 }
  };

  BC.bars = {
    // ---- Tier 1: normal ---------------------------------------------------
    tipsy_newt: {
      name: 'The Tipsy Newt', room: INTERIOR, mood: M.cozy, door: { key: '0,0', tx: 3, ty: 2 },
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
      name: 'The Hail Mary', room: INTERIOR, mood: M.sports, door: { key: '1,0', tx: 3, ty: 2 },
      intro: ['The Hail Mary. Forty screens, thirty-nine showing a game you don’t care about.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Trivia Host', colors: { shirt: '#c4423a' }, role: 'challenge', challenge: 'trivia',
          greet: ['TUESDAY TRIVIA, baby! Buzz in, big shot.', 'Get most of ’em right and the stamp is yours.'],
          repeat: ['Our reigning champ returns! No pressure.'] },
        { x: 60, y: 128, dir: 'right', name: 'Superfan', colors: { shirt: '#2a6ad0' }, role: 'password_giver', password: 'FLAMINGO',
          lines: ['We are DEFINITELY winning this one.', 'We are not winning this one.'] }
      ]
    },

    off_key_west: {
      name: 'Off-Key West', room: INTERIOR, mood: M.karaoke, door: { key: '2,0', tx: 3, ty: 2 },
      intro: ['Off-Key West. Tropical shirts, zero pitch, infinite confidence.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'The KJ', colors: { shirt: '#1aa3a3', hair: '#eee' }, role: 'challenge', challenge: 'rhythm',
          greet: ['You’re up next! Hit the notes, ride the wave.', 'Fair warning: the drunker you are, the more they wobble.'],
          repeat: ['Encore! The crowd (one guy) demands it.'] },
        { x: 64, y: 130, dir: 'right', name: 'Tiki Bartender', colors: { shirt: '#d08a2a' }, role: 'ingredient', ingredient: 'umbrella',
          lines: ['Every drink here comes with a tiny paper umbrella. Every one.'] }
      ]
    },

    sticky_floor: {
      name: 'The Sticky Floor', room: INTERIOR, mood: M.dive, door: { key: '1,1', tx: 3, ty: 2 },
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
      name: 'Pour Decisions', room: INTERIOR, mood: M.wine, door: { key: '2,0', tx: 12, ty: 2 },
      intro: ['Pour Decisions. Candlelit, smug, and judging your shoes.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Sommelier', colors: { shirt: '#5a2030', hair: '#222' }, role: 'challenge', challenge: 'tasting',
          greet: ['Ah. A "palate." Prove it — describe these vintages.', 'Pretension is rewarded. Honesty is not.'],
          repeat: ['The connoisseur returns. Bravo.'] },
        { x: 64, y: 128, dir: 'right', name: 'Garden Mint', colors: { shirt: '#3a8a5a' }, role: 'ingredient', ingredient: 'mint',
          lines: ['A pot of suspiciously perfect mint sits on the bar.'] }
      ]
    },

    cellar_door: {
      name: 'The Cellar Door', room: INTERIOR, mood: M.dungeon, door: { key: '1,1', tx: 12, ty: 2 },
      intro: ['The Cellar Door. A craft-beer cave. The good stuff is... downstairs.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Cellar Keeper', colors: { shirt: '#4a3a2a', hair: '#322' }, role: 'challenge', challenge: 'dungeon',
          greet: ['Want the rare cask? It’s down in the cellar.', 'Fair warning: I "redecorated" with kegs. Find the opener.'],
          repeat: ['Back to the cellar, brave soul?'] }
      ]
    },

    // Reggie's — entered only via the gated storefront in Backstreets
    speakeasy: {
      name: "Reggie's", room: INTERIOR, mood: M.speak, door: { key: '2,1', tx: 12, ty: 2 },
      intro: ['Behind the fridge: velvet, candlelight, and zero refrigerators. You’re IN.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Reggie', colors: { shirt: '#222', hair: '#111' }, role: 'speakeasy',
          greet: ['You found us. Most folks just see a sad fridge shop.', 'Welcome to the real party. Stamp’s yours, VIP.'],
          repeat: ['The usual booth’s open, VIP.'] },
        { x: 64, y: 130, dir: 'right', name: 'Lounge Singer', colors: { shirt: '#6a2a4a' }, role: 'flavor',
          lines: ['*croons a speakeasy classic you definitely don’t recognize*'] }
      ]
    },

    // ---- Tier 3: bespoke-strange -----------------------------------------
    witz_end: {
      name: 'Witz End', room: INTERIOR, mood: M.wits, door: { key: '2,1', tx: 3, ty: 2 },
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
      name: 'Deja Brew', room: INTERIOR, mood: M.deja, door: { key: '2,2', tx: 3, ty: 2 },
      intro: ['Deja Brew. You feel like you’ve been here before. You have. Many times.'],
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'The Bartender', colors: { shirt: '#33384a', hair: '#556' }, role: 'deja' },
        { x: 196, y: 126, dir: 'left', name: 'Mysterious Patron', colors: { shirt: '#5a2a6a', hair: '#211' }, role: 'quest_cocktail' }
      ]
    },

    sleigh: {
      name: "Sleigh It Ain't So", room: INTERIOR, mood: M.xmas, door: { key: '0,2', tx: 3, ty: 2 },
      intro: ['SLEIGH IT AIN’T SO. It is 90 degrees out. Inside: fake snow, real sweat, a heater running next to the AC.'],
      npcs: [
        { x: 150, y: 56, dir: 'down', name: 'Sweaty Santa', colors: { shirt: '#b23', hair: '#eee' }, role: 'flavor',
          lines: ['HO ho... ho. *mops brow* Why is the heater ON? COMMITMENT, friend.'] },
        { x: 96, y: 120, dir: 'down', name: 'Elf Bouncer', colors: { shirt: '#2a7d3a', hair: '#caa' }, role: 'nicelist',
          greet: ['No stamp till you make the NICE LIST, pal.'],
          repeat: ['Nice List veteran! Go on in.'] }
      ]
    },

    sobering_thoughts: {
      name: 'Sobering Thoughts', room: INTERIOR, mood: M.diner, door: { key: '1,2', tx: 3, ty: 2 },
      intro: ['Sobering Thoughts — 24-hr diner. Grease so honest it could testify.'],
      drinkOnWin: 0,
      onStamp: (g) => { g.eat(40); BC.ui.toast('The grease soaks up the night. (much less tipsy)'); },
      npcs: [
        { x: 120, y: 56, dir: 'down', name: 'Line Cook', colors: { shirt: '#ddd', hair: '#321' }, role: 'challenge', challenge: 'burrito',
          greet: ['You want THE EVERYTHING BURRITO. Of course you do.', 'Finish it and you’re a legend. Also you’ll sober right up.'],
          repeat: ['The burrito remembers you. It’s afraid.'] },
        { x: 64, y: 128, dir: 'right', name: 'Short-Order Sage', colors: { shirt: '#aaa' }, role: 'eatery',
          lines: ['Grab some fries, kid. Soaks up the night.'] }
      ]
    }
  };
})();
