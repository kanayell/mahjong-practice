// 「その手、和了れる?」クイズの問題を自動で作る
// 実戦で恥をかきやすい場面(鳴いて役なし・片和了・フリテン・門前で役なしのロン)と、
// まぎらわしいけれど和了れる場面(フリテンでもツモ・役なしでもメンゼンツモ・片和了の役がある側)を出題する。
import { getAgariDecompositions } from '../agari';
import { judgeWin, type WinJudgement } from '../canWin';
import { pick, randInt, shuffle, type Rng } from '../random';
import { toCounts, type TileKind, type Wind } from '../tile';
import { DEFAULT_RULES, type Meld, type Rules, type WinContext } from '../types';
import { buildAgariHand } from './handBuilder';

export type CanWinScenario =
  | 'openNoYaku' // 鳴いて役なし → ×
  | 'kataagari' // 片和了で役のない牌 → ×
  | 'furiten' // フリテンでロン → ×
  | 'menzenNoYakuRon' // 門前・リーチなし・役なしでロン → ×
  | 'openOk' // 鳴いているが役がある → ○
  | 'kataagariOk' // 片和了だが役のある方の牌 → ○
  | 'furitenTsumo' // フリテンでもツモなら → ○
  | 'menzenTsumoOk'; // 役なしでも門前ツモ → ○

/** 学習記録で使う分類 */
export type CanWinCategory = 'noYaku' | 'kataagari' | 'furiten' | 'ok';

export const SCENARIO_INFO: Record<CanWinScenario, { canWin: boolean; category: CanWinCategory; point: string }> = {
  openNoYaku: {
    canWin: false,
    category: 'noYaku',
    point: '鳴く前に「鳴いても成立する役」(役牌の刻子・タンヤオ・混一色など)があるかを必ず確認しましょう。',
  },
  kataagari: {
    canWin: false,
    category: 'kataagari',
    point: '待ちが2種類以上ある時は、それぞれの牌で和了った時に役があるかを確かめましょう。',
  },
  furiten: {
    canWin: false,
    category: 'furiten',
    point: 'テンパイしたら、自分の捨て牌に待ち牌がないかを確認しましょう。1つでもあればロンできません。',
  },
  menzenNoYakuRon: {
    canWin: false,
    category: 'noYaku',
    point: '鳴いていない手で役がない時は、リーチをかけておけば安心です(ツモならメンゼンツモで和了れます)。',
  },
  openOk: {
    canWin: true,
    category: 'ok',
    point: '鳴いていても、役牌やタンヤオなど鳴いてOKの役があれば和了れます。',
  },
  kataagariOk: {
    canWin: true,
    category: 'kataagari',
    point: '片和了の手でも、役がある方の牌なら和了れます。',
  },
  furitenTsumo: {
    canWin: true,
    category: 'furiten',
    point: 'フリテンで禁止されるのはロンだけです。自分で引いたツモなら和了れます。',
  },
  menzenTsumoOk: {
    canWin: true,
    category: 'noYaku',
    point: '鳴いていない手は、ツモで和了れば「門前清自摸和(メンゼンツモ)」という役がつきます。',
  },
};

export const ALL_SCENARIOS = Object.keys(SCENARIO_INFO) as CanWinScenario[];

export interface CanWinQuestion {
  scenario: CanWinScenario;
  ctx: WinContext;
  result: WinJudgement;
}

const OPEN_SCENARIOS = new Set<CanWinScenario>(['openNoYaku', 'kataagari', 'openOk', 'kataagariOk']);

function matches(s: CanWinScenario, ctx: WinContext, r: WinJudgement): boolean {
  const open = ctx.melds.length > 0;
  const reasons = r.reasons.join(',');
  switch (s) {
    case 'openNoYaku':
      return open && reasons === 'noYaku';
    case 'kataagari':
      return open && reasons === 'noYaku,kataagari';
    case 'furiten':
      return reasons === 'furiten' && !ctx.isTsumo;
    case 'menzenNoYakuRon':
      return !open && !ctx.isRiichi && !ctx.isTsumo && reasons === 'noYaku';
    case 'openOk':
      return open && r.canWin && r.yakuTiles.length === r.waitTiles.length;
    case 'kataagariOk':
      return open && r.canWin && r.yakuTiles.length < r.waitTiles.length;
    case 'furitenTsumo':
      return r.canWin && ctx.isTsumo && ctx.discards.some((d) => r.waitTiles.includes(d));
    case 'menzenTsumoOk':
      return !open && !ctx.isRiichi && r.canWin && ctx.isTsumo && r.judgement.yaku.length === 1 && r.judgement.yaku[0].id === 'menzenTsumo';
  }
}

