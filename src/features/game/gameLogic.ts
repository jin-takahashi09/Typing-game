import type { EnemyProjectile } from '../../types/projectile'
import { matchesFirstChar } from '../../utils/romajiMatcher'
import type { TypingProblem } from '../../types/typing'
import type { DifficultyId } from '../../types/app'

export function isTypingKey(key: string): boolean {
  return /^[a-zA-Z-]$/.test(key)
}

export function toTypingProblem(
  projectile: EnemyProjectile,
  difficulty: DifficultyId,
): TypingProblem {
  return {
    id: projectile.problemId,
    displayText: projectile.displayText,
    reading: projectile.reading,
    romajiPatterns: projectile.romajiPatterns,
    difficulty,
    category: 'basic',
    baseScore: projectile.baseScore,
  }
}

export function findLockCandidates(
  projectiles: readonly EnemyProjectile[],
  char: string,
): EnemyProjectile[] {
  return projectiles.filter((projectile) => {
    if (projectile.state !== 'incoming' && projectile.state !== 'targeted') {
      return false
    }
    return matchesFirstChar(toTypingProblem(projectile, 'ninja'), char)
  })
}

export function findMostDangerousProjectileId(
  candidates: readonly EnemyProjectile[],
): string | null {
  if (candidates.length === 0) {
    return null
  }
  const sorted = [...candidates].sort((a, b) => {
    if (a.estimatedImpactTimeMs !== b.estimatedImpactTimeMs) {
      return a.estimatedImpactTimeMs - b.estimatedImpactTimeMs
    }
    if (a.speed !== b.speed) {
      return b.speed - a.speed
    }
    return b.damage - a.damage
  })
  return sorted[0]?.id ?? null
}

/** 撃破成功率（%） */
export function computeSuccessRate(
  destroyedTargets: number,
  failedTargets: number,
): number {
  const total = destroyedTargets + failedTargets
  if (total <= 0) return 100
  return (destroyedTargets / total) * 100
}

/** コインマイルストーン到達判定（旧ステージアップ相当） */
export function shouldAwardCoinMilestone(
  destroyedTargets: number,
  every: number,
): boolean {
  const step = Math.max(1, every)
  return destroyedTargets > 0 && destroyedTargets % step === 0
}

export function coinMilestoneIndex(
  destroyedTargets: number,
  every: number,
): number {
  const step = Math.max(1, every)
  return Math.floor(destroyedTargets / step)
}
