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

  it('has unique displayText across the whole bank', () => {
    const texts = typingProblems.map((problem) => problem.displayText)
    expect(new Set(texts).size).toBe(texts.length)
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

  it('keeps at least 200 problems per difficulty and 600 total', () => {
    const trainee = getProblemsForDifficulty('trainee')
    const ninja = getProblemsForDifficulty('ninja')
    const master = getProblemsForDifficulty('master')
    expect(trainee.length).toBeGreaterThanOrEqual(200)
    expect(ninja.length).toBeGreaterThanOrEqual(200)
    expect(master.length).toBeGreaterThanOrEqual(200)
    expect(typingProblems.length).toBeGreaterThanOrEqual(600)
  })

  it('assigns the correct difficulty field', () => {
    for (const difficulty of ['trainee', 'ninja', 'master'] as const) {
      for (const problem of getProblemsForDifficulty(difficulty)) {
        expect(problem.difficulty).toBe(difficulty)
      }
    }
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

  it('requires hyphen for choon readings and rejects omit-style ramen', () => {
    const ramen = typingProblems.find(
      (problem) =>
        problem.displayText === 'ラーメン' || problem.reading === 'らーめん',
    )
    expect(ramen).toBeTruthy()
    const withHyphen = typeWord(ramen!, 'ra-men')
    expect(withHyphen.ok && withHyphen.state.isComplete).toBe(true)
    const withoutHyphen = typeWord(ramen!, 'ramen')
    expect(withoutHyphen.ok && withoutHyphen.state.isComplete).toBe(false)

    const withChoon = typingProblems.filter((problem) =>
      problem.reading.includes('ー'),
    )
    expect(withChoon.length).toBeGreaterThan(0)
    for (const problem of withChoon) {
      const representative = problem.romajiPatterns[0]!.toLowerCase()
      expect(
        representative.includes('-'),
        `${problem.id} should use hyphen for choon`,
      ).toBe(true)
      const typed = typeWord(problem, representative)
      expect(typed.ok && typed.state.isComplete, problem.id).toBe(true)
    }
  })
})
