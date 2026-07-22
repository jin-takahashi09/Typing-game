export type DifficultyId = 'trainee' | 'ninja' | 'master'

/** アプリ内モーション設定。OSの prefers-reduced-motion とは別管理 */
export type MotionPreference = 'system' | 'reduced' | 'full'

/** アプリ画面。Phase ごとに必要な画面を追加する */
export type AppScreen = 'title' | 'difficulty' | 'game' | 'result'
