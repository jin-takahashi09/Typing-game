export type GachaRevealPhase =
  | 'dark'
  | 'blackout'
  | 'scroll'
  | 'scroll-open'
  | 'scroll-gold'
  | 'smoke'
  | 'big-smoke'
  | 'electric'
  | 'gold-lightning'
  | 'gold-flash'
  | 'shockwave'
  | 'crest'
  | 'rainbow-flash'
  | 'silence'
  | 'seal'
  | 'scroll-transform'
  | 'divine-lightning'
  | 'divine-light'
  | 'shinnin-text'
  | 'multi-bundle'
  | 'multi-grid'
  | 'multi-open'
  | 'result'
  | 'rarity-text'
  | 'done'

/** Phase index where card + character appear (single pull). */
export function getResultPhaseIndex(phases: readonly GachaRevealPhase[]): number {
  return phases.indexOf('result')
}

export function firstPhaseIndex(
  phases: readonly GachaRevealPhase[],
  names: readonly GachaRevealPhase[],
): number {
  for (const name of names) {
    const index = phases.indexOf(name)
    if (index >= 0) {
      return index
    }
  }
  return -1
}

/** FX stays visible from its first trigger phase through the result phase (inclusive). */
export function isFxWindowActive(
  phases: readonly GachaRevealPhase[],
  currentIndex: number,
  startPhases: readonly GachaRevealPhase[],
): boolean {
  const start = firstPhaseIndex(phases, startPhases)
  if (start < 0 || currentIndex < start) {
    return false
  }
  const resultIndex = getResultPhaseIndex(phases)
  if (resultIndex < 0) {
    return true
  }
  return currentIndex <= resultIndex
}

/** Index of the first reveal phase that shows the result visual (card + character). */
export function firstResultVisualPhaseIndex(
  phases: readonly GachaRevealPhase[],
  _reducedMotion: boolean,
  pullType: 'single' | 'multi' = 'single',
): number {
  if (pullType === 'multi') {
    return -1
  }
  return getResultPhaseIndex(phases)
}

export function isResultVisualMountedPhase(
  phases: readonly GachaRevealPhase[],
  phaseIndex: number,
  reducedMotion: boolean,
  pullType: 'single' | 'multi' = 'single',
): boolean {
  if (pullType === 'multi') {
    return false
  }
  const firstIndex = firstResultVisualPhaseIndex(phases, reducedMotion, pullType)
  if (firstIndex < 0) {
    return false
  }
  const phase = phases[phaseIndex]
  return phaseIndex >= firstIndex && phase !== 'done'
}

/** Modal entrance runs only when reveal never showed the result visual to the user. */
export function shouldPlayResultModalEntrance(hasShownRevealResult: boolean): boolean {
  return !hasShownRevealResult
}
