import { useEffect, useRef } from 'react'
import type { GameTarget } from '../../types/game'

interface FallingTargetProps {
  target: GameTarget
  isLocked: boolean
  showMiss: boolean
  registerElement: (id: string, element: HTMLElement | null) => void
}

export function FallingTarget({
  target,
  isLocked,
  showMiss,
  registerElement,
}: FallingTargetProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    registerElement(target.id, rootRef.current)
    return () => {
      registerElement(target.id, null)
    }
  }, [registerElement, target.id])

  const chars = target.displayRomaji.split('')

  return (
    <div
      ref={rootRef}
      className={[
        'target-container absolute top-0 flex flex-col items-center will-change-transform',
        target.state === 'destroyed' ? 'target-destroyed' : '',
      ].join(' ')}
      style={{
        left: `${target.xPercent}%`,
      }}
      data-target-id={target.id}
    >
      <div className="enemy-sprite mb-1 h-10 w-10 md:h-12 md:w-12" aria-hidden="true" />
      <div
        className={[
          'target-word rounded-lg border-2 bg-black/70 px-3 py-1 text-lg font-bold whitespace-nowrap shadow-md md:text-xl',
          isLocked
            ? 'border-[var(--color-accent-yellow)] shadow-[var(--glow-yellow)]'
            : 'border-[var(--color-border-red)]',
          showMiss && isLocked ? 'target-miss-shake' : '',
        ].join(' ')}
      >
        <div className="mb-0.5 text-center text-xs font-normal text-[var(--color-text-soft)] md:text-sm">
          {target.displayText}
        </div>
        <div
          className="font-display text-sm tracking-wide md:text-base"
          aria-label={`${target.displayText} ${target.displayRomaji}`}
        >
          {chars.map((char, index) => {
            const isTyped = index < target.typedLength
            const isCurrent = index === target.typedLength && target.state !== 'destroyed'
            return (
              <span
                key={`${target.id}-${index}`}
                className={[
                  isTyped ? 'char-correct' : '',
                  isCurrent ? 'char-current' : '',
                  !isTyped && !isCurrent ? 'char-pending' : '',
                ].join(' ')}
              >
                {char}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
