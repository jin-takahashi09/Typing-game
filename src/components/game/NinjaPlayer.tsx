import type { NinjaAnimationState } from '../../types/game'
import { getCharacterById, DEFAULT_CHARACTER_ID } from '../../config/characters'

interface NinjaPlayerProps {
  xPercent: number
  animation: NinjaAnimationState
  characterId: string
}

export function NinjaPlayer({ xPercent, animation, characterId }: NinjaPlayerProps) {
  const character = getCharacterById(characterId) ?? getCharacterById(DEFAULT_CHARACTER_ID)!

  return (
    <div
      id="ninja-container"
      className="pointer-events-none absolute bottom-4 z-10 h-[84px] w-[84px] -translate-x-1/2 transition-[left] duration-200 ease-out md:h-[100px] md:w-[100px]"
      style={{ left: `${xPercent}%` }}
      aria-hidden="true"
      data-character-id={character.id}
    >
      <div
        className={[
          'ninja-sprite h-full w-full',
          character.skinClass,
          animation === 'attack' ? 'ninja-attack' : '',
          animation === 'damage' ? 'ninja-damage' : '',
        ].join(' ')}
      />
    </div>
  )
}
