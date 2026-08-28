import { CharacterFigure } from './CharacterFigure'
import {
  DEFAULT_CHARACTER_ID,
  getCharacterById,
  resolveCharacter,
} from '../../config/characters'

interface CharacterPreviewProps {
  characterId: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'gacha-result' | 'gacha-multi'
  showIdleEffects?: boolean
  /** CharacterFigure 向けバリアント */
  figureVariant?: 'default' | 'gacha-result'
}

const sizeClass: Record<NonNullable<CharacterPreviewProps['size']>, string> = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
  'gacha-result': 'character-preview--gacha-result',
  'gacha-multi': 'character-preview--gacha-multi',
}

export function CharacterPreview({
  characterId,
  className = '',
  size = 'md',
  showIdleEffects = true,
  figureVariant = 'default',
}: CharacterPreviewProps) {
  const character =
    getCharacterById(characterId) ?? resolveCharacter(DEFAULT_CHARACTER_ID)

  return (
    <div className={[sizeClass[size], 'relative overflow-visible', className].join(' ')}>
      <CharacterFigure
        skinClass={character.skinClass}
        visual={character.visual}
        showIdleEffects={showIdleEffects}
        rarity={character.rarity}
        variant={figureVariant}
      />
    </div>
  )
}
