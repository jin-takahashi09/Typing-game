import type { ButtonHTMLAttributes, ReactNode } from 'react'

type GameButtonVariant = 'primary' | 'secondary' | 'ghost'
type GameButtonSize = 'md' | 'lg'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: GameButtonVariant
  size?: GameButtonSize
}

const variantClass: Record<GameButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent-red)] border-[var(--color-accent-red-deep)] text-white shadow-[var(--glow-red)] hover:brightness-110',
  secondary:
    'bg-[var(--color-accent-blue)] border-[var(--color-accent-blue-deep)] text-white shadow-[var(--glow-blue)] hover:brightness-110',
  ghost:
    'bg-black/40 border-[var(--color-border-blue)] text-[var(--color-text-soft)] hover:bg-black/55',
}

const sizeClass: Record<GameButtonSize, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-8 py-4 text-base md:text-xl',
}

export function GameButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...rest
}: GameButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'font-display rounded-[var(--radius-md)] border-b-4 transition-all',
        'duration-[var(--duration-fast)] transform',
        'hover:scale-105 active:scale-95 active:border-b-0 active:translate-y-1',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
        'disabled:active:translate-y-0 disabled:active:border-b-4',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--color-accent-yellow)]',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
