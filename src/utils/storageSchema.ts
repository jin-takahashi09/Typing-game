import type { DifficultyId, MotionPreference } from '../types/app'
import type {
  BestRecord,
  PlayRecord,
  StoredAggregates,
  StoredAppData,
  StoredSettings,
} from '../types/records'
import {
  STORAGE_SCHEMA_VERSION,
  createDefaultStoredData,
  createEmptyBestByDifficulty,
} from '../types/records'
import { DEFAULT_CHARACTER_ID, isKnownCharacterId } from '../config/characters'
import { normalizeEconomy, createDefaultEconomy } from './economy'

const DIFFICULTY_IDS: DifficultyId[] = ['trainee', 'ninja', 'master']
const MOTION_PREFERENCES: MotionPreference[] = ['system', 'reduced', 'full']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) {
    return fallback
  }
  return num
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  return Math.max(0, toFiniteNumber(value, fallback))
}

function toDifficultyId(value: unknown): DifficultyId | null {
  if (typeof value === 'string' && DIFFICULTY_IDS.includes(value as DifficultyId)) {
    return value as DifficultyId
  }
  return null
}

function toMotionPreference(value: unknown): MotionPreference {
  if (typeof value === 'string' && MOTION_PREFERENCES.includes(value as MotionPreference)) {
    return value as MotionPreference
  }
  return 'system'
}

function normalizeSettings(raw: unknown, defaults: StoredSettings): StoredSettings {
  if (!isObject(raw)) {
    return defaults
  }

  const volume = toFiniteNumber(raw.volume, defaults.volume)
  return {
    volume: Math.min(1, Math.max(0, volume)),
    muted: typeof raw.muted === 'boolean' ? raw.muted : defaults.muted,
    lastDifficulty: toDifficultyId(raw.lastDifficulty) ?? defaults.lastDifficulty,
    motionPreference: toMotionPreference(raw.motionPreference),
  }
}

function normalizeAggregates(raw: unknown, defaults: StoredAggregates): StoredAggregates {
  if (!isObject(raw)) {
    return defaults
  }

  return {
    totalPlays: toNonNegativeNumber(raw.totalPlays, defaults.totalPlays),
    totalTypedChars: toNonNegativeNumber(raw.totalTypedChars, defaults.totalTypedChars),
    bestComboAll: toNonNegativeNumber(raw.bestComboAll, defaults.bestComboAll),
  }
}

function normalizeBestRecord(raw: unknown): BestRecord | null {
  if (!isObject(raw)) {
    return null
  }

  const difficultyScore = toNonNegativeNumber(raw.score, -1)
  if (difficultyScore < 0) {
    return null
  }

  const playId = typeof raw.playId === 'string' ? raw.playId : ''
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString()
  if (!playId) {
    return null
  }

  return {
    score: difficultyScore,
    wpm: toNonNegativeNumber(raw.wpm),
    accuracy: toNonNegativeNumber(raw.accuracy),
    maxCombo: toNonNegativeNumber(raw.maxCombo),
    stage: toNonNegativeNumber(raw.stage, 1),
    destroyedTargets: toNonNegativeNumber(raw.destroyedTargets),
    elapsedMs: toNonNegativeNumber(raw.elapsedMs),
    updatedAt,
    playId,
  }
}

