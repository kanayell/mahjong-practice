import { YakuCardView } from '../components/YakuCardView';
import { DORA_NOTE, YAKU_CARDS } from '../content/yakuCards';

const STAGE_TITLE = { 1: '第1段階(まずはこれだけ)', 2: '第2段階', 3: '第3段階(余裕があれば)' } as const;

export function YakuCards() {
  return (
    <div className="cards-page">
      <nav className="card-index" aria-label="役の一覧">
        {YAKU_CARDS.map((c) => (
          <a key={c.id} href={`#/cards`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`card-${c.id}`)?.scrollIntoView({ behavior: 'smooth' });
          }}>
            {c.name}
          </a>
        ))}
      </nav>
      <section className="panel dora-note">
        <strong>{DORA_NOTE.title}</strong>
        {DORA_NOTE.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </section>
      {([1, 2, 3] as const).map((st) => (
        <section key={st}>
          <h2 className="stage-title">{STAGE_TITLE[st]}</h2>
          {YAKU_CARDS.filter((c) => c.stage === st).map((c) => (
            <div className="panel" key={c.id}>
              <YakuCardView card={c} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
