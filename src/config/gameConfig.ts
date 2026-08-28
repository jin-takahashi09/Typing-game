/** 難易度によらないゲーム共通定数 */
export const gameConfig = {
  maxHealth: 100,
  groundOffsetPx: 80,
  comboPopupThreshold: 5,
  hudStatsUpdateIntervalMs: 250,
  recentPlaysLimit: 50,
  storageKey: 'shinobi-keys-data',
  storageVersion: 3,
  /** rAF の異常に大きな delta を抑える上限（ms） */
  maxDeltaMs: 50,
  /** 撃破演出後にターゲットを削除するまでの猶予（ms）。次問生成は待たない */
  destroyRemoveDelayMs: 420,
  /** 被弾後の無敵時間（ms） */
  invulnerableMs: 700,
  /** ミスフィードバック表示時間（ms） */
  missFeedbackMs: 180,
  /** コンボスコア倍率の上限 */
  maxComboScoreMultiplier: 3,
  /**
   * 問題表示の上端ライン（ゲームエリア高さ %）。
   * HUD の下。ここより上に日本語・ローマ字が出ない。
   */
  spawnStartLineYPercent: 14,
  /** 中心 spawnY の上限（%）。着弾までの距離を確保 */
  spawnYMaxPercent: 36,
  /** @deprecated 画面内スポーンへ移行。互換のため残置 */
  spawnYPx: -56,
  /** 左右余白（%） */
  spawnSidePaddingPercent: 8,
} as const
