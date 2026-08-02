import { describe, expect, it } from 'vitest'
import {
  computeRemainingMs,
  formatRemainingTime,
  isTimeUp,
} from './remainingTime'

describe('remainingTime', () => {
  const clock = {
    gameStartedAtMs: 1_000,
    pausedTotalMs: 0,
    pausedAtMs: null as number | null,
  }

  it('counts down from the configured limit', () => {
    expect(computeRemainingMs(clock, 1_000, 60)).toBe(60_000)
    expect(computeRemainingMs(clock, 31_000, 60)).toBe(30_000)
  })

  it('does not go below zero', () => {
    expect(computeRemainingMs(clock, 100_000, 60)).toBe(0)
  })

  it('freezes while paused', () => {
    const paused = {
      gameStartedAtMs: 1_000,
      pausedTotalMs: 0,
      pausedAtMs: 21_000,
    }
    expect(computeRemainingMs(paused, 21_000, 60)).toBe(40_000)
    expect(computeRemainingMs(paused, 51_000, 60)).toBe(40_000)
  })

  it('continues after resume using accumulated pause', () => {
    const resumed = {
      gameStartedAtMs: 1_000,
      pausedTotalMs: 10_000,
      pausedAtMs: null,
    }
    // elapsed = now - start - pausedTotal = 41k - 1k - 10k = 30k → remaining 30k
    expect(computeRemainingMs(resumed, 41_000, 60)).toBe(30_000)
  })

  it('formats remaining time as MM:SS', () => {
    expect(formatRemainingTime(90_000)).toBe('01:30')
    expect(formatRemainingTime(0)).toBe('00:00')
  })

  it('detects time up once at zero', () => {
    expect(isTimeUp(clock, 61_000, 60)).toBe(true)
    expect(isTimeUp(clock, 60_999, 60)).toBe(false)
  })

  it('extends remaining time with bonus ms and has no upper clamp', () => {
    // base 60s, +5s bonus, at start → 65s
    expect(computeRemainingMs(clock, 1_000, 60, 5_000)).toBe(65_000)
    // after 10s elapsed → 55s remaining with bonus
    expect(computeRemainingMs(clock, 11_000, 60, 5_000)).toBe(55_000)
    // can exceed initial limit display-wise at t=0 with large bonus
    expect(computeRemainingMs(clock, 1_000, 60, 120_000)).toBe(180_000)
  })

  it('ignores invalid bonus ms', () => {
    expect(computeRemainingMs(clock, 1_000, 60, Number.NaN)).toBe(60_000)
    expect(computeRemainingMs(clock, 1_000, 60, -3_000)).toBe(60_000)
  })

  it('keeps bonus time through pause', () => {
    const paused = {
      gameStartedAtMs: 1_000,
      pausedTotalMs: 0,
      pausedAtMs: 11_000,
    }
    // elapsed while active = 10s, bonus 5s, limit 60 → remaining 55s frozen
    expect(computeRemainingMs(paused, 11_000, 60, 5_000)).toBe(55_000)
    expect(computeRemainingMs(paused, 41_000, 60, 5_000)).toBe(55_000)
  })
})
