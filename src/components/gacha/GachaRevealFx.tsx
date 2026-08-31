import { useEffect, useRef, useState } from 'react'
import type { CharacterRarity } from '../../config/characters'
import { getSoundManager, type SfxId } from '../../audio/SoundManager'
import type { GachaPullItem, GachaPullType } from '../../utils/gacha'
import { isResultVisualMountedPhase } from './gachaRevealEntrance'
import {
  MULTI_SCROLL_COUNT,
  MULTI_SCROLL_OPEN_STAGGER_MS,
  getInitialMultiOpenedCount,
  scheduleMultiScrollOpen,
} from './gachaMultiReveal'
import {
  buildPhases,
  getRevealFxVisibility,
  phaseDurationMs,
  tierFromRarity,
} from './gachaRevealPhases'
import { GachaMultiScrolls, GachaScrollFx } from './GachaScrollFx'
import { GachaScrollBundle } from './GachaScrollBundle'
import { GachaScrollShrine } from './GachaScrollShrine'
import { GachaResultCard } from './GachaResultCard'

interface GachaRevealFxProps {
  items: GachaPullItem[]
  peakRarity: CharacterRarity
  pullType: GachaPullType
  reducedMotion: boolean
  onComplete: (hasShownRevealResult: boolean, skipped: boolean) => void
}

function sfxForRarity(rarity: CharacterRarity): SfxId | null {
  if (rarity === 'SHINNIN' || rarity === 'UR') return 'gachaUr'
  if (rarity === 'SSR') return 'gachaSsr'
  if (rarity === 'SR') return 'gachaSr'
  return null
}

function rarityBannerLabel(tier: ReturnType<typeof tierFromRarity>): string {
  if (tier === 'shinnin') return '神忍'
  return tier.toUpperCase()
}

