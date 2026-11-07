// アプリのアイコン(PNG)を作るスクリプト。外部ライブラリは使わない。
// 使い方: node scripts/make-icons.mjs
// 緑の背景に、「中」の牌を描く。
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [15, 110, 92];
const TILE = [255, 251, 239];
const EDGE = [154, 145, 132];
const RED = [198, 40, 40];

/** 座標(0〜1)の色を返す。null は背景 */
function colorAt(x, y) {
  // 牌(角丸の長方形)
  const tx0 = 0.22, tx1 = 0.78, ty0 = 0.14, ty1 = 0.86, r = 0.08;
  const inRounded = (m) => {
    const x0 = tx0 + m, x1 = tx1 - m, y0 = ty0 + m, y1 = ty1 - m, rr = Math.max(0, r - m);
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + rr), x1 - rr);
    const cy = Math.min(Math.max(y, y0 + rr), y1 - rr);
    return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr;
  };
  if (!inRounded(0)) return BG;
  if (!inRounded(0.012)) return EDGE;
  // 「中」:四角の枠+縦線
  const bx0 = 0.33, bx1 = 0.67, by0 = 0.38, by1 = 0.6, s = 0.045;
  const inBox = x >= bx0 && x <= bx1 && y >= by0 && y <= by1;
  const inHole = x > bx0 + s && x < bx1 - s && y > by0 + s && y < by1 - s;
  if (inBox && !inHole) return RED;
  if (Math.abs(x - 0.5) <= 0.028 && y >= 0.26 && y <= 0.74) return RED;
  return TILE;
}

function render(size) {
  const ss = 4; // なめらかにするため、1ピクセルを4×4で平均する
  const rows = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // フィルターなし
    for (let px = 0; px < size; px++) {
      let rr = 0, gg = 0, bb = 0;
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const c = colorAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          rr += c[0];
          gg += c[1];
          bb += c[2];
        }
      const n = ss * ss;
      row.set([Math.round(rr / n), Math.round(gg / n), Math.round(bb / n), 255], 1 + px * 4);
    }
    rows.push(row);
  }
  return png(size, size, Buffer.concat(rows));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8bit
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(`public/${name}`, render(size));
  console.log(`public/${name} (${size}x${size})`);
}
