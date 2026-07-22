import type { GameTarget } from '../../types/game'
import type { TargetMotion } from '../../hooks/useGameLoop'

/** 画面下部到達処理の対象を絞り込む（撃破済み・削除済みを除外） */
export function filterBottomReachTargetIds(
  targetIds: string[],
  activeTargets: GameTarget[],
  targetsRef: ReadonlyMap<string, TargetMotion>,
): string[] {
  const seen = new Set<string>()
  const filtered: string[] = []

  for (const id of targetIds) {
    if (seen.has(id)) {
      continue
    }
    seen.add(id)

    const target = activeTargets.find((item) => item.id === id)
    if (!target || target.state === 'destroyed') {
      continue
    }
    if (!targetsRef.has(id)) {
      continue
    }

    filtered.push(id)
  }

  return filtered
}

/** 同一フレーム内の複数到達で、防衛壁0以降のダメージを抑止する */
export function applySequentialBottomDamage(
  initialDefense: number,
  targetIds: string[],
  damagePerTarget: number,
): { remainingDefense: number; appliedTargetIds: string[] } {
  let remainingDefense = initialDefense
  const appliedTargetIds: string[] = []

  for (const id of targetIds) {
    if (remainingDefense <= 0) {
      break
    }
    remainingDefense = Math.max(0, remainingDefense - damagePerTarget)
    appliedTargetIds.push(id)
  }

  return { remainingDefense, appliedTargetIds }
}
