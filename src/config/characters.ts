export interface CharacterDefinition {
  id: string
  name: string
  description: string
  price: number
  /** CSS 修飾クラス（ninja-skin-*） */
  skinClass: string
}

export const DEFAULT_CHARACTER_ID = 'shinobi-default'

export const characters: readonly CharacterDefinition[] = [
  {
    id: 'shinobi-default',
    name: '見習い忍者',
    description: '修行を始めたばかりの標準装備。最初から使用できる。',
    price: 0,
    skinClass: 'ninja-skin-default',
  },
  {
    id: 'shinobi-red',
    name: '紅蓮の忍者',
    description: '炎のような赤い装束。素早い斬撃を予感させる。',
    price: 100,
    skinClass: 'ninja-skin-red',
  },
  {
    id: 'shinobi-blue',
    name: '蒼影の忍者',
    description: '月夜に溶ける青い影。静かに的を射抜く。',
    price: 200,
    skinClass: 'ninja-skin-blue',
  },
  {
    id: 'shinobi-gold',
    name: '黄金の忍頭',
    description: '伝説の忍頭が纏う黄金の装い。風格が違う。',
    price: 500,
    skinClass: 'ninja-skin-gold',
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
