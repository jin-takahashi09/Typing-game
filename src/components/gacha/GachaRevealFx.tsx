import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CharacterRarity } from '../../config/characters'
import { formatRarityLabel } from '../../config/rarityLabels'
import { getSoundManager, type SfxId } from '../../audio/SoundManager'
import type { GachaPullItem } from '../../utils/gacha'
import { CharacterPreview } from '../common/CharacterPreview'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

type RevealPhase =
  | 'dark'
  | 'blackout'
  | 'scroll'
  | 'scroll-open'
  | 'scroll-gold'
  | 'smoke'
  | 'big-smoke'
  | 'electric'
  | 'gold-lightning'
  | 'gold-flash'
  | 'shockwave'
  | 'silhouette'
  | 'crest'
  | 'rainbow-flash'
  | 'silence'
  | 'seal'
  | 'scroll-transform'
  | 'divine-lightning'
  | 'divine-light'
  | 'shinnin-text'
  | 'rarity-text'
  | 'done'

type RevealTier = 'n' | 'r' | 'sr' | 'ssr' | 'ur' | 'shinnin'

interface GachaRevealFxProps {
  items: GachaPullItem[]
  peakRarity: CharacterRarity
  reducedMotion: boolean
  /** 演出完了（スキップ含む）。結果モーダル表示へ進む */
  onComplete: () => void
}

function tierFromRarity(rarity: CharacterRarity): RevealTier {
  if (rarity === 'SHINNIN') {
    return 'shinnin'
  }
  return rarity.toLowerCase() as RevealTier
}

function buildPhases(
  peakRarity: CharacterRarity,
  reducedMotion: boolean,
): RevealPhase[] {
  if (reducedMotion) {
    if (peakRarity === 'SHINNIN') {
      return ['blackout', 'silence', 'seal', 'shinnin-text', 'rarity-text', 'done']
    }
    if (peakRarity === 'UR') {
      return ['blackout', 'crest', 'rarity-text', 'done']
    }
    if (peakRarity === 'SSR') {
      return ['dark', 'electric', 'rarity-text', 'done']
    }
    if (peakRarity === 'SR') {
      return ['dark', 'electric', 'rarity-text', 'done']
    }
    return ['dark', 'smoke', 'rarity-text', 'done']
  }

  if (peakRarity === 'SHINNIN') {
    return [
      'blackout',
      'silence',
      'seal',
      'scroll-transform',
      'divine-lightning',
      'big-smoke',
      'divine-light',
      'crest',
      'shinnin-text',
      'silhouette',
      'rarity-text',
      'done',
    ]
  }

  if (peakRarity === 'UR') {
    return [
      'blackout',
      'gold-lightning',
      'crest',
      'scroll-gold',
      'big-smoke',
      'rainbow-flash',
      'silhouette',
      'rarity-text',
      'done',
    ]
  }

  if (peakRarity === 'SSR') {
    return [
      'scroll',
      'blackout',
      'electric',
      'gold-flash',
      'scroll-gold',
      'big-smoke',
      'shockwave',
      'silhouette',
      'rarity-text',
      'done',
    ]
  }

  if (peakRarity === 'SR') {
    return [
      'dark',
      'scroll',
      'smoke',
      'electric',
      'silhouette',
      'rarity-text',
      'done',
    ]
  }

  // N / R
  return [
    'dark',
    'scroll',
    'scroll-open',
    'smoke',
    'silhouette',
    'rarity-text',
    'done',
  ]
}

function phaseDurationMs(phase: RevealPhase, reducedMotion: boolean): number {
  if (phase === 'done') {
    return 0
  }
  if (reducedMotion) {
    return phase === 'blackout' || phase === 'dark' ? 160 : 140
  }
  switch (phase) {
    case 'dark':
      return 220
    case 'blackout':
      return 280
    case 'scroll':
      return 320
    case 'scroll-open':
      return 360
    case 'scroll-gold':
      return 340
    case 'smoke':
      return 300
    case 'big-smoke':
      return 380
    case 'electric':
      return 560
    case 'gold-lightning':
      return 520
    case 'gold-flash':
      return 320
    case 'shockwave':
      return 300
    case 'silhouette':
      return 320
    case 'crest':
      return 360
    case 'rainbow-flash':
      return 340
    case 'silence':
      return reducedMotion ? 140 : 400
    case 'seal':
      return reducedMotion ? 160 : 480
    case 'scroll-transform':
      return 420
    case 'divine-lightning':
      return 620
    case 'divine-light':
      return 380
    case 'shinnin-text':
      return 420
    case 'rarity-text':
      return 300
  }
}

