// ランダムな和了形(14枚)を作る
import { pick, type Rng } from '../random';
import { emptyCounts, fromCounts, makeKind, type Suit, type TileKind } from '../tile';

export interface BuildOptions {
  /** 使う数牌の種類 */
  suits: Exclude<Suit, 'z'>[];
  /** 字牌を使うか */
  honors: boolean;
  /** 面子を刻子にする確率(0〜1) */
  koutsuRate: number;
  /** 指定すると、この種類の牌を多めに使う */
  mainSuit?: Exclude<Suit, 'z'>;
  mainRate?: number;
}

/** 4面子1雀頭の和了形をランダムに作る(同じ牌は4枚まで) */
export function buildAgariHand(rng: Rng, opts: BuildOptions): TileKind[] {
  for (;;) {
    const c = emptyCounts();
    let ok = true;
    for (let b = 0; b < 4 && ok; b++) {
      ok = false;
      for (let tries = 0; tries < 30; tries++) {
        const useHonor = opts.honors && rng() < 0.15;
        const suit: Suit = useHonor ? 'z' : opts.mainSuit && rng() < (opts.mainRate ?? 0.5) ? opts.mainSuit : pick(rng, opts.suits);
        const koutsu = suit === 'z' || rng() < opts.koutsuRate;
        if (koutsu) {
          const k = makeKind(suit, 1 + Math.floor(rng() * (suit === 'z' ? 7 : 9)));
          if (c[k] + 3 > 4) continue;
          c[k] += 3;
        } else {
          const first = makeKind(suit, 1 + Math.floor(rng() * 7));
          if (c[first] >= 4 || c[first + 1] >= 4 || c[first + 2] >= 4) continue;
          c[first]++, c[first + 1]++, c[first + 2]++;
        }
        ok = true;
        break;
      }
    }
    if (!ok) continue;
    for (let tries = 0; tries < 30; tries++) {
      const useHonor = opts.honors && rng() < 0.2;
      const suit: Suit = useHonor ? 'z' : opts.mainSuit && rng() < (opts.mainRate ?? 0.5) ? opts.mainSuit : pick(rng, opts.suits);
      const k = makeKind(suit, 1 + Math.floor(rng() * (suit === 'z' ? 7 : 9)));
      if (c[k] + 2 > 4) continue;
      c[k] += 2;
      return fromCounts(c);
    }
  }
}
