export type ResultVisualMotion =
  | 'single-enter'
  | 'single-settled'
  | 'multi-stagger'
  | 'multi-settled'

export const RESULT_VISUAL_MOTION_CLASS: Record<ResultVisualMotion, string> = {
  'single-enter': 'gacha-result-visual--single-enter',
  'single-settled': 'gacha-result-visual--single-settled',
  'multi-stagger': 'gacha-result-visual--multi-stagger',
  'multi-settled': 'gacha-result-visual--multi-settled',
}

export function getResultVisualMotion(input: {
  isMulti: boolean
  staggerActive: boolean
  isVisible: boolean
  playCardEntrance: boolean
  itemIndex: number
  latestVisibleIndex: number
}): ResultVisualMotion | null {
  if (!input.isVisible) {
    return null
  }
  if (!input.isMulti) {
    return input.playCardEntrance ? 'single-enter' : 'single-settled'
  }
  if (!input.staggerActive) {
    return 'multi-settled'
  }
  return input.itemIndex === input.latestVisibleIndex ? 'multi-stagger' : 'multi-settled'
}

export function getResultVisualMotionClass(input: Parameters<typeof getResultVisualMotion>[0]): string {
  const motion = getResultVisualMotion(input)
  return motion ? RESULT_VISUAL_MOTION_CLASS[motion] : ''
}
