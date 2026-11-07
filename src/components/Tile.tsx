// 牌(SVG)。デザインは設定で切り替えられる
//  ・real(初期値):実物に近いデザイン(RealTileFace.tsx)
//  ・simple:見やすさ重視。萬子=赤、筒子=青、索子=緑の漢数字。色が見分けにくい人のため、
//    下の帯の模様も種類ごとに変えている(萬子=べた塗り、筒子=丸、索子=縦じま)。
import { numberOf, suitOf, tileName, type TileKind } from '../core/tile';
import { useTileSettings } from '../settings';
import { RealTileFace } from './RealTileFace';

const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const SUIT_CHAR = { m: '萬', p: '筒', s: '索' } as const;
const HONOR = ['東', '南', '西', '北', '白', '發', '中'];

const COLOR = {
  m: '#c62828',
  p: '#1559b5',
  s: '#1f7a35',
  wind: '#222',
} as const;

const BG = { m: '#fff4f3', p: '#f1f6ff', s: '#f0faf1', z: '#fffbef' } as const;

export interface TileProps {
  kind: TileKind;
  red?: boolean;
  selected?: boolean;
  /** 強調表示(和了牌など) */
  mark?: 'win' | 'correct' | 'wrong' | 'missed';
  dim?: boolean;
  sideways?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tile({ kind, red, selected, mark, dim, sideways, onClick, className }: TileProps) {
  const cls = ['tile', selected && 'is-selected', mark && `mark-${mark}`, dim && 'is-dim', sideways && 'is-sideways', className]
    .filter(Boolean)
    .join(' ');
  const label = `${tileName(kind)}${red ? '(赤)' : ''}`;
  const settings = useTileSettings();
  const face = settings.face === 'real' ? <RealTileFace kind={kind} red={red} /> : <TileFace kind={kind} red={red} />;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={label} aria-pressed={selected}>
        {face}
      </button>
    );
  }
  return (
    <span className={cls} role="img" aria-label={label}>
      {face}
    </span>
  );
}

function TileFace({ kind, red }: { kind: TileKind; red?: boolean }) {
  const suit = suitOf(kind);
  return (
    <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1.5" y="1.5" width="57" height="77" rx="7" fill={BG[suit]} stroke="#9a9184" strokeWidth="2" />
      {suit === 'z' ? <HonorFace kind={kind} /> : <NumberFace suit={suit} n={numberOf(kind)} />}
      {red && <circle cx="49" cy="11" r="5" fill="#e53935" stroke="#fff" strokeWidth="1.5" />}
    </svg>
  );
}

function NumberFace({ suit, n }: { suit: 'm' | 'p' | 's'; n: number }) {
  const color = COLOR[suit];
  return (
    <g fill={color} fontFamily="'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif" fontWeight="700" textAnchor="middle">
      <text x="30" y="37" fontSize="32">
        {KANJI_NUM[n - 1]}
      </text>
      <text x="30" y="62" fontSize="20">
        {SUIT_CHAR[suit]}
      </text>
      <SuitBand suit={suit} color={color} />
    </g>
  );
}

function SuitBand({ suit, color }: { suit: 'm' | 'p' | 's'; color: string }) {
  if (suit === 'm') return <rect x="12" y="68" width="36" height="5" rx="2.5" fill={color} />;
  if (suit === 'p')
    return (
      <g fill="none" stroke={color} strokeWidth="1.8">
        {[18, 30, 42].map((x) => (
          <circle key={x} cx={x} cy="70.5" r="3" />
        ))}
      </g>
    );
  return (
    <g fill={color}>
      {[14, 20, 26, 32, 38, 44].map((x) => (
        <rect key={x} x={x} y="67" width="2.5" height="7" rx="1" />
      ))}
    </g>
  );
}

function HonorFace({ kind }: { kind: TileKind }) {
  const i = kind - 27;
  const ch = HONOR[i];
  const font = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif";
  if (ch === '白') {
    return (
      <g>
        <rect x="13" y="18" width="34" height="44" rx="3" fill="none" stroke="#4a6fb5" strokeWidth="3" />
        <text x="30" y="47" fontSize="16" fill="#4a6fb5" fontFamily={font} fontWeight="700" textAnchor="middle">
          白
        </text>
      </g>
    );
  }
  const color = ch === '發' ? COLOR.s : ch === '中' ? COLOR.m : COLOR.wind;
  return (
    <text x="30" y="54" fontSize="38" fill={color} fontFamily={font} fontWeight="700" textAnchor="middle">
      {ch}
    </text>
  );
}
