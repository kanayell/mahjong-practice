import './styles.css';
import { href, useRoute, type Route } from './router';
import { Home } from './screens/Home';
import { WaitQuiz } from './screens/WaitQuiz';
import { YakuCards } from './screens/YakuCards';
import { YakuQuiz } from './screens/YakuQuiz';
import { CanWinQuiz } from './screens/CanWinQuiz';
import { SoloPlay } from './screens/SoloPlay';
import { Stats } from './screens/Stats';
import { PwaToast } from './components/PwaToast';

const TITLES: Record<Route, string> = {
  home: '麻雀れんしゅう帳',
  wait: '待ち当てクイズ',
  yaku: '役クイズ',
  cards: '役の解説カード',
  canwin: 'その手、和了れる?',
  solo: '一人打ち練習',
  stats: '学習記録',
};

export default function App() {
  const route = useRoute();
  return (
    <div className="app">
      <header className="app-header">
        {route !== 'home' && (
          <a className="back" href={href('home')} aria-label="ホームに戻る">
            ‹ ホーム
          </a>
        )}
        <h1>{TITLES[route]}</h1>
      </header>
      <main className="app-main">
        {route === 'home' && <Home />}
        {route === 'wait' && <WaitQuiz />}
        {route === 'yaku' && <YakuQuiz />}
        {route === 'cards' && <YakuCards />}
        {route === 'canwin' && <CanWinQuiz />}
        {route === 'solo' && <SoloPlay />}
        {route === 'stats' && <Stats />}
      </main>
      <PwaToast />
    </div>
  );
}
