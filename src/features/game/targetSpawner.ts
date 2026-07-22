import type { DifficultyConfig } from '../../config/difficultyConfig'
import { gameConfig } from '../../config/gameConfig'
import type { BasicTypingProblem } from '../../types/game'
import type { GameTarget } from '../../types/game'

export function canSpawnTarget(
  activeCount: number,
  maxActiveTargets: number,
): boolean {
  return activeCount < maxActiveTargets
}

export function getSpawnIntervalMs(
  config: DifficultyConfig,
  stage: number,
): number {
  const reduced =
    config.spawnIntervalMs - (stage - 1) * 120
  return Math.max(config.minSpawnIntervalMs, reduced)
}

export function getFallSpeed(config: DifficultyConfig, stage: number): number {
  return config.fallSpeed + (stage - 1) * config.fallSpeedPerStage
}

export interface CreateTargetParams {
  problem: BasicTypingProblem
  speed: number
  existingXPercents: number[]
  random?: () => number
  idFactory?: () => string
}

function pickXPercent(
  existingXPercents: number[],
  random: () => number,
): number {
  const padding = gameConfig.spawnSidePaddingPercent
  const min = padding
  const max = 100 - padding
  let best = min + random() * (max - min)
  let bestScore = -Infinity

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = min + random() * (max - min)
    const nearest = existingXPercents.reduce((closest, x) => {
      return Math.min(closest, Math.abs(x - candidate))
    }, Number.POSITIVE_INFINITY)
    const score =
      existingXPercents.length === 0 ? random() : nearest + random() * 0.01
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }

  return Math.round(best * 10) / 10
}

let targetSeq = 0

export function resetTargetIdSequence(): void {
  targetSeq = 0
}

export function createTarget(params: CreateTargetParams): GameTarget {
  const {
    problem,
    speed,
    existingXPercents,
    random = Math.random,
    idFactory = () => {
      targetSeq += 1
      return `target-${targetSeq}`
    },
  } = params

  return {
    id: idFactory(),
    problemId: problem.id,
    displayText: problem.displayText,
    inputText: problem.inputText.toLowerCase(),
    typedLength: 0,
    xPercent: pickXPercent(existingXPercents, random),
    yPosition: gameConfig.spawnYPx,
    speed,
    state: 'falling',
    baseScore: problem.baseScore,
  }
}
