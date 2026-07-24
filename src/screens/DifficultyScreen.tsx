import { useRef, useState } from 'react'
import {
  difficultyConfigs,
  difficultyOrder,
} from '../config/difficultyConfig'
import { GameButton } from '../components/common/GameButton'
import { BackButton } from '../components/common/BackButton'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { DifficultyId } from '../types/app'

interface DifficultyScreenProps {
  onBack: () => void
  onStart: (difficulty: DifficultyId) => void | Promise<void>
  initialDifficulty?: DifficultyId
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

export function DifficultyScreen({
  onBack,
  onStart,
  initialDifficulty,
}: DifficultyScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)
  const [selected, setSelected] = useState<DifficultyId | null>(
    initialDifficulty ?? null,
  )

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow w-full max-w-4xl rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] px-3 py-6 sm:px-4 sm:py-8 md:px-8">
        <BackButton onClick={onBack} />
        <header className="mb-6 text-center sm:mb-8">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display mb-3 text-2xl text-[var(--color-accent-yellow)] outline-none md:text-3xl"
          >
            難易度選択
          </h1>
          <p className="text-sm text-[var(--color-text-soft)] sm:text-base">
            修行の道を選べ。カードを選ぶと選択状態が分かります。
          </p>
        </header>

        <div
          className="mb-8 grid gap-3 sm:gap-4 md:grid-cols-3"
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
                  'rounded-[var(--radius-lg)] border-2 bg-black/40 p-4 text-left transition-all sm:p-5',
                  'duration-[var(--duration-normal)] focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-yellow)]',
                  accent.border,
                  isSelected
                    ? `${accent.glow} scale-[1.02] bg-black/55`
                    : 'opacity-85 hover:opacity-100',
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
                <p
                  className="text-sm font-bold text-[var(--color-accent-yellow)]"
                  data-testid={`time-limit-${id}`}
                >
                  制限時間：{config.timeLimitSeconds}秒
                </p>
                {isSelected && (
                  <p className="mt-4 font-display text-xs text-[var(--color-accent-yellow)]">
                    選択中
                  </p>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <GameButton
            variant="secondary"
            size="lg"
            disabled={selected === null}
            onClick={() => {
              if (selected) {
                void onStart(selected)
              }
            }}
          >
            この難易度で開始
          </GameButton>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]" aria-live="polite">
          選択中:{' '}
          {selected ? difficultyConfigs[selected].displayName : '未選択'}
        </p>
      </section>
    </main>
  )
}
