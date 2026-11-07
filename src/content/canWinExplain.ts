// 「和了れる?」クイズの解説文
import type { CanWinQuestion } from '../core/generators/canWinQuiz';
import { tileName, tileNames } from '../core/tile';
import { YAKU } from '../core/yaku/definitions';
import { judgeYaku } from '../core/yaku/judge';

/** 「和了れる」問題の理由 */
export function explainOk(q: CanWinQuestion): string[] {
  const { ctx, result: r } = q;
  const yakuNames = r.judgement.yaku.map((y) => YAKU[y.id].name).join('・');
  const lines = [`役(${yakuNames})があるので和了れます。`];
  const furitenTiles = ctx.discards.filter((d) => r.waitTiles.includes(d));
  if (ctx.isTsumo && furitenTiles.length > 0) {
    lines.push(`捨て牌に待ちの ${tileNames([...new Set(furitenTiles)])} があるのでフリテンですが、フリテンで禁止されるのはロンだけ。ツモなら和了れます。`);
  }
  const noYakuTiles = r.waitTiles.filter((t) => !r.yakuTiles.includes(t));
  if (noYakuTiles.length > 0) {
    lines.push(
      `待ちは ${tileNames(r.waitTiles)} ですが、${tileNames(noYakuTiles)} で和了った場合は役がありません(片和了 かたあがり)。今回の ${tileName(ctx.winTile)} は役がある側なので和了れます。`,
    );
  }
  if (q.scenario === 'menzenTsumoOk') {
    lines.push('ロンだったら役がなく、和了れませんでした。');
  }
  return lines;
}

/** 待ち牌ごとの役の有無(片和了の説明用) */
export function waitYakuTable(q: CanWinQuestion): { tile: number; yaku: string }[] {
  return q.result.waitTiles.map((t) => {
    const j = judgeYaku({ ...q.ctx, winTile: t });
    return { tile: t, yaku: j.han > 0 ? j.yaku.map((y) => YAKU[y.id].name).join('・') : '役なし' };
  });
}
