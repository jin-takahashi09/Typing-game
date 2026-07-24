interface DefenseGaugeProps {
  defense: number
  maxDefense: number
}

export function DefenseGauge({ defense, maxDefense }: DefenseGaugeProps) {
  const safeDefense = Math.max(0, defense)
  const ratio = maxDefense <= 0 ? 0 : (safeDefense / maxDefense) * 100
  const barColor =
    safeDefense < maxDefense * 0.3
      ? 'bg-red-600 animate-pulse'
      : safeDefense < maxDefense * 0.6
        ? 'bg-orange-500'
        : 'bg-green-500'

  return (
    <div className="pointer-events-none absolute right-2 top-[7.5rem] z-30 flex w-36 flex-col items-end gap-1 sm:right-3 sm:top-28 sm:w-44 md:right-4 md:w-48">
      <div className="flex w-full items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-red-300">
          HP
        </span>
        <span
          className="font-display text-xs text-[var(--color-text-soft)] sm:text-sm"
          data-testid="hp-value"
        >
          {safeDefense} / {maxDefense}
        </span>
      </div>
      <div
        className="relative h-5 w-full overflow-hidden rounded-sm border-2 border-slate-700 bg-red-950 sm:h-6"
        role="meter"
        aria-label="HP"
        aria-valuemin={0}
        aria-valuemax={maxDefense}
        aria-valuenow={safeDefense}
      >
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-200 ${barColor}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  )
}
