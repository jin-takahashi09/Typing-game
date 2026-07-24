import { describe, expect, it } from 'vitest'
import { createProblemBag } from './problemBag'
import { getProblemsForDifficulty } from './selectTypingProblem'

describe('problemBag', () => {
  it('draws only from the selected difficulty', () => {
    const bag = createProblemBag('trainee', { random: () => 0.3 })
    for (let i = 0; i < 40; i += 1) {
      expect(bag.next().difficulty).toBe('trainee')
    }
  })

  it('does not draw the same problem consecutively when alternatives exist', () => {
    const bag = createProblemBag('ninja', { random: () => 0.11 })
    let previous: string | null = null
    for (let i = 0; i < 80; i += 1) {
      const next = bag.next()
      expect(next.id).not.toBe(previous)
      previous = next.id
    }
  })

  it('avoids active on-screen problem ids', () => {
    const bag = createProblemBag('master', { random: () => 0.2 })
    const first = bag.next()
    const second = bag.next(new Set([first.id]))
    expect(second.id).not.toBe(first.id)
  })

  it('does not reuse before one full pass when the pool is large', () => {
    const pool = getProblemsForDifficulty('trainee')
    const bag = createProblemBag('trainee', {
      random: () => 0.37,
      recentLimit: pool.length,
    })
    const seen = new Set<string>()
    for (let i = 0; i < pool.length; i += 1) {
      const next = bag.next()
      expect(seen.has(next.id)).toBe(false)
      seen.add(next.id)
    }
    expect(seen.size).toBe(pool.length)
  })
})
