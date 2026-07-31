import type { EnemyProjectile, PlayerAction } from '../types/projectile'
import {
  DANGER_ZONE,
  PLAYER_X_PERCENT,
} from '../types/projectile'

export function canProjectileDamagePlayer(
  projectile: EnemyProjectile,
): boolean {
  return projectile.state === 'incoming' || projectile.state === 'targeted'
}

export interface CollisionCheckInput {
  projectile: EnemyProjectile
  xPercent: number
  yPercent: number
  playerAction: PlayerAction
  invulnerableUntilMs: number
  nowMs: number
}

/**
 * 画面下部の危険帯に到達したら被弾。
 * プレイヤー真上だけでなく左右列も対象。
 */
export function isProjectileHittingPlayer(
  input: CollisionCheckInput,
): boolean {
  if (!canProjectileDamagePlayer(input.projectile)) {
    return false
  }
  if (input.nowMs < input.invulnerableUntilMs) {
    return false
  }
  if (input.yPercent < DANGER_ZONE.impactYPercent) {
    return false
  }
  return (
    Math.abs(input.xPercent - PLAYER_X_PERCENT) <= DANGER_ZONE.halfWidthPercent
  )
}

export function distancePxBetween(
  axPercent: number,
  ayPercent: number,
  bxPercent: number,
  byPercent: number,
  areaWidthPx: number,
  areaHeightPx: number,
): number {
  const ax = (axPercent / 100) * areaWidthPx
  const ay = (ayPercent / 100) * areaHeightPx
  const bx = (bxPercent / 100) * areaWidthPx
  const by = (byPercent / 100) * areaHeightPx
  return Math.hypot(ax - bx, ay - by)
}
