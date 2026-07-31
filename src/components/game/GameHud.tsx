interface GameHudProps {
  score: number
  combo: number
  showScoreAbilityHint?: boolean
  remainingLabel: string
  remainingUrgent?: boolean
  wpm: number
  coins: number
  coinGainFlash?: number | null
  onPause?: () => void
}

/** HUD は小さく。問題表示を最優先で目立たせる */
export function GameHud({
  score,
  combo,
  showScoreAbilityHint = false,
  remainingLabel,
  remainingUrgent = false,
  wpm,
  coins,
  coinGainFlash = null,
  onPause,
}: GameHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-start gap-1 p-1.5 sm:gap-1.5 sm:p-2 md:p-3">
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <div className="relative rounded border border-[var(--color-border-blue)] bg-black/45 px-1.5 py-0.5 sm:px-2 sm:py-1">
          <span className="mr-1 text-[0.55rem] font-bold uppercase tracking-wider text-[var(--color-text-soft)] sm:text-[0.65rem]">
            Score
          </span>
          <span
            className="font-display text-sm text-[var(--color-accent-yellow)] sm:text-base"
            data-testid="hud-score"
          >
            {score}
          </span>
          {showScoreAbilityHint && (
            <span
              className="ability-float-text ability-float-text--fire absolute -right-1 top-full mt-1 whitespace-nowrap text-[0.55rem] sm:text-[0.65rem]"
              role="status"
            >
              紅蓮 +10%
            </span>
          )}
        </div>
        <div
          className={[
            'transition-opacity duration-[var(--duration-fast)]',
            combo > 1 ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-live="polite"
        >
          <span className="font-display text-xs italic text-[var(--color-accent-red)] sm:text-sm">
            Combo x{combo}
          </span>
        </div>
        <div className="rounded border border-[var(--color-border-blue)] bg-black/45 px-1.5 py-0.5 text-[0.55rem] text-[var(--color-text-soft)] sm:text-[0.65rem]">
          WPM {wpm.toFixed(1)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <div
          className={[
            'rounded border px-1.5 py-0.5 text-[0.6rem] font-bold sm:px-2.5 sm:text-xs',
            remainingUrgent
              ? 'border-[var(--color-border-red)] bg-red-950/50 text-[var(--color-accent-red)]'
              : 'border-[var(--color-border-yellow)] bg-black/45 text-[var(--color-accent-yellow)]',
          ].join(' ')}
          data-testid="remaining-time"
          aria-live="polite"
        >
          残り {remainingLabel}
        </div>
        {onPause && (
          <button
            type="button"
            className="pointer-events-auto rounded border border-[var(--color-border-blue)] bg-black/70 px-1.5 py-0.5 text-[0.55rem] font-bold text-[var(--color-text-soft)] hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-yellow)] sm:px-2.5 sm:text-[0.65rem]"
            onClick={onPause}
            aria-label="ゲームを一時停止"
          >
            一時停止
          </button>
        )}
      </div>

      <div className="min-w-0 justify-self-end space-y-0.5 text-right sm:space-y-1">
        <div
          className="relative rounded border border-[var(--color-border-yellow)] bg-black/45 px-1.5 py-0.5 sm:px-2 sm:py-1"
          data-testid="owned-coins"
        >
          <span className="block text-[0.5rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[0.55rem]">
            所持コイン
          </span>
          <span className="font-display text-xs text-[var(--color-accent-yellow)] sm:text-sm">
            {coins}
          </span>
          {coinGainFlash !== null && coinGainFlash > 0 && (
            <span
              className="ability-float-text ability-float-text--fire absolute -bottom-5 right-0 text-[0.65rem] font-bold text-[var(--color-accent-yellow)]"
              role="status"
              data-testid="coin-gain-flash"
            >
              +{coinGainFlash}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
