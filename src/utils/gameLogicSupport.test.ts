import { describe, expect, it } from 'vitest'
import { getDifficultyConfig } from '../config/difficultyConfig'
import {
  canSpawnTarget,
  createTarget,
  getSpawnIntervalMs,
} from '../features/game/targetSpawner'
import { selectTypingProblem } from './selectTypingProblem'
import {
  findLockCandidates,
  findMostDangerousTargetId,
} from '../features/game/gameLogic'
import type { GameTarget } from '../types/game'
import { createRomajiMatchState } from './romajiMatcher'

function makeTarget(overrides: Partial<GameTarget> = {}): GameTarget {
  const matchState = createRomajiMatchState()

  return {
    id: 'a',
    problemId: '1',
    displayText: 'ねこ',
    reading: 'ねこ',
    displayRomaji: 'neko',
    romajiPatterns: ['neko'],
    matchState,
    typedLength: 0,
    xPercent: 20,
    yPosition: 10,
    speed: 1,
    state: 'falling',
    baseScore: 10,
    ...overrides,
  }
}

describe('targetSpawner and selection', () => {
  it('does not allow spawning beyond max active targets', () => {
    expect(canSpawnTarget(2, 3)).toBe(true)
    expect(canSpawnTarget(3, 3)).toBe(false)
  })

  it('keeps spawn interval above the configured minimum', () => {
    const config = getDifficultyConfig('master')
    const interval = getSpawnIntervalMs(config, 50)
    expect(interval).toBe(config.minSpawnIntervalMs)
  })

  it('selects problems only for the requested difficulty', () => {
    const config = getDifficultyConfig('trainee')
    for (let i = 0; i < 20; i += 1) {
      const problem = selectTypingProblem({
        difficulty: 'trainee',
        config,
        lastProblemId: 'tr-neko',
        random: () => 0.42,
      })
      expect(problem.difficulty).toBe('trainee')
      expect(problem.id).not.toBe('tr-neko')
    }
  })

  it('creates targets within horizontal padding', () => {
    const config = getDifficultyConfig('ninja')
    const problem = selectTypingProblem({
      difficulty: 'ninja',
      config,
      random: () => 0.1,
    })
    const target = createTarget({
      problem,
      speed: 1,
      existingXPercents: [20, 50, 80],
      random: () => 0.5,
      idFactory: () => 'fixed',
    })
    expect(target.xPercent).toBeGreaterThanOrEqual(8)
    expect(target.xPercent).toBeLessThanOrEqual(92)
    expect(target.displayRomaji).toBe(problem.romajiPatterns[0]?.toLowerCase())
  })
})

describe('lock-on danger selection', () => {
  const targets: GameTarget[] = [
    makeTarget({ id: 'a', displayText: 'ねこ', displayRomaji: 'neko', romajiPatterns: ['neko'] }),
    makeTarget({
      id: 'b',
      problemId: '2',
      displayText: 'なみ',
      reading: 'なみ',
      displayRomaji: 'nami',
      romajiPatterns: ['nami'],
      xPercent: 60,
    }),
  ]

  it('picks the lowest matching target using targetsRef y values', () => {
    const candidates = findLockCandidates(targets, 'n')
    expect(candidates).toHaveLength(2)
    const chosen = findMostDangerousTargetId(
      candidates,
      new Map([
        ['a', 40],
        ['b', 120],
      ]),
    )
    expect(chosen).toBe('b')
  })
})
