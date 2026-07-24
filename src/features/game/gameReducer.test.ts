import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  gameReducer,
} from './gameReducer'
import type { GameTarget } from '../../types/game'
import { gameConfig } from '../../config/gameConfig'
import { createRomajiMatchState } from '../../utils/romajiMatcher'

function makeTarget(overrides: Partial<GameTarget> = {}): GameTarget {
  const matchState = createRomajiMatchState()

  return {
    id: 't1',
    problemId: 'p1',
    displayText: 'ねこ',
    reading: 'ねこ',
    displayRomaji: 'neko',
    romajiPatterns: ['neko'],
    matchState,
    typedLength: 0,
    xPercent: 40,
    yPosition: -50,
    speed: 1,
    state: 'falling',
    baseScore: 100,
    ...overrides,
  }
}

describe('gameReducer', () => {
  it('starts and resets into a clean playing state', () => {
    const started = gameReducer(createInitialGameState('trainee'), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    expect(started.status).toBe('playing')
    expect(started.difficulty).toBe('ninja')
    expect(started.score).toBe(0)
    expect(started.activeTargets).toEqual([])
    expect(started.gameStartedAtMs).toBe(1000)

    const dirty = gameReducer(started, {
      type: 'SPAWN_TARGET',
      target: makeTarget(),
    })
    const reset = gameReducer(dirty, {
      type: 'RESET_GAME',
      difficulty: 'master',
      maxDefense: 100,
      startedAtMs: 2000,
    })
    expect(reset.difficulty).toBe('master')
    expect(reset.activeTargets).toEqual([])
    expect(reset.combo).toBe(0)
    expect(reset.status).toBe('playing')
  })

  it('applies correct typing and miss without unlocking on miss', () => {
    let state = gameReducer(createInitialGameState('ninja', 100), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })
    state = gameReducer(state, { type: 'SPAWN_TARGET', target: makeTarget() })
    state = gameReducer(state, {
      type: 'TYPE_CORRECT',
      targetId: 't1',
      typedLength: 1,
      matchState: {
        confirmedLength: 1,
        activePaths: [{ moraIndex: 0, partial: 'n' }],
        isComplete: false,
      },
    })
    expect(state.lockedTargetId).toBe('t1')
    expect(state.activeTargets[0]?.typedLength).toBe(1)
    expect(state.correctChars).toBe(1)
    expect(state.combo).toBe(0)

    state = gameReducer(state, { type: 'TYPE_MISS' })
    expect(state.combo).toBe(0)
    expect(state.lockedTargetId).toBe('t1')
    expect(state.missCount).toBe(1)
    expect(state.showMissFeedback).toBe(true)
  })

  it('destroys targets, heals without exceeding max, and advances stage', () => {
    let state = createInitialGameState('ninja', gameConfig.maxHealth)
    state = gameReducer(state, {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: gameConfig.maxHealth,
      startedAtMs: 1000,
    })
    state = gameReducer(state, { type: 'SPAWN_TARGET', target: makeTarget() })
    state = {
      ...state,
      defense: gameConfig.maxHealth - 1,
    }
    state = gameReducer(state, {
      type: 'DESTROY_TARGET',
      targetId: 't1',
      scoreGain: 100,
      heal: 10,
      shouldAdvanceStage: true,
    })
    expect(state.defense).toBe(gameConfig.maxHealth)
    expect(state.score).toBe(100)
    expect(state.combo).toBe(1)
    expect(state.stage).toBe(2)
    expect(state.activeTargets).toEqual([])
  })

  it('applies bottom damage, clamps defense at 0, and ends the game', () => {
    let state = gameReducer(createInitialGameState('trainee', 5), {
      type: 'START_GAME',
      difficulty: 'trainee',
      maxDefense: 5,
      startedAtMs: 1000,
    })
    state = gameReducer(state, { type: 'SPAWN_TARGET', target: makeTarget() })
    state = gameReducer(state, {
      type: 'TARGET_REACHED_BOTTOM',
      targetId: 't1',
      damage: 10,
    })
    expect(state.defense).toBe(0)
    expect(state.status).toBe('gameover')
    expect(state.endReason).toBe('defense')
    expect(state.activeTargets).toEqual([])
    expect(state.combo).toBe(0)
  })

  it('pauses and resumes without accepting pause from non-playing states', () => {
    let state = gameReducer(createInitialGameState('ninja', 100), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 1000,
    })

    state = gameReducer(state, { type: 'PAUSE_GAME', atMs: 2000 })
    expect(state.status).toBe('paused')
    expect(state.pausedAtMs).toBe(2000)

    state = gameReducer(state, { type: 'PAUSE_GAME', atMs: 2500 })
    expect(state.pausedAtMs).toBe(2000)

    state = gameReducer(state, { type: 'RESUME_GAME', atMs: 4000 })
    expect(state.status).toBe('playing')
    expect(state.pausedTotalMs).toBe(2000)
    expect(state.pausedAtMs).toBeNull()

    const ready = createInitialGameState('ninja', 100)
    expect(gameReducer(ready, { type: 'RESUME_GAME', atMs: 1 }).status).toBe('ready')
  })
})

