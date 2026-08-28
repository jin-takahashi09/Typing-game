import { describe, expect, it } from 'vitest'
import { gameConfig } from '../config/gameConfig'
import {
  computeSpawnYPercent,
  estimateProjectileHalfHeightPercent,
} from './spawnLayout'

describe('spawnLayout', () => {
  it('keeps spawn center at or below the HUD start line', () => {
    for (const len of [3, 8, 14, 20]) {
      const spawnY = computeSpawnYPercent(len)
      const half = estimateProjectileHalfHeightPercent(len)
      const top = spawnY - half
      expect(top).toBeGreaterThanOrEqual(gameConfig.spawnStartLineYPercent - 0.05)
      expect(spawnY).toBeGreaterThanOrEqual(gameConfig.spawnStartLineYPercent)
      expect(spawnY).toBeLessThanOrEqual(gameConfig.spawnYMaxPercent)
    }
  })

  it('places longer problems lower so full text fits under the start line', () => {
    const short = computeSpawnYPercent(3)
    const long = computeSpawnYPercent(16)
    expect(long).toBeGreaterThan(short)
  })

  it('never uses off-screen negative Y', () => {
    expect(computeSpawnYPercent(1)).toBeGreaterThan(0)
    expect(computeSpawnYPercent(30)).toBeGreaterThan(0)
  })
})
