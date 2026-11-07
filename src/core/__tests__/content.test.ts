// 解説カードの例の手が、本当にその役になっているかを確認する
import { cardOf, YAKU_CARDS } from '../../content/yakuCards';
import { exampleContext, explainAbsent } from '../../content/yakuExplain';
import { judgeYaku } from '../yaku/judge';
import { YAKU_LIST } from '../yaku/definitions';
import { ctx } from './helpers';

describe('役の解説カード', () => {
  for (const card of YAKU_CARDS) {
    it(`${card.name}の例の手に${card.name}がつく`, () => {
      const j = judgeYaku(exampleContext(card.example));
      expect(j.han).toBeGreaterThan(0);
      expect(j.yaku.some((y) => cardOf(y.id)?.id === card.id)).toBe(true);
    });
  }

  it('第1〜3段階のすべての役にカードがある', () => {
    for (const d of YAKU_LIST.filter((x) => x.stage >= 1)) expect(cardOf(d.id)).toBeDefined();
  });
});

describe('つかない理由の説明', () => {
  it('シャンポン待ちをロンした三暗刻もどき', () => {
    const c = ctx('111m222p33s99s456m', '3s');
    expect(explainAbsent('sanankou', c, judgeYaku(c))).toContain('ロン');
  });
  it('役牌が2枚だけ', () => {
    const c = ctx('23m456789p234s77z', '1m');
    expect(explainAbsent('yakuhaiChun', c, judgeYaku(c))).toContain('2枚');
  });
  it('平和にならない理由(嵌張待ち)', () => {
    const c = ctx('13m456789p234s55s', '2m', { isRiichi: true });
    expect(explainAbsent('pinfu', c, judgeYaku(c))).toContain('嵌張');
  });
});