function normalizePlayRecord(raw: unknown): PlayRecord | null {
  if (!isObject(raw)) {
    return null
  }

  const difficulty = toDifficultyId(raw.difficulty)
  const id = typeof raw.id === 'string' ? raw.id : ''
  const playedAt = typeof raw.playedAt === 'string' ? raw.playedAt : ''
  if (!difficulty || !id || !playedAt) {
    return null
  }

  const characterIdRaw =
    typeof raw.characterId === 'string' && isKnownCharacterId(raw.characterId)
      ? raw.characterId
      : DEFAULT_CHARACTER_ID

  const abilityBonusScore =
    raw.abilityBonusScore === undefined
      ? undefined
      : toNonNegativeNumber(raw.abilityBonusScore)
  const abilityBonusCoins =
    raw.abilityBonusCoins === undefined
      ? undefined
      : toNonNegativeNumber(raw.abilityBonusCoins)

  const endReasonRaw = raw.endReason
  const endReason =
    endReasonRaw === 'defense' || endReasonRaw === 'timeout'
      ? endReasonRaw
      : undefined
  const timeLimitSeconds =
    raw.timeLimitSeconds === undefined
      ? undefined
      : toNonNegativeNumber(raw.timeLimitSeconds)
  const maxPerfectStreak =
    raw.maxPerfectStreak === undefined
      ? undefined
      : toNonNegativeNumber(raw.maxPerfectStreak)
  const bonusTimeSeconds =
    raw.bonusTimeSeconds === undefined
      ? undefined
      : toNonNegativeNumber(raw.bonusTimeSeconds)
  const streakRewardCoins =
    raw.streakRewardCoins === undefined
      ? undefined
      : toNonNegativeNumber(raw.streakRewardCoins)

  return {
    id,
    playedAt,
    difficulty,
    score: toNonNegativeNumber(raw.score),
    stage: toNonNegativeNumber(raw.stage, 1),
    destroyedTargets: toNonNegativeNumber(raw.destroyedTargets),
    elapsedMs: toNonNegativeNumber(raw.elapsedMs),
    typedChars: toNonNegativeNumber(raw.typedChars),
    correctChars: toNonNegativeNumber(raw.correctChars),
    missCount: toNonNegativeNumber(raw.missCount),
    accuracy: toNonNegativeNumber(raw.accuracy),
    wpm: toNonNegativeNumber(raw.wpm),
    maxCombo: toNonNegativeNumber(raw.maxCombo),
    characterId: characterIdRaw,
    ...(abilityBonusScore !== undefined ? { abilityBonusScore } : {}),
    ...(abilityBonusCoins !== undefined ? { abilityBonusCoins } : {}),
    ...(endReason !== undefined ? { endReason } : {}),
    ...(timeLimitSeconds !== undefined ? { timeLimitSeconds } : {}),
    ...(maxPerfectStreak !== undefined ? { maxPerfectStreak } : {}),
    ...(bonusTimeSeconds !== undefined ? { bonusTimeSeconds } : {}),
    ...(streakRewardCoins !== undefined ? { streakRewardCoins } : {}),
  }
}

function normalizeBestByDifficulty(
  raw: unknown,
  defaults: Record<DifficultyId, BestRecord | null>,
): Record<DifficultyId, BestRecord | null> {
  const next = createEmptyBestByDifficulty()
  if (!isObject(raw)) {
    return defaults
  }

  for (const id of DIFFICULTY_IDS) {
    next[id] = normalizeBestRecord(raw[id]) ?? defaults[id] ?? null
  }
  return next
}

function normalizeRecentPlays(raw: unknown): PlayRecord[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((item) => normalizePlayRecord(item))
    .filter((item): item is PlayRecord => item !== null)
}

export function extractSchemaVersion(raw: unknown): number {
  if (!isObject(raw)) {
    return 0
  }
  return toNonNegativeNumber(raw.version, 0)
}

type MigrationStep = (raw: unknown) => unknown

/** version N のデータを version N+1 へ */
const migrationSteps: Partial<Record<number, MigrationStep>> = {
  0: (raw) => {
    if (!isObject(raw)) {
      return createDefaultStoredData()
    }
    return { ...raw, version: 1 }
  },
  1: (raw) => {
    if (!isObject(raw)) {
      return createDefaultStoredData()
    }
    return {
      ...raw,
      version: 2,
      economy: createDefaultEconomy(),
    }
  },
}

export function migrateStoredData(raw: unknown): unknown {
  let current = raw
  let version = extractSchemaVersion(current)

  while (version < STORAGE_SCHEMA_VERSION) {
    const step = migrationSteps[version]
    if (!step) {
      break
    }
    current = step(current)
    version = extractSchemaVersion(current)
  }

  return current
}

export function validateAndNormalize(raw: unknown): StoredAppData {
  const defaults = createDefaultStoredData()

  if (!isObject(raw)) {
    return defaults
  }

  const version = extractSchemaVersion(raw)
  if (version > STORAGE_SCHEMA_VERSION) {
    console.warn(
      `[storage] Unknown schema version ${version}. Using defaults.`,
    )
    return defaults
  }

  return {
    version: STORAGE_SCHEMA_VERSION,
    settings: normalizeSettings(raw.settings, defaults.settings),
    aggregates: normalizeAggregates(raw.aggregates, defaults.aggregates),
    bestByDifficulty: normalizeBestByDifficulty(
      raw.bestByDifficulty,
      defaults.bestByDifficulty,
    ),
    recentPlays: normalizeRecentPlays(raw.recentPlays),
    economy: normalizeEconomy(raw.economy),
  }
}

export function parseStoredData(raw: unknown): StoredAppData {
  const migrated = migrateStoredData(raw)
  return validateAndNormalize(migrated)
}
