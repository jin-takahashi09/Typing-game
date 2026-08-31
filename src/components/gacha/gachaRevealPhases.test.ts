import { describe, expect, it } from 'vitest'
import {
  buildPhases,
  fxPhasesCompleteBeforeResult,
  getRevealFxVisibility,
  phaseDurationMs,
} from './gachaRevealPhases'
import { getResultPhaseIndex, isResultVisualMountedPhase } from './gachaRevealEntrance'
import { MULTI_SCROLL_COUNT } from './gachaMultiReveal'

describe('gachaRevealPhases', () => {
  it('runs FX phases before result for normal N pull', () => {
    const phases = buildPhases('N', false, 'single')
    expect(phases).toEqual([
      'scroll',
      'scroll-open',
      'smoke',
      'result',
      'done',
    ])
    expect(fxPhasesCompleteBeforeResult(phases)).toBe(true)
    expect(getResultPhaseIndex(phases)).toBe(3)
    expect(isResultVisualMountedPhase(phases, 2, false)).toBe(false)
    expect(isResultVisualMountedPhase(phases, 3, false)).toBe(true)
  })

  it('keeps smoke visible through result phase window', () => {
    const phases = buildPhases('N', false, 'single')
    const smokeIndex = phases.indexOf('smoke')
    const resultIndex = phases.indexOf('result')
    expect(
      getRevealFxVisibility(phases, smokeIndex, 'smoke', 'n', false, false).showSmoke,
    ).toBe(true)
    expect(
      getRevealFxVisibility(phases, resultIndex, 'result', 'n', false, false).showSmoke,
    ).toBe(true)
    expect(
      getRevealFxVisibility(phases, resultIndex + 1, 'done', 'n', false, false).showSmoke,
    ).toBe(false)
  })

  it('includes rarity-text and result for SSR', () => {
    const phases = buildPhases('SSR', false, 'single')
    expect(phases).toContain('rarity-text')
    expect(phases.indexOf('rarity-text')).toBeLessThan(phases.indexOf('result'))
    const electricIndex = phases.indexOf('electric')
    expect(
      getRevealFxVisibility(phases, electricIndex, 'electric', 'ssr', false, false)
        .showLightning,
    ).toBe(true)
  })

  it('uses scroll bundle and grid open for 10-pull (no text banner)', () => {
    const phases = buildPhases('N', false, 'multi')
    expect(phases).toEqual([
      'multi-bundle',
      'multi-grid',
      'multi-open',
      'done',
    ])
    expect(phases).not.toContain('multi-banner')
    expect(phaseDurationMs('multi-open', false)).toBeGreaterThan(0)
    expect(
      getRevealFxVisibility(phases, phases.indexOf('multi-open'), 'multi-open', 'n', true, false)
        .showMultiOpen,
    ).toBe(true)
    expect(
      getRevealFxVisibility(phases, phases.indexOf('multi-grid'), 'multi-grid', 'n', true, false)
        .showMultiGrid,
    ).toBe(true)
    expect(
      getRevealFxVisibility(phases, phases.indexOf('multi-bundle'), 'multi-bundle', 'n', true, false)
        .showMultiBundle,
    ).toBe(true)
  })

  it('does not mount result visual during multi reveal', () => {
    const phases = buildPhases('SSR', false, 'multi')
    expect(isResultVisualMountedPhase(phases, phases.length - 2, false, 'multi')).toBe(false)
  })

  it('allocates ten scroll slots in multi reveal constants', () => {
    expect(MULTI_SCROLL_COUNT).toBe(10)
  })
})
