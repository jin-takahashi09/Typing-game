import { describe, expect, it } from 'vitest'
import {
  difficultyConfigs,
  difficultyOrder,
  getDifficultyConfig,
  getMaxActiveTargets,
} from './difficultyConfig'

describe('difficultyConfig (time-attack sushi-da)', () => {
  it('defines exactly the three difficulty ids in order', () => {
    expect(difficultyOrder).toEqual(['trainee', 'ninja', 'master'])
  })

  it('has time limits and fall-speed-only difficulty', () => {
    const trainee = getDifficultyConfig('trainee')
    const ninja = getDifficultyConfig('ninja')
    const master = getDifficultyConfig('master')

    expect(trainee.displayName).toBe('修行生')
    expect(ninja.displayName).toBe('忍者')
    expect(master.displayName).toBe('忍頭')

    expect(trainee.timeLimitSeconds).toBe(60)
    expect(ninja.timeLimitSeconds).toBe(90)
    expect(master.timeLimitSeconds).toBe(120)

    expect(trainee.fallSpeed).toBeLessThan(ninja.fallSpeed)
    expect(ninja.fallSpeed).toBeLessThan(master.fallSpeed)

    expect(trainee.maxActiveTargets).toBe(1)
    expect(ninja.maxActiveTargets).toBe(1)
    expect(master.maxActiveTargets).toBe(1)
    expect(getMaxActiveTargets(trainee)).toBe(1)

    expect(trainee.maxChars).toBeLessThanOrEqual(ninja.maxChars)
    expect(ninja.maxChars).toBeLessThanOrEqual(master.maxChars)

    expect(trainee.description).not.toMatch(/ステージ/)
    expect(ninja.description).not.toMatch(/ステージ/)
    expect(master.description).not.toMatch(/ステージ/)
  })

  it('keeps problem ranges and coin milestones', () => {
    for (const id of difficultyOrder) {
      const config = difficultyConfigs[id]
      expect(config.minChars).toBeLessThanOrEqual(config.maxChars)
      expect(config.problemCategories.length).toBeGreaterThan(0)
      expect(config.coinMilestoneEvery).toBeGreaterThan(0)
      expect(config.fallSpeed).toBeGreaterThan(0)
      expect(config.timeLimitSeconds).toBeGreaterThan(0)
    }
  })
})
