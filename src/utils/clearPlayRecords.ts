import type { StoredAppData } from '../types/records'
import { createEmptyBestByDifficulty } from '../types/records'

/**
 * Clears play records while preserving user settings.
 */
export function clearPlayRecords(data: StoredAppData): StoredAppData {
  return {
    ...data,
    aggregates: {
      totalPlays: 0,
      totalTypedChars: 0,
      bestComboAll: 0,
    },
    bestByDifficulty: createEmptyBestByDifficulty(),
    recentPlays: [],
  }
}
