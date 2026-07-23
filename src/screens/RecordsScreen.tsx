import { GameButton } from '../components/common/GameButton'
import { BestScoreCard } from '../components/records/BestScoreCard'
import { RecentPlaysList } from '../components/records/RecentPlaysList'
import type { StoredAppData } from '../types/records'

interface RecordsScreenProps {
  data: StoredAppData
  onBack: () => void
}

export function RecordsScreen({ data, onBack }: RecordsScreenProps) {
  const hasAnyRecord =
    data.aggregates.totalPlays > 0 ||
    data.recentPlays.length > 0 ||
    Object.values(data.bestByDifficulty).some((best) => best !== null)

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <section className="panel-glow w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-6 py-8 md:px-10">
        <h1 className="font-display mb-6 text-center text-3xl text-[var(--color-accent-yellow)] md:text-4xl">
          プレイ記録
        </h1>

        {!hasAnyRecord ? (
          <div className="mb-8 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-blue)] bg-slate-900/50 p-8 text-center">
            <p className="text-base text-[var(--color-text-soft)]">
              まだ記録がありません。
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              ゲームをプレイすると、ベストスコアと履歴がここに表示されます。
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-blue)] bg-slate-800/80 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                総プレイ回数
              </p>
              <p className="font-display text-3xl text-white">{data.aggregates.totalPlays}</p>
            </div>

            <BestScoreCard data={data} />

            <RecentPlaysList plays={data.recentPlays} />
          </>
        )}

        <div className="mt-8">
          <GameButton variant="ghost" onClick={onBack}>
            タイトルへ戻る
          </GameButton>
        </div>
      </section>
    </main>
  )
}
