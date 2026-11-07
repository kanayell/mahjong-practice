import { Tile } from './Tile';
import type { TileKind } from '../core/tile';

/** 自分の捨て牌(河 かわ)。6枚ずつ並べる */
export function River({ tiles, highlight = [] }: { tiles: TileKind[]; highlight?: TileKind[] }) {
  const hi = new Set(highlight);
  return (
    <div className="river" aria-label="自分の捨て牌">
      {tiles.map((k, i) => (
        <Tile key={i} kind={k} mark={hi.has(k) ? 'wrong' : undefined} />
      ))}
    </div>
  );
}
