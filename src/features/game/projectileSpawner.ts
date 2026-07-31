import type { TypingProblem } from '../../types/typing'
import type {
  EnemyProjectile,
  FallingTrajectory,
  ProjectileSize,
} from '../../types/projectile'
import { createRomajiMatchState } from '../../utils/romajiMatcher'
import { getRepresentativeRomaji } from '../../utils/selectTypingProblem'

let projectileSeq = 0

export function resetProjectileIdSequence(): void {
  projectileSeq = 0
}

export interface CreateProjectileParams {
  problem: TypingProblem
  spawnX: number
  trajectory: FallingTrajectory
  size: ProjectileSize
  damage: number
  flightDurationMs: number
  nowMs: number
  idFactory?: () => string
}

export function createEnemyProjectile(
  params: CreateProjectileParams,
): EnemyProjectile {
  const {
    problem,
    spawnX,
    trajectory,
    size,
    damage,
    flightDurationMs,
    nowMs,
    idFactory = () => {
      projectileSeq += 1
      return `proj-${projectileSeq}`
    },
  } = params

  return {
    id: idFactory(),
    problemId: problem.id,
    displayText: problem.displayText,
    reading: problem.reading,
    displayRomaji: getRepresentativeRomaji(problem),
    romajiPatterns: problem.romajiPatterns.map((p) => p.toLowerCase()),
    matchState: createRomajiMatchState(),
    typedLength: 0,
    baseScore: problem.baseScore,
    spawnX,
    spawnY: -6,
    velocityX: 0,
    velocityY: 1,
    speed: 100 / Math.max(1, flightDurationMs),
    trajectory,
    size,
    damage,
    spawnTimeMs: nowMs,
    flightDurationMs,
    estimatedImpactTimeMs: nowMs + flightDurationMs,
    state: 'incoming',
    resolveAction: null,
  }
}

export function canSpawnMore(activeCount: number, maxActive: number): boolean {
  return activeCount < maxActive
}
