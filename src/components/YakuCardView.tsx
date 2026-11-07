import { useEffect } from 'react';
import { HandView } from './HandView';
import { exampleContext } from '../content/yakuExplain';
import type { YakuCard } from '../content/yakuCards';
import { YAKU } from '../core/yaku/definitions';
import { judgeYaku } from '../core/yaku/judge';

/** 役の「1分で分かる解説カード」 */
export function YakuCardView({ card }: { card: YakuCard }) {
  const ctx = exampleContext(card.example);
  const j = judgeYaku(ctx);
  return (
    <article className="yaku-card" id={`card-${card.id}`}>
      <header className="yaku-card-head">
        <h3>
          <ruby>
            {card.name}
            <rt>{card.reading}</rt>
          </ruby>
        </h3>
        <span className="han">{card.hanText}</span>
        <span className={`open-badge ${card.openOk ? 'ok' : 'ng'}`}>{card.openOk ? '鳴いてOK' : '鳴くとNG'}</span>
      </header>
      <p className="yaku-summary">{card.summary}</p>
      <h4>条件</h4>
      <ul>
        {card.conditions.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="open-text">
        <strong>鳴き:</strong>
        {card.openText}
      </p>
      <h4>よくある勘違い</h4>
      <ul>
        {card.mistakes.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <h4>例</h4>
      <div className="card-example">
        <HandView tiles={ctx.concealed} winTile={ctx.winTile} winLabel={ctx.isTsumo ? 'ツモ' : 'ロン'} melds={ctx.melds} />
        <p className="note">
          {card.example.note}(この手の役:{j.yaku.map((y) => YAKU[y.id].name).join('・')})
        </p>
      </div>
    </article>
  );
}

/** カードを画面の上に重ねて表示する */
export function CardModal({ card, onClose }: { card: YakuCard; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`${card.name}の解説`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <YakuCardView card={card} />
      </div>
    </div>
  );
}