function sfxForRarity(rarity: CharacterRarity): SfxId | null {
  if (rarity === 'SHINNIN' || rarity === 'UR') return 'gachaUr'
  if (rarity === 'SSR') return 'gachaSsr'
  if (rarity === 'SR') return 'gachaSr'
  return null
}

/** Static SVG bolts — positions/delays via CSS only (no React coordinate state). */
function LightningLayer({ tier }: { tier: 'sr' | 'ssr' | 'ur' | 'shinnin' }) {
  const boltPath =
    'M52 4 L28 48 L44 48 L22 96 L68 40 L48 40 L72 4 Z'
  return (
    <div
      className={`gacha-lightning gacha-lightning--${tier}`}
      data-testid="gacha-lightning"
      aria-hidden="true"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`gacha-lightning__bolt gacha-lightning__bolt--${n}`}
          viewBox="0 0 96 100"
          width="64"
          height="72"
        >
          <path d={boltPath} />
        </svg>
      ))}
      {(tier === 'ssr' || tier === 'ur' || tier === 'shinnin') &&
        [1, 2, 3].map((n) => (
          <svg
            key={`gold-${n}`}
            className={`gacha-lightning__bolt gacha-lightning__bolt--gold gacha-lightning__bolt--gold-${n}`}
            viewBox="0 0 96 100"
            width="72"
            height="80"
          >
            <path d={boltPath} />
          </svg>
        ))}
    </div>
  )
}

function ElectricAura({ tier }: { tier: 'sr' | 'ssr' | 'ur' | 'shinnin' }) {
  return (
    <div
      className={`gacha-electric gacha-electric--${tier}`}
      data-testid="gacha-electric"
      aria-hidden="true"
    >
      <span className="gacha-electric__spark gacha-electric__spark--1" />
      <span className="gacha-electric__spark gacha-electric__spark--2" />
      <span className="gacha-electric__spark gacha-electric__spark--3" />
      <span className="gacha-electric__ring" />
    </div>
  )
}

