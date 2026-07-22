import type { DifficultyId } from '../types/app'

export const appConfig = {
  name: 'Shinobi Keys',
  nameJa: 'タイピング修行',
  tagline: '打て。斬れ。タイピングを極めろ。',
  defaultDifficulty: 'ninja' as DifficultyId,
  defaultMotionPreference: 'system' as const,
  defaultVolume: 0.7,
  defaultMuted: false,
} as const
