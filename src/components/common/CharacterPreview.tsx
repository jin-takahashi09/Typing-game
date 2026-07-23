import { CharacterFigure } from './CharacterFigure'
import {
  DEFAULT_CHARACTER_ID,
  getCharacterById,
  resolveCharacter,
} from '../../config/characters'

interface CharacterPreviewProps {
  characterId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIdleEffects?: boolean
}

const sizeClass: Record<NonNullable<CharacterPreviewProps['size']>, string> = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
}

export function CharacterPreview({
  characterId,
  className = '',
  size = 'md',
  showIdleEffects = true,
}: CharacterPreviewProps) {
  const character =
    getCharacterById(characterId) ?? resolveCharacter(DEFAULT_CHARACTER_ID)

  return (
    <div className={[sizeClass[size], 'relative overflow-visible', className].join(' ')}>
      <CharacterFigure
        skinClass={character.skinClass}
        visual={character.visual}
        showIdleEffects={showIdleEffects}
      />
    </div>
  )
}
