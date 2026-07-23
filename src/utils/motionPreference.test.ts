import { describe, expect, it } from 'vitest'
import { resolveReducedMotion } from './motionPreference'

describe('motionPreference', () => {
  it('forces reduced and full regardless of system preference', () => {
    expect(resolveReducedMotion('reduced', false)).toBe(true)
    expect(resolveReducedMotion('full', true)).toBe(false)
  })

  it('follows system preference when set to system', () => {
    expect(resolveReducedMotion('system', true)).toBe(true)
    expect(resolveReducedMotion('system', false)).toBe(false)
  })
})
