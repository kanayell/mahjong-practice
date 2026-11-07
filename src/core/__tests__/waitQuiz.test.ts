import { generateWaitQuestion, matchesLevel, type WaitLevel } from '../generators/waitQuiz';
import { createRng } from '../random';
import { toCounts } from '../tile';
import { getWaits } from '../wait';

describe('待ち当てクイズの問題生成', () => {
  for (const level of [1, 2, 3] as WaitLevel[]) {
    it(`Lv${level}:13枚・同じ牌4枚以内・テンパイ・レベル条件を満たす`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const q = generateWaitQuestion(createRng(seed * 7919 + level), level);
        expect(q.hand.length).toBe(13);
        expect(Math.max(...toCounts(q.hand))).toBeLessThanOrEqual(4);
        expect(q.waits.length).toBeGreaterThan(0);
        // 生成時の待ちと、改めて計算した待ちが一致する
        expect(getWaits(q.hand).map((w) => w.tile)).toEqual(q.waits.map((w) => w.tile));
        expect(matchesLevel(level, q.hand, q.waits)).toBe(true);
      }
    });
  }

  it('同じシードなら同じ問題になる', () => {
    const a = generateWaitQuestion(createRng(42), 2);
    const b = generateWaitQuestion(createRng(42), 2);
    expect(a.hand).toEqual(b.hand);
  });

  it('苦手な形を優先して出せる', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const q = generateWaitQuestion(createRng(seed), 1, { preferShapes: ['penchan'] });
      expect(q.shapes).toContain('penchan');
    }
  });
});
