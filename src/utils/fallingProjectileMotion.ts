import {
  INTERCEPT_CONFIG,
  PLAYER_Y_PERCENT,
  type FallingTrajectory,
} from '../types/projectile'

export interface MotionSample {
  xPercent: number
  yPercent: number
  /** 下方向の進行に対応する相対速度（加速軌道で増加） */
  velocityY: number
}

export interface MotionParams {
  spawnX: number
  spawnY: number
  /** 着弾 Y%（通常は PLAYER_Y_PERCENT） */
  impactY: number
  trajectory: FallingTrajectory
  /** 0–1+ 進行度 */
  progress: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sanitize(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return value
}

/**
 * 真下落下のみ。
 * - x は spawnX のまま
 * - y だけ増加
 * - accelerating は y の進行だけ加速（x は不変）
 */
export function sampleFallingMotion(params: MotionParams): MotionSample {
  const progress = clamp(sanitize(params.progress), 0, 1.25)
  const startX = sanitize(params.spawnX, 50)
  const startY = sanitize(params.spawnY, -8)
  const endY = sanitize(params.impactY, PLAYER_Y_PERCENT)
  const spanY = endY - startY

  let eased = Math.min(progress, 1)
  let velocityY = spanY // 相対（progress 単位）

  if (params.trajectory === 'accelerating') {
    const t = Math.min(progress, 1)
    eased = t ** 1.65
    // dy/dt 相当（t が増えるほど大きく）
    velocityY = spanY * 1.65 * Math.max(0.05, t) ** 0.65
  }

  const y = startY + spanY * eased

  return {
    xPercent: clamp(sanitize(startX, 50), 4, 96),
    yPercent: clamp(sanitize(y, startY), -12, 110),
    velocityY: sanitize(velocityY, spanY),
  }
}

export function computeFallProgress(
  elapsedMs: number,
  flightDurationMs: number,
): number {
  const duration = Math.max(1, sanitize(flightDurationMs, 1))
  const elapsed = Math.max(0, sanitize(elapsedMs))
  return clamp(elapsed / duration, 0, 1.25)
}

/** 残り落下時間（ms）。演出用・緊急判定用 */
export function estimateTimeToImpactMs(
  elapsedMs: number,
  flightDurationMs: number,
): number {
  const duration = Math.max(1, sanitize(flightDurationMs, 1))
  const elapsed = Math.max(0, sanitize(elapsedMs))
  return Math.max(0, duration - elapsed)
}

export interface FallTimeInput {
  romajiLength: number
  /** 難易度の落下速度係数（大きいほど速い） */
  fallSpeed: number
  trajectory: FallingTrajectory
  size: 'small' | 'normal' | 'large'
}

/** 問題長と難易度落下速度に応じた落下時間（ms） */
export function computeFallDurationMs(input: FallTimeInput): number {
  const len = Math.max(1, input.romajiLength)
  const fallSpeed = Math.max(0.35, input.fallSpeed)
  // 基準: fallSpeed=1.0 で中程度。係数で時間を割る
  const assumedWpm = 35
  const charsPerMs = (assumedWpm * 5) / 60_000
  let duration = len / Math.max(0.0001, charsPerMs)
  duration *= 1.55
  duration /= fallSpeed

  if (input.trajectory === 'accelerating') {
    duration *= 1.08
  }
  if (input.size === 'large') {
    duration *= 1.12
  }
  if (input.size === 'small') {
    duration *= 0.9
  }

  const minMs = 1800 + len * 80
  const maxMs = 12_000 + len * 140
  return Math.round(clamp(duration, minMs, maxMs))
}

export function clampEmergencySlashRangePx(gameHeightPx: number): number {
  const raw = gameHeightPx * INTERCEPT_CONFIG.emergencySlashRangeRatio
  return clamp(
    raw,
    INTERCEPT_CONFIG.emergencySlashRangeMinPx,
    INTERCEPT_CONFIG.emergencySlashRangeMaxPx,
  )
}
