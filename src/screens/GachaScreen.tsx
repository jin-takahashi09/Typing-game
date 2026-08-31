import { useCallback, useRef, useState } from 'react'
import type { CharacterRarity } from '../config/characters'
import { gachaConfig, RARITY_ORDER, formatRatePercent } from '../config/gachaConfig'
import { formatRarityLabel } from '../config/rarityLabels'
import { BackButton } from '../components/common/BackButton'
import { GachaScrollShrine } from '../components/gacha/GachaScrollShrine'
import { GachaRevealFx } from '../components/gacha/GachaRevealFx'
import { GachaResultModal } from '../components/gacha/GachaResultModal'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { GachaPullItem, GachaPullType } from '../utils/gacha'

type GachaPhase = 'idle' | 'machine' | 'reveal' | 'result'

interface GachaScreenProps {
  error: string | null
  coins: number
  reducedMotion: boolean
  onBack: () => void
  onPull: (pullType: GachaPullType) => {
    ok: boolean
    items?: GachaPullItem[]
    peakRarity?: CharacterRarity
  }
}

export function GachaScreen({
  error,
  coins,
  reducedMotion,
  onBack,
  onPull,
}: GachaScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  const [phase, setPhase] = useState<GachaPhase>('idle')
  const [revealItems, setRevealItems] = useState<GachaPullItem[] | null>(null)
  const [peakRarity, setPeakRarity] = useState<CharacterRarity>('N')
  const [activePullType, setActivePullType] = useState<GachaPullType>('single')
  const pullingRef = useRef(false)

  const busy = phase !== 'idle'

  const handlePull = useCallback(
    (pullType: GachaPullType) => {
      if (pullingRef.current || busy) {
        return
      }
      pullingRef.current = true
      try {
        const result = onPull(pullType)
        if (!result.ok || !result.items?.length) {
          return
        }
        setActivePullType(pullType)
        setPeakRarity(result.peakRarity ?? 'N')
        setRevealItems(result.items)
        setPhase('machine')
      } finally {
        pullingRef.current = false
      }
    },
    [busy, onPull],
  )

  const handleMachineComplete = useCallback(() => {
    setPhase('reveal')
  }, [])

  const handleRevealComplete = useCallback(() => {
    setPhase('result')
  }, [])

  const handleResultClose = useCallback(() => {
    setRevealItems(null)
    setPhase('idle')
  }, [])

  const canSingle = coins >= gachaConfig.singleCost
  const canMulti = coins >= gachaConfig.multiCost

  return (
    <main className="gacha-corner-screen flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-3 sm:px-4 sm:py-5">
      <section className="panel-glow gacha-corner-panel w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-4 py-4 sm:px-6 sm:py-5">
        <BackButton onClick={onBack} className="gacha-back-btn" />

        <header className="mb-2 text-center">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl"
          >
            忍びの巻物抽選
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            所持コイン{' '}
            <span
              className="font-display text-[var(--color-accent-yellow)]"
              data-testid="gacha-coins"
            >
              {coins}
            </span>
          </p>
        </header>

        {error && (
          <p
            className="mb-3 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-center text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="gacha-corner-stage">
          <GachaScrollShrine
            active={phase === 'machine'}
            peakRarity={peakRarity}
            pullType={activePullType}
            reducedMotion={reducedMotion}
            onComplete={handleMachineComplete}
          />
        </div>

        <div className="gacha-corner-actions">
          <button
            type="button"
            className="gacha-pull-btn gacha-pull-btn--single"
            disabled={!canSingle || busy}
            onClick={() => handlePull('single')}
            data-testid="gacha-single"
          >
            <span className="gacha-pull-btn__label">単発</span>
            <span className="gacha-pull-btn__cost">
              {gachaConfig.singleCost}コイン
            </span>
          </button>
          <button
            type="button"
            className="gacha-pull-btn gacha-pull-btn--multi"
            disabled={!canMulti || busy}
            onClick={() => handlePull('multi')}
            data-testid="gacha-multi"
          >
            <span className="gacha-pull-btn__label">10連</span>
            <span className="gacha-pull-btn__cost">
              {gachaConfig.multiCost}コイン
            </span>
          </button>
        </div>

        <aside
          className="gacha-rates"
          data-testid="gacha-rates"
          aria-label="排出率"
        >
          <span className="gacha-rates__label">※ 排出率</span>
          <ul className="gacha-rates__list">
            {RARITY_ORDER.map((rarity) => (
              <li
                key={rarity}
                className={[
                  'gacha-rates__item',
                  `gacha-rates__item--${rarity.toLowerCase()}`,
                ].join(' ')}
              >
                {formatRarityLabel(rarity)}{' '}
                {formatRatePercent(rarity)}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {phase === 'reveal' && revealItems && (
        <GachaRevealFx
          items={revealItems}
          peakRarity={peakRarity}
          reducedMotion={reducedMotion}
          onComplete={handleRevealComplete}
        />
      )}

      {phase === 'result' && revealItems && (
        <GachaResultModal
          items={revealItems}
          peakRarity={peakRarity}
          onClose={handleResultClose}
        />
      )}

      <span className="sr-only" data-testid="gacha-phase" data-phase={phase}>
        {phase}
      </span>
    </main>
  )
}
