// 牌の文字列記法
//   "123m456p789s1122z" のように、数字の後ろに種類(m=萬 p=筒 s=索 z=字牌)を書く。
//   字牌は 1=東 2=南 3=西 4=北 5=白 6=發 7=中。
//   0 は赤5(赤ドラ)を表す(例:"406m" は 4萬・赤5萬・6萬)。
import { makeKind, numberOf, suitOf, type Suit, type Tile, type TileKind } from './tile';

export function parseTiles(text: string): Tile[] {
  const out: Tile[] = [];
  let digits: string[] = [];
  let uid = 0;
  for (const ch of text.replace(/\s+/g, '')) {
    if (/[0-9]/.test(ch)) {
      digits.push(ch);
      continue;
    }
    if (!'mpsz'.includes(ch)) throw new Error(`不正な文字です: ${ch}`);
    const suit = ch as Suit;
    for (const d of digits) {
      const n = Number(d);
      const red = n === 0;
      if (suit === 'z' && (n < 1 || n > 7)) throw new Error(`字牌は1〜7です: ${d}z`);
      out.push({ kind: makeKind(suit, red ? 5 : n), red: red || undefined, uid: uid++ });
    }
    digits = [];
  }
  if (digits.length > 0) throw new Error(`種類(m/p/s/z)が抜けています: ${text}`);
  return out;
}

export function parseKinds(text: string): TileKind[] {
  return parseTiles(text).map((t) => t.kind);
}

export function parseKind(text: string): TileKind {
  const ks = parseKinds(text);
  if (ks.length !== 1) throw new Error(`1枚だけ指定してください: ${text}`);
  return ks[0];
}

export function toNotation(kinds: TileKind[]): string {
  const sorted = [...kinds].sort((a, b) => a - b);
  let out = '';
  for (const suit of ['m', 'p', 's', 'z'] as Suit[]) {
    const ns = sorted.filter((k) => suitOf(k) === suit).map((k) => (suit === 'z' ? k - 26 : numberOf(k)));
    if (ns.length) out += ns.join('') + suit;
  }
  return out;
}
