import { parseKind, parseKinds } from '../notation';
import type { Meld, WinContext } from '../types';
import type { Wind } from '../tile';

export const k = parseKinds;
export const k1 = parseKind;

export function pon(text: string): Meld {
  return { type: 'pon', tiles: parseKinds(text) };
}
export function chi(text: string): Meld {
  return { type: 'chi', tiles: parseKinds(text) };
}

export function ctx(
  concealed: string,
  win: string,
  opts: Partial<Omit<WinContext, 'concealed' | 'winTile' | 'discards'>> & { discards?: string } = {},
): WinContext {
  return {
    concealed: parseKinds(concealed),
    winTile: parseKind(win),
    melds: opts.melds ?? [],
    isTsumo: opts.isTsumo ?? false,
    isRiichi: opts.isRiichi ?? false,
    roundWind: (opts.roundWind ?? 'east') as Wind,
    seatWind: (opts.seatWind ?? 'south') as Wind,
    discards: opts.discards ? parseKinds(opts.discards) : [],
  };
}
