import type { DifficultyId } from './app'
import type { PlayComparison } from './records'
import type {
  EnemyProjectile,
  PlayerAction,
  InterceptAction,
} from './projectile'
import type { StreakRewardResult } from './streakRewards'

export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover'
/** 終了条件は時間切れのみ（defense は旧セーブ互換用） */
export type GameEndReason = 'timeout' | 'defense'

/** @deprecated */
export type NinjaAnimationState = 'idle' | 'attack' | 'damage'

export type { EnemyProjectile, PlayerAction, InterceptAction }
/** @deprecated use InterceptAction */
export type AutoAction = InterceptAction

export interface GameState {
  status: GameStatus
  difficulty: DifficultyId
  score: number
  combo: number
  maxCombo: number
  defense: number
  destroyedTargets: number
  /** 落下到達などによる失敗数 */
  failedTargets: number
  activeProjectiles: EnemyProjectile[]
  lockedProjectileId: string | null
  lastProblemId: string | null
  lastInterceptAction: InterceptAction | null
  playerAction: PlayerAction
  typedCount: number
  correctChars: number
  missCount: number
  gameStartedAtMs: number | null
  pausedTotalMs: number
  pausedAtMs: number | null
  showMissFeedback: boolean
  endReason: GameEndReason | null
  invulnerableUntilMs: number
  /** 現在の連続ノーミス成功数（ゲージ用） */
  perfectStreakCount: number
  /** 現在の問題で1文字でもミスしたか */
  currentProblemHadMiss: boolean
  /** プレイ中の最大連続ノーミス成功数 */
  maxPerfectStreak: number
  /** 連続成功で得た追加時間の合計（秒） */
  totalBonusSeconds: number
  /** 連続成功で得たコイン合計（mid-play 付与済み） */
  streakRewardCoins: number
  /** 残り時間へ足すボーナス（ms）。上限なし */
  timeBonusMs: number
  /** 直前に適用した連続成功報酬イベント（二重付与防止） */
  lastStreakRewardEventId: string | null
}

export interface GameResultSummary {
  difficulty: DifficultyId
  score: number
  /** @deprecated ステージ制廃止。セーブ互換のため残し、常に 1 またはマイルストーン数 */
  stage: number
  destroyedTargets: number
  failedTargets: number
  maxCombo: number
  typedChars: number
  correctChars: number
  missCount: number
  elapsedMs: number
  wpm: number
  accuracy: number
  /** 撃破成功率（撃破 / (撃破+失敗)） */
  successRate: number
  characterId: string
  abilityBonusScore: number
  abilityBonusCoins: number
  endReason: GameEndReason
  timeLimitSeconds: number
  maxPerfectStreak?: number
  bonusTimeSeconds?: number
  streakRewardCoins?: number
}

export interface PlayCoinSummary {
  /** 互換用内部名。UI 表示は「撃破ボーナス」 */
  stageClearCoins: number
  /** 成績ボーナス */
  resultBonusCoins: number
  /** 連続成功で得たコイン */
  streakRewardCoins: number
  totalEarned: number
  /** 互換用。マイルストーンごとの内訳 */
  stageAwards: readonly { stage: number; coins: number }[]
  balanceAfter: number
}

export interface ResultViewModel {
  summary: GameResultSummary
  comparison: PlayComparison
  saveError: string | null
  playSessionId: number
  coinSummary: PlayCoinSummary
}

export type StreakResolvePayload =
  | { kind: 'skip-miss' }
  | {
      kind: 'apply'
      result: StreakRewardResult
      eventId: string
    }

export type GameAction =
  | { type: 'START_GAME'; difficulty: DifficultyId; maxDefense: number; startedAtMs: number }
  | { type: 'SPAWN_PROJECTILE'; projectile: EnemyProjectile }
  | {
      type: 'TYPE_CORRECT'
      projectileId: string
      typedLength: number
      matchState: EnemyProjectile['matchState']
    }
  | { type: 'TYPE_MISS' }
  | { type: 'CLEAR_MISS_FEEDBACK' }
  | {
      type: 'RESOLVE_PROJECTILE'
      projectileId: string
      action: InterceptAction
      scoreGain: number
      heal: number
      streak: StreakResolvePayload
    }
  | { type: 'REMOVE_PROJECTILE'; projectileId: string }
  | {
      type: 'PROJECTILE_HIT_PLAYER'
      projectileId: string
      damage: number
      invulnerableUntilMs: number
    }
  | { type: 'SET_PLAYER_ACTION'; action: PlayerAction }
  | { type: 'END_GAME'; reason: GameEndReason }
  | { type: 'PAUSE_GAME'; atMs: number }
  | { type: 'RESUME_GAME'; atMs: number }
  | { type: 'RESET_GAME'; difficulty: DifficultyId; maxDefense: number; startedAtMs: number }
