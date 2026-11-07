import { useRef, useState } from 'react';
import { DecompositionView } from '../components/DecompositionView';
import { HandView } from '../components/HandView';
import { Situation } from '../components/Situation';
import { TermNotes } from '../components/Term';
import { CardModal } from '../components/YakuCardView';
import { cardOf, DORA_NOTE, type YakuCard } from '../content/yakuCards';
import { explainAbsent, explainPresent } from '../content/yakuExplain';
import { generateYakuQuestion, yakuOptions, type YakuStage } from '../core/generators/yakuQuiz';
import { createRng } from '../core/random';
import { YAKU, type YakuId } from '../core/yaku/definitions';
import type { Rng } from '../core/random';
import { loadStats, recordResult } from '../stats/storage';
import { pickWeak } from '../stats/weighting';

/** 苦手優先がオンなら、苦手な役をねらった問題を出しやすくする */
function makeQuestion(rng: Rng, stage: YakuStage) {
  const stats = loadStats();
  const preferYaku = stats.preferWeak ? [pickWeak(rng, yakuOptions(stage), stats.items, 'yaku')] : undefined;
  return generateYakuQuestion(rng, stage, { preferYaku });
}

const STAGE_KEY = 'mj.yakuQuiz.stage';
const STAGE_INFO: Record<YakuStage, string> = {
  1: 'リーチ・メンゼンツモ・タンヤオ・役牌・平和',
  2: '+ 一盃口・七対子・混一色・対々和・三色同順・一気通貫',
  3: '+ 清一色・チャンタ・三暗刻・小三元',
};

function loadStage(): YakuStage {
  try {
    const v = Number(localStorage.getItem(STAGE_KEY));
    return v === 2 || v === 3 ? v : 1;
  } catch {
    return 1;
  }
}

