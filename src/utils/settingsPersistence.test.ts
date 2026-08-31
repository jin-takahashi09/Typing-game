import { describe, expect, it } from 'vitest'
import { createDefaultStoredData } from '../types/records'
import { validateAndNormalize } from './storageSchema'
import {
  createMemoryStorageAdapter,
  saveStoredData,
  loadStoredData,
  STORAGE_KEY,
} from './storage'

describe('settings defaults and recovery', () => {
  it('provides default settings values', () => {
    const data = createDefaultStoredData()
    expect(data.settings.volume).toBe(0.7)
    expect(data.settings.muted).toBe(false)
    expect(data.settings.motionPreference).toBe('system')
    expect(data.settings.romajiLetterCase).toBe('lower')
  })

  it('clamps invalid volume and recovers bad motion preference', () => {
    const data = validateAndNormalize({
      version: 1,
      settings: {
        volume: 9,
        muted: 'nope',
        motionPreference: 'turbo',
        lastDifficulty: 'ghost',
        romajiLetterCase: 'caps',
      },
    })
    expect(data.settings.volume).toBe(1)
    expect(data.settings.muted).toBe(false)
    expect(data.settings.motionPreference).toBe('system')
    expect(data.settings.lastDifficulty).toBeNull()
    expect(data.settings.romajiLetterCase).toBe('lower')
  })

  it('persists settings through storage adapter', () => {
    const adapter = createMemoryStorageAdapter()
    const data = createDefaultStoredData()
    data.settings.volume = 0.4
    data.settings.muted = true
    data.settings.motionPreference = 'reduced'

    expect(saveStoredData(data, adapter).ok).toBe(true)
    const loaded = loadStoredData(adapter)
    expect(loaded.data.settings.volume).toBe(0.4)
    expect(loaded.data.settings.muted).toBe(true)
    expect(loaded.data.settings.motionPreference).toBe('reduced')
    expect(adapter.getItem(STORAGE_KEY)).toContain('"muted":true')
  })

  it('persists romaji letter case', () => {
    const adapter = createMemoryStorageAdapter()
    const data = createDefaultStoredData()
    data.settings.romajiLetterCase = 'upper'
    expect(saveStoredData(data, adapter).ok).toBe(true)
    const loaded = loadStoredData(adapter)
    expect(loaded.data.settings.romajiLetterCase).toBe('upper')
  })

  it('keeps session usable when save fails', () => {
    const adapter = createMemoryStorageAdapter()
    adapter.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError')
    }
    const result = saveStoredData(createDefaultStoredData(), adapter)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('quota')
  })
})
