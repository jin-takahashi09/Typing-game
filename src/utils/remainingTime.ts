import { computeElapsedMs, type ElapsedClockState } from './elapsedTime'

/**
 * 経過時間から残り時間（ms）を算出。
 * timeBonusMs で制限を延長できる（上限なし、0未満にはしない）。
 */
export function computeRemainingMs(
  clock: ElapsedClockState,
  nowMs: number,
  timeLimitSeconds: number,
  timeBonusMs = 0,
): number {
  const elapsedMs = computeElapsedMs(clock, nowMs)
  const limitMs = Math.max(0, timeLimitSeconds) * 1000
  const bonusMs =
    typeof timeBonusMs === 'number' && Number.isFinite(timeBonusMs)
      ? Math.max(0, timeBonusMs)
      : 0
  return Math.max(0, limitMs + bonusMs - elapsedMs)
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
  timeBonusMs = 0,
): boolean {
  return computeRemainingMs(clock, nowMs, timeLimitSeconds, timeBonusMs) <= 0
}
