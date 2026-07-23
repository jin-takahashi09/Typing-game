import { difficultyOrder, getDifficultyConfig } from '../../config/difficultyConfig'
import type { StoredAppData } from '../../types/records'

interface BestScoreCardProps {
  data: StoredAppData
}

export function BestScoreCard({ data }: BestScoreCardProps) {
  return (
    <section className="mb-6 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-blue)] bg-slate-800/80 p-4">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        難易度別ベスト
      </h2>
      <div className="grid gap-3">
        {difficultyOrder.map((id) => {
          const config = getDifficultyConfig(id)
          const best = data.bestByDifficulty[id]
          return (
            <div
              key={id}
              className="rounded border border-[var(--color-border-blue)] bg-black/40 px-3 py-2"
            >
              <div className="mb-1 text-xs font-bold uppercase text-[var(--color-text-soft)]">
                {config.displayName}
              </div>
              {best ? (
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-[0.65rem] text-[var(--color-text-muted)]">Score</dt>
                    <dd className="font-display text-[var(--color-accent-yellow)]">{best.score}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] text-[var(--color-text-muted)]">WPM</dt>
                    <dd className="font-display text-white">{best.wpm.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] text-[var(--color-text-muted)]">ACC</dt>
                    <dd className="font-display text-white">{best.accuracy.toFixed(1)}%</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">記録なし</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
