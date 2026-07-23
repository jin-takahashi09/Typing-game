interface AbilityFloatTextProps {
  text: string
  variant?: 'fire' | 'water' | 'gold'
}

export function AbilityFloatText({
  text,
  variant = 'fire',
}: AbilityFloatTextProps) {
  return (
    <div
      className={[
        'pointer-events-none absolute z-40',
        'ability-float-text',
        `ability-float-text--${variant}`,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  )
}
