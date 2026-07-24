import { describe, expect, it } from 'vitest'
import type { GameResultSummary } from '../types/game'
import { createDefaultStoredData } from '../types/records'
import { createMemoryStorageAdapter } from './storage'
import { persistPlayResult } from './persistPlayResult'

function makeSummary(overrides: Partial<GameResultSummary> = {}): GameResultSummary {
  return {
    difficulty: 'ninja',
    score: 120,
    stage: 3,
    destroyedTargets: 6,
    maxCombo: 4,
    typedChars: 50,
    correctChars: 45,
    missCount: 5,
    elapsedMs: 70_000,
    wpm: 8,
    accuracy: 90,
    characterId: 'shinobi-default',
    abilityBonusScore: 0,
    abilityBonusCoins: 0,
    endReason: 'defense',
    timeLimitSeconds: 90,
    ...overrides,
  }
}

describe('persistPlayResult', () => {
  it('persists once and writes to storage', () => {
    const adapter = createMemoryStorageAdapter()
    const first = persistPlayResult(createDefaultStoredData(), makeSummary(), { adapter })
    const second = persistPlayResult(first.data, makeSummary({ score: 80 }), { adapter })

    expect(first.data.aggregates.totalPlays).toBe(1)
    expect(second.data.aggregates.totalPlays).toBe(2)
    expect(first.saveResult.ok).toBe(true)
  })

  it('does not duplicate the same play when called twice with separate sessions manually prevented', () => {
    const adapter = createMemoryStorageAdapter()
    const savedSessions = new Set<number>()

    const runOnce = (sessionId: number) => {
      if (savedSessions.has(sessionId)) {
        return null
      }
      savedSessions.add(sessionId)
      return persistPlayResult(createDefaultStoredData(), makeSummary(), { adapter })
    }

    expect(runOnce(1)?.data.aggregates.totalPlays).toBe(1)
    expect(runOnce(1)).toBeNull()
    expect(runOnce(2)?.data.aggregates.totalPlays).toBe(1)
  })
})
