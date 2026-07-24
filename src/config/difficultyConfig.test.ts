import { describe, expect, it } from 'vitest'
import {
  difficultyConfigs,
  difficultyOrder,
  getDifficultyConfig,
  getFallSpeedForStage,
  getMaxActiveTargetsForStage,
  getSpawnIntervalForStage,
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

    expect(trainee.timeLimitSeconds).toBe(60)
    expect(ninja.timeLimitSeconds).toBe(90)
    expect(master.timeLimitSeconds).toBe(120)

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
      expect(config.maxFallSpeed).toBeGreaterThan(config.fallSpeed)
      expect(config.maxActiveTargetsCap).toBeGreaterThanOrEqual(
        config.maxActiveTargets,
      )
    }
  })

  it('raises fall speed with stage but respects the cap', () => {
    const config = getDifficultyConfig('ninja')
    const stage1 = getFallSpeedForStage(config, 1)
    const stage5 = getFallSpeedForStage(config, 5)
    const stage99 = getFallSpeedForStage(config, 99)
    expect(stage5).toBeGreaterThan(stage1)
    expect(stage99).toBe(config.maxFallSpeed)
  })

  it('shortens spawn interval with stage but respects the floor', () => {
    const config = getDifficultyConfig('master')
    expect(getSpawnIntervalForStage(config, 1)).toBe(config.spawnIntervalMs)
    expect(getSpawnIntervalForStage(config, 50)).toBe(config.minSpawnIntervalMs)
  })

  it('raises max active targets with stage but respects the cap', () => {
    const config = getDifficultyConfig('trainee')
    expect(getMaxActiveTargetsForStage(config, 1)).toBe(config.maxActiveTargets)
    expect(getMaxActiveTargetsForStage(config, 3)).toBeGreaterThan(
      config.maxActiveTargets,
    )
    expect(getMaxActiveTargetsForStage(config, 99)).toBe(
      config.maxActiveTargetsCap,
    )
  })
})
