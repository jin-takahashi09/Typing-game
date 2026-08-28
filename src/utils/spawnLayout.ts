import { gameConfig } from '../config/gameConfig'

/**
 * 問題ユニット（日本語＋ローマ字＋手裏剣）の半高さの概算（ゲームエリア高さ %）。
 * 中心アンカー向け。長いほど大きくし、上端が HUD 下ラインより上に出ないようにする。
 */
export function estimateProjectileHalfHeightPercent(romajiLength: number): number {
  const len =
    typeof romajiLength === 'number' && Number.isFinite(romajiLength)
      ? Math.max(1, Math.floor(romajiLength))
      : 1
  const base = 6.5
  const perChar = 0.42
  return Math.min(15, Math.max(base, base + Math.max(0, len - 3) * perChar))
}

/**
 * HUD 下の表示開始ラインを上端として、ユニット中心の spawnY% を返す。
 * 画面外スポーンは行わない（常に startLine 以上）。
 */
export function computeSpawnYPercent(romajiLength: number): number {
  const startLine = gameConfig.spawnStartLineYPercent
  const half = estimateProjectileHalfHeightPercent(romajiLength)
  const spawnY = startLine + half
  // 着弾ライン手前までに十分な落下距離を残す
  return Math.min(spawnY, gameConfig.spawnYMaxPercent)
}
