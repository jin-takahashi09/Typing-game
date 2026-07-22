import type { DifficultyId } from './app'
import type { RomajiMatchState } from './typing'

export type GameStatus = 'ready' | 'playing' | 'gameover'
export type TargetState = 'falling' | 'locked' | 'destroyed'
export type NinjaAnimationState = 'idle' | 'attack' | 'damage'

export interface GameTarget {
  id: string
  problemId: string
  displayText: string
  reading: string
  displayRomaji: string
  romajiPatterns: readonly string[]
  matchState: RomajiMatchState
  typedLength: number
  xPercent: number
  /** 生成時の初期 Y。判定用の現在 Y は targetsRef が正 */
  yPosition: number
  speed: number
  state: TargetState
  baseScore: number
}

export interface GameState {
  status: GameStatus
  difficulty: DifficultyId
  score: number
  combo: number
  maxCombo: number
  defense: number
  stage: number
  destroyedTargets: number
  activeTargets: GameTarget[]
  lockedTargetId: string | null
  lastProblemId: string | null
  typedCount: number
  correctChars: number
  missCount: number
  gameStartedAtMs: number | null
  showMissFeedback: boolean
  showStageUpFlash: boolean
}

export interface GameResultSummary {
  difficulty: DifficultyId
  score: number
  stage: number
  destroyedTargets: number
  maxCombo: number
  typedChars: number
  correctChars: number
  missCount: number
  elapsedMs: number
  wpm: number
  accuracy: number
}

export type GameAction =
  | { type: 'START_GAME'; difficulty: DifficultyId; maxDefense: number; startedAtMs: number }
  | { type: 'SPAWN_TARGET'; target: GameTarget }
  | {
      type: 'TYPE_CORRECT'
      targetId: string
      typedLength: number
      matchState: RomajiMatchState
    }
  | { type: 'TYPE_MISS' }
  | { type: 'CLEAR_MISS_FEEDBACK' }
  | {
      type: 'DESTROY_TARGET'
      targetId: string
      scoreGain: number
      heal: number
      shouldAdvanceStage: boolean
    }
  | { type: 'REMOVE_TARGET'; targetId: string }
  | { type: 'TARGET_REACHED_BOTTOM'; targetId: string; damage: number }
  | { type: 'CLEAR_STAGE_UP_FLASH' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME'; difficulty: DifficultyId; maxDefense: number; startedAtMs: number }
