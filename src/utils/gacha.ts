import {
  characters,
  type CharacterDefinition,
  type CharacterRarity,
} from '../config/characters'
import { gachaConfig, RARITY_ORDER } from '../config/gachaConfig'
import type { GachaHistoryEntry, StoredEconomy } from '../types/records'
import { generatePlayId } from '../types/records'

export type GachaRng = () => number

export type GachaPullType = 'single' | 'multi'

export interface GachaPullItem {
  characterId: string
  name: string
  rarity: CharacterRarity
  wasDuplicate: boolean
  duplicateCoins: number
  /** 新規入手時 true */
  newlyOwned: boolean
}

export interface GachaPullResult {
  ok: boolean
  economy: StoredEconomy
  error?: 'insufficient_coins' | 'empty_pool'
  pullType?: GachaPullType
  cost?: number
  items?: GachaPullItem[]
  totalDuplicateCoins?: number
  /** 演出用：結果中の最高レア */
  peakRarity?: CharacterRarity
}

function defaultRng(): number {
  return Math.random()
}

/** ガチャ対象（カタログ全体。初期所持の被りはコイン変換） */
export function getGachaPool(): readonly CharacterDefinition[] {
  return characters
}

export function rollRarity(
  rates: Record<CharacterRarity, number> = gachaConfig.rarityRates,
  rng: GachaRng = defaultRng,
): CharacterRarity {
  const roll = Math.min(0.999999, Math.max(0, rng()))
  let cumulative = 0
  for (const rarity of RARITY_ORDER) {
    cumulative += rates[rarity]
    if (roll < cumulative) {
      return rarity
    }
  }
  return 'N'
}

export function pickCharacterOfRarity(
  rarity: CharacterRarity,
  pool: readonly CharacterDefinition[] = getGachaPool(),
  rng: GachaRng = defaultRng,
): CharacterDefinition | null {
  const candidates = pool.filter((c) => c.rarity === rarity)
  if (candidates.length === 0) {
    return null
  }
  const index = Math.floor(rng() * candidates.length) % candidates.length
  return candidates[index] ?? null
}

export function duplicateCoinFor(rarity: CharacterRarity): number {
  return gachaConfig.duplicateCoins[rarity]
}

export function compareRarity(a: CharacterRarity, b: CharacterRarity): number {
  return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b)
}

function peakOf(items: GachaPullItem[]): CharacterRarity {
  return items.reduce<CharacterRarity>(
    (peak, item) => (compareRarity(item.rarity, peak) > 0 ? item.rarity : peak),
    'N',
  )
}

function appendHistory(
  history: GachaHistoryEntry[],
  entries: GachaHistoryEntry[],
): GachaHistoryEntry[] {
  return [...entries, ...history].slice(0, gachaConfig.historyLimit)
}

function rollOne(
  ownedSet: Set<string>,
  rng: GachaRng,
  pool: readonly CharacterDefinition[],
): GachaPullItem | null {
  const rarity = rollRarity(gachaConfig.rarityRates, rng)
  const character = pickCharacterOfRarity(rarity, pool, rng)
  if (!character) {
    return null
  }
  const wasDuplicate = ownedSet.has(character.id)
  const duplicateCoins = wasDuplicate ? duplicateCoinFor(character.rarity) : 0
  if (!wasDuplicate) {
    ownedSet.add(character.id)
  }
  return {
    characterId: character.id,
    name: character.name,
    rarity: character.rarity,
    wasDuplicate,
    duplicateCoins,
    newlyOwned: !wasDuplicate,
  }
}

export function pullGacha(
  economy: StoredEconomy,
  pullType: GachaPullType,
  rng: GachaRng = defaultRng,
  nowIso: string = new Date().toISOString(),
): GachaPullResult {
  const cost =
    pullType === 'single' ? gachaConfig.singleCost : gachaConfig.multiCost
  const count = pullType === 'single' ? 1 : gachaConfig.multiCount

  if (economy.coins < cost) {
    return { ok: false, economy, error: 'insufficient_coins' }
  }

  const pool = getGachaPool()
  if (pool.length === 0) {
    return { ok: false, economy, error: 'empty_pool' }
  }

  const ownedSet = new Set(economy.ownedCharacterIds)
  const items: GachaPullItem[] = []

  for (let i = 0; i < count; i += 1) {
    const item = rollOne(ownedSet, rng, pool)
    if (!item) {
      return { ok: false, economy, error: 'empty_pool' }
    }
    items.push(item)
  }

  const totalDuplicateCoins = items.reduce(
    (sum, item) => sum + item.duplicateCoins,
    0,
  )
  const historyEntries: GachaHistoryEntry[] = items.map((item) => ({
    id: generatePlayId(),
    pulledAt: nowIso,
    characterId: item.characterId,
    rarity: item.rarity,
    wasDuplicate: item.wasDuplicate,
    duplicateCoins: item.duplicateCoins,
    pullType,
  }))

  return {
    ok: true,
    economy: {
      ...economy,
      coins: economy.coins - cost + totalDuplicateCoins,
      ownedCharacterIds: [...ownedSet],
      gachaHistory: appendHistory(economy.gachaHistory, historyEntries),
    },
    pullType,
    cost,
    items,
    totalDuplicateCoins,
    peakRarity: peakOf(items),
  }
}
