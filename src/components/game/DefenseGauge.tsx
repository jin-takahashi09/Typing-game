interface DefenseGaugeProps {
  defense: number
  maxDefense: number
}

export function DefenseGauge({ defense, maxDefense }: DefenseGaugeProps) {
  const ratio = maxDefense <= 0 ? 0 : (defense / maxDefense) * 100
  const barColor =
    defense < maxDefense * 0.3
      ? 'bg-red-600 animate-pulse'
      : defense < maxDefense * 0.6
        ? 'bg-orange-500'
        : 'bg-green-500'

  return (
    <div className="pointer-events-none absolute right-3 top-24 z-30 flex w-40 flex-col items-end gap-1 md:right-4 md:w-48">
      <span className="text-xs font-bold uppercase tracking-wider text-red-300">
        Defense Wall
      </span>
      <div
        className="relative h-6 w-full overflow-hidden rounded-sm border-2 border-slate-700 bg-red-950"
        role="meter"
        aria-label="防衛壁"
        aria-valuemin={0}
        aria-valuemax={maxDefense}
        aria-valuenow={defense}
      >
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-200 ${barColor}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  )
}
