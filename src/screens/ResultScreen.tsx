import { getDifficultyConfig } from '../config/difficultyConfig'
import { GameButton } from '../components/common/GameButton'
import { formatElapsedTime } from '../utils/calculateTypingStats'
import type { GameResultSummary } from '../types/game'

interface ResultScreenProps {
  result: GameResultSummary
  onRetry: () => void
  onChangeDifficulty: () => void
  onTitle: () => void
}

export function ResultScreen({
  result,
  onRetry,
  onChangeDifficulty,
  onTitle,
}: ResultScreenProps) {
  const config = getDifficultyConfig(result.difficulty)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section className="panel-glow w-full max-w-lg rounded-[var(--radius-xl)] bg-black/90 px-6 py-10 text-center md:px-10">
        <h1 className="font-display mb-8 text-3xl text-[var(--color-accent-red)] md:text-4xl">
          DEFENSE FAILED
        </h1>

        <div className="mb-8 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-blue)] bg-slate-800/80 p-6 text-left shadow-2xl">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Final Score
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {result.score}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Difficulty
            </div>
            <div className="font-display text-right text-xl text-[var(--color-text-soft)]">
              {config.displayName}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Stage
            </div>
            <div className="font-display text-right text-xl text-white">
              {result.stage}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Words Defeated
            </div>
            <div className="font-display text-right text-xl text-white">
              {result.destroyedTargets}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Max Combo
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-red)]">
              {result.maxCombo}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Play Time
            </div>
            <div className="font-display text-right text-xl text-white">
              {formatElapsedTime(result.elapsedMs)}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Typed Chars
            </div>
            <div className="font-display text-right text-xl text-white">
              {result.typedChars}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Correct Chars
            </div>
            <div className="font-display text-right text-xl text-white">
              {result.correctChars}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Miss Types
            </div>
            <div className="font-display text-right text-xl text-white">
              {result.missCount}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Accuracy
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {result.accuracy.toFixed(1)}%
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              WPM
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {result.wpm.toFixed(1)}
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <GameButton variant="secondary" size="lg" onClick={onRetry}>
            同じ難易度でもう一度
          </GameButton>
          <GameButton variant="primary" onClick={onChangeDifficulty}>
            難易度を変更
          </GameButton>
          <GameButton variant="ghost" onClick={onTitle}>
            タイトルへ戻る
          </GameButton>
        </div>
      </section>
    </main>
  )
}
