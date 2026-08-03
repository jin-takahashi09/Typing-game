/**
 * 落下ラベル幅に応じて出現 X% を中央寄りへ制限する。
 * 長いローマ字が左右端ではみ出さないようにする。
 */
export function clampSpawnXForRomajiLabel(
  spawnX: number,
  romajiLength: number,
): number {
  const x =
    typeof spawnX === 'number' && Number.isFinite(spawnX) ? spawnX : 50
  const len =
    typeof romajiLength === 'number' && Number.isFinite(romajiLength)
      ? Math.max(0, Math.floor(romajiLength))
      : 0

  let edgeMargin = 14
  if (len >= 18) edgeMargin = 32
  else if (len >= 14) edgeMargin = 26
  else if (len >= 10) edgeMargin = 20
  else if (len >= 7) edgeMargin = 16

  return Math.min(100 - edgeMargin, Math.max(edgeMargin, x))
}

/** ローマ字長に応じた表示サイズ段階 */
export function romajiLengthTier(
  romajiLength: number,
): 'short' | 'medium' | 'long' {
  const len =
    typeof romajiLength === 'number' && Number.isFinite(romajiLength)
      ? Math.max(0, Math.floor(romajiLength))
      : 0
  if (len <= 6) return 'short'
  if (len <= 12) return 'medium'
  return 'long'
}
