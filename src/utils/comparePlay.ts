import type { GameResultSummary } from '../types/game'
import type { BestRecord, PlayComparison, PlayRecord, StoredAppData } from '../types/records'

export function findPreviousPlayForDifficulty(
  recentPlays: readonly PlayRecord[],
  difficulty: GameResultSummary['difficulty'],
): PlayRecord | null {
  return recentPlays.find((play) => play.difficulty === difficulty) ?? null
}

export function isBetterBest(candidate: PlayRecord, best: BestRecord | null): boolean {
  if (!best) {
    return true
  }

  if (candidate.score !== best.score) {
    return candidate.score > best.score
  }
  if (candidate.wpm !== best.wpm) {
    return candidate.wpm > best.wpm
  }
  if (candidate.accuracy !== best.accuracy) {
    return candidate.accuracy > best.accuracy
  }
  return candidate.stage > best.stage
}

export function buildPlayComparison(
  data: StoredAppData,
  result: GameResultSummary,
): PlayComparison {
  const previous = findPreviousPlayForDifficulty(data.recentPlays, result.difficulty)
  const currentBest = data.bestByDifficulty[result.difficulty]

  const candidate: PlayRecord = {
    id: 'pending',
    playedAt: new Date(0).toISOString(),
    difficulty: result.difficulty,
    score: result.score,
    stage: result.stage,
    destroyedTargets: result.destroyedTargets,
    elapsedMs: result.elapsedMs,
    typedChars: result.typedChars,
    correctChars: result.correctChars,
    missCount: result.missCount,
    accuracy: result.accuracy,
    wpm: result.wpm,
    maxCombo: result.maxCombo,
  }

  return {
    previous,
    scoreDelta: previous ? result.score - previous.score : null,
    wpmDelta: previous ? roundDelta(result.wpm - previous.wpm) : null,
    accuracyDelta: previous ? roundDelta(result.accuracy - previous.accuracy) : null,
    isNewBestScore: isBetterBest(candidate, currentBest),
    isNewBestWpm: currentBest ? result.wpm > currentBest.wpm : result.wpm > 0,
    isNewBestAccuracy: currentBest
      ? result.accuracy > currentBest.accuracy
      : result.accuracy > 0,
  }
}

function roundDelta(value: number): number {
  return Math.round(value * 10) / 10
}

export function formatDelta(value: number | null, suffix = ''): string {
  if (value === null) {
    return '—'
  }
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}${suffix}`
}
