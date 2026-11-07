import { toNotation } from '../notation';
import { getWaits, getWaitTiles, isTenpai, waitShapesOf } from '../wait';
import { k, pon } from './helpers';

const waitsOf = (text: string) => toNotation(getWaitTiles(k(text)));
const shapesOf = (text: string) => waitShapesOf(getWaits(k(text))).sort();

describe('待ち判定(基本の形)', () => {
  it('両面待ち', () => {
    expect(waitsOf('23m456p789s111z55p')).toBe('14m');
    expect(shapesOf('23m456p789s111z55p')).toEqual(['ryanmen']);
  });
  it('嵌張待ち', () => {
    expect(waitsOf('13m456p789s111z55p')).toBe('2m');
    expect(shapesOf('13m456p789s111z55p')).toEqual(['kanchan']);
  });
  it('辺張待ち(12で3待ち / 89で7待ち)', () => {
    expect(waitsOf('12m456p789s111z55p')).toBe('3m');
    expect(shapesOf('12m456p789s111z55p')).toEqual(['penchan']);
    expect(waitsOf('89m456p789s111z55p')).toBe('7m');
    expect(shapesOf('89m456p789s111z55p')).toEqual(['penchan']);
  });
  it('単騎待ち', () => {
    expect(waitsOf('123m456p789s111z5z')).toBe('5z');
    expect(shapesOf('123m456p789s111z5z')).toEqual(['tanki']);
  });
  it('4556p の 5筒は単騎とも嵌張とも読める', () => {
    expect(waitsOf('123m456p789s111z5p')).toBe('5p');
    expect(shapesOf('123m456p789s111z5p')).toEqual(['kanchan', 'tanki']);
  });
  it('シャンポン待ち', () => {
    expect(waitsOf('123m456p789s22p11z')).toBe('2p1z');
    expect(shapesOf('123m456p789s22p11z')).toEqual(['shanpon']);
  });
  it('三面張', () => {
    expect(waitsOf('23456m456p789s55z')).toBe('147m');
  });
  it('七対子の単騎待ち', () => {
    expect(waitsOf('1133m557p99s1122z')).toBe('7p');
  });
  it('国士無双13面待ち', () => {
    expect(getWaitTiles(k('19m19p19s1234567z')).length).toBe(13);
  });
  it('鳴いている手の待ち', () => {
    expect(toNotation(getWaitTiles(k('456p789s234s5z'), [pon('111m')]))).toBe('5z');
  });
  it('テンパイしていない手', () => {
    expect(isTenpai(k('123m456p78s11z359p'))).toBe(false);
  });
});

describe('待ち判定(分解パターンが複数ある手)', () => {
  it('1112345678999m は 1〜9萬すべてが待ち(九面待ち)', () => {
    expect(waitsOf('1112345678999m')).toBe('123456789m');
  });
  it('1112345678999m の 1萬は、1萬が雀頭に入る形と刻子に入る形を両方示す', () => {
    const w1 = getWaits(k('1112345678999m')).find((w) => w.tile === 0)!;
    expect(w1.patterns.length).toBeGreaterThan(0);
  });
  it('12345m+3萬 は辺張(123)とも両面(345)とも解釈できる', () => {
    const w = getWaits(k('12345m678p234s55s')).find((x) => x.tile === 2)!;
    expect(new Set(w.patterns.map((p) => p.shape))).toEqual(new Set(['penchan', 'ryanmen']));
  });
  it('1112m は 2萬(単騎)と3萬(辺張)待ち', () => {
    expect(waitsOf('1112m345p678s999s')).toBe('23m');
    expect(shapesOf('1112m345p678s999s')).toEqual(['penchan', 'tanki']);
  });
  it('自分の手に4枚ある牌は待ちに数えない', () => {
    // 1112222m に 2萬が来れば和了の形だが、2萬は手の中に4枚あるので待ちではない
    expect(waitsOf('1112222m345p678s')).toBe('3m');
  });
  it('2223456m は 1・3・4・6・7萬の五面待ち', () => {
    // 1萬:123+22+456 / 3萬:222+33+456 / 4萬:22+234+456 / 6萬:222+345+66 / 7萬:22+234+567
    expect(waitsOf('2223456m789p123s')).toBe('13467m');
  });
});
