// 待ち当てクイズの問題を自動で作る
// ランダムな和了形から1枚抜いて13枚にし、待ち判定ロジックで待ちを計算して、
// レベルの条件に合うものだけを問題にする。
import { pick, shuffle, type Rng } from '../random';
import { suitOf, type TileKind } from '../tile';
import type { WaitInfo, WaitShape } from '../types';
import { getWaits, waitShapesOf } from '../wait';
import { buildAgariHand, type BuildOptions } from './handBuilder';

export type WaitLevel = 1 | 2 | 3;

export interface WaitQuestion {
  level: WaitLevel;
  /** 13枚の手牌(種類順) */
  hand: TileKind[];
  waits: WaitInfo[];
  shapes: WaitShape[];
}

export const WAIT_LEVEL_INFO: Record<WaitLevel, { title: string; description: string }> = {
  1: { title: 'Lv1 基本の形', description: '両面・嵌張・辺張・単騎・シャンポンのどれか1つの形' },
  2: { title: 'Lv2 複合の形', description: '待ちが2〜3種類。三面張や、いくつかの形の組み合わせ' },
  3: { title: 'Lv3 多面待ち', description: '1種類の牌に偏った手の、待ちが多い形' },
};

/** その手がレベルの条件に合うか */
export function matchesLevel(level: WaitLevel, hand: TileKind[], waits: WaitInfo[]): boolean {
  if (waits.length === 0) return false;
  const standardOnly = waits.every((w) => w.patterns.every((p) => p.decomposition.form === 'standard'));
  if (!standardOnly) return false;
  const shapes = waitShapesOf(waits);
  const isBasic = shapes.length === 1 && waits.length <= 2;
  switch (level) {
    case 1:
      return isBasic;
    case 2:
      return !isBasic && waits.length >= 2 && waits.length <= 3;
    case 3: {
      const oneSuit = new Set(hand.map(suitOf)).size === 1;
      return oneSuit && waits.length >= 3 && (waits.length >= 4 || shapes.length >= 2);
    }
  }
}

function optionsFor(level: WaitLevel, rng: Rng): BuildOptions {
  const all: BuildOptions['suits'] = ['m', 'p', 's'];
  switch (level) {
    case 1:
      return { suits: all, honors: true, koutsuRate: 0.25 };
    case 2:
      return { suits: all, honors: true, koutsuRate: 0.25, mainSuit: pick(rng, all), mainRate: 0.6 };
    case 3: {
      const s = pick(rng, all);
      return { suits: [s], honors: false, koutsuRate: 0.3 };
    }
  }
}

export interface WaitQuizOptions {
  /** 優先して出したい待ちの形(苦手な形)。合う問題が見つかりにくい時は無視する */
  preferShapes?: WaitShape[];
}

export function generateWaitQuestion(rng: Rng, level: WaitLevel, opts: WaitQuizOptions = {}): WaitQuestion {
  let fallback: WaitQuestion | null = null;
  for (let attempt = 0; attempt < 3000; attempt++) {
    const agari = buildAgariHand(rng, optionsFor(level, rng));
    const removable = shuffle(rng, [...new Set(agari)]);
    for (const r of removable) {
      const hand = [...agari];
      hand.splice(hand.indexOf(r), 1);
      const waits = getWaits(hand);
      if (!matchesLevel(level, hand, waits)) continue;
      const q: WaitQuestion = { level, hand, waits, shapes: waitShapesOf(waits) };
      if (!opts.preferShapes?.length || q.shapes.some((s) => opts.preferShapes!.includes(s))) return q;
      fallback ??= q;
    }
    // 苦手な形の問題がなかなか見つからない時は、条件に合う別の問題で代わりにする
    if (fallback && attempt > 40) return fallback;
  }
  if (fallback) return fallback;
  throw new Error('問題を作れませんでした');
}
