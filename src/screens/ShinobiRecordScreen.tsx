import { useRef } from 'react'
import { characters } from '../config/characters'
import { BackButton } from '../components/common/BackButton'
import { ShinobiRecordPanel } from '../components/shinobi-record/ShinobiRecordPanel'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { StoredEconomy } from '../types/records'

interface ShinobiRecordScreenProps {
  economy: StoredEconomy
  error: string | null
  onBack: () => void
  onSelect: (characterId: string) => boolean
}

export function ShinobiRecordScreen({
  economy,
  error,
  onBack,
  onSelect,
}: ShinobiRecordScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  const ownedCount = economy.ownedCharacterIds.length
  const totalCount = characters.length

  return (
    <main className="shinobi-record-screen flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow shinobi-record-page w-full max-w-5xl rounded-[var(--radius-xl)] bg-black/90 px-4 py-5 sm:px-6 sm:py-7">
        <BackButton onClick={onBack} />

        <header className="shinobi-record-page__header mb-5 text-center">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl"
            data-testid="shinobi-record-title"
          >
            忍録
          </h1>
          <p
            className="mt-1 font-display text-sm text-[var(--color-accent-yellow)]"
            data-testid="shinobi-record-owned-count"
          >
            {ownedCount} / {totalCount}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
            里に集いし忍たち
          </p>
        </header>

        {error && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-center text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <ShinobiRecordPanel economy={economy} onSelect={onSelect} hideHeader />
      </section>
    </main>
  )
}
