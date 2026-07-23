import { describe, expect, it } from 'vitest'
import { STORAGE_SCHEMA_VERSION, createDefaultStoredData } from '../types/records'
import {
  extractSchemaVersion,
  parseStoredData,
  validateAndNormalize,
} from './storageSchema'

describe('storageSchema', () => {
  it('creates normalized defaults for missing data', () => {
    const data = validateAndNormalize(undefined)
    expect(data.version).toBe(STORAGE_SCHEMA_VERSION)
    expect(data.recentPlays).toEqual([])
    expect(data.aggregates.totalPlays).toBe(0)
  })

  it('fills missing required fields from partial data', () => {
    const data = validateAndNormalize({
      version: 1,
      recentPlays: [{ id: 'x', playedAt: '2026-01-01', difficulty: 'ninja', score: 10 }],
    })

    expect(data.recentPlays).toHaveLength(1)
    expect(data.settings.motionPreference).toBe('system')
    expect(data.bestByDifficulty.trainee).toBeNull()
  })

  it('drops invalid play records and clamps numeric values', () => {
    const data = validateAndNormalize({
      version: 1,
      settings: { volume: 2, muted: 'yes', lastDifficulty: 'invalid', motionPreference: 'full' },
      aggregates: { totalPlays: -3, totalTypedChars: 'abc', bestComboAll: 5 },
      recentPlays: [
        { id: 'ok', playedAt: '2026-01-01T00:00:00.000Z', difficulty: 'ninja', score: 10 },
        { id: '', playedAt: '', difficulty: 'bad', score: 10 },
      ],
    })

    expect(data.settings.volume).toBe(1)
    expect(data.settings.muted).toBe(false)
    expect(data.settings.lastDifficulty).toBeNull()
    expect(data.aggregates.totalPlays).toBe(0)
    expect(data.recentPlays).toHaveLength(1)
  })

  it('migrates version 0 data to version 1', () => {
    const raw = { settings: {}, aggregates: {}, recentPlays: [] }
    expect(extractSchemaVersion(raw)).toBe(0)

    const migrated = parseStoredData(raw)
    expect(migrated.version).toBe(STORAGE_SCHEMA_VERSION)
  })

  it('falls back to defaults for unknown future versions', () => {
    const data = validateAndNormalize({
      version: 99,
      recentPlays: [{ id: 'future', playedAt: '2026-01-01', difficulty: 'ninja', score: 1 }],
    })
    expect(data).toEqual(createDefaultStoredData())
  })
})

describe('parseStoredData with corrupted input', () => {
  it('returns defaults when migration receives non-object input', () => {
    const data = parseStoredData(null)
    expect(data.version).toBe(STORAGE_SCHEMA_VERSION)
    expect(data.recentPlays).toEqual([])
  })
})
