// 学習記録の保存(ブラウザの localStorage。ログイン不要)
// 記録の単位(キー)の例:
//   wait:ryanmen   … 待ち当てクイズの「両面」を含む問題
//   yaku:pinfu     … 役クイズで「平和」の有無を正しく判断できたか
//   canwin:furiten … 和了れる?クイズの「フリテン」の問題

export type QuizKind = 'wait' | 'yaku' | 'canwin';

export interface StatItem {
  correct: number;
  total: number;
  /** 最後に出題した時刻(ミリ秒) */
  last: number;
}

export interface StatsData {
  v: 1;
  items: Record<string, StatItem>;
  /** クイズごとの合計 */
  quizzes: Record<QuizKind, { correct: number; total: number }>;
  /** 日ごとの回答数(YYYY-MM-DD) */
  days: Record<string, { correct: number; total: number }>;
  /** 苦手なものを優先して出題するか */
  preferWeak: boolean;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STATS_KEY = 'mj.stats.v1';

export function emptyStats(): StatsData {
  return {
    v: 1,
    items: {},
    quizzes: { wait: { correct: 0, total: 0 }, yaku: { correct: 0, total: 0 }, canwin: { correct: 0, total: 0 } },
    days: {},
    preferWeak: true,
  };
}

const memory = new Map<string, string>();
const memoryStore: KeyValueStore = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};

/** localStorage が使えない環境(プライベートモードなど)では、メモリに保存する */
export function defaultStore(): KeyValueStore {
  try {
    const ls = globalThis.localStorage;
    const probe = '__mj_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStore;
  }
}

export function loadStats(store: KeyValueStore = defaultStore()): StatsData {
  try {
    const raw = store.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    const d = JSON.parse(raw) as Partial<StatsData>;
    if (d.v !== 1) return emptyStats();
    const base = emptyStats();
    return {
      ...base,
      ...d,
      items: d.items ?? {},
      quizzes: { ...base.quizzes, ...(d.quizzes ?? {}) },
      days: d.days ?? {},
      preferWeak: d.preferWeak ?? true,
    };
  } catch {
    return emptyStats();
  }
}

export function saveStats(d: StatsData, store: KeyValueStore = defaultStore()): void {
  try {
    store.setItem(STATS_KEY, JSON.stringify(d));
  } catch {
    /* 容量オーバーなどで保存できなくても、アプリは動かす */
  }
}

export function dayKey(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface Detail {
  key: string;
  correct: boolean;
}

/** 1問分の結果を記録した新しいデータを返す(元のデータは変えない) */
export function addResult(d: StatsData, quiz: QuizKind, correct: boolean, details: Detail[], now = Date.now()): StatsData {
  const items = { ...d.items };
  for (const x of details) {
    const it = items[x.key] ?? { correct: 0, total: 0, last: 0 };
    items[x.key] = { correct: it.correct + (x.correct ? 1 : 0), total: it.total + 1, last: now };
  }
  const q = d.quizzes[quiz];
  const day = dayKey(now);
  const dd = d.days[day] ?? { correct: 0, total: 0 };
  return {
    ...d,
    items,
    quizzes: { ...d.quizzes, [quiz]: { correct: q.correct + (correct ? 1 : 0), total: q.total + 1 } },
    days: { ...d.days, [day]: { correct: dd.correct + (correct ? 1 : 0), total: dd.total + 1 } },
  };
}

/** 読み込み→記録→保存 をまとめて行う */
export function recordResult(quiz: QuizKind, correct: boolean, details: Detail[], store: KeyValueStore = defaultStore()): StatsData {
  const next = addResult(loadStats(store), quiz, correct, details);
  saveStats(next, store);
  return next;
}

export function setPreferWeak(v: boolean, store: KeyValueStore = defaultStore()): StatsData {
  const next = { ...loadStats(store), preferWeak: v };
  saveStats(next, store);
  return next;
}

export function resetStats(store: KeyValueStore = defaultStore()): StatsData {
  const keep = loadStats(store).preferWeak;
  const next = { ...emptyStats(), preferWeak: keep };
  saveStats(next, store);
  return next;
}
