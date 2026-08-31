import type { CharacterRarity } from '../../config/characters'

/** Durations synced with characters-gacha.css animations. */
export const CARD_REVEAL_ANIM_MS = {
  approach: 400,
  scrollOpen: 360,
  scrollGold: 340,
  scrollTransform: 420,
  smoke: 300,
  smokeBig: 380,
  electricLead: 260,
  electric: 560,
  goldFlash: 320,
  goldLightning: 520,
  shockwave: 300,
  rarityBanner: 300,
  rainbow: 340,
  crest: 360,
  divineLightning: 620,
  divineLight: 380,
  resultEnter: 380,
  rarityLabelDelay: 400,
  reducedApproach: 180,
  reducedAnticipation: 60,
  reducedOpening: 100,
  reducedImpact: 80,
} as const

/** Central overlay fade-out while returning to grid (synced with CSS). */
export const MULTI_CENTRAL_FADE_OUT_MS = 220

/** Delay before grid slot result fade-in starts (overlaps central fade-out). */
export const MULTI_SLOT_FADE_IN_DELAY_MS = 100

/** Grid slot result fade-in duration (synced with CSS). */
export const MULTI_SLOT_FADE_IN_MS = 220

/** Grid slot settle pop after central clears (synced with CSS). */
export const MULTI_SLOT_SETTLE_MS = 200

/** @deprecated Use MULTI_CENTRAL_FADE_OUT_MS — kept for reference in tests. */
export const MULTI_RETURN_TRANSITION_MS = MULTI_CENTRAL_FADE_OUT_MS

/** Viewport safe margin for central result (px). */
export const CENTRAL_RESULT_SAFE_MARGIN_PX = 20

/** Dead wait removed from single flow (was 220ms closed pause after approach). */
export const SINGLE_DEAD_WAIT_REMOVED_MS = 220

export interface MultiCentralPacing {
  /** Time to show result at center after character appears. */
  resultHoldMs: number
  /** Extra hold on the final card before returning to grid. */
  lastCardHoldBonusMs: number
  /** Pause after slot settle before the next central open. */
  postSettlePauseMs: number
  /** Gap before next central open (after post-settle pause). */
  nextGapMs: number
}

export function multiReturnPhaseMs(): number {
  return (
    MULTI_SLOT_FADE_IN_DELAY_MS +
    (MULTI_CENTRAL_FADE_OUT_MS - MULTI_SLOT_FADE_IN_DELAY_MS) +
    MULTI_SLOT_SETTLE_MS
  )
}

export function getMultiCentralPacing(
  rarity: CharacterRarity,
  reducedMotion: boolean,
): MultiCentralPacing {
  if (reducedMotion) {
    return {
      resultHoldMs: 240,
      lastCardHoldBonusMs: 120,
      postSettlePauseMs: 90,
      nextGapMs: 70,
    }
  }

  switch (rarity) {
    case 'SHINNIN':
      return {
        resultHoldMs: 1620,
        lastCardHoldBonusMs: 260,
        postSettlePauseMs: 150,
        nextGapMs: 160,
      }
    case 'UR':
      return {
        resultHoldMs: 1320,
        lastCardHoldBonusMs: 240,
        postSettlePauseMs: 140,
        nextGapMs: 150,
      }
    case 'SSR':
      return {
        resultHoldMs: 1050,
        lastCardHoldBonusMs: 220,
        postSettlePauseMs: 130,
        nextGapMs: 130,
      }
    case 'SR':
      return {
        resultHoldMs: 900,
        lastCardHoldBonusMs: 200,
        postSettlePauseMs: 140,
        nextGapMs: 140,
      }
    default:
      return {
        resultHoldMs: 580,
        lastCardHoldBonusMs: 200,
        postSettlePauseMs: 110,
        nextGapMs: 90,
      }
  }
}

/** Ms from central revealed → next card central-open-start (multi-only pacing). */
export function multiPostRevealMs(pacing: MultiCentralPacing, isLastCard = false): number {
  const holdMs = pacing.resultHoldMs + (isLastCard ? pacing.lastCardHoldBonusMs : 0)
  return (
    holdMs +
    multiReturnPhaseMs() +
    pacing.postSettlePauseMs +
    (isLastCard ? 0 : pacing.nextGapMs)
  )
}

/** Ms from central open start → next card central open (reveal FX + post-reveal). */
export function multiCardCycleMs(
  rarity: CharacterRarity,
  revealTotalMs: number,
  reducedMotion: boolean,
  isLastCard = false,
): number {
  return revealTotalMs + multiPostRevealMs(getMultiCentralPacing(rarity, reducedMotion), isLastCard)
}
