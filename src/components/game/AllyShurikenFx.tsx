import type { CSSProperties } from 'react'

export type AllyShurikenVariant = 'basic' | 'fire' | 'water' | 'gold'

interface AllyShurikenFxProps {
  id: string
  fromXPercent: number
  fromYPercent: number
  toXPercent: number
  toYPercent: number
  areaWidthPx: number
  areaHeightPx: number
  angleDeg: number
  variant: AllyShurikenVariant
}

export function AllyShurikenFx({
  id,
  fromXPercent,
  fromYPercent,
  toXPercent,
  toYPercent,
  areaWidthPx,
  areaHeightPx,
  angleDeg,
  variant,
}: AllyShurikenFxProps) {
  const dxPx = ((toXPercent - fromXPercent) / 100) * areaWidthPx
  const dyPx = ((toYPercent - fromYPercent) / 100) * areaHeightPx
  return (
    <div
      className={[
        'ally-shuriken pointer-events-none absolute z-30',
        `ally-shuriken--${variant}`,
      ].join(' ')}
      data-testid="ally-shuriken"
      data-ally-id={id}
      data-ally-angle={angleDeg.toFixed(1)}
      data-ally-dx={dxPx.toFixed(1)}
      data-ally-dy={dyPx.toFixed(1)}
      data-ally-variant={variant}
      style={
        {
          left: `${fromXPercent}%`,
          top: `${fromYPercent}%`,
          '--ally-dx': `${dxPx}px`,
          '--ally-dy': `${dyPx}px`,
          '--ally-angle': `${angleDeg}deg`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="ally-shuriken__trail" data-testid="ally-shuriken-trail" />
      <span className="ally-shuriken__body" data-testid="ally-shuriken-spin" />
    </div>
  )
}