/** 自分の捨て牌を作る。furiten=true なら待ち牌を1枚混ぜる */
function makeDiscards(rng: Rng, handAll: TileKind[], waits: TileKind[], winTile: TileKind, furiten: boolean): TileKind[] {
  const used = toCounts(handAll);
  const out: TileKind[] = [];
  const n = 6 + randInt(rng, 6);
  for (let tries = 0; out.length < n && tries < 200; tries++) {
    const k = randInt(rng, 34);
    if (waits.includes(k) || used[k] >= 4) continue;
    used[k]++;
    out.push(k);
  }
  if (furiten) {
    const others = waits.filter((w) => w !== winTile && used[w] < 4);
    const f = others.length ? pick(rng, others) : winTile;
    out.splice(randInt(rng, out.length + 1), 0, f);
  }
  return out;
}

export function generateCanWinQuestion(rng: Rng, scenario: CanWinScenario, rules: Rules = DEFAULT_RULES): CanWinQuestion {
  for (let attempt = 0; attempt < 20000; attempt++) {
    const agari = buildAgariHand(rng, { suits: ['m', 'p', 's'], honors: true, koutsuRate: OPEN_SCENARIOS.has(scenario) ? 0.35 : 0.25 });
    const d = getAgariDecompositions(agari).find((x) => x.form === 'standard');
    if (!d) continue;

    // 鳴く面子を決める
    const melds: Meld[] = [];
    const rest = [...agari];
    if (OPEN_SCENARIOS.has(scenario)) {
      const n = 1 + randInt(rng, 2);
      for (const b of shuffle(rng, d.blocks).slice(0, n)) {
        const tiles = b.type === 'shuntsu' ? [b.first, b.first + 1, b.first + 2] : [b.tile, b.tile, b.tile];
        for (const k of tiles) rest.splice(rest.indexOf(k), 1);
        melds.push({ type: b.type === 'shuntsu' ? 'chi' : 'pon', tiles, calledTile: pick(rng, tiles) });
      }
    }

    const winTile = pick(rng, rest);
    rest.splice(rest.indexOf(winTile), 1);
    rest.sort((a, b) => a - b);

    const isTsumo = scenario === 'furitenTsumo' || scenario === 'menzenTsumoOk' ? true : scenario === 'furiten' || scenario === 'menzenNoYakuRon' ? false : rng() < 0.4;
    const isRiichi = scenario === 'furiten' || scenario === 'furitenTsumo' ? rng() < 0.7 : false;
    const winds = { round: pick(rng, ['east', 'south'] as Wind[]), seat: pick(rng, ['east', 'south', 'west', 'north'] as Wind[]) };

    const base: WinContext = { concealed: rest, melds, winTile, isTsumo, isRiichi, roundWind: winds.round, seatWind: winds.seat, discards: [] };
    // 待ちは捨て牌に関係なく決まるので、先に計算して捨て牌を作る
    const pre = judgeWin(base, rules);
    if (!pre.judgement.isAgari) continue;
    const furiten = scenario === 'furiten' || scenario === 'furitenTsumo';
    const discards = makeDiscards(rng, agari, pre.waitTiles, winTile, furiten);
    const ctx = { ...base, discards };
    const result = judgeWin(ctx, rules);
    if (!matches(scenario, ctx, result)) continue;
    return { scenario, ctx, result };
  }
  throw new Error('問題を作れませんでした');
}

/** 和了れる/和了れないが半々くらいになるように場面を選ぶ */
export function pickScenario(rng: Rng, prefer?: CanWinCategory[]): CanWinScenario {
  let pool = ALL_SCENARIOS;
  if (prefer?.length && rng() < 0.6) {
    const p = pool.filter((s) => prefer.includes(SCENARIO_INFO[s].category));
    if (p.length) pool = p;
  }
  const ng = pool.filter((s) => !SCENARIO_INFO[s].canWin);
  const ok = pool.filter((s) => SCENARIO_INFO[s].canWin);
  if (!ng.length) return pick(rng, ok);
  if (!ok.length) return pick(rng, ng);
  return rng() < 0.55 ? pick(rng, ng) : pick(rng, ok);
}
