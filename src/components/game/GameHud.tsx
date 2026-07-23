interface GameHudProps {
  score: number
  combo: number
  stage: number
  difficultyLabel: string
  showStageUp: boolean
  elapsedLabel: string
  wpm: number
  accuracy: number
  onPause?: () => void
}

export function GameHud({
  score,
  combo,
  stage,
  difficultyLabel,
  showStageUp,
  elapsedLabel,
  wpm,
  accuracy,
  onPause,
}: GameHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-start gap-1 p-2 sm:gap-2 sm:p-3 md:p-4">
      <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
        <div className="rounded border border-[var(--color-border-blue)] bg-black/50 px-2 py-1 sm:px-3 sm:py-2">
          <span className="mr-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-soft)] sm:mr-2 sm:text-xs">
            Score
          </span>
          <span className="font-display text-base text-[var(--color-accent-yellow)] sm:text-lg md:text-xl">
            {score}
          </span>
        </div>
        <div
          className={[
            'transition-opacity duration-[var(--duration-fast)]',
            combo > 1 ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-live="polite"
        >
          <span className="font-display text-sm italic text-[var(--color-accent-red)] sm:text-xl md:text-2xl">
            Combo x{combo}
          </span>
        </div>
        <div className="rounded border border-[var(--color-border-blue)] bg-black/50 px-1.5 py-1 text-[0.6rem] leading-tight text-[var(--color-text-soft)] sm:px-2 sm:text-xs">
          <span className="mr-1.5 sm:mr-2">{elapsedLabel}</span>
          <span className="mr-1.5 sm:mr-2">WPM {wpm.toFixed(1)}</span>
          <span>ACC {accuracy.toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <div
          className={[
            'rounded-full border border-[var(--color-border-yellow)] bg-black/50 px-2 py-1 transition-transform sm:px-4 sm:py-2',
            showStageUp ? 'scale-110 bg-yellow-600/80 sm:scale-125' : '',
            'motion-safe-scale',
          ].join(' ')}
        >
          <span className="font-display text-xs text-[var(--color-accent-yellow)] sm:text-sm md:text-lg">
            STAGE {stage}
          </span>
        </div>
        {onPause && (
          <button
            type="button"
            className="pointer-events-auto rounded border border-[var(--color-border-blue)] bg-black/70 px-2 py-1 text-[0.65rem] font-bold text-[var(--color-text-soft)] hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-yellow)] sm:px-3 sm:text-xs"
            onClick={onPause}
            aria-label="ゲームを一時停止"
          >
            一時停止
          </button>
        )}
      </div>

      <div className="min-w-0 justify-self-end rounded border border-[var(--color-border-blue)] bg-black/50 px-2 py-1 text-right sm:px-3 sm:py-2">
        <span className="block text-[0.55rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[0.65rem]">
          Diff
        </span>
        <span className="font-display text-[0.7rem] text-[var(--color-text-soft)] sm:text-sm">
          {difficultyLabel}
        </span>
      </div>
    </div>
  )
}
