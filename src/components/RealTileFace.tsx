// 実物に近いデザインの牌(SVG)
// ・萬子:黒い漢数字+赤い「萬」
// ・筒子:丸を実物と同じ並べ方で描く
// ・索子:竹の棒を実物と同じ並べ方で描く(一索は鳥)
// ・字牌:東南西北は黒、白は青い枠、發は緑、中は赤
// ・赤ドラ:実物と同じく、5の牌全体を赤くする
import { numberOf, suitOf, type TileKind } from '../core/tile';

const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HONOR = ['東', '南', '西', '北', '白', '發', '中'];
const FONT = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif";

const INK = '#1d1d1d';
const RED = '#c8202f';
const GREEN = '#127a3e';
const BLUE = '#1b4fa3';

type C = 'r' | 'g' | 'b';
const COL: Record<C, string> = { r: RED, g: GREEN, b: BLUE };

export function RealTileFace({ kind, red }: { kind: TileKind; red?: boolean }) {
  const suit = suitOf(kind);
  const n = numberOf(kind);
  return (
    <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="mj-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#f1ead8" />
        </linearGradient>
      </defs>
      {/* 牌の背(緑)が下に少し見える */}
      <rect x="1.5" y="4" width="57" height="74.5" rx="7" fill="#2f8a5f" stroke="#1f5e40" strokeWidth="1.5" />
      <rect x="1.5" y="1.5" width="57" height="71" rx="7" fill="url(#mj-face)" stroke="#a89f8c" strokeWidth="1.5" />
      <g transform="translate(0 -2)">
        {suit === 'm' && <Manzu n={n} red={red} />}
        {suit === 'p' && <Pinzu n={n} red={red} />}
        {suit === 's' && <Souzu n={n} red={red} />}
        {suit === 'z' && <Honor i={kind - 27} />}
      </g>
    </svg>
  );
}

function Manzu({ n, red }: { n: number; red?: boolean }) {
  return (
    <g fontFamily={FONT} fontWeight="700" textAnchor="middle">
      <text x="30" y="35" fontSize="30" fill={red ? RED : INK}>
        {KANJI_NUM[n - 1]}
      </text>
      <text x="30" y="64" fontSize="23" fill={RED}>
        萬
      </text>
    </g>
  );
}

/** 筒子の丸 */
function Circle({ x, y, r, c }: { x: number; y: number; r: number; c: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x} cy={y} r={r * 0.68} fill="#fffdf6" />
      <circle cx={x} cy={y} r={r * 0.5} fill="none" stroke={c} strokeWidth={r * 0.12} />
      <circle cx={x} cy={y} r={r * 0.24} fill={c} />
    </g>
  );
}

/** 筒子の並べ方:[x, y, 色] */
const PIN: Record<number, { r: number; dots: [number, number, C][] }> = {
  2: { r: 10, dots: [[30, 23, 'g'], [30, 53, 'b']] },
  3: { r: 8, dots: [[18, 22, 'b'], [30, 39, 'r'], [42, 56, 'g']] },
  4: { r: 9.5, dots: [[19, 25, 'b'], [41, 25, 'g'], [19, 51, 'g'], [41, 51, 'b']] },
  5: { r: 7.8, dots: [[18, 22, 'b'], [42, 22, 'g'], [30, 39, 'r'], [18, 56, 'g'], [42, 56, 'b']] },
  6: { r: 8, dots: [[19, 19, 'g'], [41, 19, 'g'], [19, 39, 'r'], [41, 39, 'r'], [19, 59, 'r'], [41, 59, 'r']] },
  7: {
    r: 6.4,
    dots: [[16, 18, 'g'], [30, 25, 'g'], [44, 32, 'g'], [21, 47, 'r'], [39, 47, 'r'], [21, 61, 'r'], [39, 61, 'r']],
  },
  8: {
    r: 7,
    dots: [[19, 14, 'b'], [41, 14, 'b'], [19, 30, 'b'], [41, 30, 'b'], [19, 46, 'b'], [41, 46, 'b'], [19, 62, 'b'], [41, 62, 'b']],
  },
  9: {
    r: 6.6,
    dots: [[16, 20, 'b'], [30, 20, 'b'], [44, 20, 'b'], [16, 39, 'r'], [30, 39, 'r'], [44, 39, 'r'], [16, 58, 'g'], [30, 58, 'g'], [44, 58, 'g']],
  },
};

function Pinzu({ n, red }: { n: number; red?: boolean }) {
  if (n === 1) {
    // 一筒:大きな飾りの丸
    return (
      <g>
        <circle cx="30" cy="38" r="20" fill={GREEN} />
        <circle cx="30" cy="38" r="17" fill="#fffdf6" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={30 + Math.cos(a) * 14} cy={38 + Math.sin(a) * 14} r="2.2" fill={BLUE} />;
        })}
        <circle cx="30" cy="38" r="9.5" fill={RED} />
        <circle cx="30" cy="38" r="6" fill="#fffdf6" />
        <circle cx="30" cy="38" r="3.2" fill={RED} />
      </g>
    );
  }
  const p = PIN[n];
  return (
    <g>
      {p.dots.map(([x, y, c], i) => (
        <Circle key={i} x={x} y={y} r={p.r} c={red ? RED : COL[c]} />
      ))}
    </g>
  );
}

