import { describe, expect, it } from 'vitest'
import {
  applyPerfectClear,
  commitStreakReward,
  createInitialStreakProgress,
  getStreakReward,
  resetStreakProgress,
} from './streakRewards'

describe('streakRewards pure functions', () => {
  it('increments to 1 on first perfect clear', () => {
    const progress = createInitialStreakProgress()
    const result = applyPerfectClear(progress)
    expect(result.previousCount).toBe(0)
    expect(result.nextCount).toBe(1)
    expect(result.timeBonusSeconds).toBe(0)
    expect(result.coinBonus).toBe(0)
    expect(result.reachedMilestone).toBeNull()
    expect(progress.currentCount).toBe(0)
  })

  it('gives no reward at 3', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 2,
    })
    expect(result.nextCount).toBe(3)
    expect(result.timeBonusSeconds).toBe(0)
    expect(result.coinBonus).toBe(0)
  })

  it('awards +1s +1coin at 4', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 3,
    })
    expect(result.nextCount).toBe(4)
    expect(result.timeBonusSeconds).toBe(1)
    expect(result.coinBonus).toBe(1)
    expect(result.reachedMilestone).toBe(4)
  })

  it('gives no extra reward at 7', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 6,
    })
    expect(result.nextCount).toBe(7)
    expect(result.timeBonusSeconds).toBe(0)
    expect(result.coinBonus).toBe(0)
  })

  it('awards +2s +2coin at 8', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 7,
    })
    expect(result.nextCount).toBe(8)
    expect(result.timeBonusSeconds).toBe(2)
    expect(result.coinBonus).toBe(2)
    expect(result.reachedMilestone).toBe(8)
  })

  it('gives no extra reward at 11', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 10,
    })
    expect(result.nextCount).toBe(11)
    expect(result.timeBonusSeconds).toBe(0)
  })

  it('awards +3s +3coin at 12 and resets to 0', () => {
    const result = applyPerfectClear({
      ...createInitialStreakProgress(),
      currentCount: 11,
    })
    expect(result.nextCount).toBe(0)
    expect(result.timeBonusSeconds).toBe(3)
    expect(result.coinBonus).toBe(3)
    expect(result.reachedMilestone).toBe(12)
    expect(result.completedCycle).toBe(true)
  })

  it('starts again at 1 after a completed cycle', () => {
    const after12 = commitStreakReward(
      { ...createInitialStreakProgress(), currentCount: 11, totalBonusSeconds: 3, totalRewardCoins: 3 },
      applyPerfectClear({ ...createInitialStreakProgress(), currentCount: 11 }),
    )
    expect(after12.currentCount).toBe(0)
    const next = applyPerfectClear(after12)
    expect(next.nextCount).toBe(1)
    expect(next.timeBonusSeconds).toBe(0)
  })

  it('does not mutate input progress', () => {
    const progress = {
      currentCount: 3,
      maxCount: 12,
      totalBonusSeconds: 1,
      totalRewardCoins: 1,
    }
    const snapshot = { ...progress }
    applyPerfectClear(progress)
    resetStreakProgress(progress)
    expect(progress).toEqual(snapshot)
  })

  it('sanitizes NaN and negative counts', () => {
    const fromNan = applyPerfectClear({
      currentCount: Number.NaN,
      maxCount: 12,
      totalBonusSeconds: Number.NaN,
      totalRewardCoins: -5,
    })
    expect(fromNan.previousCount).toBe(0)
    expect(fromNan.nextCount).toBe(1)

    const reset = resetStreakProgress({
      currentCount: -3,
      maxCount: 12,
      totalBonusSeconds: -2,
      totalRewardCoins: Number.NaN,
    })
    expect(reset.currentCount).toBe(0)
    expect(reset.totalBonusSeconds).toBe(0)
    expect(reset.totalRewardCoins).toBe(0)
  })

  it('getStreakReward only hits 4/8/12', () => {
    expect(getStreakReward(4).coinBonus).toBe(1)
    expect(getStreakReward(8).timeBonusSeconds).toBe(2)
    expect(getStreakReward(12).coinBonus).toBe(3)
    expect(getStreakReward(5).milestone).toBeNull()
    expect(getStreakReward(Number.NaN).milestone).toBeNull()
  })

  it('resetStreakProgress keeps earned totals', () => {
    const reset = resetStreakProgress({
      currentCount: 7,
      maxCount: 12,
      totalBonusSeconds: 3,
      totalRewardCoins: 3,
    })
    expect(reset.currentCount).toBe(0)
    expect(reset.totalBonusSeconds).toBe(3)
    expect(reset.totalRewardCoins).toBe(3)
  })
})
