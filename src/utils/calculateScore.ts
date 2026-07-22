import { gameConfig } from '../config/gameConfig'

export interface ScoreInput {
  baseScore: number
  difficultyMultiplier: number
  combo: number
  comboMultiplier: number
  maxComboScoreMultiplier?: number
}

/** コンボ数に応じたスコア倍率（上限あり） */
export function getComboScoreMultiplier(
  combo: number,
  comboMultiplier: number,
  maxComboScoreMultiplier: number = gameConfig.maxComboScoreMultiplier,
): number {
  if (combo <= 1) {
    return 1
  }
  const growth = (combo - 1) * (comboMultiplier * 0.2)
  return Math.min(maxComboScoreMultiplier, 1 + growth)
}

export function calculateScore(input: ScoreInput): number {
  const comboFactor = getComboScoreMultiplier(
    input.combo,
    input.comboMultiplier,
    input.maxComboScoreMultiplier,
  )
  return Math.floor(
    input.baseScore * input.difficultyMultiplier * comboFactor,
  )
}

export function clampDefense(
  value: number,
  maxDefense: number = gameConfig.maxHealth,
): number {
  return Math.max(0, Math.min(maxDefense, value))
}
