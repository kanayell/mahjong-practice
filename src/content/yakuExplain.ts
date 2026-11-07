// 役クイズの解説文:「なぜこの役がつくか」「なぜつかないか」
import { isMenzen } from '../core/agari';
import { parseKind, parseKinds } from '../core/notation';
import { CHUN, HAKU, HATSU, isHonor, isYaochu, suitOf, tileName, tileNames, WIND_KIND, WIND_NAME, type TileKind } from '../core/tile';
import type { Block, Meld, WinContext } from '../core/types';
import type { YakuId } from '../core/yaku/definitions';
import { allTilesOf, type YakuJudgement } from '../core/yaku/judge';
import type { CardExample } from './yakuCards';

const uniq = (ks: TileKind[]) => [...new Set(ks)].sort((a, b) => a - b);

function blocksOf(j: YakuJudgement): Block[] {
  return j.pattern?.decomposition.blocks ?? [];
}

function tripletKinds(j: YakuJudgement): TileKind[] {
  return blocksOf(j).flatMap((b) => (b.type === 'shuntsu' ? [] : [b.tile]));
}

const SHAPE_JA = { ryanmen: '両面', kanchan: '嵌張', penchan: '辺張', tanki: '単騎', shanpon: 'シャンポン' } as const;

function yakuhaiTile(id: YakuId, ctx: WinContext): TileKind {
  switch (id) {
    case 'yakuhaiHaku':
      return HAKU;
    case 'yakuhaiHatsu':
      return HATSU;
    case 'yakuhaiChun':
      return CHUN;
    case 'roundWind':
      return WIND_KIND[ctx.roundWind];
    default:
      return WIND_KIND[ctx.seatWind];
  }
}

/** この役がついている理由 */
export function explainPresent(id: YakuId, ctx: WinContext): string {
  const tiles = allTilesOf(ctx);
  switch (id) {
    case 'riichi':
      return 'リーチをかけて和了ったので1翻。';
    case 'menzenTsumo':
      return '鳴かずに、自分で引いた牌(ツモ)で和了ったので1翻。';
    case 'tanyao':
      return `14枚すべてが2〜8の数牌です${isMenzen(ctx.melds) ? '' : '(鳴いていても喰いタンで成立)'}。`;
    case 'yakuhaiHaku':
    case 'yakuhaiHatsu':
    case 'yakuhaiChun':
      return `${tileName(yakuhaiTile(id, ctx))}の刻子(3枚)があるので1翻。`;
    case 'roundWind':
      return `この局の場風は${WIND_NAME[ctx.roundWind]}。${WIND_NAME[ctx.roundWind]}の刻子があるので1翻。`;
    case 'seatWind':
      return `自分の席の風(自風)は${WIND_NAME[ctx.seatWind]}。${WIND_NAME[ctx.seatWind]}の刻子があるので1翻。`;
    case 'pinfu':
      return '鳴いていない・4面子すべて順子・雀頭が役牌でない・両面待ち、の条件をすべて満たしています。';
    case 'iipeikou':
      return '同じ順子が2組あります(鳴いていない)。';
    case 'chiitoitsu':
      return '違う種類の対子が7組そろっています。';
    case 'honitsu':
      return `数牌は${suitName(tiles)}だけ、あとは字牌です${isMenzen(ctx.melds) ? '(門前なので3翻)' : '(鳴いているので2翻)'}。`;
    case 'chinitsu':
      return `14枚すべてが${suitName(tiles)}です${isMenzen(ctx.melds) ? '(門前なので6翻)' : '(鳴いているので5翻)'}。`;
    case 'toitoi':
      return '4つの面子がすべて刻子です。';
    case 'sanshoku':
      return '同じ数字の順子が萬子・筒子・索子にそろっています。';
    case 'ittsu':
      return '1種類の数牌で、1・2・3、4・5・6、7・8・9の順子がそろっています。';
    case 'chanta':
      return 'すべての面子と雀頭に1・9・字牌が入っていて、順子と字牌を使っています。';
    case 'sanankou':
      return `自分で揃えた刻子(暗刻)が3つあります${!ctx.isTsumo ? '(ロンで完成した面子は順子なので、暗刻の数は減りません)' : ''}。`;
    case 'shousangen':
      return '三元牌のうち2つが刻子、残り1つが雀頭です(役牌の2翻も一緒につきます)。';
    default:
      return '';
  }
}

function suitName(tiles: TileKind[]): string {
  const s = tiles.find((k) => !isHonor(k));
  return s === undefined ? '' : { m: '萬子', p: '筒子', s: '索子', z: '' }[suitOf(s)];
}

