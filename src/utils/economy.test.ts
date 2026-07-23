import { describe, expect, it } from 'vitest'
import { DEFAULT_CHARACTER_ID } from '../config/characters'
import { createDefaultStoredData } from '../types/records'
import { createMemoryStorageAdapter, loadStoredData, saveStoredData } from './storage'
import {
  awardCoins,
  createDefaultEconomy,
  normalizeEconomy,
  purchaseCharacter,
  selectCharacter,
} from './economy'
import { parseStoredData } from './storageSchema'
import { clearPlayRecords } from './clearPlayRecords'

describe('economy', () => {
  it('starts with default character owned and selected', () => {
    const economy = createDefaultEconomy()
    expect(economy.coins).toBe(0)
    expect(economy.ownedCharacterIds).toContain(DEFAULT_CHARACTER_ID)
    expect(economy.selectedCharacterId).toBe(DEFAULT_CHARACTER_ID)
  })

  it('awards coins and never goes negative via normalize', () => {
    const awarded = awardCoins(createDefaultEconomy(), 50)
    expect(awarded.ok).toBe(true)
    expect(awarded.economy.coins).toBe(50)

    const normalized = normalizeEconomy({ coins: -10, ownedCharacterIds: [], selectedCharacterId: 'nope' })
    expect(normalized.coins).toBe(0)
    expect(normalized.selectedCharacterId).toBe(DEFAULT_CHARACTER_ID)
    expect(normalized.ownedCharacterIds).toContain(DEFAULT_CHARACTER_ID)
  })

  it('purchases when coins are enough and deducts price', () => {
    const rich = awardCoins(createDefaultEconomy(), 100).economy
    const bought = purchaseCharacter(rich, 'shinobi-red')
    expect(bought.ok).toBe(true)
    expect(bought.economy.coins).toBe(0)
    expect(bought.economy.ownedCharacterIds).toContain('shinobi-red')
  })

  it('rejects purchase when coins are insufficient', () => {
    const result = purchaseCharacter(createDefaultEconomy(), 'shinobi-red')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('insufficient_coins')
    expect(result.economy.coins).toBe(0)
  })

  it('rejects duplicate purchase', () => {
    const rich = awardCoins(createDefaultEconomy(), 200).economy
    const once = purchaseCharacter(rich, 'shinobi-red')
    const twice = purchaseCharacter(once.economy, 'shinobi-red')
    expect(twice.ok).toBe(false)
    expect(twice.error).toBe('already_owned')
  })

  it('selects only owned characters', () => {
    const deny = selectCharacter(createDefaultEconomy(), 'shinobi-blue')
    expect(deny.ok).toBe(false)
    expect(deny.error).toBe('not_owned')

    const rich = awardCoins(createDefaultEconomy(), 200).economy
    const owned = purchaseCharacter(rich, 'shinobi-blue').economy
    const selected = selectCharacter(owned, 'shinobi-blue')
    expect(selected.ok).toBe(true)
    expect(selected.economy.selectedCharacterId).toBe('shinobi-blue')
  })

  it('rejects unknown character ids', () => {
    expect(purchaseCharacter(createDefaultEconomy(), 'ghost').error).toBe('unknown_character')
    expect(selectCharacter(createDefaultEconomy(), 'ghost').error).toBe('unknown_character')
  })

  it('persists economy across reload', () => {
    const adapter = createMemoryStorageAdapter()
    const data = createDefaultStoredData()
    data.economy = awardCoins(data.economy, 120).economy
    data.economy = purchaseCharacter(data.economy, 'shinobi-red').economy
    data.economy = selectCharacter(data.economy, 'shinobi-red').economy
    saveStoredData(data, adapter)

    const loaded = loadStoredData(adapter)
    expect(loaded.data.economy.coins).toBe(20)
    expect(loaded.data.economy.ownedCharacterIds).toContain('shinobi-red')
    expect(loaded.data.economy.selectedCharacterId).toBe('shinobi-red')
  })

  it('migrates schema v1 to v2 with default economy', () => {
    const migrated = parseStoredData({
      version: 1,
      settings: { volume: 0.5, muted: false, lastDifficulty: null, motionPreference: 'system' },
      aggregates: { totalPlays: 2, totalTypedChars: 10, bestComboAll: 1 },
      bestByDifficulty: { trainee: null, ninja: null, master: null },
      recentPlays: [],
    })
    expect(migrated.version).toBe(2)
    expect(migrated.economy).toEqual(createDefaultEconomy())
    expect(migrated.aggregates.totalPlays).toBe(2)
  })

  it('keeps economy after clearing play records', () => {
    const data = createDefaultStoredData()
    data.economy = {
      coins: 300,
      ownedCharacterIds: [DEFAULT_CHARACTER_ID, 'shinobi-gold'],
      selectedCharacterId: 'shinobi-gold',
    }
    data.aggregates.totalPlays = 3
    const cleared = clearPlayRecords(data)
    expect(cleared.economy).toEqual(data.economy)
    expect(cleared.aggregates.totalPlays).toBe(0)
  })
})
