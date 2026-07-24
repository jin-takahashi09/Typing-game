import type {
  RomajiMatchResult,
  RomajiMatchState,
  RomajiPath,
  TypingProblem,
} from '../types/typing'
import type { MoraNode } from './romajiRules'
import {
  buildMoraNodes,
  computeDisplayProgress,
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
  }
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

function computeConfirmedLength(
  nodes: MoraNode[],
  paths: RomajiPath[],
): number {
  if (paths.length === 0) {
    return 0
  }

  const minMoraIndex = Math.min(...paths.map((path) => path.moraIndex))
  const pathsAtMin = paths.filter((path) => path.moraIndex === minMoraIndex)
  const longestPartial = pathsAtMin.reduce(
    (max, path) => Math.max(max, path.partial.length),
    0,
  )
  const partial = pathsAtMin.find((path) => path.partial.length === longestPartial)?.partial ?? ''

  return computeDisplayProgress(nodes, minMoraIndex, partial)
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

  const activePaths = dedupePaths(nextPaths)
  const finishedPaths = activePaths.filter(
    (path) => path.moraIndex >= nodes.length,
  )
  // いずれかの候補が語末に達したら完了（んの n/nn 分岐で未完了パスが残ってもよい）
  const isComplete = finishedPaths.length > 0
  const resolvedPaths = isComplete ? finishedPaths : activePaths
  const nextConfirmedLength = isComplete
    ? problem.romajiPatterns[0]?.length ?? 0
    : computeConfirmedLength(nodes, resolvedPaths)

  const nextState: RomajiMatchState = {
    confirmedLength: nextConfirmedLength,
    activePaths: resolvedPaths,
    isComplete,
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
