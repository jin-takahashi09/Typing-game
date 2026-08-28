import { useRef } from 'react'
import { appConfig } from '../config/appConfig'
import { difficultyOrder, getDifficultyConfig } from '../config/difficultyConfig'
import { getCharacterById, DEFAULT_CHARACTER_ID, formatAbilityShort } from '../config/characters'
import { GameButton } from '../components/common/GameButton'
import { CharacterPreview } from '../components/common/CharacterPreview'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { StoredAppData } from '../types/records'

interface TitleScreenProps {
  storedData: StoredAppData
  onStartTraining: () => void
  onOpenRecords: () => void
  onOpenGacha: () => void
  onOpenShinobiRecord: () => void
  onOpenSettings: () => void
  onOpenHowTo: () => void
}

export function TitleScreen({
  storedData,
  onStartTraining,
  onOpenRecords,
  onOpenGacha,
  onOpenShinobiRecord,
  onOpenSettings,
  onOpenHowTo,
}: TitleScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  const hasBestScores = difficultyOrder.some(
    (id) => storedData.bestByDifficulty[id] !== null,
  )
  const selectedCharacter =
    getCharacterById(storedData.economy.selectedCharacterId) ??
    getCharacterById(DEFAULT_CHARACTER_ID)!

  return (
    <main className="title-screen flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8">
      <section
        className="panel-glow title-panel relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] px-4 py-8 text-center sm:px-6 sm:py-10"
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
          ref={headingRef}
          id="app-title"
          tabIndex={-1}
          className="font-display text-glow-yellow relative mb-4 text-3xl leading-tight text-[var(--color-accent-yellow)] outline-none md:text-5xl"
        >
          {appConfig.name}
        </h1>

        <p className="relative mb-5 text-base text-[var(--color-text-soft)] sm:text-lg">
          {appConfig.tagline}
        </p>

        <div className="relative mx-auto mb-5 flex flex-col items-center gap-2">
          <div data-testid="title-selected-character">
            <CharacterPreview characterId={selectedCharacter.id} size="lg" />
          </div>
          <p
            className="text-sm text-[var(--color-text-soft)]"
            data-testid="title-selected-name"
          >
            {selectedCharacter.name}
          </p>
          <p className="text-xs text-[var(--color-accent-yellow)] sm:text-sm">
            {formatAbilityShort(selectedCharacter.ability)}
          </p>
          <p
            className="font-display text-sm text-[var(--color-accent-yellow)]"
            data-testid="title-coins"
          >
            コイン {storedData.economy.coins}
          </p>
        </div>

        {hasBestScores && (
          <div className="relative mx-auto mb-6 max-w-md rounded border border-[var(--color-border-blue)] bg-black/30 p-3 text-left">
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

        <div className="relative mb-5 flex justify-center">
          <GameButton size="lg" onClick={onStartTraining}>
            修行を始める
          </GameButton>
        </div>

        <nav
          className="title-nav relative mx-auto grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2"
          aria-label="メインメニュー"
        >
          <GameButton variant="secondary" onClick={onOpenGacha}>
            ガチャ
          </GameButton>
          <GameButton variant="secondary" onClick={onOpenRecords}>
            プレイ記録
          </GameButton>
          <GameButton
            variant="secondary"
            onClick={onOpenShinobiRecord}
            data-testid="title-open-shinobi-record"
          >
            忍録
          </GameButton>
          <GameButton variant="ghost" onClick={onOpenHowTo}>
            遊び方
          </GameButton>
          <GameButton variant="ghost" onClick={onOpenSettings}>
            設定
          </GameButton>
        </nav>
      </section>
    </main>
  )
}
