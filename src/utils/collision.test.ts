import { describe, expect, it } from 'vitest'
import {
  canProjectileDamagePlayer,
  isProjectileHittingPlayer,
} from './collision'
import { createRomajiMatchState } from './romajiMatcher'
import type { EnemyProjectile } from '../types/projectile'
import { PLAYER_X_PERCENT } from '../types/projectile'

function makeProjectile(
  overrides: Partial<EnemyProjectile> = {},
): EnemyProjectile {
  return {
    id: 'p1',
    problemId: 'prob',
    displayText: 'ねこ',
    reading: 'ねこ',
    displayRomaji: 'neko',
    romajiPatterns: ['neko'],
    matchState: createRomajiMatchState(),
    typedLength: 0,
    baseScore: 100,
    spawnX: 50,
    spawnY: 0,
    velocityX: 0,
    velocityY: 1,
    speed: 1,
    trajectory: 'straight',
    size: 'normal',
    damage: 10,
    spawnTimeMs: 0,
    flightDurationMs: 3000,
    estimatedImpactTimeMs: 3000,
    state: 'incoming',
    resolveAction: null,
    ...overrides,
  }
}

describe('collision (danger zone)', () => {
  it('damages only unresolved', () => {
    expect(canProjectileDamagePlayer(makeProjectile({ state: 'incoming' }))).toBe(
      true,
    )
    expect(
      canProjectileDamagePlayer(makeProjectile({ state: 'resolving' })),
    ).toBe(false)
  })

  it('hits at bottom center', () => {
    expect(
      isProjectileHittingPlayer({
        projectile: makeProjectile(),
        xPercent: PLAYER_X_PERCENT,
        yPercent: 80,
        playerAction: 'idle',
        invulnerableUntilMs: 0,
        nowMs: 1000,
      }),
    ).toBe(true)
  })

  it('hits at bottom left/right columns', () => {
    expect(
      isProjectileHittingPlayer({
        projectile: makeProjectile(),
        xPercent: 18,
        yPercent: 80,
        playerAction: 'idle',
        invulnerableUntilMs: 0,
        nowMs: 1000,
      }),
    ).toBe(true)
    expect(
      isProjectileHittingPlayer({
        projectile: makeProjectile(),
        xPercent: 82,
        yPercent: 80,
        playerAction: 'idle',
        invulnerableUntilMs: 0,
        nowMs: 1000,
      }),
    ).toBe(true)
  })

  it('does not hit high above player', () => {
    expect(
      isProjectileHittingPlayer({
        projectile: makeProjectile(),
        xPercent: 50,
        yPercent: 20,
        playerAction: 'idle',
        invulnerableUntilMs: 0,
        nowMs: 1000,
      }),
    ).toBe(false)
  })

  it('ignores during invulnerability', () => {
    expect(
      isProjectileHittingPlayer({
        projectile: makeProjectile(),
        xPercent: 50,
        yPercent: 80,
        playerAction: 'idle',
        invulnerableUntilMs: 2000,
        nowMs: 1000,
      }),
    ).toBe(false)
  })
})
