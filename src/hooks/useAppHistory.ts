import { useCallback, useEffect, useRef } from 'react'
import type { AppScreen, DifficultyId } from '../types/app'

export interface HistoryEntry {
  screen: AppScreen
  difficulty: DifficultyId | null
}

export interface UseAppHistoryOptions {
  screen: AppScreen
  difficulty: DifficultyId | null
  /** ゲーム中に戻る操作があったとき（確認表示用） */
  onGameBackRequest: () => void
  /** 履歴から画面を復元する */
  onRestore: (entry: HistoryEntry) => void
  /** 現在ゲームプレイ中か（playing / paused） */
  isInGameSession: () => boolean
}

export interface UseAppHistoryResult {
  /** UI の戻るボタン用。履歴があれば back、なければタイトルへ */
  requestBack: () => void
}

function toHash(screen: AppScreen): string {
  return `#${screen}`
}

/**
 * SPA 画面とブラウザ履歴を連動させる。
 * ゲーム中の popstate ではプレイを破棄せず、確認のためにコールバックする。
 */
export function useAppHistory({
  screen,
  difficulty,
  onGameBackRequest,
  onRestore,
  isInGameSession,
}: UseAppHistoryOptions): UseAppHistoryResult {
  const skipNextPushRef = useRef(false)
  const firstSyncRef = useRef(true)
  const listenerBoundRef = useRef(false)
  const stackDepthRef = useRef(0)
  const screenRef = useRef(screen)
  const difficultyRef = useRef(difficulty)
  const onGameBackRequestRef = useRef(onGameBackRequest)
  const onRestoreRef = useRef(onRestore)
  const isInGameSessionRef = useRef(isInGameSession)

  useEffect(() => {
    screenRef.current = screen
    difficultyRef.current = difficulty
  }, [screen, difficulty])

  useEffect(() => {
    onGameBackRequestRef.current = onGameBackRequest
    onRestoreRef.current = onRestore
    isInGameSessionRef.current = isInGameSession
  }, [onGameBackRequest, onRestore, isInGameSession])

  const writeHistory = useCallback(
    (entry: HistoryEntry, mode: 'push' | 'replace') => {
      const state: HistoryEntry = {
        screen: entry.screen,
        difficulty: entry.difficulty,
      }
      if (mode === 'replace') {
        window.history.replaceState(state, '', toHash(entry.screen))
      } else {
        window.history.pushState(state, '', toHash(entry.screen))
        stackDepthRef.current += 1
      }
    },
    [],
  )

  const requestBack = useCallback(() => {
    if (isInGameSessionRef.current() && screenRef.current === 'game') {
      onGameBackRequestRef.current()
      return
    }
    if (stackDepthRef.current > 0) {
      window.history.back()
      return
    }
    skipNextPushRef.current = true
    onRestoreRef.current({ screen: 'title', difficulty: null })
  }, [])

  // 画面変更時に履歴へ積む（restore / popstate 由来はスキップ）
  useEffect(() => {
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false
      return
    }

    const entry: HistoryEntry = { screen, difficulty }
    if (firstSyncRef.current) {
      firstSyncRef.current = false
      writeHistory(entry, 'replace')
      return
    }
    writeHistory(entry, 'push')
  }, [screen, difficulty, writeHistory])

  useEffect(() => {
    if (listenerBoundRef.current) {
      return
    }
    listenerBoundRef.current = true

    const onPopState = (event: PopStateEvent) => {
      if (isInGameSessionRef.current() && screenRef.current === 'game') {
        writeHistory(
          {
            screen: 'game',
            difficulty: difficultyRef.current,
          },
          'push',
        )
        onGameBackRequestRef.current()
        return
      }

      stackDepthRef.current = Math.max(0, stackDepthRef.current - 1)

      const entry = (event.state as HistoryEntry | null) ?? {
        screen: 'title' as const,
        difficulty: null,
      }
      skipNextPushRef.current = true
      onRestoreRef.current({
        screen: entry.screen ?? 'title',
        difficulty: entry.difficulty ?? null,
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      listenerBoundRef.current = false
    }
  }, [writeHistory])

  return { requestBack }
}
