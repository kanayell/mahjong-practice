// 和了判定:手牌が和了の形(4面子1雀頭・七対子・国士無双)になっているか
import { decomposeWithHead } from './decompose';
import { isYaochu, TILE_KIND_COUNT, toCounts, type Counts, type TileKind } from './tile';
import type { Block, Decomposition, Meld } from './types';

export function meldToBlock(m: Meld): Block {
  const sorted = [...m.tiles].sort((a, b) => a - b);
  switch (m.type) {
    case 'chi':
      return { type: 'shuntsu', first: sorted[0], open: true };
    case 'pon':
      return { type: 'koutsu', tile: sorted[0], open: true };
    case 'minkan':
      return { type: 'kantsu', tile: sorted[0], open: true };
    case 'ankan':
      return { type: 'kantsu', tile: sorted[0], open: false };
  }
}

/** 門前(メンゼン)=チー・ポン・明槓をしていない(暗槓はOK) */
export function isMenzen(melds: Meld[]): boolean {
  return melds.every((m) => m.type === 'ankan');
}

/**
 * 和了形への分解をすべて返す。
 * @param concealed 手の内の牌(和了牌を含む)。枚数は 14 − 3×鳴き数
 * @param melds 鳴いた面子
 */
export function getAgariDecompositions(concealed: TileKind[], melds: Meld[] = []): Decomposition[] {
  if (concealed.length + melds.length * 3 !== 14) return [];
  const counts = toCounts(concealed);
  const meldBlocks = melds.map(meldToBlock);
  const out: Decomposition[] = [];

  for (const { head, blocks } of decomposeWithHead(counts)) {
    out.push({ form: 'standard', head, blocks: [...blocks, ...meldBlocks] });
  }

  if (melds.length === 0) {
    const chiitoi = chiitoitsuPairs(counts);
    if (chiitoi) out.push({ form: 'chiitoitsu', blocks: [], pairs: chiitoi });
    const kokushiHead = kokushiPair(counts);
    if (kokushiHead !== null) out.push({ form: 'kokushi', head: kokushiHead, blocks: [] });
  }
  return out;
}

export function isAgari(concealed: TileKind[], melds: Meld[] = []): boolean {
  return getAgariDecompositions(concealed, melds).length > 0;
}

/** 七対子:異なる7種類の対子(同じ牌4枚は2組と数えない) */
function chiitoitsuPairs(c: Counts): TileKind[] | null {
  const pairs: TileKind[] = [];
  for (let k = 0; k < TILE_KIND_COUNT; k++) {
    if (c[k] === 0) continue;
    if (c[k] !== 2) return null;
    pairs.push(k);
  }
  return pairs.length === 7 ? pairs : null;
}

/** 国士無双:么九牌13種類すべて+どれか1つが対子 */
function kokushiPair(c: Counts): TileKind | null {
  let pair: TileKind | null = null;
  for (let k = 0; k < TILE_KIND_COUNT; k++) {
    if (isYaochu(k)) {
      if (c[k] === 0) return null;
      if (c[k] === 2) {
        if (pair !== null) return null;
        pair = k;
      } else if (c[k] !== 1) return null;
    } else if (c[k] > 0) return null;
  }
  return pair;
}
