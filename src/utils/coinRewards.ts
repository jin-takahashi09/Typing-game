/**
 * 撃破マイルストーン到達時のコイン。
 * 引数名 `clearedStage` / 関数名はセーブ・呼出互換のため維持（中身はマイルストーン番号）。
 * 例: 1→10, 2→15, 3→20
 */
export function calcStageClearCoins(clearedStage: number): number {
  if (!Number.isFinite(clearedStage) || clearedStage < 1) {
    return 0
  }
  return 5 + Math.floor(clearedStage) * 5
}

/** ゲーム終了時の成績ボーナス */
export function calcResultBonusCoins(score: number): number {
  if (!Number.isFinite(score) || score <= 0) {
    return 0
  }
  return Math.floor(score / 500)
}

export interface StageCoinAward {
  /** 互換用: マイルストーン番号（旧ステージ番号） */
  stage: number
  coins: number
}

export interface PlayCoinTracker {
  /** 互換用: 付与済みマイルストーン番号集合 */
  rewardedStages: ReadonlySet<number>
  /** 互換用フィールド名。UI では「撃破ボーナス」 */
  stageAwards: readonly StageCoinAward[]
  resultBonusAwarded: boolean
  resultBonusCoins: number
}

export function createPlayCoinTracker(): PlayCoinTracker {
  return {
    rewardedStages: new Set(),
    stageAwards: [],
    resultBonusAwarded: false,
    resultBonusCoins: 0,
  }
}

export function tryAwardStageClear(
  tracker: PlayCoinTracker,
  clearedStage: number,
): { tracker: PlayCoinTracker; coins: number; awarded: boolean } {
  const stage = Math.floor(clearedStage)
  if (stage < 1 || tracker.rewardedStages.has(stage)) {
    return { tracker, coins: 0, awarded: false }
  }

  const coins = calcStageClearCoins(stage)
  if (coins <= 0) {
    return { tracker, coins: 0, awarded: false }
  }

  const rewardedStages = new Set(tracker.rewardedStages)
  rewardedStages.add(stage)

  return {
    tracker: {
      ...tracker,
      rewardedStages,
      stageAwards: [...tracker.stageAwards, { stage, coins }],
    },
    coins,
    awarded: true,
  }
}

export function tryAwardResultBonus(
  tracker: PlayCoinTracker,
  score: number,
): { tracker: PlayCoinTracker; coins: number; awarded: boolean } {
  if (tracker.resultBonusAwarded) {
    return { tracker, coins: 0, awarded: false }
  }

  const coins = calcResultBonusCoins(score)
  return {
    tracker: {
      ...tracker,
      resultBonusAwarded: true,
      resultBonusCoins: coins,
    },
    coins,
    awarded: true,
  }
}

export function summarizePlayCoins(
  tracker: PlayCoinTracker,
  streakRewardCoins = 0,
): {
  stageClearCoins: number
  resultBonusCoins: number
  streakRewardCoins: number
  totalEarned: number
  stageAwards: readonly StageCoinAward[]
} {
  const stageClearCoins = tracker.stageAwards.reduce(
    (sum, award) => sum + award.coins,
    0,
  )
  const safeStreak =
    typeof streakRewardCoins === 'number' && Number.isFinite(streakRewardCoins)
      ? Math.max(0, Math.floor(streakRewardCoins))
      : 0
  return {
    stageClearCoins,
    resultBonusCoins: tracker.resultBonusCoins,
    streakRewardCoins: safeStreak,
    totalEarned: stageClearCoins + tracker.resultBonusCoins + safeStreak,
    stageAwards: tracker.stageAwards,
  }
}
