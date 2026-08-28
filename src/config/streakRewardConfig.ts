/** 連続ノーミス成功の報酬設定（UI・副作用非依存） */
export const STREAK_REWARD_CONFIG = {
  cycleLength: 12,
  milestones: [
    {
      count: 4,
      timeBonusSeconds: 1,
      coinBonus: 1,
    },
    {
      count: 8,
      timeBonusSeconds: 2,
      coinBonus: 2,
    },
    {
      count: 12,
      timeBonusSeconds: 3,
      coinBonus: 3,
    },
  ],
} as const

export type StreakMilestoneCount =
  (typeof STREAK_REWARD_CONFIG.milestones)[number]['count']