export function YakuQuiz() {
  const rng = useRef(createRng()).current;
  const [stage, setStage] = useState<YakuStage>(loadStage);
  const [q, setQ] = useState(() => makeQuestion(rng, stage));
  const [selected, setSelected] = useState<Set<YakuId>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [card, setCard] = useState<YakuCard | null>(null);

  const options = yakuOptions(stage);
  const truth = new Set(q.judgement.yaku.map((y) => y.id));
  const isCorrect = selected.size === truth.size && [...selected].every((id) => truth.has(id));

  const next = (st: YakuStage = stage) => {
    setQ(makeQuestion(rng, st));
    setSelected(new Set());
    setAnswered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStage = (st: YakuStage) => {
    setStage(st);
    try {
      localStorage.setItem(STAGE_KEY, String(st));
    } catch {
      /* 保存できなくても動く */
    }
    next(st);
  };

  const toggle = (id: YakuId) => {
    if (answered) return;
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const answer = () => {
    setAnswered(true);
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    // 役ごとの記録:ついている役と、選んだ役それぞれについて「有無を正しく判断できたか」
    const ids = new Set<YakuId>([...truth, ...selected]);
    recordResult(
      'yaku',
      isCorrect,
      [...ids].map((id) => ({ key: `yaku:${id}`, correct: truth.has(id) === selected.has(id) })),
    );
  };

  const missed = [...truth].filter((id) => !selected.has(id));
  const wrong = [...selected].filter((id) => !truth.has(id));
  const { ctx } = q;

  return (
    <div className="quiz">
      <div className="level-tabs" role="tablist" aria-label="段階">
        {([1, 2, 3] as YakuStage[]).map((st) => (
          <button key={st} role="tab" aria-selected={stage === st} className={stage === st ? 'is-active' : ''} onClick={() => changeStage(st)}>
            第{st}段階
          </button>
        ))}
        <span className="score">{score.total > 0 ? `${score.correct} / ${score.total} 問正解` : ''}</span>
      </div>
      <p className="level-desc">{STAGE_INFO[stage]}</p>

      <section className="panel">
        <p className="instruction">この手で和了りました。ついている役をすべて選んでください。</p>
        <Situation ctx={ctx} doraIndicator={q.doraIndicator} hasRed={q.redKinds.length > 0} />
        <HandView tiles={ctx.concealed} winTile={ctx.winTile} winLabel={ctx.isTsumo ? 'ツモ' : 'ロン'} melds={ctx.melds} redKinds={q.redKinds} />
      </section>

      <section className="panel">
        <div className="yaku-options">
          {options.map((id) => {
            const d = YAKU[id];
            const mark = !answered ? '' : truth.has(id) ? (selected.has(id) ? 'is-correct' : 'is-missed') : selected.has(id) ? 'is-wrong' : 'is-dim';
            return (
              <button
                key={id}
                type="button"
                className={`yaku-option ${selected.has(id) ? 'is-selected' : ''} ${mark}`}
                aria-pressed={selected.has(id)}
                onClick={() => toggle(id)}
                disabled={answered}
              >
                <ruby>
                  {d.name}
                  <rt>{d.reading}</rt>
                </ruby>
              </button>
            );
          })}
        </div>
        {!answered ? (
          <button className="primary-button" onClick={answer} disabled={selected.size === 0}>
            {selected.size === 0 ? '役を選んでください' : `この ${selected.size} つで回答する`}
          </button>
        ) : (
          <button className="primary-button" onClick={() => next()}>
            次の問題へ
          </button>
        )}
      </section>

      {answered && (
        <section className="panel result" aria-live="polite">
          <h2 className={isCorrect ? 'ok' : 'ng'}>{isCorrect ? '正解!' : '惜しい!'}</h2>
          <p>
            ついている役は <strong>{q.judgement.yaku.map((y) => YAKU[y.id].name).join('・')}</strong>、合計 {q.judgement.han} 翻です(ドラは含みません)。
          </p>

          <h3>ついている役</h3>
          <ul className="yaku-reasons">
            {q.judgement.yaku.map((y) => (
              <li key={y.id} className={selected.has(y.id) ? 'ok' : 'missed'}>
                <span className="yaku-name">
                  {selected.has(y.id) ? '✓' : '見落とし'} {YAKU[y.id].name}({y.han}翻)
                </span>
                <span>{explainPresent(y.id, ctx)}</span>
                <CardLink id={y.id} onOpen={setCard} />
              </li>
            ))}
          </ul>

          {wrong.length > 0 && (
            <>
              <h3>選んだけれど、ついていない役</h3>
              <ul className="yaku-reasons">
                {wrong.map((id) => (
                  <li key={id} className="ng">
                    <span className="yaku-name">× {YAKU[id].name}</span>
                    <span>{explainAbsent(id, ctx, q.judgement)}</span>
                    <CardLink id={id} onOpen={setCard} />
                  </li>
                ))}
              </ul>
            </>
          )}

          {q.judgement.pattern && q.judgement.pattern.decomposition.form !== 'kokushi' && (
            <>
              <h3>この手の分け方</h3>
              <DecompositionView pattern={q.judgement.pattern} winTile={ctx.winTile} />
            </>
          )}

          <div className="dora-note">
            <strong>{DORA_NOTE.title}</strong>
            <p>{DORA_NOTE.lines[2]}</p>
          </div>
          {missed.length === 0 && wrong.length === 0 ? null : <p className="note">「◯◯の解説カード」を押すと、条件やよくある勘違いを確認できます。</p>}
          <TermNotes keys={['menzen', 'naki', 'tsumo', 'ron', 'bakaze', 'jikaze', 'yakuhai', 'ankou', 'han', 'dora', 'akadora']} />
        </section>
      )}

      {card && <CardModal card={card} onClose={() => setCard(null)} />}
    </div>
  );
}

function CardLink({ id, onOpen }: { id: YakuId; onOpen: (c: YakuCard) => void }) {
  const c = cardOf(id);
  if (!c) return null;
  return (
    <button type="button" className="link-button" onClick={() => onOpen(c)}>
      {c.name}の解説カード
    </button>
  );
}
