import { describe, expect, it } from 'vitest'
import {
  CHARACTER_COUNT_BY_RARITY,
  characters,
  getCharacterById,
} from '../config/characters'
import {
  gachaConfig,
  RARITY_ORDER,
  RARITY_WEIGHTS,
  RARITY_WEIGHT_TOTAL,
} from '../config/gachaConfig'
import { formatRarityLabel } from '../config/rarityLabels'
import { assertAbilityHandled } from '../utils/characterAbilities'
import { rollRarity } from '../utils/gacha'
import { pickPeakRarity } from '../utils/playAbilityModifiers'
import { parseStoredData } from '../utils/storageSchema'

describe('character catalog (121)', () => {
  it('has exactly 121 characters', () => {
    expect(characters.length).toBe(121)
  })

  it('has correct counts per rarity', () => {
    expect(CHARACTER_COUNT_BY_RARITY.N).toBe(23)
    expect(CHARACTER_COUNT_BY_RARITY.R).toBe(23)
    expect(CHARACTER_COUNT_BY_RARITY.SR).toBe(24)
    expect(CHARACTER_COUNT_BY_RARITY.SSR).toBe(24)
    expect(CHARACTER_COUNT_BY_RARITY.UR).toBe(22)
    expect(CHARACTER_COUNT_BY_RARITY.SHINNIN).toBe(5)
  })

  it('has unique ids and names', () => {
    const ids = new Set(characters.map((c) => c.id))
    const names = new Set(characters.map((c) => c.name))
    expect(ids.size).toBe(121)
    expect(names.size).toBe(121)
  })

  it('keeps original 16 character ids', () => {
    const coreIds = [
      'shinobi-default',
      'shinobi-kage',
      'shinobi-midori',
      'shinobi-shirogane',
      'shinobi-byakuya',
      'shinobi-gekkou',
      'shinobi-red',
      'shinobi-blue',
      'shinobi-fuujin',
      'shinobi-akatsuki',
      'shinobi-gold',
      'shinobi-raikage',
      'shinobi-kokuen',
      'shinobi-yasha',
      'shinobi-kimen',
      'shinobi-tenko',
    ]
    for (const id of coreIds) {
      expect(getCharacterById(id)?.id).toBe(id)
    }
  })

  it('labels SHINNIN as 神忍', () => {
    expect(formatRarityLabel('SHINNIN')).toBe('神忍')
    const shinnin = characters.filter((c) => c.rarity === 'SHINNIN')
    expect(shinnin).toHaveLength(5)
    expect(shinnin.map((c) => c.name).sort()).toEqual([
      '八百万',
      '天津甦',
      '御柱茜',
      '界裂',
      '黄泉返',
    ])
  })

  it('has no HP-related abilities', () => {
    for (const character of characters) {
      expect(character.ability.type).not.toBe('damageReduction' as never)
      expect(character.ability.description).not.toMatch(/HP|被ダメージ|ダメージ軽減|防御/)
      assertAbilityHandled(character.ability)
    }
  })
})

describe('gacha rates with integer weights', () => {
  it('weights sum to 1000 (100%)', () => {
    expect(RARITY_WEIGHT_TOTAL).toBe(1000)
    const sum = RARITY_ORDER.reduce(
      (acc, rarity) => acc + RARITY_WEIGHTS[rarity],
      0,
    )
    expect(sum).toBe(1000)
  })

  it('has SHINNIN at 0.1%', () => {
    expect(gachaConfig.rarityRates.SHINNIN).toBeCloseTo(0.001, 5)
    expect(RARITY_WEIGHTS.SHINNIN).toBe(1)
  })

  it('can roll SHINNIN', () => {
    expect(rollRarity(() => 0.999)).toBe('SHINNIN')
  })

  it('maps cumulative thresholds', () => {
    expect(rollRarity(() => 0)).toBe('N')
    expect(rollRarity(() => 0.548)).toBe('N')
    expect(rollRarity(() => 0.549)).toBe('R')
    expect(rollRarity(() => 0.799)).toBe('SR')
    expect(rollRarity(() => 0.919)).toBe('SSR')
    expect(rollRarity(() => 0.979)).toBe('UR')
    expect(rollRarity(() => 0.999)).toBe('SHINNIN')
  })

  it('picks SHINNIN as peak over UR', () => {
    expect(pickPeakRarity(['UR', 'SHINNIN', 'N'])).toBe('SHINNIN')
    expect(pickPeakRarity(['UR', 'SSR'])).toBe('UR')
  })

  it('sets SHINNIN duplicate coins to 1000', () => {
    expect(gachaConfig.duplicateCoins.SHINNIN).toBe(1000)
  })
})

describe('legacy save compatibility', () => {
  it('loads v2 save without migration version bump', () => {
    const legacy = {
      version: 2,
      settings: {
        volume: 0.5,
        muted: false,
        lastDifficulty: 'trainee',
        motionPreference: 'system',
      },
      aggregates: {
        totalPlays: 1,
        totalTypedChars: 10,
        bestComboAll: 2,
      },
      bestByDifficulty: { trainee: null, ninja: null, master: null },
      recentPlays: [],
      economy: {
        coins: 200,
        ownedCharacterIds: ['shinobi-default', 'shinobi-red'],
        selectedCharacterId: 'shinobi-red',
      },
    }
    const parsed = parseStoredData(legacy)
    expect(parsed.version).toBe(3)
    expect(parsed.economy.coins).toBe(200)
    expect(parsed.economy.ownedCharacterIds).toContain('shinobi-red')
    expect(parsed.economy.selectedCharacterId).toBe('shinobi-red')
  })
})
