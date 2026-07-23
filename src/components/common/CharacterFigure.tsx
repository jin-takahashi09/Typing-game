import type {
  CharacterAccessory,
  CharacterIdleEffect,
  CharacterPose,
  CharacterVisualConfig,
} from '../../config/characters'

interface CharacterFigureProps {
  skinClass: string
  visual: CharacterVisualConfig
  className?: string
  /** idle エフェクトを表示するか（reduced motion 時は false） */
  showIdleEffects?: boolean
}

const ACCESSORY_CLASS: Record<CharacterAccessory, string> = {
  headband: 'character-accessory character-accessory--headband',
  scarf: 'character-accessory character-accessory--scarf',
  dagger: 'character-accessory character-accessory--dagger',
  shield: 'character-accessory character-accessory--shield',
  armor: 'character-accessory character-accessory--armor',
  mask: 'character-accessory character-accessory--mask',
  scroll: 'character-accessory character-accessory--scroll',
  coinBag: 'character-accessory character-accessory--coin-bag',
  shoulderPad: 'character-accessory character-accessory--shoulder',
  crest: 'character-accessory character-accessory--crest',
}

const POSE_CLASS: Record<CharacterPose, string> = {
  basic: 'character-pose-basic',
  aggressive: 'character-pose-aggressive',
  defensive: 'character-pose-defensive',
  leader: 'character-pose-leader',
}

const EFFECT_CLASS: Record<CharacterIdleEffect, string> = {
  none: '',
  fire: 'character-idle-effect character-idle-effect--fire',
  water: 'character-idle-effect character-idle-effect--water',
  gold: 'character-idle-effect character-idle-effect--gold',
}

export function CharacterFigure({
  skinClass,
  visual,
  className = '',
  showIdleEffects = true,
}: CharacterFigureProps) {
  return (
    <div
      className={[
        'character-figure',
        POSE_CLASS[visual.pose],
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      <div className={['ninja-sprite character-body h-full w-full', skinClass].join(' ')} />
      {visual.accessories.map((accessory) => (
        <div
          key={accessory}
          className={ACCESSORY_CLASS[accessory]}
          data-accessory={accessory}
        />
      ))}
      {showIdleEffects && visual.effect !== 'none' && (
        <div className={EFFECT_CLASS[visual.effect]} data-idle-effect={visual.effect} />
      )}
    </div>
  )
}
