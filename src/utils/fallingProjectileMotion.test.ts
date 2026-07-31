import { describe, expect, it } from 'vitest'
import {
  computeFallDurationMs,
  computeFallProgress,
  sampleFallingMotion,
  clampEmergencySlashRangePx,
  estimateTimeToImpactMs,
} from './fallingProjectileMotion'
import { PLAYER_Y_PERCENT } from '../types/projectile'

describe('fallingProjectileMotion (straight drop)', () => {
  it('keeps x fixed and increases y for left/center/right', () => {
    for (const spawnX of [18, 50, 82]) {
      const a = sampleFallingMotion({
        spawnX,
        spawnY: 0,
        impactY: PLAYER_Y_PERCENT,
        trajectory: 'straight',
        progress: 0.2,
      })
      const b = sampleFallingMotion({
        spawnX,
        spawnY: 0,
        impactY: PLAYER_Y_PERCENT,
        trajectory: 'straight',
        progress: 0.8,
      })
      expect(a.xPercent).toBe(spawnX)
      expect(b.xPercent).toBe(spawnX)
      expect(b.yPercent).toBeGreaterThan(a.yPercent)
    }
  })

  it('accelerating keeps x fixed and increases velocityY', () => {
    const early = sampleFallingMotion({
      spawnX: 40,
      spawnY: 0,
      impactY: PLAYER_Y_PERCENT,
      trajectory: 'accelerating',
      progress: 0.2,
    })
    const late = sampleFallingMotion({
      spawnX: 40,
      spawnY: 0,
      impactY: PLAYER_Y_PERCENT,
      trajectory: 'accelerating',
      progress: 0.8,
    })
    expect(early.xPercent).toBe(40)
    expect(late.xPercent).toBe(40)
    expect(late.yPercent).toBeGreaterThan(early.yPercent)
    expect(late.velocityY).toBeGreaterThan(early.velocityY)
  })

  it('returns finite coordinates only', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1, 1.2]) {
      const sample = sampleFallingMotion({
        spawnX: 55,
        spawnY: -6,
        impactY: PLAYER_Y_PERCENT,
        trajectory: 'accelerating',
        progress: p,
      })
      expect(Number.isFinite(sample.xPercent)).toBe(true)
      expect(Number.isFinite(sample.yPercent)).toBe(true)
      expect(Number.isFinite(sample.velocityY)).toBe(true)
    }
  })

  it('longer problems get longer fall duration', () => {
    const short = computeFallDurationMs({
      romajiLength: 3,
      fallSpeed: 1,
      trajectory: 'straight',
      size: 'normal',
    })
    const long = computeFallDurationMs({
      romajiLength: 12,
      fallSpeed: 1,
      trajectory: 'straight',
      size: 'normal',
    })
    expect(long).toBeGreaterThan(short)
    expect(short).toBeGreaterThan(0)
  })

  it('higher fallSpeed shortens duration', () => {
    const slow = computeFallDurationMs({
      romajiLength: 8,
      fallSpeed: 0.55,
      trajectory: 'straight',
      size: 'normal',
    })
    const fast = computeFallDurationMs({
      romajiLength: 8,
      fallSpeed: 1.55,
      trajectory: 'straight',
      size: 'normal',
    })
    expect(slow).toBeGreaterThan(fast)
  })

  it('estimates remaining time to impact', () => {
    expect(estimateTimeToImpactMs(1000, 4000)).toBe(3000)
    expect(estimateTimeToImpactMs(5000, 4000)).toBe(0)
  })

  it('clamps emergency slash range', () => {
    expect(clampEmergencySlashRangePx(200)).toBe(60)
    expect(clampEmergencySlashRangePx(2000)).toBe(110)
    expect(clampEmergencySlashRangePx(700)).toBeGreaterThanOrEqual(60)
  })

  it('computes fall progress', () => {
    expect(computeFallProgress(2000, 4000)).toBe(0.5)
  })
})
