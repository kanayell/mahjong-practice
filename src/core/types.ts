import type { TileKind, Wind } from './tile';

/** 鳴いた面子(フーロ)と暗槓 */
export interface Meld {
  type: 'chi' | 'pon' | 'minkan' | 'ankan';
  /** 面子を構成する牌(チーなら3枚、ポンなら3枚、カンなら4枚) */
  tiles: TileKind[];
  /** 他家から鳴いた牌(表示用) */
  calledTile?: TileKind;
}

/** 面子(メンツ)。open=true は鳴いた面子、またはロンで完成した刻子 */
export type Block =
  | { type: 'shuntsu'; first: TileKind; open: boolean } // 順子(シュンツ):連続する3枚
  | { type: 'koutsu'; tile: TileKind; open: boolean } // 刻子(コーツ):同じ牌3枚
  | { type: 'kantsu'; tile: TileKind; open: boolean }; // 槓子(カンツ):同じ牌4枚

export interface Decomposition {
  form: 'standard' | 'chiitoitsu' | 'kokushi';
  /** 雀頭(ジャントウ)。七対子では使わない */
  head?: TileKind;
  /** 4つの面子(手の内+鳴き)。七対子・国士では空 */
  blocks: Block[];
  /** 七対子の7組の対子 */
  pairs?: TileKind[];
}

/** 待ちの形 */
export type WaitShape =
  | 'ryanmen' // 両面(リャンメン)待ち:45 で 3・6 待ち
  | 'kanchan' // 嵌張(カンチャン)待ち:46 で 5 待ち
  | 'penchan' // 辺張(ペンチャン)待ち:12 で 3 待ち / 89 で 7 待ち
  | 'tanki' // 単騎(タンキ)待ち:雀頭の片方を待つ
  | 'shanpon'; // シャンポン(双碰)待ち:対子2つのどちらかを待つ

/** 和了牌がどこに入ったか */
export type WinPosition = { kind: 'head' } | { kind: 'block'; index: number } | { kind: 'pair'; index: number } | { kind: 'kokushi' };

export interface WaitPattern {
  decomposition: Decomposition;
  shape: WaitShape;
  winIn: WinPosition;
}

export interface WaitInfo {
  tile: TileKind;
  /** この牌で和了った時の解釈(分解+待ちの形)。複数ありうる */
  patterns: WaitPattern[];
}

export interface WinContext {
  /** 手の内の牌(和了牌を含まない) */
  concealed: TileKind[];
  melds: Meld[];
  winTile: TileKind;
  isTsumo: boolean;
  isRiichi: boolean;
  roundWind: Wind; // 場風(バカゼ)
  seatWind: Wind; // 自風(ジカゼ)
  /** 自分の捨て牌(フリテン判定用) */
  discards: TileKind[];
  /** ドラ表示牌(表示のみ。役判定には使わない) */
  doraIndicators?: TileKind[];
}

export interface Rules {
  /** 喰いタン(鳴いた断么九)を認めるか */
  kuitan: boolean;
}

export const DEFAULT_RULES: Rules = { kuitan: true };
