import { useEffect, useState } from 'react';
import { OFFLINE_READY, UPDATE_READY } from '../pwa';

/** 「オフラインで使えるようになりました」「新しい版があります」のお知らせ */
export function PwaToast() {
  const [kind, setKind] = useState<'offline' | 'update' | null>(null);

  useEffect(() => {
    const onOffline = () => setKind('offline');
    const onUpdate = () => setKind('update');
    window.addEventListener(OFFLINE_READY, onOffline);
    window.addEventListener(UPDATE_READY, onUpdate);
    return () => {
      window.removeEventListener(OFFLINE_READY, onOffline);
      window.removeEventListener(UPDATE_READY, onUpdate);
    };
  }, []);

  if (!kind) return null;
  return (
    <div className="toast" role="status">
      {kind === 'offline' ? (
        <span>オフラインでも使えるようになりました。</span>
      ) : (
        <>
          <span>新しい版があります。</span>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </>
      )}
      <button className="toast-close" aria-label="閉じる" onClick={() => setKind(null)}>
        ×
      </button>
    </div>
  );
}
