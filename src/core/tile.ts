// 牌の基本定義
// 牌の種類(TileKind)は 0〜33 の数値で表す。
//   0-8   : 1〜9萬(マンズ)
//   9-17  : 1〜9筒(ピンズ)
//   18-26 : 1〜9索(ソーズ)
//   27-30 : 東・南・西・北(風牌 カゼハイ)
//   31-33 : 白・發・中(三元牌 サンゲンパイ)

export type TileKind = number;
export type Suit = 'm' | 'p' | 's' | 'z';
export type Wind = 'east' | 'south' | 'west' | 'north';

/** 1枚の牌(実体)。同じ種類の牌を区別するため uid を持つ */
export interface Tile {
  kind: TileKind;
  red?: boolean; // 赤ドラ(表示のみ。役には関係しない)
  uid: number;
}

/** 牌の種類ごとの枚数。長さ34 */
export type Counts = number[];

export const TILE_KIND_COUNT = 34;
export const ALL_KINDS: TileKind[] = Array.from({ length: TILE_KIND_COUNT }, (_, i) => i);

export const EAST = 27;
export const SOUTH = 28;
export const WEST = 29;
export const NORTH = 30;
export const HAKU = 31;
export const HATSU = 32;
export const CHUN = 33;

export const WIND_KIND: Record<Wind, TileKind> = {
  east: EAST,
  south: SOUTH,
  west: WEST,
  north: NORTH,
};

export const WIND_NAME: Record<Wind, string> = {
  east: '東',
  south: '南',
  west: '西',
  north: '北',
};

export function suitOf(k: TileKind): Suit {
  if (k < 9) return 'm';
  if (k < 18) return 'p';
  if (k < 27) return 's';
  return 'z';
}

/** 数牌なら 1〜9、字牌なら 0 */
export function numberOf(k: TileKind): number {
  return k < 27 ? (k % 9) + 1 : 0;
}

export function isHonor(k: TileKind): boolean {
  return k >= 27;
}

export function isNumberTile(k: TileKind): boolean {
  return k < 27;
}

/** 老頭牌(ロウトウハイ):数牌の1と9 */
export function isTerminal(k: TileKind): boolean {
  const n = numberOf(k);
  return n === 1 || n === 9;
}

/** 么九牌(ヤオチュウハイ):1・9・字牌 */
export function isYaochu(k: TileKind): boolean {
  return isHonor(k) || isTerminal(k);
}

/** 中張牌(チュンチャンパイ):2〜8の数牌 */
export function isSimple(k: TileKind): boolean {
  return !isYaochu(k);
}

export function isDragon(k: TileKind): boolean {
  return k >= HAKU;
}

export function isWind(k: TileKind): boolean {
  return k >= EAST && k <= NORTH;
}

export function makeKind(suit: Suit, n: number): TileKind {
  switch (suit) {
    case 'm':
      return n - 1;
    case 'p':
      return 9 + n - 1;
    case 's':
      return 18 + n - 1;
    case 'z':
      return 27 + n - 1;
  }
}

const SUIT_NAME: Record<Exclude<Suit, 'z'>, string> = { m: '萬', p: '筒', s: '索' };
const HONOR_NAME = ['東', '南', '西', '北', '白', '發', '中'];

/** 解説文で使う牌の名前(例:「5萬」「3筒」「東」「中」) */
export function tileName(k: TileKind): string {
  const s = suitOf(k);
  if (s === 'z') return HONOR_NAME[k - 27];
  return `${numberOf(k)}${SUIT_NAME[s]}`;
}

/** 複数の牌名を「・」でつなぐ(種類順) */
export function tileNames(kinds: TileKind[]): string {
  return [...kinds].sort((a, b) => a - b).map(tileName).join('・');
}

export function emptyCounts(): Counts {
  return new Array(TILE_KIND_COUNT).fill(0);
}

export function toCounts(kinds: TileKind[]): Counts {
  const c = emptyCounts();
  for (const k of kinds) c[k]++;
  return c;
}

export function fromCounts(c: Counts): TileKind[] {
  const out: TileKind[] = [];
  for (let k = 0; k < TILE_KIND_COUNT; k++) for (let i = 0; i < c[k]; i++) out.push(k);
  return out;
}

export function sortKinds(kinds: TileKind[]): TileKind[] {
  return [...kinds].sort((a, b) => a - b);
}
