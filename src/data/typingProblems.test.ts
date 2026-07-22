import { describe, expect, it } from 'vitest'
import { typingProblems } from '../data/typingProblems'
import { getProblemsForDifficulty } from '../utils/selectTypingProblem'

const ENGLISH_ONLY_PATTERN = /^[a-zA-Z\s-]+$/

describe('typingProblems data', () => {
  it('does not include english-only display problems', () => {
    for (const problem of typingProblems) {
      expect(problem.displayText).not.toMatch(ENGLISH_ONLY_PATTERN)
    }
  })

  it('includes japanese display, reading, and romaji patterns for every problem', () => {
    for (const problem of typingProblems) {
      expect(problem.displayText.trim().length).toBeGreaterThan(0)
      expect(problem.reading.trim().length).toBeGreaterThan(0)
      expect(problem.romajiPatterns.length).toBeGreaterThan(0)
      expect(problem.romajiPatterns[0]?.length).toBeGreaterThan(0)
    }
  })

  it('keeps at least 15 problems per difficulty', () => {
    expect(getProblemsForDifficulty('trainee').length).toBeGreaterThanOrEqual(15)
    expect(getProblemsForDifficulty('ninja').length).toBeGreaterThanOrEqual(15)
    expect(getProblemsForDifficulty('master').length).toBeGreaterThanOrEqual(15)
  })
})
