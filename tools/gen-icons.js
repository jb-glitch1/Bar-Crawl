// Generates icon-192.png / icon-512.png: a pixel beer mug on a dark tile.
// Run: node tools/gen-icons.js   (writes to repo root; commit the PNGs)
const fs = require('fs'), zlib = require('zlib'), path = require('path');

// 16x16 logical pixel art: . bg, R rounded-corner cut, O outline, B body(amber),
// L body highlight, F foam, H handle, S shadow
const ART = [
  'RR............RR',
  'R..............R',
  '....FFFFFFF.....',
  '...FFFFFFFFF....',
  '...FFFFFFFFF....',
  '...OBBBBBBBO.HH.',
  '...OBLBBBBBO.H.H',
  '...OBLBBBBBO.H.H',
  '...OBLBBBBBO.H.H',
  '...OBBBBBBBO.HH.',
  '...OBBBBBBBO....',
  '...OBBBBBBBO....',
  '...OOOOOOOOO....',
  '....SSSSSSS.....',
  'R..............R',
  'RR............RR'
];
const COLS = {
  '.': [18, 18, 28], 'R': [7, 7, 13], 'O': [58, 38, 20], 'B': [240, 164, 48],
  'L': [255, 214, 120], 'F': [255, 250, 235], 'H': [58, 38, 20], 'S': [10, 10, 18]
};

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, size) {
  const S = size / 16;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = COLS[ART[(y / S) | 0][(x / S) | 0]] || COLS['.'];
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]));
  console.log('wrote ' + file);
}
const root = path.join(__dirname, '..');
writePNG(path.join(root, 'icon-192.png'), 192);
writePNG(path.join(root, 'icon-512.png'), 512);
