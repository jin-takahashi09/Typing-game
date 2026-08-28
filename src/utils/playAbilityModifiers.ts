import type { CharacterRarity } from '../config/characterTypes'
import type { CharacterAbility } from '../config/characterTypes'

/** プレイ中に参照する能力パラメータ（UI から分離） */
export interface PlayAbilityModifiers {
  scoreMultiplier: number
  stageCoinMultiplier: number
  timeBonusSeconds: number
  comboMultiplierBonus: number
  streakRewardCoinMultiplier: number
  streakMilestoneReduction: number
  streakShieldCharges: number
  timeRewardDoubleChance: number
  gachaDuplicateCoinMultiplier: number
  perfectScoreBonus: number
}

export const NEUTRAL_PLAY_MODIFIERS: PlayAbilityModifiers = {
  scoreMultiplier: 1,
  stageCoinMultiplier: 1,
  timeBonusSeconds: 0,
  comboMultiplierBonus: 0,
  streakRewardCoinMultiplier: 1,
  streakMilestoneReduction: 0,
  streakShieldCharges: 0,
  timeRewardDoubleChance: 0,
  gachaDuplicateCoinMultiplier: 1,
  perfectScoreBonus: 0,
}

function assertNever(value: never): never {
  throw new Error(`Unhandled character ability: ${JSON.stringify(value)}`)
}

function positiveNumber(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** キャラクター能力をプレイ用パラメータへ集約（1キャラ1回） */
export function resolvePlayAbilityModifiers(
  ability: CharacterAbility,
): PlayAbilityModifiers {
  const modifiers: PlayAbilityModifiers = { ...NEUTRAL_PLAY_MODIFIERS }

  switch (ability.type) {
    case 'none':
      break
    case 'scoreMultiplier':
      modifiers.scoreMultiplier = positiveNumber(ability.value, 1)
      break
    case 'stageCoinMultiplier':
      modifiers.stageCoinMultiplier = positiveNumber(ability.value, 1)
      break
    case 'timeBonusSeconds':
      modifiers.timeBonusSeconds = Math.max(0, Math.floor(ability.value))
      break
    case 'comboMultiplierBonus':
      modifiers.comboMultiplierBonus = Math.max(0, ability.value)
      break
    case 'streakRewardMultiplier':
      modifiers.streakRewardCoinMultiplier = positiveNumber(ability.value, 1)
      break
    case 'streakMilestoneReduction':
      modifiers.streakMilestoneReduction = Math.max(
        0,
        Math.min(1, Math.floor(ability.value)),
      )
      break
    case 'streakShield':
      modifiers.streakShieldCharges = Math.max(0, Math.floor(ability.value))
      break
    case 'timeRewardDoubleChance':
      modifiers.timeRewardDoubleChance = Math.min(
        1,
        Math.max(0, ability.value),
      )
      break
    case 'gachaDuplicateCoinMultiplier':
      modifiers.gachaDuplicateCoinMultiplier = positiveNumber(ability.value, 1)
      break
    case 'perfectScoreBonus':
      modifiers.perfectScoreBonus = Math.max(0, Math.floor(ability.value))
      break
    default:
      assertNever(ability)
  }

  return modifiers
}

/** ガチャ被りコインへ能力補正を適用 */
export function applyGachaDuplicateCoinModifier(
  baseCoins: number,
  multiplier: number,
): number {
  const safeBase = Math.max(0, Math.floor(baseCoins))
  const safeMultiplier = positiveNumber(multiplier, 1)
  return Math.floor(safeBase * safeMultiplier)
}

/** 最高レア判定（神忍対応） */
export function pickPeakRarity(rarities: CharacterRarity[]): CharacterRarity {
  const order: CharacterRarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'SHINNIN']
  return rarities.reduce<CharacterRarity>(
    (peak, rarity) =>
      order.indexOf(rarity) > order.indexOf(peak) ? rarity : peak,
    'N',
  )
}
