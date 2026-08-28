export type CharacterRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'SHINNIN'

export type CharacterAbilityType =
  | 'none'
  | 'scoreMultiplier'
  | 'stageCoinMultiplier'
  | 'timeBonusSeconds'
  | 'comboMultiplierBonus'
  | 'streakRewardMultiplier'
  | 'streakMilestoneReduction'
  | 'streakShield'
  | 'timeRewardDoubleChance'
  | 'gachaDuplicateCoinMultiplier'
  | 'perfectScoreBonus'

export type CharacterAbility =
  | {
      type: 'none'
      name: string
      description: string
    }
  | {
      type: 'scoreMultiplier'
      name: string
      description: string
      value: number
    }
  | {
      type: 'stageCoinMultiplier'
      name: string
      description: string
      value: number
    }
  | {
      type: 'timeBonusSeconds'
      name: string
      description: string
      value: number
    }
  | {
      type: 'comboMultiplierBonus'
      name: string
      description: string
      value: number
    }
  | {
      type: 'streakRewardMultiplier'
      name: string
      description: string
      value: number
    }
  | {
      type: 'streakMilestoneReduction'
      name: string
      description: string
      value: number
    }
  | {
      type: 'streakShield'
      name: string
      description: string
      value: number
    }
  | {
      type: 'timeRewardDoubleChance'
      name: string
      description: string
      value: number
    }
  | {
      type: 'gachaDuplicateCoinMultiplier'
      name: string
      description: string
      value: number
    }
  | {
      type: 'perfectScoreBonus'
      name: string
      description: string
      value: number
    }

export type CharacterPose =
  | 'basic'
  | 'aggressive'
  | 'defensive'
  | 'leader'
  | 'crouched'
  | 'leaping'
  | 'twin'
  | 'mystic'
  | 'storm'
  | 'moon'
  | 'wind'
  | 'oni'
  | 'fox'
  | 'shadow'
  | 'dawn'
  | 'silver'

export type CharacterAccessory =
  | 'headband'
  | 'scarf'
  | 'dagger'
  | 'shield'
  | 'armor'
  | 'mask'
  | 'scroll'
  | 'coinBag'
  | 'shoulderPad'
  | 'crest'
  | 'woodenShuriken'
  | 'sandals'
  | 'shortSword'
  | 'dualBlades'
  | 'redEyes'
  | 'helmet'
  | 'lightningMark'
  | 'whiteCloak'
  | 'blackFlame'
  | 'oniMask'
  | 'moonCrest'
  | 'windScroll'
  | 'foxTail'
  | 'leafMark'
  | 'silverBlade'
  | 'dawnSash'

export type CharacterIdleEffect =
  | 'none'
  | 'fire'
  | 'water'
  | 'gold'
  | 'lightning'
  | 'moon'
  | 'wind'
  | 'shadow'
  | 'fox'
  | 'ember'
  | 'mist'

export interface CharacterVisualConfig {
  pose: CharacterPose
  accessories: readonly CharacterAccessory[]
  effect: CharacterIdleEffect
  /** 生成スキン用シード（core キャラは未使用） */
  skinSeed?: number
}

export interface CharacterDefinition {
  id: string
  name: string
  description: string
  rarity: CharacterRarity
  /** CSS 修飾クラス（ninja-skin-*） */
  skinClass: string
  ability: CharacterAbility
  visual: CharacterVisualConfig
}

/** プレイ開始時に固定するスナップショット */
export interface ActivePlayCharacter {
  characterId: string
  name: string
  ability: CharacterAbility
  skinClass: string
  visual: CharacterVisualConfig
  rarity: CharacterRarity
}

export const DEFAULT_CHARACTER_ID = 'shinobi-default'
