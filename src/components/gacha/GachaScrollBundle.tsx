import type { CSSProperties } from 'react'
import { MULTI_SCROLL_COUNT } from './gachaMultiReveal'

interface GachaScrollBundleProps {
  /** machine = shrine intro, reveal = FX intro */
  context?: 'machine' | 'reveal'
  className?: string
}

/** Stacked scroll bundle — 10 vertical cards fanned, reads as a thick bundle. */
export function GachaScrollBundle({
  context = 'reveal',
  className = '',
}: GachaScrollBundleProps) {
  return (
    <div
      className={[
        'gacha-scroll-bundle',
        `gacha-scroll-bundle--${context}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-scroll-bundle"
      data-card-count={MULTI_SCROLL_COUNT}
      aria-hidden="true"
    >
      {Array.from({ length: MULTI_SCROLL_COUNT }, (_, index) => {
        const isFront = index === MULTI_SCROLL_COUNT - 1

        return (
          <div
            key={index}
            className="gacha-scroll-bundle__card gacha-scroll-card"
            style={{ '--bundle-index': String(index - (MULTI_SCROLL_COUNT - 1)) } as CSSProperties}
          >
            <span className="gacha-scroll-card__seal">印</span>
            {isFront && <span className="gacha-scroll-card__mark">忍</span>}
          </div>
        )
      })}
    </div>
  )
}
