// Central game state: the clock, tipsiness, traversal, the punch card, the loop.
(function () {
  const BC = window.BC || (window.BC = {});
  const U = BC.util;

  BC.config = {
    debug: false,                 // dev hotkeys
    timeScale: 0.16,              // in-game minutes per real second (~56 min full night)
    nightMinutes: 540,            // 5:00 PM -> 2:00 AM
    tipsyDecayPerGameMin: 0.18,   // sober up slowly over the night (scales with game-time)
    blackoutAt: 100
  };

  // vehicle tuning
  const VEHICLE = {
    walk: { mult: 1.0, label: 'On Foot' },
    bike: { mult: 1.85, label: 'Bike' },
    scooter: { mult: 2.6, label: 'Scooter' }
  };

  // The punch card — every stop that yields a stamp. Cleared = you win the night.
  const PUNCHCARD = [
    'tipsy_newt', 'pour_decisions', 'hail_mary',
    'off_key_west', 'sticky_floor', 'speakeasy',
    'witz_end', 'deja_brew', 'cellar_door',
    'sleigh', 'sobering_thoughts', 'cocktail'
  ];

  function freshMeta() {
    return {
      knowledge: {},   // learned facts: passwords, schedules, map flags
      items: {},       // owned key items (persist across loops): bike, opener, etc.
      dropped: null,   // { item, key, tx, ty } left behind after a blackout
      loops: 0,
      wins: 0,
      bestStamps: 0,
      blackouts: 0,    // lifetime blackout count — the town remembers
      lastEnd: null,   // { reason, barId } — how the previous night died
      tab: 0,          // the Deja Brew tab, in dollars, across all loops
      mastered: {},    // bars stamped in ANY loop ("regular" status)
      mode: 'night',   // difficulty: 'casual' | 'night' | 'lastcall'
      sound: true,     // music/sfx on
      highscores: {},  // per-bar best scores (persist across loops)
      seenIntro: false
    };
  }

  const game = {
    config: BC.config,
    VEHICLE,
    PUNCHCARD,
    meta: freshMeta(),
    run: null,
    paused: false,
    mood: 'early',

    init() {
      const saved = BC.save.load();
      if (saved && saved.meta) this.meta = Object.assign(freshMeta(), saved.meta);
      if (BC.audio && BC.audio.setMuted) BC.audio.setMuted(!this.meta.sound);
      this.newRun();
    },

    save() { BC.save.write({ meta: this.meta }); },

    newRun() {
      this.meta.loops++;
      this.run = {
        minutes: 0,
        tipsy: 0,
        vehicle: 'walk',
        battery: 0,
        scooterPct: 0,
        cash: 25,         // nightly budget (corner store energy drinks)
        energized: 0,     // seconds of caffeine speed boost
        espresso: 0,      // game-minutes of slowed time remaining
        stamps: {},
        flags: {},        // per-run scratch (npc states, quest progress)
        ended: false,
        endReason: null
      };
      this.mood = 'early';
      if (BC.audio) BC.audio.setMood('early');
      this.save();
    },

    // night length varies by difficulty mode
    nightLen() {
      if (this.meta.mode === 'casual') return 630;    // ~10:30 hrs of night
      if (this.meta.mode === 'lastcall') return 450;  // last call comes EARLY
      return this.config.nightMinutes;
    },

    // ---- time ----
    tick(dt) {
      if (this.paused || !this.run || this.run.ended) return;
      let gmin = dt * this.config.timeScale;
      if (this.run.espresso > 0) { // double espresso: time crawls, eye twitches
        gmin *= 0.8;
        this.run.espresso = Math.max(0, this.run.espresso - gmin);
      }
      this.run.minutes += gmin;
      if (this.run.tipsy > 0) {
        this.run.tipsy = Math.max(0, this.run.tipsy - this.config.tipsyDecayPerGameMin * gmin);
      }
      if (this.run.tipsy < 65) { this.run.flags.warnBlackout = false; this.run.flags.brownoutWarned = false; } // re-arm after sobering
      if (this.brownout() && Math.random() < dt * 0.25 && BC.fx) BC.fx.shake(1.2, 0.18); // the world lurches
      if (this.run.energized > 0) this.run.energized -= dt;
      this._updateMood();
      if (BC.audio) BC.audio.update(this.run.tipsy, this.run.minutes >= this.nightLen() - 60 ? 1 : this.run.minutes >= this.nightLen() - 120 ? 0.5 : 0);
      if (!this.run.flags.lastCallWarned && this.minutesLeft() <= 30) {
        this.run.flags.lastCallWarned = true;
        BC.ui && BC.ui.toast('LAST CALL in 30 minutes. Run.', { good: false });
        BC.audio && BC.audio.sting('lastcall');
      }
      if (this.allStamps()) { this.endNight('complete'); return; }
      if (this.run.minutes >= this.nightLen()) this.endNight('lastcall');
    },

    timeString() { return U.formatTime(this.run.minutes); },
    minutesLeft() { return Math.max(0, this.nightLen() - this.run.minutes); },

    _updateMood() {
      const m = this.run.minutes;
      let mood = 'early';
      if (m >= 240) mood = 'mid';        // ~9 PM
      if (m >= 420) mood = 'late';       // ~midnight
      if (mood !== this.mood && !this.run.flags.barTheme) {
        this.mood = mood;
        if (BC.audio) BC.audio.setMood(mood);
      } else {
        this.mood = mood;
      }
    },

    // ---- tipsiness ----
    drink(v) {
      if (!this.run || this.run.ended) return;
      if (this.meta.mode === 'lastcall') v += 3; // LAST CALL pours heavy
      this.meta.tab += 7; // it all goes on the tab. the tab is eternal.
      this.run.tipsy = U.clamp(this.run.tipsy + v, 0, 100);
      if (BC.audio) BC.audio.sfx('drink');
      if (BC.fx) BC.fx.bubbles();
      if (this.run.tipsy >= 80 && this.run.tipsy < 100 && !this.run.flags.warnBlackout) {
        this.run.flags.warnBlackout = true;
        BC.ui && BC.ui.toast('Careful — one more big one and you BLACK OUT. Grab food/water.', { good: false });
      }
      if (this.brownout() && !this.run.flags.brownoutWarned) {
        this.run.flags.brownoutWarned = true;
        BC.ui && BC.ui.toast('BROWNOUT. The world is soup. Something flickers near your porch...', { good: false });
        if (BC.fx) BC.fx.shake(3, 0.5);
      }
      if (this.run.tipsy >= this.config.blackoutAt) {
        // casual mode is merciful: lose an hour, keep the night
        if (this.meta.mode === 'casual' && BC.flow && BC.flow.softBlackout) BC.flow.softBlackout(this);
        else this.endNight('blackout');
      }
    },
    eat(v) {
      if (!this.run || this.run.ended) return;
      this.run.tipsy = Math.max(0, this.run.tipsy - v);
      if (BC.audio) BC.audio.sfx('eat');
    },
    tipsyTier() {
      const t = this.run.tipsy;
      if (t < 20) return 0;   // sober-ish
      if (t < 50) return 1;   // tipsy
      if (t < 80) return 2;   // drunk
      return 3;               // hammered
    },
    // 85-99: the brownout band. Brutal, woozy, and the only time Future You exists.
    brownout() { return !!this.run && this.run.tipsy >= 85 && this.run.tipsy < this.config.blackoutAt; },

    // ---- traversal ----
    speedMult() { return (VEHICLE[this.run.vehicle] || VEHICLE.walk).mult * (this.run.energized > 0 ? 1.22 : 1); },
    setVehicle(v) { this.run.vehicle = v; },
    rentScooter() {
      this.run.vehicle = 'scooter';
      // battery is ALWAYS insultingly low
      this.run.scooterPct = U.randint(7, 27);
      this.run.battery = this.run.scooterPct;
      this.run.flags.scoot15 = this.run.flags.scoot5 = false;
    },
    drainScooter(dt, moving) {
      if (this.run.vehicle !== 'scooter') return;
      if (moving) this.run.battery -= dt * 1.7; // drops embarrassingly fast
      this.run.scooterPct = Math.max(0, Math.ceil(this.run.battery));
      // the SCOOT app keeps you emotionally informed
      if (this.run.battery > 0 && this.run.scooterPct <= 15 && !this.run.flags.scoot15) {
        this.run.flags.scoot15 = true;
        BC.ui && BC.ui.toast("SCOOT: Battery low. Have you considered walking? We haven't.", { robot: true });
      }
      if (this.run.battery > 0 && this.run.scooterPct <= 5 && !this.run.flags.scoot5) {
        this.run.flags.scoot5 = true;
        BC.ui && BC.ui.toast('SCOOT: Please rate your experience while you still can.', { robot: true });
      }
      if (this.run.battery <= 0) {
        this.run.vehicle = 'walk';
        this.run.battery = 0; this.run.scooterPct = 0;
        BC.ui && BC.ui.toast('Your scooter sighs and dies. (0%)');
        BC.audio && BC.audio.sfx('error');
      }
    },
    ejectScooterFromPark() {
      if (this.run.vehicle !== 'scooter') return false;
      this.run.vehicle = 'walk';
      BC.ui && BC.ui.toast('"This vehicle cannot enter this zone."', { robot: true });
      BC.audio && BC.audio.sfx('error');
      return true;
    },

    // ---- items / knowledge ----
    hasItem(id) { return !!this.meta.items[id]; },
    giveItem(id) { this.meta.items[id] = true; this.save(); },
    takeItem(id) { delete this.meta.items[id]; this.save(); },
    itemList() { return Object.keys(this.meta.items); },
    itemName(id) { return ITEM_NAMES[id] || id; },
    knows(f) { return !!this.meta.knowledge[f]; },
    learn(f) { if (!this.meta.knowledge[f]) { this.meta.knowledge[f] = true; this.save(); } },

    // ---- punch card ----
    // Active card = punch-card stops that actually exist in the build yet.
    // The win condition grows automatically as bars/quests are added.
    activeCard() {
      return PUNCHCARD.filter(id =>
        (BC.bars && BC.bars[id]) || (BC.quests && BC.quests[id]));
    },
    earnStamp(id) {
      if (this.run.stamps[id]) return;
      this.run.stamps[id] = true;
      const n = this.stampCount();
      if (n > this.meta.bestStamps) { this.meta.bestStamps = n; this.save(); }
      this.meta.mastered[id] = true; // "regular" status persists across loops
      BC.ui && BC.ui.toast('* STAMP EARNED: ' + this.stampName(id) + ' *', { good: true });
      if (STAMP_FLAVOR[id] && BC.ui) BC.ui.toast(STAMP_FLAVOR[id], { dur: 3.4 });
      BC.audio && (BC.audio.sting ? BC.audio.sting('stamp') : BC.audio.sfx('stamp'));
      if (BC.fx) { BC.fx.stars(); BC.fx.shake(2, 0.3); }
    },
    highScore(id) { return this.meta.highscores[id] || 0; },
    setHighScore(id, score) {
      if (score == null) return false;
      if (score > (this.meta.highscores[id] || 0)) { this.meta.highscores[id] = score; this.save(); return true; }
      return false;
    },
    hasStamp(id) { return !!this.run.stamps[id]; },
    stampCount() { return this.activeCard().filter(id => this.run.stamps[id]).length; },
    cardSize() { return this.activeCard().length; },
    allStamps() { const c = this.activeCard(); return c.length > 0 && c.every(id => this.run.stamps[id]); },
    stampName(id) { return STAMP_NAMES[id] || id; },

    // ---- endings ----
    endNight(reason) {
      if (!this.run || this.run.ended) return;
      this.run.ended = true;
      this.run.endReason = reason;
      // remember how the night died — NPCs and headlines bring it up tomorrow
      this.meta.lastEnd = {
        reason,
        barId: (reason === 'blackout' && BC.sceneName === 'bar' && BC.scene && BC.scene.id) ? BC.scene.id : null
      };
      if (reason === 'blackout') this.meta.blackouts++;
      this.save();
      const won = reason === 'complete' || (reason === 'lastcall' && this.allStamps());
      if (BC.flow) BC.flow.endNight(reason, won);
    },

    // pick flavor text by loop count: [[minLoops, value], ...] — highest match wins
    loopPick(list) {
      let v = list[0][1];
      for (const e of list) if (this.meta.loops >= e[0]) v = e[1];
      return v;
    }
  };

  const STAMP_NAMES = {
    tipsy_newt: 'The Tipsy Newt', pour_decisions: 'Pour Decisions', hail_mary: 'The Hail Mary',
    off_key_west: 'Off-Key West', sticky_floor: 'The Sticky Floor', speakeasy: "Reggie's",
    witz_end: 'Witz End', deja_brew: 'Deja Brew', cellar_door: 'The Cellar Door',
    sleigh: "Sleigh It Ain't So", sobering_thoughts: 'Sobering Thoughts', cocktail: 'Perfect Cocktail'
  };
  game.STAMP_NAMES = STAMP_NAMES;

  const ITEM_NAMES = { bike: 'Bike', opener: 'Bottle Opener', map: 'Town Map' };
  game.ITEM_NAMES = ITEM_NAMES;

  // one deadpan line per stamp, toasted right after the earn
  const STAMP_FLAVOR = {
    tipsy_newt: 'The stamp is a tiny newt. His name is also Pat.',
    hail_mary: 'The stamp does a tiny wave. The crowd goes mild.',
    off_key_west: 'Stamped in glitter. It will outlive you.',
    pour_decisions: 'The stamp has notes of oak and judgment.',
    sticky_floor: 'The stamp is... sticky. Of course it is.',
    speakeasy: 'Reggie stamps it twice. "One\'s for the fridge."',
    witz_end: 'Stamped, notarized, emotionally devastating.',
    cellar_door: 'The stamp smells like victory and yeast.',
    sleigh: 'The stamp smells like peppermint and regret.',
    sobering_thoughts: 'The stamp is a little burrito at peace.',
    deja_brew: 'It was somehow already stamped. Don\'t dwell.',
    cocktail: 'The stamp is a tiny umbrella. Obviously.'
  };
  game.STAMP_FLAVOR = STAMP_FLAVOR;

  BC.game = game;
  // player movement reads this
  BC.speedMul = function () { return game.run ? game.speedMult() : 1; };
})();
