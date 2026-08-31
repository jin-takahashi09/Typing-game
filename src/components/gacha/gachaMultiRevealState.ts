import { MULTI_SCROLL_COUNT } from './gachaMultiReveal'

export function isMultiRevealComplete(
  revealedCount: number,
  activeRevealIndex: number | null,
  total = MULTI_SCROLL_COUNT,
): boolean {
  return revealedCount >= total && activeRevealIndex === null
}

export function shouldDimMultiGridBackground(activeRevealIndex: number | null): boolean {
  return activeRevealIndex !== null
}

export function isActiveMultiRevealSlot(
  index: number,
  activeRevealIndex: number | null,
): boolean {
  return activeRevealIndex !== null && index === activeRevealIndex
}
