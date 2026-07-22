import { describe, expect, it } from 'vitest'
import {
  calculateScore,
  clampDefense,
  getComboScoreMultiplier,
} from './calculateScore'
import { gameConfig } from '../config/gameConfig'

describe('calculateScore', () => {
  it('multiplies base score by difficulty and combo factors', () => {
    const score = calculateScore({
      baseScore: 100,
      difficultyMultiplier: 1.25,
      combo: 1,
      comboMultiplier: 1.5,
    })
    expect(score).toBe(125)
  })

  it('raises combo multiplier with a hard cap', () => {
    expect(getComboScoreMultiplier(1, 2)).toBe(1)
    expect(getComboScoreMultiplier(5, 2)).toBeGreaterThan(1)
    expect(
      getComboScoreMultiplier(100, 2, gameConfig.maxComboScoreMultiplier),
    ).toBe(gameConfig.maxComboScoreMultiplier)
  })

  it('clamps defense between 0 and max', () => {
    expect(clampDefense(-5)).toBe(0)
    expect(clampDefense(150)).toBe(gameConfig.maxHealth)
    expect(clampDefense(40)).toBe(40)
  })
})
