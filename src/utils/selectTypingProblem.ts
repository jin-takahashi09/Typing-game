import type { DifficultyId } from '../types/app'
import type { TypingProblem } from '../types/typing'
import { typingProblems } from '../data/typingProblems'
import type { DifficultyConfig } from '../config/difficultyConfig'

export interface SelectProblemOptions {
  difficulty: DifficultyId
  config: DifficultyConfig
  lastProblemId?: string | null
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

export function selectTypingProblem(
  options: SelectProblemOptions,
): TypingProblem {
  const { difficulty, config, lastProblemId = null, random = Math.random } = options
  const pool = getProblemsForDifficulty(difficulty).filter((problem) => {
    const length = getRepresentativeRomaji(problem).length
    const inLength = length >= config.minChars && length <= config.maxChars
    const inCategory = config.problemCategories.includes(problem.category)
    return inLength && inCategory
  })

  const usable =
    pool.length > 0 ? pool : getProblemsForDifficulty(difficulty)

  if (usable.length === 0) {
    throw new Error(`No typing problems for difficulty: ${difficulty}`)
  }

  const withoutLast =
    usable.length > 1 && lastProblemId
      ? usable.filter((problem) => problem.id !== lastProblemId)
      : usable

  const index = Math.floor(random() * withoutLast.length)
  return withoutLast[index]!
}
