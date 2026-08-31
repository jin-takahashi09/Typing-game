import { describe, expect, it } from 'vitest'
import type { CharacterRarity } from '../../config/characters'
import { computeMultiOpenPhaseMs } from './gachaMultiReveal'
import { buildPhases, phaseDurationMs } from './gachaRevealPhases'
import { totalRevealDurationMs, validatePhaseDurations } from './gachaRevealTiming'

const RARITIES: CharacterRarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'SHINNIN']

describe('gachaRevealTiming', () => {
  it('gives every non-done phase a positive duration in normal motion', () => {
    for (const rarity of RARITIES) {
      for (const pullType of ['single', 'multi'] as const) {
        const phases = buildPhases(rarity, false, pullType)
        expect(validatePhaseDurations(phases, false)).toEqual({ ok: true })
        expect(totalRevealDurationMs(phases, false)).toBeGreaterThan(500)
      }
    }
  })

  it('keeps reduced-motion reveal durations visible but shorter', () => {
    for (const pullType of ['single', 'multi'] as const) {
      const phases = buildPhases('N', true, pullType)
      expect(validatePhaseDurations(phases, true)).toEqual({ ok: true })
      expect(totalRevealDurationMs(phases, true)).toBeGreaterThan(300)
    }
  })

  it('holds multi-open long enough for stagger, open animation, and settle time', () => {
    const openMs = phaseDurationMs('multi-open', false)
    expect(openMs).toBeGreaterThanOrEqual(computeMultiOpenPhaseMs())
  })

  it('includes multi-bundle, grid, and open in 10-pull phases', () => {
    const phases = buildPhases('N', false, 'multi')
    expect(phases).toContain('multi-bundle')
    expect(phases).not.toContain('multi-banner')
    expect(phases).toContain('multi-grid')
    expect(phases).toContain('multi-open')
    expect(phaseDurationMs('multi-bundle', false)).toBeGreaterThan(0)
  })
})
