import type { StreakMilestoneCount } from '../config/streakRewardConfig'

/** 連続成功の進捗（不変データとして扱う） */
export interface StreakProgress {
  /** 現在の連続ノーミス成功数（0〜cycleLength、12到達後は0） */
  currentCount: number
  /** ゲージ上限（通常 12） */
  maxCount: number
  /** このプレイで得た追加時間の合計（秒） */
  totalBonusSeconds: number
  /** このプレイで得た連続成功コインの合計 */
  totalRewardCoins: number
}

export interface StreakRewardResult {
  previousCount: number
  nextCount: number
  timeBonusSeconds: number
  coinBonus: number
  reachedMilestone: StreakMilestoneCount | null
  completedCycle: boolean
}
