import { describe, expect, it } from 'vitest'
import {
  buildTypingStats,
  calculateAccuracy,
  calculateWpm,
} from './calculateTypingStats'

describe('calculateTypingStats', () => {
  it('calculates WPM from correct chars and elapsed time', () => {
    expect(calculateWpm(50, 60_000)).toBe(10)
  })

  it('calculates accuracy as correct divided by typed', () => {
    expect(calculateAccuracy(90, 100)).toBe(90)
  })

  it('returns zero for accuracy when typed chars is zero', () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it('returns zero for WPM at game start', () => {
    expect(calculateWpm(0, 0)).toBe(0)
    expect(calculateWpm(10, 0)).toBe(0)
  })

  it('builds a full stats object with guards', () => {
    const stats = buildTypingStats(
      { typedChars: 20, correctChars: 18, missCount: 2 },
      30_000,
    )
    expect(stats.wpm).toBe(7.2)
    expect(stats.accuracy).toBe(90)
    expect(stats.elapsedMs).toBe(30_000)
  })
})
