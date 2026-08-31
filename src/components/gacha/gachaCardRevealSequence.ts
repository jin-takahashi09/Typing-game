import type { CharacterRarity } from '../../config/characters'
import type { GachaPullItem } from '../../utils/gacha'
import { MULTI_SCROLL_COUNT } from './gachaMultiReveal'
import {
  CARD_REVEAL_ANIM_MS,
  MULTI_CENTRAL_FADE_OUT_MS,
  MULTI_SLOT_FADE_IN_DELAY_MS,
  MULTI_SLOT_SETTLE_MS,
  getMultiCentralPacing,
} from './gachaCardRevealTiming'

export type CardRevealContext = 'single' | 'multi' | 'central'

/** Grid slot states — FX plays in central overlay, not inline. */
export type MultiGridSlotState = 'closed' | 'opening' | 'revealed'

export type ScrollSlotState =
  | 'closed'
  | 'anticipation'
  | 'opening'
  | 'impact'
  | 'revealed'

export interface CardRevealTiming {
  anticipationMs: number
  openingMs: number
  impactMs: number
  betweenMs: number
}

export interface CardRevealFxFlags {
  showScroll: boolean
  scrollOpen: boolean
  scrollGold: boolean
  scrollTransform: boolean
  srGlow: boolean
  showSmoke: boolean
  smokeBig: boolean
  showLightning: boolean
  showElectricAura: boolean
  showGoldFlash: boolean
  showShockwave: boolean
  showRainbow: boolean
  showCrest: boolean
  showSilence: boolean
  showSeal: boolean
  showDivineLight: boolean
  showShinninBanner: boolean
  showRarityBanner: boolean
}

const EMPTY_FX: CardRevealFxFlags = {
  showScroll: false,
  scrollOpen: false,
  scrollGold: false,
  scrollTransform: false,
  srGlow: false,
  showSmoke: false,
  smokeBig: false,
  showLightning: false,
  showElectricAura: false,
  showGoldFlash: false,
  showShockwave: false,
  showRainbow: false,
  showCrest: false,
  showSilence: false,
  showSeal: false,
  showDivineLight: false,
  showShinninBanner: false,
  showRarityBanner: false,
}

export function getCardRevealTiming(
  rarity: CharacterRarity,
  reducedMotion: boolean,
): CardRevealTiming {
  if (reducedMotion) {
    return {
      anticipationMs: CARD_REVEAL_ANIM_MS.reducedAnticipation,
      openingMs: CARD_REVEAL_ANIM_MS.reducedOpening,
      impactMs: CARD_REVEAL_ANIM_MS.reducedImpact,
      betweenMs: 60,
    }
  }

  switch (rarity) {
    case 'SHINNIN':
      return {
        anticipationMs: 450,
        openingMs: CARD_REVEAL_ANIM_MS.scrollTransform,
        impactMs: CARD_REVEAL_ANIM_MS.divineLightning,
        betweenMs: 350,
      }
    case 'UR':
      return {
        anticipationMs: 380,
        openingMs: CARD_REVEAL_ANIM_MS.scrollGold,
        impactMs: CARD_REVEAL_ANIM_MS.goldLightning,
        betweenMs: 180,
      }
    case 'SSR':
      return {
        anticipationMs: 300,
        openingMs: CARD_REVEAL_ANIM_MS.scrollGold,
        impactMs: CARD_REVEAL_ANIM_MS.electric,
        betweenMs: 50,
      }
    case 'SR':
      return {
        anticipationMs: 200,
        openingMs: CARD_REVEAL_ANIM_MS.scrollOpen,
        impactMs: CARD_REVEAL_ANIM_MS.smoke + CARD_REVEAL_ANIM_MS.electricLead,
        betweenMs: 50,
      }
    default:
      return {
        anticipationMs: 150,
        openingMs: CARD_REVEAL_ANIM_MS.scrollOpen,
        impactMs: CARD_REVEAL_ANIM_MS.smoke,
        betweenMs: 0,
      }
  }
}

export function cardRevealTotalMs(timing: CardRevealTiming): number {
  return timing.anticipationMs + timing.openingMs + timing.impactMs + timing.betweenMs
}

export function needsHighRareAnticipation(
  rarity: CharacterRarity,
  reducedMotion: boolean,
): boolean {
  if (reducedMotion) {
    return false
  }
  return rarity === 'SR' || rarity === 'SSR' || rarity === 'UR' || rarity === 'SHINNIN'
}

