import {
  DEFAULT_CHARACTER_ID,
  isKnownCharacterId,
} from '../config/characters'
import type { GachaHistoryEntry, StoredEconomy } from '../types/records'
import { gachaConfig } from '../config/gachaConfig'
import type { CharacterRarity } from '../config/characters'

export type EconomyErrorCode =
  | 'insufficient_coins'
  | 'unknown_character'
  | 'not_owned'
  | 'invalid_amount'

export interface EconomyMutationResult {
  ok: boolean
  economy: StoredEconomy
  error?: EconomyErrorCode
}

const RARITIES: CharacterRarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'SHINNIN']

export function createDefaultEconomy(): StoredEconomy {
  return {
    coins: 0,
    ownedCharacterIds: [DEFAULT_CHARACTER_ID],
    selectedCharacterId: DEFAULT_CHARACTER_ID,
    gachaHistory: [],
  }
}

export function awardCoins(
  economy: StoredEconomy,
  amount: number,
): EconomyMutationResult {
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, economy, error: 'invalid_amount' }
  }
  if (amount === 0) {
    return { ok: true, economy }
  }

  return {
    ok: true,
    economy: {
      ...economy,
      coins: economy.coins + Math.floor(amount),
    },
  }
}

export function selectCharacter(
  economy: StoredEconomy,
  characterId: string,
): EconomyMutationResult {
  if (!isKnownCharacterId(characterId)) {
    return { ok: false, economy, error: 'unknown_character' }
  }
  if (!economy.ownedCharacterIds.includes(characterId)) {
    return { ok: false, economy, error: 'not_owned' }
  }

  return {
    ok: true,
    economy: {
      ...economy,
      selectedCharacterId: characterId,
    },
  }
}

function normalizeGachaHistory(raw: unknown): GachaHistoryEntry[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const entries: GachaHistoryEntry[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue
    }
    const record = item as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    const pulledAt = typeof record.pulledAt === 'string' ? record.pulledAt : ''
    const characterId =
      typeof record.characterId === 'string' && isKnownCharacterId(record.characterId)
        ? record.characterId
        : ''
    const rarity =
      typeof record.rarity === 'string' &&
      RARITIES.includes(record.rarity as CharacterRarity)
        ? (record.rarity as CharacterRarity)
        : null
    const pullType =
      record.pullType === 'single' || record.pullType === 'multi'
        ? record.pullType
        : null
    if (!id || !pulledAt || !characterId || !rarity || !pullType) {
      continue
    }
    const duplicateCoinsRaw =
      typeof record.duplicateCoins === 'number'
        ? record.duplicateCoins
        : Number(record.duplicateCoins)
    entries.push({
      id,
      pulledAt,
      characterId,
      rarity,
      wasDuplicate: Boolean(record.wasDuplicate),
      duplicateCoins: Number.isFinite(duplicateCoinsRaw)
        ? Math.max(0, Math.floor(duplicateCoinsRaw))
        : 0,
      pullType,
    })
    if (entries.length >= gachaConfig.historyLimit) {
      break
    }
  }
  return entries
}

/** 不正な economy を安全な初期状態へ正規化 */
export function normalizeEconomy(raw: unknown): StoredEconomy {
  const defaults = createDefaultEconomy()
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return defaults
  }

  const record = raw as Record<string, unknown>
  const coinsRaw =
    typeof record.coins === 'number' ? record.coins : Number(record.coins)
  const coins = Number.isFinite(coinsRaw) ? Math.max(0, Math.floor(coinsRaw)) : 0

  const ownedRaw = Array.isArray(record.ownedCharacterIds)
    ? record.ownedCharacterIds
    : []
  const owned = [
    ...new Set(
      ownedRaw.filter(
        (id): id is string => typeof id === 'string' && isKnownCharacterId(id),
      ),
    ),
  ]
  if (!owned.includes(DEFAULT_CHARACTER_ID)) {
    owned.unshift(DEFAULT_CHARACTER_ID)
  }

  const selectedRaw =
    typeof record.selectedCharacterId === 'string'
      ? record.selectedCharacterId
      : DEFAULT_CHARACTER_ID
  const selectedCharacterId =
    owned.includes(selectedRaw) && isKnownCharacterId(selectedRaw)
      ? selectedRaw
      : DEFAULT_CHARACTER_ID

  return {
    coins,
    ownedCharacterIds: owned,
    selectedCharacterId,
    gachaHistory: normalizeGachaHistory(record.gachaHistory),
  }
}

export function getEconomyErrorMessage(code: EconomyErrorCode | undefined): string {
  switch (code) {
    case 'insufficient_coins':
      return 'コインが足りません'
    case 'unknown_character':
      return '存在しないキャラクターです'
    case 'not_owned':
      return '未所持のキャラクターは選べません'
    case 'invalid_amount':
      return '不正なコイン量です'
    default:
      return '処理に失敗しました'
  }
}
