// 学習記録で使う分類と表示名
import type { CanWinCategory } from '../core/generators/canWinQuiz';
import type { WaitShape } from '../core/types';
import { WAIT_SHAPE_NAME } from '../core/wait';
import { YAKU, type YakuId } from '../core/yaku/definitions';

export const WAIT_SHAPES: WaitShape[] = ['ryanmen', 'kanchan', 'penchan', 'tanki', 'shanpon'];
export const CANWIN_CATEGORIES: CanWinCategory[] = ['noYaku', 'kataagari', 'furiten', 'ok'];

export const CANWIN_LABEL: Record<CanWinCategory, string> = {
  noYaku: '役なし(鳴き・門前ロン)',
  kataagari: '片和了',
  furiten: 'フリテン',
  ok: '鳴いても役がある',
};

/** 記録のキー(wait:ryanmen など)を表示名にする */
export function labelOf(key: string): string {
  const [prefix, id] = key.split(':');
  if (prefix === 'wait') {
    const n = WAIT_SHAPE_NAME[id as WaitShape];
    return n ? `${n.name}待ち` : id;
  }
  if (prefix === 'yaku') return YAKU[id as YakuId]?.name ?? id;
  if (prefix === 'canwin') return CANWIN_LABEL[id as CanWinCategory] ?? id;
  return key;
}

export const QUIZ_LABEL = { wait: '待ち当てクイズ', yaku: '役クイズ', canwin: '和了れる?クイズ' } as const;
