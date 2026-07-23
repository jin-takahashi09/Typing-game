import { gameConfig } from '../config/gameConfig'
import type { StoredAppData, SaveStorageResult } from '../types/records'
import { createDefaultStoredData } from '../types/records'
import { parseStoredData } from './storageSchema'

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface LoadStorageResult {
  data: StoredAppData
  recoveredFromError: boolean
}

const STORAGE_KEY = gameConfig.storageKey

export function createMemoryStorageAdapter(
  initial: Record<string, string> = {},
): StorageAdapter {
  const store = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key, value) {
      store.set(key, value)
    },
    removeItem(key) {
      store.delete(key)
    },
  }
}

export function getBrowserStorageAdapter(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storage = window.localStorage
    return {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
    }
  } catch {
    return null
  }
}

export function loadStoredData(
  adapter: StorageAdapter | null = getBrowserStorageAdapter(),
): LoadStorageResult {
  if (!adapter) {
    return { data: createDefaultStoredData(), recoveredFromError: false }
  }

  try {
    const raw = adapter.getItem(STORAGE_KEY)
    if (!raw) {
      return { data: createDefaultStoredData(), recoveredFromError: false }
    }

    const parsed: unknown = JSON.parse(raw)
    return {
      data: parseStoredData(parsed),
      recoveredFromError: false,
    }
  } catch (error) {
    console.warn('[storage] Failed to load stored data. Using defaults.', error)
    return {
      data: createDefaultStoredData(),
      recoveredFromError: true,
    }
  }
}

export function saveStoredData(
  data: StoredAppData,
  adapter: StorageAdapter | null = getBrowserStorageAdapter(),
): SaveStorageResult {
  if (!adapter) {
    return { ok: false, error: 'unavailable' }
  }

  try {
    adapter.setItem(STORAGE_KEY, JSON.stringify(data))
    return { ok: true }
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    if (name === 'QuotaExceededError') {
      console.warn('[storage] Quota exceeded while saving play data.')
      return { ok: false, error: 'quota' }
    }
    console.warn('[storage] Failed to save play data.', error)
    return { ok: false, error: 'unknown' }
  }
}

export function clearStoredData(
  adapter: StorageAdapter | null = getBrowserStorageAdapter(),
): void {
  adapter?.removeItem(STORAGE_KEY)
}

export { STORAGE_KEY }
