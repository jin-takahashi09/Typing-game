import type { PlayComparison } from '../../types/records'
import { formatDelta } from '../../utils/comparePlay'

interface PlayComparisonPanelProps {
  comparison: PlayComparison
}

export function PlayComparisonPanel({ comparison }: PlayComparisonPanelProps) {
  const hasNewBest =
    comparison.isNewBestScore ||
    comparison.isNewBestWpm ||
    comparison.isNewBestAccuracy

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-yellow)] bg-yellow-950/30 p-4 text-left">
      {hasNewBest && (
        <div className="mb-3 flex flex-wrap gap-2">
          {comparison.isNewBestScore && (
            <span className="rounded-full bg-[var(--color-accent-yellow)] px-3 py-1 text-xs font-bold uppercase text-black">
              NEW BEST SCORE
            </span>
          )}
          {comparison.isNewBestWpm && (
            <span className="rounded-full border border-[var(--color-accent-yellow)] px-3 py-1 text-xs font-bold uppercase text-[var(--color-accent-yellow)]">
              NEW BEST WPM
            </span>
          )}
          {comparison.isNewBestAccuracy && (
            <span className="rounded-full border border-[var(--color-accent-yellow)] px-3 py-1 text-xs font-bold uppercase text-[var(--color-accent-yellow)]">
              NEW BEST ACC
            </span>
          )}
        </div>
      )}

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        前回プレイとの比較
      </h2>

      {!comparison.previous ? (
        <p className="text-sm text-[var(--color-text-soft)]">
          この難易度での初回プレイです。次回から前回との比較が表示されます。
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div>
            <dt className="text-xs uppercase text-[var(--color-text-muted)]">Score</dt>
            <dd className="font-display text-lg text-white">
              {formatDelta(comparison.scoreDelta)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-[var(--color-text-muted)]">WPM</dt>
            <dd className="font-display text-lg text-white">
              {formatDelta(comparison.wpmDelta)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-[var(--color-text-muted)]">ACC</dt>
            <dd className="font-display text-lg text-white">
              {formatDelta(comparison.accuracyDelta, '%')}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
