import { href, type Route } from '../router';
import { labelOf } from '../stats/labels';
import { dayKey, loadStats } from '../stats/storage';
import { weakList } from '../stats/weighting';

const MODES: { route: Route; title: string; text: string }[] = [
  { route: 'wait', title: '待ち当てクイズ', text: 'テンパイした手の、和了れる牌をすべて当てる' },
  { route: 'yaku', title: '役クイズ', text: '和了った手についている役を当てる' },
  { route: 'cards', title: '役の解説カード', text: '役ごとの条件・鳴いてOKか・よくある勘違い' },
  { route: 'canwin', title: 'その手、和了れる?', text: '役なし・片和了・フリテンを見抜く' },
  { route: 'solo', title: '一人打ち練習', text: '山から引いて捨てるを繰り返す' },
  { route: 'stats', title: '学習記録', text: '正答率と苦手な形・役' },
];

export function Home() {
  const stats = loadStats();
  const today = stats.days[dayKey(Date.now())];
  const weak = [...weakList(stats.items, 'wait'), ...weakList(stats.items, 'yaku'), ...weakList(stats.items, 'canwin')]
    .filter((w) => w.rate < 0.8)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  return (
    <div className="home">
      <p className="lead">会社の麻雀に、安心して参加できるようになるための練習帳です。まずは「待ち当てクイズ」から始めましょう。</p>

      <section className="panel today">
        <div>
          <span className="today-label">今日の練習</span>
          <strong className="today-num">{today ? `${today.correct} / ${today.total} 問正解` : 'まだ0問'}</strong>
        </div>
        {weak.length > 0 && (
          <div className="today-weak">
            <span className="today-label">苦手トップ3</span>
            <span>{weak.map((w) => `${labelOf(w.key)}(${Math.round(w.rate * 100)}%)`).join('、')}</span>
          </div>
        )}
      </section>

      <ul className="mode-list">
        {MODES.map((m) => (
          <li key={m.route}>
            <a className="mode-card" href={href(m.route)}>
              <span className="mode-title">{m.title}</span>
              <span className="mode-text">{m.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
