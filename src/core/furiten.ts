// フリテン判定
// 自分の待ち牌のどれか1つでも自分で捨てていたら、ロンで和了れない(ツモならOK)。
import type { TileKind } from './tile';

export function isFuriten(waitTiles: TileKind[], discards: TileKind[]): boolean {
  return furitenTiles(waitTiles, discards).length > 0;
}

/** 待ち牌のうち、自分で捨てている牌 */
export function furitenTiles(waitTiles: TileKind[], discards: TileKind[]): TileKind[] {
  const d = new Set(discards);
  return waitTiles.filter((t) => d.has(t));
}
