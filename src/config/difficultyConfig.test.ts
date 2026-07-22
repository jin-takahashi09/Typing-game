import { describe, expect, it } from 'vitest'
import {
  difficultyConfigs,
  difficultyOrder,
  getDifficultyConfig,
} from './difficultyConfig'

describe('difficultyConfig', () => {
  it('defines exactly the three difficulty ids in order', () => {
    expect(difficultyOrder).toEqual(['trainee', 'ninja', 'master'])
  })

  it('has required fields and sensible relative balance', () => {
    const trainee = getDifficultyConfig('trainee')
    const ninja = getDifficultyConfig('ninja')
    const master = getDifficultyConfig('master')

    expect(trainee.displayName).toBe('修行生')
    expect(ninja.displayName).toBe('忍者')
    expect(master.displayName).toBe('忍頭')

    expect(trainee.fallSpeed).toBeLessThan(ninja.fallSpeed)
    expect(ninja.fallSpeed).toBeLessThan(master.fallSpeed)

    expect(trainee.spawnIntervalMs).toBeGreaterThan(ninja.spawnIntervalMs)
    expect(ninja.spawnIntervalMs).toBeGreaterThan(master.spawnIntervalMs)

    expect(trainee.maxActiveTargets).toBeLessThan(ninja.maxActiveTargets)
    expect(ninja.maxActiveTargets).toBeLessThan(master.maxActiveTargets)

    expect(trainee.missDamage).toBeLessThan(ninja.missDamage)
    expect(ninja.missDamage).toBeLessThan(master.missDamage)

    expect(trainee.showBeginnerGuide).toBe(true)
    expect(master.showBeginnerGuide).toBe(false)
  })

  it('keeps spawn interval floors below initial intervals', () => {
    for (const id of difficultyOrder) {
      const config = difficultyConfigs[id]
      expect(config.minSpawnIntervalMs).toBeLessThan(config.spawnIntervalMs)
      expect(config.minChars).toBeLessThanOrEqual(config.maxChars)
      expect(config.problemCategories.length).toBeGreaterThan(0)
    }
  })
})
