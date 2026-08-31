import type { GachaPullType } from '../../utils/gacha'
import type { CharacterRarity } from '../../config/characters'

/** Interval between each card reveal in a 10-pull result modal (ms). */
export const MULTI_STAGGER_MS = 110

/** Interval between each scroll opening in 10-pull reveal FX (ms). */
export const MULTI_SCROLL_OPEN_STAGGER_MS = 120

/** Number of scrolls shown in 10-pull reveal. */
export const MULTI_SCROLL_COUNT = 10

/** Per-scroll open animation length (ms) — keep in sync with CSS. */
export const MULTI_SCROLL_OPEN_MS = 280

/** Duration of the multi-scroll bundle intro in reveal FX (ms). */
export const MULTI_BUNDLE_PHASE_MS = 480

/** Duration of grid layout transition (ms). */
export const MULTI_GRID_PHASE_MS = 420

/** Hold all 10 opened scrolls on screen after the last one opens (ms). */
export const MULTI_SCROLL_HOLD_MS = 600

/** Compute multi-open phase duration from stagger + open animation + hold. */
export function computeMultiOpenPhaseMs(
  count: number = MULTI_SCROLL_COUNT,
  staggerMs: number = MULTI_SCROLL_OPEN_STAGGER_MS,
  holdMs: number = MULTI_SCROLL_HOLD_MS,
  openMs: number = MULTI_SCROLL_OPEN_MS,
): number {
  if (count <= 0) {
    return holdMs
  }
  return (count - 1) * staggerMs + openMs + holdMs
}

/** Total duration of the multi-open phase (ms). */
export const MULTI_OPEN_PHASE_MS = computeMultiOpenPhaseMs()

/** Columns in the 5×2 reveal grid (PC baseline). */
export const MULTI_SCROLL_COLS = 5

/** @deprecated use MULTI_SCROLL_OPEN_STAGGER_MS */
export const MULTI_SCROLL_STAGGER_MS = MULTI_SCROLL_OPEN_STAGGER_MS

/** @deprecated use MULTI_SCROLL_OPEN_MS */
export const MULTI_SCROLL_ENTRANCE_MS = MULTI_SCROLL_OPEN_MS

/** @deprecated use computeMultiOpenPhaseMs */
export const computeMultiScrollsPhaseMs = computeMultiOpenPhaseMs

/** @deprecated use MULTI_OPEN_PHASE_MS */
export const MULTI_SCROLLS_PHASE_MS = MULTI_OPEN_PHASE_MS

export function shouldStaggerMultiReveal(
  pullType: GachaPullType,
  reducedMotion: boolean,
  revealSkipped: boolean,
): boolean {
  return pullType === 'multi' && !reducedMotion && !revealSkipped
}

export function getInitialMultiVisibleCount(
  pullType: GachaPullType,
  reducedMotion: boolean,
  revealSkipped: boolean,
  total: number,
): number {
  if (pullType !== 'multi') {
    return total
  }
  if (reducedMotion || revealSkipped) {
    return total
  }
  return 0
}

export function getInitialMultiOpenedCount(
  reducedMotion: boolean,
  revealSkipped: boolean,
): number {
  if (reducedMotion || revealSkipped) {
    return MULTI_SCROLL_COUNT
  }
  return 0
}

/** @deprecated use getInitialMultiOpenedCount */
export function getInitialMultiScrollVisibleCount(
  reducedMotion: boolean,
  revealSkipped: boolean,
): number {
  return getInitialMultiOpenedCount(reducedMotion, revealSkipped)
}

/** Stagger for result modal cards — first item after intervalMs. */
export function scheduleMultiStagger(
  total: number,
  intervalMs: number,
  onStep: (visibleCount: number) => void,
  onComplete: () => void,
): () => void {
  if (total <= 0) {
    onComplete()
    return () => {}
  }

  let visible = 0
  const timerIds: ReturnType<typeof setTimeout>[] = []

  const step = () => {
    visible += 1
    onStep(visible)
    if (visible >= total) {
      onComplete()
      return
    }
    timerIds.push(setTimeout(step, intervalMs))
  }

  timerIds.push(setTimeout(step, intervalMs))

  return () => {
    timerIds.forEach((id) => clearTimeout(id))
  }
}

/** Stagger for reveal scroll opens — first scroll opens immediately at t=0. */
export function scheduleMultiScrollOpen(
  total: number,
  intervalMs: number,
  onStep: (openedCount: number) => void,
  onComplete: () => void,
): () => void {
  if (total <= 0) {
    onComplete()
    return () => {}
  }

  let opened = 0
  const timerIds: ReturnType<typeof setTimeout>[] = []

  const step = () => {
    opened += 1
    onStep(opened)
    if (opened >= total) {
      onComplete()
      return
    }
    timerIds.push(setTimeout(step, intervalMs))
  }

  step()

  return () => {
    timerIds.forEach((id) => clearTimeout(id))
  }
}

/** @deprecated use scheduleMultiScrollOpen */
export const scheduleMultiScrollReveal = scheduleMultiScrollOpen

export function isHighRarityFlashTarget(rarity: CharacterRarity): boolean {
  return rarity === 'SSR' || rarity === 'UR' || rarity === 'SHINNIN'
}

export function highRarityFlashClass(rarity: CharacterRarity): string | null {
  if (rarity === 'SSR') return 'gacha-result-card__rare-flash--ssr'
  if (rarity === 'UR') return 'gacha-result-card__rare-flash--ur'
  if (rarity === 'SHINNIN') return 'gacha-result-card__rare-flash--shinnin'
  return null
}

export function scrollOpenFxClass(rarity: CharacterRarity): string {
  if (rarity === 'SHINNIN') return 'gacha-multi-scrolls__slot--fx-shinnin'
  if (rarity === 'UR') return 'gacha-multi-scrolls__slot--fx-ur'
  if (rarity === 'SSR') return 'gacha-multi-scrolls__slot--fx-ssr'
  if (rarity === 'SR') return 'gacha-multi-scrolls__slot--fx-sr'
  return 'gacha-multi-scrolls__slot--fx-n'
}
