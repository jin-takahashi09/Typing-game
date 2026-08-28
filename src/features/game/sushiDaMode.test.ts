import { describe, expect, it } from 'vitest'
import {
  computeSuccessRate,
  shouldAwardCoinMilestone,
  coinMilestoneIndex,
} from './gameLogic'
import { computeFallDurationMs } from '../../utils/fallingProjectileMotion'
import { getDifficultyConfig } from '../../config/difficultyConfig'
import { canSpawnMore } from './projectileSpawner'

describe('sushi-da game rules', () => {
  it('ends conceptually on timeout only (success rate helpers)', () => {
    expect(computeSuccessRate(8, 2)).toBe(80)
    expect(computeSuccessRate(0, 0)).toBe(100)
    expect(computeSuccessRate(0, 3)).toBe(0)
  })

  it('awards coin milestones without stages', () => {
    expect(shouldAwardCoinMilestone(8, 8)).toBe(true)
    expect(shouldAwardCoinMilestone(7, 8)).toBe(false)
    expect(coinMilestoneIndex(16, 8)).toBe(2)
  })

  it('never allows more than one active spawn slot', () => {
    expect(canSpawnMore(0, 1)).toBe(true)
    expect(canSpawnMore(1, 1)).toBe(false)
    expect(canSpawnMore(2, 1)).toBe(false)
  })

  it('trainee is slower than ninja, master is faster', () => {
    const trainee = getDifficultyConfig('trainee')
    const ninja = getDifficultyConfig('ninja')
    const master = getDifficultyConfig('master')
    const input = {
      romajiLength: 6,
      trajectory: 'straight' as const,
      size: 'normal' as const,
    }
    const t = computeFallDurationMs({ ...input, fallSpeed: trainee.fallSpeed })
    const n = computeFallDurationMs({ ...input, fallSpeed: ninja.fallSpeed })
    const m = computeFallDurationMs({ ...input, fallSpeed: master.fallSpeed })
    expect(t).toBeGreaterThan(n)
    expect(n).toBeGreaterThan(m)
    // 修行生はかなり遅い / 忍頭は速い
    expect(t / n).toBeGreaterThan(1.4)
    expect(n / m).toBeGreaterThan(1.2)
  })

  it('has no stage-scaling fields on difficulty config', () => {
    for (const id of ['trainee', 'ninja', 'master'] as const) {
      const config = getDifficultyConfig(id)
      expect(config).not.toHaveProperty('stageUpCondition')
      expect(config).not.toHaveProperty('fallSpeedPerStage')
      expect(config).not.toHaveProperty('maxActiveTargetsIncreaseEveryStages')
    }
  })
})
