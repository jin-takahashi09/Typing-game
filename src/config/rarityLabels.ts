import type { CharacterRarity } from './characterTypes'

export const RARITY_LABELS: Record<CharacterRarity, string> = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
  UR: 'UR',
  SHINNIN: '神忍',
}

export function formatRarityLabel(rarity: CharacterRarity): string {
  return RARITY_LABELS[rarity]
}

export function rarityCssSuffix(rarity: CharacterRarity): string {
  return rarity.toLowerCase()
}
