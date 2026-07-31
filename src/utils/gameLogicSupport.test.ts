import { describe, expect, it } from 'vitest'
import { getDifficultyConfig } from '../config/difficultyConfig'
import { canSpawnMore } from '../features/game/projectileSpawner'
import { selectTypingProblem } from './selectTypingProblem'
import {
  findLockCandidates,
  findMostDangerousProjectileId,
  isTypingKey,
} from '../features/game/gameLogic'
import type { EnemyProjectile } from '../types/projectile'
import { createRomajiMatchState } from './romajiMatcher'

function makeProjectile(
  overrides: Partial<EnemyProjectile> = {},
): EnemyProjectile {
  return {
    id: 'a',
    problemId: '1',
    displayText: 'ねこ',
    reading: 'ねこ',
    displayRomaji: 'neko',
    romajiPatterns: ['neko'],
    matchState: createRomajiMatchState(),
    typedLength: 0,
    spawnX: 50,
    spawnY: -6,
    velocityX: 0,
    velocityY: 1,
    speed: 0.05,
    trajectory: 'straight',
    size: 'normal',
    damage: 10,
    spawnTimeMs: 0,
    flightDurationMs: 4000,
    estimatedImpactTimeMs: 4000,
    state: 'incoming',
    resolveAction: null,
    baseScore: 10,
    ...overrides,
  }
}

describe('projectile spawn limits and problem selection', () => {
  it('does not allow spawning beyond max active projectiles', () => {
    expect(canSpawnMore(2, 3)).toBe(true)
    expect(canSpawnMore(3, 3)).toBe(false)
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
})

describe('lock-on danger selection', () => {
  const projectiles: EnemyProjectile[] = [
    makeProjectile({
      id: 'a',
      displayText: 'ねこ',
      displayRomaji: 'neko',
      romajiPatterns: ['neko'],
      estimatedImpactTimeMs: 5000,
    }),
    makeProjectile({
      id: 'b',
      problemId: '2',
      displayText: 'なみ',
      reading: 'なみ',
      displayRomaji: 'nami',
      romajiPatterns: ['nami'],
      estimatedImpactTimeMs: 2500,
      damage: 12,
    }),
  ]

  it('picks the earliest ETA matching projectile', () => {
    const candidates = findLockCandidates(projectiles, 'n')
    expect(candidates).toHaveLength(2)
    expect(findMostDangerousProjectileId(candidates)).toBe('b')
  })
})

describe('keyboard typing keys', () => {
  it('accepts letters and hyphen, rejects space and arrows as typing keys', () => {
    expect(isTypingKey('a')).toBe(true)
    expect(isTypingKey('-')).toBe(true)
    expect(isTypingKey(' ')).toBe(false)
    expect(isTypingKey('ArrowUp')).toBe(false)
    expect(isTypingKey('ArrowDown')).toBe(false)
    expect(isTypingKey('w')).toBe(true)
    expect(isTypingKey('s')).toBe(true)
  })
})
