// 面子分解:手の内の牌を「雀頭1つ+面子」に分ける方法をすべて列挙する
import { isNumberTile, numberOf, TILE_KIND_COUNT, type Counts, type TileKind } from './tile';
import type { Block } from './types';

/**
 * 牌の集合を面子だけに分ける方法をすべて返す(雀頭なし)。
 * いちばん小さい牌から「刻子として使う」か「順子の先頭として使う」かを選ぶので、
 * 同じ分解が重複して出ることはない。
 */
export function splitIntoBlocks(counts: Counts): Block[][] {
  const c = [...counts];
  const results: Block[][] = [];
  const current: Block[] = [];

  const walk = (start: number) => {
    let i = start;
    while (i < TILE_KIND_COUNT && c[i] === 0) i++;
    if (i === TILE_KIND_COUNT) {
      results.push([...current]);
      return;
    }
    // 刻子として使う
    if (c[i] >= 3) {
      c[i] -= 3;
      current.push({ type: 'koutsu', tile: i, open: false });
      walk(i);
      current.pop();
      c[i] += 3;
    }
    // 順子の先頭として使う
    if (canStartShuntsu(i) && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--;
      c[i + 1]--;
      c[i + 2]--;
      current.push({ type: 'shuntsu', first: i, open: false });
      walk(i);
      current.pop();
      c[i]++;
      c[i + 1]++;
      c[i + 2]++;
    }
  };

  walk(0);
  return results;
}

export function canStartShuntsu(k: TileKind): boolean {
  return isNumberTile(k) && numberOf(k) <= 7;
}

export interface HeadAndBlocks {
  head: TileKind;
  blocks: Block[];
}

/** 手の内を「雀頭+面子」に分ける方法をすべて返す */
export function decomposeWithHead(counts: Counts): HeadAndBlocks[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total % 3 !== 2) return [];
  const out: HeadAndBlocks[] = [];
  const c = [...counts];
  for (let h = 0; h < TILE_KIND_COUNT; h++) {
    if (c[h] < 2) continue;
    c[h] -= 2;
    for (const blocks of splitIntoBlocks(c)) out.push({ head: h, blocks });
    c[h] += 2;
  }
  return out;
}
