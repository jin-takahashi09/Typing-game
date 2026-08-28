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

  it('elapsed stays zero until the clock starts', () => {
    const clock = createElapsedClockState(null)
    expect(computeElapsedMs(clock, 9000)).toBe(0)
  })

  it('freezes during idlePausedAtMs gaps', () => {
    const clock = {
      ...createElapsedClockState(1000),
      idlePausedAtMs: 3000,
    }
    expect(computeElapsedMs(clock, 3000)).toBe(2000)
    expect(computeElapsedMs(clock, 8000)).toBe(2000)
  })
})
