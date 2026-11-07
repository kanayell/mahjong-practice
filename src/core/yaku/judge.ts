// 役判定
// ドラ・赤ドラは役ではないので、ここでは扱わない。
import { getAgariDecompositions, isMenzen } from '../agari';
import {
  CHUN,
  HAKU,
  HATSU,
  isDragon,
  isHonor,
  isSimple,
  isTerminal,
  isWind,
  isYaochu,
  numberOf,
  suitOf,
  toCounts,
  WIND_KIND,
  type TileKind,
} from '../tile';
import { DEFAULT_RULES, type Block, type Rules, type WaitPattern, type WinContext } from '../types';
import { winPatterns } from '../wait';
import { YAKU, type YakuId } from './definitions';

export interface YakuResult {
  id: YakuId;
  han: number;
}

export interface YakuJudgement {
  /** 和了の形になっているか */
  isAgari: boolean;
  yaku: YakuResult[];
  han: number;
  yakuman: boolean;
  /** 採用した解釈(分解+和了牌の位置+待ちの形) */
  pattern?: WaitPattern;
}

/** 手牌全体(手の内+和了牌+鳴き)の牌 */
export function allTilesOf(ctx: WinContext): TileKind[] {
  return [...ctx.concealed, ctx.winTile, ...ctx.melds.flatMap((m) => m.tiles)];
}

export function judgeYaku(ctx: WinContext, rules: Rules = DEFAULT_RULES): YakuJudgement {
  const decomps = getAgariDecompositions([...ctx.concealed, ctx.winTile], ctx.melds);
  if (decomps.length === 0) return { isAgari: false, yaku: [], han: 0, yakuman: false };

  let best: YakuJudgement | null = null;
  for (const d of decomps) {
    for (const p of winPatterns(d, ctx.winTile, ctx.melds.length)) {
      const r = judgePattern(ctx, p, rules);
      if (!best || compare(r, best) > 0) best = r;
    }
  }
  return best!;
}

function compare(a: YakuJudgement, b: YakuJudgement): number {
  if (a.han !== b.han) return a.han - b.han;
  return a.yaku.length - b.yaku.length;
}

const isTriplet = (b: Block) => b.type === 'koutsu' || b.type === 'kantsu';
const tripletTile = (b: Block) => (b.type === 'shuntsu' ? -1 : b.tile);

