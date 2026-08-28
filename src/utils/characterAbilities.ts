import type { CharacterAbility } from '../config/characterTypes'
import {
  NEUTRAL_PLAY_MODIFIERS,
  resolvePlayAbilityModifiers,
} from './playAbilityModifiers'

function assertNever(value: never): never {
  throw new Error(`Unhandled character ability: ${JSON.stringify(value)}`)
}

function sanitizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }
  return Math.floor(value)
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

/** 紅蓮など：獲得スコアに倍率を適用（二重適用しない前提で1回だけ） */
export function applyScoreAbility(
  baseScore: number,
  ability: CharacterAbility,
): ScoreAbilityResult {
  const safeBase = sanitizeNonNegativeInt(baseScore)
  const { scoreMultiplier } = resolvePlayAbilityModifiers(ability)

  if (scoreMultiplier === NEUTRAL_PLAY_MODIFIERS.scoreMultiplier) {
    return { baseScore: safeBase, finalScore: safeBase, bonusScore: 0 }
  }

  const finalScore = Math.floor(safeBase * scoreMultiplier)
  return {
    baseScore: safeBase,
    finalScore,
    bonusScore: Math.max(0, finalScore - safeBase),
  }
}

/** ノーミス成功時の追加スコア */
export function applyPerfectScoreBonus(
  baseScore: number,
  ability: CharacterAbility,
): ScoreAbilityResult {
  const safeBase = sanitizeNonNegativeInt(baseScore)
  const { perfectScoreBonus } = resolvePlayAbilityModifiers(ability)
  const finalScore = safeBase + perfectScoreBonus
  return {
    baseScore: safeBase,
    finalScore,
    bonusScore: perfectScoreBonus,
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
  const { stageCoinMultiplier } = resolvePlayAbilityModifiers(ability)

  if (stageCoinMultiplier === NEUTRAL_PLAY_MODIFIERS.stageCoinMultiplier) {
    return { baseCoins: safeBase, finalCoins: safeBase, bonusCoins: 0 }
  }

  const finalCoins = Math.floor(safeBase * stageCoinMultiplier)
  return {
    baseCoins: safeBase,
    finalCoins,
    bonusCoins: Math.max(0, finalCoins - safeBase),
  }
}

/** 月光・風神：制限時間への加算秒数 */
export function getTimeBonusSeconds(ability: CharacterAbility): number {
  return resolvePlayAbilityModifiers(ability).timeBonusSeconds
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
  return safeBase + resolvePlayAbilityModifiers(ability).comboMultiplierBonus
}

/** 未知の能力型が渡された場合に throw する検証用 */
export function assertAbilityHandled(ability: CharacterAbility): void {
  resolvePlayAbilityModifiers(ability)
  switch (ability.type) {
    case 'none':
    case 'scoreMultiplier':
    case 'stageCoinMultiplier':
    case 'timeBonusSeconds':
    case 'comboMultiplierBonus':
    case 'streakRewardMultiplier':
    case 'streakMilestoneReduction':
    case 'streakShield':
    case 'timeRewardDoubleChance':
    case 'gachaDuplicateCoinMultiplier':
    case 'perfectScoreBonus':
      return
    default:
      assertNever(ability)
  }
}
