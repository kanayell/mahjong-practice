// 一人打ち練習:山から引いて捨てるを繰り返す(対戦相手なし)
import { isAgari } from './agari';
import { shuffle, type Rng } from './random';
import { calcShanten } from './shanten';
import type { Tile, TileKind, Wind } from './tile';
import { toCounts } from './tile';
import { getWaitTiles } from './wait';
import { judgeYaku, type YakuJudgement } from './yaku/judge';

/** 136枚の山を作る(5萬・5筒・5索のうち各1枚は赤ドラ) */
export function createWall(rng: Rng): Tile[] {
  const tiles: Tile[] = [];
  let uid = 0;
  for (let k = 0; k < 34; k++) {
    for (let i = 0; i < 4; i++) {
      const red = (k === 4 || k === 13 || k === 22) && i === 0;
      tiles.push({ kind: k, red: red || undefined, uid: uid++ });
    }
  }
  return shuffle(rng, tiles);
}

/** 実戦で1人がツモる回数はだいたい17〜18回 */
export const DEFAULT_MAX_DRAWS = 18;

export interface SoloState {
  /** これから引く牌 */
  wall: Tile[];
  /** 手牌(引いた牌を除く13枚) */
  hand: Tile[];
  /** 今引いた牌 */
  drawn: Tile | null;
  discards: Tile[];
  draws: number;
  maxDraws: number;
  doraIndicator: Tile;
  roundWind: Wind;
  seatWind: Wind;
  riichi: boolean;
  /** リーチを宣言した捨て牌の位置 */
  riichiIndex: number | null;
  result: SoloResult | null;
}

export type SoloResult =
  | { type: 'tsumo'; judgement: YakuJudgement }
  | { type: 'ryuukyoku'; tenpai: boolean }
  | { type: 'chombo' };

export function sortTiles(ts: Tile[]): Tile[] {
  return [...ts].sort((a, b) => a.kind - b.kind || Number(!!b.red) - Number(!!a.red) || a.uid - b.uid);
}

export interface NewGameOptions {
  /** テスト用:山を指定する(先頭から配牌13枚→ツモ順。最後の1枚がドラ表示牌) */
  wall?: Tile[];
  maxDraws?: number;
  roundWind?: Wind;
  seatWind?: Wind;
}

export function newGame(rng: Rng, opts: NewGameOptions = {}): SoloState {
  const all = opts.wall ? [...opts.wall] : createWall(rng);
  const doraIndicator = all.pop()!;
  const hand = sortTiles(all.splice(0, 13));
  const winds: Wind[] = ['east', 'south', 'west', 'north'];
  const state: SoloState = {
    wall: all,
    hand,
    drawn: null,
    discards: [],
    draws: 0,
    maxDraws: opts.maxDraws ?? DEFAULT_MAX_DRAWS,
    doraIndicator,
    roundWind: opts.roundWind ?? (rng() < 0.7 ? 'east' : 'south'),
    seatWind: opts.seatWind ?? winds[Math.floor(rng() * 4)],
    riichi: false,
    riichiIndex: null,
    result: null,
  };
  return draw(state);
}

function draw(s: SoloState): SoloState {
  if (s.draws >= s.maxDraws || s.wall.length === 0) {
    return { ...s, drawn: null, result: { type: 'ryuukyoku', tenpai: getWaitTiles(kinds(s.hand)).length > 0 } };
  }
  const [t, ...rest] = s.wall;
  return { ...s, wall: rest, drawn: t, draws: s.draws + 1 };
}

export const kinds = (ts: Tile[]) => ts.map((t) => t.kind);

/** 手牌+引いた牌(14枚) */
export function fullHand(s: SoloState): Tile[] {
  return s.drawn ? [...s.hand, s.drawn] : s.hand;
}

export function canTsumo(s: SoloState): boolean {
  return !!s.drawn && isAgari(kinds(fullHand(s)));
}

/** この牌を捨てられるか(リーチ後は引いた牌しか捨てられない) */
export function canDiscard(s: SoloState, uid: number): boolean {
  if (s.result || !s.drawn) return false;
  if (s.riichi) return s.drawn.uid === uid;
  return fullHand(s).some((t) => t.uid === uid);
}

/** この牌を捨てたら残る13枚 */
export function handAfterDiscard(s: SoloState, uid: number): Tile[] {
  return fullHand(s).filter((t) => t.uid !== uid);
}

/** リーチを宣言して捨てられる牌(捨てた後にテンパイになる牌) */
export function riichiDiscards(s: SoloState): number[] {
  if (s.riichi || !s.drawn || s.draws >= s.maxDraws) return [];
  return fullHand(s)
    .filter((t) => getWaitTiles(kinds(handAfterDiscard(s, t.uid))).length > 0)
    .map((t) => t.uid);
}

export function discard(s: SoloState, uid: number, declareRiichi = false): SoloState {
  if (!canDiscard(s, uid)) return s;
  if (declareRiichi && !riichiDiscards(s).includes(uid)) return s;
  const tile = fullHand(s).find((t) => t.uid === uid)!;
  const next: SoloState = {
    ...s,
    hand: sortTiles(handAfterDiscard(s, uid)),
    drawn: null,
    discards: [...s.discards, tile],
    riichi: s.riichi || declareRiichi,
    riichiIndex: declareRiichi ? s.discards.length : s.riichiIndex,
  };
  return draw(next);
}

/** ツモ和了を宣言する。和了の形でなければチョンボ(反則) */
export function declareTsumo(s: SoloState): SoloState {
  if (s.result || !s.drawn) return s;
  if (!canTsumo(s)) return { ...s, result: { type: 'chombo' } };
  const judgement = judgeYaku({
    concealed: kinds(s.hand),
    winTile: s.drawn.kind,
    melds: [],
    isTsumo: true,
    isRiichi: s.riichi,
    roundWind: s.roundWind,
    seatWind: s.seatWind,
    discards: kinds(s.discards),
  });
  return { ...s, result: { type: 'tsumo', judgement } };
}

/** 向聴数(手牌+引いた牌で数える) */
export function currentShanten(s: SoloState): number {
  return calcShanten(kinds(fullHand(s)));
}

/** 見えていない枚数(4 − 自分の手・捨て牌・ドラ表示牌にある枚数) */
export function remainingCount(s: SoloState, k: TileKind): number {
  const seen = toCounts([...kinds(fullHand(s)), ...kinds(s.discards), s.doraIndicator.kind]);
  return Math.max(0, 4 - seen[k]);
}
