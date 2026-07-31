import type { CharacterAbility } from '../config/characters'

function assertNever(value: never): never {
  throw new Error(`Unhandled character ability: ${JSON.stringify(value)}`)
}

export interface ScoreAbilityResult {
  baseScore: number
  finalScore: number
  bonusScore: number
}

export interface DamageAbilityResult {
  baseDamage: number
  finalDamage: number
  reducedBy: number
}

export interface StageCoinAbilityResult {
  baseCoins: number
  finalCoins: number
  bonusCoins: number
}

function sanitizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }
  return Math.floor(value)
}

/** 紅蓮：獲得スコアに倍率を適用（二重適用しない前提で1回だけ） */
export function applyScoreAbility(
  baseScore: number,
  ability: CharacterAbility,
): ScoreAbilityResult {
  const safeBase = sanitizeNonNegativeInt(baseScore)

  switch (ability.type) {
    case 'scoreMultiplier': {
      const multiplier =
        Number.isFinite(ability.value) && ability.value > 0 ? ability.value : 1
      const finalScore = Math.floor(safeBase * multiplier)
      return {
        baseScore: safeBase,
        finalScore,
        bonusScore: Math.max(0, finalScore - safeBase),
      }
    }
    case 'none':
    case 'damageReduction':
    case 'stageCoinMultiplier':
      return { baseScore: safeBase, finalScore: safeBase, bonusScore: 0 }
    default:
      return assertNever(ability)
  }
}

/** 蒼影：防衛壁ダメージを軽減（最低1） */
export function applyDamageAbility(
  baseDamage: number,
  ability: CharacterAbility,
): DamageAbilityResult {
  const safeBase = sanitizeNonNegativeInt(baseDamage)

  switch (ability.type) {
    case 'damageReduction': {
      if (safeBase <= 0) {
        return { baseDamage: 0, finalDamage: 0, reducedBy: 0 }
      }
      const reduction =
        Number.isFinite(ability.value) && ability.value > 0
          ? Math.min(0.95, ability.value)
          : 0
      const finalDamage = Math.max(1, Math.ceil(safeBase * (1 - reduction)))
      return {
        baseDamage: safeBase,
        finalDamage,
        reducedBy: Math.max(0, safeBase - finalDamage),
      }
    }
    case 'none':
    case 'scoreMultiplier':
    case 'stageCoinMultiplier':
      return {
        baseDamage: safeBase,
        finalDamage: safeBase,
        reducedBy: 0,
      }
    default:
      return assertNever(ability)
  }
}

/** 黄金：撃破マイルストーンコインのみ倍率（成績ボーナスには使わない） */
export function applyStageCoinAbility(
  baseCoins: number,
  ability: CharacterAbility,
): StageCoinAbilityResult {
  const safeBase = sanitizeNonNegativeInt(baseCoins)

  switch (ability.type) {
    case 'stageCoinMultiplier': {
      const multiplier =
        Number.isFinite(ability.value) && ability.value > 0 ? ability.value : 1
      const finalCoins = Math.floor(safeBase * multiplier)
      return {
        baseCoins: safeBase,
        finalCoins,
        bonusCoins: Math.max(0, finalCoins - safeBase),
      }
    }
    case 'none':
    case 'scoreMultiplier':
    case 'damageReduction':
      return { baseCoins: safeBase, finalCoins: safeBase, bonusCoins: 0 }
    default:
      return assertNever(ability)
  }
}
