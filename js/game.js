// Central game state: the clock, tipsiness, traversal, the punch card, the loop.
(function () {
  const BC = window.BC || (window.BC = {});
  const U = BC.util;

  BC.config = {
    debug: true,            // dev hotkeys (disabled in polish)
    timeScale: 0.5,         // in-game minutes per real second (~18 min full night)
    nightMinutes: 540,      // 5:00 PM -> 2:00 AM
    tipsyDecayPerSec: 0.7,  // sober up slowly when not drinking
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
      this.newRun();
    },

    save() { BC.save.write({ meta: this.meta }); },

    newRun() {
      this.meta.loops++;
      this.run = {
        minutes: 0,
        tipsy: 0,
        vehicle: this.hasItem('bike') ? 'walk' : 'walk',
        battery: 0,
        scooterPct: 0,
        stamps: {},
        flags: {},        // per-run scratch (npc states, quest progress)
        ended: false,
        endReason: null
      };
      this.mood = 'early';
      if (BC.audio) BC.audio.setMood('early');
      this.save();
    },

    // ---- time ----
    tick(dt) {
      if (this.paused || !this.run || this.run.ended) return;
      this.run.minutes += dt * this.config.timeScale;
      if (this.run.tipsy > 0) {
        this.run.tipsy = Math.max(0, this.run.tipsy - this.config.tipsyDecayPerSec * dt);
      }
      this._updateMood();
      if (BC.audio) BC.audio.update(this.run.tipsy);
      if (this.run.minutes >= this.config.nightMinutes) this.endNight('lastcall');
    },

    timeString() { return U.formatTime(this.run.minutes); },
    minutesLeft() { return Math.max(0, this.config.nightMinutes - this.run.minutes); },

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
      this.run.tipsy = U.clamp(this.run.tipsy + v, 0, 100);
      if (BC.audio) BC.audio.sfx('drink');
      if (this.run.tipsy >= this.config.blackoutAt) this.endNight('blackout');
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

    // ---- traversal ----
    speedMult() { return (VEHICLE[this.run.vehicle] || VEHICLE.walk).mult; },
    setVehicle(v) { this.run.vehicle = v; },
    rentScooter() {
      this.run.vehicle = 'scooter';
      // battery is ALWAYS insultingly low
      this.run.scooterPct = U.randint(7, 27);
      this.run.battery = this.run.scooterPct;
    },
    drainScooter(dt, moving) {
      if (this.run.vehicle !== 'scooter') return;
      if (moving) this.run.battery -= dt * 1.7; // drops embarrassingly fast
      this.run.scooterPct = Math.max(0, Math.ceil(this.run.battery));
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
      BC.ui && BC.ui.toast('* STAMP EARNED: ' + this.stampName(id) + ' *', { good: true });
      BC.audio && BC.audio.sfx('stamp');
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
      const won = (reason === 'lastcall' && this.allStamps());
      if (BC.flow) BC.flow.endNight(reason, won);
    }
  };

  const STAMP_NAMES = {
    tipsy_newt: 'The Tipsy Newt', pour_decisions: 'Pour Decisions', hail_mary: 'The Hail Mary',
    off_key_west: 'Off-Key West', sticky_floor: 'The Sticky Floor', speakeasy: "Reggie's",
    witz_end: 'Witz End', deja_brew: 'Deja Brew', cellar_door: 'The Cellar Door',
    sleigh: "Sleigh It Ain't So", sobering_thoughts: 'Sobering Thoughts', cocktail: 'Perfect Cocktail'
  };
  game.STAMP_NAMES = STAMP_NAMES;

  BC.game = game;
  // player movement reads this
  BC.speedMul = function () { return game.run ? game.speedMult() : 1; };
})();
