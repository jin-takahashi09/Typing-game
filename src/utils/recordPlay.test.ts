import { describe, expect, it } from 'vitest'
import type { GameResultSummary } from '../types/game'
import { createDefaultStoredData } from '../types/records'
import { applyPlayResult } from './recordPlay'

function makeSummary(overrides: Partial<GameResultSummary> = {}): GameResultSummary {
  return {
    difficulty: 'trainee',
    score: 100,
    stage: 2,
    destroyedTargets: 4,
    failedTargets: 0,
    maxCombo: 2,
    typedChars: 30,
    correctChars: 28,
    missCount: 2,
    elapsedMs: 45_000,
    wpm: 6,
    accuracy: 93.3,
    successRate: 100,
    characterId: 'shinobi-default',
    abilityBonusScore: 0,
    abilityBonusCoins: 0,
    endReason: 'timeout',
    timeLimitSeconds: 90,
    ...overrides,
  }
}

describe('recordPlay', () => {
  it('creates initial play record and best on first play', () => {
    const data = applyPlayResult(createDefaultStoredData(), makeSummary(), {
      playId: 'play-1',
      playedAt: '2026-01-01T00:00:00.000Z',
      recentPlaysLimit: 50,
    })

    expect(data.aggregates.totalPlays).toBe(1)
    expect(data.recentPlays).toHaveLength(1)
    expect(data.recentPlays[0]?.id).toBe('play-1')
    expect(data.bestByDifficulty.trainee?.score).toBe(100)
    expect(data.settings.lastDifficulty).toBe('trainee')
  })

  it('prepends history and enforces the recent plays limit', () => {
    let data = createDefaultStoredData()
    for (let index = 0; index < 3; index += 1) {
      data = applyPlayResult(data, makeSummary({ score: index + 1 }), {
        playId: `play-${index}`,
        playedAt: `2026-01-0${index + 1}T00:00:00.000Z`,
        recentPlaysLimit: 2,
      })
    }

    expect(data.recentPlays).toHaveLength(2)
    expect(data.recentPlays[0]?.score).toBe(3)
    expect(data.recentPlays[1]?.score).toBe(2)
    expect(data.aggregates.totalPlays).toBe(3)
  })

  it('updates best only when the new record is better', () => {
    let data = applyPlayResult(createDefaultStoredData(), makeSummary({ score: 200 }), {
      playId: 'best',
      playedAt: '2026-01-01T00:00:00.000Z',
      recentPlaysLimit: 50,
    })

    data = applyPlayResult(data, makeSummary({ score: 150 }), {
      playId: 'worse',
      playedAt: '2026-01-02T00:00:00.000Z',
      recentPlaysLimit: 50,
    })

    expect(data.bestByDifficulty.trainee?.score).toBe(200)
    expect(data.bestByDifficulty.trainee?.playId).toBe('best')
  })

  it('stores all required play fields', () => {
    const data = applyPlayResult(createDefaultStoredData(), makeSummary(), {
      playId: 'full',
      playedAt: '2026-01-01T00:00:00.000Z',
      recentPlaysLimit: 50,
    })

    const play = data.recentPlays[0]!
    expect(play).toMatchObject({
      id: 'full',
      playedAt: '2026-01-01T00:00:00.000Z',
      difficulty: 'trainee',
      score: 100,
      stage: 2,
      destroyedTargets: 4,
      maxCombo: 2,
      typedChars: 30,
      correctChars: 28,
      missCount: 2,
      elapsedMs: 45_000,
      wpm: 6,
      accuracy: 93.3,
    })
  })
})
