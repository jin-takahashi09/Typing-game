import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusOnMount(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }
    const node = ref.current
    if (!node) {
      return
    }
    const previous = document.activeElement as HTMLElement | null
    if (typeof node.focus === 'function') {
      node.focus()
    }
    return () => {
      if (previous && typeof previous.focus === 'function') {
        previous.focus()
      }
    }
  }, [ref, enabled])
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      )

    const initial = focusables()
    initial[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
    }
  }, [containerRef, enabled])
}

/** Convenience hook for dialog panels */
export function useDialogA11y(
  enabled: boolean,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)
  useFocusTrap(ref, enabled)
  return ref
}
