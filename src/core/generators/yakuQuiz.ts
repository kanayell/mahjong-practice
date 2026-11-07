// 役クイズの問題を自動で作る
// 「出したい役」に合わせて和了形を組み立て、鳴き・ツモ/ロン・リーチ・風をランダムに決める。
// 正解は必ず役判定ロジック(judgeYaku)で計算する。
import { isMenzen } from '../agari';
import { pick, randInt, shuffle, type Rng } from '../random';
import { CHUN, emptyCounts, HAKU, HATSU, isDragon, isTerminal, isYaochu, makeKind, numberOf, WIND_KIND, type Counts, type Suit, type TileKind, type Wind } from '../tile';
import { DEFAULT_RULES, type Meld, type Rules, type WinContext } from '../types';
import { YAKU, YAKU_LIST, type YakuId } from '../yaku/definitions';
import { judgeYaku, type YakuJudgement } from '../yaku/judge';

export type YakuStage = 1 | 2 | 3;

export interface YakuQuestion {
  stage: YakuStage;
  ctx: WinContext;
  /** 赤ドラとして表示する牌の種類(手の内のその牌のうち1枚を赤くする) */
  redKinds: TileKind[];
  doraIndicator: TileKind;
  judgement: YakuJudgement;
  /** 出題のねらいの役 */
  target: YakuId;
}

/** この段階のクイズで選択肢に出す役 */
export function yakuOptions(stage: YakuStage): YakuId[] {
  return YAKU_LIST.filter((d) => d.stage >= 1 && d.stage <= stage).map((d) => d.id);
}

type Spec = { type: 'shuntsu'; first: TileKind } | { type: 'koutsu'; tile: TileKind };
type NumSuit = Exclude<Suit, 'z'>;
const NUM_SUITS: NumSuit[] = ['m', 'p', 's'];
const HONORS: TileKind[] = [27, 28, 29, 30, 31, 32, 33];

class Builder {
  c: Counts = emptyCounts();
  blocks: Spec[] = [];
  head: TileKind | null = null;
  pairs: TileKind[] | null = null;
  constructor(private rng: Rng) {}

  add(s: Spec): boolean {
    const tiles = s.type === 'shuntsu' ? [s.first, s.first + 1, s.first + 2] : [s.tile, s.tile, s.tile];
    const next = [...this.c];
    for (const k of tiles) if (++next[k] > 4) return false;
    this.c = next;
    this.blocks.push(s);
    return true;
  }

  setHead(k: TileKind): boolean {
    if (this.c[k] + 2 > 4) return false;
    this.c[k] += 2;
    this.head = k;
    return true;
  }

  /** gen が作る面子で、4面子になるまで埋める */
  fill(gen: () => Spec): boolean {
    for (let tries = 0; this.blocks.length < 4; tries++) {
      if (tries > 60) return false;
      this.add(gen());
    }
    return true;
  }

  fillHead(gen: () => TileKind): boolean {
    for (let tries = 0; tries < 60; tries++) if (this.setHead(gen())) return true;
    return false;
  }

  shuntsu(suits: NumSuit[] = NUM_SUITS, minN = 1, maxN = 7): Spec {
    return { type: 'shuntsu', first: makeKind(pick(this.rng, suits), minN + randInt(this.rng, maxN - minN + 1)) };
  }

  koutsu(kinds: TileKind[]): Spec {
    return { type: 'koutsu', tile: pick(this.rng, kinds) };
  }
}

const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);
const ALL_KINDS = range(0, 34);
const NUMBER_KINDS = range(0, 27);

function generic(b: Builder, rng: Rng): Spec {
  if (rng() < 0.7) return b.shuntsu();
  return b.koutsu(rng() < 0.3 ? HONORS : NUMBER_KINDS);
}

function kindsOfSuit(s: NumSuit, filter: (k: TileKind) => boolean = () => true) {
  return range(0, 9).map((n) => makeKind(s, n + 1)).filter(filter);
}