function judgePattern(ctx: WinContext, p: WaitPattern, rules: Rules): YakuJudgement {
  const d = p.decomposition;
  const menzen = isMenzen(ctx.melds);
  const tiles = allTilesOf(ctx);
  const counts = toCounts(tiles);
  const roundKind = WIND_KIND[ctx.roundWind];
  const seatKind = WIND_KIND[ctx.seatWind];

  // ロンで完成した刻子は「明刻(ミンコー)」扱い(暗刻に数えない)
  const blocks: Block[] = d.blocks.map((b, i) =>
    !ctx.isTsumo && p.winIn.kind === 'block' && p.winIn.index === i && b.type === 'koutsu'
      ? { ...b, open: true }
      : b,
  );
  const triplets = blocks.filter(isTriplet);
  const shuntsu = blocks.filter((b): b is Extract<Block, { type: 'shuntsu' }> => b.type === 'shuntsu');
  const concealedTriplets = triplets.filter((b) => !b.open).length;
  const hasTriplet = (k: TileKind) => triplets.some((b) => tripletTile(b) === k);

  const suits = new Set(tiles.filter((k) => !isHonor(k)).map(suitOf));
  const hasHonor = tiles.some(isHonor);

  // ---- 役満 ----
  const yakuman: YakuId[] = [];
  if (d.form === 'kokushi') yakuman.push('kokushi');
  if (d.form === 'standard') {
    if (concealedTriplets === 4) yakuman.push('suuankou');
    const dragonTriplets = [HAKU, HATSU, CHUN].filter(hasTriplet).length;
    if (dragonTriplets === 3) yakuman.push('daisangen');
    const windTriplets = [27, 28, 29, 30].filter(hasTriplet).length;
    if (windTriplets === 4) yakuman.push('daisuushii');
    else if (windTriplets === 3 && d.head !== undefined && isWind(d.head)) yakuman.push('shousuushii');
  }
  if (d.form !== 'kokushi') {
    if (tiles.every(isHonor)) yakuman.push('tsuuiisou');
    if (tiles.every(isTerminal)) yakuman.push('chinroutou');
    const green = new Set([19, 20, 21, 23, 25, HATSU]); // 2・3・4・6・8索、發
    if (tiles.every((k) => green.has(k))) yakuman.push('ryuuiisou');
    if (menzen && ctx.melds.length === 0 && suits.size === 1 && !hasHonor && isChuuren(counts)) yakuman.push('chuuren');
  }
  if (yakuman.length > 0) {
    const yaku = yakuman.map((id) => ({ id, han: 13 }));
    return { isAgari: true, yaku, han: 13 * yaku.length, yakuman: true, pattern: p };
  }

  // ---- 通常の役 ----
  const ids: YakuId[] = [];
  if (ctx.isRiichi && menzen) ids.push('riichi');
  if (ctx.isTsumo && menzen) ids.push('menzenTsumo');
  if (tiles.every(isSimple) && (menzen || rules.kuitan)) ids.push('tanyao');

  if (d.form === 'chiitoitsu') {
    ids.push('chiitoitsu');
  }

  if (d.form === 'standard') {
    const head = d.head!;
    if (hasTriplet(HAKU)) ids.push('yakuhaiHaku');
    if (hasTriplet(HATSU)) ids.push('yakuhaiHatsu');
    if (hasTriplet(CHUN)) ids.push('yakuhaiChun');
    if (hasTriplet(roundKind)) ids.push('roundWind');
    if (hasTriplet(seatKind)) ids.push('seatWind');

    const headIsYakuhai = isDragon(head) || head === roundKind || head === seatKind;
    if (menzen && shuntsu.length === 4 && !headIsYakuhai && p.shape === 'ryanmen') ids.push('pinfu');

    if (menzen) {
      const firstCount = new Map<number, number>();
      for (const s of shuntsu) firstCount.set(s.first, (firstCount.get(s.first) ?? 0) + 1);
      let peiko = 0;
      for (const n of firstCount.values()) peiko += Math.floor(n / 2);
      if (peiko >= 2) ids.push('ryanpeikou');
      else if (peiko === 1) ids.push('iipeikou');
    }

    if (triplets.length === 4) ids.push('toitoi');
    if (concealedTriplets === 3) ids.push('sanankou');
    if (blocks.filter((b) => b.type === 'kantsu').length === 3) ids.push('sankantsu');

    const firsts = new Set(shuntsu.map((s) => s.first));
    for (let n = 0; n < 7; n++) {
      if (firsts.has(n) && firsts.has(9 + n) && firsts.has(18 + n)) {
        ids.push('sanshoku');
        break;
      }
    }
    for (const base of [0, 9, 18]) {
      if (firsts.has(base) && firsts.has(base + 3) && firsts.has(base + 6)) {
        ids.push('ittsu');
        break;
      }
    }

    const dragonTriplets = [HAKU, HATSU, CHUN].filter(hasTriplet).length;
    if (dragonTriplets === 2 && isDragon(head)) ids.push('shousangen');

    // チャンタ系:すべての面子と雀頭に1・9・字牌が含まれる
    const blockHasYaochu = (b: Block) =>
      b.type === 'shuntsu' ? numberOf(b.first) === 1 || numberOf(b.first) === 7 : isYaochu(b.tile);
    if (isYaochu(head) && blocks.every(blockHasYaochu)) {
      if (shuntsu.length > 0) ids.push(hasHonor ? 'chanta' : 'junchan');
    }
  }

  // 混老頭:すべて1・9・字牌(対々和や七対子と複合)
  if (tiles.every(isYaochu) && hasHonor) ids.push('honroutou');

  // 染め手
  if (suits.size === 1) ids.push(hasHonor ? 'honitsu' : 'chinitsu');

  const yaku = ids.map((id) => ({ id, han: menzen ? YAKU[id].han : YAKU[id].hanOpen })).filter((y) => y.han > 0);
  const han = yaku.reduce((a, y) => a + y.han, 0);
  return { isAgari: true, yaku, han, yakuman: false, pattern: p };
}

/** 九蓮宝燈:1112345678999 + 同じ種類の牌1枚 */
function isChuuren(counts: number[]): boolean {
  const base = counts.findIndex((n, k) => n > 0 && k < 27);
  if (base < 0) return false;
  const start = base - (base % 9);
  const need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  return need.every((n, i) => counts[start + i] >= n);
}
