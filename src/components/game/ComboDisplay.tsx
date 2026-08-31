interface ComboDisplayProps {
  combo: number
  xPercent: number
  yPx: number
  visible: boolean
}

export function ComboDisplay({
  combo,
  xPercent,
  yPx,
  visible,
}: ComboDisplayProps) {
  if (!visible || combo < 5) {
    return null
  }

  return (
    <div
      className="combo-popup pointer-events-none absolute z-40 font-game text-2xl text-[var(--color-accent-yellow)]"
      style={{
        left: `${xPercent}%`,
        top: `${Math.max(0, yPx - 40)}px`,
        transform: 'translateX(-50%)',
      }}
      aria-hidden="true"
    >
      {combo} HIT!
    </div>
  )
}
