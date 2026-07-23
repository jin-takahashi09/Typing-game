import { describe, expect, it } from 'vitest'
import { createDefaultStoredData } from '../types/records'
import {
  STORAGE_KEY,
  createMemoryStorageAdapter,
  loadStoredData,
  saveStoredData,
} from './storage'

describe('storage', () => {
  it('returns defaults when storage key is missing', () => {
    const adapter = createMemoryStorageAdapter()
    const loaded = loadStoredData(adapter)
    expect(loaded.data.aggregates.totalPlays).toBe(0)
    expect(loaded.recoveredFromError).toBe(false)
  })

  it('round-trips stored data through the adapter', () => {
    const adapter = createMemoryStorageAdapter()
    const original = createDefaultStoredData()
    original.aggregates.totalPlays = 2

    expect(saveStoredData(original, adapter).ok).toBe(true)

    const loaded = loadStoredData(adapter)
    expect(loaded.data.aggregates.totalPlays).toBe(2)
    expect(adapter.getItem(STORAGE_KEY)).toContain('"totalPlays":2')
  })

  it('recovers from corrupted JSON without throwing', () => {
    const adapter = createMemoryStorageAdapter({
      [STORAGE_KEY]: '{not-json',
    })

    const loaded = loadStoredData(adapter)
    expect(loaded.recoveredFromError).toBe(true)
    expect(loaded.data.version).toBe(1)
  })

  it('returns save failure instead of throwing on quota errors', () => {
    const adapter = createMemoryStorageAdapter()
    adapter.setItem = () => {
      const error = new DOMException('quota', 'QuotaExceededError')
      throw error
    }

    const result = saveStoredData(createDefaultStoredData(), adapter)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('quota')
  })

  it('reports unavailable storage without throwing', () => {
    const result = saveStoredData(createDefaultStoredData(), null)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unavailable')
  })
})
