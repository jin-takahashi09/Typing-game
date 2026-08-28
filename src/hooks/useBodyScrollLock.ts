import { useEffect } from 'react'

/**
 * Locks document scrolling while `locked` is true.
 * Restores the previous overflow on unlock / unmount.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return
    }

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight

    const scrollbarGap = window.innerWidth - documentElement.clientWidth
    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`
    }

    return () => {
      body.style.overflow = previousBodyOverflow
      documentElement.style.overflow = previousHtmlOverflow
      body.style.paddingRight = previousBodyPaddingRight
    }
  }, [locked])
}
