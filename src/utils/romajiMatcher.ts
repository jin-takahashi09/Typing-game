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

    if (isValidPrefix(node.options, nextPartial)) {
      if (isCompleteMora(node.options, nextPartial)) {
        nextPaths.push({
          moraIndex: path.moraIndex + 1,
          partial: '',
        })
      } else {
        nextPaths.push({
          moraIndex: path.moraIndex,
          partial: nextPartial,
        })
      }
    }

    // 長音は直前母音でも入力できるが、代表ローマ字では省略されることがある
    // （らーめん → ramen）。未入力の「ー」は次モーラへスキップを許可する。
    if (
      node.kana === 'ー' &&
      path.partial === '' &&
      path.moraIndex + 1 < nodes.length
    ) {
      const nextNode = nodes[path.moraIndex + 1]!
      if (isValidPrefix(nextNode.options, lower)) {
        if (isCompleteMora(nextNode.options, lower)) {
          nextPaths.push({
            moraIndex: path.moraIndex + 2,
            partial: '',
          })
        } else {
          nextPaths.push({
            moraIndex: path.moraIndex + 1,
            partial: lower,
          })
        }
      }
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
  const isComplete = activePaths.every((path) => path.moraIndex >= nodes.length)
  const nextConfirmedLength = isComplete
    ? problem.romajiPatterns[0]?.length ?? 0
    : computeConfirmedLength(nodes, activePaths)

  const nextState: RomajiMatchState = {
    confirmedLength: nextConfirmedLength,
    activePaths,
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
