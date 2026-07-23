import {
  DEFAULT_CHARACTER_ID,
  getCharacterById,
  isKnownCharacterId,
} from '../config/characters'
import type { StoredEconomy } from '../types/records'

export type EconomyErrorCode =
  | 'insufficient_coins'
  | 'already_owned'
  | 'unknown_character'
  | 'not_owned'
  | 'invalid_amount'

export interface EconomyMutationResult {
  ok: boolean
  economy: StoredEconomy
  error?: EconomyErrorCode
}

export function createDefaultEconomy(): StoredEconomy {
  return {
    coins: 0,
    ownedCharacterIds: [DEFAULT_CHARACTER_ID],
    selectedCharacterId: DEFAULT_CHARACTER_ID,
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

export function purchaseCharacter(
  economy: StoredEconomy,
  characterId: string,
): EconomyMutationResult {
  const character = getCharacterById(characterId)
  if (!character) {
    return { ok: false, economy, error: 'unknown_character' }
  }
  if (economy.ownedCharacterIds.includes(characterId)) {
    return { ok: false, economy, error: 'already_owned' }
  }
  if (economy.coins < character.price) {
    return { ok: false, economy, error: 'insufficient_coins' }
  }

  return {
    ok: true,
    economy: {
      ...economy,
      coins: economy.coins - character.price,
      ownedCharacterIds: [...economy.ownedCharacterIds, characterId],
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
  }
}

export function getEconomyErrorMessage(code: EconomyErrorCode | undefined): string {
  switch (code) {
    case 'insufficient_coins':
      return 'コインが足りません'
    case 'already_owned':
      return 'すでに所持しています'
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
