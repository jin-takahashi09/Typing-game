import { describe, expect, it } from 'vitest'
import type { GameResultSummary } from '../types/game'
import { createDefaultStoredData } from '../types/records'
import {
  buildPlayComparison,
  findPreviousPlayForDifficulty,
  isBetterBest,
} from './comparePlay'
import { createPlayRecordFromResult } from './recordPlay'

function makeSummary(overrides: Partial<GameResultSummary> = {}): GameResultSummary {
  return {
    difficulty: 'ninja',
    score: 100,
    stage: 2,
    destroyedTargets: 5,
    maxCombo: 3,
    typedChars: 40,
    correctChars: 36,
    missCount: 4,
    elapsedMs: 60_000,
    wpm: 7.2,
    accuracy: 90,
    characterId: 'shinobi-default',
    abilityBonusScore: 0,
    abilityBonusCoins: 0,
    endReason: 'defense',
    timeLimitSeconds: 90,
    ...overrides,
  }
}

describe('comparePlay', () => {
  it('finds previous play for the same difficulty only', () => {
    const data = createDefaultStoredData()
    data.recentPlays = [
      createPlayRecordFromResult(makeSummary({ difficulty: 'ninja', score: 80 }), {
        playId: '1',
        playedAt: '2026-01-01T00:00:00.000Z',
      }),
      createPlayRecordFromResult(makeSummary({ difficulty: 'trainee', score: 50 }), {
        playId: '2',
        playedAt: '2026-01-02T00:00:00.000Z',
      }),
    ]

    const previous = findPreviousPlayForDifficulty(data.recentPlays, 'ninja')
    expect(previous?.score).toBe(80)
  })

  it('builds comparison without previous play', () => {
    const comparison = buildPlayComparison(createDefaultStoredData(), makeSummary())
    expect(comparison.previous).toBeNull()
    expect(comparison.scoreDelta).toBeNull()
    expect(comparison.isNewBestScore).toBe(true)
  })

  it('builds deltas against previous play', () => {
    let data = createDefaultStoredData()
    data = {
      ...data,
      recentPlays: [
        createPlayRecordFromResult(makeSummary({ score: 80, wpm: 6, accuracy: 80 }), {
          playId: 'prev',
          playedAt: '2026-01-01T00:00:00.000Z',
        }),
      ],
    }

    const comparison = buildPlayComparison(data, makeSummary({ score: 100, wpm: 7.2, accuracy: 90 }))
    expect(comparison.scoreDelta).toBe(20)
    expect(comparison.wpmDelta).toBe(1.2)
    expect(comparison.accuracyDelta).toBe(10)
  })

  it('uses score, then wpm, then accuracy, then stage for best tie-break', () => {
    const base = createPlayRecordFromResult(makeSummary(), {
      playId: 'base',
      playedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(isBetterBest({ ...base, score: 120 }, {
      score: 100,
      wpm: 99,
      accuracy: 99,
      maxCombo: 1,
      stage: 9,
      destroyedTargets: 1,
      elapsedMs: 1,
      updatedAt: '',
      playId: 'old',
    })).toBe(true)

    expect(isBetterBest({ ...base, score: 100, wpm: 8, accuracy: 50 }, {
      score: 100,
      wpm: 7,
      accuracy: 99,
      maxCombo: 1,
      stage: 9,
      destroyedTargets: 1,
      elapsedMs: 1,
      updatedAt: '',
      playId: 'old',
    })).toBe(true)

    expect(isBetterBest({ ...base, score: 100, wpm: 7.2, accuracy: 91, stage: 3 }, {
      score: 100,
      wpm: 7.2,
      accuracy: 90,
      maxCombo: 1,
      stage: 2,
      destroyedTargets: 1,
      elapsedMs: 1,
      updatedAt: '',
      playId: 'old',
    })).toBe(true)

    expect(isBetterBest({ ...base, score: 90 }, {
      score: 100,
      wpm: 1,
      accuracy: 1,
      maxCombo: 1,
      stage: 1,
      destroyedTargets: 1,
      elapsedMs: 1,
      updatedAt: '',
      playId: 'old',
    })).toBe(false)
  })
})
