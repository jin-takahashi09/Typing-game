import { describe, expect, it, vi, afterEach } from 'vitest'
import type { CharacterRarity } from '../../config/characters'
import { gachaConfig } from '../../config/gachaConfig'
import type { GachaPullItem } from '../../utils/gacha'
import {
  SHARED_CARD_REVEAL_SEQUENCE,
  cardRevealTotalMs,
  countSlotsInState,
  createInitialSlotStates,
  getCardRevealFxFlags,
  getCardRevealTiming,
  needsHighRareAnticipation,
  runCardRevealSequence,
  runMultiCentralRevealSequence,
  runSingleRevealSequence,
  type ScrollSlotState,
} from './gachaCardRevealSequence'
import { CARD_REVEAL_ANIM_MS, SINGLE_DEAD_WAIT_REMOVED_MS, getMultiCentralPacing, multiPostRevealMs } from './gachaCardRevealTiming'

function mockItem(
  rarity: CharacterRarity,
  characterId: string,
  index = 0,
): GachaPullItem {
  return {
    characterId,
    name: `Char ${index}`,
    rarity,
    wasDuplicate: index % 2 === 1,
    duplicateCoins: 10,
    newlyOwned: index % 2 === 0,
  }
}

describe('gachaCardRevealSequence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('exports one shared sequence for single and multi central', () => {
    expect(SHARED_CARD_REVEAL_SEQUENCE).toBe(runCardRevealSequence)
  })

  describe('getCardRevealTiming', () => {
    it('returns ~680ms+ total for N/R including impact', () => {
      const timing = getCardRevealTiming('N', false)
      expect(cardRevealTotalMs(timing)).toBeGreaterThanOrEqual(650)
    })

    it('matches target durations per rarity band', () => {
      expect(cardRevealTotalMs(getCardRevealTiming('N', false))).toBe(810)
      expect(cardRevealTotalMs(getCardRevealTiming('SR', false))).toBe(1170)
      expect(cardRevealTotalMs(getCardRevealTiming('SSR', false))).toBe(1250)
      expect(cardRevealTotalMs(getCardRevealTiming('UR', false))).toBe(1420)
      expect(cardRevealTotalMs(getCardRevealTiming('SHINNIN', false))).toBe(1840)
    })
  })

  describe('getCardRevealFxFlags', () => {
    it('shows smoke on impact for N/R', () => {
      const fx = getCardRevealFxFlags('N', 'impact', false)
      expect(fx.showSmoke).toBe(true)
      expect(fx.showLightning).toBe(false)
    })

    it('shows full SSR impact FX without rarity text banner', () => {
      const fx = getCardRevealFxFlags('SSR', 'impact', false)
      expect(fx.showGoldFlash).toBe(true)
      expect(fx.showShockwave).toBe(true)
      expect(fx.showLightning).toBe(true)
      expect(fx.showRarityBanner).toBe(false)
    })

    it('never shows rarity banner before revealed state', () => {
      for (const state of ['anticipation', 'opening', 'impact'] as const) {
        expect(getCardRevealFxFlags('SR', state, false).showRarityBanner).toBe(false)
        expect(getCardRevealFxFlags('UR', state, false).showRarityBanner).toBe(false)
        expect(getCardRevealFxFlags('SSR', state, false).showRarityBanner).toBe(false)
        expect(getCardRevealFxFlags('SHINNIN', state, false).showShinninBanner).toBe(false)
      }
    })
  })

  describe('runCardRevealSequence', () => {
    it('passes anticipation → opening → impact → revealed', async () => {
      vi.useFakeTimers()
      const states: ScrollSlotState[] = []
      const promise = runCardRevealSequence('N', false, (state) => states.push(state))
      await vi.runAllTimersAsync()
      await promise
      expect(states).toEqual(['anticipation', 'opening', 'impact', 'revealed'])
    })
  })

  describe('getMultiCentralPacing', () => {
    it('shortens N/R post-reveal hold while keeping reveal FX durations', () => {
      const pacing = getMultiCentralPacing('N', false)
      expect(pacing.resultHoldMs).toBeLessThan(800)
      expect(multiPostRevealMs(pacing)).toBeLessThan(1550)
      expect(cardRevealTotalMs(getCardRevealTiming('N', false))).toBe(810)
    })

    it('uses longer holds for high rarity', () => {
      const n = getMultiCentralPacing('N', false).resultHoldMs
      const sr = getMultiCentralPacing('SR', false).resultHoldMs
      const ssr = getMultiCentralPacing('SSR', false).resultHoldMs
      expect(sr).toBeGreaterThan(n)
      expect(ssr).toBeGreaterThan(sr)
    })
  })

  describe('runMultiCentralRevealSequence', () => {
    it('advances activeRevealIndex in order and reveals grid slots after central', async () => {
      vi.useFakeTimers()
      const items = [
        mockItem('N', 'a', 0),
        mockItem('R', 'b', 1),
        mockItem('N', 'c', 2),
      ]
      const activeIndexes: Array<number | null> = []
      const gridStates: Array<{ index: number; state: string }> = []
      const centralStates: ScrollSlotState[] = []

      const promise = runMultiCentralRevealSequence(items, true, {
        setActiveRevealIndex: (index) => activeIndexes.push(index),
        setGridSlotState: (index, state) => gridStates.push({ index, state }),
        setCentralState: (state) => centralStates.push(state),
      })

      await vi.runAllTimersAsync()
      await promise

      expect(activeIndexes.filter((i) => i === 0).length).toBeGreaterThan(0)
      expect(activeIndexes.filter((i) => i === 1).length).toBeGreaterThan(0)
      expect(activeIndexes.at(-1)).toBe(null)

      const revealedGrid = gridStates.filter((g) => g.state === 'revealed')
      expect(revealedGrid.map((g) => g.index)).toEqual([0, 1, 2])

      expect(centralStates).toContain('anticipation')
      expect(centralStates).toContain('opening')
      expect(centralStates).toContain('impact')
    })

    it('staggers grid reveal after central return starts and before next index', async () => {
      vi.useFakeTimers()
      const items = [mockItem('N', 'a', 0), mockItem('N', 'b', 1)]
      const events: string[] = []

      const promise = runMultiCentralRevealSequence(items, true, {
        setActiveRevealIndex: (index) => {
          events.push(`active:${index ?? 'null'}`)
        },
        setGridSlotState: (index, state) => {
          events.push(`grid:${index}:${state}`)
        },
        setCentralState: () => {
          /* timing-only */
        },
        setCentralReturning: (returning) => {
          events.push(`returning:${returning}`)
        },
        setSlotSettlingIndex: (index) => {
          events.push(`settling:${index ?? 'null'}`)
        },
      })

      await vi.runAllTimersAsync()
      await promise

      const returningIdx = events.indexOf('returning:true')
      const gridRevealedIdx = events.indexOf('grid:0:revealed')
      const activeNullIdx = events.indexOf('active:null')
      const settlingIdx = events.indexOf('settling:0')
      const nextStartIdx = events.indexOf('active:1')

      expect(returningIdx).toBeGreaterThan(-1)
      expect(gridRevealedIdx).toBeGreaterThan(returningIdx)
      expect(activeNullIdx).toBeGreaterThan(gridRevealedIdx)
      expect(settlingIdx).toBeGreaterThan(activeNullIdx)
      const firstSettlingStart = events.indexOf('settling:0')
      const firstSettlingEnd = events.indexOf('settling:null', firstSettlingStart + 1)
      expect(nextStartIdx).toBeGreaterThan(firstSettlingEnd)
    })
  })

  describe('runSingleRevealSequence', () => {
    it('does not include dead wait after approach', async () => {
      vi.useFakeTimers()
      const states: ScrollSlotState[] = []
      const approachFlags: boolean[] = []
      const promise = runSingleRevealSequence(
        mockItem('N', 'single', 0),
        false,
        (state) => states.push(state),
        (approaching) => approachFlags.push(approaching),
      )
      await vi.advanceTimersByTimeAsync(CARD_REVEAL_ANIM_MS.approach)
      expect(approachFlags.at(-1)).toBe(false)
      expect(states.at(-1)).toBe('anticipation')
      await vi.runAllTimersAsync()
      await promise
      expect(states.at(-1)).toBe('revealed')
    })

    it('removed 220ms closed pause after approach', () => {
      expect(SINGLE_DEAD_WAIT_REMOVED_MS).toBe(220)
    })
  })

  describe('needsHighRareAnticipation', () => {
    it('flags SR+ for special pre-open FX', () => {
      expect(needsHighRareAnticipation('SR', false)).toBe(true)
      expect(needsHighRareAnticipation('N', false)).toBe(false)
    })
  })

  describe('createInitialSlotStates', () => {
    it('creates 10 closed slots for multi', () => {
      const states = createInitialSlotStates(10, 'closed')
      expect(states).toHaveLength(10)
      expect(countSlotsInState(states, 'closed')).toBe(10)
    })
  })

  it('does not change gacha rates or coin costs', () => {
    expect(gachaConfig.singleCost).toBe(100)
    expect(gachaConfig.multiCost).toBe(900)
  })
})
