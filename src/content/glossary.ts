// 用語集(ふりがな+短い説明)
export interface GlossaryEntry {
  term: string;
  reading: string;
  short: string;
}

export const GLOSSARY = {
  tenpai: { term: '聴牌', reading: 'テンパイ', short: 'あと1枚で和了れる状態。' },
  machi: { term: '待ち', reading: 'まち', short: 'テンパイの時に、来れば和了れる牌のこと。' },
  mentsu: { term: '面子', reading: 'メンツ', short: '3枚1組のまとまり。順子か刻子のどちらか。' },
  jantou: { term: '雀頭', reading: 'ジャントウ', short: '和了に必要な同じ牌2枚の組。「アタマ」とも言う。' },
  shuntsu: { term: '順子', reading: 'シュンツ', short: '同じ種類の数牌が3つ連続した組(例:3・4・5萬)。字牌ではできない。' },
  koutsu: { term: '刻子', reading: 'コーツ', short: '同じ牌3枚の組(例:東・東・東)。' },
  toitsu: { term: '対子', reading: 'トイツ', short: '同じ牌2枚の組。' },
  ryanmen: { term: '両面', reading: 'リャンメン', short: '連続した2枚(例:4・5)の両側(3と6)を待つ形。待ちが2種類あって有利。' },
  kanchan: { term: '嵌張', reading: 'カンチャン', short: '1つ飛ばしの2枚(例:4・6)の真ん中(5)を待つ形。' },
  penchan: { term: '辺張', reading: 'ペンチャン', short: '端の2枚(1・2 か 8・9)で、3 か 7 の1種類だけを待つ形。' },
  tanki: { term: '単騎', reading: 'タンキ', short: '1枚だけ浮いた牌と同じ牌を待ち、雀頭を作る形。' },
  shanpon: { term: 'シャンポン', reading: 'シャンポン', short: '対子が2組あり、どちらかが刻子になるのを待つ形。' },
  sanmenchan: { term: '三面張', reading: 'サンメンチャン', short: '5枚の連続(例:3〜7)などで、3種類の牌を待つ形。' },
  menzen: { term: '門前', reading: 'メンゼン', short: 'チー・ポン・明槓(ミンカン)をしていない状態。暗槓(アンカン)はしていても門前。' },
  naki: { term: '鳴き', reading: 'なき', short: '他の人が捨てた牌をもらうこと(チー・ポン・カン)。鳴くと門前ではなくなる。' },
  tsumo: { term: 'ツモ', reading: 'ツモ', short: '自分で山から引いた牌で和了ること。' },
  ron: { term: 'ロン', reading: 'ロン', short: '他の人が捨てた牌で和了ること。' },
  bakaze: { term: '場風', reading: 'バカゼ', short: 'その局の風。東場なら東、南場なら南。場風の刻子は役牌になる。' },
  jikaze: { term: '自風', reading: 'ジカゼ', short: '自分の席の風。親が東家で、そこから反時計回りに南家・西家・北家。' },
  yakuhai: { term: '役牌', reading: 'ヤクハイ', short: '白・發・中、場風、自風のこと。この牌の刻子があれば1翻つく。' },
  ankou: { term: '暗刻', reading: 'アンコー', short: '鳴かずに自分で揃えた刻子。ロンで完成した刻子は暗刻に数えない。' },
  han: { term: '翻', reading: 'ハン', short: '役の点数の単位。翻が多いほど点数が高い。' },
  dora: { term: 'ドラ', reading: 'ドラ', short: 'ドラ表示牌の次の牌。持っていると点数が増えるが、役ではない(ドラだけでは和了れない)。' },
  akadora: { term: '赤ドラ', reading: 'あかドラ', short: '赤い5の牌。ドラと同じく点数が増えるだけで、役ではない。' },
  wakare: { term: '分解', reading: 'ぶんかい', short: '手牌を面子と雀頭に分けること。同じ手でも分け方が何通りもあることがある。' },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
