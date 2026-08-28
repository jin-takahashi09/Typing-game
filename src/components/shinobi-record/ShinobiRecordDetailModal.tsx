import { createPortal } from 'react-dom'
import {
  type CharacterDefinition,
} from '../../config/characters'
import { formatRarityLabel, rarityCssSuffix } from '../../config/rarityLabels'
import { CharacterPreview } from '../common/CharacterPreview'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface ShinobiRecordDetailModalProps {
  character: CharacterDefinition
  owned: boolean
  inUse: boolean
  onClose: () => void
  onSelect: () => void
}

export function ShinobiRecordDetailModal({
  character,
  owned,
  inUse,
  onClose,
  onSelect,
}: ShinobiRecordDetailModalProps) {
  useBodyScrollLock(true)

  if (typeof document === 'undefined') {
    return null
  }

  const displayName = owned ? character.name : '未発見'

  return createPortal(
    <div
      className="gacha-portal shinobi-record-detail-portal"
      data-testid="shinobi-record-detail-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shinobi-record-detail-title"
    >
      <button
        type="button"
        className="gacha-portal__backdrop shinobi-record-detail-portal__backdrop"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        className={[
          'shinobi-record-detail',
          owned ? '' : 'shinobi-record-detail--unowned',
        ].join(' ')}
        data-testid="shinobi-record-detail"
        data-owned={owned ? 'true' : 'false'}
      >
        <p
          className={[
            'shinobi-record-detail__rarity',
            `shinobi-record-detail__rarity--${rarityCssSuffix(character.rarity)}`,
            owned ? '' : 'shinobi-record-detail__rarity--muted',
          ].join(' ')}
        >
          {formatRarityLabel(character.rarity)}
        </p>
        <div
          className={[
            'shinobi-record-detail__figure',
            owned ? '' : 'shinobi-record-detail__figure--unowned',
          ].join(' ')}
        >
          <CharacterPreview characterId={character.id} size="gacha-result" />
        </div>
        <h2
          id="shinobi-record-detail-title"
          className="shinobi-record-detail__name"
        >
          {displayName}
        </h2>
        {owned ? (
          <>
            <p className="shinobi-record-detail__desc">{character.description}</p>
            <p className="shinobi-record-detail__ability">
              {character.ability.name} — {character.ability.description}
            </p>
            {inUse ? (
              <p
                className="shinobi-record-detail__in-use"
                data-testid="shinobi-record-in-use"
              >
                使用中
              </p>
            ) : (
              <button
                type="button"
                className="shinobi-record-detail__select"
                data-testid="shinobi-record-select"
                onClick={onSelect}
              >
                この忍を使う
              </button>
            )}
          </>
        ) : (
          <p
            className="shinobi-record-detail__unowned-hint"
            data-testid="shinobi-record-unowned-hint"
          >
            ガチャで入手できます
          </p>
        )}
        <button
          type="button"
          className="shinobi-record-detail__close"
          data-testid="shinobi-record-detail-close"
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>,
    document.body,
  )
}
