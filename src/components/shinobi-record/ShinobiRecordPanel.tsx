import { useCallback, useMemo, useState } from 'react'
import {
  characters,
  getCharacterById,
  type CharacterDefinition,
  type CharacterRarity,
} from '../../config/characters'
import { RARITY_ORDER } from '../../config/gachaConfig'
import { formatRarityLabel, rarityCssSuffix } from '../../config/rarityLabels'
import { CharacterPreview } from '../common/CharacterPreview'
import type { StoredEconomy } from '../../types/records'
import { ShinobiRecordDetailModal } from './ShinobiRecordDetailModal'

function rarityClass(rarity: CharacterRarity): string {
  return `shinobi-record-card--${rarityCssSuffix(rarity)}`
}

interface ShinobiRecordPanelProps {
  economy: StoredEconomy
  onSelect: (characterId: string) => boolean
  embedded?: boolean
  hideHeader?: boolean
}

export function ShinobiRecordPanel({
  economy,
  onSelect,
  embedded = false,
  hideHeader = false,
}: ShinobiRecordPanelProps) {
  const [detailId, setDetailId] = useState<string | null>(null)

  const ownedSet = useMemo(
    () => new Set(economy.ownedCharacterIds),
    [economy.ownedCharacterIds],
  )

  const detailCharacter = detailId ? getCharacterById(detailId) : null
  const detailOwned = detailId ? ownedSet.has(detailId) : false

  const charactersByRarity = useMemo(() => {
    const map = new Map<CharacterRarity, CharacterDefinition[]>()
    for (const rarity of RARITY_ORDER) {
      map.set(
        rarity,
        characters.filter((character) => character.rarity === rarity),
      )
    }
    return map
  }, [])

  const handleSelect = useCallback(() => {
    if (!detailId || !ownedSet.has(detailId)) {
      return
    }
    if (onSelect(detailId)) {
      setDetailId(null)
    }
  }, [detailId, onSelect, ownedSet])

  const openDetail = useCallback((character: CharacterDefinition) => {
    setDetailId(character.id)
  }, [])

  const renderCard = (character: CharacterDefinition) => {
    const owned = ownedSet.has(character.id)
    const inUse = economy.selectedCharacterId === character.id
    const displayName = owned ? character.name : '未発見'

    return (
      <li key={character.id}>
        <button
          type="button"
          className={[
            'shinobi-record-card',
            rarityClass(character.rarity),
            owned ? 'shinobi-record-card--owned' : 'shinobi-record-card--unowned',
            inUse ? 'shinobi-record-card--active' : '',
            character.rarity === 'SHINNIN' ? 'shinobi-record-card--shinnin' : '',
          ].join(' ')}
          data-testid={`shinobi-record-card-${character.id}`}
          data-owned={owned ? 'true' : 'false'}
          onClick={() => openDetail(character)}
        >
          <span
            className={[
              'shinobi-record-card__rarity',
              `shinobi-record-card__rarity--${rarityCssSuffix(character.rarity)}`,
              owned ? '' : 'shinobi-record-card__rarity--muted',
            ].join(' ')}
          >
            {formatRarityLabel(character.rarity)}
          </span>
          <div
            className={[
              'shinobi-record-card__figure',
              owned ? '' : 'shinobi-record-card__figure--unowned',
            ].join(' ')}
          >
            <CharacterPreview characterId={character.id} size="sm" />
          </div>
          <p className="shinobi-record-card__name">{displayName}</p>
          {owned && inUse && (
            <span
              className="shinobi-record-card__badge"
              data-testid="shinobi-record-in-use-badge"
            >
              使用中
            </span>
          )}
          {!owned && (
            <span
              className="shinobi-record-card__badge shinobi-record-card__badge--unowned"
              data-testid="shinobi-record-unowned-badge"
            >
              未入手
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <section
      className={[
        'shinobi-record-panel',
        embedded ? 'shinobi-record-panel--embedded' : '',
      ].join(' ')}
      data-testid="shinobi-record-panel"
      aria-labelledby={hideHeader ? undefined : 'shinobi-record-heading'}
    >
      {!hideHeader && (
        <header className="shinobi-record-panel__header">
          <h2
            id="shinobi-record-heading"
            className="shinobi-record-panel__title"
            data-testid="shinobi-record-title"
          >
            忍録
          </h2>
          <p className="shinobi-record-panel__subtitle">我が里に集いし忍</p>
        </header>
      )}

      <div
        className="shinobi-record-catalog"
        data-testid="shinobi-record-grid"
      >
        {RARITY_ORDER.map((rarity) => {
          const sectionCharacters = charactersByRarity.get(rarity) ?? []
          if (sectionCharacters.length === 0) {
            return null
          }
          return (
            <section
              key={rarity}
              className={[
                'shinobi-record-section',
                rarity === 'SHINNIN' ? 'shinobi-record-section--shinnin' : '',
              ].join(' ')}
              data-testid={`shinobi-record-section-${rarityCssSuffix(rarity)}`}
            >
              <h3 className="shinobi-record-section__heading">
                {formatRarityLabel(rarity)}
                <span className="shinobi-record-section__count">
                  {sectionCharacters.length}
                </span>
              </h3>
              <ul className="shinobi-record-grid shinobi-record-grid--catalog">
                {sectionCharacters.map((character) => renderCard(character))}
              </ul>
            </section>
          )
        })}
      </div>

      {detailCharacter && (
        <ShinobiRecordDetailModal
          character={detailCharacter}
          owned={detailOwned}
          inUse={economy.selectedCharacterId === detailCharacter.id}
          onClose={() => setDetailId(null)}
          onSelect={handleSelect}
        />
      )}
    </section>
  )
}
