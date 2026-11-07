import { Term } from './Term';
import { Tile } from './Tile';
import { doraFromIndicator } from '../core/generators/yakuQuiz';
import { tileName, WIND_NAME, type TileKind } from '../core/tile';
import type { WinContext } from '../core/types';

/** 場の状況(場風・自風・ツモ/ロン・リーチ・ドラ) */
export function Situation({ ctx, doraIndicator, hasRed }: { ctx: WinContext; doraIndicator?: TileKind; hasRed?: boolean }) {
  return (
    <div className="situation">
      <span className="chip">
        <Term k="bakaze" />:{WIND_NAME[ctx.roundWind]}({WIND_NAME[ctx.roundWind]}場)
      </span>
      <span className="chip">
        <Term k="jikaze" />:{WIND_NAME[ctx.seatWind]}({WIND_NAME[ctx.seatWind]}家)
      </span>
      <span className={`chip ${ctx.isTsumo ? 'chip-tsumo' : 'chip-ron'}`}>{ctx.isTsumo ? 'ツモ和了' : 'ロン和了'}</span>
      {ctx.isRiichi && <span className="chip chip-riichi">リーチ中</span>}
      {ctx.melds.length > 0 ? <span className="chip">鳴きあり</span> : <span className="chip">鳴きなし(門前)</span>}
      {doraIndicator !== undefined && (
        <span className="chip chip-dora">
          ドラ表示牌
          <Tile kind={doraIndicator} />→ ドラは{tileName(doraFromIndicator(doraIndicator))}
          {hasRed && '/赤ドラあり'}
          <small>(役ではありません)</small>
        </span>
      )}
    </div>
  );
}
