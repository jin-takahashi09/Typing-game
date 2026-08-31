import type { GachaRevealPhase } from './gachaRevealEntrance'
import { phaseDurationMs } from './gachaRevealPhases'

/** Sum of timed reveal phases (excludes `done`). */
export function totalRevealDurationMs(
  phases: readonly GachaRevealPhase[],
  reducedMotion: boolean,
): number {
  return phases.reduce((sum, phase) => {
    if (phase === 'done') {
      return sum
    }
    const ms = phaseDurationMs(phase, reducedMotion)
    return sum + (typeof ms === 'number' && ms > 0 ? ms : 0)
  }, 0)
}

/** Every non-terminal phase must have a positive duration. */
export function validatePhaseDurations(
  phases: readonly GachaRevealPhase[],
  reducedMotion: boolean,
): { ok: true } | { ok: false; phase: GachaRevealPhase; ms: number | undefined } {
  for (const phase of phases) {
    if (phase === 'done') {
      continue
    }
    const ms = phaseDurationMs(phase, reducedMotion)
    if (ms === undefined || ms <= 0) {
      return { ok: false, phase, ms }
    }
  }
  return { ok: true }
}
