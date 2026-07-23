import { gameConfig } from '../config/gameConfig'
import type { GameResultSummary } from '../types/game'
import type {
  PlayComparison,
  StoredAppData,
  SaveStorageResult,
} from '../types/records'
import { generatePlayId } from '../types/records'
import { buildPlayComparison } from './comparePlay'
import { applyPlayResult } from './recordPlay'
import { saveStoredData, type StorageAdapter } from './storage'

export interface PersistPlayResult {
  data: StoredAppData
  comparison: PlayComparison
  saveResult: SaveStorageResult
}

export function persistPlayResult(
  current: StoredAppData,
  summary: GameResultSummary,
  options?: {
    recentPlaysLimit?: number
    adapter?: StorageAdapter | null
  },
): PersistPlayResult {
  const comparison = buildPlayComparison(current, summary)
  const data = applyPlayResult(current, summary, {
    playId: generatePlayId(),
    playedAt: new Date().toISOString(),
    recentPlaysLimit: options?.recentPlaysLimit ?? gameConfig.recentPlaysLimit,
  })
  const saveResult = saveStoredData(data, options?.adapter ?? undefined)

  return {
    data,
    comparison,
    saveResult,
  }
}

export function getSaveErrorMessage(error: SaveStorageResult['error']): string | null {
  switch (error) {
    case 'quota':
      return '記録の保存に失敗しました（容量不足）。結果は表示されています。'
    case 'unavailable':
      return '記録を保存できませんでした（ストレージ利用不可）。'
    case 'unknown':
      return '記録の保存に失敗しました。結果は表示されています。'
    default:
      return null
  }
}
