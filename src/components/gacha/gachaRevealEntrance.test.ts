import { describe, expect, it } from 'vitest'
import {
  firstResultVisualPhaseIndex,
  getResultPhaseIndex,
  isFxWindowActive,
  isResultVisualMountedPhase,
  shouldPlayResultModalEntrance,
} from './gachaRevealEntrance'
import { buildPhases } from './gachaRevealPhases'

describe('gachaRevealEntrance', () => {
  const nPhases = [
    'dark',
    'scroll',
    'scroll-open',
    'smoke',
    'result',
    'done',
  ] as const

  it('finds result as first visual phase in normal N pull', () => {
    expect(getResultPhaseIndex(nPhases)).toBe(4)
    expect(firstResultVisualPhaseIndex(nPhases, false)).toBe(4)
    expect(isResultVisualMountedPhase(nPhases, 3, false)).toBe(false)
    expect(isResultVisualMountedPhase(nPhases, 4, false)).toBe(true)
  })

  it('keeps FX window active from smoke through result', () => {
    expect(isFxWindowActive(nPhases, 2, ['smoke'])).toBe(false)
    expect(isFxWindowActive(nPhases, 3, ['smoke'])).toBe(true)
    expect(isFxWindowActive(nPhases, 4, ['smoke'])).toBe(true)
    expect(isFxWindowActive(nPhases, 5, ['smoke'])).toBe(false)
  })

  it('does not mount result visual during multi reveal', () => {
    const phases = buildPhases('N', false, 'multi')
    expect(firstResultVisualPhaseIndex(phases, false, 'multi')).toBe(-1)
    expect(isResultVisualMountedPhase(phases, 2, false, 'multi')).toBe(false)
  })

  it('uses result as first visual phase in reduced motion fallback', () => {
    const phases = ['dark', 'smoke', 'result', 'done'] as const
    expect(firstResultVisualPhaseIndex(phases, true)).toBe(2)
    expect(isResultVisualMountedPhase(phases, 1, true)).toBe(false)
    expect(isResultVisualMountedPhase(phases, 2, true)).toBe(true)
  })

  it('skips modal entrance when reveal already showed the result', () => {
    expect(shouldPlayResultModalEntrance(false)).toBe(true)
    expect(shouldPlayResultModalEntrance(true)).toBe(false)
  })

  it('never mounts result visual before result phase index', () => {
    const phases = buildPhases('N', false, 'single')
    const resultIndex = getResultPhaseIndex(phases)
    for (let i = 0; i < resultIndex; i += 1) {
      expect(isResultVisualMountedPhase(phases, i, false, 'single')).toBe(false)
    }
    expect(isResultVisualMountedPhase(phases, resultIndex, false, 'single')).toBe(true)
  })
})
