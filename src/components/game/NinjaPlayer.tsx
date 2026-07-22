import type { NinjaAnimationState } from '../../types/game'

interface NinjaPlayerProps {
  xPercent: number
  animation: NinjaAnimationState
}

export function NinjaPlayer({ xPercent, animation }: NinjaPlayerProps) {
  return (
    <div
      id="ninja-container"
      className="pointer-events-none absolute bottom-4 z-10 h-[84px] w-[84px] -translate-x-1/2 transition-[left] duration-200 ease-out md:h-[100px] md:w-[100px]"
      style={{ left: `${xPercent}%` }}
      aria-hidden="true"
    >
      <div
        className={[
          'ninja-sprite h-full w-full',
          animation === 'attack' ? 'ninja-attack' : '',
          animation === 'damage' ? 'ninja-damage' : '',
        ].join(' ')}
      />
    </div>
  )
}
