import { GLOSSARY, type GlossaryKey } from '../content/glossary';

/** ふりがな付きの用語 */
export function Term({ k }: { k: GlossaryKey }) {
  const g = GLOSSARY[k];
  if (g.term === g.reading) return <span className="term">{g.term}</span>;
  return (
    <ruby className="term">
      {g.term}
      <rt>{g.reading}</rt>
    </ruby>
  );
}

/** 用語メモ(その画面で出てくる用語の短い説明) */
export function TermNotes({ keys }: { keys: GlossaryKey[] }) {
  return (
    <details className="term-notes">
      <summary>用語メモ</summary>
      <dl>
        {keys.map((k) => (
          <div key={k}>
            <dt>
              <Term k={k} />
            </dt>
            <dd>{GLOSSARY[k].short}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