/** この役がつかない理由(間違えて選んだ時) */
export function explainAbsent(id: YakuId, ctx: WinContext, j: YakuJudgement): string {
  const tiles = allTilesOf(ctx);
  const menzen = isMenzen(ctx.melds);
  const notMenzen = '鳴いている(門前ではない)ので、この役はつきません。';
  switch (id) {
    case 'riichi':
      return menzen ? 'この手はリーチをかけていません。' : '鳴いているとリーチはかけられません。';
    case 'menzenTsumo':
      return !menzen ? notMenzen : 'ロン(他の人の捨て牌)で和了っているので、つきません。ツモの時だけです。';
    case 'tanyao': {
      const bad = uniq(tiles.filter(isYaochu));
      return `1・9・字牌(${tileNames(bad)})が含まれているので、つきません。`;
    }
    case 'yakuhaiHaku':
    case 'yakuhaiHatsu':
    case 'yakuhaiChun':
    case 'roundWind':
    case 'seatWind': {
      const t = yakuhaiTile(id, ctx);
      const prefix =
        id === 'roundWind' ? `場風は${WIND_NAME[ctx.roundWind]}です。` : id === 'seatWind' ? `自風は${WIND_NAME[ctx.seatWind]}です。` : '';
      const n = tiles.filter((k) => k === t).length;
      if (n === 2) return `${prefix}${tileName(t)}は2枚(雀頭)だけです。役牌は3枚(刻子)そろえないと役になりません。`;
      if (n === 0) return `${prefix}${tileName(t)}を持っていません。`;
      return `${prefix}${tileName(t)}の刻子がありません。`;
    }
    case 'pinfu': {
      if (!menzen) return notMenzen;
      const reasons: string[] = [];
      const d = j.pattern?.decomposition;
      if (d?.form === 'chiitoitsu') return '七対子は4面子1雀頭の形ではないので、平和はつきません。';
      if (tripletKinds(j).length > 0) reasons.push('刻子がある');
      const head = d?.head;
      if (head !== undefined && (head >= HAKU || head === WIND_KIND[ctx.roundWind] || head === WIND_KIND[ctx.seatWind]))
        reasons.push(`雀頭(${tileName(head)})が役牌である`);
      if (j.pattern && j.pattern.shape !== 'ryanmen') reasons.push(`待ちが${SHAPE_JA[j.pattern.shape]}(両面ではない)`);
      return reasons.length ? `${reasons.join('、')}ため、平和はつきません。` : '平和の条件を満たしていません。';
    }
    case 'iipeikou':
      if (!menzen) return notMenzen;
      return '同じ種類・同じ数字の順子が2組ありません。';
    case 'chiitoitsu':
      return menzen ? '対子7組の形ではありません(4面子1雀頭の形です)。' : '鳴いていると七対子はできません。';
    case 'honitsu':
    case 'chinitsu': {
      const suits = new Set(tiles.filter((k) => !isHonor(k)).map(suitOf));
      if (suits.size > 1) return `数牌が${suits.size}種類(${[...suits].map((s) => ({ m: '萬子', p: '筒子', s: '索子' })[s as 'm']).join('・')})混ざっています。`;
      if (id === 'honitsu') return '字牌がないので、混一色ではなく清一色です。';
      return '字牌が入っているので、清一色ではなく混一色です。';
    }
    case 'toitoi':
      return '順子が入っているので、つきません。4つの面子すべてが刻子の時だけです。';
    case 'sanshoku':
      return '同じ数字の順子が、萬子・筒子・索子の3種類にそろっていません。';
    case 'ittsu':
      return '同じ種類で 1・2・3、4・5・6、7・8・9 の3つの順子がそろっていません。';
    case 'chanta': {
      if (!tiles.some(isHonor)) return '字牌がありません(字牌なしで全部の組に1・9が入るなら純全帯么九という別の役)。';
      return '1・9・字牌が入っていない面子か雀頭があります。';
    }
    case 'sanankou': {
      const concealedTriplets = blocksOf(j).filter((b) => b.type !== 'shuntsu' && !b.open).length;
      if (!ctx.isTsumo && j.pattern?.shape === 'shanpon')
        return 'シャンポン待ちをロンで和了ったので、和了牌で完成した刻子は暗刻に数えません(ツモなら三暗刻でした)。';
      return `暗刻(自分で揃えた刻子)が${concealedTriplets}つしかありません。`;
    }
    case 'shousangen':
      return '三元牌(白・發・中)の刻子2つ+雀頭1つの形になっていません。';
    default:
      return 'この手では条件を満たしていません。';
  }
}

/** 解説カードの例を、役判定に渡せる形にする */
export function exampleContext(e: CardExample): WinContext {
  const melds: Meld[] = (e.melds ?? []).map((m) => ({ type: m.type, tiles: parseKinds(m.tiles) }));
  return {
    concealed: parseKinds(e.concealed),
    winTile: parseKind(e.win),
    melds,
    isTsumo: e.isTsumo ?? false,
    isRiichi: e.isRiichi ?? false,
    roundWind: e.roundWind ?? 'east',
    seatWind: e.seatWind ?? 'south',
    discards: [],
  };
}
