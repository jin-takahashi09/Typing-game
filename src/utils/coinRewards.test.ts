import { describe, expect, it } from 'vitest'
import {
  calcResultBonusCoins,
  calcStageClearCoins,
  createPlayCoinTracker,
  summarizePlayCoins,
  tryAwardResultBonus,
  tryAwardStageClear,
} from './coinRewards'

describe('coinRewards', () => {
  it('calculates stage clear rewards', () => {
    expect(calcStageClearCoins(1)).toBe(10)
    expect(calcStageClearCoins(2)).toBe(15)
    expect(calcStageClearCoins(3)).toBe(20)
    expect(calcStageClearCoins(4)).toBe(25)
    expect(calcStageClearCoins(0)).toBe(0)
  })

  it('calculates result bonus from score', () => {
    expect(calcResultBonusCoins(0)).toBe(0)
    expect(calcResultBonusCoins(499)).toBe(0)
    expect(calcResultBonusCoins(500)).toBe(1)
    expect(calcResultBonusCoins(1250)).toBe(2)
  })

  it('awards stage 1 clear coins once', () => {
    let tracker = createPlayCoinTracker()
    const first = tryAwardStageClear(tracker, 1)
    expect(first.awarded).toBe(true)
    expect(first.coins).toBe(10)
    tracker = first.tracker

    const second = tryAwardStageClear(tracker, 1)
    expect(second.awarded).toBe(false)
    expect(second.coins).toBe(0)
  })

  it('awards result bonus once', () => {
    let tracker = createPlayCoinTracker()
    const first = tryAwardResultBonus(tracker, 1000)
    expect(first.awarded).toBe(true)
    expect(first.coins).toBe(2)
    tracker = first.tracker

    const second = tryAwardResultBonus(tracker, 5000)
    expect(second.awarded).toBe(false)
    expect(second.coins).toBe(0)
    expect(summarizePlayCoins(tracker).resultBonusCoins).toBe(2)
  })

  it('includes streak reward coins in total without double-counting stage', () => {
    let tracker = createPlayCoinTracker()
    tracker = tryAwardStageClear(tracker, 1).tracker
    const summary = summarizePlayCoins(tracker, 6)
    expect(summary.stageClearCoins).toBe(10)
    expect(summary.streakRewardCoins).toBe(6)
    expect(summary.totalEarned).toBe(16)
    expect(summarizePlayCoins(tracker).streakRewardCoins).toBe(0)
  })
})
