import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { CharacterRarity } from '../../config/characters'
import { rarityCssSuffix } from '../../config/rarityLabels'
import type { GachaPullItem, GachaPullType } from '../../utils/gacha'
import { useDialogA11y } from '../../hooks/useFocusTrap'
import { GachaResultCard } from './GachaResultCard'
import {
  MULTI_STAGGER_MS,
  getInitialMultiVisibleCount,
  highRarityFlashClass,
  isHighRarityFlashTarget,
  scheduleMultiStagger,
  shouldStaggerMultiReveal,
} from './gachaMultiReveal'
import { getResultVisualMotionClass } from './gachaResultVisual'

interface GachaResultModalProps {
  items: GachaPullItem[]
  peakRarity: CharacterRarity
  pullType: GachaPullType
  reducedMotion: boolean
  /** false when reveal FX already showed card + character (single) */
  playCardEntrance?: boolean
  /** true when reveal was skipped before stagger could finish (multi) */
  revealSkipped?: boolean
  onClose: () => void
}

export function GachaResultModal({
  items,
  peakRarity,
  pullType,
  reducedMotion,
  playCardEntrance = true,
  revealSkipped = false,
  onClose,
}: GachaResultModalProps) {
  const titleId = useId()
  const dialogRef = useDialogA11y(true)
  const isMulti = items.length > 1
  const cancelStaggerRef = useRef<(() => void) | null>(null)
  const [visibleCount, setVisibleCount] = useState(() =>
    getInitialMultiVisibleCount(pullType, reducedMotion, revealSkipped, items.length),
  )
  const [flashIndex, setFlashIndex] = useState<number | null>(null)

  const staggerActive =
    isMulti &&
    playCardEntrance &&
    shouldStaggerMultiReveal(pullType, reducedMotion, revealSkipped)

  const showAllCards = !staggerActive || visibleCount >= items.length
  const latestVisibleIndex = Math.max(0, visibleCount - 1)

  const revealAllCards = useCallback(() => {
    cancelStaggerRef.current?.()
    cancelStaggerRef.current = null
    setVisibleCount(items.length)
  }, [items.length])

  useEffect(() => {
    if (!staggerActive) {
      return
    }

    cancelStaggerRef.current?.()
    cancelStaggerRef.current = scheduleMultiStagger(
      items.length,
      MULTI_STAGGER_MS,
      (count) => {
        setVisibleCount(count)
        const item = items[count - 1]
        if (item && isHighRarityFlashTarget(item.rarity)) {
          setFlashIndex(count - 1)
        }
      },
      () => {
        cancelStaggerRef.current = null
      },
    )

    return () => {
      cancelStaggerRef.current?.()
      cancelStaggerRef.current = null
    }
  }, [staggerActive, items])

  useEffect(() => {
    if (flashIndex === null) {
      return
    }
    const timer = window.setTimeout(() => setFlashIndex(null), 500)
    return () => window.clearTimeout(timer)
  }, [flashIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (staggerActive && visibleCount < items.length) {
          revealAllCards()
          return
        }
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [staggerActive, visibleCount, items.length, revealAllCards, onClose])

  if (typeof document === 'undefined') {
    return null
  }

  return (
    <div
      className={[
        'gacha-result-stage',
        `gacha-result-stage--peak-${rarityCssSuffix(peakRarity)}`,
        isMulti ? 'gacha-result-stage--multi' : 'gacha-result-stage--single',
      ].join(' ')}
      data-testid="gacha-result-stage"
      data-pull-type={pullType}
    >
      <div
        ref={dialogRef}
        className={[
          'gacha-result-modal',
          isMulti ? 'gacha-result-modal--multi' : 'gacha-result-modal--single',
          showAllCards ? 'gacha-result-modal--complete' : 'gacha-result-modal--staggering',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="gacha-result-modal"
      >
        <h2 id={titleId} className="gacha-result-modal__title">
          ガチャ結果
        </h2>

        <ul
          className={[
            'gacha-result-modal__grid',
            isMulti
              ? 'gacha-result-modal__grid--multi'
              : 'gacha-result-modal__grid--single',
          ].join(' ')}
        >
          {items.map((item, itemIndex) => {
            const isVisible = !staggerActive || itemIndex < visibleCount
            const flashClass =
              flashIndex === itemIndex
                ? highRarityFlashClass(item.rarity)
                : null
            const motionClass = getResultVisualMotionClass({
              isMulti,
              staggerActive,
              isVisible,
              playCardEntrance,
              itemIndex,
              latestVisibleIndex,
            })

            return (
              <li
                key={`${item.characterId}-${itemIndex}`}
                className={[
                  'gacha-result-modal__cell',
                  isVisible ? 'gacha-result-modal__cell--visible' : 'gacha-result-modal__cell--hidden',
                ].join(' ')}
                data-index={itemIndex}
              >
                {isVisible ? (
                  <div className={['gacha-result-visual', motionClass].filter(Boolean).join(' ')}>
                    {flashClass && (
                      <span
                        className={['gacha-result-card__rare-flash', flashClass].join(' ')}
                        aria-hidden="true"
                      />
                    )}
                    <GachaResultCard item={item} compact={isMulti} />
                  </div>
                ) : (
                  <span className="gacha-result-modal__cell-placeholder" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="gacha-result-modal__close"
          data-testid="gacha-reveal-close"
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
