import { describe, expect, it } from 'vitest'
import { characters, getCharactersByRarity } from '../config/characters'
import { gachaConfig } from '../config/gachaConfig'
import { createDefaultEconomy, awardCoins } from './economy'
import {
  duplicateCoinFor,
  pullGacha,
  rollRarity,
  pickCharacterOfRarity,
} from './gacha'

function sequenceRng(values: number[]): () => number {
  let i = 0
  return () => {
    const value = values[Math.min(i, values.length - 1)] ?? 0
    i += 1
    return value
  }
}

describe('gacha', () => {
  it('charges single pull cost and grants a character', () => {
    const economy = awardCoins(createDefaultEconomy(), 100).economy
    const result = pullGacha(economy, 'single', sequenceRng([0.01, 0]), '2026-01-01T00:00:00.000Z')
    expect(result.ok).toBe(true)
    expect(result.cost).toBe(gachaConfig.singleCost)
    expect(result.items).toHaveLength(1)
    expect(result.economy!.coins).toBeLessThanOrEqual(0 + (result.totalDuplicateCoins ?? 0))
    expect(result.economy!.gachaHistory).toHaveLength(1)
  })

  it('runs 10-pull for multi cost', () => {
    const economy = awardCoins(createDefaultEconomy(), 900).economy
    const rng = sequenceRng(Array.from({ length: 40 }, (_, i) => (i % 10) / 10))
    const result = pullGacha(economy, 'multi', rng)
    expect(result.ok).toBe(true)
    expect(result.items).toHaveLength(10)
    expect(result.cost).toBe(gachaConfig.multiCost)
  })

  it('rejects insufficient coins', () => {
    const result = pullGacha(createDefaultEconomy(), 'single', () => 0)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('insufficient_coins')
  })

  it('converts duplicates to coins by rarity', () => {
    const base = awardCoins(createDefaultEconomy(), 200).economy
    const owned = {
      ...base,
      ownedCharacterIds: [...base.ownedCharacterIds, 'shinobi-midori'],
    }
    const nChars = getCharactersByRarity('N')
    const midoriIndex = nChars.findIndex((c) => c.id === 'shinobi-midori')
    expect(midoriIndex).toBeGreaterThanOrEqual(0)
    const pickRoll = (midoriIndex + 0.5) / nChars.length
    const rng = sequenceRng([0.01, pickRoll])
    const result = pullGacha(owned, 'single', rng)
    expect(result.ok).toBe(true)
    expect(result.items![0].characterId).toBe('shinobi-midori')
    expect(result.items![0].wasDuplicate).toBe(true)
    expect(result.items![0].duplicateCoins).toBe(duplicateCoinFor('N'))
    expect(result.economy!.coins).toBe(200 - 100 + gachaConfig.duplicateCoins.N)
  })

  it('maps rarity rates from cumulative thresholds', () => {
    expect(rollRarity(() => 0)).toBe('N')
    expect(rollRarity(() => 0.548)).toBe('N')
    expect(rollRarity(() => 0.549)).toBe('R')
    expect(rollRarity(() => 0.799)).toBe('SR')
    expect(rollRarity(() => 0.919)).toBe('SSR')
    expect(rollRarity(() => 0.979)).toBe('UR')
    expect(rollRarity(() => 0.999)).toBe('SHINNIN')
  })

  it('picks only characters of requested rarity', () => {
    for (const rarity of ['N', 'R', 'SR', 'SSR', 'UR', 'SHINNIN'] as const) {
      const picked = pickCharacterOfRarity(rarity, characters, () => 0)
      expect(picked?.rarity).toBe(rarity)
    }
  })

  it('keeps history and ownership after pull', () => {
    let economy = awardCoins(createDefaultEconomy(), 1000).economy
    const first = pullGacha(economy, 'single', sequenceRng([0.99, 0]))
    expect(first.ok).toBe(true)
    economy = first.economy!
    expect(economy.ownedCharacterIds.length).toBeGreaterThanOrEqual(1)
    expect(economy.gachaHistory[0]?.pullType).toBe('single')
  })

  it('uses SHINNIN peak rarity in multi pull when included', () => {
    const economy = awardCoins(createDefaultEconomy(), 900).economy
    const shinninChars = getCharactersByRarity('SHINNIN')
    const pickRoll = 0.5 / shinninChars.length
    const rng = sequenceRng([
      0.999,
      pickRoll,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
      0.01,
      0,
    ])
    const result = pullGacha(economy, 'multi', rng)
    expect(result.ok).toBe(true)
    expect(result.peakRarity).toBe('SHINNIN')
  })
})
