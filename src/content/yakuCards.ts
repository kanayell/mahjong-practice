// 役ごとの「1分で分かる解説カード」
import type { YakuId } from '../core/yaku/definitions';

export type CardId =
  | 'riichi'
  | 'menzenTsumo'
  | 'tanyao'
  | 'yakuhai'
  | 'pinfu'
  | 'iipeikou'
  | 'chiitoitsu'
  | 'honitsu'
  | 'toitoi'
  | 'sanshoku'
  | 'ittsu'
  | 'chinitsu'
  | 'chanta'
  | 'sanankou'
  | 'shousangen';

export interface CardExample {
  concealed: string;
  win: string;
  melds?: { type: 'chi' | 'pon'; tiles: string }[];
  isTsumo?: boolean;
  isRiichi?: boolean;
  roundWind?: 'east' | 'south';
  seatWind?: 'east' | 'south' | 'west' | 'north';
  note: string;
}

export interface YakuCard {
  id: CardId;
  name: string;
  reading: string;
  stage: 1 | 2 | 3;
  hanText: string;
  /** 鳴いてもOKか */
  openText: string;
  openOk: boolean;
  /** 条件(一言) */
  summary: string;
  conditions: string[];
  mistakes: string[];
  example: CardExample;
}

export const YAKU_CARDS: YakuCard[] = [
  {
    id: 'riichi',
    name: '立直',
    reading: 'リーチ',
    stage: 1,
    hanText: '1翻',
    openOk: false,
    openText: '鳴いているとかけられない',
    summary: '鳴かずにテンパイしたら「リーチ」と宣言する。',
    conditions: ['門前(鳴いていない)でテンパイしている', '持ち点が1000点以上ある(1000点棒を出す)', '宣言した後は、手牌を変えられない(引いた牌が和了牌でなければそのまま捨てる)'],
    mistakes: ['リーチ後に待ちを変えることはできない。', 'リーチ後に和了牌を見逃すと、その後はロンできない(フリテン)。', '暗槓(アンカン)をしていてもリーチはできる。'],
    example: { concealed: '13m456789p234s99s', win: '2m', isRiichi: true, note: '他に役がなくても、リーチをかけていれば和了れる。' },
  },
  {
    id: 'menzenTsumo',
    name: '門前清自摸和',
    reading: 'メンゼンツモ',
    stage: 1,
    hanText: '1翻',
    openOk: false,
    openText: '鳴いているとつかない',
    summary: '鳴かずに、自分で引いた牌(ツモ)で和了る。',
    conditions: ['門前(鳴いていない)', 'ツモで和了る(ロンではつかない)'],
    mistakes: ['ロン和了ではつかない。', '鳴いた手でツモってもつかない。', 'リーチしていなくても、門前でツモればこれだけで和了れる。'],
    example: { concealed: '13m456789p234s99s', win: '2m', isTsumo: true, note: '役のない門前の手も、ツモればこの役で和了れる。' },
  },
  {
    id: 'tanyao',
    name: '断么九',
    reading: 'タンヤオ',
    stage: 1,
    hanText: '1翻',
    openOk: true,
    openText: '鳴いてもOK(喰いタン)',
    summary: '2〜8の数牌だけで作る。',
    conditions: ['手牌14枚すべてが2〜8の数牌', '1・9・字牌(么九牌 ヤオチューハイ)を1枚も使わない'],
    mistakes: ['雀頭や鳴いた面子にも1・9・字牌があってはいけない。', '鳴いたタンヤオ(喰いタン)は、ルールで禁止している場もある。最初に確認すると安心。'],
    example: { concealed: '234m456p678s345s5p', win: '5p', note: 'すべて2〜8の牌。' },
  },
  {
    id: 'yakuhai',
    name: '役牌',
    reading: 'ヤクハイ',
    stage: 1,
    hanText: '1翻(1組ごと)',
    openOk: true,
    openText: '鳴いてもOK(ポンしてよい)',
    summary: '白・發・中、場風、自風のどれかを3枚(刻子)そろえる。',
    conditions: ['白・發・中の刻子:それぞれ1翻', '場風(東場なら東)の刻子:1翻', '自風(自分の席の風)の刻子:1翻', '場風と自風が同じなら2翻(ダブ東など)'],
    mistakes: ['2枚(雀頭)だけでは役にならない。必ず3枚。', '自分の風でも場の風でもない風牌(オタカゼ)は、3枚あっても役にならない。', '鳴いてもつくので、「鳴いた後の役」として一番よく使う。'],
    example: { concealed: '234m567p345s8s', win: '8s', melds: [{ type: 'pon', tiles: '777z' }], note: '中をポンしているので、それだけで役がある。' },
  },
  {
    id: 'pinfu',
    name: '平和',
    reading: 'ピンフ',
    stage: 1,
    hanText: '1翻',
    openOk: false,
    openText: '鳴いているとつかない',
    summary: '順子だけで作り、両面待ちで和了る。',
    conditions: ['門前(鳴いていない)', '4つの面子がすべて順子', '雀頭が役牌(白發中・場風・自風)ではない', '最後の待ちが両面(リャンメン)待ち'],
    mistakes: ['嵌張・辺張・単騎待ちではつかない(両面と解釈できる時はつく)。', '雀頭が役牌だとつかない。', 'ツモでもつく(メンゼンツモと一緒につく)。'],
    example: { concealed: '23m456789p234s55s', win: '1m', note: '順子4つ+役牌でない雀頭、2・3萬の両面待ち。' },
  },
  {
    id: 'iipeikou',
    name: '一盃口',
    reading: 'イーペーコー',
    stage: 2,
    hanText: '1翻',
    openOk: false,
    openText: '鳴いているとつかない',
    summary: '同じ種類・同じ数字の順子を2組作る。',
    conditions: ['門前(鳴いていない)', 'まったく同じ順子が2組(例:1・2・3萬が2組)'],
    mistakes: ['違う種類の同じ数字(1・2・3萬と1・2・3筒)は一盃口ではない(三色同順の一部)。', '鳴くとつかない。', '同じ順子が2組×2なら二盃口(リャンペーコー、3翻)になる。'],
    example: { concealed: '112233m456p78s99s', win: '6s', note: '1・2・3萬が2組。両面待ちなので平和もつく。' },
  },
  {
    id: 'chiitoitsu',
    name: '七対子',
    reading: 'チートイツ',
    stage: 2,
    hanText: '2翻',
    openOk: false,
    openText: '鳴いているとできない',
    summary: '2枚1組の対子を7組そろえる特別な形。',
    conditions: ['門前(鳴いていない)', '違う種類の対子が7組'],
    mistakes: ['同じ牌4枚を「2組」と数えることはできない。', '待ちは必ず単騎(1枚だけの牌と同じ牌を待つ)。', '4面子1雀頭の形ではないので、平和や一盃口とは一緒につかない。'],
    example: { concealed: '1133m557p99s1122z', win: '7p', note: '対子7組。' },
  },
  {
    id: 'honitsu',
    name: '混一色',
    reading: 'ホンイツ',
    stage: 2,
    hanText: '3翻(鳴くと2翻)',
    openOk: true,
    openText: '鳴いてもOK(1翻下がる)',
    summary: '1種類の数牌と字牌だけで作る。',
    conditions: ['数牌は萬子・筒子・索子のうち1種類だけ', '字牌を1枚以上使う'],
    mistakes: ['字牌がないと清一色(チンイツ)になる。', '鳴いても成立するが、翻数が1つ下がる(喰い下がり)。'],
    example: {
      concealed: '123m456m99m11z',
      win: '1z',
      melds: [{ type: 'chi', tiles: '345m' }],
      roundWind: 'south',
      seatWind: 'west',
      note: '萬子と字牌だけ。チーしているので2翻。',
    },
  },
  {
    id: 'toitoi',
    name: '対々和',
    reading: 'トイトイ',
    stage: 2,
    hanText: '2翻',
    openOk: true,
    openText: '鳴いてもOK(翻数も同じ)',
    summary: '4つの面子をすべて刻子(同じ牌3枚)にする。',
    conditions: ['4つの面子がすべて刻子(または槓子)'],
    mistakes: ['順子が1つでもあるとつかない。', 'ポンを何回してもよい。', '鳴かずに刻子4つなら四暗刻(役満)の可能性がある。'],
    example: { concealed: '444p666s88m33s', win: '3s', melds: [{ type: 'pon', tiles: '222m' }], note: '刻子4つ。すべて2〜8なのでタンヤオもつく。' },
  },
  {
    id: 'sanshoku',
    name: '三色同順',
    reading: 'サンショク',
    stage: 2,
    hanText: '2翻(鳴くと1翻)',
    openOk: true,
    openText: '鳴いてもOK(1翻下がる)',
    summary: '萬子・筒子・索子で、同じ数字の順子を作る。',
    conditions: ['同じ数字の順子が萬子・筒子・索子にそろっている(例:1・2・3萬、1・2・3筒、1・2・3索)'],
    mistakes: ['数字が1つでもずれているとつかない。', '同じ種類の順子2組(一盃口)とは別の役。'],
    example: { concealed: '123m123p123s456s9m', win: '9m', note: '1・2・3が萬・筒・索にそろっている。' },
  },
  {
    id: 'ittsu',
    name: '一気通貫',
    reading: 'イッツー',
    stage: 2,
    hanText: '2翻(鳴くと1翻)',
    openOk: true,
    openText: '鳴いてもOK(1翻下がる)',
    summary: '1種類の数牌で、1〜9を順子3つでつなげる。',
    conditions: ['同じ種類で 1・2・3、4・5・6、7・8・9 の3つの順子がある'],
    mistakes: ['違う種類を混ぜて1〜9にしてもつかない。', '2・3・4、5・6・7、…のように区切りがずれるとつかない。'],
    example: { concealed: '123456789m45p11s', win: '3p', note: '萬子で1〜9。両面待ちなので平和もつく。' },
  },
  {
    id: 'chinitsu',
    name: '清一色',
    reading: 'チンイツ',
    stage: 3,
    hanText: '6翻(鳴くと5翻)',
    openOk: true,
    openText: '鳴いてもOK(1翻下がる)',
    summary: '1種類の数牌だけで作る。字牌も使わない。',
    conditions: ['14枚すべてが萬子・筒子・索子のうち1種類'],
    mistakes: ['字牌が1枚でもあると混一色になる。', '待ちが複雑になりやすい。待ち当てクイズのLv3で練習しよう。'],
    example: { concealed: '234m456m678m88m99m', win: '8m', note: 'すべて萬子。' },
  },
  {
    id: 'chanta',
    name: '混全帯么九',
    reading: 'チャンタ',
    stage: 3,
    hanText: '2翻(鳴くと1翻)',
    openOk: true,
    openText: '鳴いてもOK(1翻下がる)',
    summary: 'すべての面子と雀頭に、1・9・字牌を含める。',
    conditions: ['4つの面子と雀頭のすべてに1・9・字牌が入っている', '順子を1つ以上使う', '字牌を1枚以上使う'],
    mistakes: ['字牌がなければ純全帯么九(ジュンチャン、3翻)になる。', '順子は1・2・3か7・8・9だけが使える。'],
    example: { concealed: '123m789p333z99s78s', win: '9s', note: 'どの組にも1・9・字牌が入っている。' },
  },
  {
    id: 'sanankou',
    name: '三暗刻',
    reading: 'サンアンコー',
    stage: 3,
    hanText: '2翻',
    openOk: true,
    openText: '他の面子は鳴いてもOK',
    summary: '鳴かずに自分で揃えた刻子(暗刻)を3つ作る。',
    conditions: ['暗刻(自分で揃えた刻子)が3つ'],
    mistakes: ['シャンポン待ちをロンで和了ると、その刻子は暗刻に数えない(ツモならOK)。', 'ポンした刻子は暗刻ではない。'],
    example: { concealed: '111m222p333s45m99s', win: '3m', note: '1萬・2筒・3索の暗刻。順子側で和了ったのでロンでもOK。' },
  },
  {
    id: 'shousangen',
    name: '小三元',
    reading: 'ショウサンゲン',
    stage: 3,
    hanText: '2翻(+役牌2翻で実質4翻)',
    openOk: true,
    openText: '鳴いてもOK',
    summary: '白・發・中のうち2つを刻子、残り1つを雀頭にする。',
    conditions: ['三元牌(白・發・中)の刻子が2つ', '残りの三元牌が雀頭'],
    mistakes: ['刻子2つの分の役牌(1翻×2)も一緒につく。', '3つとも刻子なら大三元(役満)。'],
    example: { concealed: '555z666z77z123m45p', win: '3p', note: '白・發が刻子、中が雀頭。' },
  },
];

export function cardOf(id: YakuId): YakuCard | undefined {
  const cardId: CardId | undefined = ['yakuhaiHaku', 'yakuhaiHatsu', 'yakuhaiChun', 'roundWind', 'seatWind'].includes(id)
    ? 'yakuhai'
    : (YAKU_CARDS.find((c) => c.id === id)?.id as CardId | undefined);
  return YAKU_CARDS.find((c) => c.id === cardId);
}

/** ドラの説明(役ではないことを強調) */
export const DORA_NOTE = {
  title: 'ドラは役ではありません',
  lines: [
    'ドラは「ドラ表示牌」の次の牌です(例:表示牌が3萬ならドラは4萬。9の次は1、北の次は東、中の次は白)。',
    '赤い5(赤ドラ)もドラと同じ扱いです。',
    'ドラを持って和了ると点数が増えますが、ドラは役ではありません。役が1つもなければ、ドラが何枚あっても和了れません。',
  ],
};
