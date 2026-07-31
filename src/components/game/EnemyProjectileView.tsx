import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import type { EnemyProjectile } from '../../types/projectile'
import { PLAYER_X_PERCENT } from '../../types/projectile'

interface EnemyProjectileViewProps {
  projectile: EnemyProjectile
  isLocked: boolean
  showMiss: boolean
  registerElement: (id: string, element: HTMLElement | null) => void
}

function bounceOffsetPx(spawnX: number): { x: number; y: number } {
  if (spawnX < PLAYER_X_PERCENT - 8) {
    return { x: -16, y: -20 }
  }
  if (spawnX > PLAYER_X_PERCENT + 8) {
    return { x: 16, y: -20 }
  }
  return { x: 10, y: -18 }
}

export function EnemyProjectileView({
  projectile,
  isLocked,
  registerElement,
}: EnemyProjectileViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    registerElement(projectile.id, rootRef.current)
    return () => {
      registerElement(projectile.id, null)
    }
  }, [registerElement, projectile.id])

  // top は React style に載せない（resolve 再描画で spawnY へ戻るのを防ぐ）
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (!el.style.top) {
      el.style.top = `${projectile.spawnY}%`
    }
  }, [projectile.id, projectile.spawnY])

  const isResolving =
    projectile.state === 'resolving' || projectile.state === 'destroyed'
  const isEmergency =
    isResolving && projectile.resolveAction === 'emergency-slash'
  const bounce = bounceOffsetPx(projectile.spawnX)

  return (
    <div
      ref={rootRef}
      className={[
        'enemy-projectile absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center',
        `enemy-size-${projectile.size}`,
        isLocked ? 'enemy-projectile--locked' : '',
        isResolving && !isEmergency ? 'projectile-impact projectile-impact--throw' : '',
        isEmergency ? 'projectile-impact projectile-impact--slash' : '',
        projectile.state === 'hit' ? 'opacity-0' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          left: `${projectile.spawnX}%`,
          '--impact-bounce-x': `${bounce.x}px`,
          '--impact-bounce-y': `${bounce.y}px`,
        } as CSSProperties
      }
      data-testid="enemy-projectile"
      data-projectile-id={projectile.id}
      data-trajectory={projectile.trajectory}
      data-state={projectile.state}
      data-size={projectile.size}
      data-resolve-action={projectile.resolveAction ?? ''}
      data-x={Math.round(projectile.spawnX)}
      data-y={Math.round(projectile.spawnY)}
      data-spawn-x={Math.round(projectile.spawnX)}
    >
      {/* 文言は ProblemBanner 側。敵本体は手裏剣の見た目のみ */}
      <span
        className="sr-only"
        aria-label={`${projectile.displayText} ${projectile.displayRomaji}`}
      >
        {projectile.displayText} {projectile.displayRomaji}
      </span>

      <div className="enemy-visual relative" aria-hidden="true">
        <div
          className={[
            'enemy-sprite',
            projectile.state === 'incoming' || projectile.state === 'targeted'
              ? 'enemy-spin'
              : '',
            isResolving && !isEmergency ? 'enemy-spin-impact' : '',
            isEmergency ? 'enemy-sprite--split-a' : '',
          ].join(' ')}
          data-testid="enemy-shuriken-sprite"
        />
        {isEmergency && (
          <div
            className="enemy-sprite enemy-sprite--split-b"
            data-testid="enemy-shuriken-split"
          />
        )}
        {isResolving && (
          <div className="impact-fx" data-testid="impact-fx">
            <span className="impact-fx__shock" />
            <span className="impact-fx__spark impact-fx__spark--1" />
            <span className="impact-fx__spark impact-fx__spark--2" />
            <span className="impact-fx__spark impact-fx__spark--3" />
            <span className="impact-fx__spark impact-fx__spark--4" />
            <span className="impact-fx__shard impact-fx__shard--1" />
            <span className="impact-fx__shard impact-fx__shard--2" />
            <span className="impact-fx__shard impact-fx__shard--3" />
          </div>
        )}
      </div>
    </div>
  )
}
