import type { DifficultyId } from '../types/app'

export type ProblemCategory =
  | 'basic'
  | 'food'
  | 'nature'
  | 'it'
  | 'phrase'
  | 'english'

export type StageUpCondition =
  | { type: 'score'; every: number }
  | { type: 'clears'; every: number }

export interface DifficultyConfig {
  id: DifficultyId
  displayName: string
  description: string
  /** 落下速度（px/frame 相当の基準値。調整用の仮値） */
  fallSpeed: number
  /** ステージごとの落下速度増加量 */
  fallSpeedPerStage: number
  /** 出現間隔（ms） */
  spawnIntervalMs: number
  /** 出現間隔の下限（ms） */
  minSpawnIntervalMs: number
  /** 同時に存在できるターゲット数の上限 */
  maxActiveTargets: number
  /** 問題の最小文字数（ローマ字想定） */
  minChars: number
  /** 問題の最大文字数（ローマ字想定） */
  maxChars: number
  /** 使用する問題カテゴリ */
  problemCategories: readonly ProblemCategory[]
  /** ミス時のダメージ */
  missDamage: number
  /** 撃破時の回復量 */
  killHeal: number
  /** スコア倍率 */
  scoreMultiplier: number
  /** コンボ倍率 */
  comboMultiplier: number
  /** ステージ上昇条件 */
  stageUpCondition: StageUpCondition
  /** 初心者向けガイドを表示するか */
  showBeginnerGuide: boolean
}

export const difficultyConfigs: Record<DifficultyId, DifficultyConfig> = {
  trainee: {
    id: 'trainee',
    displayName: '修行生',
    description:
      '初心者向け。短い問題とゆったりしたテンポで、基本キーと正確な入力を身につける難易度です。',
    fallSpeed: 0.7,
    fallSpeedPerStage: 0.08,
    spawnIntervalMs: 2400,
    minSpawnIntervalMs: 1400,
    maxActiveTargets: 2,
    minChars: 3,
    maxChars: 5,
    problemCategories: ['basic', 'food', 'nature', 'english'],
    missDamage: 6,
    killHeal: 4,
    scoreMultiplier: 1,
    comboMultiplier: 1,
    stageUpCondition: { type: 'clears', every: 8 },
    showBeginnerGuide: true,
  },
  ninja: {
    id: 'ninja',
    displayName: '忍者',
    description:
      '標準難易度。複数ターゲットをさばきながら、速度と正確性の両方を鍛えます。',
    fallSpeed: 1.1,
    fallSpeedPerStage: 0.15,
    spawnIntervalMs: 1800,
    minSpawnIntervalMs: 900,
    maxActiveTargets: 3,
    minChars: 5,
    maxChars: 10,
    problemCategories: ['basic', 'food', 'nature', 'phrase', 'english'],
    missDamage: 10,
    killHeal: 2,
    scoreMultiplier: 1.25,
    comboMultiplier: 1.5,
    stageUpCondition: { type: 'clears', every: 6 },
    showBeginnerGuide: false,
  },
  master: {
    id: 'master',
    displayName: '忍頭',
    description:
      '上級難易度。長い問題と速い落下で、高速入力と高い正確性が求められます。',
    fallSpeed: 1.6,
    fallSpeedPerStage: 0.22,
    spawnIntervalMs: 1200,
    minSpawnIntervalMs: 600,
    maxActiveTargets: 4,
    minChars: 7,
    maxChars: 14,
    problemCategories: ['nature', 'it', 'phrase', 'english'],
    missDamage: 16,
    killHeal: 1,
    scoreMultiplier: 1.75,
    comboMultiplier: 2,
    stageUpCondition: { type: 'clears', every: 5 },
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
