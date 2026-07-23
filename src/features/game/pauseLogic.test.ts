import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  gameReducer,
} from './gameReducer'

/**
 * Pause gating invariants used by GameScreen:
 * - loop enabled only when status === 'playing'
 * - typing enabled only when status === 'playing'
 * - spawn / bottom handlers early-return when not playing
 */
describe('pause gating invariants', () => {
  it('keeps status paused so gameplay hooks stay disabled', () => {
    let state = gameReducer(createInitialGameState('ninja', 100), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 0,
    })
    state = gameReducer(state, { type: 'PAUSE_GAME', atMs: 100 })

    expect(state.status === 'playing').toBe(false)
    expect(state.status).toBe('paused')
  })

  it('returns to playing so gameplay hooks re-enable without carrying pause clock', () => {
    let state = gameReducer(createInitialGameState('ninja', 100), {
      type: 'START_GAME',
      difficulty: 'ninja',
      maxDefense: 100,
      startedAtMs: 0,
    })
    state = gameReducer(state, { type: 'PAUSE_GAME', atMs: 100 })
    state = gameReducer(state, { type: 'RESUME_GAME', atMs: 300 })

    expect(state.status).toBe('playing')
    expect(state.pausedAtMs).toBeNull()
    expect(state.pausedTotalMs).toBe(200)
  })
})
