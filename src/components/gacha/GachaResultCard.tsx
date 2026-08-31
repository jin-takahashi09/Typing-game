import { formatRarityLabel, rarityCssSuffix } from '../../config/rarityLabels'
import type { GachaPullItem } from '../../utils/gacha'
import { CharacterPreview } from '../common/CharacterPreview'

interface GachaResultCardProps {
  item: GachaPullItem
  variant?: 'reveal' | 'modal'
  compact?: boolean
  /** Final multi grid uses compact duplicate line; central/single keep full detail. */
  duplicateDisplay?: 'full' | 'compact'
  className?: string
}

export function GachaResultCard({
  item,
  variant = 'modal',
  compact = false,
  duplicateDisplay = 'full',
  className = '',
}: GachaResultCardProps) {
  const rarityClass = `gacha-result-card--${rarityCssSuffix(item.rarity)}`
  const size = compact ? 'gacha-multi' : 'gacha-result'

  return (
    <div
      className={[
        'gacha-result-card',
        rarityClass,
        variant === 'reveal' ? 'gacha-result-card--reveal' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-result-card"
      data-rarity={item.rarity}
      data-duplicate={item.wasDuplicate ? 'true' : 'false'}
    >
      <p
        className="gacha-result-card__rarity"
        aria-label={`レアリティ ${formatRarityLabel(item.rarity)}`}
        data-testid="gacha-result-rarity-label"
      >
        {formatRarityLabel(item.rarity)}
      </p>
      <div className="gacha-result-card__figure" data-testid="gacha-result-character">
        <CharacterPreview
          characterId={item.characterId}
          size={size}
          figureVariant="gacha-result"
          showIdleEffects={variant === 'modal' && !item.wasDuplicate}
        />
      </div>
      <p
        className="gacha-result-card__name gacha-result-card__meta"
        data-testid="gacha-result-name"
      >
        {item.name}
      </p>
      {item.wasDuplicate ? (
        duplicateDisplay === 'compact' ? (
          <p
            className="gacha-result-card__dup-compact gacha-result-card__meta"
            data-testid="gacha-result-duplicate-compact"
          >
            重複 +{item.duplicateCoins}
          </p>
        ) : (
          <>
            <p
              className="gacha-result-card__badge gacha-result-card__badge--dup gacha-result-card__meta"
              data-testid="gacha-result-duplicate"
            >
              DUPLICATE
            </p>
            <p className="gacha-result-card__coins gacha-result-card__meta">
              +{item.duplicateCoins}コイン
            </p>
          </>
        )
      ) : (
        <p className="gacha-result-card__badge gacha-result-card__badge--new gacha-result-card__meta">
          NEW
        </p>
      )}
    </div>
  )
}
