import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  MULTI_SCROLL_COUNT,
  MULTI_SCROLL_HOLD_MS,
  MULTI_SCROLL_OPEN_MS,
  MULTI_SCROLL_OPEN_STAGGER_MS,
  MULTI_STAGGER_MS,
  computeMultiOpenPhaseMs,
  getInitialMultiOpenedCount,
  getInitialMultiVisibleCount,
  scheduleMultiScrollOpen,
  scheduleMultiStagger,
  scrollOpenFxClass,
  shouldStaggerMultiReveal,
} from './gachaMultiReveal'

describe('gachaMultiReveal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('staggers only for multi pull with motion and no skip', () => {
    expect(shouldStaggerMultiReveal('multi', false, false)).toBe(true)
    expect(shouldStaggerMultiReveal('single', false, false)).toBe(false)
    expect(shouldStaggerMultiReveal('multi', true, false)).toBe(false)
    expect(shouldStaggerMultiReveal('multi', false, true)).toBe(false)
  })

  it('starts with zero visible cards when stagger is enabled', () => {
    expect(getInitialMultiVisibleCount('multi', false, false, 10)).toBe(0)
    expect(getInitialMultiVisibleCount('multi', false, true, 10)).toBe(10)
    expect(getInitialMultiVisibleCount('single', false, false, 1)).toBe(1)
  })

  it('reveals result modal cards in order without reordering', () => {
    vi.useFakeTimers()
    const steps: number[] = []

    scheduleMultiStagger(
      3,
      MULTI_STAGGER_MS,
      (count) => steps.push(count),
      () => steps.push(99),
    )

    expect(steps).toEqual([])
    vi.advanceTimersByTime(MULTI_STAGGER_MS)
    expect(steps).toEqual([1])
    vi.advanceTimersByTime(MULTI_STAGGER_MS)
    expect(steps).toEqual([1, 2])
    vi.advanceTimersByTime(MULTI_STAGGER_MS)
    expect(steps).toEqual([1, 2, 3, 99])
  })

  it('cancel stops pending result modal stagger timers', () => {
    vi.useFakeTimers()
    const steps: number[] = []

    const cancel = scheduleMultiStagger(
      5,
      MULTI_STAGGER_MS,
      (count) => steps.push(count),
      () => steps.push(99),
    )

    vi.advanceTimersByTime(MULTI_STAGGER_MS)
    cancel()
    vi.advanceTimersByTime(MULTI_STAGGER_MS * 10)
    expect(steps).toEqual([1])
  })

  it('starts multi scroll open at zero unless skipped or reduced motion', () => {
    expect(getInitialMultiOpenedCount(false, false)).toBe(0)
    expect(getInitialMultiOpenedCount(false, true)).toBe(MULTI_SCROLL_COUNT)
    expect(getInitialMultiOpenedCount(true, false)).toBe(MULTI_SCROLL_COUNT)
  })

  it('opens first multi scroll immediately at t=0', () => {
    vi.useFakeTimers()
    const steps: number[] = []

    scheduleMultiScrollOpen(
      MULTI_SCROLL_COUNT,
      MULTI_SCROLL_OPEN_STAGGER_MS,
      (count) => steps.push(count),
      () => steps.push(99),
    )

    expect(steps).toEqual([1])
    vi.advanceTimersByTime(MULTI_SCROLL_OPEN_STAGGER_MS)
    expect(steps).toEqual([1, 2])
    vi.advanceTimersByTime(MULTI_SCROLL_OPEN_STAGGER_MS * 8)
    expect(steps[steps.length - 2]).toBe(MULTI_SCROLL_COUNT)
    expect(steps[steps.length - 1]).toBe(99)
  })

  it('increments opened scroll count 1 through 10 over time', () => {
    vi.useFakeTimers()
    const steps: number[] = []

    scheduleMultiScrollOpen(
      MULTI_SCROLL_COUNT,
      MULTI_SCROLL_OPEN_STAGGER_MS,
      (count) => steps.push(count),
      () => {},
    )

    for (let i = 1; i <= MULTI_SCROLL_COUNT; i += 1) {
      if (i > 1) {
        vi.advanceTimersByTime(MULTI_SCROLL_OPEN_STAGGER_MS)
      }
      expect(steps[i - 1]).toBe(i)
    }
  })

  it('cancel stops pending multi scroll open timers', () => {
    vi.useFakeTimers()
    const steps: number[] = []

    const cancel = scheduleMultiScrollOpen(
      MULTI_SCROLL_COUNT,
      MULTI_SCROLL_OPEN_STAGGER_MS,
      (count) => steps.push(count),
      () => steps.push(99),
    )

    expect(steps).toEqual([1])
    vi.advanceTimersByTime(MULTI_SCROLL_OPEN_STAGGER_MS * 2)
    cancel()
    vi.advanceTimersByTime(MULTI_SCROLL_OPEN_STAGGER_MS * 20)
    expect(steps).toEqual([1, 2, 3])
    expect(steps).not.toContain(99)
  })

  it('computes multi-open phase duration from stagger, open animation, and hold', () => {
    expect(computeMultiOpenPhaseMs()).toBe(
      (MULTI_SCROLL_COUNT - 1) * MULTI_SCROLL_OPEN_STAGGER_MS +
        MULTI_SCROLL_OPEN_MS +
        MULTI_SCROLL_HOLD_MS,
    )
    expect(computeMultiOpenPhaseMs()).toBe(1960)
  })

  it('maps rarity to scroll open fx classes', () => {
    expect(scrollOpenFxClass('SR')).toContain('sr')
    expect(scrollOpenFxClass('SSR')).toContain('ssr')
    expect(scrollOpenFxClass('UR')).toContain('ur')
    expect(scrollOpenFxClass('SHINNIN')).toContain('shinnin')
  })
})