/** 狙いの役に合わせて和了形の材料(面子と雀頭)を組み立てる */
function buildFor(target: YakuId, rng: Rng, winds: { round: Wind; seat: Wind }): Builder | null {
  const b = new Builder(rng);
  const g = () => generic(b, rng);
  const anyHead = () => pick(rng, rng() < 0.85 ? NUMBER_KINDS : HONORS);
  const ok = (x: boolean) => (x ? b : null);

  switch (target) {
    case 'riichi':
    case 'menzenTsumo':
      return ok(b.fill(g) && b.fillHead(anyHead));
    case 'tanyao': {
      const simple = NUMBER_KINDS.filter((k) => !isTerminal(k));
      return ok(b.fill(() => (rng() < 0.75 ? b.shuntsu(NUM_SUITS, 2, 6) : b.koutsu(simple))) && b.fillHead(() => pick(rng, simple)));
    }
    case 'yakuhaiHaku':
    case 'yakuhaiHatsu':
    case 'yakuhaiChun': {
      const t = { yakuhaiHaku: HAKU, yakuhaiHatsu: HATSU, yakuhaiChun: CHUN }[target];
      return ok(b.add({ type: 'koutsu', tile: t }) && b.fill(g) && b.fillHead(anyHead));
    }
    case 'roundWind':
      return ok(b.add({ type: 'koutsu', tile: WIND_KIND[winds.round] }) && b.fill(g) && b.fillHead(anyHead));
    case 'seatWind':
      return ok(b.add({ type: 'koutsu', tile: WIND_KIND[winds.seat] }) && b.fill(g) && b.fillHead(anyHead));
    case 'pinfu': {
      const yakuhaiHead = (k: TileKind) => isDragon(k) || k === WIND_KIND[winds.round] || k === WIND_KIND[winds.seat];
      return ok(b.fill(() => b.shuntsu()) && b.fillHead(() => pick(rng, ALL_KINDS.filter((k) => !yakuhaiHead(k)))));
    }
    case 'iipeikou': {
      const s = b.shuntsu();
      return ok(b.add(s) && b.add(s) && b.fill(() => b.shuntsu()) && b.fillHead(anyHead));
    }
    case 'chiitoitsu': {
      const kinds = shuffle(rng, rng() < 0.5 ? NUMBER_KINDS : ALL_KINDS).slice(0, 7);
      for (const k of kinds) b.c[k] += 2;
      b.pairs = kinds;
      return b;
    }
    case 'honitsu': {
      const s = pick(rng, NUM_SUITS);
      const suitKinds = kindsOfSuit(s);
      return ok(
        b.add(b.koutsu(HONORS)) &&
          b.fill(() => (rng() < 0.7 ? b.shuntsu([s]) : b.koutsu(rng() < 0.4 ? HONORS : suitKinds))) &&
          b.fillHead(() => pick(rng, rng() < 0.6 ? suitKinds : HONORS)),
      );
    }
    case 'toitoi':
      return ok(b.fill(() => b.koutsu(rng() < 0.25 ? HONORS : NUMBER_KINDS)) && b.fillHead(anyHead));
    case 'sanshoku': {
      const n = 1 + randInt(rng, 7);
      return ok(NUM_SUITS.every((s) => b.add({ type: 'shuntsu', first: makeKind(s, n) })) && b.fill(g) && b.fillHead(anyHead));
    }
    case 'ittsu': {
      const s = pick(rng, NUM_SUITS);
      return ok([1, 4, 7].every((n) => b.add({ type: 'shuntsu', first: makeKind(s, n) })) && b.fill(g) && b.fillHead(anyHead));
    }
    case 'chinitsu': {
      const s = pick(rng, NUM_SUITS);
      return ok(b.fill(() => (rng() < 0.7 ? b.shuntsu([s]) : b.koutsu(kindsOfSuit(s)))) && b.fillHead(() => pick(rng, kindsOfSuit(s))));
    }
    case 'chanta': {
      const yaochu = ALL_KINDS.filter(isYaochu);
      const edgeShuntsu = (): Spec => ({ type: 'shuntsu', first: makeKind(pick(rng, NUM_SUITS), pick(rng, [1, 7])) });
      return ok(
        b.add(edgeShuntsu()) &&
          b.add(b.koutsu(HONORS)) &&
          b.fill(() => (rng() < 0.6 ? edgeShuntsu() : b.koutsu(yaochu))) &&
          b.fillHead(() => pick(rng, yaochu)),
      );
    }
    case 'sanankou':
      return ok(b.add(b.koutsu(ALL_KINDS)) && b.add(b.koutsu(ALL_KINDS)) && b.add(b.koutsu(ALL_KINDS)) && b.fill(() => b.shuntsu()) && b.fillHead(anyHead));
    case 'shousangen': {
      const [d1, d2, h] = shuffle(rng, [HAKU, HATSU, CHUN]);
      return ok(b.add({ type: 'koutsu', tile: d1 }) && b.add({ type: 'koutsu', tile: d2 }) && b.setHead(h) && b.fill(g));
    }
    default:
      return null;
  }
}

