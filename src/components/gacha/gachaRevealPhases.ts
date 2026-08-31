import type { CharacterRarity } from '../../config/characters'
import type { GachaPullType } from '../../utils/gacha'
import { MULTI_BUNDLE_PHASE_MS, MULTI_GRID_PHASE_MS, MULTI_OPEN_PHASE_MS } from './gachaMultiReveal'
import {
  firstPhaseIndex,
  getResultPhaseIndex,
  isFxWindowActive,
  type GachaRevealPhase,
} from './gachaRevealEntrance'

export type RevealTier = 'n' | 'r' | 'sr' | 'ssr' | 'ur' | 'shinnin'

export function tierFromRarity(rarity: CharacterRarity): RevealTier {
  if (rarity === 'SHINNIN') {
    return 'shinnin'
  }
  return rarity.toLowerCase() as RevealTier
}

export function buildPhases(
  peakRarity: CharacterRarity,
  reducedMotion: boolean,
  pullType: GachaPullType,
): GachaRevealPhase[] {
  if (pullType === 'multi') {
    return ['multi-bundle', 'multi-grid', 'multi-open', 'done']
  }

  if (reducedMotion) {
    if (peakRarity === 'SHINNIN') {
      return ['blackout', 'silence', 'seal', 'shinnin-text', 'result', 'done']
    }
    if (peakRarity === 'UR') {
      return ['blackout', 'crest', 'result', 'done']
    }
    if (peakRarity === 'SSR') {
      return ['dark', 'electric', 'result', 'done']
    }
    if (peakRarity === 'SR') {
      return ['dark', 'electric', 'result', 'done']
    }
    return ['dark', 'smoke', 'result', 'done']
  }

  if (peakRarity === 'SHINNIN') {
    return [
      'blackout',
      'silence',
      'seal',
      'scroll-transform',
      'divine-lightning',
      'big-smoke',
      'divine-light',
      'crest',
      'shinnin-text',
      'result',
      'done',
    ]
  }

  if (peakRarity === 'UR') {
    return [
      'blackout',
      'gold-lightning',
      'crest',
      'scroll-gold',
      'big-smoke',
      'rainbow-flash',
      'rarity-text',
      'result',
      'done',
    ]
  }

  if (peakRarity === 'SSR') {
    return [
      'scroll',
      'blackout',
      'electric',
      'gold-flash',
      'scroll-gold',
      'big-smoke',
      'shockwave',
      'rarity-text',
      'result',
      'done',
    ]
  }

  if (peakRarity === 'SR') {
    return ['scroll', 'scroll-open', 'smoke', 'electric', 'rarity-text', 'result', 'done']
  }

  return ['scroll', 'scroll-open', 'smoke', 'result', 'done']
}

export function phaseDurationMs(phase: GachaRevealPhase, reducedMotion: boolean): number {
  if (phase === 'done') {
    return 0
  }
  if (phase === 'multi-bundle') {
    return reducedMotion ? 320 : MULTI_BUNDLE_PHASE_MS
  }
  if (phase === 'multi-grid') {
    return reducedMotion ? 240 : MULTI_GRID_PHASE_MS
  }
  if (phase === 'multi-open') {
    return reducedMotion ? 320 : MULTI_OPEN_PHASE_MS
  }
  if (reducedMotion) {
    return phase === 'blackout' || phase === 'dark' ? 160 : 140
  }
  switch (phase) {
    case 'dark':
      return 220
    case 'blackout':
      return 280
    case 'scroll':
      return 320
    case 'scroll-open':
      return 360
    case 'scroll-gold':
      return 340
    case 'smoke':
      return 300
    case 'big-smoke':
      return 380
    case 'electric':
      return 560
    case 'gold-lightning':
      return 520
    case 'gold-flash':
      return 320
    case 'shockwave':
      return 300
    case 'result':
      return 520
    case 'crest':
      return 360
    case 'rainbow-flash':
      return 340
    case 'silence':
      return 400
    case 'seal':
      return 480
    case 'scroll-transform':
      return 420
    case 'divine-lightning':
      return 620
    case 'divine-light':
      return 380
    case 'shinnin-text':
      return 420
    case 'rarity-text':
      return 300
    default:
      return reducedMotion ? 140 : 220
  }
}

