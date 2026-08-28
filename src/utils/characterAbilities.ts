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

/** 紅蓮など：獲得スコアに倍率を適用（二重適用しない前提で1回だけ） */
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
    case 'stageCoinMultiplier':
    case 'timeBonusSeconds':
    case 'comboMultiplierBonus':
      return { baseScore: safeBase, finalScore: safeBase, bonusScore: 0 }
    default:
      return assertNever(ability)
  }
}

/**
 * 被弾ダメージ（HP UI 廃止後も内部ヒット処理用）。
 * 能力による軽減は行わない。
 */
export function applyDamageAbility(
  baseDamage: number,
  ability: CharacterAbility,
): DamageAbilityResult {
  void ability
  const safeBase = sanitizeNonNegativeInt(baseDamage)
  return {
    baseDamage: safeBase,
    finalDamage: safeBase,
    reducedBy: 0,
  }
}

/** 黄金など：撃破マイルストーンコインのみ倍率 */
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
    case 'timeBonusSeconds':
    case 'comboMultiplierBonus':
      return { baseCoins: safeBase, finalCoins: safeBase, bonusCoins: 0 }
    default:
      return assertNever(ability)
  }
}

/** 月光・風神：制限時間への加算秒数 */
export function getTimeBonusSeconds(ability: CharacterAbility): number {
  if (ability.type !== 'timeBonusSeconds') {
    return 0
  }
  if (!Number.isFinite(ability.value) || ability.value <= 0) {
    return 0
  }
  return Math.floor(ability.value)
}

/** 暁影・鬼面：コンボ倍率への加算 */
export function applyComboMultiplierBonus(
  baseComboMultiplier: number,
  ability: CharacterAbility,
): number {
  const safeBase =
    Number.isFinite(baseComboMultiplier) && baseComboMultiplier > 0
      ? baseComboMultiplier
      : 0
  if (ability.type !== 'comboMultiplierBonus') {
    return safeBase
  }
  const bonus =
    Number.isFinite(ability.value) && ability.value > 0 ? ability.value : 0
  return safeBase + bonus
}
