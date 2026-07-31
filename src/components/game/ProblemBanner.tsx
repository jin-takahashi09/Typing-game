import type { EnemyProjectile } from '../../types/projectile'

interface ProblemBannerProps {
  projectile: EnemyProjectile
  showMiss: boolean
}

/** HUD 下の中央に問題を大きく表示（寿司打方式の主表示） */
export function ProblemBanner({ projectile, showMiss }: ProblemBannerProps) {
  const chars = projectile.displayRomaji.split('')
  return (
    <div
      className={[
        'problem-banner',
        showMiss ? 'target-miss-shake' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="problem-banner"
      data-projectile-id={projectile.id}
    >
      <div className="problem-banner__ja" data-testid="enemy-ja">
        {projectile.displayText}
      </div>
      <div
        className="problem-banner__romaji"
        aria-label={`${projectile.displayText} ${projectile.displayRomaji}`}
        data-testid="enemy-romaji"
      >
        {chars.map((char, index) => {
          const isTyped = index < projectile.typedLength
          const isCurrent =
            index === projectile.typedLength &&
            projectile.state !== 'destroyed' &&
            projectile.state !== 'hit' &&
            projectile.state !== 'resolving'
          return (
            <span
              key={`${projectile.id}-banner-${index}`}
              className={[
                isTyped ? 'char-correct' : '',
                isCurrent ? 'char-current' : '',
                !isTyped && !isCurrent ? 'char-pending' : '',
              ].join(' ')}
            >
              {char}
            </span>
          )
        })}
      </div>
    </div>
  )
}
