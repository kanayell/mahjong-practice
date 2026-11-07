import { useEffect, useState } from 'react';

export type Route = 'home' | 'wait' | 'yaku' | 'cards' | 'canwin' | 'solo' | 'stats';
const ROUTES: Route[] = ['home', 'wait', 'yaku', 'cards', 'canwin', 'solo', 'stats'];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'home';
}

/** #/wait のようなハッシュで画面を切り替える(ブラウザの戻るボタンも使える) */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (r: Route) => (r === 'home' ? '#/' : `#/${r}`);
