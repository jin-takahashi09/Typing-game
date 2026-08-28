import { useRef } from 'react'
import { GameButton } from '../components/common/GameButton'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import { calculateKps } from '../utils/calculateTypingStats'
import type { ResultViewModel } from '../types/game'

interface ResultScreenProps {
  result: ResultViewModel
  characterId: string
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
  const { summary, saveError, coinSummary } = result
  const kps = calculateKps(summary.correctChars, summary.elapsedMs)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <section className="panel-glow w-full max-w-md rounded-[var(--radius-xl)] bg-black/90 px-4 py-8 text-center sm:px-6 sm:py-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-6 text-2xl text-[var(--color-accent-red)] outline-none sm:mb-8 sm:text-3xl md:text-4xl"
        >
          TIME UP
        </h1>

        {saveError && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <div
          className="mb-8 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-blue)] bg-slate-800/80 p-5 text-left sm:p-6"
          data-testid="result-summary"
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5">
            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              スコア
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)] sm:text-2xl"
              data-testid="result-score"
            >
              {summary.score}
            </div>

            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              ミス入力数
            </div>
            <div
              className="font-display text-right text-xl text-white sm:text-2xl"
              data-testid="result-miss"
            >
              {summary.missCount}
            </div>

            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              成功率
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)] sm:text-2xl"
              data-testid="result-success-rate"
            >
              {summary.successRate.toFixed(1)}%
            </div>

            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              正しく打ったキー数
            </div>
            <div
              className="font-display text-right text-xl text-white sm:text-2xl"
              data-testid="result-correct-keys"
            >
              {summary.correctChars}
            </div>

            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              平均キータイプ数
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)] sm:text-2xl"
              data-testid="result-kps"
            >
              {kps.toFixed(1)}
              <span className="ml-1 text-sm font-sans font-bold text-[var(--color-text-muted)]">
                KPS
              </span>
            </div>

            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              獲得コイン
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)] sm:text-2xl"
              data-testid="result-total-coins"
            >
              +{coinSummary.totalEarned}
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <GameButton variant="secondary" size="lg" onClick={onRetry}>
            同じ難易度でもう一度
          </GameButton>
          <GameButton variant="primary" onClick={onChangeDifficulty}>
            難易度を変える
          </GameButton>
          <GameButton variant="ghost" onClick={onTitle}>
            タイトルへ戻る
          </GameButton>
        </div>
      </section>
    </main>
  )
}
