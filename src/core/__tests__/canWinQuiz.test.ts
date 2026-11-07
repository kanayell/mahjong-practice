import { judgeWin } from '../canWin';
import { ALL_SCENARIOS, generateCanWinQuestion, pickScenario, SCENARIO_INFO } from '../generators/canWinQuiz';
import { createRng } from '../random';
import { toCounts } from '../tile';

describe('和了れる?クイズの問題生成', () => {
  for (const s of ALL_SCENARIOS) {
    it(`${s}:正解(和了れる/れない)が場面の意図と一致する`, () => {
      for (let seed = 1; seed <= 15; seed++) {
        const q = generateCanWinQuestion(createRng(seed * 101), s);
        const r = judgeWin(q.ctx);
        expect(r.canWin).toBe(SCENARIO_INFO[s].canWin);
        expect(r.judgement.isAgari).toBe(true);
        const all = [...q.ctx.concealed, q.ctx.winTile, ...q.ctx.melds.flatMap((m) => m.tiles), ...q.ctx.discards];
        expect(Math.max(...toCounts(all))).toBeLessThanOrEqual(4);
        if (!SCENARIO_INFO[s].canWin) expect(r.explanations.length).toBeGreaterThan(0);
      }
    });
  }

  it('フリテンの問題では、捨て牌に待ち牌がある', () => {
    const q = generateCanWinQuestion(createRng(5), 'furiten');
    expect(q.ctx.discards.some((d) => q.result.waitTiles.includes(d))).toBe(true);
  });

  it('フリテン以外の問題では、捨て牌に待ち牌がない', () => {
    for (const s of ['openNoYaku', 'kataagari', 'openOk', 'menzenNoYakuRon'] as const) {
      const q = generateCanWinQuestion(createRng(9), s);
      expect(q.ctx.discards.some((d) => q.result.waitTiles.includes(d))).toBe(false);
    }
  });

  it('和了れる/和了れないが偏らない', () => {
    const rng = createRng(1);
    let ng = 0;
    for (let i = 0; i < 200; i++) if (!SCENARIO_INFO[pickScenario(rng)].canWin) ng++;
    expect(ng).toBeGreaterThan(70);
    expect(ng).toBeLessThan(150);
  });
});
