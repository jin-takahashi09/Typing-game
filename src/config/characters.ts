export type CharacterAbilityType =
  | 'none'
  | 'scoreMultiplier'
  | 'damageReduction'
  | 'stageCoinMultiplier'

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
      type: 'damageReduction'
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

export type CharacterPose = 'basic' | 'aggressive' | 'defensive' | 'leader'

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

export type CharacterIdleEffect = 'none' | 'fire' | 'water' | 'gold'

export interface CharacterVisualConfig {
  pose: CharacterPose
  accessories: readonly CharacterAccessory[]
  effect: CharacterIdleEffect
}

export interface CharacterDefinition {
  id: string
  name: string
  description: string
  price: number
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
}

export const DEFAULT_CHARACTER_ID = 'shinobi-default'

export const characters: readonly CharacterDefinition[] = [
  {
    id: 'shinobi-default',
    name: '見習い忍者',
    description: '修行を始めたばかりの標準装備。最初から使用できる。',
    price: 0,
    skinClass: 'ninja-skin-default',
    ability: {
      type: 'none',
      name: '基礎修行',
      description: '特別な補正なし。標準のバランスで修行する。',
    },
    visual: {
      pose: 'basic',
      accessories: ['headband'],
      effect: 'none',
    },
  },
  {
    id: 'shinobi-red',
    name: '紅蓮の忍者',
    description: '炎のような赤い装束。素早い斬撃を予感させる。',
    price: 100,
    skinClass: 'ninja-skin-red',
    ability: {
      type: 'scoreMultiplier',
      name: '紅蓮の連撃',
      description: '獲得スコアが10%増加する。',
      value: 1.1,
    },
    visual: {
      pose: 'aggressive',
      accessories: ['scarf', 'dagger'],
      effect: 'fire',
    },
  },
  {
    id: 'shinobi-blue',
    name: '蒼影の忍者',
    description: '月夜に溶ける青い影。静かに的を射抜く。',
    price: 200,
    skinClass: 'ninja-skin-blue',
    ability: {
      type: 'damageReduction',
      name: '蒼影の守り',
      description: 'HPが受けるダメージを20%軽減する。',
      value: 0.2,
    },
    visual: {
      pose: 'defensive',
      accessories: ['shield', 'armor', 'mask'],
      effect: 'water',
    },
  },
  {
    id: 'shinobi-gold',
    name: '黄金の忍頭',
    description: '伝説の忍頭が纏う黄金の装い。風格が違う。',
    price: 500,
    skinClass: 'ninja-skin-gold',
    ability: {
      type: 'stageCoinMultiplier',
      name: '黄金の褒賞',
      description: '撃破ボーナスで獲得するコインが20%増加する。',
      value: 1.2,
    },
    visual: {
      pose: 'leader',
      accessories: ['shoulderPad', 'scroll', 'coinBag', 'crest'],
      effect: 'gold',
    },
  },
] as const

const characterById = new Map(
  characters.map((character) => [character.id, character]),
)

export function getCharacterById(id: string): CharacterDefinition | undefined {
  return characterById.get(id)
}

export function isKnownCharacterId(id: string): boolean {
  return characterById.has(id)
}

export function getDefaultCharacter(): CharacterDefinition {
  return characterById.get(DEFAULT_CHARACTER_ID)!
}

export function resolveCharacter(id: string | null | undefined): CharacterDefinition {
  if (typeof id === 'string' && isKnownCharacterId(id)) {
    return getCharacterById(id)!
  }
  return getDefaultCharacter()
}

export function toActivePlayCharacter(
  character: CharacterDefinition,
): ActivePlayCharacter {
  return {
    characterId: character.id,
    name: character.name,
    ability: character.ability,
    skinClass: character.skinClass,
    visual: character.visual,
  }
}

export function formatAbilityShort(ability: CharacterAbility): string {
  switch (ability.type) {
    case 'none':
      return `${ability.name}：補正なし`
    case 'scoreMultiplier':
      return `${ability.name}：スコア +${Math.round((ability.value - 1) * 100)}%`
    case 'damageReduction':
      return `${ability.name}：被ダメージ -${Math.round(ability.value * 100)}%`
    case 'stageCoinMultiplier':
      return `${ability.name}：撃破ボーナス +${Math.round((ability.value - 1) * 100)}%`
    default: {
      const _exhaustive: never = ability
      return _exhaustive
    }
  }
}
