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
  /** プレイヤー向け短い説明（内部数値は含めない） */
  description: string
  /** 制限時間（秒） */
  timeLimitSeconds: number
  /** 落下速度の基準値 */
  fallSpeed: number
  /** ステージごとの落下速度増加量 */
  fallSpeedPerStage: number
  /** 落下速度の上限 */
  maxFallSpeed: number
  /** 出現間隔の基準（ms） */
  spawnIntervalMs: number
  /** ステージごとの出現間隔短縮量（ms） */
  spawnIntervalDecreasePerStage: number
  /** 出現間隔の下限（ms） */
  minSpawnIntervalMs: number
  /** STAGE1 の同時出現上限 */
  maxActiveTargets: number
  /** 何ステージごとに同時出現上限を +1 するか */
  maxActiveTargetsIncreaseEveryStages: number
  /** 同時出現数の最大上限 */
  maxActiveTargetsCap: number
  /** 問題の最小文字数（ローマ字想定） */
  minChars: number
  /** 問題の最大文字数（ローマ字想定） */
  maxChars: number
  problemCategories: readonly ProblemCategory[]
  missDamage: number
  killHeal: number
  scoreMultiplier: number
  comboMultiplier: number
  stageUpCondition: StageUpCondition
  showBeginnerGuide: boolean
}

export const difficultyConfigs: Record<DifficultyId, DifficultyConfig> = {
  trainee: {
    id: 'trainee',
    displayName: '修行生',
    description: '短い言葉を中心に練習します。ステージが進むと難しくなります。',
    timeLimitSeconds: 60,
    fallSpeed: 0.75,
    fallSpeedPerStage: 0.08,
    maxFallSpeed: 1.35,
    spawnIntervalMs: 2200,
    spawnIntervalDecreasePerStage: 100,
    minSpawnIntervalMs: 1200,
    maxActiveTargets: 1,
    maxActiveTargetsIncreaseEveryStages: 2,
    maxActiveTargetsCap: 3,
    minChars: 2,
    maxChars: 8,
    problemCategories: ['basic', 'food', 'nature', 'english'],
    missDamage: 8,
    killHeal: 3,
    scoreMultiplier: 1,
    comboMultiplier: 1,
    stageUpCondition: { type: 'clears', every: 8 },
    showBeginnerGuide: true,
  },
  ninja: {
    id: 'ninja',
    displayName: '忍者',
    description: '拗音や促音を含む言葉に挑戦します。ステージが進むと難しくなります。',
    timeLimitSeconds: 90,
    fallSpeed: 1.1,
    fallSpeedPerStage: 0.12,
    maxFallSpeed: 1.9,
    spawnIntervalMs: 1800,
    spawnIntervalDecreasePerStage: 110,
    minSpawnIntervalMs: 850,
    maxActiveTargets: 2,
    maxActiveTargetsIncreaseEveryStages: 2,
    maxActiveTargetsCap: 4,
    minChars: 4,
    maxChars: 14,
    problemCategories: ['basic', 'food', 'nature', 'phrase', 'it', 'english'],
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
    description: '長い言葉や文章に挑戦します。ステージが進むと難しくなります。',
    timeLimitSeconds: 120,
    fallSpeed: 1.35,
    fallSpeedPerStage: 0.14,
    maxFallSpeed: 2.2,
    spawnIntervalMs: 1400,
    spawnIntervalDecreasePerStage: 100,
    minSpawnIntervalMs: 650,
    maxActiveTargets: 3,
    maxActiveTargetsIncreaseEveryStages: 2,
    maxActiveTargetsCap: 5,
    minChars: 6,
    maxChars: 28,
    problemCategories: ['nature', 'it', 'phrase', 'english'],
    missDamage: 14,
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

export function getFallSpeedForStage(
  config: DifficultyConfig,
  stage: number,
): number {
  const raw = config.fallSpeed + (Math.max(1, stage) - 1) * config.fallSpeedPerStage
  return Math.min(config.maxFallSpeed, raw)
}

export function getSpawnIntervalForStage(
  config: DifficultyConfig,
  stage: number,
): number {
  const raw =
    config.spawnIntervalMs -
    (Math.max(1, stage) - 1) * config.spawnIntervalDecreasePerStage
  return Math.max(config.minSpawnIntervalMs, raw)
}

export function getMaxActiveTargetsForStage(
  config: DifficultyConfig,
  stage: number,
): number {
  const safeStage = Math.max(1, stage)
  const extra = Math.floor(
    (safeStage - 1) / Math.max(1, config.maxActiveTargetsIncreaseEveryStages),
  )
  return Math.min(config.maxActiveTargetsCap, config.maxActiveTargets + extra)
}
