import { useState } from 'react'
import {
  difficultyConfigs,
  difficultyOrder,
} from '../config/difficultyConfig'
import { GameButton } from '../components/common/GameButton'
import type { DifficultyId } from '../types/app'

interface DifficultyScreenProps {
  onBack: () => void
}

const accentByDifficulty: Record<
  DifficultyId,
  { border: string; glow: string; badge: string }
> = {
  trainee: {
    border: 'border-[var(--color-success)]',
    glow: 'shadow-[0_0_18px_rgb(34_197_94_/_0.35)]',
    badge: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  },
  ninja: {
    border: 'border-[var(--color-accent-blue)]',
    glow: 'shadow-[0_0_18px_rgb(52_152_219_/_0.45)]',
    badge: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]',
  },
  master: {
    border: 'border-[var(--color-accent-red)]',
    glow: 'shadow-[0_0_18px_rgb(231_76_60_/_0.45)]',
    badge: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]',
  },
}

export function DifficultyScreen({ onBack }: DifficultyScreenProps) {
  const [selected, setSelected] = useState<DifficultyId>('ninja')

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <section className="panel-glow w-full max-w-4xl rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] px-4 py-8 md:px-8">
        <header className="mb-8 text-center">
          <h1 className="font-display mb-3 text-2xl text-[var(--color-accent-yellow)] md:text-3xl">
            難易度選択
          </h1>
          <p className="text-[var(--color-text-soft)]">
            修行の道を選べ。カードを選ぶと選択状態が分かります。
          </p>
        </header>

        <div
          className="mb-8 grid gap-4 md:grid-cols-3"
          role="radiogroup"
          aria-label="難易度"
        >
          {difficultyOrder.map((id) => {
            const config = difficultyConfigs[id]
            const accent = accentByDifficulty[id]
            const isSelected = selected === id

            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(id)}
                className={[
                  'rounded-[var(--radius-lg)] border-2 bg-black/40 p-5 text-left transition-all',
                  'duration-[var(--duration-normal)] focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-yellow)]',
                  accent.border,
                  isSelected ? `${accent.glow} scale-[1.02] bg-black/55` : 'opacity-85 hover:opacity-100',
                ].join(' ')}
              >
                <span
                  className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${accent.badge}`}
                >
                  {config.displayName}
                </span>
                <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-soft)]">
                  {config.description}
                </p>
                <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <dt className="uppercase tracking-wide">落下</dt>
                    <dd className="font-display text-[var(--color-accent-yellow)]">
                      {config.fallSpeed.toFixed(1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">同時数</dt>
                    <dd className="font-display text-[var(--color-accent-yellow)]">
                      {config.maxActiveTargets}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">出現</dt>
                    <dd className="font-display text-[var(--color-accent-yellow)]">
                      {config.spawnIntervalMs}ms
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">文字数</dt>
                    <dd className="font-display text-[var(--color-accent-yellow)]">
                      {config.minChars}–{config.maxChars}
                    </dd>
                  </div>
                </dl>
                {isSelected && (
                  <p className="mt-4 font-display text-xs text-[var(--color-accent-yellow)]">
                    SELECTED
                  </p>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <GameButton variant="ghost" onClick={onBack}>
            タイトルへ戻る
          </GameButton>
          <GameButton
            variant="secondary"
            disabled
            aria-disabled="true"
            title="Phase 2 でゲーム画面へ接続します"
          >
            この難易度で開始
            <span className="ml-2 text-[0.65rem] opacity-80">（Phase 2）</span>
          </GameButton>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          選択中: {difficultyConfigs[selected].displayName}
        </p>
      </section>
    </main>
  )
}
