import { describe, expect, it } from 'vitest'
import type { CharacterAbility } from '../config/characters'
import {
  applyDamageAbility,
  applyScoreAbility,
  applyStageCoinAbility,
} from './characterAbilities'

const none: CharacterAbility = {
  type: 'none',
  name: '基礎修行',
  description: 'なし',
}
const crimson: CharacterAbility = {
  type: 'scoreMultiplier',
  name: '紅蓮の連撃',
  description: '+10%',
  value: 1.1,
}
const azure: CharacterAbility = {
  type: 'damageReduction',
  name: '蒼影の守り',
  description: '-20%',
  value: 0.2,
}
const gold: CharacterAbility = {
  type: 'stageCoinMultiplier',
  name: '黄金の褒賞',
  description: '+20%',
  value: 1.2,
}

describe('characterAbilities — 見習い', () => {
  it('does not change score, damage, or stage coins', () => {
    expect(applyScoreAbility(100, none)).toEqual({
      baseScore: 100,
      finalScore: 100,
      bonusScore: 0,
    })
    expect(applyDamageAbility(10, none)).toEqual({
      baseDamage: 10,
      finalDamage: 10,
      reducedBy: 0,
    })
    expect(applyStageCoinAbility(10, none)).toEqual({
      baseCoins: 10,
      finalCoins: 10,
      bonusCoins: 0,
    })
  })
})

describe('characterAbilities — 紅蓮', () => {
  it('multiplies score by 1.1 with floor', () => {
    expect(applyScoreAbility(100, crimson).finalScore).toBe(110)
    expect(applyScoreAbility(101, crimson).finalScore).toBe(111)
    expect(applyScoreAbility(100, crimson).bonusScore).toBe(10)
  })

  it('does not stack when called once per gain', () => {
    const once = applyScoreAbility(100, crimson)
    const again = applyScoreAbility(once.finalScore, none)
    expect(again.finalScore).toBe(110)
  })

  it('ignores score ability for damage and coins', () => {
    expect(applyDamageAbility(10, crimson).finalDamage).toBe(10)
    expect(applyStageCoinAbility(10, crimson).finalCoins).toBe(10)
  })
})

describe('characterAbilities — 蒼影', () => {
  it('reduces 10 damage to 8', () => {
    const result = applyDamageAbility(10, azure)
    expect(result.finalDamage).toBe(8)
    expect(result.reducedBy).toBe(2)
  })

  it('keeps minimum damage at 1', () => {
    expect(applyDamageAbility(1, azure).finalDamage).toBe(1)
  })

  it('does not apply twice when using already-reduced value with none', () => {
    const once = applyDamageAbility(10, azure)
    const again = applyDamageAbility(once.finalDamage, none)
    expect(again.finalDamage).toBe(8)
  })
})

describe('characterAbilities — 黄金', () => {
  it('boosts stage coins with floor', () => {
    expect(applyStageCoinAbility(10, gold)).toEqual({
      baseCoins: 10,
      finalCoins: 12,
      bonusCoins: 2,
    })
    expect(applyStageCoinAbility(15, gold).finalCoins).toBe(18)
  })

  it('does not affect score ability path or result-bonus-like raw scores', () => {
    expect(applyScoreAbility(1000, gold).finalScore).toBe(1000)
  })
})

describe('characterAbilities — safety', () => {
  it('sanitizes negative and non-finite inputs', () => {
    expect(applyScoreAbility(-5, crimson).finalScore).toBe(0)
    expect(applyDamageAbility(Number.NaN, azure).finalDamage).toBe(0)
    expect(applyStageCoinAbility(-3, gold).finalCoins).toBe(0)
  })
})
