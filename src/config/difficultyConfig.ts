import type { DifficultyId } from '../types/app'

export type ProblemCategory =
  | 'basic'
  | 'food'
  | 'nature'
  | 'it'
  | 'phrase'
  | 'english'

export interface DifficultyConfig {
  id: DifficultyId
  displayName: string
  /** プレイヤー向け短い説明（内部数値は含めない） */
  description: string
  /** 制限時間（秒）。設定値で変更可能 */
  timeLimitSeconds: number
  /**
   * 落下速度係数（大きいほど速い＝猶予が短い）。
   * 難しさは落下速度だけで調整する。
   */
  fallSpeed: number
  /** 同時出現上限（寿司打方式では常に 1） */
  maxActiveTargets: number
  /** 問題の最小文字数（ローマ字想定） */
  minChars: number
  /** 問題の最大文字数（ローマ字想定） */
  maxChars: number
  problemCategories: readonly ProblemCategory[]
  missDamage: number
  killHeal: number
  scoreMultiplier: number
  comboMultiplier: number
  /**
   * 何問撃破ごとにコインマイルストーンを付与するか
   * （旧ステージクリア相当。UI に STAGE は出さない）
   */
  coinMilestoneEvery: number
  showBeginnerGuide: boolean
}

export const difficultyConfigs: Record<DifficultyId, DifficultyConfig> = {
  trainee: {
    id: 'trainee',
    displayName: '修行生',
    description: '短い言葉を中心に、ゆっくり落下する敵を迎撃します。',
    timeLimitSeconds: 60,
    fallSpeed: 0.55,
    maxActiveTargets: 1,
    minChars: 2,
    maxChars: 6,
    problemCategories: ['basic', 'food', 'nature', 'english'],
    missDamage: 8,
    killHeal: 3,
    scoreMultiplier: 1,
    comboMultiplier: 1,
    coinMilestoneEvery: 8,
    showBeginnerGuide: true,
  },
  ninja: {
    id: 'ninja',
    displayName: '忍者',
    description: '普通の単語を、標準速度で迎撃します。',
    timeLimitSeconds: 90,
    fallSpeed: 1.0,
    maxActiveTargets: 1,
    minChars: 4,
    maxChars: 14,
    problemCategories: ['basic', 'food', 'nature', 'phrase', 'it', 'english'],
    missDamage: 10,
    killHeal: 2,
    scoreMultiplier: 1.25,
    comboMultiplier: 1.5,
    coinMilestoneEvery: 6,
    showBeginnerGuide: false,
  },
  master: {
    id: 'master',
    displayName: '忍頭',
    description: '長い単語も混ざる問題を、速い落下で迎撃します。',
    timeLimitSeconds: 120,
    fallSpeed: 1.55,
    maxActiveTargets: 1,
    minChars: 6,
    maxChars: 28,
    problemCategories: ['nature', 'it', 'phrase', 'english'],
    missDamage: 14,
    killHeal: 1,
    scoreMultiplier: 1.75,
    comboMultiplier: 2,
    coinMilestoneEvery: 5,
    showBeginnerGuide: false,
  },
}

export const difficultyOrder: readonly DifficultyId[] = [
  'trainee',
  'ninja',
  'master',
] as const

export function getDifficultyConfig(id: DifficultyId): DifficultyConfig {
  return difficultyConfigs[id]
}

/** 寿司打方式：常に最大 1 体 */
export function getMaxActiveTargets(config: DifficultyConfig): number {
  return config.maxActiveTargets
}
