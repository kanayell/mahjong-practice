import { doraFromIndicator, generateYakuQuestion, yakuOptions, type YakuStage } from '../generators/yakuQuiz';
import { createRng } from '../random';
import { toCounts } from '../tile';
import { judgeYaku } from '../yaku/judge';
import { k1 } from './helpers';

describe('役クイズの問題生成', () => {
  for (const stage of [1, 2, 3] as YakuStage[]) {
    it(`第${stage}段階:正しい和了形で、役はすべて選択肢の中にあり、狙いの役を含む`, () => {
      const options = new Set(yakuOptions(stage));
      for (let seed = 1; seed <= 60; seed++) {
        const q = generateYakuQuestion(createRng(seed * 31 + stage), stage);
        const { ctx } = q;
        const all = [...ctx.concealed, ctx.winTile, ...ctx.melds.flatMap((m) => m.tiles)];
        expect(all.length).toBe(14);
        expect(ctx.concealed.length).toBe(13 - ctx.melds.length * 3);
        expect(Math.max(...toCounts(all))).toBeLessThanOrEqual(4);
        const j = judgeYaku(ctx);
        expect(j.han).toBeGreaterThan(0);
        expect(j.yaku.every((y) => options.has(y.id))).toBe(true);
        expect(j.yaku.map((y) => y.id)).toContain(q.target);
        if (ctx.isRiichi) expect(ctx.melds.length).toBe(0);
      }
    });
  }

  it('第2段階では第2段階の役がよく出る', () => {
    let hit = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const q = generateYakuQuestion(createRng(seed), 2);
      if (['iipeikou', 'chiitoitsu', 'honitsu', 'toitoi', 'sanshoku', 'ittsu'].includes(q.target)) hit++;
    }
    expect(hit).toBeGreaterThan(25);
  });

  it('苦手な役を優先して出せる', () => {
    let hit = 0;
    for (let seed = 1; seed <= 20; seed++) {
      if (generateYakuQuestion(createRng(seed), 1, { preferYaku: ['pinfu'] }).target === 'pinfu') hit++;
    }
    expect(hit).toBeGreaterThan(8);
  });

  it('ドラ表示牌の次の牌がドラ(9の次は1、北の次は東、中の次は白)', () => {
    expect(doraFromIndicator(k1('3m'))).toBe(k1('4m'));
    expect(doraFromIndicator(k1('9p'))).toBe(k1('1p'));
    expect(doraFromIndicator(k1('4z'))).toBe(k1('1z'));
    expect(doraFromIndicator(k1('7z'))).toBe(k1('5z'));
  });
});
