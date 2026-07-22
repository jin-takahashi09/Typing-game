export type DifficultyId = 'trainee' | 'ninja' | 'master'

/** アプリ内モーション設定。OSの prefers-reduced-motion とは別管理 */
export type MotionPreference = 'system' | 'reduced' | 'full'

/** Phase 1 で使う画面。以降の画面は各 Phase で追加する */
export type AppScreen = 'title' | 'difficulty'
