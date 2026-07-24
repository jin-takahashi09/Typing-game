import type { DifficultyId } from '../types/app'
import type { TypingProblem } from '../types/typing'
import { typingProblems } from '../data/typingProblems'
import type { DifficultyConfig } from '../config/difficultyConfig'

export interface SelectProblemOptions {
  difficulty: DifficultyId
  config: DifficultyConfig
  lastProblemId?: string | null
  /** 出現中の問題 ID（同じ問題の同時出現を避ける） */
  activeProblemIds?: ReadonlySet<string>
  /** 乱数は呼び出し側から注入し、reducer 外で決定する */
  random?: () => number
}

export function getProblemsForDifficulty(
  difficulty: DifficultyId,
): TypingProblem[] {
  return typingProblems.filter((problem) => problem.difficulty === difficulty)
}

export function getRepresentativeRomaji(problem: TypingProblem): string {
  return problem.romajiPatterns[0]?.toLowerCase() ?? ''
}

/**
 * 単発抽選（テスト用・後方互換）。
 * ゲーム本編は ProblemBag（シャッフルバッグ）を使用する。
 */
export function selectTypingProblem(
  options: SelectProblemOptions,
): TypingProblem {
  const {
    difficulty,
    lastProblemId = null,
    activeProblemIds,
    random = Math.random,
  } = options
  const usable = getProblemsForDifficulty(difficulty)

  if (usable.length === 0) {
    throw new Error(`No typing problems for difficulty: ${difficulty}`)
  }

  let candidates = usable
  if (activeProblemIds && activeProblemIds.size > 0) {
    const filtered = usable.filter((problem) => !activeProblemIds.has(problem.id))
    if (filtered.length > 0) {
      candidates = filtered
    }
  }

  const withoutLast =
    candidates.length > 1 && lastProblemId
      ? candidates.filter((problem) => problem.id !== lastProblemId)
      : candidates

  const index = Math.floor(random() * withoutLast.length)
  return withoutLast[index]!
}
