import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GachaPullType } from '../../utils/gacha'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface GachaFullscreenOverlayProps {
  pullType: GachaPullType
  phase: 'machine' | 'reveal' | 'result'
  children: ReactNode
}

/** Shared full-viewport layer for machine → reveal → result. */
export function GachaFullscreenOverlay({
  pullType,
  phase,
  children,
}: GachaFullscreenOverlayProps) {
  useBodyScrollLock(true)

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={[
        'gacha-portal',
        'gacha-fullscreen-overlay',
        `gacha-fullscreen-overlay--${phase}`,
        pullType === 'multi'
          ? 'gacha-fullscreen-overlay--multi'
          : 'gacha-fullscreen-overlay--single',
      ].join(' ')}
      data-testid="gacha-fullscreen-overlay"
      data-phase={phase}
      data-pull-type={pullType}
    >
      <div className="gacha-fullscreen-overlay__backdrop" aria-hidden="true" />
      <div className="gacha-fullscreen-overlay__stage">{children}</div>
    </div>,
    document.body,
  )
}
