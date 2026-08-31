import { describe, expect, it } from 'vitest'
import {
  getResultVisualMotion,
  getResultVisualMotionClass,
  RESULT_VISUAL_MOTION_CLASS,
} from './gachaResultVisual'

describe('gachaResultVisual', () => {
  it('uses exclusive single states', () => {
    expect(getResultVisualMotionClass({
      isMulti: false,
      staggerActive: false,
      isVisible: true,
      playCardEntrance: true,
      itemIndex: 0,
      latestVisibleIndex: 0,
    })).toBe(RESULT_VISUAL_MOTION_CLASS['single-enter'])

    expect(getResultVisualMotionClass({
      isMulti: false,
      staggerActive: false,
      isVisible: true,
      playCardEntrance: false,
      itemIndex: 0,
      latestVisibleIndex: 0,
    })).toBe(RESULT_VISUAL_MOTION_CLASS['single-settled'])
  })

  it('uses stagger only for the latest visible multi card', () => {
    expect(getResultVisualMotion({
      isMulti: true,
      staggerActive: true,
      isVisible: true,
      playCardEntrance: false,
      itemIndex: 2,
      latestVisibleIndex: 2,
    })).toBe('multi-stagger')

    expect(getResultVisualMotion({
      isMulti: true,
      staggerActive: true,
      isVisible: true,
      playCardEntrance: false,
      itemIndex: 1,
      latestVisibleIndex: 2,
    })).toBe('multi-settled')
  })

  it('returns null for hidden cells', () => {
    expect(getResultVisualMotionClass({
      isMulti: true,
      staggerActive: true,
      isVisible: false,
      playCardEntrance: false,
      itemIndex: 0,
      latestVisibleIndex: 0,
    })).toBe('')
  })
})
