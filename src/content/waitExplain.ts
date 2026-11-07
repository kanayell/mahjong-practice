// 待ちの解説データ(分解図に使うグループと説明文)
import { tileNames, type TileKind } from '../core/tile';
import type { WaitPattern, WaitShape } from '../core/types';
import type { GlossaryKey } from './glossary';

export interface TileGroup {
  label: '順子' | '刻子' | '雀頭' | '対子' | '国士無双' | '鳴き';
  tiles: TileKind[];
  /** 和了牌が入ったグループなら、そのグループ内の和了牌の位置 */
  winIndex?: number;
}

/** 分解を、図に描くためのグループの並びにする(和了牌の位置つき) */
export function groupsOf(p: WaitPattern, winTile: TileKind): TileGroup[] {
  const d = p.decomposition;
  const w = p.winIn;
  const withWin = (g: TileGroup, isWin: boolean): TileGroup => (isWin ? { ...g, winIndex: g.tiles.lastIndexOf(winTile) } : g);

  if (d.form === 'chiitoitsu') {
    return d.pairs!.map((k, i) => withWin({ label: '対子', tiles: [k, k] }, w.kind === 'pair' && w.index === i));
  }
  if (d.form === 'kokushi') {
    return [{ label: '国士無双', tiles: [] }];
  }
  const groups: { g: TileGroup; key: number }[] = d.blocks.map((b, i) => {
    const tiles = b.type === 'shuntsu' ? [b.first, b.first + 1, b.first + 2] : b.type === 'koutsu' ? [b.tile, b.tile, b.tile] : [b.tile, b.tile, b.tile, b.tile];
    const label: TileGroup['label'] = b.open ? '鳴き' : b.type === 'shuntsu' ? '順子' : '刻子';
    return { g: withWin({ label, tiles }, w.kind === 'block' && w.index === i), key: tiles[0] };
  });
  groups.push({ g: withWin({ label: '雀頭', tiles: [d.head!, d.head!] }, w.kind === 'head'), key: d.head! });
  return groups.sort((a, b) => a.key - b.key).map((x) => x.g);
}

export const SHAPE_TERM: Record<WaitShape, GlossaryKey> = {
  ryanmen: 'ryanmen',
  kanchan: 'kanchan',
  penchan: 'penchan',
  tanki: 'tanki',
  shanpon: 'shanpon',
};

/** 「4萬・5萬 の両面待ち」のような、和了牌が入る前の形の説明 */
export function partialText(p: WaitPattern, winTile: TileKind): string {
  const g = groupsOf(p, winTile).find((x) => x.winIndex !== undefined);
  if (!g) return '';
  const rest = [...g.tiles];
  rest.splice(g.winIndex!, 1);
  return tileNames(rest);
}

/** 同じ分け方の重複を除く */
export function uniquePatterns(patterns: WaitPattern[], winTile: TileKind): WaitPattern[] {
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = groupsOf(p, winTile)
      .map((g) => `${g.label}:${g.tiles.join(',')}:${g.winIndex ?? ''}`)
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
