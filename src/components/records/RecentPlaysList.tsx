import { getDifficultyConfig } from '../../config/difficultyConfig'
import { resolveCharacter } from '../../config/characters'
import type { PlayRecord } from '../../types/records'

interface RecentPlaysListProps {
  plays: readonly PlayRecord[]
}

function formatPlayedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecentPlaysList({ plays }: RecentPlaysListProps) {
  if (plays.length === 0) {
    return (
      <section className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-blue)] bg-slate-900/50 p-6 text-center">
        <p className="text-sm text-[var(--color-text-soft)]">
          まだプレイ履歴がありません。
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          修行を始めて記録を残しましょう。
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        最近のプレイ
      </h2>
      <ul className="space-y-2">
        {plays.map((play) => {
          const config = getDifficultyConfig(play.difficulty)
          const character = resolveCharacter(play.characterId)
          return (
            <li
              key={play.id}
              className="rounded border border-[var(--color-border-blue)] bg-black/40 px-3 py-2"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                <span>
                  {config.displayName} / {character.name}
                </span>
                <time dateTime={play.playedAt}>{formatPlayedAt(play.playedAt)}</time>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-[0.65rem] text-[var(--color-text-muted)]">Score</dt>
                  <dd className="font-display text-[var(--color-accent-yellow)]">{play.score}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] text-[var(--color-text-muted)]">WPM</dt>
                  <dd className="font-display text-white">{play.wpm.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] text-[var(--color-text-muted)]">ACC</dt>
                  <dd className="font-display text-white">{play.accuracy.toFixed(1)}%</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
