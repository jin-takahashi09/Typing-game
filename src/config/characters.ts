export type {
  ActivePlayCharacter,
  CharacterAbility,
  CharacterAbilityType,
  CharacterAccessory,
  CharacterDefinition,
  CharacterIdleEffect,
  CharacterPose,
  CharacterRarity,
  CharacterVisualConfig,
} from './characterTypes'

export { DEFAULT_CHARACTER_ID } from './characterTypes'

import type {
  ActivePlayCharacter,
  CharacterAbility,
  CharacterDefinition,
  CharacterRarity,
} from './characterTypes'
import { coreCharacters } from './coreCharacters'
import { extendedCharacters } from './extendedCharacters.generated'
import { formatAbilityShort as formatAbilityShortImpl } from '../utils/formatAbilityShort'

export const characters: readonly CharacterDefinition[] = [
  ...coreCharacters,
  ...extendedCharacters,
]

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
  return characterById.get('shinobi-default')!
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
  return formatAbilityShortImpl(ability)
}

export function getCharactersByRarity(
  rarity: CharacterRarity,
): CharacterDefinition[] {
  return characters.filter((c) => c.rarity === rarity)
}

export const CHARACTER_COUNT_BY_RARITY: Record<CharacterRarity, number> = {
  N: 0,
  R: 0,
  SR: 0,
  SSR: 0,
  UR: 0,
  SHINNIN: 0,
}

for (const character of characters) {
  CHARACTER_COUNT_BY_RARITY[character.rarity] += 1
}