export function GachaRevealFx({
  items,
  peakRarity,
  reducedMotion,
  onComplete,
}: GachaRevealFxProps) {
  const [phases] = useState(() => buildPhases(peakRarity, reducedMotion))
  const [index, setIndex] = useState(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const sfxPlayedRef = useRef(false)
  const phase = phases[Math.min(index, phases.length - 1)] ?? 'done'
  const tier = tierFromRarity(peakRarity)
  const rareTier =
    tier === 'sr' || tier === 'ssr' || tier === 'ur' || tier === 'shinnin'
      ? tier
      : null

  useBodyScrollLock(true)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const finish = () => {
    if (completedRef.current) {
      return
    }
    completedRef.current = true
    onCompleteRef.current()
  }

  useEffect(() => {
    if (phase === 'done') {
      finish()
      return
    }
    const timer = window.setTimeout(() => {
      setIndex((value) => Math.min(value + 1, phases.length - 1))
    }, phaseDurationMs(phase, reducedMotion))
    return () => window.clearTimeout(timer)
  }, [phase, phases.length, reducedMotion])

  useEffect(() => {
    if (sfxPlayedRef.current) {
      return
    }
    const shouldPlay =
      phase === 'electric' ||
      phase === 'gold-lightning' ||
      phase === 'divine-lightning' ||
      (reducedMotion && rareTier !== null && phase === 'crest')
    if (!shouldPlay) {
      return
    }
    const sfx = sfxForRarity(peakRarity)
    if (sfx) {
      sfxPlayedRef.current = true
      getSoundManager().playSfx(sfx)
    }
  }, [phase, peakRarity, reducedMotion, rareTier])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const firstItem = items[0]
  const showSilhouette =
    phase === 'silhouette' ||
    phase === 'rarity-text' ||
    (reducedMotion &&
      (phase === 'smoke' || phase === 'electric' || phase === 'crest' || phase === 'seal'))
  const showSmoke =
    phase === 'smoke' || phase === 'big-smoke' || phase === 'divine-lightning'
  const showScroll =
    phase === 'scroll' ||
    phase === 'scroll-open' ||
    phase === 'scroll-gold' ||
    phase === 'scroll-transform' ||
    (rareTier === 'sr' && phase === 'electric')
  const showLightning =
    phase === 'electric' ||
    phase === 'gold-lightning' ||
    phase === 'divine-lightning' ||
    phase === 'gold-flash' ||
    phase === 'silhouette' ||
    (reducedMotion && rareTier !== null && phase === 'crest')
  const showElectricAura =
    rareTier !== null &&
    (phase === 'electric' ||
      phase === 'gold-lightning' ||
      phase === 'divine-lightning' ||
      phase === 'silhouette' ||
      phase === 'rarity-text' ||
      phase === 'shinnin-text' ||
      phase === 'gold-flash' ||
      phase === 'shockwave' ||
      phase === 'rainbow-flash' ||
      phase === 'divine-light' ||
      (reducedMotion && phase === 'crest'))

  if (typeof document === 'undefined' || phase === 'done') {
    return null
  }

  return createPortal(
    <div
      className={[
        'gacha-portal',
        'gacha-reveal',
        `gacha-reveal--${phase}`,
        `gacha-reveal--${tier}`,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-reveal"
      data-phase={phase}
      data-peak-rarity={peakRarity}
      role="presentation"
    >
      <div className="gacha-reveal__backdrop" aria-hidden="true" />

      <div className="gacha-reveal__stage" aria-hidden="true">
        {showScroll && (
          <div
            className={[
              'gacha-reveal__scroll',
              phase === 'scroll-open' ? 'gacha-reveal__scroll--open' : '',
              phase === 'scroll-gold' ? 'gacha-reveal__scroll--gold' : '',
              phase === 'scroll-transform' ? 'gacha-reveal__scroll--transform' : '',
              rareTier === 'sr' && (phase === 'scroll' || phase === 'electric')
                ? 'gacha-reveal__scroll--sr-glow'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )}
        {showSmoke && (
          <div
            className={[
              'gacha-reveal__smoke',
              phase === 'big-smoke' || tier === 'ssr' || tier === 'ur' || tier === 'shinnin'
                ? 'gacha-reveal__smoke--big'
                : '',
              reducedMotion ? 'gacha-reveal__smoke--static' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )}
        {showLightning && rareTier && <LightningLayer tier={rareTier} />}
        {showElectricAura && rareTier && (
          <div className="gacha-reveal__charge-zone">
            <ElectricAura tier={rareTier} />
          </div>
        )}
        {phase === 'silence' && (
          <div className="gacha-reveal__silence" data-testid="gacha-silence" aria-hidden="true" />
        )}
        {phase === 'seal' && (
          <div className="gacha-reveal__seal" data-testid="gacha-seal" aria-hidden="true">
            <span className="gacha-reveal__seal-mark">印</span>
          </div>
        )}
        {phase === 'divine-light' && (
          <div className="gacha-reveal__divine-light" data-testid="gacha-divine-light" />
        )}
        {phase === 'shinnin-text' && (
          <p className="gacha-reveal__shinnin-banner" data-testid="gacha-shinnin-banner">
            神忍
          </p>
        )}
        {phase === 'gold-flash' && (
          <div className="gacha-reveal__gold-flash" data-testid="gacha-gold-flash" />
        )}
        {phase === 'shockwave' && (
          <div className="gacha-reveal__shockwave" data-testid="gacha-shockwave" />
        )}
        {phase === 'rainbow-flash' && (
          <div className="gacha-reveal__rainbow" data-testid="gacha-rainbow" />
        )}
        {phase === 'crest' && (
          <div className="gacha-reveal__crest" data-testid="gacha-crest" />
        )}
        {showSilhouette && firstItem && (
          <div
            key="gacha-reveal-character"
            className={[
              'gacha-reveal__silhouette',
              rareTier
                ? `gacha-reveal__silhouette--charged gacha-reveal__silhouette--${rareTier}`
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <CharacterPreview
              characterId={firstItem.characterId}
              size="gacha-result"
              figureVariant="gacha-result"
              showIdleEffects={false}
            />
          </div>
        )}
        {phase === 'rarity-text' && (
          <p
            className={[
              'gacha-reveal__rarity-banner',
              `gacha-reveal__rarity-banner--${tier}`,
            ].join(' ')}
            data-testid="gacha-rarity-banner"
          >
            {formatRarityLabel(peakRarity)}
          </p>
        )}
        {reducedMotion && rareTier === 'ssr' && phase === 'electric' && (
          <div className="gacha-reveal__rm-ssr-mark" aria-hidden="true">
            ⚡
          </div>
        )}
      </div>

      <button
        type="button"
        className="gacha-reveal__skip"
        data-testid="gacha-reveal-skip"
        onClick={finish}
      >
        スキップ
      </button>
    </div>,
    document.body,
  )
}
