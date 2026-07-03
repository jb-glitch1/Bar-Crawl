// Procedural pixel graphics — no external image assets.
(function () {
  const BC = window.BC || (window.BC = {});
  const gfx = {};

  function px(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w, h);
  }
  gfx.px = px;

  // Draw a 16x16 humanoid actor with top-left at (x,y).
  // dir: 'up'|'down'|'left'|'right', frame: walk-cycle index, col: palette overrides.
  gfx.actor = function (ctx, x, y, dir, frame, col) {
    const C = Object.assign({
      skin: '#e8b890', hair: '#3a2a1f', shirt: '#c0444f',
      pants: '#2a3040', shoe: '#15161d', eye: '#1a1a22'
    }, col || {});
    const f = (frame | 0) & 1;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 15.5, 5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs + walk-bob shoes
    px(ctx, x + 5, y + 12, 2, 3, C.pants);
    px(ctx, x + 9, y + 12, 2, 3, C.pants);
    px(ctx, x + 5, y + 14 + (f ? 0 : 1), 2, 1, C.shoe);
    px(ctx, x + 9, y + 14 + (f ? 1 : 0), 2, 1, C.shoe);

    // torso + head bob 1px on the off-step so walking reads as motion
    const yb = y - (f ? 1 : 0);

    // body + arms
    px(ctx, x + 4, yb + 7, 8, 5, C.shirt);
    px(ctx, x + 3, yb + 7, 1, 4, C.shirt);
    px(ctx, x + 12, yb + 7, 1, 4, C.shirt);
    px(ctx, x + 3, yb + 11, 1, 1, C.skin);
    px(ctx, x + 12, yb + 11, 1, 1, C.skin);

    // head
    px(ctx, x + 4, yb + 2, 8, 6, C.skin);
    px(ctx, x + 4, yb + 1, 8, 2, C.hair);
    if (dir === 'down') {
      px(ctx, x + 4, yb + 2, 2, 2, C.hair);
      px(ctx, x + 10, yb + 2, 2, 2, C.hair);
      px(ctx, x + 6, yb + 5, 1, 1, C.eye);
      px(ctx, x + 9, yb + 5, 1, 1, C.eye);
    } else if (dir === 'up') {
      px(ctx, x + 4, yb + 2, 8, 3, C.hair);
    } else if (dir === 'left') {
      px(ctx, x + 9, yb + 2, 3, 4, C.hair);   // back of head trails on the right
      px(ctx, x + 5, yb + 5, 1, 1, C.eye);    // face/eye leads on the left
    } else if (dir === 'right') {
      px(ctx, x + 4, yb + 2, 3, 4, C.hair);   // back of head trails on the left
      px(ctx, x + 10, yb + 5, 1, 1, C.eye);   // face/eye leads on the right
    }

    // headwear/props give the cast identity (a few rects each)
    const hat = (col && col.hat) || null;
    if (hat === 'santa') {
      px(ctx, x + 4, yb, 8, 2, '#e8e8ee');
      px(ctx, x + 4, yb - 2, 7, 2, '#c03434');
      px(ctx, x + 10, yb - 3, 3, 3, '#fff');
    } else if (hat === 'elf') {
      px(ctx, x + 4, yb, 8, 2, '#2a7d3a');
      px(ctx, x + 6, yb - 2, 4, 2, '#2a7d3a');
      px(ctx, x + 9, yb - 3, 2, 2, '#ffd166');
    } else if (hat === 'fedora') {
      px(ctx, x + 3, yb + 1, 10, 1, '#1c1c22');
      px(ctx, x + 4, yb - 2, 8, 3, '#33333c');
      px(ctx, x + 4, yb - 1, 8, 1, '#4a4a56');
    } else if (hat === 'chef') {
      px(ctx, x + 4, yb - 3, 8, 4, '#f4f4f8');
      px(ctx, x + 3, yb - 4, 4, 3, '#f4f4f8');
      px(ctx, x + 9, yb - 4, 4, 3, '#f4f4f8');
    } else if (hat === 'cap') {
      px(ctx, x + 4, yb, 8, 2, '#c4423a');
      px(ctx, x + 10, yb + 1, 4, 1, '#a03028');
    } else if (hat === 'lei') {
      px(ctx, x + 5, yb + 7, 1, 1, '#ff6b9a'); px(ctx, x + 7, yb + 7, 1, 1, '#ffe27a');
      px(ctx, x + 9, yb + 7, 1, 1, '#7ad0ff'); px(ctx, x + 11, yb + 7, 1, 1, '#ff6b9a');
    } else if (hat === 'bow') {
      px(ctx, x + 6, yb + 7, 1, 2, '#1a1a22'); px(ctx, x + 9, yb + 7, 1, 2, '#1a1a22');
      px(ctx, x + 7, yb + 7, 2, 2, '#5a2030');
    }
  };

  // a stand-up kick/e-scooter, drawn at the same top-left as the actor (under it)
  gfx.scooter = function (ctx, x, y, dir) {
    const deck = '#d4d8dc', wheel = '#141419', stem = '#a9afb5', grip = '#2c3036', led = '#7ad0ff';
    if (dir === 'left' || dir === 'right') {
      const fx = dir === 'right' ? x + 12 : x + 3; // stem/front x
      px(ctx, x + 2, y + 14, 12, 2, deck);          // deck
      px(ctx, x + 1, y + 15, 3, 3, wheel);          // rear wheel
      px(ctx, x + 12, y + 15, 3, 3, wheel);         // front wheel
      px(ctx, fx, y + 4, 2, 11, stem);              // stem
      px(ctx, fx - 2, y + 3, 6, 2, grip);           // handlebar
      px(ctx, dir === 'right' ? fx + 2 : fx - 1, y + 5, 1, 1, led); // headlight
    } else {
      const fy = dir === 'up' ? y + 4 : y + 13;
      px(ctx, x + 7, y + 8, 3, 8, deck);            // deck (vertical)
      px(ctx, x + 6, y + 7, 5, 2, wheel);           // wheel
      px(ctx, x + 6, y + 15, 5, 2, wheel);          // wheel
      px(ctx, x + 7, fy, 3, 3, stem);               // stem
      px(ctx, x + 4, fy, 9, 2, grip);               // handlebar
    }
  };

  // a simple bicycle, same coordinate convention
  gfx.bike = function (ctx, x, y, dir) {
    const wheel = '#15151c', hub = '#3a3a44', frame = '#c0444f';
    if (dir === 'left' || dir === 'right') {
      px(ctx, x + 1, y + 13, 4, 4, wheel); px(ctx, x + 11, y + 13, 4, 4, wheel);
      px(ctx, x + 2, y + 14, 2, 2, hub);   px(ctx, x + 12, y + 14, 2, 2, hub);
      px(ctx, x + 4, y + 10, 8, 2, frame); // top tube
      const right = dir === 'right';
      px(ctx, right ? x + 11 : x + 3, y + 7, 2, 5, frame); // handlebars lead the travel direction
      px(ctx, right ? x + 5 : x + 9, y + 9, 2, 3, frame);  // seat trails behind
    } else {
      px(ctx, x + 6, y + 13, 4, 4, wheel);
      px(ctx, x + 7, y + 14, 2, 2, hub);
      px(ctx, x + 4, y + 8, 8, 2, frame);  // handlebar
      px(ctx, x + 7, y + 9, 2, 5, frame);
    }
  };

  // a small dog you can pet
  gfx.dog = function (ctx, x, y, dir, frame, col) {
    const body = (col && col.body) || '#9a6a3a', dark = (col && col.dark) || '#6a4a26';
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x + 8, y + 15, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    const f = (frame | 0) & 1;
    px(ctx, x + 3, y + 8, 9, 4, body);                 // body
    px(ctx, x + 4, y + 12, 2, 3 - f, dark);            // legs (tiny trot)
    px(ctx, x + 9, y + 12, 2, 2 + f, dark);
    if (dir === 'left') {
      px(ctx, x + 1, y + 6, 4, 5, body); px(ctx, x + 1, y + 5, 2, 2, dark); px(ctx, x + 1, y + 8, 1, 1, '#1a1a1a'); px(ctx, x + 12, y + 8, 3, 1, body);
    } else if (dir === 'right') {
      px(ctx, x + 11, y + 6, 4, 5, body); px(ctx, x + 13, y + 5, 2, 2, dark); px(ctx, x + 14, y + 8, 1, 1, '#1a1a1a'); px(ctx, x + 1, y + 8, 3, 1, body);
    } else {
      px(ctx, x + 5, y + 5, 6, 5, body); px(ctx, x + 5, y + 4, 2, 2, dark); px(ctx, x + 9, y + 4, 2, 2, dark);
      px(ctx, x + 6, y + 7, 1, 1, '#1a1a1a'); px(ctx, x + 9, y + 7, 1, 1, '#1a1a1a'); px(ctx, x + 7, y + 9, 2, 1, '#1a1a1a');
    }
  };

  // a top-down car
  gfx.car = function (ctx, x, y, dir, color) {
    const c = color || '#c33', dk = 'rgba(0,0,0,0.5)', glass = '#bfe0ee';
    px(ctx, x + 1, y + 12, 22, 2, 'rgba(0,0,0,0.25)'); // shadow
    px(ctx, x, y + 2, 24, 9, c);
    px(ctx, x + 2, y + 1, 20, 1, c);
    px(ctx, x, y + 2, 24, 1, 'rgba(255,255,255,0.18)');
    px(ctx, x + 5, y + 3, 14, 3, glass);               // windows
    px(ctx, x + 11, y + 3, 1, 3, '#5a8fb0');
    px(ctx, x + 3, y + 10, 5, 2, '#1a1a1a'); px(ctx, x + 16, y + 10, 5, 2, '#1a1a1a'); // wheels
    px(ctx, x + 3, y + 1, 5, 1, '#1a1a1a'); px(ctx, x + 16, y + 1, 5, 1, '#1a1a1a');
    if (dir === 'right') { px(ctx, x + 22, y + 3, 2, 2, '#ffe'); px(ctx, x + 22, y + 7, 2, 2, '#ffe'); }
    else { px(ctx, x, y + 3, 2, 2, '#f88'); px(ctx, x, y + 7, 2, 2, '#f88'); }
  };

  BC.gfx = gfx;
})();
