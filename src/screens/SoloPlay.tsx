import { useMemo, useRef, useState } from 'react';
import { HandView } from '../components/HandView';
import { Term } from '../components/Term';
import { Tile } from '../components/Tile';
import { doraFromIndicator } from '../core/generators/yakuQuiz';
import { createRng } from '../core/random';
import { calcShanten } from '../core/shanten';
import {
  canTsumo,
  currentShanten,
  declareTsumo,
  discard,
  handAfterDiscard,
  kinds,
  newGame,
  remainingCount,
  riichiDiscards,
  type SoloState,
} from '../core/solo';
import { tileName, WIND_NAME, type Tile as TileT, type TileKind } from '../core/tile';
import { getWaitTiles } from '../core/wait';
import { YAKU } from '../core/yaku/definitions';

interface Hints {
  wait: boolean;
  yaku: boolean;
  shanten: boolean;
}

const HINT_KEY = 'mj.solo.hints';

function loadHints(): Hints {
  try {
    const v = JSON.parse(localStorage.getItem(HINT_KEY) ?? 'null');
    if (v && typeof v === 'object') return { wait: !!v.wait, yaku: !!v.yaku, shanten: !!v.shanten };
  } catch {
    /* 読めなければ初期値 */
  }
  return { wait: true, yaku: true, shanten: true };
}

function shantenText(n: number): string {
  if (n < 0) return '和了の形';
  if (n === 0) return 'テンパイ';
  return `${n}向聴(シャンテン)`;
}

