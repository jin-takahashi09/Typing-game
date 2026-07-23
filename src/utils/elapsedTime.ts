/**
 * Pause-aware elapsed time helpers (pure functions).
 */

export interface ElapsedClockState {
  gameStartedAtMs: number | null
  pausedTotalMs: number
  pausedAtMs: number | null
}

export function createElapsedClockState(
  startedAtMs: number | null = null,
): ElapsedClockState {
  return {
    gameStartedAtMs: startedAtMs,
    pausedTotalMs: 0,
    pausedAtMs: null,
  }
}

/** Accumulate pause duration when leaving paused state */
export function accumulatePause(
  clock: ElapsedClockState,
  nowMs: number,
): ElapsedClockState {
  if (clock.pausedAtMs === null) {
    return clock
  }

  return {
    ...clock,
    pausedTotalMs: clock.pausedTotalMs + Math.max(0, nowMs - clock.pausedAtMs),
    pausedAtMs: null,
  }
}

export function beginPause(
  clock: ElapsedClockState,
  nowMs: number,
): ElapsedClockState {
  if (clock.pausedAtMs !== null) {
    return clock
  }

  return {
    ...clock,
    pausedAtMs: nowMs,
  }
}

export function computeElapsedMs(
  clock: ElapsedClockState,
  nowMs: number,
): number {
  if (clock.gameStartedAtMs === null) {
    return 0
  }

  const pausedExtra =
    clock.pausedAtMs === null ? 0 : Math.max(0, nowMs - clock.pausedAtMs)

  return Math.max(
    0,
    nowMs - clock.gameStartedAtMs - clock.pausedTotalMs - pausedExtra,
  )
}
