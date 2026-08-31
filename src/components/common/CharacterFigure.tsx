import { useMemo } from 'react'
import type {
  CharacterAccessory,
  CharacterIdleEffect,
  CharacterPose,
  CharacterRarity,
  CharacterVisualConfig,
} from '../../config/characterTypes'
import {
  buildGeneratedSkinSvg,
  isGeneratedSkinClass,
} from '../../utils/characterSkinGenerator'

interface CharacterFigureProps {
  skinClass: string
  visual: CharacterVisualConfig
  className?: string
  /** idle エフェクトを表示するか（reduced motion 時は false） */
  showIdleEffects?: boolean
  rarity?: CharacterRarity
  /** ガチャ結果など用途別サイズ・描画 */
  variant?: 'default' | 'gacha-result'
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
  woodenShuriken: 'character-accessory character-accessory--wooden-shuriken',
  sandals: 'character-accessory character-accessory--sandals',
  shortSword: 'character-accessory character-accessory--short-sword',
  dualBlades: 'character-accessory character-accessory--dual-blades',
  redEyes: 'character-accessory character-accessory--red-eyes',
  helmet: 'character-accessory character-accessory--helmet',
  lightningMark: 'character-accessory character-accessory--lightning',
  whiteCloak: 'character-accessory character-accessory--white-cloak',
  blackFlame: 'character-accessory character-accessory--black-flame',
  oniMask: 'character-accessory character-accessory--oni-mask',
  moonCrest: 'character-accessory character-accessory--moon-crest',
  windScroll: 'character-accessory character-accessory--wind-scroll',
  foxTail: 'character-accessory character-accessory--fox-tail',
  leafMark: 'character-accessory character-accessory--leaf-mark',
  silverBlade: 'character-accessory character-accessory--silver-blade',
  dawnSash: 'character-accessory character-accessory--dawn-sash',
}

const POSE_CLASS: Record<CharacterPose, string> = {
  basic: 'character-pose-basic',
  aggressive: 'character-pose-aggressive',
  defensive: 'character-pose-defensive',
  leader: 'character-pose-leader',
  crouched: 'character-pose-crouched',
  leaping: 'character-pose-leaping',
  twin: 'character-pose-twin',
  mystic: 'character-pose-mystic',
  storm: 'character-pose-storm',
  moon: 'character-pose-moon',
  wind: 'character-pose-wind',
  oni: 'character-pose-oni',
  fox: 'character-pose-fox',
  shadow: 'character-pose-shadow',
  dawn: 'character-pose-dawn',
  silver: 'character-pose-silver',
}

const EFFECT_CLASS: Record<CharacterIdleEffect, string> = {
  none: '',
  fire: 'character-idle-effect character-idle-effect--fire',
  water: 'character-idle-effect character-idle-effect--water',
  gold: 'character-idle-effect character-idle-effect--gold',
  lightning: 'character-idle-effect character-idle-effect--lightning',
  moon: 'character-idle-effect character-idle-effect--moon',
  wind: 'character-idle-effect character-idle-effect--wind',
  shadow: 'character-idle-effect character-idle-effect--shadow',
  fox: 'character-idle-effect character-idle-effect--fox',
  ember: 'character-idle-effect character-idle-effect--ember',
  mist: 'character-idle-effect character-idle-effect--mist',
}

export function CharacterFigure({
  skinClass,
  visual,
  className = '',
  showIdleEffects = true,
  rarity,
  variant = 'default',
}: CharacterFigureProps) {
  const rarityClass = rarity
    ? `character-figure--rarity-${rarity.toLowerCase()}`
    : ''
  const variantClass =
    variant === 'gacha-result' ? 'character-figure--gacha-result' : ''

  const generatedStyle = useMemo(() => {
    if (!isGeneratedSkinClass(skinClass)) {
      return undefined
    }
    return {
      backgroundImage: `url("${buildGeneratedSkinSvg(visual.skinSeed ?? 0, rarity, visual)}")`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center bottom',
    } as const
  }, [skinClass, visual, rarity])

  return (
    <div
      className={[
        'character-figure',
        POSE_CLASS[visual.pose],
        rarityClass,
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div
        className={['ninja-sprite character-body h-full w-full', skinClass].join(' ')}
        style={generatedStyle}
      />
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