export function SoloPlay() {
  const rng = useRef(createRng()).current;
  const [s, setS] = useState<SoloState>(() => newGame(rng));
  const [selected, setSelected] = useState<number | null>(null);
  const [hints, setHints] = useState<Hints>(loadHints);
  const [showYaku, setShowYaku] = useState(false);

  const setHint = (k: keyof Hints, v: boolean) => {
    const next = { ...hints, [k]: v };
    setHints(next);
    try {
      localStorage.setItem(HINT_KEY, JSON.stringify(next));
    } catch {
      /* 保存できなくても動く */
    }
  };

  const restart = () => {
    setS(newGame(rng));
    setSelected(null);
    setShowYaku(false);
  };

  // 引く前の13枚でのテンパイ状況
  const waits = useMemo(() => getWaitTiles(kinds(s.hand)), [s.hand]);
  const furiten = waits.some((w) => s.discards.some((d) => d.kind === w));
  const agari = canTsumo(s);
  const riichiOk = useMemo(() => new Set(riichiDiscards(s)), [s]);

  const preview = useMemo(() => {
    if (selected === null || !s.drawn) return null;
    const rest = kinds(handAfterDiscard(s, selected));
    return { shanten: calcShanten(rest), waits: getWaitTiles(rest) };
  }, [s, selected]);

  const tap = (t: TileT) => {
    if (s.result) return;
    if (s.riichi && t.uid !== s.drawn?.uid) return;
    if (selected === t.uid) {
      setS(discard(s, t.uid));
      setSelected(null);
    } else {
      setSelected(t.uid);
    }
  };

  const doDiscard = (riichi = false) => {
    if (selected === null) return;
    setS(discard(s, selected, riichi));
    setSelected(null);
  };

  const selectedTile = selected === null ? null : [...s.hand, ...(s.drawn ? [s.drawn] : [])].find((t) => t.uid === selected) ?? null;

  return (
    <div className="solo">
      <details className="panel hint-settings">
        <summary>ヒント設定</summary>
        <label>
          <input type="checkbox" checked={hints.wait} onChange={(e) => setHint('wait', e.target.checked)} />
          テンパイしたら待ちを表示
        </label>
        <label>
          <input type="checkbox" checked={hints.yaku} onChange={(e) => setHint('yaku', e.target.checked)} />
          和了ったら役を表示
        </label>
        <label>
          <input type="checkbox" checked={hints.shanten} onChange={(e) => setHint('shanten', e.target.checked)} />
          向聴数(テンパイまであと何枚か)を表示
        </label>
      </details>

      <section className="panel">
        <div className="situation">
          <span className="chip">
            <Term k="bakaze" />:{WIND_NAME[s.roundWind]}
          </span>
          <span className="chip">
            <Term k="jikaze" />:{WIND_NAME[s.seatWind]}
          </span>
          <span className="chip chip-dora">
            ドラ表示牌
            <Tile kind={s.doraIndicator.kind} red={s.doraIndicator.red} />→ {tileName(doraFromIndicator(s.doraIndicator.kind))}
          </span>
          <span className="chip">
            ツモ {s.draws} / {s.maxDraws}
          </span>
          {s.riichi && <span className="chip chip-riichi">リーチ中</span>}
        </div>

        <h3 className="sub-title">自分の捨て牌</h3>
        <div className="river">
          {s.discards.map((t, i) => (
            <span key={t.uid} className={i === s.riichiIndex ? 'riichi-tile' : undefined}>
              <Tile kind={t.kind} red={t.red} />
            </span>
          ))}
          {s.discards.length === 0 && <span className="note">まだありません</span>}
        </div>
      </section>

      {!s.result && (
        <section className="panel">
          <div className="hint-box" aria-live="polite">
            {hints.wait && waits.length > 0 && (
              <p className="tenpai">
                テンパイ!待ち:
                {waits.map((w) => (
                  <span key={w} className="wait-chip">
                    {tileName(w)}(残り{remainingCount(s, w)}枚)
                  </span>
                ))}
                {furiten && <span className="furiten">フリテン(ロンはできません。ツモなら和了れます)</span>}
              </p>
            )}
            {hints.shanten && <p>今の手(14枚):{shantenText(currentShanten(s))}</p>}
            {hints.shanten && preview && selectedTile && (
              <p>
                {tileName(selectedTile.kind)}を捨てると:<strong>{shantenText(preview.shanten)}</strong>
                {preview.waits.length > 0 && `(待ち:${preview.waits.map(tileName).join('・')})`}
              </p>
            )}
            {!hints.wait && !hints.shanten && <p className="note">ヒントはオフです。</p>}
          </div>

          <div className="hand solo-hand">
            <div className="hand-tiles">
              {s.hand.map((t) => (
                <Tile
                  key={t.uid}
                  kind={t.kind}
                  red={t.red}
                  selected={selected === t.uid}
                  dim={s.riichi}
                  onClick={() => tap(t)}
                />
              ))}
              {s.drawn && (
                <span className="drawn-slot">
                  <span className="drawn-caption">ツモ</span>
                  <Tile kind={s.drawn.kind} red={s.drawn.red} selected={selected === s.drawn.uid} onClick={() => tap(s.drawn!)} />
                </span>
              )}
            </div>
          </div>
          <p className="note">牌を1回タップで選択、もう1回タップで捨てます。</p>

          <div className="solo-actions">
            <button className="action" disabled={selected === null} onClick={() => doDiscard(false)}>
              捨てる
            </button>
            {!s.riichi && (
              <button
                className="action riichi"
                disabled={selected === null || !riichiOk.has(selected)}
                onClick={() => doDiscard(true)}
                title="捨てた後にテンパイになる牌だけ選べます"
              >
                リーチして捨てる
              </button>
            )}
            <button className={`action tsumo ${hints.wait && agari ? 'is-ready' : ''}`} onClick={() => setS(declareTsumo(s))}>
              ツモ和了
            </button>
          </div>
        </section>
      )}

      {s.result && (
        <section className="panel result" aria-live="polite">
          {s.result.type === 'tsumo' && (
            <>
              <h2 className="ok">ツモ和了!</h2>
              <HandView tiles={kinds(s.hand)} winTile={s.drawn!.kind} winLabel="ツモ" redKinds={s.hand.filter((t) => t.red).map((t) => t.kind)} />
              {hints.yaku || showYaku ? (
                <>
                  <ul className="yaku-reasons">
                    {s.result.judgement.yaku.map((y) => (
                      <li key={y.id}>
                        <span className="yaku-name">
                          {YAKU[y.id].name}({YAKU[y.id].reading})
                        </span>
                        <span>{y.han}翻</span>
                      </li>
                    ))}
                  </ul>
                  <p>
                    合計 {s.result.judgement.han} 翻{s.result.judgement.yakuman && '(役満!)'}。ドラ{countDora(s)}枚は役ではないので翻数に含めていません。
                  </p>
                </>
              ) : (
                <button className="link-button" onClick={() => setShowYaku(true)}>
                  役を考えてから、ここを押して答え合わせ
                </button>
              )}
            </>
          )}
          {s.result.type === 'chombo' && (
            <>
              <h2 className="ng">チョンボ(反則)</h2>
              <p>和了の形になっていないのに和了を宣言すると、実戦では罰符(ペナルティ)になります。</p>
              <p>今の手(14枚)は {shantenText(currentShanten(s))} でした。</p>
              {waits.length > 0 && <p>テンパイはしていて、待ちは {waits.map(tileName).join('・')} でした。</p>}
            </>
          )}
          {s.result.type === 'ryuukyoku' && (
            <>
              <h2>流局(りゅうきょく)</h2>
              <p>決められた回数ツモっても和了れませんでした。</p>
              <p>
                {s.result.tenpai ? `テンパイ(待ち:${waits.map(tileName).join('・')})で終わりました。実戦ならテンパイ料がもらえます。` : 'ノーテン(テンパイしていない)で終わりました。'}
              </p>
              <HandView tiles={kinds(s.hand)} />
            </>
          )}
          <button className="primary-button" onClick={restart}>
            もう一局
          </button>
        </section>
      )}
    </div>
  );
}

function countDora(s: SoloState): number {
  const dora: TileKind = doraFromIndicator(s.doraIndicator.kind);
  const all = [...s.hand, ...(s.drawn ? [s.drawn] : [])];
  return all.filter((t) => t.kind === dora).length + all.filter((t) => t.red).length;
}
