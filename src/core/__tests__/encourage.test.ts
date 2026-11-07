import { todayMessage } from '../../content/encourage';

describe('今日の練習のコメント', () => {
  it('問題数に応じて段階的に変わる', () => {
    const titles = [0, 1, 5, 10, 20, 50].map((n) => todayMessage(n, 0, 0).title);
    expect(new Set(titles).size).toBe(6);
  });

  it('次の区切りまでの問題数を示す', () => {
    expect(todayMessage(2, 1, 0).text).toContain('あと3問');
    expect(todayMessage(7, 3, 0).text).toContain('あと3問');
  });

  it('正解率が高い時はほめる', () => {
    expect(todayMessage(10, 9, 0).text).toContain('正解率90%');
  });

  it('正解率が低くても、責める言葉は出さない', () => {
    for (const n of [1, 3, 5, 9, 12, 30, 60]) {
      const m = todayMessage(n, 0, 0);
      expect(m.title + m.text).not.toMatch(/低い|ダメ|悪い|残念|もっと正解/);
    }
  });

  it('今日まだでも、連続記録があれば続けるよう声をかける', () => {
    expect(todayMessage(0, 0, 4).title).toContain('4日連続');
  });
});
