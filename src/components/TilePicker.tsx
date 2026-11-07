import { Tile, type TileProps } from './Tile';
import type { TileKind } from '../core/tile';

const ROWS: { label: string; kinds: TileKind[] }[] = [
  { label: '萬子', kinds: range(0, 9) },
  { label: '筒子', kinds: range(9, 18) },
  { label: '索子', kinds: range(18, 27) },
  { label: '字牌', kinds: range(27, 34) },
];

function range(a: number, b: number) {
  return Array.from({ length: b - a }, (_, i) => a + i);
}

export interface TilePickerProps {
  selected: Set<TileKind>;
  onToggle?: (k: TileKind) => void;
  /** 牌ごとの表示(回答後の正誤表示など) */
  markOf?: (k: TileKind) => TileProps['mark'];
  dimOf?: (k: TileKind) => boolean;
  /** 表示する種類を絞る(手牌に関係ある種類だけ、など) */
  suits?: ('m' | 'p' | 's' | 'z')[];
}

/** 34種類の牌から選ぶパネル(1段9枚) */
export function TilePicker({ selected, onToggle, markOf, dimOf, suits }: TilePickerProps) {
  const rows = ROWS.filter((_, i) => !suits || suits.includes((['m', 'p', 's', 'z'] as const)[i]));
  return (
    <div className="picker">
      {rows.map((row) => (
        <div className="picker-row" key={row.label}>
          {row.kinds.map((k) => (
            <Tile
              key={k}
              kind={k}
              selected={selected.has(k)}
              mark={markOf?.(k)}
              dim={dimOf?.(k)}
              onClick={onToggle ? () => onToggle(k) : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
