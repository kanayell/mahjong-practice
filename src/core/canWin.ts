// 「その手、和了れる?」判定
// 和了の形になっていても、次の場合は和了れない:
//   - 役が1つもない(役なし)
//   - 片和了(かたあがり):待ちのうち一部の牌でしか役がつかず、役のない方の牌で和了ろうとした
//   - フリテン:自分の待ち牌を自分で捨てている状態でロンしようとした
import { isMenzen } from './agari';
import { furitenTiles } from './furiten';
import { tileNames, type TileKind } from './tile';
import { DEFAULT_RULES, type Rules, type WinContext } from './types';
import { YAKU } from './yaku/definitions';
import { judgeYaku, type YakuJudgement } from './yaku/judge';
import { getWaitTiles } from './wait';

export type CannotWinReason = 'notAgari' | 'noYaku' | 'kataagari' | 'furiten';

export interface WinJudgement {
  canWin: boolean;
  reasons: CannotWinReason[];
  judgement: YakuJudgement;
  waitTiles: TileKind[];
  /** 待ちのうち、役がつく牌(片和了の説明用) */
  yakuTiles: TileKind[];
  /** 自分で捨てている待ち牌(フリテンの説明用) */
  furitenTiles: TileKind[];
  /** 「なぜダメか」「どうすれば和了れたか」 */
  explanations: string[];
}

export function judgeWin(ctx: WinContext, rules: Rules = DEFAULT_RULES): WinJudgement {
  const judgement = judgeYaku(ctx, rules);
  const waitTiles = getWaitTiles(ctx.concealed, ctx.melds);
  const reasons: CannotWinReason[] = [];
  const explanations: string[] = [];

  if (!judgement.isAgari) {
    return {
      canWin: false,
      reasons: ['notAgari'],
      judgement,
      waitTiles,
      yakuTiles: [],
      furitenTiles: [],
      explanations: [
        waitTiles.length > 0
          ? `この牌では和了の形になりません。待ちは ${tileNames(waitTiles)} です。`
          : 'この手はまだテンパイしていません。',
      ],
    };
  }

  const yakuTiles = waitTiles.filter((t) => judgeYaku({ ...ctx, winTile: t }, rules).han > 0);
  const fTiles = ctx.isTsumo ? [] : furitenTiles(waitTiles, ctx.discards);
  const menzen = isMenzen(ctx.melds);

  if (judgement.han === 0) {
    reasons.push('noYaku');
    if (yakuTiles.length > 0) {
      reasons.push('kataagari');
      const y = judgeYaku({ ...ctx, winTile: yakuTiles[0] }, rules);
      explanations.push(
        `片和了(かたあがり)です。${tileNames(yakuTiles)} で和了れば「${y.yaku.map((r) => YAKU[r.id].name).join('・')}」がつきますが、${tileNames([ctx.winTile])} では役がありません。`,
      );
    } else {
      explanations.push('役が1つもありません(役なし)。和了るには最低1つの役が必要です。ドラは役ではないので、ドラがあっても和了れません。');
    }
    if (menzen) {
      if (!ctx.isRiichi) explanations.push('鳴いていない(門前 メンゼン)ので、リーチをかけていれば和了れました。');
      if (!ctx.isTsumo && judgeYaku({ ...ctx, isTsumo: true }, rules).han > 0)
        explanations.push('自分で引いた(ツモ)なら、門前清自摸和(メンゼンツモ)がつくので和了れます。');
    } else {
      explanations.push('鳴いた後は、役牌の刻子・断么九(タンヤオ)・混一色(ホンイツ)など、鳴いても成立する役を確保しておく必要があります。');
    }
  }

  if (fTiles.length > 0) {
    reasons.push('furiten');
    explanations.push(
      `フリテンです。待ち牌の ${tileNames(fTiles)} を自分で捨てているので、ロンできません。ツモなら和了れます。待ちを変えるか、捨てる前に待ちを確認しましょう。`,
    );
  }

  return {
    canWin: reasons.length === 0,
    reasons,
    judgement,
    waitTiles,
    yakuTiles,
    furitenTiles: fTiles,
    explanations,
  };
}
