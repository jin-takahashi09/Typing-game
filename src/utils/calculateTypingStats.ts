import type { RawTypingCounters, TypingStats } from '../types/typing'

const MS_PER_MINUTE = 60_000
const CHARS_PER_WORD = 5

export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0 || elapsedMs <= 0) {
    return 0
  }

  const minutes = elapsedMs / MS_PER_MINUTE
  if (minutes <= 0) {
    return 0
  }

  return Math.round((correctChars / CHARS_PER_WORD / minutes) * 10) / 10
}

export function calculateAccuracy(
  correctChars: number,
  typedChars: number,
): number {
  if (typedChars <= 0) {
    return 0
  }

  return Math.round((correctChars / typedChars) * 1000) / 10
}

export function buildTypingStats(
  raw: RawTypingCounters,
  elapsedMs: number,
): TypingStats {
  const safeElapsed = Math.max(0, elapsedMs)

  return {
    typedChars: raw.typedChars,
    correctChars: raw.correctChars,
    missCount: raw.missCount,
    elapsedMs: safeElapsed,
    wpm: calculateWpm(raw.correctChars, safeElapsed),
    accuracy: calculateAccuracy(raw.correctChars, raw.typedChars),
  }
}

export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
