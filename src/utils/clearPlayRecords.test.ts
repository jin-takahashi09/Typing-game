import { describe, expect, it } from 'vitest'
import { createDefaultStoredData } from '../types/records'
import { clearPlayRecords } from './clearPlayRecords'

describe('clearPlayRecords', () => {
  it('clears bests, history, and aggregates while keeping settings', () => {
    const data = createDefaultStoredData()
    data.settings.volume = 0.3
    data.settings.muted = true
    data.settings.motionPreference = 'reduced'
    data.settings.lastDifficulty = 'ninja'
    data.aggregates.totalPlays = 5
    data.aggregates.totalTypedChars = 100
    data.aggregates.bestComboAll = 8
    data.bestByDifficulty.ninja = {
      score: 200,
      wpm: 40,
      accuracy: 90,
      maxCombo: 5,
      stage: 3,
      destroyedTargets: 10,
      elapsedMs: 60000,
      updatedAt: '2026-01-01T00:00:00.000Z',
      playId: 'p1',
    }
    data.recentPlays = [
      {
        id: 'p1',
        playedAt: '2026-01-01T00:00:00.000Z',
        difficulty: 'ninja',
        score: 200,
        stage: 3,
        destroyedTargets: 10,
        elapsedMs: 60000,
        typedChars: 50,
        correctChars: 45,
        missCount: 5,
        accuracy: 90,
        wpm: 40,
        maxCombo: 5,
        characterId: 'shinobi-default',
      },
    ]

    const cleared = clearPlayRecords(data)

    expect(cleared.aggregates).toEqual({
      totalPlays: 0,
      totalTypedChars: 0,
      bestComboAll: 0,
    })
    expect(cleared.bestByDifficulty.trainee).toBeNull()
    expect(cleared.bestByDifficulty.ninja).toBeNull()
    expect(cleared.bestByDifficulty.master).toBeNull()
    expect(cleared.recentPlays).toEqual([])
    expect(cleared.settings).toEqual(data.settings)
  })

  it('preserves economy when clearing records', () => {
    const data = createDefaultStoredData()
    data.economy = {
      coins: 250,
      ownedCharacterIds: ['shinobi-default', 'shinobi-red'],
      selectedCharacterId: 'shinobi-red',
      gachaHistory: [],
    }
    const cleared = clearPlayRecords(data)
    expect(cleared.economy).toEqual(data.economy)
  })
})
