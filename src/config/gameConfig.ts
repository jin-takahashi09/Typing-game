/** 難易度によらないゲーム共通定数 */
export const gameConfig = {
  maxHealth: 100,
  groundOffsetPx: 80,
  comboPopupThreshold: 5,
  hudStatsUpdateIntervalMs: 250,
  recentPlaysLimit: 50,
  storageKey: 'shinobi-keys-data',
  storageVersion: 1,
} as const
