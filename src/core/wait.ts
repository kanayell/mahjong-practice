// 待ち判定:テンパイしている手が、どの牌で和了れるか(+その理由)
import { getAgariDecompositions } from './agari';
import { ALL_KINDS, numberOf, type TileKind } from './tile';
import type { Decomposition, Meld, WaitInfo, WaitPattern, WaitShape } from './types';

/**
 * 待ち牌をすべて返す。
 * 自分の手(手の内+鳴き)に4枚すべてある牌は、もう引けないので待ちに含めない。
 * @param concealed 手の内の牌(13 − 3×鳴き数 枚)
 */
export function getWaits(concealed: TileKind[], melds: Meld[] = []): WaitInfo[] {
  const used = new Array(34).fill(0);
  for (const k of concealed) used[k]++;
  for (const m of melds) for (const k of m.tiles) used[k]++;

  const out: WaitInfo[] = [];
  for (const t of ALL_KINDS) {
    if (used[t] >= 4) continue;
    const decomps = getAgariDecompositions([...concealed, t], melds);
    if (decomps.length === 0) continue;
    const patterns = decomps.flatMap((d) => winPatterns(d, t, melds.length));
    out.push({ tile: t, patterns });
  }
  return out;
}

export function getWaitTiles(concealed: TileKind[], melds: Meld[] = []): TileKind[] {
  return getWaits(concealed, melds).map((w) => w.tile);
}

export function isTenpai(concealed: TileKind[], melds: Meld[] = []): boolean {
  return getWaits(concealed, melds).length > 0;
}

/**
 * 1つの分解について、和了牌 t がどの部分に入ったと解釈できるかを列挙する。
 * 鳴いた面子には和了牌は入らないので、手の内の面子(先頭 blocks.length − meldCount 個)だけを見る。
 */
export function winPatterns(d: Decomposition, t: TileKind, meldCount: number): WaitPattern[] {
  if (d.form === 'chiitoitsu') {
    const index = d.pairs!.indexOf(t);
    return [{ decomposition: d, shape: 'tanki', winIn: { kind: 'pair', index } }];
  }
  if (d.form === 'kokushi') {
    return [{ decomposition: d, shape: 'tanki', winIn: { kind: 'kokushi' } }];
  }
  const out: WaitPattern[] = [];
  if (d.head === t) out.push({ decomposition: d, shape: 'tanki', winIn: { kind: 'head' } });
  const concealedCount = d.blocks.length - meldCount;
  const seen = new Set<string>();
  for (let i = 0; i < concealedCount; i++) {
    const b = d.blocks[i];
    let shape: WaitShape | null = null;
    if (b.type === 'koutsu' && b.tile === t) shape = 'shanpon';
    if (b.type === 'shuntsu' && t >= b.first && t <= b.first + 2) shape = shuntsuWaitShape(b.first, t);
    if (!shape) continue;
    // 同じ面子が2つある場合(一盃口など)は1つにまとめる
    const key = `${b.type}-${b.type === 'shuntsu' ? b.first : b.tile}-${shape}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ decomposition: d, shape, winIn: { kind: 'block', index: i } });
  }
  return out;
}

/** 順子 first,first+1,first+2 が牌 t で完成した時の待ちの形 */
export function shuntsuWaitShape(first: TileKind, t: TileKind): WaitShape {
  const pos = t - first;
  if (pos === 1) return 'kanchan';
  if (pos === 0) return numberOf(first) === 7 ? 'penchan' : 'ryanmen'; // 89 で 7 待ち
  return numberOf(first) === 1 ? 'penchan' : 'ryanmen'; // 12 で 3 待ち
}

/** 待ち全体に含まれる待ちの形の一覧(重複なし) */
export function waitShapesOf(waits: WaitInfo[]): WaitShape[] {
  const set = new Set<WaitShape>();
  for (const w of waits) for (const p of w.patterns) set.add(p.shape);
  return [...set];
}

export const WAIT_SHAPE_NAME: Record<WaitShape, { name: string; reading: string }> = {
  ryanmen: { name: '両面', reading: 'リャンメン' },
  kanchan: { name: '嵌張', reading: 'カンチャン' },
  penchan: { name: '辺張', reading: 'ペンチャン' },
  tanki: { name: '単騎', reading: 'タンキ' },
  shanpon: { name: 'シャンポン', reading: 'シャンポン' },
};
