import { Tile } from './Tile';
import { Term } from './Term';
import { groupsOf, partialText, SHAPE_TERM } from '../content/waitExplain';
import { tileName, type TileKind } from '../core/tile';
import type { WaitPattern } from '../core/types';

/** 面子・雀頭への分解図。和了牌には印をつける */
export function DecompositionView({ pattern, winTile }: { pattern: WaitPattern; winTile: TileKind }) {
  const groups = groupsOf(pattern, winTile);
  return (
    <div className="decomp">
      <div className="decomp-groups">
        {groups.map((g, i) => (
          <div className={`decomp-group${g.winIndex !== undefined ? ' has-win' : ''}`} key={i}>
            <div className="decomp-tiles">
              {g.tiles.map((k, j) => (
                <Tile key={j} kind={k} mark={j === g.winIndex ? 'win' : undefined} />
              ))}
            </div>
            <div className="decomp-label">{g.label}</div>
          </div>
        ))}
      </div>
      {pattern.decomposition.form !== 'kokushi' && (
        <p className="decomp-text">
          {pattern.shape === 'shanpon' ? (
            <>
              {tileName(winTile)}の<Term k="toitsu" />(2枚)が<Term k="koutsu" />(3枚)になる{' '}
            </>
          ) : (
            <>{partialText(pattern, winTile)} の </>
          )}
          <Term k={SHAPE_TERM[pattern.shape]} />
          待ち
        </p>
      )}
    </div>
  );
}
