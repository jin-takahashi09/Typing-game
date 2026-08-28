import { describe, expect, it } from 'vitest'
import { DEFAULT_CHARACTER_ID } from '../config/characters'
import { createDefaultStoredData } from '../types/records'
import { createMemoryStorageAdapter, loadStoredData, saveStoredData } from './storage'
import {
  awardCoins,
  createDefaultEconomy,
  normalizeEconomy,
  selectCharacter,
} from './economy'
import { pullGacha } from './gacha'
import { parseStoredData } from './storageSchema'
import { clearPlayRecords } from './clearPlayRecords'

describe('economy', () => {
  it('starts with default character owned and selected', () => {
    const economy = createDefaultEconomy()
    expect(economy.coins).toBe(0)
    expect(economy.ownedCharacterIds).toContain(DEFAULT_CHARACTER_ID)
    expect(economy.selectedCharacterId).toBe(DEFAULT_CHARACTER_ID)
    expect(economy.gachaHistory).toEqual([])
  })

  it('awards coins and never goes negative via normalize', () => {
    const awarded = awardCoins(createDefaultEconomy(), 50)
    expect(awarded.ok).toBe(true)
    expect(awarded.economy.coins).toBe(50)

    const normalized = normalizeEconomy({
      coins: -10,
      ownedCharacterIds: [],
      selectedCharacterId: 'nope',
    })
    expect(normalized.coins).toBe(0)
    expect(normalized.selectedCharacterId).toBe(DEFAULT_CHARACTER_ID)
    expect(normalized.ownedCharacterIds).toContain(DEFAULT_CHARACTER_ID)
    expect(normalized.gachaHistory).toEqual([])
  })

  it('selects only owned characters', () => {
    const deny = selectCharacter(createDefaultEconomy(), 'shinobi-blue')
    expect(deny.ok).toBe(false)
    expect(deny.error).toBe('not_owned')

    let economy = awardCoins(createDefaultEconomy(), 1000).economy
    economy = {
      ...economy,
      ownedCharacterIds: [...economy.ownedCharacterIds, 'shinobi-blue'],
    }
    const selected = selectCharacter(economy, 'shinobi-blue')
    expect(selected.ok).toBe(true)
    expect(selected.economy.selectedCharacterId).toBe('shinobi-blue')
  })

  it('rejects unknown character ids', () => {
    expect(selectCharacter(createDefaultEconomy(), 'ghost').error).toBe(
      'unknown_character',
    )
  })

  it('persists economy and gacha history across reload', () => {
    const adapter = createMemoryStorageAdapter()
    const data = createDefaultStoredData()
    let economy = awardCoins(data.economy, 1000).economy
    const pulled = pullGacha(economy, 'single', () => 0.01)
    expect(pulled.ok).toBe(true)
    economy = pulled.economy!
    const newId = pulled.items!.find((item) => item.newlyOwned)?.characterId
    if (newId) {
      economy = selectCharacter(economy, newId).economy
    }
    data.economy = economy
    saveStoredData(data, adapter)

    const loaded = loadStoredData(adapter)
    expect(loaded.data.economy.coins).toBe(economy.coins)
    expect(loaded.data.economy.gachaHistory.length).toBeGreaterThan(0)
    expect(loaded.data.version).toBe(3)
  })

  it('migrates schema v1 to v3 with default economy', () => {
    const migrated = parseStoredData({
      version: 1,
      settings: {
        volume: 0.5,
        muted: false,
        lastDifficulty: null,
        motionPreference: 'system',
      },
      aggregates: { totalPlays: 2, totalTypedChars: 10, bestComboAll: 1 },
      bestByDifficulty: { trainee: null, ninja: null, master: null },
      recentPlays: [],
    })
    expect(migrated.version).toBe(3)
    expect(migrated.economy).toEqual(createDefaultEconomy())
    expect(migrated.aggregates.totalPlays).toBe(2)
  })

  it('migrates schema v2 economy to include gachaHistory', () => {
    const migrated = parseStoredData({
      version: 2,
      settings: {
        volume: 0.5,
        muted: false,
        lastDifficulty: null,
        motionPreference: 'system',
      },
      aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
      bestByDifficulty: { trainee: null, ninja: null, master: null },
      recentPlays: [],
      economy: {
        coins: 40,
        ownedCharacterIds: [DEFAULT_CHARACTER_ID, 'shinobi-red'],
        selectedCharacterId: 'shinobi-red',
      },
    })
    expect(migrated.version).toBe(3)
    expect(migrated.economy.coins).toBe(40)
    expect(migrated.economy.ownedCharacterIds).toContain('shinobi-red')
    expect(migrated.economy.gachaHistory).toEqual([])
  })

  it('keeps economy after clearing play records', () => {
    const data = createDefaultStoredData()
    data.economy = {
      coins: 300,
      ownedCharacterIds: [DEFAULT_CHARACTER_ID, 'shinobi-gold'],
      selectedCharacterId: 'shinobi-gold',
      gachaHistory: [],
    }
    data.aggregates.totalPlays = 3
    const cleared = clearPlayRecords(data)
    expect(cleared.economy).toEqual(data.economy)
    expect(cleared.aggregates.totalPlays).toBe(0)
  })
})
