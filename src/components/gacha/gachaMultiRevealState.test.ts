import { describe, expect, it } from 'vitest'
import { MULTI_SCROLL_COUNT } from './gachaMultiReveal'
import {
  isActiveMultiRevealSlot,
  isMultiRevealComplete,
  shouldDimMultiGridBackground,
} from './gachaMultiRevealState'

describe('gachaMultiRevealState', () => {
  it('isActiveMultiRevealSlot matches activeRevealIndex only', () => {
    expect(isActiveMultiRevealSlot(2, 2)).toBe(true)
    expect(isActiveMultiRevealSlot(2, 3)).toBe(false)
    expect(isActiveMultiRevealSlot(0, null)).toBe(false)
  })

  it('shouldDimMultiGridBackground when central reveal is active', () => {
    expect(shouldDimMultiGridBackground(0)).toBe(true)
    expect(shouldDimMultiGridBackground(null)).toBe(false)
  })

  it('isMultiRevealComplete when all slots revealed and no active index', () => {
    expect(isMultiRevealComplete(MULTI_SCROLL_COUNT, null)).toBe(true)
    expect(isMultiRevealComplete(MULTI_SCROLL_COUNT, 9)).toBe(false)
    expect(isMultiRevealComplete(MULTI_SCROLL_COUNT - 1, null)).toBe(false)
  })

  it('active slot helper is rarity-agnostic (index-only)', () => {
    for (let index = 0; index < MULTI_SCROLL_COUNT; index += 1) {
      expect(isActiveMultiRevealSlot(index, index)).toBe(true)
      expect(isActiveMultiRevealSlot((index + 1) % MULTI_SCROLL_COUNT, index)).toBe(false)
    }
  })
})
