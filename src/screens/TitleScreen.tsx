import { appConfig } from '../config/appConfig'
import { difficultyOrder, getDifficultyConfig } from '../config/difficultyConfig'
import { GameButton } from '../components/common/GameButton'
import type { StoredAppData } from '../types/records'

interface TitleScreenProps {
  storedData: StoredAppData
  onStartTraining: () => void
  onOpenRecords: () => void
}

export function TitleScreen({
  storedData,
  onStartTraining,
  onOpenRecords,
}: TitleScreenProps) {
  const hasBestScores = difficultyOrder.some(
    (id) => storedData.bestByDifficulty[id] !== null,
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section
        className="panel-glow relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] px-6 py-12 text-center md:px-12"
        aria-labelledby="app-title"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><path d='M0 100 L20 60 L40 80 L70 30 L100 90 L100 100 Z' fill='%233498db'/></svg>\")",
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom',
            backgroundSize: '200px 100px',
          }}
          aria-hidden="true"
        />

        <p className="relative mb-3 text-sm tracking-widest text-[var(--color-text-soft)] md:text-base">
          {appConfig.nameJa}
        </p>

        <h1
          id="app-title"
          className="font-display text-glow-yellow relative mb-6 text-3xl leading-tight text-[var(--color-accent-yellow)] md:text-5xl"
        >
          {appConfig.name}
        </h1>

        <p className="relative mb-10 text-lg text-[var(--color-text-soft)] md:text-2xl">
          {appConfig.tagline}
        </p>

        {hasBestScores && (
          <div className="relative mx-auto mb-8 max-w-md rounded border border-[var(--color-border-blue)] bg-black/30 p-3 text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              ベストスコア
            </p>
            <ul className="space-y-1 text-sm">
              {difficultyOrder.map((id) => {
                const best = storedData.bestByDifficulty[id]
                if (!best) {
                  return null
                }
                const config = getDifficultyConfig(id)
                return (
                  <li key={id} className="flex justify-between gap-3 text-[var(--color-text-soft)]">
                    <span>{config.displayName}</span>
                    <span className="font-display text-[var(--color-accent-yellow)]">
                      {best.score}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="relative mb-6 flex justify-center">
          <GameButton size="lg" onClick={onStartTraining}>
            修行を始める
          </GameButton>
        </div>

        <nav
          className="relative mx-auto flex max-w-md flex-col gap-3"
          aria-label="メインメニュー"
        >
          <GameButton variant="secondary" onClick={onOpenRecords}>
            プレイ記録
          </GameButton>
          <GameButton variant="ghost" disabled aria-disabled="true">
            遊び方
            <span className="ml-2 text-[0.65rem] opacity-80">（準備中）</span>
          </GameButton>
          <GameButton variant="ghost" disabled aria-disabled="true">
            設定
            <span className="ml-2 text-[0.65rem] opacity-80">（準備中）</span>
          </GameButton>
        </nav>
      </section>
    </main>
  )
}
