import type { CharacterRarity } from '../../config/characters'
import { tierFromRarity } from './gachaRevealPhases'
import { GachaScrollFx } from './GachaScrollFx'
import type { CardRevealContext, ScrollSlotState } from './gachaCardRevealSequence'
import { getCardRevealFxFlags } from './gachaCardRevealSequence'

interface GachaCardRevealFxProps {
  rarity: CharacterRarity
  state: ScrollSlotState
  context: CardRevealContext
  reducedMotion: boolean
  /** Closed scroll before anticipation (single approach). */
  showClosedScroll?: boolean
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

function rarityBannerLabel(tier: ReturnType<typeof tierFromRarity>): string {
  if (tier === 'shinnin') return '神忍'
  return tier.toUpperCase()
}

/** Shared reveal FX used by single and multi card slots. */
export function GachaCardRevealFx({
  rarity,
  state,
  context,
  reducedMotion,
  showClosedScroll = false,
}: GachaCardRevealFxProps) {
  const tier = tierFromRarity(rarity)
  const rareTier =
    tier === 'sr' || tier === 'ssr' || tier === 'ur' || tier === 'shinnin'
      ? tier
      : null
  const fx = getCardRevealFxFlags(rarity, state, reducedMotion)
  const embedded = context === 'multi'
  const showScrollLayer =
    state !== 'revealed' && (fx.showScroll || (state === 'closed' && showClosedScroll))

  return (
    <div
      className={[
        'gacha-card-reveal-fx',
        `gacha-card-reveal-fx--${state}`,
        `gacha-card-reveal-fx--${tier}`,
        embedded ? 'gacha-card-reveal-fx--embedded' : '',
        context === 'multi' ? 'gacha-card-reveal-fx--multi' : '',
        context === 'central' || context === 'single' ? 'gacha-card-reveal-fx--central' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-card-reveal-fx"
      data-state={state}
      data-rarity={rarity}
      data-context={context}
      aria-hidden="true"
    >
      {showScrollLayer && (
        <GachaScrollFx
          embedded={embedded}
          isOpen={fx.scrollOpen}
          isGold={fx.scrollGold}
          isTransform={fx.scrollTransform}
          srGlow={fx.srGlow}
          shrineOrigin
        />
      )}

      {fx.showSmoke && (
        <div className="gacha-card-reveal-fx__anchor">
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
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <LightningLayer tier={rareTier} />
        </div>
      )}

      {fx.showElectricAura && rareTier && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <ElectricAura tier={rareTier} />
        </div>
      )}

      {fx.showSilence && (
        <div className="gacha-reveal__silence" data-testid="gacha-silence" aria-hidden="true" />
      )}

      {fx.showSeal && (
        <div className="gacha-card-reveal-fx__anchor">
          <div className="gacha-reveal__seal" data-testid="gacha-seal" aria-hidden="true">
            <span className="gacha-reveal__seal-mark">印</span>
          </div>
        </div>
      )}

      {fx.showDivineLight && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <div className="gacha-reveal__divine-light" data-testid="gacha-divine-light" />
        </div>
      )}

      {fx.showShinninBanner && (
        <div className="gacha-card-reveal-fx__anchor">
          <p className="gacha-reveal__shinnin-banner" data-testid="gacha-shinnin-banner">
            神忍
          </p>
        </div>
      )}

      {fx.showGoldFlash && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <div className="gacha-reveal__gold-flash" data-testid="gacha-gold-flash" />
        </div>
      )}

      {fx.showShockwave && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <div className="gacha-reveal__shockwave" data-testid="gacha-shockwave" />
        </div>
      )}

      {fx.showRainbow && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <div className="gacha-reveal__rainbow" data-testid="gacha-rainbow" />
        </div>
      )}

      {fx.showCrest && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--scroll">
          <div className="gacha-reveal__crest" data-testid="gacha-crest" />
        </div>
      )}

      {fx.showRarityBanner && (
        <div className="gacha-card-reveal-fx__anchor gacha-card-reveal-fx__anchor--banner">
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

      {reducedMotion && rareTier === 'ssr' && state === 'impact' && (
        <div className="gacha-reveal__rm-ssr-mark" aria-hidden="true">
          ⚡
        </div>
      )}
    </div>
  )
}
