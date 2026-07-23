import type { MotionPreference } from '../types/app'

export function resolveReducedMotion(
  preference: MotionPreference,
  prefersReduced?: boolean,
): boolean {
  if (preference === 'reduced') {
    return true
  }
  if (preference === 'full') {
    return false
  }

  if (typeof prefersReduced === 'boolean') {
    return prefersReduced
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function applyMotionPreference(preference: MotionPreference): void {
  if (typeof document === 'undefined') {
    return
  }

  const reduced = resolveReducedMotion(preference)
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
}