/** 索子の竹の棒 */
function Stick({ x, y, h, c, rot = 0 }: { x: number; y: number; h: number; c: string; rot?: number }) {
  const w = 5.6;
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={w / 2} fill={c} />
      <rect x={x - 0.7} y={y - h / 2 + 2} width="1.4" height={h - 4} rx="0.7" fill="#fffdf6" opacity="0.55" />
      {[-0.5, 0, 0.5].map((t) => (
        <rect key={t} x={x - w / 2 - 0.6} y={y + t * (h - 3) - 0.8} width={w + 1.2} height="1.6" rx="0.8" fill={c} stroke="#fffdf6" strokeWidth="0.5" />
      ))}
    </g>
  );
}

type S = [number, number, C, number?];
const SOU: Record<number, { h: number; sticks: S[] }> = {
  2: { h: 24, sticks: [[30, 23, 'g'], [30, 53, 'g']] },
  3: { h: 24, sticks: [[30, 23, 'g'], [20, 53, 'g'], [40, 53, 'g']] },
  4: { h: 24, sticks: [[20, 23, 'g'], [40, 23, 'g'], [20, 53, 'g'], [40, 53, 'g']] },
  5: { h: 22, sticks: [[16, 22, 'g'], [44, 22, 'g'], [30, 38, 'r'], [16, 54, 'g'], [44, 54, 'g']] },
  6: { h: 24, sticks: [[16, 23, 'g'], [30, 23, 'g'], [44, 23, 'g'], [16, 53, 'g'], [30, 53, 'g'], [44, 53, 'g']] },
  7: {
    h: 17,
    sticks: [[30, 15, 'r'], [16, 38, 'g'], [30, 38, 'g'], [44, 38, 'g'], [16, 60, 'g'], [30, 60, 'g'], [44, 60, 'g']],
  },
  8: {
    h: 23,
    sticks: [
      [13, 23, 'g', 18],
      [24, 23, 'g', -18],
      [36, 23, 'g', 18],
      [47, 23, 'g', -18],
      [13, 53, 'g', -18],
      [24, 53, 'g', 18],
      [36, 53, 'g', -18],
      [47, 53, 'g', 18],
    ],
  },
  9: {
    h: 17,
    sticks: [
      [16, 15, 'g'], [30, 15, 'r'], [44, 15, 'g'],
      [16, 38, 'g'], [30, 38, 'r'], [44, 38, 'g'],
      [16, 61, 'g'], [30, 61, 'r'], [44, 61, 'g'],
    ],
  },
};

function Souzu({ n, red }: { n: number; red?: boolean }) {
  if (n === 1) return <Bird />;
  const s = SOU[n];
  return (
    <g>
      {s.sticks.map(([x, y, c, rot], i) => (
        <Stick key={i} x={x} y={y} h={s.h} c={red ? RED : COL[c]} rot={rot} />
      ))}
    </g>
  );
}

/** 一索の鳥 */
function Bird() {
  return (
    <g>
      {/* 尾羽 */}
      <path d="M22 50 Q8 56 10 70 Q16 60 24 56 Z" fill={GREEN} />
      <path d="M24 54 Q16 66 22 74 Q24 64 29 57 Z" fill={BLUE} />
      {/* 体 */}
      <ellipse cx="31" cy="46" rx="12" ry="10" fill={GREEN} />
      <path d="M24 44 Q31 36 40 44 Q32 50 24 44 Z" fill={BLUE} />
      {/* 首と頭 */}
      <path d="M36 40 Q40 30 37 22 L44 22 Q46 32 41 42 Z" fill={GREEN} />
      <circle cx="40" cy="20" r="6" fill={GREEN} />
      <circle cx="41.5" cy="19" r="1.6" fill="#fffdf6" />
      <circle cx="41.8" cy="19" r="0.8" fill={INK} />
      {/* くちばしととさか */}
      <path d="M45.5 19 L52 21.5 L45.5 23 Z" fill={RED} />
      <path d="M35 15 Q37 8 40 13 Q42 7 44 14 Z" fill={RED} />
      {/* 足 */}
      <path d="M29 55 L27 63 M33 55 L35 63" stroke={RED} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Honor({ i }: { i: number }) {
  const ch = HONOR[i];
  if (ch === '白') {
    return <rect x="14" y="18" width="32" height="44" rx="3" fill="none" stroke="#4a73c4" strokeWidth="3" />;
  }
  const color = ch === '發' ? GREEN : ch === '中' ? RED : INK;
  return (
    <text x="30" y="53" fontSize="38" fill={color} fontFamily={FONT} fontWeight="700" textAnchor="middle">
      {ch}
    </text>
  );
}
