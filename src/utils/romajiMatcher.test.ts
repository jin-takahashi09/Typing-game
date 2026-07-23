import { describe, expect, it } from 'vitest'
import {
  createRomajiMatchState,
  processRomajiInput,
} from './romajiMatcher'
import { typingProblems } from '../data/typingProblems'
import type { TypingProblem } from '../types/typing'

function makeProblem(overrides: Partial<TypingProblem> = {}): TypingProblem {
  return {
    id: 'test',
    displayText: 'やま',
    reading: 'やま',
    romajiPatterns: ['yama'],
    difficulty: 'trainee',
    category: 'basic',
    baseScore: 80,
    ...overrides,
  }
}

function typeWord(problem: TypingProblem, word: string) {
  let state = createRomajiMatchState()
  for (const char of word) {
    const result = processRomajiInput(state, problem, char)
    if (!result.accepted) {
      return { ok: false as const, state, char, word }
    }
    state = result.nextState
  }
  return { ok: true as const, state, word }
}

describe('romajiMatcher', () => {
  it('accepts a single-pattern word sequentially', () => {
    const problem = makeProblem()
    const typed = typeWord(problem, 'yama')
    expect(typed.ok).toBe(true)
    expect(typed.state.isComplete).toBe(true)
    expect(typed.state.confirmedLength).toBe(4)
  })

  it('accepts shinobi and sinobi variants', () => {
    const problem = makeProblem({
      displayText: 'しのび',
      reading: 'しのび',
      romajiPatterns: ['shinobi', 'sinobi'],
    })

    expect(typeWord(problem, 'shinobi').ok).toBe(true)
    expect(typeWord(problem, 'sinobi').ok).toBe(true)
  })

  it('accepts shi and si while typing shinobi', () => {
    const problem = makeProblem({
      displayText: 'しのび',
      reading: 'しのび',
      romajiPatterns: ['shinobi', 'sinobi'],
    })

    let state = createRomajiMatchState()
    for (const char of 'si') {
      const result = processRomajiInput(state, problem, char)
      expect(result.accepted).toBe(true)
      state = result.nextState
    }
    expect(state.isComplete).toBe(false)
  })

  it('accepts chi and ti variants', () => {
    const problem = makeProblem({
      displayText: 'ちず',
      reading: 'ちず',
      romajiPatterns: ['chizu', 'tizu'],
    })
    expect(typeWord(problem, 'chizu').ok).toBe(true)
    expect(typeWord(problem, 'tizu').ok).toBe(true)
  })

  it('accepts tsu and tu variants', () => {
    const problem = makeProblem({
      displayText: 'つき',
      reading: 'つき',
      romajiPatterns: ['tsuki', 'tuki'],
    })
    expect(typeWord(problem, 'tsuki').ok).toBe(true)
    expect(typeWord(problem, 'tuki').ok).toBe(true)
  })

  it('accepts yoon input', () => {
    const problem = makeProblem({
      displayText: 'しゃしん',
      reading: 'しゃしん',
      romajiPatterns: ['shashin', 'syashin'],
    })
    expect(typeWord(problem, 'shashin').ok).toBe(true)
    expect(typeWord(problem, 'syashin').ok).toBe(true)
  })

  it('accepts small tsu as doubled consonant', () => {
    const problem = makeProblem({
      displayText: 'がっこう',
      reading: 'がっこう',
      romajiPatterns: ['gakkou', 'gakko'],
    })
    expect(typeWord(problem, 'gakkou').ok).toBe(true)
  })

  it('accepts basic n input', () => {
    const problem = makeProblem({
      displayText: 'せんせい',
      reading: 'せんせい',
      romajiPatterns: ['sensei'],
    })
    expect(typeWord(problem, 'sensei').ok).toBe(true)
  })

  it('rejects invalid characters and keeps state', () => {
    const problem = makeProblem()
    let state = createRomajiMatchState()
    const first = processRomajiInput(state, problem, 'y')
    state = first.nextState
    const rejected = processRomajiInput(state, problem, 'z')
    expect(rejected.accepted).toBe(false)
    expect(rejected.nextState).toEqual(state)
  })

  it('does not accept input after completion', () => {
    const problem = makeProblem()
    const typed = typeWord(problem, 'yama')
    expect(typed.ok).toBe(true)
    const after = processRomajiInput(typed.state, problem, 'a')
    expect(after.accepted).toBe(false)
  })

  it('marks completion when the final character is entered', () => {
    const problem = makeProblem()
    let state = createRomajiMatchState()
    for (const char of 'yam') {
      state = processRomajiInput(state, problem, char).nextState
    }
    const last = processRomajiInput(state, problem, 'a')
    expect(last.accepted).toBe(true)
    expect(last.isComplete).toBe(true)
  })

  it('accepts long vowel mark as previous vowel', () => {
    const ramen = makeProblem({
      id: 'choon-ramen',
      displayText: 'らーめん',
      reading: 'らーめん',
      romajiPatterns: ['ramen'],
    })
    const geemu = makeProblem({
      id: 'choon-geemu',
      displayText: 'ゲーム',
      reading: 'げーむ',
      romajiPatterns: ['geemu'],
    })
    const koohii = makeProblem({
      id: 'choon-koohii',
      displayText: 'コーヒー',
      reading: 'こーひー',
      romajiPatterns: ['koohii'],
    })

    const ramenTyped = typeWord(ramen, 'ramen')
    expect(ramenTyped.ok).toBe(true)
    expect(ramenTyped.state.isComplete).toBe(true)

    const raamenTyped = typeWord(ramen, 'raamen')
    expect(raamenTyped.ok).toBe(true)
    expect(raamenTyped.state.isComplete).toBe(true)

    const geemuTyped = typeWord(geemu, 'geemu')
    expect(geemuTyped.ok).toBe(true)
    expect(geemuTyped.state.isComplete).toBe(true)

    const koohiiTyped = typeWord(koohii, 'koohii')
    expect(koohiiTyped.ok).toBe(true)
    expect(koohiiTyped.state.isComplete).toBe(true)
  })

  it('completes every representative romaji pattern in the problem bank', () => {
    const failures: string[] = []
    for (const problem of typingProblems) {
      const representative = problem.romajiPatterns[0]?.toLowerCase()
      expect(representative).toBeTruthy()
      const typed = typeWord(problem, representative!)
      if (!typed.ok || !typed.state.isComplete) {
        failures.push(
          `${problem.id}:${representative}${typed.ok ? '' : `@${typed.char}`}`,
        )
      }
    }
    expect(failures).toEqual([])
  })
})
