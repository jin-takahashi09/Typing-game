import { useEffect } from 'react'
import type { CharacterRarity } from '../../config/characters'

interface GachaKarakuriMachineProps {
  active: boolean
  peakRarity: CharacterRarity
  reducedMotion: boolean
  onComplete: () => void
}

function peakTierClass(rarity: CharacterRarity): string {
  if (rarity === 'UR' || rarity === 'SSR') return 'karakuri--peak-high'
  if (rarity === 'SR') return 'karakuri--peak-sr'
  return 'karakuri--peak-normal'
}

export function GachaKarakuriMachine({
  active,
  peakRarity,
  reducedMotion,
  onComplete,
}: GachaKarakuriMachineProps) {
  useEffect(() => {
    if (!active) {
      return
    }
    const durationMs = reducedMotion ? 720 : 1900
    const timer = window.setTimeout(onComplete, durationMs)
    return () => window.clearTimeout(timer)
  }, [active, reducedMotion, onComplete])

  return (
    <div
      className={[
        'karakuri',
        peakTierClass(peakRarity),
        active ? 'karakuri--active' : '',
        reducedMotion ? 'karakuri--reduced' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-karakuri-machine"
      data-active={active ? 'true' : 'false'}
      data-peak-rarity={peakRarity}
      aria-hidden={!active}
    >
      <div className="karakuri__shadow" />
      <div className="karakuri__box">
        <div className="karakuri__metal karakuri__metal--left" />
        <div className="karakuri__metal karakuri__metal--right" />
        <div className="karakuri__wood-grain" />
        <div className="karakuri__lid">
          <span className="karakuri__cord" />
        </div>
        <svg
          className="karakuri__crest"
          viewBox="0 0 64 64"
          width="48"
          height="48"
          aria-hidden="true"
        >
          <polygon
            points="32,4 58,24 48,58 16,58 6,24"
            fill="currentColor"
          />
          <polygon
            points="32,14 48,26 42,50 22,50 16,26"
            fill="#78350f"
          />
        </svg>
        <div className="karakuri__shuriken karakuri__shuriken--1" />
        <div className="karakuri__shuriken karakuri__shuriken--2" />
        <div className="karakuri__slot">
          <div className="karakuri__handle" />
        </div>
        <div className="karakuri__tag">忍</div>
      </div>
      <div className="karakuri__smoke" />
      <div className="karakuri__scroll-launch">
        <div className="karakuri__scroll" />
      </div>
      <div className="karakuri__spark karakuri__spark--sr" />
      <div className="karakuri__spark karakuri__spark--gold" />
    </div>
  )
}
