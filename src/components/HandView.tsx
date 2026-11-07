import { Tile } from './Tile';
import type { TileKind } from '../core/tile';
import type { Meld } from '../core/types';

export interface HandViewProps {
  tiles: TileKind[];
  winTile?: TileKind;
  /** 和了牌の上に出す説明(「ロン」「ツモ」など) */
  winLabel?: string;
  melds?: Meld[];
  /** 赤ドラとして表示する種類(その種類の最初の1枚を赤くする) */
  redKinds?: TileKind[];
}

/** 手牌の表示。スマホ縦画面では7枚ずつ2段に折り返す */
export function HandView({ tiles, winTile, winLabel, melds = [], redKinds = [] }: HandViewProps) {
  const redLeft = new Set(redKinds);
  return (
    <div className="hand">
      <div className="hand-tiles">
        {tiles.map((k, i) => {
          const red = redLeft.has(k);
          if (red) redLeft.delete(k);
          return <Tile key={i} kind={k} red={red} />;
        })}
      </div>
      {winTile !== undefined && (
        <div className="hand-win">
          {winLabel && <span className="hand-caption">{winLabel}</span>}
          <Tile kind={winTile} mark="win" />
        </div>
      )}
      {melds.map((m, i) => (
        <MeldView key={i} meld={m} />
      ))}
    </div>
  );
}

const MELD_NAME = { chi: 'チー', pon: 'ポン', minkan: '明槓', ankan: '暗槓' } as const;

/** 鳴いた面子。もらった牌は横向きにする */
export function MeldView({ meld }: { meld: Meld }) {
  const called = meld.calledTile ?? meld.tiles[0];
  let calledShown = false;
  const ordered = [...meld.tiles].sort((a, b) => a - b);
  return (
    <div className="meld">
      <span className="hand-caption">{MELD_NAME[meld.type]}</span>
      <div className="meld-tiles">
        {ordered.map((k, i) => {
          const side = meld.type !== 'ankan' && !calledShown && k === called;
          if (side) calledShown = true;
          return side ? (
            <span className="tile-side" key={i}>
              <Tile kind={k} />
            </span>
          ) : (
            <Tile key={i} kind={k} />
          );
        })}
      </div>
    </div>
  );
}
