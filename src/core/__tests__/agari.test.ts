import { getAgariDecompositions, isAgari } from '../agari';
import { parseKinds, toNotation } from '../notation';
import { calcShanten } from '../shanten';
import { chi, k, pon } from './helpers';

describe('記法', () => {
  it('文字列と牌を相互に変換できる', () => {
    expect(toNotation(parseKinds('321m55z406p'))).toBe('123m456p55z');
  });
  it('種類が抜けているとエラー', () => {
    expect(() => parseKinds('123')).toThrow();
  });
});

describe('和了判定', () => {
  it('4面子1雀頭', () => {
    expect(isAgari(k('123m456p789s11122z'))).toBe(true);
  });
  it('バラバラの手は和了ではない', () => {
    expect(isAgari(k('123m456p789s11123z'))).toBe(false);
  });
  it('七対子', () => {
    const d = getAgariDecompositions(k('1133m5577p99s1122z'));
    expect(d.map((x) => x.form)).toEqual(['chiitoitsu']);
  });
  it('同じ牌4枚は七対子の2組と数えない', () => {
    expect(isAgari(k('1111m33m55p77p99s11z'))).toBe(false);
  });
  it('国士無双', () => {
    expect(getAgariDecompositions(k('119m19p19s1234567z'))[0].form).toBe('kokushi');
  });
  it('鳴いた面子を含めて判定する', () => {
    expect(isAgari(k('456p789s234s55z'), [pon('111m')])).toBe(true);
    expect(isAgari(k('789s234s55z'), [pon('111m'), chi('456p')])).toBe(true);
  });
  it('分解が複数ある手はすべて列挙する(111222333m → 刻子3つ / 順子3つ)', () => {
    const d = getAgariDecompositions(k('111222333m456p99s'));
    expect(d.length).toBe(2);
  });
});

describe('向聴数', () => {
  it('和了形は -1', () => {
    expect(calcShanten(k('123m456p789s11122z'))).toBe(-1);
  });
  it('テンパイは 0', () => {
    expect(calcShanten(k('123m456p789s1112z'))).toBe(0);
  });
  it('1向聴', () => {
    expect(calcShanten(k('123m456p78s11z359p'))).toBe(1);
  });
  it('七対子の1向聴', () => {
    expect(calcShanten(k('1133m5577p99s123z'))).toBe(1);
  });
  it('国士無双のテンパイ', () => {
    expect(calcShanten(k('19m19p19s1234567z'))).toBe(0);
  });
  it('鳴いている手', () => {
    expect(calcShanten(k('789s5z'), 3)).toBe(0);
  });
});