/** 門前でないと成立しない役 */
const MENZEN_ONLY = new Set<YakuId>(['riichi', 'menzenTsumo', 'pinfu', 'iipeikou', 'chiitoitsu']);

function makeContext(b: Builder, target: YakuId, rng: Rng, winds: { round: Wind; seat: Wind }): WinContext | null {
  const melds: Meld[] = [];
  const concealedBlocks = [...b.blocks];
  const wantOpen = !MENZEN_ONLY.has(target) && b.pairs === null && rng() < 0.4;
  if (wantOpen) {
    const n = 1 + randInt(rng, 2);
    for (const i of shuffle(rng, range(0, concealedBlocks.length)).slice(0, n).sort((x, y) => y - x)) {
      const s = concealedBlocks.splice(i, 1)[0];
      if (s.type === 'shuntsu') {
        const tiles = [s.first, s.first + 1, s.first + 2];
        melds.push({ type: 'chi', tiles, calledTile: pick(rng, tiles) });
      } else {
        melds.push({ type: 'pon', tiles: [s.tile, s.tile, s.tile], calledTile: s.tile });
      }
    }
  }
  const concealed: TileKind[] = [];
  if (b.pairs) for (const k of b.pairs) concealed.push(k, k);
  else {
    for (const s of concealedBlocks) {
      if (s.type === 'shuntsu') concealed.push(s.first, s.first + 1, s.first + 2);
      else concealed.push(s.tile, s.tile, s.tile);
    }
    concealed.push(b.head!, b.head!);
  }
  const win = pick(rng, concealed);
  concealed.splice(concealed.indexOf(win), 1);
  concealed.sort((x, y) => x - y);
  const menzen = isMenzen(melds);
  return {
    concealed,
    melds,
    winTile: win,
    isTsumo: target === 'menzenTsumo' ? true : rng() < 0.45,
    isRiichi: menzen && (target === 'riichi' || rng() < 0.35),
    roundWind: winds.round,
    seatWind: winds.seat,
    discards: [],
  };
}

export interface YakuQuizOptions {
  rules?: Rules;
  /** 優先して出したい役(苦手な役) */
  preferYaku?: YakuId[];
}

function chooseTarget(rng: Rng, stage: YakuStage, prefer?: YakuId[]): YakuId {
  if (prefer?.length && rng() < 0.6) {
    const ok = prefer.filter((id) => YAKU[id].stage >= 1 && YAKU[id].stage <= stage);
    if (ok.length) return pick(rng, ok);
  }
  const current = YAKU_LIST.filter((d) => d.stage === stage).map((d) => d.id);
  const earlier = YAKU_LIST.filter((d) => d.stage >= 1 && d.stage < stage).map((d) => d.id);
  return earlier.length && rng() < 0.3 ? pick(rng, earlier) : pick(rng, current);
}

/** ドラ表示牌の次の牌がドラ */
export function doraFromIndicator(k: TileKind): TileKind {
  if (k < 27) return numberOf(k) === 9 ? k - 8 : k + 1;
  if (k <= 30) return k === 30 ? 27 : k + 1;
  return k === 33 ? 31 : k + 1;
}

export function generateYakuQuestion(rng: Rng, stage: YakuStage, opts: YakuQuizOptions = {}): YakuQuestion {
  const rules = opts.rules ?? DEFAULT_RULES;
  const options = new Set(yakuOptions(stage));
  let target = chooseTarget(rng, stage, opts.preferYaku);
  for (let attempt = 0; attempt < 5000; attempt++) {
    if (attempt > 0 && attempt % 300 === 0) target = chooseTarget(rng, stage, opts.preferYaku);
    const winds = { round: pick(rng, ['east', 'south'] as Wind[]), seat: pick(rng, ['east', 'south', 'west', 'north'] as Wind[]) };
    const b = buildFor(target, rng, winds);
    if (!b) continue;
    const ctx = makeContext(b, target, rng, winds);
    if (!ctx) continue;
    const judgement = judgeYaku(ctx, rules);
    if (!judgement.isAgari || judgement.yakuman || judgement.han === 0) continue;
    if (!judgement.yaku.every((y) => options.has(y.id))) continue;
    if (!judgement.yaku.some((y) => y.id === target)) continue;
    const fives = ctx.concealed.filter((k) => k < 27 && numberOf(k) === 5);
    const redKinds = fives.length && rng() < 0.3 ? [pick(rng, fives)] : [];
    const doraIndicator = randInt(rng, 34);
    return { stage, ctx, redKinds, doraIndicator, judgement, target };
  }
  throw new Error('問題を作れませんでした');
}
