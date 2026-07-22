import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { gameConfig } from '../config/gameConfig'

export interface TargetMotion {
  y: number
  speed: number
}

interface UseGameLoopParams {
  enabled: boolean
  areaHeight: number
  getSpawnIntervalMs: () => number
  onSpawnNeeded: () => void
  onTargetsReachedBottom: (targetIds: string[]) => void
  targetsRef: MutableRefObject<Map<string, TargetMotion>>
  elementRefs: MutableRefObject<Map<string, HTMLElement>>
}

export function useGameLoop({
  enabled,
  areaHeight,
  getSpawnIntervalMs,
  onSpawnNeeded,
  onTargetsReachedBottom,
  targetsRef,
  elementRefs,
}: UseGameLoopParams): void {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const spawnTimerRef = useRef(0)
  const runningRef = useRef(false)
  const bottomLineRef = useRef(0)
  const callbacksRef = useRef({
    getSpawnIntervalMs,
    onSpawnNeeded,
    onTargetsReachedBottom,
  })

  useEffect(() => {
    callbacksRef.current = {
      getSpawnIntervalMs,
      onSpawnNeeded,
      onTargetsReachedBottom,
    }
    bottomLineRef.current = Math.max(0, areaHeight - gameConfig.groundOffsetPx)
  }, [getSpawnIntervalMs, onSpawnNeeded, onTargetsReachedBottom, areaHeight])

  useEffect(() => {
    if (!enabled || areaHeight <= 0) {
      runningRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimeRef.current = null
      spawnTimerRef.current = 0
      return
    }

    if (runningRef.current) {
      return
    }

    runningRef.current = true

    const tick = (timestamp: number) => {
      if (!runningRef.current) {
        return
      }

      const lastTime = lastTimeRef.current
      lastTimeRef.current = timestamp

      if (lastTime !== null) {
        const delta = Math.min(timestamp - lastTime, gameConfig.maxDeltaMs)

        const reached: string[] = []
        const bottom = bottomLineRef.current

        targetsRef.current.forEach((motion, id) => {
          motion.y += motion.speed * (delta / 16.6)
          const element = elementRefs.current.get(id)
          if (element) {
            element.style.transform = `translate3d(-50%, ${motion.y}px, 0)`
            element.dataset.fallY = String(Math.round(motion.y))
          }
          if (motion.y >= bottom) {
            reached.push(id)
          }
        })

        if (reached.length > 0) {
          callbacksRef.current.onTargetsReachedBottom(reached)
        }

        spawnTimerRef.current += delta

        if (spawnTimerRef.current >= callbacksRef.current.getSpawnIntervalMs()) {
          spawnTimerRef.current = 0
          callbacksRef.current.onSpawnNeeded()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      runningRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimeRef.current = null
    }
  }, [enabled, areaHeight, targetsRef, elementRefs])
}
