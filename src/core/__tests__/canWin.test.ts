import { judgeWin } from '../canWin';
import { isFuriten } from '../furiten';
import { toNotation } from '../notation';
import { chi, ctx, k, pon } from './helpers';

describe('和了れる?判定', () => {
  it('役がある手は和了れる', () => {
    const r = judgeWin(ctx('23m456789p234s55s', '1m'));
    expect(r.canWin).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it('鳴いて役なし → 和了れない', () => {
    const r = judgeWin(ctx('345m678p234s9s', '9s', { melds: [pon('222s')] }));
    expect(r.canWin).toBe(false);
    expect(r.reasons).toEqual(['noYaku']);
    expect(r.explanations.join()).toContain('鳴いても成立する役');
  });

  it('鳴いて役なしはツモでも和了れない', () => {
    const r = judgeWin(ctx('345m678p234s9s', '9s', { melds: [pon('222s')], isTsumo: true }));
    expect(r.canWin).toBe(false);
  });

  it('片和了:白と7索のシャンポン待ちで、7索では役がない', () => {
    const base = '345m678p55z77s';
    const opts = { melds: [chi('234s')] };
    const r = judgeWin(ctx(base, '7s', opts));
    expect(r.canWin).toBe(false);
    expect(r.reasons).toEqual(['noYaku', 'kataagari']);
    expect(toNotation(r.yakuTiles)).toBe('5z');
    // 白なら和了れる
    expect(judgeWin(ctx(base, '5z', opts)).canWin).toBe(true);
  });

  it('門前で役なしのロン → リーチかツモなら和了れたと説明する', () => {
    const r = judgeWin(ctx('13m456789p234s99s', '2m'));
    expect(r.canWin).toBe(false);
    expect(r.explanations.join()).toContain('リーチ');
    expect(r.explanations.join()).toContain('ツモ');
    expect(judgeWin(ctx('13m456789p234s99s', '2m', { isTsumo: true })).canWin).toBe(true);
  });

  it('フリテン:待ちの4萬を捨てているので1萬でロンできない', () => {
    const r = judgeWin(ctx('23m456789p234s55s', '1m', { discards: '9s4m1z' }));
    expect(r.canWin).toBe(false);
    expect(r.reasons).toEqual(['furiten']);
    expect(toNotation(r.furitenTiles)).toBe('4m');
  });

  it('フリテンでもツモなら和了れる', () => {
    expect(judgeWin(ctx('23m456789p234s55s', '1m', { discards: '4m', isTsumo: true })).canWin).toBe(true);
  });

  it('待ちでない牌を捨てていてもフリテンではない', () => {
    expect(isFuriten(k('14m'), k('2m5m9p'))).toBe(false);
  });

  it('役なしかつフリテン → 両方の理由を示す', () => {
    const r = judgeWin(ctx('345m678p234s9s', '9s', { melds: [pon('222s')], discards: '9s' }));
    expect(r.reasons).toEqual(['noYaku', 'furiten']);
  });

  it('和了の形でない牌', () => {
    const r = judgeWin(ctx('23m456789p234s55s', '5m'));
    expect(r.reasons).toEqual(['notAgari']);
  });
});
