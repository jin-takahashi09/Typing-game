import { useEffect } from 'react'
import type { CharacterRarity } from '../../config/characters'
import type { GachaPullType } from '../../utils/gacha'
import { GachaScrollBundle } from './GachaScrollBundle'

interface GachaScrollShrineProps {
  active: boolean
  peakRarity: CharacterRarity
  pullType: GachaPullType
  reducedMotion: boolean
  fullscreen?: boolean
  onComplete: () => void
}

function peakTierClass(rarity: CharacterRarity): string {
  if (rarity === 'SHINNIN' || rarity === 'UR' || rarity === 'SSR') {
    return 'scroll-shrine--peak-high'
  }
  if (rarity === 'SR') return 'scroll-shrine--peak-sr'
  return 'scroll-shrine--peak-normal'
}

export function GachaScrollShrine({
  active,
  peakRarity,
  pullType,
  reducedMotion,
  fullscreen = false,
  onComplete,
}: GachaScrollShrineProps) {
  useEffect(() => {
    if (!active) {
      return
    }
    const durationMs = reducedMotion ? 720 : 1900
    const timer = window.setTimeout(onComplete, durationMs)
    return () => window.clearTimeout(timer)
  }, [active, reducedMotion, onComplete])

  const multi = pullType === 'multi'

  return (
    <div
      className={[
        'scroll-shrine',
        peakTierClass(peakRarity),
        active ? 'scroll-shrine--active' : '',
        multi ? 'scroll-shrine--multi' : 'scroll-shrine--single',
        fullscreen ? 'scroll-shrine--fullscreen' : '',
        reducedMotion ? 'scroll-shrine--reduced' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-scroll-shrine"
      data-active={active ? 'true' : 'false'}
      data-peak-rarity={peakRarity}
      data-pull-type={pullType}
      aria-hidden={!active}
    >
      <div className="scroll-shrine__shadow" />
      <div className="scroll-shrine__pedestal">
        <div className="scroll-shrine__pedestal-top" />
        <div className="scroll-shrine__pedestal-face" />
      </div>
      <div className="scroll-shrine__altar">
        <div className="scroll-shrine__cord scroll-shrine__cord--left" />
        <div className="scroll-shrine__cord scroll-shrine__cord--right" />
        <svg
          className="scroll-shrine__crest"
          viewBox="0 0 64 64"
          width="40"
          height="40"
          aria-hidden="true"
        >
          <polygon points="32,4 58,24 48,58 16,58 6,24" fill="currentColor" />
          <polygon points="32,14 48,26 42,50 22,50 16,26" fill="#78350f" />
        </svg>
        <div className="scroll-shrine__shuriken scroll-shrine__shuriken--1" />
        <div className="scroll-shrine__shuriken scroll-shrine__shuriken--2" />
        <div className="scroll-shrine__scroll-rack">
          {!multi && (
            <>
              <div className="scroll-shrine__scroll scroll-shrine__scroll--back scroll-shrine__scroll--back-left" />
              <div className="scroll-shrine__scroll scroll-shrine__scroll--back scroll-shrine__scroll--back-right" />
              <div className="scroll-shrine__scroll scroll-shrine__scroll--main">
                <span className="scroll-shrine__scroll-seal">印</span>
              </div>
            </>
          )}
        </div>
        <div className="scroll-shrine__stamp">忍</div>
      </div>
      <div className="scroll-shrine__smoke" />
      <div className="scroll-shrine__float-positioner">
        <div className="scroll-shrine__float-animation">
          {multi ? (
            <GachaScrollBundle context="machine" />
          ) : (
            <div className="scroll-shrine__scroll scroll-shrine__scroll--launch">
              <span className="scroll-shrine__scroll-seal">印</span>
            </div>
          )}
        </div>
      </div>
      <div className="scroll-shrine__spark scroll-shrine__spark--sr" />
      <div className="scroll-shrine__spark scroll-shrine__spark--gold" />
    </div>
  )
}
