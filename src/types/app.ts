export type DifficultyId = 'trainee' | 'ninja' | 'master'

/** アプリ内モーション設定。OSの prefers-reduced-motion とは別管理 */
export type MotionPreference = 'system' | 'reduced' | 'full'

/** 出題ローマ字の表示文字種。入力判定には影響しない */
export type RomajiLetterCase = 'lower' | 'upper'

/** アプリ画面。Phase ごとに必要な画面を追加する */
export type AppScreen =
  | 'title'
  | 'difficulty'
  | 'game'
  | 'result'
  | 'records'
  | 'settings'
  | 'howto'
  | 'gacha'
  | 'shinobi-record'
