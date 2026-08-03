import type { DifficultyId } from './app'
import type { ProblemCategory } from '../config/difficultyConfig'

export interface TypingProblem {
  id: string
  displayText: string
  reading: string
  romajiPatterns: readonly string[]
  difficulty: DifficultyId
  category: ProblemCategory
  baseScore: number
}

export interface TypingStats {
  typedChars: number
  correctChars: number
  missCount: number
  elapsedMs: number
  wpm: number
  accuracy: number
}

export interface RawTypingCounters {
  typedChars: number
  correctChars: number
  missCount: number
}

/** 1モーラ分の入力途中状態 */
export interface RomajiPath {
  moraIndex: number
  partial: string
}

/** 1ターゲット分の入力セッション状態 */
export interface RomajiMatchState {
  confirmedLength: number
  activePaths: RomajiPath[]
  isComplete: boolean
  /** 受理済み入力（小文字）。表示候補の絞り込みに使う */
  typedPrefix: string
}

export interface RomajiMatchResult {
  accepted: boolean
  isComplete: boolean
  nextConfirmedLength: number
  nextState: RomajiMatchState
}
