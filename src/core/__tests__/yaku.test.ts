import { judgeYaku } from '../yaku/judge';
import type { YakuId } from '../yaku/definitions';
import type { WinContext } from '../types';
import { chi, ctx, pon } from './helpers';

const ids = (c: WinContext, kuitan = true) =>
  judgeYaku(c, { kuitan })
    .yaku.map((y) => y.id)
    .sort();
const han = (c: WinContext) => judgeYaku(c).han;
const sorted = (xs: YakuId[]) => [...xs].sort();

describe('平和(ピンフ)の判定境界', () => {
  it('両面待ち・全部順子・雀頭が役牌でない・門前 → 平和', () => {
    expect(ids(ctx('23m456789p234s55s', '1m'))).toEqual(['pinfu']);
  });
  it('嵌張待ちは平和にならない', () => {
    expect(ids(ctx('13m456789p234s55s', '2m'))).toEqual([]);
  });
  it('辺張待ちは平和にならない', () => {
    expect(ids(ctx('12m456789p234s55s', '3m'))).toEqual([]);
  });
  it('単騎待ちは平和にならない', () => {
    expect(ids(ctx('123m456789p234s5s', '5s'))).toEqual([]);
  });
  it('雀頭が三元牌だと平和にならない', () => {
    expect(ids(ctx('23m456789p234s77z', '1m'))).toEqual([]);
  });
  it('雀頭が自風だと平和にならない(南家で南が雀頭)', () => {
    expect(ids(ctx('23m456789p234s22z', '1m', { seatWind: 'south' }))).toEqual([]);
  });
  it('雀頭が場風でも自風でもない風牌なら平和(東場・南家で北が雀頭)', () => {
    expect(ids(ctx('23m456789p234s44z', '1m', { roundWind: 'east', seatWind: 'south' }))).toEqual(['pinfu']);
  });
  it('刻子があると平和にならない', () => {
    expect(ids(ctx('23m456p999p234s55s', '1m'))).toEqual([]);
  });
  it('鳴いていると平和にならない', () => {
    expect(ids(ctx('23m456p234s55s', '1m', { melds: [chi('789p')] }))).toEqual([]);
  });
  it('辺張とも両面とも取れる場合は両面と解釈して平和(12345m で 3萬)', () => {
    expect(ids(ctx('12345m678p234s55s', '3m'))).toEqual(['pinfu']);
  });
  it('ツモでも平和はつく(門前清自摸和と複合)', () => {
    expect(ids(ctx('23m456789p234s55s', '1m', { isTsumo: true }))).toEqual(['menzenTsumo', 'pinfu']);
  });
});

describe('一盃口(イーペーコー)・七対子(チートイツ)の判定境界', () => {
  it('同じ順子2つ → 一盃口', () => {
    expect(ids(ctx('112233m456p789s5s', '5s'))).toEqual(['iipeikou']);
  });
  it('鳴くと一盃口は消える', () => {
    expect(ids(ctx('112233m456p5s', '5s', { melds: [chi('789s')] }))).toEqual([]);
  });
  it('一盃口+平和', () => {
    expect(ids(ctx('112233m456p78s99s', '6s'))).toEqual(['iipeikou', 'pinfu']);
  });
  it('七対子は2翻', () => {
    const r = judgeYaku(ctx('1133m557p99s1122z', '7p'));
    expect(r.yaku.map((y) => y.id)).toEqual(['chiitoitsu']);
    expect(r.han).toBe(2);
  });
  it('七対子+断么九', () => {
    expect(ids(ctx('2244m5577p6688s3s', '3s'))).toEqual(['chiitoitsu', 'tanyao']);
  });
  it('二盃口の形は七対子ではなく二盃口(3翻)として数える', () => {
    const r = judgeYaku(ctx('112233m445566p7s', '7s'));
    expect(r.yaku.map((y) => y.id)).toEqual(['ryanpeikou']);
    expect(r.han).toBe(3);
  });
  it('同じ牌4枚では七対子にならない', () => {
    expect(judgeYaku(ctx('1111m33m55p77p99s1z', '1z')).isAgari).toBe(false);
  });
});