export interface RevealFxVisibility {
  showScroll: boolean
  showSmoke: boolean
  showLightning: boolean
  showElectricAura: boolean
  showSilence: boolean
  showSeal: boolean
  showDivineLight: boolean
  showShinninBanner: boolean
  showMultiBundle: boolean
  showMultiGrid: boolean
  showMultiOpen: boolean
  showGoldFlash: boolean
  showShockwave: boolean
  showRainbow: boolean
  showCrest: boolean
  showRarityBanner: boolean
  smokeBig: boolean
}

export function getRevealFxVisibility(
  phases: readonly GachaRevealPhase[],
  index: number,
  phase: GachaRevealPhase,
  tier: RevealTier,
  isMulti: boolean,
  reducedMotion: boolean,
): RevealFxVisibility {
  const rareTier =
    tier === 'sr' || tier === 'ssr' || tier === 'ur' || tier === 'shinnin' ? tier : null

  const showScroll =
    phase === 'scroll' ||
    phase === 'scroll-open' ||
    phase === 'scroll-gold' ||
    phase === 'scroll-transform' ||
    (rareTier === 'sr' && phase === 'electric')

  const showSmoke =
    isFxWindowActive(phases, index, ['smoke', 'big-smoke']) || phase === 'divine-lightning'

  const showLightning =
    !isMulti &&
    rareTier !== null &&
    (isFxWindowActive(phases, index, [
      'electric',
      'gold-lightning',
      'divine-lightning',
      'gold-flash',
    ]) ||
      (reducedMotion && phase === 'crest'))

  const showElectricAura =
    !isMulti &&
    rareTier !== null &&
    isFxWindowActive(phases, index, [
      'electric',
      'gold-lightning',
      'divine-lightning',
      'gold-flash',
      'shockwave',
      'rainbow-flash',
      'divine-light',
      'crest',
    ])

  const bigSmokeIndex = firstPhaseIndex(phases, ['big-smoke'])
  const smokeBig =
    showSmoke &&
    (phase === 'big-smoke' ||
      phase === 'divine-lightning' ||
      (bigSmokeIndex >= 0 && index >= bigSmokeIndex))

  return {
    showScroll,
    showSmoke,
    showLightning,
    showElectricAura,
    showSilence: phase === 'silence',
    showSeal: phase === 'seal',
    showDivineLight: isFxWindowActive(phases, index, ['divine-light']),
    showShinninBanner: isFxWindowActive(phases, index, ['shinnin-text']),
    showMultiBundle: isMulti && phase === 'multi-bundle',
    showMultiGrid: isMulti && phase === 'multi-grid',
    showMultiOpen: isMulti && phase === 'multi-open',
    showGoldFlash: isFxWindowActive(phases, index, ['gold-flash']),
    showShockwave: isFxWindowActive(phases, index, ['shockwave']),
    showRainbow: isFxWindowActive(phases, index, ['rainbow-flash']),
    showCrest: isFxWindowActive(phases, index, ['crest']),
    showRarityBanner: isFxWindowActive(phases, index, ['rarity-text']),
    smokeBig,
  }
}

/** FX phases must finish before the result visual phase. */
export function fxPhasesCompleteBeforeResult(
  phases: readonly GachaRevealPhase[],
): boolean {
  const resultIndex = getResultPhaseIndex(phases)
  if (resultIndex <= 0) {
    return true
  }
  const fxPhases = phases.slice(0, resultIndex)
  return fxPhases.length > 0 && !fxPhases.includes('done')
}
