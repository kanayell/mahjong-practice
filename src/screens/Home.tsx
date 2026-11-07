import { useState } from 'react';
import { Tile } from '../components/Tile';
import { todayMessage } from '../content/encourage';
import { setTileSettings, useTileSettings } from '../settings';
import type { TileKind } from '../core/tile';
import { href, type Route } from '../router';
import { labelOf } from '../stats/labels';
import { dayKey, loadStats, streakDays } from '../stats/storage';
import { weakList } from '../stats/weighting';

const MODES: { route: Route; title: string; text: string; icon: TileKind }[] = [
  { route: 'wait', title: '待ち当てクイズ', text: 'テンパイした手の、和了れる牌をすべて当てる', icon: 13 },
  { route: 'yaku', title: '役クイズ', text: '和了った手についている役を当てる', icon: 33 },
  { route: 'cards', title: '役の解説カード', text: '役ごとの条件・鳴いてOKか・よくある勘違い', icon: 18 },
  { route: 'canwin', title: 'その手、和了れる?', text: '役なし・片和了・フリテンを見抜く', icon: 32 },
  { route: 'solo', title: '一人打ち練習', text: '山から引いて捨てるを繰り返す', icon: 27 },
  { route: 'stats', title: '学習記録', text: '正答率と苦手な形・役', icon: 26 },
];

/** 卓の上に並ぶ牌(タップすると別の牌に変わる) */
const FIRST_TILES: TileKind[] = [0, 33, 13, 32, 26];

export function Home() {
  const stats = loadStats();
  const now = Date.now();
  const today = stats.days[dayKey(now)];
  const streak = streakDays(stats.days, now);
  const message = todayMessage(today?.total ?? 0, today?.correct ?? 0, streak);
  const totalAnswered =stats.quizzes.wait.total + stats.quizzes.yaku.total + stats.quizzes.canwin.total;
  const weak = [...weakList(stats.items, 'wait'), ...weakList(stats.items, 'yaku'), ...weakList(stats.items, 'canwin')]
    .filter((w) => w.rate < 0.8)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  const [tiles, setTiles] = useState(FIRST_TILES);
  // 一度タップした位置は「配る」動きではなく「めくる」動きで表示する
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const reroll = (i: number) => {
    setTiles((ts) => ts.map((k, j) => (j === i ? Math.floor(Math.random() * 34) : k)));
    setFlipped((s) => new Set(s).add(i));
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-tiles" aria-label="卓の上の牌(タップすると変わります)">
          {tiles.map((k, i) => (
            <span
              key={`${i}-${k}`}
              className={`hero-tile${flipped.has(i) ? ' is-flipped' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              <Tile kind={k} red={k === 13} onClick={() => reroll(i)} />
            </span>
          ))}
        </div>
        <p className="hero-catch">仲間との麻雀を、もっとたのしく。</p>
        <p className="hero-lead">「待ち」「役」「和了れる?」を、1日数問から練習しよう。</p>
        <p className="hero-hint">牌をタップすると、別の牌に変わります。</p>
      </section>

      <section className="today-card">
        <div className="today-main">
          <span className="today-label">
            今日の練習{today && today.total > 0 ? `:${today.total}問(${today.correct}問正解)` : ''}
          </span>
          <strong className="today-num">{message.title}</strong>
          <span className="today-text">{message.text}</span>
        </div>
        {streak > 0 && (
          <div className="streak" title="続けて練習した日数">
            <span className="streak-num">{streak}</span>
            <span className="streak-unit">日連続</span>
          </div>
        )}
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
              <span className="mode-icon" aria-hidden="true">
                <Tile kind={m.icon} red={m.icon === 13} />
              </span>
              <span className="mode-body">
                <span className="mode-title">
                  {m.title}
                  {m.route === 'wait' && totalAnswered === 0 && <span className="badge-start">まずはここから</span>}
                </span>
                <span className="mode-text">{m.text}</span>
              </span>
              <span className="mode-arrow" aria-hidden="true">
                ›
              </span>
            </a>
          </li>
        ))}
      </ul>

      <TileDesignSettings />
    </div>
  );
}

const PREVIEW: { kind: TileKind; red?: boolean }[] = [
  { kind: 0 },
  { kind: 13, red: true },
  { kind: 16 },
  { kind: 18 },
  { kind: 25 },
  { kind: 27 },
  { kind: 31 },
  { kind: 33 },
];

/** 牌のデザインの設定(実物に近い/見やすさ重視) */
function TileDesignSettings() {
  const s = useTileSettings();
  return (
    <details className="panel tile-settings">
      <summary>牌のデザイン</summary>
      <div className="segmented" role="radiogroup" aria-label="牌のデザイン">
        <label>
          <input type="radio" name="tile-face" checked={s.face === 'real'} onChange={() => setTileSettings({ face: 'real' })} />
          <span>実物に近い</span>
        </label>
        <label>
          <input type="radio" name="tile-face" checked={s.face === 'simple'} onChange={() => setTileSettings({ face: 'simple' })} />
          <span>見やすさ重視</span>
        </label>
      </div>
      <div className="tile-preview" aria-label="見本">
        {PREVIEW.map((p, i) => (
          <Tile key={i} kind={p.kind} red={p.red} />
        ))}
      </div>
    </details>
  );
}
