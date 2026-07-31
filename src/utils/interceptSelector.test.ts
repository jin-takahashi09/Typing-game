import { describe, expect, it } from 'vitest'
import {
  allyThrowAngleDeg,
  selectInterceptAction,
  slashAngleDeg,
} from './interceptSelector'

describe('interceptSelector (throw default / emergency only)', () => {
  it('selects throw when far', () => {
    const d = selectInterceptAction({
      distancePx: 400,
      gameHeightPx: 700,
      timeToImpactMs: 2000,
      projectileState: 'targeted',
    })
    expect(d.action).toBe('throw')
    expect(d.canIntercept).toBe(true)
  })

  it('selects throw at mid range', () => {
    const d = selectInterceptAction({
      distancePx: 200,
      gameHeightPx: 700,
      timeToImpactMs: 900,
      projectileState: 'targeted',
    })
    expect(d.action).toBe('throw')
  })

  it('selects throw when close but not urgent by time', () => {
    const d = selectInterceptAction({
      distancePx: 40,
      gameHeightPx: 700,
      timeToImpactMs: 800,
      projectileState: 'targeted',
    })
    expect(d.action).toBe('throw')
  })

  it('selects throw when urgent by time but not by distance', () => {
    const d = selectInterceptAction({
      distancePx: 400,
      gameHeightPx: 700,
      timeToImpactMs: 100,
      projectileState: 'targeted',
    })
    expect(d.action).toBe('throw')
  })

  it('selects emergency-slash only when both range and time match', () => {
    const d = selectInterceptAction({
      distancePx: 40,
      gameHeightPx: 700,
      timeToImpactMs: 200,
      projectileState: 'targeted',
    })
    expect(d.action).toBe('emergency-slash')
  })

  it('rejects hit/destroyed/resolving', () => {
    for (const state of ['hit', 'destroyed', 'resolving'] as const) {
      const d = selectInterceptAction({
        distancePx: 20,
        gameHeightPx: 700,
        timeToImpactMs: 50,
        projectileState: state,
      })
      expect(d.canIntercept).toBe(false)
    }
  })

  it('computes throw angles toward left / up / right', () => {
    const left = allyThrowAngleDeg(50, 76, 20, 30)
    const up = allyThrowAngleDeg(50, 76, 50, 20)
    const right = allyThrowAngleDeg(50, 76, 80, 30)
    expect(left).toBeLessThan(-90)
    expect(up).toBeCloseTo(-90, 0)
    expect(right).toBeGreaterThan(-90)
    expect(Number.isFinite(left)).toBe(true)
    expect(Number.isFinite(up)).toBe(true)
    expect(Number.isFinite(right)).toBe(true)
  })

  it('computes slash angle toward target', () => {
    const left = slashAngleDeg(30, 60, 50, 82)
    const right = slashAngleDeg(70, 60, 50, 82)
    expect(left).toBeLessThan(0)
    expect(right).toBeGreaterThan(0)
  })
})
