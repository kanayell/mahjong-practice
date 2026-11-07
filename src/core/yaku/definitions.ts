// 役の情報
export type YakuId =
  // 第1段階
  | 'riichi'
  | 'menzenTsumo'
  | 'tanyao'
  | 'yakuhaiHaku'
  | 'yakuhaiHatsu'
  | 'yakuhaiChun'
  | 'roundWind'
  | 'seatWind'
  | 'pinfu'
  // 第2段階
  | 'iipeikou'
  | 'chiitoitsu'
  | 'honitsu'
  | 'toitoi'
  | 'sanshoku'
  | 'ittsu'
  // 第3段階
  | 'chinitsu'
  | 'chanta'
  | 'sanankou'
  | 'shousangen'
  // 出題対象外(正しく判定するために用意)
  | 'junchan'
  | 'ryanpeikou'
  | 'honroutou'
  | 'sankantsu'
  // 役満(ヤクマン)
  | 'kokushi'
  | 'suuankou'
  | 'daisangen'
  | 'tsuuiisou'
  | 'ryuuiisou'
  | 'chinroutou'
  | 'shousuushii'
  | 'daisuushii'
  | 'chuuren';

export interface YakuDef {
  id: YakuId;
  name: string;
  reading: string;
  /** 門前(鳴いていない)時の翻数。役満は 13 */
  han: number;
  /** 鳴いた時の翻数。0 = 鳴くと成立しない */
  hanOpen: number;
  /** 学習段階。0 = 出題しない */
  stage: 0 | 1 | 2 | 3;
  yakuman?: boolean;
}

const defs: YakuDef[] = [
  { id: 'riichi', name: '立直', reading: 'リーチ', han: 1, hanOpen: 0, stage: 1 },
  { id: 'menzenTsumo', name: '門前清自摸和', reading: 'メンゼンツモ', han: 1, hanOpen: 0, stage: 1 },
  { id: 'tanyao', name: '断么九', reading: 'タンヤオ', han: 1, hanOpen: 1, stage: 1 },
  { id: 'yakuhaiHaku', name: '役牌 白', reading: 'ヤクハイ ハク', han: 1, hanOpen: 1, stage: 1 },
  { id: 'yakuhaiHatsu', name: '役牌 發', reading: 'ヤクハイ ハツ', han: 1, hanOpen: 1, stage: 1 },
  { id: 'yakuhaiChun', name: '役牌 中', reading: 'ヤクハイ チュン', han: 1, hanOpen: 1, stage: 1 },
  { id: 'roundWind', name: '役牌 場風', reading: 'ヤクハイ バカゼ', han: 1, hanOpen: 1, stage: 1 },
  { id: 'seatWind', name: '役牌 自風', reading: 'ヤクハイ ジカゼ', han: 1, hanOpen: 1, stage: 1 },
  { id: 'pinfu', name: '平和', reading: 'ピンフ', han: 1, hanOpen: 0, stage: 1 },
  { id: 'iipeikou', name: '一盃口', reading: 'イーペーコー', han: 1, hanOpen: 0, stage: 2 },
  { id: 'chiitoitsu', name: '七対子', reading: 'チートイツ', han: 2, hanOpen: 0, stage: 2 },
  { id: 'honitsu', name: '混一色', reading: 'ホンイツ', han: 3, hanOpen: 2, stage: 2 },
  { id: 'toitoi', name: '対々和', reading: 'トイトイ', han: 2, hanOpen: 2, stage: 2 },
  { id: 'sanshoku', name: '三色同順', reading: 'サンショク', han: 2, hanOpen: 1, stage: 2 },
  { id: 'ittsu', name: '一気通貫', reading: 'イッツー', han: 2, hanOpen: 1, stage: 2 },
  { id: 'chinitsu', name: '清一色', reading: 'チンイツ', han: 6, hanOpen: 5, stage: 3 },
  { id: 'chanta', name: '混全帯么九', reading: 'チャンタ', han: 2, hanOpen: 1, stage: 3 },
  { id: 'sanankou', name: '三暗刻', reading: 'サンアンコー', han: 2, hanOpen: 2, stage: 3 },
  { id: 'shousangen', name: '小三元', reading: 'ショウサンゲン', han: 2, hanOpen: 2, stage: 3 },
  { id: 'junchan', name: '純全帯么九', reading: 'ジュンチャン', han: 3, hanOpen: 2, stage: 0 },
  { id: 'ryanpeikou', name: '二盃口', reading: 'リャンペーコー', han: 3, hanOpen: 0, stage: 0 },
  { id: 'honroutou', name: '混老頭', reading: 'ホンロウトウ', han: 2, hanOpen: 2, stage: 0 },
  { id: 'sankantsu', name: '三槓子', reading: 'サンカンツ', han: 2, hanOpen: 2, stage: 0 },
  { id: 'kokushi', name: '国士無双', reading: 'コクシムソウ', han: 13, hanOpen: 0, stage: 0, yakuman: true },
  { id: 'suuankou', name: '四暗刻', reading: 'スーアンコー', han: 13, hanOpen: 0, stage: 0, yakuman: true },
  { id: 'daisangen', name: '大三元', reading: 'ダイサンゲン', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'tsuuiisou', name: '字一色', reading: 'ツーイーソー', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'ryuuiisou', name: '緑一色', reading: 'リューイーソー', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'chinroutou', name: '清老頭', reading: 'チンロウトウ', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'shousuushii', name: '小四喜', reading: 'ショウスーシー', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'daisuushii', name: '大四喜', reading: 'ダイスーシー', han: 13, hanOpen: 13, stage: 0, yakuman: true },
  { id: 'chuuren', name: '九蓮宝燈', reading: 'チューレンポウトウ', han: 13, hanOpen: 0, stage: 0, yakuman: true },
];

export const YAKU: Record<YakuId, YakuDef> = Object.fromEntries(defs.map((d) => [d.id, d])) as Record<YakuId, YakuDef>;
export const YAKU_LIST: YakuDef[] = defs;

export function yakuOfStage(stage: 1 | 2 | 3): YakuDef[] {
  return defs.filter((d) => d.stage === stage);
}

/** その段階までに学ぶ役(累積) */
export function yakuUpToStage(stage: 1 | 2 | 3): YakuDef[] {
  return defs.filter((d) => d.stage >= 1 && d.stage <= stage);
}
