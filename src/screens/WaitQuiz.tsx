import { useMemo, useRef, useState } from 'react';
import { DecompositionView } from '../components/DecompositionView';
import { HandView } from '../components/HandView';
import { Term, TermNotes } from '../components/Term';
import { TilePicker } from '../components/TilePicker';
import { Tile } from '../components/Tile';
import { uniquePatterns } from '../content/waitExplain';
import { generateWaitQuestion, WAIT_LEVEL_INFO, type WaitLevel } from '../core/generators/waitQuiz';
import { createRng } from '../core/random';
import { tileName, tileNames, type TileKind } from '../core/tile';
import type { GlossaryKey } from '../content/glossary';
import type { Rng } from '../core/random';
import { WAIT_SHAPES } from '../stats/labels';
import { loadStats, recordResult } from '../stats/storage';
import { pickWeak } from '../stats/weighting';

/** 苦手優先がオンなら、苦手な待ちの形を含む問題を出しやすくする */
function makeQuestion(rng: Rng, level: WaitLevel) {
  const stats = loadStats();
  const preferShapes = stats.preferWeak ? [pickWeak(rng, WAIT_SHAPES, stats.items, 'wait')] : undefined;
  return generateWaitQuestion(rng, level, { preferShapes });
}

const LEVEL_KEY = 'mj.waitQuiz.level';

function loadLevel(): WaitLevel {
  try {
    const v = Number(localStorage.getItem(LEVEL_KEY));
    return v === 2 || v === 3 ? v : 1;
  } catch {
    return 1;
  }
}

export function WaitQuiz() {
  const rng = useRef(createRng()).current;
  const [level, setLevel] = useState<WaitLevel>(loadLevel);
  const [q, setQ] = useState(() => makeQuestion(rng, level));
  const [selected, setSelected] = useState<Set<TileKind>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const waitSet = useMemo(() => new Set(q.waits.map((w) => w.tile)), [q]);
  const isCorrect = answered && selected.size === waitSet.size && [...selected].every((k) => waitSet.has(k));
  const wrongPicks = [...selected].filter((k) => !waitSet.has(k)).sort((a, b) => a - b);
  const missed = q.waits.map((w) => w.tile).filter((k) => !selected.has(k));

  const next = (lv: WaitLevel = level) => {
    setQ(makeQuestion(rng, lv));
    setSelected(new Set());
    setAnswered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeLevel = (lv: WaitLevel) => {
    setLevel(lv);
    try {
      localStorage.setItem(LEVEL_KEY, String(lv));
    } catch {
      /* 保存できなくても動く */
    }
    next(lv);
  };

  const toggle = (k: TileKind) => {
    if (answered) return;
    // 素早く連続タップしても前の選択が消えないよう、直前の状態から更新する
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k);
      else s.add(k);
      return s;
    });
  };

  const answer = () => {
    if (selected.size === 0) return;
    const ok = selected.size === waitSet.size && [...selected].every((k) => waitSet.has(k));
    setAnswered(true);
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    recordResult(
      'wait',
      ok,
      q.shapes.map((shape) => ({ key: `wait:${shape}`, correct: ok })),
    );
  };

  const termKeys: GlossaryKey[] = ['tenpai', 'machi', 'mentsu', 'jantou', 'shuntsu', 'koutsu', ...q.shapes];

  return (
    <div className="quiz">
      <div className="level-tabs" role="tablist" aria-label="難易度">
        {([1, 2, 3] as WaitLevel[]).map((lv) => (
          <button key={lv} role="tab" aria-selected={level === lv} className={level === lv ? 'is-active' : ''} onClick={() => changeLevel(lv)}>
            Lv{lv}
          </button>
        ))}
        <span className="score">
          {score.total > 0 ? `${score.correct} / ${score.total} 問正解` : ''}
        </span>
      </div>
      <p className="level-desc">{WAIT_LEVEL_INFO[level].description}</p>

      <section className="panel">
        <p className="instruction">
          この手は <Term k="tenpai" />(あと1枚で和了れる状態)です。和了れる牌(<Term k="machi" />)をすべて選んでください。
        </p>
        <HandView tiles={q.hand} />
      </section>

      <section className="panel">
        <TilePicker
          selected={selected}
          onToggle={answered ? undefined : toggle}
          markOf={(k) => {
            if (!answered) return undefined;
            if (waitSet.has(k)) return selected.has(k) ? 'correct' : 'missed';
            return selected.has(k) ? 'wrong' : undefined;
          }}
          dimOf={(k) => answered && !waitSet.has(k) && !selected.has(k)}
        />
        {!answered ? (
          <button className="primary-button" onClick={answer} disabled={selected.size === 0}>
            {selected.size === 0 ? '待ち牌を選んでください' : `この ${selected.size} 種類で回答する`}
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
            待ちは <strong>{tileNames(q.waits.map((w) => w.tile))}</strong> の {q.waits.length} 種類です。
          </p>
          {!isCorrect && (
            <ul className="mistakes">
              {missed.length > 0 && <li>見落とし:{tileNames(missed)}(下の図で、なぜ和了れるか確認しましょう)</li>}
              {wrongPicks.map((k) => (
                <li key={k}>{tileName(k)}:この牌が来ても、面子4つと雀頭1つに分けられないので和了れません。</li>
              ))}
            </ul>
          )}

          <h3>なぜその牌で和了れるか</h3>
          {q.waits.map((w) => {
            const patterns = uniquePatterns(w.patterns, w.tile);
            const shown = patterns.slice(0, 3);
            return (
              <div className="wait-explain" key={w.tile}>
                <div className="wait-head">
                  <Tile kind={w.tile} mark="win" />
                  <span>
                    {tileName(w.tile)} が来た場合
                    {patterns.length > 1 && <small>({patterns.length} 通りの分け方)</small>}
                  </span>
                </div>
                {shown.map((p, i) => (
                  <DecompositionView key={i} pattern={p} winTile={w.tile} />
                ))}
                {patterns.length > shown.length && <p className="note">ほかに {patterns.length - shown.length} 通りの分け方があります。</p>}
              </div>
            );
          })}
          <TermNotes keys={[...new Set(termKeys)]} />
        </section>
      )}
    </div>
  );
}
