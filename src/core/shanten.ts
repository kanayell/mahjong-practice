// 向聴数(シャンテンすう):テンパイまであと何枚有効な牌が必要か
//   -1 = 和了、0 = テンパイ、1 = 1向聴(イーシャンテン)…
import { canStartShuntsu } from './decompose';
import { isYaochu, numberOf, suitOf, TILE_KIND_COUNT, toCounts, type Counts, type TileKind } from './tile';

/**
 * @param concealed 手の内の牌(13枚 or 14枚から鳴き分を引いた枚数)
 * @param meldCount 鳴いた面子の数
 */
export function calcShanten(concealed: TileKind[], meldCount = 0): number {
  const c = toCounts(concealed);
  let best = standardShanten(c, meldCount);
  if (meldCount === 0) {
    best = Math.min(best, chiitoitsuShanten(c), kokushiShanten(c));
  }
  return best;
}

export function standardShanten(counts: Counts, meldCount = 0): number {
  const c = [...counts];
  let best = 8;

  const search = (start: number, mentsu: number, taatsu: number, head: number) => {
    let i = start;
    while (i < TILE_KIND_COUNT && c[i] === 0) i++;
    if (i === TILE_KIND_COUNT) {
      const m = mentsu + meldCount;
      const t = Math.min(taatsu, 4 - m);
      const s = 8 - 2 * m - t - head;
      if (s < best) best = s;
      return;
    }
    // 面子(刻子・順子)
    if (c[i] >= 3) {
      c[i] -= 3;
      search(i, mentsu + 1, taatsu, head);
      c[i] += 3;
    }
    if (canStartShuntsu(i) && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--, c[i + 1]--, c[i + 2]--;
      search(i, mentsu + 1, taatsu, head);
      c[i]++, c[i + 1]++, c[i + 2]++;
    }
    // 雀頭
    if (head === 0 && c[i] >= 2) {
      c[i] -= 2;
      search(i, mentsu, taatsu, 1);
      c[i] += 2;
    }
    // 搭子(ターツ):面子まであと1枚の形
    if (c[i] >= 2) {
      c[i] -= 2;
      search(i, mentsu, taatsu + 1, head);
      c[i] += 2;
    }
    if (sameSuitNumber(i, i + 1) && c[i + 1] > 0) {
      c[i]--, c[i + 1]--;
      search(i, mentsu, taatsu + 1, head);
      c[i]++, c[i + 1]++;
    }
    if (sameSuitNumber(i, i + 2) && c[i + 2] > 0) {
      c[i]--, c[i + 2]--;
      search(i, mentsu, taatsu + 1, head);
      c[i]++, c[i + 2]++;
    }
    // この牌は孤立牌として使わない
    const save = c[i];
    c[i] = 0;
    search(i + 1, mentsu, taatsu, head);
    c[i] = save;
  };

  search(0, 0, 0, 0);
  return best;
}

function sameSuitNumber(a: TileKind, b: TileKind): boolean {
  return b < TILE_KIND_COUNT && suitOf(a) !== 'z' && suitOf(a) === suitOf(b) && numberOf(b) > numberOf(a);
}

export function chiitoitsuShanten(c: Counts): number {
  let pairs = 0;
  let kinds = 0;
  for (let k = 0; k < TILE_KIND_COUNT; k++) {
    if (c[k] > 0) kinds++;
    if (c[k] >= 2) pairs++;
  }
  return 6 - pairs + Math.max(0, 7 - kinds);
}

export function kokushiShanten(c: Counts): number {
  let kinds = 0;
  let hasPair = false;
  for (let k = 0; k < TILE_KIND_COUNT; k++) {
    if (!isYaochu(k) || c[k] === 0) continue;
    kinds++;
    if (c[k] >= 2) hasPair = true;
  }
  return 13 - kinds - (hasPair ? 1 : 0);
}
