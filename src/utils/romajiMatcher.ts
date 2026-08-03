import type {
  RomajiMatchResult,
  RomajiMatchState,
  RomajiPath,
  TypingProblem,
} from '../types/typing'
import type { MoraNode } from './romajiRules'
import {
  buildMoraNodes,
  getFirstInputChars,
  isCompleteMora,
  isValidPrefix,
  mergePatternOptions,
  parseReadingToMorae,
} from './romajiRules'

const moraCache = new Map<string, MoraNode[]>()

function cacheKey(problem: TypingProblem): string {
  return `${problem.id}:${problem.romajiPatterns.join('|')}`
}

export function getMoraNodesForProblem(problem: TypingProblem): MoraNode[] {
  const key = cacheKey(problem)
  const cached = moraCache.get(key)
  if (cached) {
    return cached
  }

  const displayRomaji = problem.romajiPatterns[0]?.toLowerCase() ?? ''
  const morae = parseReadingToMorae(problem.reading)
  const nodes = mergePatternOptions(
    buildMoraNodes(morae, displayRomaji),
    problem.romajiPatterns.map((pattern) => pattern.toLowerCase()),
  )
  moraCache.set(key, nodes)
  return nodes
}

export function createRomajiMatchState(): RomajiMatchState {
  return {
    confirmedLength: 0,
    activePaths: [{ moraIndex: 0, partial: '' }],
    isComplete: false,
    typedPrefix: '',
  }
}

/**
 * 寿司打方式の表示ローマ字。
 * 複数候補が残る間は代表（patterns[0]）、1つに確定したらその候補。
 */
export function resolveActiveRomajiDisplay(
  patterns: readonly string[],
  typedPrefix: string,
): string {
  const normalized = patterns
    .map((pattern) => pattern.toLowerCase())
    .filter((pattern) => pattern.length > 0)
  const representative = normalized[0] ?? ''
  const prefix =
    typeof typedPrefix === 'string' ? typedPrefix.toLowerCase() : ''

  if (!representative) {
    return ''
  }
  if (!prefix) {
    return representative
  }

  const compatible = normalized.filter((pattern) => pattern.startsWith(prefix))
  if (compatible.length === 1) {
    return compatible[0]!
  }
  if (compatible.length === 0) {
    return representative
  }
  if (compatible.includes(representative)) {
    return representative
  }
  return compatible[0]!
}

/** 表示文字列と入力済み文字数（色分け用） */
export function getActiveRomajiView(
  patterns: readonly string[],
  state: Pick<RomajiMatchState, 'typedPrefix' | 'isComplete'>,
): { displayRomaji: string; typedLength: number } {
  const prefix =
    typeof state.typedPrefix === 'string' ? state.typedPrefix.toLowerCase() : ''
  const displayRomaji = resolveActiveRomajiDisplay(patterns, prefix)
  const typedLength = state.isComplete
    ? displayRomaji.length
    : Math.min(prefix.length, displayRomaji.length)
  return { displayRomaji, typedLength }
}

function dedupePaths(paths: RomajiPath[]): RomajiPath[] {
  const seen = new Set<string>()
  const result: RomajiPath[] = []

  for (const path of paths) {
    const key = `${path.moraIndex}:${path.partial}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(path)
  }

  return result
}

export function processRomajiInput(
  state: RomajiMatchState,
  problem: TypingProblem,
  char: string,
): RomajiMatchResult {
  if (state.isComplete) {
    return {
      accepted: false,
      isComplete: true,
      nextConfirmedLength: state.confirmedLength,
      nextState: state,
    }
  }

  const lower = char.toLowerCase()
  const nodes = getMoraNodesForProblem(problem)
  const nextPaths: RomajiPath[] = []

  for (const path of state.activePaths) {
    if (path.moraIndex >= nodes.length) {
      continue
    }

    const node = nodes[path.moraIndex]!
    const nextPartial = path.partial + lower

    if (!isValidPrefix(node.options, nextPartial)) {
      continue
    }

    const completes = isCompleteMora(node.options, nextPartial)
    const canContinue = node.options.some(
      (option) =>
        option.startsWith(nextPartial) && option.length > nextPartial.length,
    )

    // 「ん」の n / nn のように、完成と継続が同時に成立する分岐を両方残す
    if (completes) {
      nextPaths.push({
        moraIndex: path.moraIndex + 1,
        partial: '',
      })
    }
    if (canContinue) {
      nextPaths.push({
        moraIndex: path.moraIndex,
        partial: nextPartial,
      })
    }
  }

  if (nextPaths.length === 0) {
    return {
      accepted: false,
      isComplete: false,
      nextConfirmedLength: state.confirmedLength,
      nextState: state,
    }
  }

  const typedPrefix = `${state.typedPrefix ?? ''}${lower}`
  const activePaths = dedupePaths(nextPaths)
  const finishedPaths = activePaths.filter(
    (path) => path.moraIndex >= nodes.length,
  )
  // いずれかの候補が語末に達したら完了（んの n/nn 分岐で未完了パスが残ってもよい）
  const isComplete = finishedPaths.length > 0
  const resolvedPaths = isComplete ? finishedPaths : activePaths
  const activeDisplay = resolveActiveRomajiDisplay(
    problem.romajiPatterns,
    typedPrefix,
  )
  const nextConfirmedLength = isComplete
    ? activeDisplay.length
    : Math.min(typedPrefix.length, activeDisplay.length || typedPrefix.length)

  const nextState: RomajiMatchState = {
    confirmedLength: nextConfirmedLength,
    activePaths: resolvedPaths,
    isComplete,
    typedPrefix,
  }

  return {
    accepted: true,
    isComplete,
    nextConfirmedLength,
    nextState,
  }
}

export function getLockOnFirstChars(problem: TypingProblem): string[] {
  const nodes = getMoraNodesForProblem(problem)
  if (nodes.length === 0) {
    return []
  }

  const firstNode = nodes[0]!
  const fromNode = getFirstInputChars(firstNode.options)
  const fromPatterns = problem.romajiPatterns
    .map((pattern) => pattern[0]?.toLowerCase())
    .filter((char): char is string => Boolean(char))

  return [...new Set([...fromNode, ...fromPatterns])]
}

export function matchesFirstChar(problem: TypingProblem, char: string): boolean {
  return getLockOnFirstChars(problem).includes(char.toLowerCase())
}

export function clearMoraCacheForTests(): void {
  moraCache.clear()
}
