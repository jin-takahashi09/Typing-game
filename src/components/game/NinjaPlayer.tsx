import type { NinjaAnimationState } from '../../types/game'
import type { ActivePlayCharacter } from '../../config/characters'
import { CharacterFigure } from '../common/CharacterFigure'

interface NinjaPlayerProps {
  xPercent: number
  animation: NinjaAnimationState
  character: ActivePlayCharacter
  reducedMotion: boolean
  /** 紅蓮スコア発動フラッシュ */
  showScoreBurst?: boolean
  /** 蒼影ダメージ軽減フラッシュ */
  showGuardBurst?: boolean
}

export function NinjaPlayer({
  xPercent,
  animation,
  character,
  reducedMotion,
  showScoreBurst = false,
  showGuardBurst = false,
}: NinjaPlayerProps) {
  return (
    <div
      id="ninja-container"
      className="pointer-events-none absolute bottom-4 z-10 h-[84px] w-[84px] -translate-x-1/2 transition-[left] duration-200 ease-out md:h-[100px] md:w-[100px]"
      style={{ left: `${xPercent}%` }}
      aria-hidden="true"
      data-character-id={character.characterId}
      data-character-pose={character.visual.pose}
    >
      <div
        className={[
          'relative h-full w-full',
          animation === 'attack' ? 'ninja-attack' : '',
          animation === 'damage' ? 'ninja-damage' : '',
        ].join(' ')}
      >
        <CharacterFigure
          skinClass={character.skinClass}
          visual={character.visual}
          showIdleEffects={!reducedMotion}
        />
        {showScoreBurst && !reducedMotion && (
          <div className="ability-burst ability-burst--fire" data-ability-fx="score" />
        )}
        {showGuardBurst && !reducedMotion && (
          <div className="ability-burst ability-burst--shield" data-ability-fx="guard" />
        )}
      </div>
    </div>
  )
}
