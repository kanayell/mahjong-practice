// 「今日の練習」に出す前向きなコメント
// 問題数に応じて段階的に変わる。正解率が低くても責めるような言い方はしない。

export interface TodayMessage {
  /** 一言(太字で出す) */
  title: string;
  /** 添える一文 */
  text: string;
}

export function todayMessage(total: number, correct: number, streak: number): TodayMessage {
  const rate = total > 0 ? correct / total : 0;
  const goodRate = total >= 5 && rate >= 0.8 ? `正解率${Math.round(rate * 100)}%、お見事です。` : '';

  if (total === 0) {
    if (streak > 0) return { title: `${streak}日連続で練習中!`, text: '今日も1問だけ解いて、記録をのばしましょう。' };
    return { title: 'まずは1問から', text: '1問30秒ほど。すきま時間にどうぞ。' };
  }
  if (total < 5) return { title: 'いいスタート!', text: `あと${5 - total}問で5問達成。この調子で。` };
  if (total < 10) return { title: 'いい感じ!', text: goodRate || `手が慣れてきたころです。あと${10 - total}問で10問達成。` };
  if (total < 20) return { title: 'すばらしい!', text: goodRate || '今日は10問以上。この積み重ねが卓で効いてきます。' };
  if (total < 50) return { title: '絶好調!', text: goodRate || '20問以上がんばりました。次の対局が楽しみですね。' };
  return { title: '練習の達人!', text: '今日はもう50問以上。しっかり休むのも上達のうちです。' };
}
