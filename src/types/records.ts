import type { DifficultyId, MotionPreference } from './app'
import { gameConfig } from '../config/gameConfig'
import { DEFAULT_CHARACTER_ID } from '../config/characters'

export const STORAGE_SCHEMA_VERSION = gameConfig.storageVersion

export interface StoredSettings {
  volume: number
  muted: boolean
  lastDifficulty: DifficultyId | null
  motionPreference: MotionPreference
}

export interface StoredAggregates {
  totalPlays: number
  totalTypedChars: number
  bestComboAll: number
}

export interface BestRecord {
  score: number
  wpm: number
  accuracy: number
  maxCombo: number
  stage: number
  destroyedTargets: number
  elapsedMs: number
  updatedAt: string
  playId: string
}

export interface PlayRecord {
  id: string
  playedAt: string
  difficulty: DifficultyId
  score: number
  stage: number
  destroyedTargets: number
  elapsedMs: number
  typedChars: number
  correctChars: number
  missCount: number
  accuracy: number
  wpm: number
  maxCombo: number
}

export interface PlayComparison {
  previous: PlayRecord | null
  scoreDelta: number | null
  wpmDelta: number | null
  accuracyDelta: number | null
  isNewBestScore: boolean
  isNewBestWpm: boolean
  isNewBestAccuracy: boolean
}

export interface StoredEconomy {
  coins: number
  ownedCharacterIds: string[]
  selectedCharacterId: string
}

export interface StoredAppData {
  version: number
  settings: StoredSettings
  aggregates: StoredAggregates
  bestByDifficulty: Record<DifficultyId, BestRecord | null>
  recentPlays: PlayRecord[]
  economy: StoredEconomy
}

export type SaveStorageError = 'quota' | 'unavailable' | 'unknown'

export interface SaveStorageResult {
  ok: boolean
  error?: SaveStorageError
}

const DIFFICULTY_IDS: DifficultyId[] = ['trainee', 'ninja', 'master']

export function createDefaultStoredData(): StoredAppData {
  return {
    version: STORAGE_SCHEMA_VERSION,
    settings: {
      volume: 0.7,
      muted: false,
      lastDifficulty: null,
      motionPreference: 'system',
    },
    aggregates: {
      totalPlays: 0,
      totalTypedChars: 0,
      bestComboAll: 0,
    },
    bestByDifficulty: {
      trainee: null,
      ninja: null,
      master: null,
    },
    recentPlays: [],
    economy: {
      coins: 0,
      ownedCharacterIds: [DEFAULT_CHARACTER_ID],
      selectedCharacterId: DEFAULT_CHARACTER_ID,
    },
  }
}

export function createEmptyBestByDifficulty(): Record<DifficultyId, BestRecord | null> {
  return Object.fromEntries(
    DIFFICULTY_IDS.map((id) => [id, null]),
  ) as Record<DifficultyId, BestRecord | null>
}

export function generatePlayId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
