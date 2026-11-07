import { useRef, useState } from 'react';
import { HandView } from '../components/HandView';
import { River } from '../components/River';
import { Situation } from '../components/Situation';
import { TermNotes } from '../components/Term';
import { Tile } from '../components/Tile';
import { explainOk, waitYakuTable } from '../content/canWinExplain';
import { generateCanWinQuestion, pickScenario, SCENARIO_INFO } from '../core/generators/canWinQuiz';
import { createRng } from '../core/random';
import { tileName } from '../core/tile';
import type { Rng } from '../core/random';
import { CANWIN_CATEGORIES } from '../stats/labels';
import { loadStats, recordResult } from '../stats/storage';
import { pickWeak } from '../stats/weighting';

/** 苦手優先がオンなら、苦手な分類(役なし・片和了・フリテン)を出しやすくする */
function makeQuestion(rng: Rng) {
  const stats = loadStats();
  const prefer = stats.preferWeak ? [pickWeak(rng, CANWIN_CATEGORIES, stats.items, 'canwin')] : undefined;
  return generateCanWinQuestion(rng, pickScenario(rng, prefer));
}

const REASON_TITLE = {
  notAgari: '和了の形ではない',
  noYaku: '役なし',
  kataagari: '片和了(かたあがり)',
  furiten: 'フリテン',
} as const;

export function CanWinQuiz() {
  const rng = useRef(createRng()).current;
  const [q, setQ] = useState(() => makeQuestion(rng));
  const [choice, setChoice] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { ctx, result: r } = q;
  const answered = choice !== null;
  const isCorrect = choice === r.canWin;

  const answer = (c: boolean) => {
    if (answered) return;
    setChoice(c);
    setScore((s) => ({ correct: s.correct + (c === r.canWin ? 1 : 0), total: s.total + 1 }));
    const ok = c === r.canWin;
    recordResult('canwin', ok, [{ key: `canwin:${SCENARIO_INFO[q.scenario].category}`, correct: ok }]);
  };

  const next = () => {
    setQ(makeQuestion(rng));
    setChoice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const furitenTiles = ctx.discards.filter((d) => r.waitTiles.includes(d));
  const showWaitTable = r.waitTiles.length > 1 || r.reasons.includes('kataagari');

  return (
    <div className="quiz">
      <div className="level-tabs">
        <span className="level-desc" style={{ margin: 0 }}>
          役なし・片和了・フリテンを見抜こう
        </span>
        <span className="score">{score.total > 0 ? `${score.correct} / ${score.total} 問正解` : ''}</span>
      </div>

      <section className="panel">
        <p className="instruction">
          {ctx.isTsumo ? 'この牌をツモりました。' : '他の人がこの牌を捨てました。'}
          <strong>和了れますか?</strong>
        </p>
        <Situation ctx={ctx} />
        <HandView tiles={ctx.concealed} winTile={ctx.winTile} winLabel={ctx.isTsumo ? 'ツモ' : 'ロン?'} melds={ctx.melds} />
        <h3 className="sub-title">自分の捨て牌</h3>
        <River tiles={ctx.discards} highlight={answered ? furitenTiles : []} />
      </section>

      <section className="panel">
        <div className="answer-buttons">
          <button
            className={`answer-button ok ${answered && choice === true ? 'is-chosen' : ''} ${answered && r.canWin ? 'is-truth' : ''}`}
            onClick={() => answer(true)}
            disabled={answered}
          >
            和了れる
          </button>
          <button
            className={`answer-button ng ${answered && choice === false ? 'is-chosen' : ''} ${answered && !r.canWin ? 'is-truth' : ''}`}
            onClick={() => answer(false)}
            disabled={answered}
          >
            和了れない
          </button>
        </div>
        {answered && (
          <button className="primary-button" onClick={next}>
            次の問題へ
          </button>
        )}
      </section>

      {answered && (
        <section className="panel result" aria-live="polite">
          <h2 className={isCorrect ? 'ok' : 'ng'}>{isCorrect ? '正解!' : '残念!'}</h2>
          <p className="verdict">
            この手は <strong>{r.canWin ? '和了れます' : '和了れません'}</strong>
            {!r.canWin && `(${r.reasons.map((x) => REASON_TITLE[x]).join('+')})`}。
          </p>

          <h3>{r.canWin ? 'なぜ和了れるか' : 'なぜダメか・どうすれば和了れたか'}</h3>
          <ul className="explain-list">
            {(r.canWin ? explainOk(q) : r.explanations).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          {showWaitTable && (
            <>
              <h3>待ち牌ごとの役</h3>
              <table className="wait-table">
                <tbody>
                  {waitYakuTable(q).map((w) => (
                    <tr key={w.tile} className={w.tile === ctx.winTile ? 'is-win' : ''}>
                      <td>
                        <Tile kind={w.tile} mark={w.tile === ctx.winTile ? 'win' : undefined} />
                      </td>
                      <td>
                        {tileName(w.tile)}
                        {w.tile === ctx.winTile && '(今回の牌)'}
                      </td>
                      <td className={w.yaku === '役なし' ? 'ng' : 'ok'}>{w.yaku}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {furitenTiles.length > 0 && <p className="note">捨て牌の赤い×は、自分の待ち牌です(フリテンの原因)。</p>}

          <div className="point-box">
            <strong>実戦のポイント</strong>
            <p>{SCENARIO_INFO[q.scenario].point}</p>
          </div>
          <TermNotes keys={['menzen', 'naki', 'tsumo', 'ron', 'yakuhai', 'dora']} />
        </section>
      )}
    </div>
  );
}
