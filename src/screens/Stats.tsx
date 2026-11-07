import { useState } from 'react';
import { href } from '../router';
import { YAKU_LIST } from '../core/yaku/definitions';
import { CANWIN_CATEGORIES, labelOf, QUIZ_LABEL, WAIT_SHAPES } from '../stats/labels';
import { dayKey, loadStats, resetStats, setPreferWeak, type QuizKind, type StatsData } from '../stats/storage';

function pct(c: number, t: number) {
  return t === 0 ? null : Math.round((c / t) * 100);
}

function RateRow({ label, correct, total }: { label: string; correct: number; total: number }) {
  const p = pct(correct, total);
  const level = p === null ? 'none' : p >= 80 ? 'good' : p >= 50 ? 'mid' : 'weak';
  return (
    <tr className={`rate-row ${level}`}>
      <th scope="row">{label}</th>
      <td className="rate-bar-cell">
        <div className="rate-bar" aria-hidden="true">
          <div style={{ width: `${p ?? 0}%` }} />
        </div>
      </td>
      <td className="rate-num">{p === null ? 'まだ' : `${p}%`}</td>
      <td className="rate-count">
        {correct}/{total}
      </td>
    </tr>
  );
}

function Section({ title, prefix, ids, stats, link }: { title: string; prefix: string; ids: string[]; stats: StatsData; link: string }) {
  return (
    <section className="panel">
      <h2 className="stats-title">
        {title} <a href={link}>練習する</a>
      </h2>
      <table className="rate-table">
        <tbody>
          {ids.map((id) => {
            const it = stats.items[`${prefix}:${id}`];
            return <RateRow key={id} label={labelOf(`${prefix}:${id}`)} correct={it?.correct ?? 0} total={it?.total ?? 0} />;
          })}
        </tbody>
      </table>
    </section>
  );
}

export function Stats() {
  const [stats, setStats] = useState<StatsData>(() => loadStats());
  const [confirming, setConfirming] = useState(false);

  const days = Object.entries(stats.days)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 7);
  const today = stats.days[dayKey(Date.now())];
  const yakuIds = YAKU_LIST.filter((d) => d.stage >= 1).map((d) => d.id);

  return (
    <div className="stats">
      <section className="panel">
        <label className="switch-row">
          <input type="checkbox" checked={stats.preferWeak} onChange={(e) => setStats(setPreferWeak(e.target.checked))} />
          <span>
            <strong>苦手なものを優先して出題する</strong>
            <small>正答率が低い待ちの形・役・場面ほど出やすくなります(得意なものもときどき出ます)。</small>
          </span>
        </label>
      </section>

      <section className="panel">
        <h2 className="stats-title">全体</h2>
        <p>今日:{today ? `${today.correct} / ${today.total} 問正解` : 'まだ練習していません'}</p>
        <table className="rate-table">
          <tbody>
            {(Object.keys(QUIZ_LABEL) as QuizKind[]).map((k) => (
              <RateRow key={k} label={QUIZ_LABEL[k]} correct={stats.quizzes[k].correct} total={stats.quizzes[k].total} />
            ))}
          </tbody>
        </table>
        {days.length > 0 && (
          <details className="days">
            <summary>最近7日の記録</summary>
            <ul>
              {days.map(([d, v]) => (
                <li key={d}>
                  {d}:{v.correct} / {v.total} 問正解
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <Section title="待ちの形" prefix="wait" ids={WAIT_SHAPES} stats={stats} link={href('wait')} />
      <Section title="役" prefix="yaku" ids={yakuIds} stats={stats} link={href('yaku')} />
      <Section title="和了れる?" prefix="canwin" ids={CANWIN_CATEGORIES} stats={stats} link={href('canwin')} />

      <p className="note">
        役の正答率は「その役がついているか・ついていないかを正しく判断できたか」で数えています。記録はこのブラウザの中だけに保存され、他の端末とは共有されません。
      </p>

      <section className="panel danger">
        {!confirming ? (
          <button className="action" onClick={() => setConfirming(true)}>
            記録をリセット
          </button>
        ) : (
          <div className="confirm">
            <p>すべての記録を消します。元に戻せません。よろしいですか?</p>
            <div className="confirm-buttons">
              <button
                className="action riichi"
                onClick={() => {
                  setStats(resetStats());
                  setConfirming(false);
                }}
              >
                消す
              </button>
              <button className="action" onClick={() => setConfirming(false)}>
                やめる
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
