import type { InterceptAction, ProjectileState } from '../types/projectile'
import { INTERCEPT_CONFIG } from '../types/projectile'
import { clampEmergencySlashRangePx } from './fallingProjectileMotion'

export interface InterceptSelectorInput {
  distancePx: number
  gameHeightPx: number
  timeToImpactMs: number
  projectileState: ProjectileState
}

export interface InterceptDecision {
  action: InterceptAction
  emergencyRangePx: number
  emergencyTimeToImpactMs: number
  canIntercept: boolean
}

/**
 * 通常は常に throw。
 * 緊急距離かつ接触予測時間が短い場合のみ emergency-slash。
 */
export function selectInterceptAction(
  input: InterceptSelectorInput,
): InterceptDecision {
  const emergencyRangePx = clampEmergencySlashRangePx(input.gameHeightPx)
  const emergencyTimeToImpactMs = INTERCEPT_CONFIG.emergencyTimeToImpactMs

  if (
    input.projectileState === 'hit' ||
    input.projectileState === 'destroyed' ||
    input.projectileState === 'resolving'
  ) {
    return {
      action: 'throw',
      emergencyRangePx,
      emergencyTimeToImpactMs,
      canIntercept: false,
    }
  }

  const inEmergencyRange = input.distancePx <= emergencyRangePx
  const inEmergencyTime = input.timeToImpactMs <= emergencyTimeToImpactMs

  if (inEmergencyRange && inEmergencyTime) {
    return {
      action: 'emergency-slash',
      emergencyRangePx,
      emergencyTimeToImpactMs,
      canIntercept: true,
    }
  }

  return {
    action: 'throw',
    emergencyRangePx,
    emergencyTimeToImpactMs,
    canIntercept: true,
  }
}

export function playerActionFromIntercept(
  action: InterceptAction,
): 'throwing' | 'emergency-slashing' {
  return action === 'throw' ? 'throwing' : 'emergency-slashing'
}

export function isEmergencySlash(action: InterceptAction): boolean {
  return action === 'emergency-slash'
}

/** 斬撃方向（deg）。0=上、負=左、正=右 */
export function slashAngleDeg(
  projectileXPercent: number,
  projectileYPercent: number,
  playerXPercent: number,
  playerYPercent: number,
): number {
  const dx = projectileXPercent - playerXPercent
  const dy = playerYPercent - projectileYPercent
  const rad = Math.atan2(dx, Math.max(0.01, dy))
  return (rad * 180) / Math.PI
}

/** 味方手裏剣の飛行角度（rad）。atan2(dy, dx) */
export function allyThrowAngleRad(
  fromXPercent: number,
  fromYPercent: number,
  toXPercent: number,
  toYPercent: number,
): number {
  const dx = toXPercent - fromXPercent
  const dy = toYPercent - fromYPercent
  return Math.atan2(dy, dx)
}

export function allyThrowAngleDeg(
  fromXPercent: number,
  fromYPercent: number,
  toXPercent: number,
  toYPercent: number,
): number {
  return (allyThrowAngleRad(fromXPercent, fromYPercent, toXPercent, toYPercent) * 180) / Math.PI
}
