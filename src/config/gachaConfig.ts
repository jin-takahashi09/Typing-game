import type { CharacterRarity } from './characters'

/** ガチャ料金・排出率・被り変換 */
export const gachaConfig = {
  singleCost: 100,
  multiCost: 900,
  multiCount: 10,
  historyLimit: 50,
  /** レア度ごとの排出率（合計 1.0） */
  rarityRates: {
    N: 0.55,
    R: 0.25,
    SR: 0.12,
    SSR: 0.06,
    UR: 0.02,
  } as const satisfies Record<CharacterRarity, number>,
  /** 被り時のコイン変換量 */
  duplicateCoins: {
    N: 10,
    R: 30,
    SR: 80,
    SSR: 200,
    UR: 500,
  } as const satisfies Record<CharacterRarity, number>,
} as const

export const RARITY_ORDER: readonly CharacterRarity[] = [
  'N',
  'R',
  'SR',
  'SSR',
  'UR',
]

/** SR 以上（電撃演出付き） */
export function isRareOrHigher(rarity: CharacterRarity): boolean {
  return rarity === 'SR' || rarity === 'SSR' || rarity === 'UR'
}

export function isUltraRare(rarity: CharacterRarity): boolean {
  return rarity === 'UR'
}