function LightningLayer({ tier }: { tier: 'sr' | 'ssr' | 'ur' | 'shinnin' }) {
  const boltPath =
    'M52 4 L28 48 L44 48 L22 96 L68 40 L48 40 L72 4 Z'
  return (
    <div
      className={`gacha-lightning gacha-lightning--${tier} gacha-lightning--slot`}
      data-testid="gacha-lightning"
      aria-hidden="true"
    >
      {[1, 2, 3].map((n) => (
        <svg
          key={n}
          className={`gacha-lightning__bolt gacha-lightning__bolt--${n}`}
          viewBox="0 0 96 100"
          width="48"
          height="56"
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
      className={`gacha-electric gacha-electric--${tier} gacha-electric--slot`}
      data-testid="gacha-electric"
      aria-hidden="true"
    >
      <span className="gacha-electric__spark gacha-electric__spark--1" />
      <span className="gacha-electric__spark gacha-electric__spark--2" />
      <span className="gacha-electric__ring" />
    </div>
  )
}

export function GachaRevealFx({
  items,
  peakRarity,
  pullType,
  reducedMotion,
  onComplete,
}: GachaRevealFxProps) {
  const [phases] = useState(() => buildPhases(peakRarity, reducedMotion, pullType))
  const [index, setIndex] = useState(0)
  const [visualEntranceDone, setVisualEntranceDone] = useState(false)
  const [openedScrollCount, setOpenedScrollCount] = useState(() =>
    getInitialMultiOpenedCount(reducedMotion, false),
  )
  const [openingIndex, setOpeningIndex] = useState<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const sfxPlayedRef = useRef(false)
  const hasShownRevealResultRef = useRef(false)
  const resultVisualMountedRef = useRef(false)
  const cancelMultiOpenRef = useRef<(() => void) | null>(null)
  const phase = phases[Math.min(index, phases.length - 1)] ?? 'done'
  const tier = tierFromRarity(peakRarity)
  const rareTier =
    tier === 'sr' || tier === 'ssr' || tier === 'ur' || tier === 'shinnin'
      ? tier
      : null
  const isMulti = pullType === 'multi'
  const fx = getRevealFxVisibility(phases, index, phase, tier, isMulti, reducedMotion)
  const firstItem = items[0]
  const resultVisualMounted =
    !!firstItem &&
    !isMulti &&
    isResultVisualMountedPhase(phases, index, reducedMotion, pullType)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const handleVisualEntranceEnd = () => {
    setVisualEntranceDone(true)
  }

  useEffect(() => {
    resultVisualMountedRef.current = resultVisualMounted
    if (resultVisualMounted) {
      hasShownRevealResultRef.current = true
    }
  }, [resultVisualMounted])

  useEffect(() => {
    if (isMulti && openedScrollCount >= MULTI_SCROLL_COUNT) {
      hasShownRevealResultRef.current = true
    }
  }, [isMulti, openedScrollCount])

  useEffect(() => {
    if (phase === 'done') {
      if (!completedRef.current) {
        completedRef.current = true
        cancelMultiOpenRef.current?.()
        cancelMultiOpenRef.current = null
        if (resultVisualMountedRef.current || (isMulti && openedScrollCount >= MULTI_SCROLL_COUNT)) {
          hasShownRevealResultRef.current = true
        }
        onCompleteRef.current(hasShownRevealResultRef.current, false)
      }
      return
    }
    if (completedRef.current) {
      return
    }
    const timer = window.setTimeout(() => {
      if (completedRef.current) {
        return
      }
      setIndex((value) => Math.min(value + 1, phases.length - 1))
    }, phaseDurationMs(phase, reducedMotion))
    return () => window.clearTimeout(timer)
  }, [phase, phases.length, reducedMotion, pullType, isMulti, openedScrollCount])

  useEffect(() => {
    if (phase !== 'multi-open' || reducedMotion) {
      cancelMultiOpenRef.current?.()
      cancelMultiOpenRef.current = null
      return
    }

    cancelMultiOpenRef.current?.()
    cancelMultiOpenRef.current = scheduleMultiScrollOpen(
      MULTI_SCROLL_COUNT,
      MULTI_SCROLL_OPEN_STAGGER_MS,
      (count) => {
        const item = items[count - 1]
        setOpeningIndex(count - 1)
        setOpenedScrollCount(count)
        if (item) {
          const sfx = sfxForRarity(item.rarity)
          if (sfx) {
            getSoundManager().playSfx(sfx)
          }
        }
        window.setTimeout(() => {
          setOpeningIndex((current) => (current === count - 1 ? null : current))
        }, 420)
      },
      () => {
        cancelMultiOpenRef.current = null
        setOpeningIndex(null)
      },
    )

    return () => {
      cancelMultiOpenRef.current?.()
      cancelMultiOpenRef.current = null
    }
  }, [phase, reducedMotion, items])

  useEffect(() => {
    if (sfxPlayedRef.current || isMulti) {
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
  }, [phase, peakRarity, reducedMotion, rareTier, isMulti])

  if (phase === 'done') {
    return null
  }

  const scrollOpen =
    phase === 'scroll-open' ||
    phase === 'scroll-gold' ||
    (phase === 'scroll-transform' && !isMulti)

  const multiOpenedCount =
    phase === 'multi-open'
      ? reducedMotion
        ? MULTI_SCROLL_COUNT
        : openedScrollCount
      : 0

  return (
    <div
      className={[
        'gacha-reveal',
        `gacha-reveal--${phase}`,
        `gacha-reveal--${tier}`,
        isMulti ? 'gacha-reveal--multi' : 'gacha-reveal--single',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-reveal"
      data-phase={phase}
      data-peak-rarity={peakRarity}
      data-pull-type={pullType}
      role="presentation"
    >
      <div className="gacha-reveal__positioner">
        <div className="gacha-reveal__stage" aria-hidden="true">
          <div className="gacha-reveal__effects">
            {!isMulti && phase === 'scroll' && (
              <div className="gacha-reveal__shrine-bridge">
                <GachaScrollShrine
                  active={false}
                  peakRarity={peakRarity}
                  pullType="single"
                  reducedMotion={reducedMotion}
                  fullscreen
                  onComplete={() => {}}
                />
              </div>
            )}
            {fx.showScroll && (
              <GachaScrollFx
                isOpen={scrollOpen}
                isGold={phase === 'scroll-gold'}
                isTransform={phase === 'scroll-transform'}
                srGlow={rareTier === 'sr' && (phase === 'scroll' || phase === 'electric')}
                shrineOrigin
              />
            )}
            {fx.showMultiBundle && (
              <div className="gacha-multi-positioner">
                <GachaScrollBundle context="reveal" />
              </div>
            )}
            {fx.showMultiGrid && (
              <div className="gacha-multi-positioner gacha-multi-positioner--grid-enter">
                <GachaMultiScrolls
                  items={items}
                  openedCount={0}
                  openingIndex={null}
                  gridVisible
                />
              </div>
            )}
            {fx.showMultiOpen && (
              <GachaMultiScrolls
                key="multi-open"
                items={items}
                openedCount={multiOpenedCount}
                openingIndex={openingIndex}
                gridVisible
              />
            )}
            {fx.showSmoke && (
              <div className="gacha-fx-anchor">
                <div
                  className={[
                    'gacha-reveal__smoke',
                    fx.smokeBig ? 'gacha-reveal__smoke--big' : '',
                    reducedMotion ? 'gacha-reveal__smoke--static' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              </div>
            )}
            {fx.showLightning && rareTier && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <LightningLayer tier={rareTier} />
              </div>
            )}
            {fx.showElectricAura && rareTier && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <ElectricAura tier={rareTier} />
              </div>
            )}
            {fx.showSilence && (
              <div
                className="gacha-reveal__silence"
                data-testid="gacha-silence"
                aria-hidden="true"
              />
            )}
            {fx.showSeal && (
              <div className="gacha-fx-anchor">
                <div className="gacha-reveal__seal" data-testid="gacha-seal" aria-hidden="true">
                  <span className="gacha-reveal__seal-mark">印</span>
                </div>
              </div>
            )}
            {fx.showDivineLight && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <div
                  className="gacha-reveal__divine-light"
                  data-testid="gacha-divine-light"
                />
              </div>
            )}
            {fx.showShinninBanner && (
              <div className="gacha-fx-anchor">
                <p
                  className="gacha-reveal__shinnin-banner"
                  data-testid="gacha-shinnin-banner"
                >
                  神忍
                </p>
              </div>
            )}
            {fx.showGoldFlash && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <div className="gacha-reveal__gold-flash" data-testid="gacha-gold-flash" />
              </div>
            )}
            {fx.showShockwave && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <div className="gacha-reveal__shockwave" data-testid="gacha-shockwave" />
              </div>
            )}
            {fx.showRainbow && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <div className="gacha-reveal__rainbow" data-testid="gacha-rainbow" />
              </div>
            )}
            {fx.showCrest && (
              <div className="gacha-fx-anchor gacha-fx-anchor--scroll">
                <div className="gacha-reveal__crest" data-testid="gacha-crest" />
              </div>
            )}
            {fx.showRarityBanner && (
              <div className="gacha-fx-anchor gacha-fx-anchor--banner">
                <p
                  className={[
                    'gacha-reveal__rarity-banner',
                    `gacha-reveal__rarity-banner--${tier}`,
                  ].join(' ')}
                  data-testid="gacha-rarity-banner"
                >
                  {rarityBannerLabel(tier)}
                </p>
              </div>
            )}
            {reducedMotion && rareTier === 'ssr' && phase === 'electric' && (
              <div className="gacha-reveal__rm-ssr-mark" aria-hidden="true">
                ⚡
              </div>
            )}
          </div>

          {resultVisualMounted && firstItem && (
            <div className="gacha-reveal__content" data-testid="gacha-reveal-content">
              <div
                className={[
                  'gacha-result-visual',
                  'gacha-result-visual--reveal',
                  !visualEntranceDone
                    ? 'gacha-result-visual--reveal-enter'
                    : 'gacha-result-visual--reveal-settled',
                ].join(' ')}
                data-testid="gacha-reveal-visual"
                onAnimationEnd={(event) => {
                  if (event.animationName === 'gachaResultEnter') {
                    handleVisualEntranceEnd()
                  }
                }}
              >
                <GachaResultCard item={firstItem} variant="reveal" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
