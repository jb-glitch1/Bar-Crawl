// localStorage persistence (meta only — knowledge + items survive loops; the run resets).
(function () {
  const BC = window.BC || (window.BC = {});
  const KEY = 'barcrawl.save.v1';
  const has = (typeof localStorage !== 'undefined');

  BC.save = {
    load() {
      if (!has) return null;
      try { return JSON.parse(localStorage.getItem(KEY)) || null; }
      catch (e) { return null; }
    },
    write(obj) {
      if (!has) return;
      try { localStorage.setItem(KEY, JSON.stringify(obj)); }
      catch (e) { /* private mode / quota — fail quietly */ }
    },
    clear() {
      if (!has) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})();
