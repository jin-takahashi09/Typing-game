interface StageClearCoinPopupProps {
  stage: number
  coins: number
}

export function StageClearCoinPopup({ stage, coins }: StageClearCoinPopupProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1/3 z-40 flex justify-center px-3"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-[var(--radius-lg)] border-2 border-[var(--color-border-yellow)] bg-black/85 px-5 py-4 text-center shadow-2xl motion-safe-scale">
        <p className="font-display text-sm text-[var(--color-accent-yellow)] sm:text-base">
          STAGE {stage} CLEAR
        </p>
        <p className="mt-2 text-base font-bold text-[var(--color-accent-yellow)] sm:text-lg">
          +{coins} コイン
        </p>
      </div>
    </div>
  )
}
