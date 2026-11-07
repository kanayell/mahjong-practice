/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * オフライン対応:ビルドした全ファイルを最初に保存しておくサービスワーカー(sw.js)を作る。
 * 中身が変わると版(CACHE名)が変わり、次に開いた時に新しい版へ入れ替わる。
 */
function serviceWorker(): Plugin {
  return {
    name: 'mj-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const publicFiles = readdirSync('public').filter((f) => !f.startsWith('.'));
      const hash = createHash('sha256');
      for (const f of built.sort()) {
        const item = bundle[f];
        hash.update(f);
        hash.update(item.type === 'chunk' ? item.code : typeof item.source === 'string' ? item.source : Buffer.from(item.source));
      }
      for (const f of publicFiles.sort()) hash.update(f).update(readFileSync(join('public', f)));
      const version = hash.digest('hex').slice(0, 12);
      const assets = ['./', ...built, ...publicFiles].map((f) => (f === './' ? f : `./${f}`));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: swSource(version, assets) });
    },
  };
}

function swSource(version: string, assets: string[]): string {
  return `// 自動生成ファイル(vite.config.ts の serviceWorker プラグイン)
const CACHE = 'mj-${version}';
const ASSETS = ${JSON.stringify(assets)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mj-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 保存してあるファイルを先に使う(電波が弱くてもすぐ開ける)。なければ通信で取りにいく。
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const index = new URL('./', self.registration.scope).href;
    event.respondWith(caches.match(index).then((hit) => hit || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
`;
}

export default defineConfig({
  // GitHub Pages(https://ユーザー名.github.io/リポジトリ名/)でもそのまま動くよう、相対パスにする
  base: './',
  plugins: [react(), serviceWorker()],
  test: {
    globals: true,
    environment: 'node',
  },
});
