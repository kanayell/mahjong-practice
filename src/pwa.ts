// オフライン対応(サービスワーカー)の登録と、更新のお知らせ
export const OFFLINE_READY = 'mj-offline-ready';
export const UPDATE_READY = 'mj-update-ready';

export function registerServiceWorker() {
  // 開発中(npm run dev)は登録しない。古い画面が残って紛らわしくなるため
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const hadController = !!navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.register('./sw.js');
      // 新しい版に入れ替わった
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.dispatchEvent(new Event(hadController ? UPDATE_READY : OFFLINE_READY));
      });
      // アプリを開いたまま長時間たった時のため、1時間ごとに更新を確認
      setInterval(() => reg.update().catch(() => undefined), 60 * 60 * 1000);
    } catch {
      /* 登録できなくても、オンラインでは普通に使える */
    }
  });
}
