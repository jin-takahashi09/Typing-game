import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { CharacterRarity } from '../../config/characters'
import { formatRarityLabel, rarityCssSuffix } from '../../config/rarityLabels'
import type { GachaPullItem } from '../../utils/gacha'
import { CharacterPreview } from '../common/CharacterPreview'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useDialogA11y } from '../../hooks/useFocusTrap'

interface GachaResultModalProps {
  items: GachaPullItem[]
  peakRarity: CharacterRarity
  onClose: () => void
}

export function GachaResultModal({
  items,
  peakRarity,
  onClose,
}: GachaResultModalProps) {
  const titleId = useId()
  const dialogRef = useDialogA11y(true)
  const isMulti = items.length > 1

  useBodyScrollLock(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={[
        'gacha-portal',
        'gacha-result-portal',
        `gacha-result-portal--peak-${rarityCssSuffix(peakRarity)}`,
      ].join(' ')}
      data-testid="gacha-result-portal"
    >
      <div className="gacha-portal__backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        className={[
          'gacha-result-modal',
          isMulti ? 'gacha-result-modal--multi' : 'gacha-result-modal--single',
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
          {items.map((item, itemIndex) => (
            <li
              key={`${item.characterId}-${itemIndex}`}
              className={[
                'gacha-result-card',
                `gacha-result-card--${rarityCssSuffix(item.rarity)}`,
              ].join(' ')}
              data-testid="gacha-result-card"
              data-rarity={item.rarity}
              data-duplicate={item.wasDuplicate ? 'true' : 'false'}
            >
              <p className="gacha-result-card__rarity" aria-label={`レアリティ ${formatRarityLabel(item.rarity)}`}>
                {formatRarityLabel(item.rarity)}
              </p>
              <div className="gacha-result-card__figure">
                <CharacterPreview
                  characterId={item.characterId}
                  size={isMulti ? 'gacha-multi' : 'gacha-result'}
                  figureVariant="gacha-result"
                  showIdleEffects={!item.wasDuplicate}
                />
              </div>
              <p className="gacha-result-card__name">{item.name}</p>
              {item.wasDuplicate ? (
                <>
                  <p className="gacha-result-card__badge gacha-result-card__badge--dup">
                    DUPLICATE
                  </p>
                  <p className="gacha-result-card__coins">
                    +{item.duplicateCoins}コイン
                  </p>
                </>
              ) : (
                <p className="gacha-result-card__badge gacha-result-card__badge--new">
                  NEW
                </p>
              )}
            </li>
          ))}
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
    </div>,
    document.body,
  )
}
