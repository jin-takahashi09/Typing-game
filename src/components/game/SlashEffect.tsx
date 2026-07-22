interface SlashEffectItem {
  id: string
  xPercent: number
  yPx: number
}

interface SlashEffectProps {
  effects: SlashEffectItem[]
}

export function SlashEffect({ effects }: SlashEffectProps) {
  return (
    <>
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="slash-effect pointer-events-none absolute z-20"
          style={{
            left: `calc(${effect.xPercent}% - 40px)`,
            top: `${effect.yPx - 20}px`,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}
