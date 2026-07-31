import type { RomajiMatchState } from './typing'

/** 真下落下のみ。accelerating は下方向速度だけ変化 */
export type FallingTrajectory = 'straight' | 'accelerating'

export type ProjectileSize = 'small' | 'normal' | 'large'

export type ProjectileState =
  | 'incoming'
  | 'targeted'
  | 'resolving'
  | 'destroyed'
  | 'hit'

/** 通常は throw。刀は緊急時のみ */
export type InterceptAction = 'throw' | 'emergency-slash'

export type PlayerAction =
  | 'idle'
  | 'throwing'
  | 'emergency-slashing'
  | 'damaged'

export interface EnemyProjectile {
  id: string
  problemId: string
  displayText: string
  reading: string
  displayRomaji: string
  romajiPatterns: readonly string[]
  matchState: RomajiMatchState
  typedLength: number
  baseScore: number
  /** 出現時の X%（0–100）。落下中も変化しない */
  spawnX: number
  /** 出現時の Y%（上端=0） */
  spawnY: number
  /** 常に 0（横移動なし） */
  velocityX: number
  velocityY: number
  speed: number
  trajectory: FallingTrajectory
  size: ProjectileSize
  damage: number
  spawnTimeMs: number
  flightDurationMs: number
  estimatedImpactTimeMs: number
  state: ProjectileState
  resolveAction: InterceptAction | null
}

/** プレイヤー固定位置（%） */
export const PLAYER_X_PERCENT = 50
/** プレイヤー足元〜中心付近（上端基準の Y%） */
export const PLAYER_Y_PERCENT = 82

/** 画面下部の危険帯（左右列も含む） */
export const DANGER_ZONE = {
  /** この Y% 以上で被弾候補 */
  impactYPercent: 78,
  /** プレイヤー中心からの許容半幅（%） */
  halfWidthPercent: 48,
} as const

export const INTERCEPT_CONFIG = {
  /** 緊急斬撃距離：高さに対する割合 */
  emergencySlashRangeRatio: 0.12,
  emergencySlashRangeMinPx: 60,
  emergencySlashRangeMaxPx: 110,
  /** 緊急斬撃：接触予測時間の上限（ms） */
  emergencyTimeToImpactMs: 250,
} as const
