interface GameHudProps {
  score: number
  combo: number
  stage: number
  difficultyLabel: string
  showStageUp: boolean
  elapsedLabel: string
  wpm: number
  accuracy: number
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
}: GameHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 md:p-4">
      <div className="flex flex-col gap-2">
        <div className="rounded border border-[var(--color-border-blue)] bg-black/50 px-3 py-2">
          <span className="mr-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-soft)]">
            Score
          </span>
          <span className="font-display text-lg text-[var(--color-accent-yellow)] md:text-xl">
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
          <span className="font-display text-xl italic text-[var(--color-accent-red)] md:text-2xl">
            Combo x{combo}
          </span>
        </div>
        <div className="rounded border border-[var(--color-border-blue)] bg-black/50 px-2 py-1 text-[0.65rem] text-[var(--color-text-soft)] md:text-xs">
          <span className="mr-2">{elapsedLabel}</span>
          <span className="mr-2">WPM {wpm.toFixed(1)}</span>
          <span>ACC {accuracy.toFixed(1)}%</span>
        </div>
      </div>

      <div
        className={[
          'rounded-full border border-[var(--color-border-yellow)] bg-black/50 px-4 py-2 transition-transform',
          showStageUp ? 'scale-125 bg-yellow-600/80' : '',
        ].join(' ')}
      >
        <span className="font-display text-sm text-[var(--color-accent-yellow)] md:text-lg">
          STAGE {stage}
        </span>
      </div>

      <div className="rounded border border-[var(--color-border-blue)] bg-black/50 px-3 py-2 text-right">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Difficulty
        </span>
        <span className="font-display text-sm text-[var(--color-text-soft)]">
          {difficultyLabel}
        </span>
      </div>
    </div>
  )
}
