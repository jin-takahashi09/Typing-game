import { useRef } from 'react'
import { getDifficultyConfig } from '../config/difficultyConfig'
import { GameButton } from '../components/common/GameButton'
import { PlayComparisonPanel } from '../components/records/PlayComparisonPanel'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import { formatElapsedTime } from '../utils/calculateTypingStats'
import type { ResultViewModel } from '../types/game'

interface ResultScreenProps {
  result: ResultViewModel
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
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)
  const { summary, comparison, saveError } = result
  const config = getDifficultyConfig(summary.difficulty)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <section className="panel-glow w-full max-w-lg rounded-[var(--radius-xl)] bg-black/90 px-4 py-8 text-center sm:px-6 sm:py-10 md:px-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-6 text-2xl text-[var(--color-accent-red)] outline-none sm:mb-8 sm:text-3xl md:text-4xl"
        >
          DEFENSE FAILED
        </h1>

        <PlayComparisonPanel comparison={comparison} />

        {saveError && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <div className="mb-8 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-blue)] bg-slate-800/80 p-6 text-left shadow-2xl">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Final Score
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {summary.score}
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
              {summary.stage}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Words Defeated
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.destroyedTargets}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Max Combo
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-red)]">
              {summary.maxCombo}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Play Time
            </div>
            <div className="font-display text-right text-xl text-white">
              {formatElapsedTime(summary.elapsedMs)}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Typed Chars
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.typedChars}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Correct Chars
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.correctChars}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Miss Types
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.missCount}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              Accuracy
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {summary.accuracy.toFixed(1)}%
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              WPM
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {summary.wpm.toFixed(1)}
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
