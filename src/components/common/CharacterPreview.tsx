import { getCharacterById, DEFAULT_CHARACTER_ID } from '../../config/characters'

interface CharacterPreviewProps {
  characterId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
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
}: CharacterPreviewProps) {
  const character = getCharacterById(characterId) ?? getCharacterById(DEFAULT_CHARACTER_ID)!

  return (
    <div
      className={[sizeClass[size], className].join(' ')}
      aria-hidden="true"
    >
      <div className={['ninja-sprite h-full w-full', character.skinClass].join(' ')} />
    </div>
  )
}
