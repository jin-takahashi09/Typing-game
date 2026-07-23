/** STAGE N クリア時のコイン。例: 1→10, 2→15, 3→20 */
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
  stage: number
  coins: number
}

export interface PlayCoinTracker {
  rewardedStages: ReadonlySet<number>
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

export function summarizePlayCoins(tracker: PlayCoinTracker): {
  stageClearCoins: number
  resultBonusCoins: number
  totalEarned: number
  stageAwards: readonly StageCoinAward[]
} {
  const stageClearCoins = tracker.stageAwards.reduce(
    (sum, award) => sum + award.coins,
    0,
  )
  return {
    stageClearCoins,
    resultBonusCoins: tracker.resultBonusCoins,
    totalEarned: stageClearCoins + tracker.resultBonusCoins,
    stageAwards: tracker.stageAwards,
  }
}
