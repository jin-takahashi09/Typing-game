import type { GameTarget } from '../../types/game'
import type { StageUpCondition } from '../../config/difficultyConfig'
import { simpleInputMatcher } from '../../utils/inputMatcher'

export function findMostDangerousTargetId(
  candidates: GameTarget[],
  yById: ReadonlyMap<string, number>,
): string | null {
  if (candidates.length === 0) {
    return null
  }

  let bestId: string | null = null
  let bestY = Number.NEGATIVE_INFINITY

  for (const target of candidates) {
    const y = yById.get(target.id) ?? target.yPosition
    if (y > bestY) {
      bestY = y
      bestId = target.id
    }
  }

  return bestId
}

export function findLockCandidates(
  targets: GameTarget[],
  char: string,
): GameTarget[] {
  const lower = char.toLowerCase()
  return targets.filter(
    (target) =>
      target.state !== 'destroyed' &&
      target.typedLength === 0 &&
      simpleInputMatcher.matches(target.inputText, 0, lower),
  )
}

export function shouldAdvanceStage(
  destroyedTargets: number,
  condition: StageUpCondition,
  score: number,
): boolean {
  if (condition.type === 'clears') {
    return (
      destroyedTargets > 0 && destroyedTargets % condition.every === 0
    )
  }
  return score > 0 && score % condition.every === 0
}

export function isTypingKey(key: string): boolean {
  return /^[a-zA-Z]$/.test(key)
}