describe('鳴いた手の役', () => {
  it('ポンして役牌もタンヤオもない → 役なし', () => {
    expect(ids(ctx('345m678p234s9s', '9s', { melds: [pon('222s')] }))).toEqual([]);
  });
  it('喰いタン(鳴いた断么九)あり', () => {
    expect(ids(ctx('345m678p234s5s', '5s', { melds: [pon('222s')] }))).toEqual(['tanyao']);
  });
  it('喰いタンなしのルールでは鳴いた断么九は不成立', () => {
    expect(ids(ctx('345m678p234s5s', '5s', { melds: [pon('222s')] }), false)).toEqual([]);
  });
  it('役牌をポンしていれば役あり', () => {
    expect(ids(ctx('345m678p234s9s', '9s', { melds: [pon('777z')] }))).toEqual(['yakuhaiChun']);
  });
  it('鳴いているとリーチ・門前清自摸和はつかない', () => {
    expect(ids(ctx('345m678p234s9s', '9s', { melds: [pon('222s')], isTsumo: true, isRiichi: true }))).toEqual([]);
  });
  it('鳴いた混一色は2翻(喰い下がり)', () => {
    const r = judgeYaku(ctx('123m456m99m11z', '1z', { melds: [chi('345m')], roundWind: 'south', seatWind: 'west' }));
    expect(r.yaku.map((y) => y.id)).toEqual(['honitsu']);
    expect(r.han).toBe(2);
  });
});

describe('その他の役', () => {
  it('リーチ', () => {
    expect(ids(ctx('13m456789p234s99s', '2m', { isRiichi: true }))).toEqual(['riichi']);
  });
  it('連風牌(ダブ東):東場の東家で東の刻子は2翻', () => {
    const r = judgeYaku(ctx('234m567p345s8s', '8s', { melds: [pon('111z')], roundWind: 'east', seatWind: 'east' }));
    expect(sorted(r.yaku.map((y) => y.id))).toEqual(['roundWind', 'seatWind']);
    expect(r.han).toBe(2);
  });
  it('対々和+断么九(シャンポン待ちロン)', () => {
    expect(ids(ctx('444p666s88m33s', '3s', { melds: [pon('222m')] }))).toEqual(['tanyao', 'toitoi']);
  });
  it('三暗刻(順子側で和了)', () => {
    expect(ids(ctx('111m222p333s45m99s', '3m'))).toEqual(['sanankou']);
  });
  it('シャンポン待ちをロンで和了ると、その刻子は暗刻にならない', () => {
    expect(ids(ctx('111m222p33s99s456m', '3s'))).toEqual([]);
    expect(ids(ctx('111m222p33s99s456m', '3s', { isTsumo: true }))).toEqual(['menzenTsumo', 'sanankou']);
  });
  it('混一色+一気通貫+場風', () => {
    const r = judgeYaku(ctx('123456789m1122z', '1z', { roundWind: 'east', seatWind: 'south' }));
    expect(sorted(r.yaku.map((y) => y.id))).toEqual(['honitsu', 'ittsu', 'roundWind']);
    expect(r.han).toBe(6);
  });
  it('一気通貫+平和', () => {
    expect(ids(ctx('123456789m45p11s', '3p'))).toEqual(['ittsu', 'pinfu']);
  });
  it('三色同順', () => {
    expect(ids(ctx('123m123p123s456s9m', '9m'))).toEqual(['sanshoku']);
  });
  it('チャンタ', () => {
    expect(ids(ctx('123m789p333z99s78s', '9s', { roundWind: 'east', seatWind: 'south' }))).toEqual(['chanta']);
  });
  it('小三元(+役牌2つ)', () => {
    const r = judgeYaku(ctx('555z666z77z123m45p', '3p'));
    expect(sorted(r.yaku.map((y) => y.id))).toEqual(['shousangen', 'yakuhaiHaku', 'yakuhaiHatsu']);
    expect(r.han).toBe(4);
  });
  it('清一色', () => {
    expect(ids(ctx('234m456m678m88m99m', '8m'))).toEqual(['chinitsu']);
  });
  it('九蓮宝燈は役満', () => {
    const r = judgeYaku(ctx('1112345678999m', '5m'));
    expect(r.yakuman).toBe(true);
    expect(r.yaku.map((y) => y.id)).toEqual(['chuuren']);
  });
  it('国士無双は役満', () => {
    expect(ids(ctx('19m19p19s1234567z', '1m'))).toEqual(['kokushi']);
  });
  it('ドラは役ではない(赤5を含んでも役は増えない)', () => {
    expect(han(ctx('13m406789p234s99s', '2m'))).toBe(0);
  });
  it('和了の形でなければ isAgari=false', () => {
    expect(judgeYaku(ctx('13m456789p234s99s', '4m')).isAgari).toBe(false);
  });
});