export function getCardRevealFxFlags(
  rarity: CharacterRarity,
  state: ScrollSlotState,
  reducedMotion: boolean,
): CardRevealFxFlags {
  if (state === 'revealed') {
    return EMPTY_FX
  }

  const isAnticipation = state === 'anticipation'
  const isOpening = state === 'opening'
  const isImpact = state === 'impact'
  const isPreReveal = isAnticipation || isOpening || isImpact

  if (!isPreReveal && state !== 'closed') {
    return EMPTY_FX
  }

  const showScroll =
    state === 'closed' || isAnticipation || isOpening || (isImpact && rarity !== 'SHINNIN')

  const base: CardRevealFxFlags = {
    ...EMPTY_FX,
    showScroll,
    scrollOpen: isOpening || isImpact,
    srGlow: isAnticipation && (rarity === 'SR' || rarity === 'SSR'),
  }

  if (reducedMotion) {
    if (isImpact && (rarity === 'SSR' || rarity === 'SR')) {
      return { ...base, showElectricAura: true, showLightning: rarity !== 'SR' }
    }
    if (isImpact && rarity === 'UR') {
      return { ...base, showCrest: true }
    }
    if (isImpact && rarity === 'SHINNIN') {
      return { ...base, showDivineLight: true }
    }
    if (isImpact) {
      return { ...base, showSmoke: true }
    }
    return base
  }

  switch (rarity) {
    case 'SHINNIN':
      return {
        ...base,
        scrollTransform: isOpening || isImpact,
        showSilence: isAnticipation,
        showSeal: isAnticipation,
        showLightning: isImpact,
        showElectricAura: isAnticipation || isImpact,
        showSmoke: isImpact,
        smokeBig: isImpact,
        showDivineLight: isImpact,
        showCrest: isImpact,
      }
    case 'UR':
      return {
        ...base,
        scrollGold: isOpening || isImpact,
        showElectricAura: isAnticipation || isImpact,
        showLightning: isAnticipation || isImpact,
        showSmoke: isImpact,
        smokeBig: isImpact,
        showRainbow: isImpact,
        showCrest: isImpact,
      }
    case 'SSR':
      return {
        ...base,
        scrollGold: isOpening || isImpact,
        srGlow: isAnticipation || isOpening,
        showElectricAura: isAnticipation || isOpening || isImpact,
        showLightning: isOpening || isImpact,
        showGoldFlash: isImpact,
        showShockwave: isImpact,
        showSmoke: isImpact,
        smokeBig: isImpact,
      }
    case 'SR':
      return {
        ...base,
        srGlow: isAnticipation || isOpening,
        showElectricAura: isImpact,
        showLightning: isImpact,
        showSmoke: isImpact,
      }
    default:
      return {
        ...base,
        showSmoke: isImpact,
      }
  }
}

export function createInitialSlotStates(
  count: number,
  state: ScrollSlotState = 'closed',
): ScrollSlotState[] {
  return Array.from({ length: count }, () => state)
}

export function countSlotsInState(
  states: readonly ScrollSlotState[],
  state: ScrollSlotState,
): number {
  return states.filter((slot) => slot === state).length
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const id = globalThis.setTimeout(() => resolve(), ms)
    signal?.addEventListener(
      'abort',
      () => {
        globalThis.clearTimeout(id)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

/** Unified card reveal: anticipation → opening → impact → revealed */
export async function runCardRevealSequence(
  rarity: CharacterRarity,
  reducedMotion: boolean,
  setState: (state: ScrollSlotState) => void,
  signal?: AbortSignal,
): Promise<void> {
  const timing = getCardRevealTiming(rarity, reducedMotion)

  setState('anticipation')
  await delay(timing.anticipationMs, signal)

  setState('opening')
  await delay(timing.openingMs, signal)

  setState('impact')
  await delay(timing.impactMs, signal)

  setState('revealed')
  if (timing.betweenMs > 0) {
    await delay(timing.betweenMs, signal)
  }
}

export async function runSingleRevealSequence(
  item: GachaPullItem,
  reducedMotion: boolean,
  setState: (state: ScrollSlotState) => void,
  setApproaching: (approaching: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  setApproaching(true)
  setState('closed')
  await delay(
    reducedMotion ? CARD_REVEAL_ANIM_MS.reducedApproach : CARD_REVEAL_ANIM_MS.approach,
    signal,
  )
  setApproaching(false)
  await runCardRevealSequence(item.rarity, reducedMotion, setState, signal)
}

export async function runMultiCentralRevealSequence(
  items: readonly GachaPullItem[],
  reducedMotion: boolean,
  handlers: {
    setActiveRevealIndex: (index: number | null) => void
    setGridSlotState: (index: number, state: MultiGridSlotState) => void
    setCentralState: (state: ScrollSlotState) => void
    setCentralReturning?: (returning: boolean) => void
    setSlotSettlingIndex?: (index: number | null) => void
  },
  signal?: AbortSignal,
): Promise<void> {
  const total = Math.min(items.length, MULTI_SCROLL_COUNT)
  for (let index = 0; index < total; index += 1) {
    const item = items[index]
    if (!item) {
      continue
    }

    const pacing = getMultiCentralPacing(item.rarity, reducedMotion)
    const isLast = index === total - 1

    handlers.setActiveRevealIndex(index)
    handlers.setGridSlotState(index, 'opening')
    handlers.setCentralReturning?.(false)
    handlers.setSlotSettlingIndex?.(null)

    await runCardRevealSequence(
      item.rarity,
      reducedMotion,
      handlers.setCentralState,
      signal,
    )

    const holdMs = pacing.resultHoldMs + (isLast ? pacing.lastCardHoldBonusMs : 0)
    await delay(holdMs, signal)

    handlers.setCentralReturning?.(true)
    await delay(MULTI_SLOT_FADE_IN_DELAY_MS, signal)

    handlers.setGridSlotState(index, 'revealed')
    await delay(MULTI_CENTRAL_FADE_OUT_MS - MULTI_SLOT_FADE_IN_DELAY_MS, signal)

    handlers.setActiveRevealIndex(null)
    handlers.setCentralState('closed')
    handlers.setCentralReturning?.(false)

    handlers.setSlotSettlingIndex?.(index)
    await delay(MULTI_SLOT_SETTLE_MS, signal)
    handlers.setSlotSettlingIndex?.(null)

    await delay(pacing.postSettlePauseMs, signal)

    if (!isLast) {
      await delay(pacing.nextGapMs, signal)
    }
  }
}

/** Both single and multi central overlay use runCardRevealSequence — exported for tests. */
export const SHARED_CARD_REVEAL_SEQUENCE = runCardRevealSequence
