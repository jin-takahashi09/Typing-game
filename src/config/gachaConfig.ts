import type { CharacterRarity } from './characterTypes'

/** ガチャ料金・排出率・被り変換 */
export const RARITY_WEIGHTS = {
  N: 549,
  R: 250,
  SR: 120,
  SSR: 60,
  UR: 20,
  SHINNIN: 1,
} as const satisfies Record<CharacterRarity, number>

export const RARITY_WEIGHT_TOTAL = Object.values(RARITY_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
)

export const RARITY_ORDER: readonly CharacterRarity[] = [
  'N',
  'R',
  'SR',
  'SSR',
  'UR',
  'SHINNIN',
]

function buildRatesFromWeights(): Record<CharacterRarity, number> {
  return RARITY_ORDER.reduce(
    (acc, rarity) => {
      acc[rarity] = RARITY_WEIGHTS[rarity] / RARITY_WEIGHT_TOTAL
      return acc
    },
    {} as Record<CharacterRarity, number>,
  )
}

export const gachaConfig = {
  singleCost: 100,
  multiCost: 900,
  multiCount: 10,
  historyLimit: 50,
  /** 整数ウェイト（抽選はこちらを参照） */
  rarityWeights: RARITY_WEIGHTS,
  rarityWeightTotal: RARITY_WEIGHT_TOTAL,
  /** 表示・検証用（ウェイトから導出） */
  rarityRates: buildRatesFromWeights(),
  /** 被り時のコイン変換量 */
  duplicateCoins: {
    N: 10,
    R: 30,
    SR: 80,
    SSR: 200,
    UR: 500,
    SHINNIN: 1000,
  } as const satisfies Record<CharacterRarity, number>,
} as const

/** SR 以上（電撃演出付き） */
export function isRareOrHigher(rarity: CharacterRarity): boolean {
  return (
    rarity === 'SR' ||
    rarity === 'SSR' ||
    rarity === 'UR' ||
    rarity === 'SHINNIN'
  )
}

export function isUltraRare(rarity: CharacterRarity): boolean {
  return rarity === 'UR' || rarity === 'SHINNIN'
}

export function isShinnin(rarity: CharacterRarity): boolean {
  return rarity === 'SHINNIN'
}

export function formatRatePercent(rarity: CharacterRarity): string {
  const rate = gachaConfig.rarityRates[rarity]
  if (rarity === 'N') {
    return '54.9%'
  }
  if (rarity === 'SHINNIN') {
    return '0.1%'
  }
  return `${Math.round(rate * 1000) / 10}%`
}
