import { describe, expect, it } from 'vitest'
import {
  accumulatePause,
  beginPause,
  computeElapsedMs,
  createElapsedClockState,
} from './elapsedTime'

describe('elapsedTime', () => {
  it('does not advance elapsed time while paused', () => {
    let clock = createElapsedClockState(1000)
    clock = beginPause(clock, 2000)
    expect(computeElapsedMs(clock, 2000)).toBe(1000)
    expect(computeElapsedMs(clock, 5000)).toBe(1000)
  })

  it('resumes without including paused duration', () => {
    let clock = createElapsedClockState(1000)
    clock = beginPause(clock, 2000)
    clock = accumulatePause(clock, 4000)
    expect(clock.pausedTotalMs).toBe(2000)
    expect(computeElapsedMs(clock, 5000)).toBe(2000)
  })
})
