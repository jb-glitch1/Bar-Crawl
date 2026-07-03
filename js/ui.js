// UI layer: toasts, dialogue boxes, the Start status menu, fades, and cutscenes.
// Runs on top of whatever scene is active. Pauses time + blocks movement while modal.
(function () {
  const BC = window.BC || (window.BC = {});
  const W = 256, H = 240;

  let toasts = [];
  let dialogue = null;   // { pages:[[lines]], idx, opts, cb }
  let choice = null;     // { lines, options, sel, cb }
  let menu = false;
  let fade = null;       // { a, target, speed, color }
  let cut = null;        // { steps, i, busy }

  function wrap(str, max) {
    const words = String(str).split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w; }
      else line = (line ? line + ' ' : '') + w;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function paginate(input, max, perPage) {
    const arr = Array.isArray(input) ? input : [input];
    let lines = [];
    arr.forEach(s => { lines = lines.concat(wrap(s, max)); lines.push('\u0000'); });
    // split on explicit breaks + page size
    const pages = []; let page = [];
    for (const ln of lines) {
      if (ln === '\u0000') { if (page.length) { pages.push(page); page = []; } continue; }
      page.push(ln);
      if (page.length >= perPage) { pages.push(page); page = []; }
    }
    if (page.length) pages.push(page);
    return pages.length ? pages : [['']];
  }

  const ui = {
    get blocking() { return !!(menu || dialogue || choice || cut); },
    get menuOpen() { return menu; },

    toast(text, opts) {
      opts = opts || {};
      toasts.push({ text, t: 0, dur: opts.dur || 2.6, robot: !!opts.robot, good: !!opts.good });
      if (toasts.length > 4) toasts.shift();
    },

    // say(lines, opts, cb) — lines: string or array of strings (each = a "page break")
    say(lines, opts, cb) {
      opts = opts || {};
      dialogue = { pages: paginate(lines, 36, 3), idx: 0, opts, cb: cb || null, blink: 0 };
    },

    // choose(prompt, options, cb) — cb(index) (or -1 if cancelled with X)
    choose(prompt, options, opts, cb) {
      if (typeof opts === 'function') { cb = opts; opts = {}; }
      opts = opts || {};
      choice = { lines: wrap(prompt, 36), options, sel: 0, opts, cb: cb || null };
    },

    fadeTo(target, dur, color) {
      const from = fade ? fade.a : (target > 0.5 ? 0 : 1);
      fade = { a: from, target, speed: Math.abs(target - from) / Math.max(0.001, dur || 0.6), color: color || '#000' };
    },

    cutscene(steps, done) {
      cut = { steps: steps.slice(), i: 0, busy: false, done: done || null };
    },

    // called on every scene change: drop transient modals (but keep cutscene/fade,
    // since cutscenes are what drive scene changes)
    sceneCleanup() { menu = false; dialogue = null; choice = null; },

    update(dt) {
      // toasts
      for (const t of toasts) t.t += dt;
      toasts = toasts.filter(t => t.t < t.dur);

      // fade animation
      if (fade) {
        if (fade.a < fade.target) fade.a = Math.min(fade.target, fade.a + fade.speed * dt);
        else if (fade.a > fade.target) fade.a = Math.max(fade.target, fade.a - fade.speed * dt);
      }

      if (cut) { this._cut(dt); if (dialogue) this._dialogue(dt); }
      else if (choice) { this._choice(dt); }
      else if (dialogue) { this._dialogue(dt); }
      else if (menu) { this._menu(dt); }
      else {
        if (BC.input.pressed('start')) { menu = true; BC.audio && BC.audio.sfx('blip'); }
      }

      BC.game && (BC.game.paused = this.blocking);
    },

    _dialogue(dt) {
      dialogue.blink += dt;
      if (BC.input.pressed('a') || BC.input.pressed('start')) {
        dialogue.idx++;
        BC.audio && BC.audio.sfx('blip');
        if (dialogue.idx >= dialogue.pages.length) {
          const cb = dialogue.cb; dialogue = null;
          if (cb) cb();
        }
      } else if (BC.input.pressed('b')) {
        // X backs out of / skips the conversation
        const cb = dialogue.cb; dialogue = null;
        BC.audio && BC.audio.sfx('cancel');
        if (cb) cb();
      }
    },

    _menu(dt) {
      if (BC.input.pressed('start') || BC.input.pressed('b')) {
        menu = false; BC.audio && BC.audio.sfx('cancel');
      }
    },

    _choice(dt) {
      const n = choice.options.length;
      if (BC.input.pressed('up')) { choice.sel = (choice.sel + n - 1) % n; BC.audio && BC.audio.sfx('blip'); }
      if (BC.input.pressed('down')) { choice.sel = (choice.sel + 1) % n; BC.audio && BC.audio.sfx('blip'); }
      if (BC.input.pressed('a')) {
        const cb = choice.cb, i = choice.sel; choice = null;
        BC.audio && BC.audio.sfx('confirm'); if (cb) cb(i);
      } else if (BC.input.pressed('b') && choice.opts.cancelable !== false) {
        const cb = choice.cb; choice = null;
        BC.audio && BC.audio.sfx('cancel'); if (cb) cb(-1);
      }
    },

    _cut(dt) {
      if (cut.busy) {
        // waiting on a fade to settle, a timer, or a dialogue to close
        if (cut.wait != null) { cut.wait -= dt; if (cut.wait <= 0) { cut.wait = null; cut.busy = false; } return; }
        if (cut.onFade) { if (Math.abs(fade.a - fade.target) < 0.001) { cut.onFade = false; cut.busy = false; } return; }
        if (cut.onSay) { if (!dialogue) { cut.onSay = false; cut.busy = false; } return; }
        cut.busy = false;
        return;
      }
      if (cut.i >= cut.steps.length) {
        const d = cut.done; cut = null; if (d) d(); return;
      }
      const s = cut.steps[cut.i++];
      if (s.fadeOut != null) { this.fadeTo(1, s.dur || 0.7, s.color); cut.busy = true; cut.onFade = true; }
      else if (s.fadeIn != null) { this.fadeTo(0, s.dur || 0.7, s.color); cut.busy = true; cut.onFade = true; }
      else if (s.text != null) { this.say(s.text, s.opts || {}); cut.busy = true; cut.onSay = true; }
      else if (s.wait != null) { cut.wait = s.wait; cut.busy = true; }
      else if (s.do) { s.do(); }
      else if (s.music) { BC.audio && BC.audio.setMood(s.music); }
    },

    render(ctx) {
      if (menu) this._renderMenu(ctx);
      if (dialogue) this._renderDialogue(ctx);
      if (choice) this._renderChoice(ctx);
      this._renderToasts(ctx);
      if (fade && fade.a > 0.001) {
        ctx.globalAlpha = fade.a; BC.rect(ctx, 0, 0, W, H, fade.color); ctx.globalAlpha = 1;
      }
    },

    _renderToasts(ctx) {
      let y = 30;
      for (const t of toasts) {
        const a = t.t > t.dur - 0.4 ? (t.dur - t.t) / 0.4 : 1;
        ctx.globalAlpha = Math.max(0, a);
        const col = t.robot ? '#7ad0ff' : (t.good ? '#ffe27a' : '#ffffff');
        BC.text(ctx, t.text, W / 2, y, { color: col, size: 8, align: 'center' });
        ctx.globalAlpha = 1;
        y += 12;
      }
    },

    _renderDialogue(ctx) {
      const x = 10, y = H - 64, w = W - 20, h = 54;
      BC.panel(ctx, x, y, w, h);
      const page = dialogue.pages[dialogue.idx] || [];
      if (dialogue.opts.speaker) {
        BC.text(ctx, dialogue.opts.speaker, x + 6, y - 9, { color: '#ffe27a', size: 8 });
      }
      const col = dialogue.opts.robot ? '#7ad0ff' : '#eef';
      page.forEach((ln, i) => BC.text(ctx, ln, x + 8, y + 8 + i * 13, { color: col, size: 9 }));
      if ((dialogue.blink % 0.8) < 0.4) {
        BC.text(ctx, dialogue.idx < dialogue.pages.length - 1 ? '▼' : '■', x + w - 14, y + h - 14, { color: '#fff', size: 8 });
      }
    },

    _renderChoice(ctx) {
      const pad = 6;
      const h = 10 + choice.lines.length * 11 + choice.options.length * 13 + pad;
      const w = BC.W - 20, x = 10, y = BC.H - h - 8;
      BC.panel(ctx, x, y, w, h);
      choice.lines.forEach((ln, i) => BC.text(ctx, ln, x + 8, y + 6 + i * 11, { color: '#eef', size: 9 }));
      const oy = y + 8 + choice.lines.length * 11;
      const tier = (BC.game && BC.game.run) ? BC.game.tipsyTier() : 0;
      choice.options.forEach((o, i) => {
        const on = i === choice.sel;
        // your own menu options betray you when you're drunk
        let label = BC.util.drunkify(o, tier, i);
        if (tier >= 3 && on && o.length < 22) label += ' (you got this)';
        BC.text(ctx, (on ? '> ' : '  ') + label, x + 12, oy + i * 13, { color: on ? '#ffe27a' : '#bcd', size: 9 });
      });
    },

    _renderMenu(ctx) {
      const g = BC.game, r = g.run;
      BC.rect(ctx, 0, 0, W, H, 'rgba(4,4,10,0.55)');
      const x = 26, y = 14, w = W - 52, h = H - 26;
      BC.panel(ctx, x, y, w, h);
      BC.text(ctx, '- STATUS -', W / 2, y + 8, { color: '#ffe27a', size: 10, align: 'center' });

      let yy = y + 26;
      const row = (label, val, col) => {
        BC.text(ctx, label, x + 12, yy, { color: '#9aa', size: 9 });
        BC.text(ctx, val, x + w - 12, yy, { color: col || '#fff', size: 9, align: 'right' });
        yy += 14;
      };
      row('Time', g.timeString(), '#9ed0ff');
      // tipsiness bar
      BC.text(ctx, 'Tipsiness', x + 12, yy, { color: '#9aa', size: 9 });
      const bx = x + 92, bw = w - 104, bh = 8;
      BC.rect(ctx, bx, yy, bw, bh, '#222');
      const tcol = r.tipsy < 50 ? '#7ed07e' : r.tipsy < 80 ? '#ffd166' : '#ff6b6b';
      BC.rect(ctx, bx + 1, yy + 1, Math.max(0, (bw - 2) * r.tipsy / 100), bh - 2, tcol);
      ctx.strokeStyle = '#556'; ctx.strokeRect(bx + 0.5, yy + 0.5, bw - 1, bh - 1);
      yy += 16;
      const vlabel = g.VEHICLE[r.vehicle].label + (r.vehicle === 'scooter' ? ' (' + r.scooterPct + '%)' : '');
      row('Getting around', vlabel);
      row('Cash', '$' + r.cash, '#9be29b');
      const card = g.activeCard();
      row('Stamps', g.stampCount() + ' / ' + card.length, '#ffe27a');

      // town map: 3x3 of screens, gold dot = stamped bar, white box = you are here
      yy += 4;
      BC.text(ctx, 'Town map  (* = stamped, [] = you)', x + 12, yy, { color: '#9aa', size: 8 }); yy += 12;
      const mapX = x + 16, mapW = w - 32, cw = mapW / 3, ch = 22, mapY = yy;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const scr = BC.world.screens[sx + ',' + sy]; if (!scr) continue;
        const cx0 = mapX + sx * cw, cy0 = mapY + sy * ch;
        BC.rect(ctx, cx0, cy0, cw - 3, ch - 3, scr.meta.park ? '#274a30' : '#23232e');
        let di = 0;
        (scr.meta.buildings || []).forEach(b => {
          const sid = b.id === 'reggies' ? 'speakeasy' : b.id;
          if (g.activeCard().indexOf(sid) < 0) return;
          const dx2 = cx0 + 9 + di * 13, dy2 = cy0 + (ch - 3) / 2;
          BC.rect(ctx, dx2 - 3, dy2 - 3, 6, 6, g.hasStamp(sid) ? '#ffe27a' : '#5a5a66');
          di++;
        });
        if (BC.world.here === sx + ',' + sy) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cw - 4, ch - 4); }
      }
      yy = mapY + 3 * ch + 4;

      const items = g.itemList();
      row('Items', items.length ? items.map(prettyItem).join(', ') : '(none)', '#cfe');
      BC.text(ctx, 'M / Esc to close', W / 2, y + h - 14, { color: '#778', size: 8, align: 'center' });
    }
  };

  function prettyItem(id) { return BC.game.itemName(id); }

  BC.ui = ui;
})();
