import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { gameConfig } from '../config/gameConfig'
import type { EnemyProjectile } from '../types/projectile'
import { PLAYER_Y_PERCENT } from '../types/projectile'
import {
  computeFallProgress,
  sampleFallingMotion,
} from '../utils/fallingProjectileMotion'

export interface ProjectileMotionState {
  elapsedMs: number
}

interface UseFallingProjectileLoopParams {
  enabled: boolean
  getProjectiles: () => readonly EnemyProjectile[]
  motionRef: MutableRefObject<Map<string, ProjectileMotionState>>
  elementRefs: MutableRefObject<Map<string, HTMLElement>>
  frozenPositionsRef: MutableRefObject<
    Map<string, { xPercent: number; yPercent: number }>
  >
  onFrameImpactCheck: (nowMs: number) => void
  onSpawnTick: (nowMs: number) => void
  gameNowMs: () => number
}

export function useFallingProjectileLoop({
  enabled,
  getProjectiles,
  motionRef,
  elementRefs,
  frozenPositionsRef,
  onFrameImpactCheck,
  onSpawnTick,
  gameNowMs,
}: UseFallingProjectileLoopParams): void {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const callbacksRef = useRef({
    getProjectiles,
    onFrameImpactCheck,
    onSpawnTick,
    gameNowMs,
  })

  useEffect(() => {
    callbacksRef.current = {
      getProjectiles,
      onFrameImpactCheck,
      onSpawnTick,
      gameNowMs,
    }
  }, [getProjectiles, onFrameImpactCheck, onSpawnTick, gameNowMs])

  useEffect(() => {
    if (!enabled) {
      runningRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimeRef.current = null
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
      const nowMs = callbacksRef.current.gameNowMs()

      if (lastTime === null) {
        callbacksRef.current.onSpawnTick(nowMs)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const pauseMotion = Boolean(window.__SHINOBI_KEYS_TEST__?.pauseMotion)
      const delta = pauseMotion
        ? 0
        : Math.min(timestamp - lastTime, gameConfig.maxDeltaMs)
      const projectiles = callbacksRef.current.getProjectiles()

      for (const projectile of projectiles) {
        if (
          projectile.state === 'destroyed' ||
          projectile.state === 'hit'
        ) {
          continue
        }

        const frozen = frozenPositionsRef.current.get(projectile.id)
        const element = elementRefs.current.get(projectile.id)
        if (frozen) {
          if (element) {
            element.style.left = `${frozen.xPercent}%`
            element.style.top = `${frozen.yPercent}%`
            element.dataset.x = String(Math.round(frozen.xPercent))
            element.dataset.y = String(Math.round(frozen.yPercent))
            element.dataset.freeze = '1'
          }
          continue
        }

        let motion = motionRef.current.get(projectile.id)
        if (!motion) {
          motion = { elapsedMs: 0 }
          motionRef.current.set(projectile.id, motion)
        }
        if (!pauseMotion) {
          motion.elapsedMs += delta
        }

        const progress = computeFallProgress(
          motion.elapsedMs,
          projectile.flightDurationMs,
        )
        const sample = sampleFallingMotion({
          spawnX: projectile.spawnX,
          spawnY: projectile.spawnY,
          impactY: PLAYER_Y_PERCENT,
          trajectory: projectile.trajectory,
          progress,
        })

        if (element) {
          element.style.left = `${sample.xPercent}%`
          element.style.top = `${sample.yPercent}%`
          element.dataset.x = String(Math.round(sample.xPercent))
          element.dataset.y = String(Math.round(sample.yPercent))
          element.dataset.spawnX = String(Math.round(projectile.spawnX))
        }
      }

      if (!pauseMotion) {
        callbacksRef.current.onFrameImpactCheck(nowMs)
      }
      callbacksRef.current.onSpawnTick(nowMs)
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
  }, [enabled, motionRef, elementRefs, frozenPositionsRef])
}
