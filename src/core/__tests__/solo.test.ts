import { parseTiles } from '../notation';
import { createRng } from '../random';
import {
  canTsumo,
  createWall,
  declareTsumo,
  discard,
  fullHand,
  newGame,
  remainingCount,
  riichiDiscards,
} from '../solo';
import { toCounts } from '../tile';

/** 配牌13枚+ツモ順+ドラ表示牌 から山を作る */
function wallOf(haipai: string, draws: string, dora = '9s') {
  const tiles = parseTiles(haipai + draws + dora);
  // uid を通し番号にする
  return tiles.map((t, i) => ({ ...t, uid: i }));
}

describe('一人打ち', () => {
  it('山は136枚で、赤ドラは3枚', () => {
    const w = createWall(createRng(1));
    expect(w.length).toBe(136);
    expect(Math.max(...toCounts(w.map((t) => t.kind)))).toBe(4);
    expect(w.filter((t) => t.red).length).toBe(3);
  });

  it('配牌13枚+1枚ツモした状態で始まる', () => {
    const s = newGame(createRng(2));
    expect(s.hand.length).toBe(13);
    expect(s.drawn).not.toBeNull();
    expect(s.draws).toBe(1);
  });

  it('捨てると次の牌を引く', () => {
    let s = newGame(createRng(3));
    const uid = s.hand[0].uid;
    s = discard(s, uid);
    expect(s.discards.map((t) => t.uid)).toEqual([uid]);
    expect(s.hand.length).toBe(13);
    expect(s.draws).toBe(2);
  });

  it('決められた回数ツモったら流局', () => {
    let s = newGame(createRng(4), { maxDraws: 3 });
    for (let i = 0; i < 3; i++) s = discard(s, s.drawn!.uid);
    expect(s.result?.type).toBe('ryuukyoku');
  });

  it('和了の形ならツモ和了でき、役が判定される', () => {
    let s = newGame(createRng(5), { wall: wallOf('23m456789p234s55s', '1m'), roundWind: 'east', seatWind: 'south' });
    expect(canTsumo(s)).toBe(true);
    s = declareTsumo(s);
    expect(s.result?.type).toBe('tsumo');
    if (s.result?.type === 'tsumo') expect(s.result.judgement.yaku.map((y) => y.id).sort()).toEqual(['menzenTsumo', 'pinfu']);
  });

  it('和了の形でないのに宣言するとチョンボ', () => {
    let s = newGame(createRng(6), { wall: wallOf('23m456789p234s55s', '7z') });
    expect(canTsumo(s)).toBe(false);
    s = declareTsumo(s);
    expect(s.result?.type).toBe('chombo');
  });

  it('リーチはテンパイになる牌を捨てる時だけ宣言でき、その後は引いた牌しか捨てられない', () => {
    let s = newGame(createRng(7), { wall: wallOf('23m456789p234s55s', '7z1z2z') });
    // 7z(中)を捨てればテンパイのまま
    const chun = s.drawn!.uid;
    expect(riichiDiscards(s)).toContain(chun);
    // 2萬を捨てるとテンパイではなくなる
    const m2 = s.hand.find((t) => t.kind === 1)!.uid;
    expect(riichiDiscards(s)).not.toContain(m2);
    s = discard(s, chun, true);
    expect(s.riichi).toBe(true);
    // 手牌の牌は捨てられない
    const before = s;
    s = discard(s, s.hand[0].uid);
    expect(s).toBe(before);
    s = discard(s, s.drawn!.uid);
    expect(s.discards.length).toBe(2);
  });

  it('見えていない枚数を数える', () => {
    const s = newGame(createRng(8), { wall: wallOf('23m456789p234s55s', '1m', '1m') });
    // 手に1萬1枚・ドラ表示牌に1萬1枚
    expect(remainingCount(s, 0)).toBe(2);
    expect(fullHand(s).length).toBe(14);
  });
});
