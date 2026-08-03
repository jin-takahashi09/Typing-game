import { describe, expect, it } from 'vitest'
import {
  clampSpawnXForRomajiLabel,
  romajiLengthTier,
} from './romajiLabelLayout'

describe('romajiLabelLayout', () => {
  it('keeps short labels near the chosen column', () => {
    expect(clampSpawnXForRomajiLabel(18, 5)).toBe(18)
    expect(clampSpawnXForRomajiLabel(82, 5)).toBe(82)
  })

  it('pulls long labels away from the edges', () => {
    expect(clampSpawnXForRomajiLabel(18, 16)).toBeGreaterThan(18)
    expect(clampSpawnXForRomajiLabel(82, 16)).toBeLessThan(82)
    expect(clampSpawnXForRomajiLabel(5, 20)).toBe(32)
    expect(clampSpawnXForRomajiLabel(95, 20)).toBe(68)
  })

  it('classifies length tiers', () => {
    expect(romajiLengthTier(4)).toBe('short')
    expect(romajiLengthTier(10)).toBe('medium')
    expect(romajiLengthTier(18)).toBe('long')
  })
})
