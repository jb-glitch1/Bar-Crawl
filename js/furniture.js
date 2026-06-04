// Interior furniture: drawn sprites + tile footprints (most are solid so you
// walk around them). Used by bars and your home for that "lived-in" feel.
(function () {
  const BC = window.BC || (window.BC = {});
  const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w, h); };
  function disc(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  const SIZE = {
    table: [2, 2], booth: [3, 2], couch: [2, 1], bed: [2, 3], fridge: [1, 2], tv: [2, 1],
    pooltable: [4, 2], stage: [4, 2], jukebox: [1, 2], plant: [1, 1], xmastree: [2, 2],
    fireplace: [2, 1], stool: [1, 1], shelf: [1, 2], dartboard: [1, 1], rug: [3, 2]
  };
  const NONSOLID = { tv: 1, stage: 1, plant: 1, dartboard: 1, fireplace: 1, shelf: 1, rug: 1 };

  const F = {
    size(t) { return SIZE[t] || [1, 1]; },
    solid(t) { return !NONSOLID[t]; },
    // sort key (bottom of footprint) for depth
    footY(f) { return (f.ty + (SIZE[f.type] ? SIZE[f.type][1] : 1)) * 16; },

    draw(ctx, f) {
      const x = f.tx * 16, y = f.ty * 16, t = f.type, c = f.color;
      switch (t) {
        case 'table':
          px(ctx, x + 4, y + 18, 3, 9, '#5a3a22'); px(ctx, x + 25, y + 18, 3, 9, '#5a3a22');
          disc(ctx, x + 16, y + 14, 12, '#7a4a2a'); disc(ctx, x + 16, y + 13, 11, '#9a6238'); disc(ctx, x + 13, y + 10, 3, '#b6804a');
          break;
        case 'booth':
          px(ctx, x + 1, y + 2, 46, 9, '#6a2f3a'); px(ctx, x + 1, y + 2, 46, 2, '#8a4350'); // bench back
          px(ctx, x + 6, y + 14, 36, 12, '#5a3a22'); px(ctx, x + 8, y + 15, 32, 3, '#7a4a2a'); // table
          break;
        case 'couch':
          px(ctx, x + 1, y + 3, 30, 11, c || '#3a6a8a'); px(ctx, x + 1, y + 1, 30, 3, c || '#4a7a9a');
          px(ctx, x + 1, y + 4, 4, 9, '#2f586f'); px(ctx, x + 27, y + 4, 4, 9, '#2f586f');
          break;
        case 'bed':
          px(ctx, x + 1, y + 4, 30, 42, '#caa'); px(ctx, x + 2, y + 16, 28, 30, c || '#5a7aa0'); // blanket
          px(ctx, x + 4, y + 6, 24, 8, '#fff'); // pillow
          break;
        case 'fridge':
          px(ctx, x + 2, y + 1, 12, 30, '#e8e8ee'); px(ctx, x + 2, y + 15, 12, 1, '#b8b8c0'); px(ctx, x + 11, y + 5, 1, 6, '#889'); px(ctx, x + 11, y + 19, 1, 6, '#889');
          break;
        case 'tv':
          px(ctx, x + 2, y + 2, 28, 13, '#111'); px(ctx, x + 4, y + 4, 24, 9, c || '#2a6a3a'); // a game on the screen
          px(ctx, x + 6, y + 6, 6, 2, '#fff'); px(ctx, x + 20, y + 9, 4, 2, '#ffe27a');
          break;
        case 'pooltable':
          px(ctx, x + 2, y + 3, 60, 26, '#5a3a22'); px(ctx, x + 5, y + 6, 54, 20, '#2f8a4a');
          disc(ctx, x + 18, y + 16, 2, '#fff'); disc(ctx, x + 30, y + 14, 2, '#e33'); disc(ctx, x + 40, y + 18, 2, '#33e'); disc(ctx, x + 33, y + 16, 2, '#111');
          break;
        case 'stage':
          px(ctx, x + 1, y + 16, 62, 14, '#3a2a3a'); px(ctx, x + 1, y + 14, 62, 3, '#6a4a6a');
          px(ctx, x + 30, y + 2, 2, 14, '#888'); disc(ctx, x + 31, y + 3, 3, '#333'); // mic
          break;
        case 'jukebox':
          px(ctx, x + 2, y + 2, 12, 28, '#7a2a5a'); px(ctx, x + 3, y + 4, 10, 8, '#ffd166'); px(ctx, x + 4, y + 14, 8, 12, '#2a1a2a');
          px(ctx, x + 5, y + 16, 6, 2, '#ff5a8a'); px(ctx, x + 5, y + 20, 6, 2, '#5ad0ff');
          break;
        case 'plant':
          px(ctx, x + 5, y + 10, 6, 5, '#9a5a3a'); disc(ctx, x + 8, y + 6, 5, '#2f8a44'); disc(ctx, x + 5, y + 4, 3, '#3c9a52'); disc(ctx, x + 11, y + 4, 3, '#3c9a52');
          break;
        case 'xmastree':
          px(ctx, x + 14, y + 26, 4, 4, '#6a4a2a');
          for (let i = 0; i < 4; i++) px(ctx, x + 8 - i, y + 8 + i * 5, 16 + i * 2, 5, '#2a8a3a');
          px(ctx, x + 14, y + 2, 4, 4, '#ffe27a');
          px(ctx, x + 10, y + 14, 2, 2, '#e33'); px(ctx, x + 18, y + 18, 2, 2, '#39e'); px(ctx, x + 14, y + 22, 2, 2, '#ffd166');
          break;
        case 'fireplace':
          px(ctx, x + 2, y + 2, 28, 13, '#5a4a44'); px(ctx, x + 8, y + 7, 16, 8, '#2a1a14');
          px(ctx, x + 12, y + 9, 8, 6, '#ff7a2a'); px(ctx, x + 14, y + 10, 4, 4, '#ffd166');
          break;
        case 'stool':
          px(ctx, x + 5, y + 9, 6, 6, '#5a3a22'); px(ctx, x + 6, y + 6, 4, 3, '#8a4350');
          break;
        case 'shelf':
          px(ctx, x + 1, y + 2, 14, 28, '#3a2a1a');
          ['#7ed07e', '#ffd166', '#ff6b6b', '#7ad0ff', '#caa15a'].forEach((cc, i) => px(ctx, x + 2 + (i % 3) * 4, y + 4 + ((i / 3) | 0) * 12, 3, 9, cc));
          break;
        case 'dartboard':
          disc(ctx, x + 8, y + 8, 7, '#2a3a5a'); disc(ctx, x + 8, y + 8, 5, '#b04040'); disc(ctx, x + 8, y + 8, 2, '#ffe27a');
          break;
        case 'rug':
          px(ctx, x + 2, y + 2, 44, 28, c || '#7a2f3f'); px(ctx, x + 5, y + 5, 38, 22, c ? c : '#9a3f52');
          break;
      }
    }
  };

  BC.furniture = F;
})();
