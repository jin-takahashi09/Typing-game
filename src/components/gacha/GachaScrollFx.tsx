import type { CSSProperties } from 'react'
import type { GachaPullItem } from '../../utils/gacha'
import {
  MULTI_SCROLL_COUNT,
  highRarityFlashClass,
  isHighRarityFlashTarget,
  scrollOpenFxClass,
} from './gachaMultiReveal'
import { GachaResultCard } from './GachaResultCard'

interface GachaMultiScrollsProps {
  items: GachaPullItem[]
  openedCount: number
  openingIndex: number | null
  gridVisible: boolean
}

export function GachaMultiScrolls({
  items,
  openedCount,
  openingIndex,
  gridVisible,
}: GachaMultiScrollsProps) {
  if (!gridVisible) {
    return null
  }

  return (
    <div className="gacha-multi-positioner" data-testid="gacha-multi-positioner">
      <div
        className="gacha-multi-scrolls"
        data-testid="gacha-multi-scrolls"
        data-opened-count={openedCount}
      >
        {Array.from({ length: MULTI_SCROLL_COUNT }, (_, index) => {
          const item = items[index]
          const isOpen = index < openedCount
          const isOpening = openingIndex === index
          const flashClass =
            isOpening && item && isHighRarityFlashTarget(item.rarity)
              ? highRarityFlashClass(item.rarity)
              : null

          return (
            <div
              key={index}
              className={[
                'gacha-multi-scrolls__slot',
                isOpen ? 'gacha-multi-scrolls__slot--open' : 'gacha-multi-scrolls__slot--closed',
                isOpening && item ? scrollOpenFxClass(item.rarity) : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid="gacha-multi-scroll-slot"
              data-scroll-index={index}
              data-open={isOpen ? 'true' : 'false'}
            >
              {isOpen && item ? (
                <div className="gacha-multi-scrolls__result">
                  {flashClass && (
                    <span
                      className={['gacha-result-card__rare-flash', flashClass].join(' ')}
                      aria-hidden="true"
                    />
                  )}
                  <GachaResultCard item={item} compact variant="reveal" />
                </div>
              ) : (
                <div
                  className="gacha-multi-scroll gacha-multi-scroll--closed"
                  style={{ '--slot-index': String(index) } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="gacha-multi-scroll__seal">印</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface GachaScrollFxProps {
  isOpen?: boolean
  isGold?: boolean
  isTransform?: boolean
  srGlow?: boolean
  /** Shrine-style vertical scroll card (matches idle preview). */
  shrineOrigin?: boolean
  /** Fill parent slot instead of fullscreen center. */
  embedded?: boolean
}

/** Centered scroll FX — positioner and animation layers are separated. */
export function GachaScrollFx({
  isOpen = false,
  isGold = false,
  isTransform = false,
  srGlow = false,
  shrineOrigin = true,
  embedded = false,
}: GachaScrollFxProps) {
  return (
    <div
      className={embedded ? 'gacha-scroll-fx--embedded' : 'gacha-scroll-positioner'}
      data-testid="gacha-scroll-fx"
    >
      <div className="gacha-scroll-stage">
        <div className={embedded ? 'gacha-scroll-animation--embedded' : 'gacha-scroll-animation'}>
          <div
            className={[
              'gacha-reveal__scroll',
              shrineOrigin ? 'gacha-reveal__scroll--shrine' : '',
              isOpen ? 'gacha-reveal__scroll--open' : '',
              isGold ? 'gacha-reveal__scroll--gold' : '',
              isTransform ? 'gacha-reveal__scroll--transform' : '',
              srGlow ? 'gacha-reveal__scroll--sr-glow' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {shrineOrigin && <span className="gacha-reveal__scroll-seal">印</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
