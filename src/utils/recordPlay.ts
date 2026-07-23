import type { GameResultSummary } from '../types/game'
import type { BestRecord, PlayRecord, StoredAppData } from '../types/records'
import { isBetterBest } from './comparePlay'

export interface ApplyPlayResultOptions {
  playId: string
  playedAt: string
  recentPlaysLimit: number
}

export function createPlayRecordFromResult(
  result: GameResultSummary,
  options: Pick<ApplyPlayResultOptions, 'playId' | 'playedAt'>,
): PlayRecord {
  return {
    id: options.playId,
    playedAt: options.playedAt,
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
    characterId: result.characterId,
    ...(result.abilityBonusScore > 0
      ? { abilityBonusScore: result.abilityBonusScore }
      : {}),
    ...(result.abilityBonusCoins > 0
      ? { abilityBonusCoins: result.abilityBonusCoins }
      : {}),
  }
}

function toBestRecord(play: PlayRecord): BestRecord {
  return {
    score: play.score,
    wpm: play.wpm,
    accuracy: play.accuracy,
    maxCombo: play.maxCombo,
    stage: play.stage,
    destroyedTargets: play.destroyedTargets,
    elapsedMs: play.elapsedMs,
    updatedAt: play.playedAt,
    playId: play.id,
  }
}

export function applyPlayResult(
  data: StoredAppData,
  result: GameResultSummary,
  options: ApplyPlayResultOptions,
): StoredAppData {
  const playRecord = createPlayRecordFromResult(result, options)
  const currentBest = data.bestByDifficulty[result.difficulty]
  const nextBest = isBetterBest(playRecord, currentBest)
    ? toBestRecord(playRecord)
    : currentBest

  const recentPlays = [playRecord, ...data.recentPlays].slice(0, options.recentPlaysLimit)

  return {
    ...data,
    settings: {
      ...data.settings,
      lastDifficulty: result.difficulty,
    },
    aggregates: {
      totalPlays: data.aggregates.totalPlays + 1,
      totalTypedChars: data.aggregates.totalTypedChars + result.typedChars,
      bestComboAll: Math.max(data.aggregates.bestComboAll, result.maxCombo),
    },
    bestByDifficulty: {
      ...data.bestByDifficulty,
      [result.difficulty]: nextBest,
    },
    recentPlays,
  }
}
