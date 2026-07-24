import { computeElapsedMs, type ElapsedClockState } from './elapsedTime'

/** 経過時間から残り時間（ms）を算出。0未満にはしない。 */
export function computeRemainingMs(
  clock: ElapsedClockState,
  nowMs: number,
  timeLimitSeconds: number,
): number {
  const elapsedMs = computeElapsedMs(clock, nowMs)
  const limitMs = Math.max(0, timeLimitSeconds) * 1000
  return Math.max(0, limitMs - elapsedMs)
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function isTimeUp(
  clock: ElapsedClockState,
  nowMs: number,
  timeLimitSeconds: number,
): boolean {
  return computeRemainingMs(clock, nowMs, timeLimitSeconds) <= 0
}
