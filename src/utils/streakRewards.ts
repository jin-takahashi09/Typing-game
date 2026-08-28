import {
  STREAK_REWARD_CONFIG,
  type StreakMilestoneCount,
} from '../config/streakRewardConfig'
import type { StreakProgress, StreakRewardResult } from '../types/streakRewards'

export interface StreakAbilityOptions {
  milestoneReduction?: number
  coinMultiplier?: number
  timeDoubleChance?: number
  rng?: () => number
}

function sanitizeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.floor(value))
}

function sanitizeNonNegative(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, value)
}

export function createInitialStreakProgress(): StreakProgress {
  return {
    currentCount: 0,
    maxCount: STREAK_REWARD_CONFIG.cycleLength,
    totalBonusSeconds: 0,
    totalRewardCoins: 0,
  }
}

/** 連続成功進捗を0に戻す（獲得済み報酬は減らさない） */
export function resetStreakProgress(progress: StreakProgress): StreakProgress {
  return {
    currentCount: 0,
    maxCount: STREAK_REWARD_CONFIG.cycleLength,
    totalBonusSeconds: sanitizeNonNegative(progress.totalBonusSeconds),
    totalRewardCoins: sanitizeNonNegative(progress.totalRewardCoins),
  }
}

function effectiveMilestoneCounts(reduction: number): StreakMilestoneCount[] {
  const safeReduction = Math.max(0, Math.min(1, Math.floor(reduction)))
  return STREAK_REWARD_CONFIG.milestones.map((milestone) =>
    Math.max(1, milestone.count - safeReduction),
  ) as StreakMilestoneCount[]
}

export function getStreakReward(
  count: number,
  options: StreakAbilityOptions = {},
): {
  timeBonusSeconds: number
  coinBonus: number
  milestone: StreakMilestoneCount | null
} {
  const safe = sanitizeCount(count)
  const reduction = options.milestoneReduction ?? 0
  const effectiveCounts = effectiveMilestoneCounts(reduction)
  const hitIndex = effectiveCounts.indexOf(safe as StreakMilestoneCount)
  if (hitIndex < 0) {
    return { timeBonusSeconds: 0, coinBonus: 0, milestone: null }
  }
  const hit = STREAK_REWARD_CONFIG.milestones[hitIndex]!
  const coinMultiplier =
    Number.isFinite(options.coinMultiplier) && options.coinMultiplier! > 0
      ? options.coinMultiplier!
      : 1
  let timeBonusSeconds = hit.timeBonusSeconds
  const chance = options.timeDoubleChance ?? 0
  if (
    timeBonusSeconds > 0 &&
    chance > 0 &&
    (options.rng?.() ?? Math.random()) < chance
  ) {
    timeBonusSeconds *= 2
  }
  return {
    timeBonusSeconds,
    coinBonus: Math.floor(hit.coinBonus * coinMultiplier),
    milestone: hit.count,
  }
}

/**
 * ノーミスで1問クリアしたときの次状態。
 * 引数の progress は書き換えない。
 */
export function applyPerfectClear(
  progress: StreakProgress,
  options: StreakAbilityOptions = {},
): StreakRewardResult {
  const previousCount = sanitizeCount(progress.currentCount)
  const cycle = STREAK_REWARD_CONFIG.cycleLength
  let nextCount = previousCount + 1
  const reward = getStreakReward(nextCount, options)
  let completedCycle = false

  if (nextCount >= cycle) {
    completedCycle = true
    nextCount = 0
  }

  return {
    previousCount,
    nextCount,
    timeBonusSeconds: reward.timeBonusSeconds,
    coinBonus: reward.coinBonus,
    reachedMilestone: reward.milestone,
    completedCycle,
  }
}

/** 報酬結果を進捗へ反映した新しい StreakProgress を返す */
export function commitStreakReward(
  progress: StreakProgress,
  result: StreakRewardResult,
): StreakProgress {
  return {
    currentCount: sanitizeCount(result.nextCount),
    maxCount: STREAK_REWARD_CONFIG.cycleLength,
    totalBonusSeconds:
      sanitizeNonNegative(progress.totalBonusSeconds) +
      sanitizeNonNegative(result.timeBonusSeconds),
    totalRewardCoins:
      sanitizeNonNegative(progress.totalRewardCoins) +
      sanitizeNonNegative(result.coinBonus),
  }
}
