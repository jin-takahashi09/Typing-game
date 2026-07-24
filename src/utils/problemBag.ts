import type { DifficultyId } from '../types/app'
import type { TypingProblem } from '../types/typing'
import { getProblemsForDifficulty } from './selectTypingProblem'

const DEFAULT_RECENT_LIMIT = 16

function shuffleInPlace<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const tmp = items[i]!
    items[i] = items[j]!
    items[j] = tmp
  }
  return items
}

/**
 * 難易度ごとの問題をシャッフルバッグ方式で出題する。
 * 補充・開始時だけシャッフルし、キー入力ごとの全件フィルターは行わない。
 */
export class ProblemBag {
  private readonly difficulty: DifficultyId
  private readonly random: () => number
  private readonly recentLimit: number
  private bag: TypingProblem[] = []
  private recentIds: string[] = []
  private lastDrawnId: string | null = null

  constructor(
    difficulty: DifficultyId,
    options?: {
      random?: () => number
      recentLimit?: number
    },
  ) {
    this.difficulty = difficulty
    this.random = options?.random ?? Math.random
    this.recentLimit = options?.recentLimit ?? DEFAULT_RECENT_LIMIT
    this.refill()
  }

  private refill(): void {
    const pool = getProblemsForDifficulty(this.difficulty)
    this.bag = shuffleInPlace([...pool], this.random)
  }

  private remember(id: string): void {
    this.lastDrawnId = id
    this.recentIds.push(id)
    if (this.recentIds.length > this.recentLimit) {
      this.recentIds.shift()
    }
  }

  /**
   * @param activeProblemIds 画面上に出現中の問題 ID（destroyed 除く）
   */
  next(activeProblemIds: ReadonlySet<string> = new Set()): TypingProblem {
    const pick = (allowRecent: boolean, allowLast: boolean): TypingProblem | null => {
      if (this.bag.length === 0) {
        this.refill()
      }

      for (let attempt = 0; attempt < this.bag.length; attempt += 1) {
        const candidate = this.bag.shift()!
        const excludedActive = activeProblemIds.has(candidate.id)
        const excludedLast = !allowLast && candidate.id === this.lastDrawnId
        const excludedRecent =
          !allowRecent && this.recentIds.includes(candidate.id)

        if (excludedActive || excludedLast || excludedRecent) {
          this.bag.push(candidate)
          continue
        }

        this.remember(candidate.id)
        return candidate
      }

      return null
    }

    // 1) 直近・連続・出現中を避けて選ぶ
    const preferred = pick(false, false)
    if (preferred) {
      return preferred
    }

    // 2) 直近除外を緩めて選ぶ（一巡後の候補不足）
    const relaxedRecent = pick(true, false)
    if (relaxedRecent) {
      return relaxedRecent
    }

    // 3) 出現中以外なら再利用（最終手段）
    const anyNonActive = pick(true, true)
    if (anyNonActive && !activeProblemIds.has(anyNonActive.id)) {
      return anyNonActive
    }

    // 4) それでも無理ならプール先頭を返す（単一問題など極端なケース）
    const pool = getProblemsForDifficulty(this.difficulty)
    if (pool.length === 0) {
      throw new Error(`No typing problems for difficulty: ${this.difficulty}`)
    }
    const fallback =
      pool.find((problem) => !activeProblemIds.has(problem.id)) ?? pool[0]!
    this.remember(fallback.id)
    return fallback
  }
}

export function createProblemBag(
  difficulty: DifficultyId,
  options?: { random?: () => number; recentLimit?: number },
): ProblemBag {
  return new ProblemBag(difficulty, options)
}
