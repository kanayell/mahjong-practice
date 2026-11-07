// 表示の設定(牌のデザイン)。このブラウザの中だけに保存する
import { useSyncExternalStore } from 'react';

export interface TileSettings {
  /** real = 実物に近いデザイン、simple = 漢字+色の見やすさ重視デザイン */
  face: 'real' | 'simple';
}

const KEY = 'mj.tileSettings';
const DEFAULT: TileSettings = { face: 'real' };

function read(): TileSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && (v.face === 'real' || v.face === 'simple')) return { face: v.face };
  } catch {
    /* 読めなければ初期値 */
  }
  return DEFAULT;
}

let current: TileSettings = typeof window === 'undefined' ? DEFAULT : read();
const listeners = new Set<() => void>();

export function setTileSettings(next: Partial<TileSettings>) {
  current = { ...current, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* 保存できなくても、この画面では反映する */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTileSettings(): TileSettings {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT);
}
