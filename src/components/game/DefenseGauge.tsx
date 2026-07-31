interface DefenseGaugeProps {
  defense: number
  maxDefense: number
}

export function DefenseGauge({ defense, maxDefense }: DefenseGaugeProps) {
  const ratio = maxDefense > 0 ? Math.max(0, Math.min(1, defense / maxDefense)) : 0
  const percent = Math.round(ratio * 100)

  return (
    <div
      className="pointer-events-none absolute right-2 top-14 z-30 w-[7.5rem] sm:right-3 sm:top-16 sm:w-36 md:right-4 md:top-[4.5rem]"
      data-testid="defense-gauge"
    >
      <div className="mb-0.5 flex items-baseline justify-between gap-1">
        <span className="text-[0.55rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[0.6rem]">
          HP
        </span>
        <span
          className="font-display text-[0.65rem] text-white sm:text-xs"
          data-testid="hp-value"
        >
          {defense} / {maxDefense}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full border border-[var(--color-border-blue)] bg-black/50 sm:h-2"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={maxDefense}
        aria-valuenow={defense}
        aria-label="HP"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent-green)] transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
