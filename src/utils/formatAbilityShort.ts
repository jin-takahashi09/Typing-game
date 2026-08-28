import type { CharacterAbility } from '../config/characterTypes'

function assertNever(value: never): never {
  throw new Error(`Unhandled character ability: ${JSON.stringify(value)}`)
}

export function formatAbilityShort(ability: CharacterAbility): string {
  switch (ability.type) {
    case 'none':
      return `${ability.name}：補正なし`
    case 'scoreMultiplier':
      return `${ability.name}：スコア +${Math.round((ability.value - 1) * 100)}%`
    case 'stageCoinMultiplier':
      return `${ability.name}：撃破ボーナス +${Math.round((ability.value - 1) * 100)}%`
    case 'timeBonusSeconds':
      return `${ability.name}：制限時間 +${ability.value}秒`
    case 'comboMultiplierBonus':
      return `${ability.name}：コンボ倍率 +${ability.value}`
    case 'streakRewardMultiplier':
      return `${ability.name}：連続報酬 +${Math.round((ability.value - 1) * 100)}%`
    case 'streakMilestoneReduction':
      return `${ability.name}：初回報酬 -${ability.value}問`
    case 'streakShield':
      return `${ability.name}：ミス保護 ${ability.value}回`
    case 'timeRewardDoubleChance':
      return `${ability.name}：時間報酬2倍 ${Math.round(ability.value * 100)}%`
    case 'gachaDuplicateCoinMultiplier':
      return `${ability.name}：被りコイン +${Math.round((ability.value - 1) * 100)}%`
    case 'perfectScoreBonus':
      return `${ability.name}：完璧時 +${ability.value}スコア`
    default:
      return assertNever(ability)
  }
}
