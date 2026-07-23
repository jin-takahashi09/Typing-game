import { describe, expect, it } from 'vitest'
import { typingProblems } from './typingProblems'
import { getProblemsForDifficulty } from '../utils/selectTypingProblem'
import {
  createRomajiMatchState,
  processRomajiInput,
} from '../utils/romajiMatcher'
import type { TypingProblem } from '../types/typing'

const ENGLISH_ONLY_PATTERN = /^[a-zA-Z\s-]+$/
const KANA_PATTERN = /^[\u3040-\u309F\u30A0-\u30FFー]+$/

function typeWord(problem: TypingProblem, word: string) {
  let state = createRomajiMatchState()
  for (const char of word) {
    const result = processRomajiInput(state, problem, char)
    if (!result.accepted) {
      return { ok: false as const, char }
    }
    state = result.nextState
  }
  return { ok: true as const, state }
}

describe('typingProblems integrity', () => {
  it('has unique ids', () => {
    const ids = typingProblems.map((problem) => problem.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rejects empty fields and english-only display', () => {
    for (const problem of typingProblems) {
      expect(problem.displayText.trim().length).toBeGreaterThan(0)
      expect(problem.reading.trim().length).toBeGreaterThan(0)
      expect(problem.romajiPatterns.length).toBeGreaterThan(0)
      expect(problem.displayText).not.toMatch(ENGLISH_ONLY_PATTERN)
      for (const pattern of problem.romajiPatterns) {
        expect(pattern.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('uses kana-only readings', () => {
    for (const problem of typingProblems) {
      expect(problem.reading).toMatch(KANA_PATTERN)
    }
  })

  it('keeps at least 15 problems per difficulty', () => {
    expect(getProblemsForDifficulty('trainee').length).toBeGreaterThanOrEqual(15)
    expect(getProblemsForDifficulty('ninja').length).toBeGreaterThanOrEqual(15)
    expect(getProblemsForDifficulty('master').length).toBeGreaterThanOrEqual(15)
  })

  it('has no exact duplicates within a difficulty', () => {
    for (const difficulty of ['trainee', 'ninja', 'master'] as const) {
      const pool = getProblemsForDifficulty(difficulty)
      const keys = pool.map(
        (problem) =>
          `${problem.displayText}|${problem.reading}|${problem.romajiPatterns[0]}`,
      )
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('completes every romaji candidate with the matcher', () => {
    const failures: string[] = []
    for (const problem of typingProblems) {
      for (const pattern of problem.romajiPatterns) {
        const typed = typeWord(problem, pattern.toLowerCase())
        if (!typed.ok || !typed.state.isComplete) {
          failures.push(
            `${problem.id}:${pattern}${typed.ok ? '' : `@${typed.char}`}`,
          )
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps choon mark in reading when display uses it', () => {
    for (const problem of typingProblems) {
      if (problem.displayText.includes('ー')) {
        expect(
          problem.reading.includes('ー'),
          `${problem.id}: display has ー but reading omits it`,
        ).toBe(true)
      }
    }
  })

  it('completes readings that include choon marks', () => {
    const withChoon = typingProblems.filter((problem) =>
      problem.reading.includes('ー'),
    )
    expect(withChoon.length).toBeGreaterThan(0)
    for (const problem of withChoon) {
      const representative = problem.romajiPatterns[0]!.toLowerCase()
      const typed = typeWord(problem, representative)
      expect(typed.ok && typed.state.isComplete, problem.id).toBe(true)
      expect(representative.length).toBeGreaterThan(0)
    }
  })
})
