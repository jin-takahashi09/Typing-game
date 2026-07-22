/** 難易度によらないゲーム共通定数 */
export const gameConfig = {
  maxHealth: 100,
  groundOffsetPx: 80,
  comboPopupThreshold: 5,
  hudStatsUpdateIntervalMs: 250,
  recentPlaysLimit: 50,
  storageKey: 'shinobi-keys-data',
  storageVersion: 1,
  /** rAF の異常に大きな delta を抑える上限（ms） */
  maxDeltaMs: 50,
  /** 撃破演出後にターゲットを削除するまでの猶予（ms） */
  destroyRemoveDelayMs: 320,
  /** ミスフィードバック表示時間（ms） */
  missFeedbackMs: 180,
  /** コンボスコア倍率の上限 */
  maxComboScoreMultiplier: 3,
  /** ターゲット初期 Y（画面上外） */
  spawnYPx: -56,
  /** 左右余白（%） */
  spawnSidePaddingPercent: 8,
} as const
