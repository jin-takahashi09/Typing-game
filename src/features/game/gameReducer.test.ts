import { describe, expect, it } from 'vitest'
import { createRomajiMatchState } from '../../utils/romajiMatcher'
import { createInitialGameState, gameReducer } from './gameReducer'
import type { EnemyProjectile } from '../../types/projectile'

function makeProjectile(
  overrides: Partial<EnemyProjectile> = {},
): EnemyProjectile {
  return {
    id: 'p1',
    problemId: 'prob-1',
    displayText: 'すし',
    reading: 'すし',
    displayRomaji: 'sushi',
    romajiPatterns: ['sushi', 'susi'],
    matchState: createRomajiMatchState(),
    typedLength: 0,
    baseScore: 100,
    spawnX: 50,
    spawnY: 20,
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
    ...overrides,
  }
}

describe('gameReducer (sushi-da time attack)', () => {
  it('has no stage field', () => {
    const state = createInitialGameState('ninja')
    expect(state).not.toHaveProperty('stage')
    expect(state).not.toHaveProperty('showStageUpFlash')
    expect(state.failedTargets).toBe(0)
  })

  it('starts idle with empty projectiles', () => {
    const started = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    expect(started.playerAction).toBe('idle')
    expect(started.activeProjectiles).toEqual([])
  })

  it('starts the clock only when the first projectile spawns', () => {
    let state: ReturnType<typeof createInitialGameState> = {
      ...createInitialGameState('ninja'),
      status: 'playing',
      gameStartedAtMs: null,
    }
    expect(state.gameStartedAtMs).toBeNull()

    state = gameReducer(state, {
      type: 'SPAWN_PROJECTILE',
      projectile: makeProjectile({ spawnY: 22 }),
      nowMs: 5000,
    })
    expect(state.gameStartedAtMs).toBe(5000)
    expect(state.idlePausedAtMs).toBeNull()
  })

  it('idle-pauses when no playable projectile remains', () => {
    let state: ReturnType<typeof createInitialGameState> = {
      ...createInitialGameState('ninja'),
      status: 'playing',
      gameStartedAtMs: 1000,
      activeProjectiles: [makeProjectile({ id: 'p1', state: 'incoming' })],
    }
    state = gameReducer(state, {
      type: 'REMOVE_PROJECTILE',
      projectileId: 'p1',
      nowMs: 2000,
    })
    expect(state.idlePausedAtMs).toBe(2000)

    state = gameReducer(state, {
      type: 'SPAWN_PROJECTILE',
      projectile: makeProjectile({ id: 'p2', spawnY: 22 }),
      nowMs: 3500,
    })
    expect(state.idlePausedAtMs).toBeNull()
    expect(state.pausedTotalMs).toBe(1500)
  })

  it('resolves to resolving and unlocks lock', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = {
      ...state,
      activeProjectiles: [makeProjectile()],
    }
    state = gameReducer(state, {
      type: 'RESOLVE_PROJECTILE',
      projectileId: 'p1',
      action: 'throw',
      scoreGain: 120,
      heal: 0,
      streak: {
        kind: 'apply',
        eventId: 'p1-streak',
        result: {
          previousCount: 0,
          nextCount: 1,
          timeBonusSeconds: 0,
          coinBonus: 0,
          reachedMilestone: null,
          completedCycle: false,
        },
      },
    })
    expect(state.score).toBe(120)
    expect(state.combo).toBe(1)
    expect(state.perfectStreakCount).toBe(1)
    expect(state.lockedProjectileId).toBeNull()
    expect(state.activeProjectiles[0]?.state).toBe('resolving')
    expect(state.lastInterceptAction).toBe('throw')
  })

  it('resets streak on miss and marks problem', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = { ...state, perfectStreakCount: 5 }
    state = gameReducer(state, { type: 'TYPE_MISS' })
    expect(state.perfectStreakCount).toBe(0)
    expect(state.currentProblemHadMiss).toBe(true)
  })

  it('applies streak reward once per event id', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    const projectile = makeProjectile()
    state = { ...state, activeProjectiles: [projectile] }
    const streak = {
      kind: 'apply' as const,
      eventId: 'once',
      result: {
        previousCount: 3,
        nextCount: 4,
        timeBonusSeconds: 1,
        coinBonus: 1,
        reachedMilestone: 4 as const,
        completedCycle: false,
      },
    }
    state = gameReducer(state, {
      type: 'RESOLVE_PROJECTILE',
      projectileId: 'p1',
      action: 'throw',
      scoreGain: 10,
      heal: 0,
      streak,
    })
    expect(state.timeBonusMs).toBe(1000)
    expect(state.streakRewardCoins).toBe(1)
    // duplicate resolve ignored
    const again = gameReducer(state, {
      type: 'RESOLVE_PROJECTILE',
      projectileId: 'p1',
      action: 'throw',
      scoreGain: 10,
      heal: 0,
      streak,
    })
    expect(again.timeBonusMs).toBe(1000)
    expect(again.streakRewardCoins).toBe(1)
  })

  it('resets streak on projectile hit', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = {
      ...state,
      perfectStreakCount: 6,
      timeBonusMs: 3000,
      streakRewardCoins: 3,
      totalBonusSeconds: 3,
      activeProjectiles: [makeProjectile()],
    }
    state = gameReducer(state, {
      type: 'PROJECTILE_HIT_PLAYER',
      projectileId: 'p1',
      damage: 10,
      invulnerableUntilMs: 5000,
    })
    expect(state.perfectStreakCount).toBe(0)
    expect(state.timeBonusMs).toBe(3000)
    expect(state.streakRewardCoins).toBe(3)
    expect(state.totalBonusSeconds).toBe(3)
  })

  it('hit applies damage but does not end game at HP 0', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = {
      ...state,
      defense: 10,
      activeProjectiles: [makeProjectile()],
    }
    state = gameReducer(state, {
      type: 'PROJECTILE_HIT_PLAYER',
      projectileId: 'p1',
      damage: 10,
      invulnerableUntilMs: 5000,
    })
    expect(state.defense).toBe(0)
    expect(state.status).toBe('playing')
    expect(state.failedTargets).toBe(1)
    expect(state.combo).toBe(0)
    expect(state.playerAction).toBe('damaged')
  })

  it('ends only via END_GAME timeout', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = gameReducer(state, { type: 'END_GAME', reason: 'timeout' })
    expect(state.status).toBe('gameover')
    expect(state.endReason).toBe('timeout')
  })

  it('does not type-correct resolving projectile', () => {
    let state = gameReducer(createInitialGameState('ninja'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = {
      ...state,
      activeProjectiles: [makeProjectile({ state: 'resolving' })],
    }
    const next = gameReducer(state, {
      type: 'TYPE_CORRECT',
      projectileId: 'p1',
      typedLength: 1,
      matchState: createRomajiMatchState(),
    })
    expect(next).toBe(state)
  })
})
