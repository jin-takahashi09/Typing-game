export type CharacterRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR'

export type CharacterAbilityType =
  | 'none'
  | 'scoreMultiplier'
  | 'stageCoinMultiplier'
  | 'timeBonusSeconds'
  | 'comboMultiplierBonus'

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

export const characters: readonly CharacterDefinition[] = [
  {
    id: 'shinobi-default',
    name: '見習い忍者',
    description: '布装備に短い鉢巻。木の手裏剣と草履、小さな刀で修行を始める。',
    rarity: 'N',
    skinClass: 'ninja-skin-default',
    ability: {
      type: 'none',
      name: '基礎修行',
      description: '特別な補正なし。標準のバランスで修行する。',
    },
    visual: {
      pose: 'basic',
      accessories: ['headband', 'woodenShuriken', 'sandals', 'shortSword'],
      effect: 'none',
    },
  },
  {
    id: 'shinobi-kage',
    name: '影丸',
    description: '夜陰に溶け込む黒装束の見習い。装飾は少なく身軽さ重視。',
    rarity: 'N',
    skinClass: 'ninja-skin-kage',
    ability: {
      type: 'none',
      name: '影走り',
      description: '特別な補正なし。影のように素早い足取りだけが持ち味。',
    },
    visual: {
      pose: 'shadow',
      accessories: ['mask', 'sandals'],
      effect: 'shadow',
    },
  },
  {
    id: 'shinobi-midori',
    name: '翠霞',
    description: '山里の緑装。葉紋の鉢巻と簡素な布鎧で森を駆ける。',
    rarity: 'N',
    skinClass: 'ninja-skin-midori',
    ability: {
      type: 'scoreMultiplier',
      name: '若葉の一撃',
      description: '獲得スコアが2%増加する。',
      value: 1.02,
    },
    visual: {
      pose: 'crouched',
      accessories: ['headband', 'leafMark', 'sandals'],
      effect: 'mist',
    },
  },
  {
    id: 'shinobi-shirogane',
    name: '白銀',
    description: '銀糸の装束と細身の刃。月光を映す控えめな装飾。',
    rarity: 'R',
    skinClass: 'ninja-skin-shirogane',
    ability: {
      type: 'scoreMultiplier',
      name: '銀閃',
      description: '獲得スコアが5%増加する。',
      value: 1.05,
    },
    visual: {
      pose: 'silver',
      accessories: ['silverBlade', 'shoulderPad', 'headband'],
      effect: 'moon',
    },
  },
  {
    id: 'shinobi-byakuya',
    name: '白夜',
    description: '白き外套をまとい、夜明け前の静けさで敵をかわす。',
    rarity: 'R',
    skinClass: 'ninja-skin-byakuya',
    ability: {
      type: 'comboMultiplierBonus',
      name: '白夜の冴え',
      description: 'コンボスコア倍率が0.05上昇する。',
      value: 0.05,
    },
    visual: {
      pose: 'defensive',
      accessories: ['whiteCloak', 'mask', 'armor'],
      effect: 'mist',
    },
  },
  {
    id: 'shinobi-gekkou',
    name: '月光',
    description: '月紋を背負う夜戦のスペシャリスト。時間を伸ばす術を持つ。',
    rarity: 'R',
    skinClass: 'ninja-skin-gekkou',
    ability: {
      type: 'timeBonusSeconds',
      name: '月読み',
      description: '制限時間が3秒延長される。',
      value: 3,
    },
    visual: {
      pose: 'moon',
      accessories: ['moonCrest', 'scarf', 'scroll'],
      effect: 'moon',
    },
  },
  {
    id: 'shinobi-red',
    name: '紅蓮の忍者',
    description: '炎マフラーと二刀流。炎模様の装束に赤い目が燃える。',
    rarity: 'SR',
    skinClass: 'ninja-skin-red',
    ability: {
      type: 'scoreMultiplier',
      name: '紅蓮の連撃',
      description: '獲得スコアが10%増加する。',
      value: 1.1,
    },
    visual: {
      pose: 'aggressive',
      accessories: ['scarf', 'dualBlades', 'redEyes', 'dagger'],
      effect: 'fire',
    },
  },
  {
    id: 'shinobi-blue',
    name: '蒼影の忍者',
    description: '肩鎧と盾、仮面に青いマント。水の波動が足元を守る。',
    rarity: 'SR',
    skinClass: 'ninja-skin-blue',
    ability: {
      type: 'scoreMultiplier',
      name: '蒼影の冴え',
      description: '獲得スコアが8%増加する。',
      value: 1.08,
    },
    visual: {
      pose: 'twin',
      accessories: ['shield', 'armor', 'mask', 'whiteCloak'],
      effect: 'water',
    },
  },
  {
    id: 'shinobi-fuujin',
    name: '風神',
    description: '風巻物を携え、疾風のごとく制限時間を押し広げる。',
    rarity: 'SR',
    skinClass: 'ninja-skin-fuujin',
    ability: {
      type: 'timeBonusSeconds',
      name: '疾風の刻',
      description: '制限時間が5秒延長される。',
      value: 5,
    },
    visual: {
      pose: 'wind',
      accessories: ['windScroll', 'scarf', 'sandals'],
      effect: 'wind',
    },
  },
  {
    id: 'shinobi-akatsuki',
    name: '暁影',
    description: '暁の襷を結び、コンボの勢いを夜明けまで繋ぐ。',
    rarity: 'SR',
    skinClass: 'ninja-skin-akatsuki',
    ability: {
      type: 'comboMultiplierBonus',
      name: '暁の連鎖',
      description: 'コンボスコア倍率が0.08上昇する。',
      value: 0.08,
    },
    visual: {
      pose: 'dawn',
      accessories: ['dawnSash', 'dagger', 'headband'],
      effect: 'ember',
    },
  },
  {
    id: 'shinobi-gold',
    name: '黄金の忍頭',
    description: '豪華な兜と肩当て、巻物と小判袋。家紋が金に輝く。',
    rarity: 'SSR',
    skinClass: 'ninja-skin-gold',
    ability: {
      type: 'stageCoinMultiplier',
      name: '黄金の褒賞',
      description: '撃破ボーナスで獲得するコインが20%増加する。',
      value: 1.2,
    },
    visual: {
      pose: 'leader',
      accessories: ['helmet', 'shoulderPad', 'scroll', 'coinBag', 'crest'],
      effect: 'gold',
    },
  },
  {
    id: 'shinobi-raikage',
    name: '雷影',
    description: '雷紋の鎧と稲妻の軌跡。一撃のスコアを大きく伸ばす。',
    rarity: 'SSR',
    skinClass: 'ninja-skin-raikage',
    ability: {
      type: 'scoreMultiplier',
      name: '雷鳴斬',
      description: '獲得スコアが15%増加する。',
      value: 1.15,
    },
    visual: {
      pose: 'storm',
      accessories: ['lightningMark', 'armor', 'dualBlades', 'shoulderPad'],
      effect: 'lightning',
    },
  },
  {
    id: 'shinobi-kokuen',
    name: '黒炎',
    description: '漆黒の炎を纏う暗殺者。紅蓮を超えるスコア補正を持つ。',
    rarity: 'SSR',
    skinClass: 'ninja-skin-kokuen',
    ability: {
      type: 'scoreMultiplier',
      name: '黒炎の劫火',
      description: '獲得スコアが20%増加する。',
      value: 1.2,
    },
    visual: {
      pose: 'leaping',
      accessories: ['blackFlame', 'dualBlades', 'redEyes', 'mask'],
      effect: 'fire',
    },
  },
  {
    id: 'shinobi-yasha',
    name: '夜叉',
    description: '鬼面に近い武具と重盾。受けた傷を大きく削る守り手。',
    rarity: 'SSR',
    skinClass: 'ninja-skin-yasha',
    ability: {
      type: 'scoreMultiplier',
      name: '夜叉の劫火',
      description: '獲得スコアが15%増加する。',
      value: 1.15,
    },
    visual: {
      pose: 'mystic',
      accessories: ['oniMask', 'shield', 'armor', 'shoulderPad'],
      effect: 'ember',
    },
  },
  {
    id: 'shinobi-kimen',
    name: '鬼面',
    description: '完全に異なる巨大シルエット。鬼の仮面がコンボを増幅する。',
    rarity: 'UR',
    skinClass: 'ninja-skin-kimen',
    ability: {
      type: 'comboMultiplierBonus',
      name: '鬼哭の連鎖',
      description: 'コンボスコア倍率が0.15上昇する。',
      value: 0.15,
    },
    visual: {
      pose: 'oni',
      accessories: ['oniMask', 'dualBlades', 'shoulderPad', 'crest', 'blackFlame'],
      effect: 'ember',
    },
  },
  {
    id: 'shinobi-tenko',
    name: '天狐',
    description: '九尾を思わせる狐装。財宝を呼び寄せるURの別格シルエット。',
    rarity: 'UR',
    skinClass: 'ninja-skin-tenko',
    ability: {
      type: 'stageCoinMultiplier',
      name: '天狐の恵み',
      description: '撃破ボーナスで獲得するコインが50%増加する。',
      value: 1.5,
    },
    visual: {
      pose: 'fox',
      accessories: ['foxTail', 'mask', 'scroll', 'coinBag', 'crest'],
      effect: 'fox',
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
    rarity: character.rarity,
  }
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
    default: {
      const _exhaustive: never = ability
      return _exhaustive
    }
  }
}

export function getCharactersByRarity(
  rarity: CharacterRarity,
): CharacterDefinition[] {
  return characters.filter((c) => c.rarity === rarity)
}
