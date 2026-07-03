// A 5x7 bitmap pixel font, drawn with fillRect like everything else — no more
// anti-aliased system text floating over a pixel world. Each glyph is 7 rows
// of 5 bits, hex-encoded ('0E11111F111111' = 7 row-bytes). Bit 4 = leftmost.
(function () {
  const BC = window.BC || (window.BC = {});

  const D = {
    'A': '0E11111F111111', 'B': '1E11111E11111E', 'C': '0E11101010110E', 'D': '1C12111111121C',
    'E': '1F10101E10101F', 'F': '1F10101E101010', 'G': '0E11101711110F', 'H': '1111111F111111',
    'I': '0E04040404040E', 'J': '0702020202120C', 'K': '11121418141211', 'L': '1010101010101F',
    'M': '111B1515111111', 'N': '11111915131111', 'O': '0E11111111110E', 'P': '1E11111E101010',
    'Q': '0E11111115120D', 'R': '1E11111E141211', 'S': '0F10100E01011E', 'T': '1F040404040404',
    'U': '1111111111110E', 'V': '11111111110A04', 'W': '1111111515150A', 'X': '11110A040A1111',
    'Y': '1111110A040404', 'Z': '1F01020408101F',
    'a': '00000E010F110F', 'b': '1010161911111E', 'c': '00000E1010110E', 'd': '01010D1311110F',
    'e': '00000E111F100E', 'f': '0609081C080808', 'g': '000F11110F010E', 'h': '10101619111111',
    'i': '04000C0404040E', 'j': '0200060202120C', 'k': '10101214181412', 'l': '0C04040404040E',
    'm': '00001A15151111', 'n': '00001619111111', 'o': '00000E1111110E', 'p': '00001E111E1010',
    'q': '00000D130F0101', 'r': '00001619101010', 's': '00000E100E011E', 't': '08081C08080906',
    'u': '0000111111130D', 'v': '00001111110A04', 'w': '0000111115150A', 'x': '0000110A040A11',
    'y': '000011110F010E', 'z': '00001F0204081F',
    '0': '0E13151519110E', '1': '040C040404040E', '2': '0E11010204081F', '3': '1F02040201110E',
    '4': '02060A121F0202', '5': '1F101E0101110E', '6': '0608101E11110E', '7': '1F010204080808',
    '8': '0E11110E11110E', '9': '0E11110F01020C',
    ' ': '00000000000000',
    '.': '00000000000C0C', ',': '000000000C0408', '!': '04040404040004', '?': '0E110102040004',
    "'": '04040800000000', '"': '0A0A0A00000000', '(': '02040808080402', ')': '08040202020408',
    '-': '0000001F000000', '+': '0004041F040400', '*': '0004150E150400', '/': '01010204081010',
    '\\': '10100804020101', ':': '000C0C000C0C00', ';': '000C0C000C0408', '=': '00001F001F0000',
    '%': '191A0204080B13', '$': '040F140E051E04', '#': '0A0A1F0A1F0A0A', '&': '0814140815120D',
    '<': '02040810080402', '>': '08040201020408', '[': '0E08080808080E', ']': '0E02020202020E',
    '_': '0000000000001F', '@': '0E11010D15150E',
    '▲': '0004040E0E1F1F', '▼': '1F1F0E0E040400', '◀': '02060E1E0E0602', '▶': '080C0E0F0E0C08',
    '■': '001F1F1F1F1F00', '·': '0000000C0C0000'
  };

  const G = {};
  for (const k in D) {
    const rows = [];
    for (let i = 0; i < 7; i++) rows.push(parseInt(D[k].substr(i * 2, 2), 16) || 0);
    G[k] = rows;
  }

  // typographic + accented characters fold down to the base set
  const MAP = {
    '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-',
    'é': 'e', 'è': 'e', 'ñ': 'n', 'ó': 'o', 'á': 'a', 'ü': 'u', '×': 'x'
  };

  BC.font = {
    normalize(s) {
      s = String(s).replace(/…/g, '...');
      let out = '';
      for (const ch of s) out += (MAP[ch] || ch);
      return out;
    },
    scaleFor(size) { return size <= 9 ? 1 : size <= 15 ? 2 : size <= 23 ? 3 : 4; },
    width(str, size) { return this.normalize(str).length * 6 * this.scaleFor(size); },
    // draws a normalized string; caller handles align/shadow
    draw(ctx, str, x, y, size, color) {
      const sc = this.scaleFor(size);
      let cx = x;
      ctx.fillStyle = color;
      for (const ch of str) {
        const g = G[ch];
        if (g) {
          for (let r = 0; r < 7; r++) {
            const row = g[r];
            if (!row) continue;
            let run = -1; // contiguous-run rects: fewer fillRect calls
            for (let c = 0; c <= 5; c++) {
              const on = c < 5 && (row & (16 >> c));
              if (on && run < 0) run = c;
              else if (!on && run >= 0) { ctx.fillRect(cx + run * sc, y + r * sc, (c - run) * sc, sc); run = -1; }
            }
          }
        } else if (ch !== ' ') {
          ctx.fillRect(cx + sc, y + 2 * sc, 3 * sc, 4 * sc); // unknown glyph -> tofu
        }
        cx += 6 * sc;
      }
    }
  };
})();
