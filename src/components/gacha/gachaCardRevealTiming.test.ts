import { describe, expect, it } from 'vitest'
import type { CharacterRarity } from '../../config/characters'
import { cardRevealTotalMs, getCardRevealTiming } from './gachaCardRevealSequence'
import {
  CARD_REVEAL_ANIM_MS,
  MULTI_CENTRAL_FADE_OUT_MS,
  MULTI_SLOT_FADE_IN_DELAY_MS,
  MULTI_SLOT_SETTLE_MS,
  getMultiCentralPacing,
  multiCardCycleMs,
  multiPostRevealMs,
  multiReturnPhaseMs,
} from './gachaCardRevealTiming'

describe('gachaCardRevealTiming', () => {
  it('multi return phase uses staggered crossfade timing', () => {
    expect(multiReturnPhaseMs()).toBe(
      MULTI_SLOT_FADE_IN_DELAY_MS + (MULTI_CENTRAL_FADE_OUT_MS - MULTI_SLOT_FADE_IN_DELAY_MS) + MULTI_SLOT_SETTLE_MS,
    )
    expect(MULTI_CENTRAL_FADE_OUT_MS).toBeGreaterThanOrEqual(180)
    expect(MULTI_CENTRAL_FADE_OUT_MS).toBeLessThanOrEqual(250)
  })

  it('shortens N/R multi post-reveal pacing without touching reveal FX', () => {
    const nPacing = getMultiCentralPacing('N', false)
    expect(nPacing.resultHoldMs).toBeLessThan(800)
    expect(nPacing.postSettlePauseMs).toBeGreaterThanOrEqual(100)
    expect(nPacing.postSettlePauseMs).toBeLessThanOrEqual(180)
    expect(nPacing.nextGapMs).toBeLessThan(200)

    const oldPostReveal = 800 + 300 + 250 + 200
    const newPostReveal = multiPostRevealMs(nPacing)
    expect(newPostReveal).toBeLessThan(oldPostReveal * 0.88)
  })

  it('keeps high-rarity holds longer than N/R', () => {
    const n = getMultiCentralPacing('N', false).resultHoldMs
    const sr = getMultiCentralPacing('SR', false).resultHoldMs
    const ssr = getMultiCentralPacing('SSR', false).resultHoldMs
    const ur = getMultiCentralPacing('UR', false).resultHoldMs
    const shinnin = getMultiCentralPacing('SHINNIN', false).resultHoldMs
    expect(sr).toBeGreaterThan(n)
    expect(ssr).toBeGreaterThan(sr)
    expect(ur).toBeGreaterThan(ssr)
    expect(shinnin).toBeGreaterThan(ur)
  })

  it('adds last-card hold bonus without changing reveal durations', () => {
    const pacing = getMultiCentralPacing('N', false)
    const midPost = multiPostRevealMs(pacing)
    const lastPost = multiPostRevealMs(pacing, true)
    expect(lastPost).toBeGreaterThan(midPost)
    expect(cardRevealTotalMs(getCardRevealTiming('N', false))).toBe(810)
    expect(CARD_REVEAL_ANIM_MS.scrollOpen).toBe(360)
  })

  it('estimates N/R multi card cycle near 1.3-2.0s post-reveal window', () => {
    for (const rarity of ['N', 'R'] as CharacterRarity[]) {
      const revealMs = cardRevealTotalMs(getCardRevealTiming(rarity, false))
      const postMs = multiPostRevealMs(getMultiCentralPacing(rarity, false))
      expect(postMs).toBeGreaterThanOrEqual(1200)
      expect(postMs).toBeLessThanOrEqual(1450)
      expect(multiCardCycleMs(rarity, revealMs, false)).toBe(revealMs + postMs)
    }
  })
})
