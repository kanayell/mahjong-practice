// 苦手なものを優先して出題するための重み付け
import type { Rng } from '../core/random';
import type { StatItem } from './storage';

/**
 * 間違える割合の見込み(0〜1)。
 * 出題数が少ないうちは極端にならないよう、「1問正解・1問不正解」を最初から足して計算する。
 * まだ出題していないものは 0.5。
 */
export function errorRate(it: StatItem | undefined): number {
  if (!it) return 0.5;
  return (it.total - it.correct + 1) / (it.total + 2);
}

/** 出題の重み。苦手なほど大きいが、得意なものもたまに出る */
export function weightOf(it: StatItem | undefined): number {
  return 0.25 + errorRate(it) * 2;
}

/** 重みに従って1つ選ぶ */
export function pickWeak<T extends string>(rng: Rng, candidates: readonly T[], items: Record<string, StatItem>, prefix: string): T {
  const weights = candidates.map((c) => weightOf(items[`${prefix}:${c}`]));
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export interface WeakEntry {
  key: string;
  id: string;
  correct: number;
  total: number;
  rate: number;
}

/** 正答率の低い順(出題数が minTotal 以上のものだけ) */
export function weakList(items: Record<string, StatItem>, prefix: string, minTotal = 3): WeakEntry[] {
  return Object.entries(items)
    .filter(([k, v]) => k.startsWith(`${prefix}:`) && v.total >= minTotal)
    .map(([k, v]) => ({ key: k, id: k.slice(prefix.length + 1), correct: v.correct, total: v.total, rate: v.correct / v.total }))
    .sort((a, b) => a.rate - b.rate || b.total - a.total);
}
