import { describe, expect, it } from 'vitest'
import {
  applySequentialBottomDamage,
  filterBottomReachTargetIds,
} from './bottomReachLogic'
import type { GameTarget } from '../../types/game'

function target(id: string, state: GameTarget['state'] = 'falling'): GameTarget {
  return {
    id,
    problemId: 'p',
    displayText: 'test',
    inputText: 'test',
    typedLength: 0,
    xPercent: 50,
    yPosition: -50,
    speed: 1,
    state,
    baseScore: 100,
  }
}

describe('bottomReachLogic', () => {
  it('filters destroyed and missing ref targets', () => {
    const active = [target('a'), target('b', 'destroyed'), target('c')]
    const ref = new Map([
      ['a', { y: 100, speed: 1 }],
      ['c', { y: 100, speed: 1 }],
    ])

    expect(
      filterBottomReachTargetIds(['a', 'b', 'c', 'a', 'missing'], active, ref),
    ).toEqual(['a', 'c'])
  })

  it('stops applying damage once defense reaches zero', () => {
    const result = applySequentialBottomDamage(10, ['t1', 't2', 't3'], 6)
    expect(result.appliedTargetIds).toEqual(['t1', 't2'])
    expect(result.remainingDefense).toBe(0)
  })

  it('applies damage to all targets when defense allows', () => {
    const result = applySequentialBottomDamage(100, ['t1', 't2'], 6)
    expect(result.appliedTargetIds).toEqual(['t1', 't2'])
    expect(result.remainingDefense).toBe(88)
  })
})
