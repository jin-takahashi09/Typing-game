import type { CSSProperties } from 'react'
import type { ActivePlayCharacter } from '../../config/characters'
import type { PlayerAction } from '../../types/projectile'
import { PLAYER_X_PERCENT, PLAYER_Y_PERCENT } from '../../types/projectile'
import { CharacterFigure } from '../common/CharacterFigure'

interface NinjaPlayerProps {
  action: PlayerAction
  character: ActivePlayCharacter
  reducedMotion: boolean
  slashAngleDeg?: number
  showScoreBurst?: boolean
  showEmergencyHint?: boolean
}

export function NinjaPlayer({
  action,
  character,
  reducedMotion,
  slashAngleDeg = 0,
  showScoreBurst = false,
  showEmergencyHint = false,
}: NinjaPlayerProps) {
  const isEmergency = action === 'emergency-slashing'
  return (
    <div
      id="ninja-container"
      className={[
        'pointer-events-none absolute z-25 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 md:h-[104px] md:w-[104px]',
        'ninja-grounded',
        `ninja-action-${action}`,
        reducedMotion ? 'ninja-reduced' : '',
      ].join(' ')}
      style={{ left: `${PLAYER_X_PERCENT}%`, top: `${PLAYER_Y_PERCENT}%` }}
      aria-hidden="true"
      data-testid="ninja-player"
      data-player-action={action}
      data-character-id={character.characterId}
      data-character-pose={character.visual.pose}
    >
      <div className="relative h-full w-full">
        <CharacterFigure
          skinClass={character.skinClass}
          visual={character.visual}
          showIdleEffects={!reducedMotion && action === 'idle'}
          rarity={character.rarity}
        />
        {isEmergency && !reducedMotion && (
          <>
            <div
              className="sword-draw"
              data-testid="sword-draw"
            />
            <div
              className="slash-arc slash-arc--emergency"
              data-testid="slash-arc"
              style={
                {
                  '--slash-angle': `${slashAngleDeg}deg`,
                } as CSSProperties
              }
            />
            <div
              className="slash-arc slash-arc--emergency slash-arc--echo"
              style={
                {
                  '--slash-angle': `${slashAngleDeg + 12}deg`,
                } as CSSProperties
              }
            />
            <div className="slash-local-glow" data-testid="slash-local-glow" />
          </>
        )}
        {showEmergencyHint && (
          <span
            className="emergency-hint"
            data-testid="emergency-slash-hint"
          >
            ギリギリ
          </span>
        )}
        {showScoreBurst && !reducedMotion && (
          <div className="ability-burst ability-burst--fire" data-ability-fx="score" />
        )}
      </div>
    </div>
  )
}
