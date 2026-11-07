import { createRng } from '../random';
import { addResult, emptyStats, loadStats, recordResult, resetStats, saveStats, STATS_KEY, streakDays, type KeyValueStore } from '../../stats/storage';
import { errorRate, pickWeak, weakList } from '../../stats/weighting';

function memStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('学習記録', () => {
  it('記録が保存され、読み込める', () => {
    const s = memStore();
    recordResult('wait', true, [{ key: 'wait:ryanmen', correct: true }], s);
    recordResult('wait', false, [{ key: 'wait:ryanmen', correct: false }, { key: 'wait:kanchan', correct: false }], s);
    const d = loadStats(s);
    expect(d.items['wait:ryanmen']).toMatchObject({ correct: 1, total: 2 });
    expect(d.items['wait:kanchan']).toMatchObject({ correct: 0, total: 1 });
    expect(d.quizzes.wait).toEqual({ correct: 1, total: 2 });
  });

  it('日ごとの回答数を数える', () => {
    const day1 = new Date(2026, 10, 7, 9).getTime();
    const day2 = new Date(2026, 10, 8, 9).getTime();
    let d = addResult(emptyStats(), 'yaku', true, [], day1);
    d = addResult(d, 'yaku', false, [], day2);
    d = addResult(d, 'canwin', true, [], day2);
    expect(d.days['2026-11-07']).toEqual({ correct: 1, total: 1 });
    expect(d.days['2026-11-08']).toEqual({ correct: 1, total: 2 });
  });

  it('連続練習日数を数える(今日まだでも昨日まで続いていれば途切れない)', () => {
    const at = (d: number) => new Date(2026, 10, d, 12).getTime();
    let d = emptyStats();
    for (const day of [3, 5, 6, 7]) d = addResult(d, 'wait', true, [], at(day));
    expect(streakDays(d.days, at(7))).toBe(3);
    expect(streakDays(d.days, at(8))).toBe(3);
    expect(streakDays(d.days, at(9))).toBe(0);
    expect(streakDays(emptyStats().days, at(7))).toBe(0);
  });

  it('壊れたデータや古い形式は無視して、空の記録から始める', () => {
    const s = memStore();
    s.setItem(STATS_KEY, '{broken');
    expect(loadStats(s).quizzes.wait.total).toBe(0);
    s.setItem(STATS_KEY, JSON.stringify({ v: 999 }));
    expect(loadStats(s).items).toEqual({});
  });

  it('リセットしても「苦手優先」の設定は残る', () => {
    const s = memStore();
    saveStats({ ...emptyStats(), preferWeak: false }, s);
    recordResult('wait', true, [], s);
    const d = resetStats(s);
    expect(d.quizzes.wait.total).toBe(0);
    expect(d.preferWeak).toBe(false);
  });
});

describe('苦手優先の重み付け', () => {
  it('間違いが多いほど errorRate が高い(出題数が少ない時は控えめ)', () => {
    expect(errorRate(undefined)).toBe(0.5);
    expect(errorRate({ correct: 0, total: 1, last: 0 })).toBeCloseTo(2 / 3);
    expect(errorRate({ correct: 0, total: 10, last: 0 })).toBeGreaterThan(errorRate({ correct: 0, total: 1, last: 0 }));
    expect(errorRate({ correct: 10, total: 10, last: 0 })).toBeLessThan(0.1);
  });

  it('苦手なものが選ばれやすいが、得意なものも出る', () => {
    const items = {
      'yaku:pinfu': { correct: 1, total: 10, last: 0 },
      'yaku:tanyao': { correct: 10, total: 10, last: 0 },
    };
    const rng = createRng(1);
    const count = { pinfu: 0, tanyao: 0 };
    for (let i = 0; i < 1000; i++) count[pickWeak(rng, ['pinfu', 'tanyao'] as const, items, 'yaku')]++;
    expect(count.pinfu).toBeGreaterThan(count.tanyao * 3);
    expect(count.tanyao).toBeGreaterThan(0);
  });

  it('苦手リストは正答率の低い順', () => {
    const items = {
      'wait:ryanmen': { correct: 5, total: 5, last: 0 },
      'wait:kanchan': { correct: 1, total: 4, last: 0 },
      'wait:tanki': { correct: 2, total: 4, last: 0 },
      'wait:penchan': { correct: 0, total: 1, last: 0 },
      'yaku:pinfu': { correct: 0, total: 9, last: 0 },
    };
    expect(weakList(items, 'wait').map((x) => x.id)).toEqual(['kanchan', 'tanki', 'ryanmen']);
  });
});
