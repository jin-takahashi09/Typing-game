import type { DifficultyId } from '../../types/app'
import type { GameAction, GameState } from '../../types/game'
import type { EnemyProjectile } from '../../types/projectile'
import { gameConfig } from '../../config/gameConfig'
import { clampDefense } from '../../utils/calculateScore'
import { getActiveRomajiView } from '../../utils/romajiMatcher'

export function createInitialGameState(
  difficulty: DifficultyId = 'ninja',
  maxDefense: number = gameConfig.maxHealth,
): GameState {
  return {
    status: 'ready',
    difficulty,
    score: 0,
    combo: 0,
    maxCombo: 0,
    defense: maxDefense,
    destroyedTargets: 0,
    failedTargets: 0,
    activeProjectiles: [],
    lockedProjectileId: null,
    lastProblemId: null,
    lastInterceptAction: null,
    playerAction: 'idle',
    typedCount: 0,
    correctChars: 0,
    missCount: 0,
    gameStartedAtMs: null,
    pausedTotalMs: 0,
    pausedAtMs: null,
    idlePausedAtMs: null,
    showMissFeedback: false,
    endReason: null,
    invulnerableUntilMs: 0,
    perfectStreakCount: 0,
    currentProblemHadMiss: false,
    maxPerfectStreak: 0,
    totalBonusSeconds: 0,
    streakRewardCoins: 0,
    timeBonusMs: 0,
    lastStreakRewardEventId: null,
  }
}

function isPlayableProjectile(projectile: EnemyProjectile): boolean {
  return projectile.state === 'incoming' || projectile.state === 'targeted'
}

function hasPlayableProjectile(
  projectiles: readonly EnemyProjectile[],
): boolean {
  return projectiles.some(isPlayableProjectile)
}

function withIdlePauseForProjectiles(
  state: GameState,
  projectiles: EnemyProjectile[],
  nowMs: number | undefined,
): Pick<GameState, 'idlePausedAtMs' | 'pausedTotalMs'> {
  if (
    state.status !== 'playing' ||
    state.gameStartedAtMs === null ||
    state.pausedAtMs !== null
  ) {
    return {
      idlePausedAtMs: state.idlePausedAtMs,
      pausedTotalMs: state.pausedTotalMs,
    }
  }

  const playable = hasPlayableProjectile(projectiles)
  if (playable) {
    if (state.idlePausedAtMs === null || nowMs === undefined) {
      return {
        idlePausedAtMs: null,
        pausedTotalMs: state.pausedTotalMs,
      }
    }
    return {
      idlePausedAtMs: null,
      pausedTotalMs:
        state.pausedTotalMs + Math.max(0, nowMs - state.idlePausedAtMs),
    }
  }

  if (state.idlePausedAtMs !== null || nowMs === undefined) {
    return {
      idlePausedAtMs: state.idlePausedAtMs,
      pausedTotalMs: state.pausedTotalMs,
    }
  }

  return {
    idlePausedAtMs: nowMs,
    pausedTotalMs: state.pausedTotalMs,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
    case 'RESET_GAME':
      return {
        ...createInitialGameState(action.difficulty, action.maxDefense),
        status: 'playing',
        gameStartedAtMs: action.startedAtMs,
      }

    case 'SPAWN_PROJECTILE': {
      const projectiles = [...state.activeProjectiles, action.projectile]
      const nextStarted = state.gameStartedAtMs ?? action.nowMs
      const idleState: GameState = {
        ...state,
        gameStartedAtMs: nextStarted,
      }
      const idle = withIdlePauseForProjectiles(idleState, projectiles, action.nowMs)
      return {
        ...state,
        activeProjectiles: projectiles,
        lastProblemId: action.projectile.problemId,
        currentProblemHadMiss: false,
        gameStartedAtMs: nextStarted,
        pausedTotalMs: idle.pausedTotalMs,
        idlePausedAtMs: idle.idlePausedAtMs,
      }
    }

    case 'TYPE_CORRECT': {
      const projectile = state.activeProjectiles.find(
        (item) => item.id === action.projectileId,
      )
      if (
        !projectile ||
        projectile.state === 'destroyed' ||
        projectile.state === 'hit' ||
        projectile.state === 'resolving'
      ) {
        return state
      }

      return {
        ...state,
        typedCount: state.typedCount + 1,
        correctChars: state.correctChars + 1,
        lockedProjectileId: action.projectileId,
        showMissFeedback: false,
        activeProjectiles: state.activeProjectiles.map((item) =>
          item.id === action.projectileId
            ? {
                ...item,
                typedLength: action.typedLength,
                matchState: action.matchState,
                state: 'targeted' as const,
              }
            : item,
        ),
      }
    }

    case 'TYPE_MISS':
      return {
        ...state,
        typedCount: state.typedCount + 1,
        missCount: state.missCount + 1,
        combo: 0,
        showMissFeedback: true,
        currentProblemHadMiss: true,
        perfectStreakCount: action.preservePerfectStreak
          ? state.perfectStreakCount
          : 0,
      }

    case 'CLEAR_MISS_FEEDBACK':
      return {
        ...state,
        showMissFeedback: false,
      }

    case 'RESOLVE_PROJECTILE': {
      const projectile = state.activeProjectiles.find(
        (item) => item.id === action.projectileId,
      )
      if (
        !projectile ||
        projectile.state === 'destroyed' ||
        projectile.state === 'hit' ||
        projectile.state === 'resolving'
      ) {
        return state
      }

      const nextCombo = state.combo + 1
      const nextDestroyed = state.destroyedTargets + 1
      const nextDefense = clampDefense(state.defense + action.heal)
      const nextScore = state.score + action.scoreGain

      let perfectStreakCount = state.perfectStreakCount
      let maxPerfectStreak = state.maxPerfectStreak
      let totalBonusSeconds = state.totalBonusSeconds
      let streakRewardCoins = state.streakRewardCoins
      let timeBonusMs = state.timeBonusMs
      let lastStreakRewardEventId = state.lastStreakRewardEventId

      if (action.streak.kind === 'skip-miss') {
        perfectStreakCount = action.streak.preserveStreak
          ? state.perfectStreakCount
          : 0
      } else if (action.streak.kind === 'apply') {
        const { result, eventId } = action.streak
        const reached =
          result.previousCount + 1 > 0 ? result.previousCount + 1 : 0
        maxPerfectStreak = Math.max(maxPerfectStreak, reached)
        perfectStreakCount = result.nextCount

        if (eventId !== state.lastStreakRewardEventId) {
          totalBonusSeconds += Math.max(0, result.timeBonusSeconds)
          streakRewardCoins += Math.max(0, result.coinBonus)
          timeBonusMs += Math.max(0, result.timeBonusSeconds) * 1000
          lastStreakRewardEventId = eventId
        }
      }

      const projectiles = state.activeProjectiles.map((item) =>
        item.id === action.projectileId
          ? (() => {
              const view = getActiveRomajiView(
                item.romajiPatterns,
                item.matchState,
              )
              return {
                ...item,
                state: 'resolving' as const,
                resolveAction: action.action,
                typedLength: view.typedLength,
                matchState: {
                  ...item.matchState,
                  confirmedLength: view.typedLength,
                  isComplete: true,
                  activePaths: [],
                },
              }
            })()
          : item,
      )

      return {
        ...state,
        score: nextScore,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        defense: nextDefense,
        destroyedTargets: nextDestroyed,
        lockedProjectileId: null,
        lastInterceptAction: action.action,
        perfectStreakCount,
        maxPerfectStreak,
        totalBonusSeconds,
        streakRewardCoins,
        timeBonusMs,
        lastStreakRewardEventId,
        currentProblemHadMiss: false,
        activeProjectiles: projectiles,
      }
    }

    case 'REMOVE_PROJECTILE': {
      const projectiles = state.activeProjectiles.filter(
        (item) => item.id !== action.projectileId,
      )
      const idle = withIdlePauseForProjectiles(state, projectiles, action.nowMs)
      return {
        ...state,
        activeProjectiles: projectiles,
        lockedProjectileId:
          state.lockedProjectileId === action.projectileId
            ? null
            : state.lockedProjectileId,
        pausedTotalMs: idle.pausedTotalMs,
        idlePausedAtMs: idle.idlePausedAtMs,
      }
    }

    case 'PROJECTILE_HIT_PLAYER': {
      const nextDefense = clampDefense(state.defense - action.damage)
      const projectiles = state.activeProjectiles.map((item) =>
        item.id === action.projectileId
          ? { ...item, state: 'hit' as const }
          : item,
      )
      const idle = withIdlePauseForProjectiles(state, projectiles, action.nowMs)
      // HP 0 でもゲーム終了しない（時間切れまで続行）
      return {
        ...state,
        defense: Math.max(0, nextDefense),
        combo: 0,
        failedTargets: state.failedTargets + 1,
        playerAction: 'damaged',
        invulnerableUntilMs: action.invulnerableUntilMs,
        perfectStreakCount: 0,
        currentProblemHadMiss: false,
        lockedProjectileId:
          state.lockedProjectileId === action.projectileId
            ? null
            : state.lockedProjectileId,
        activeProjectiles: projectiles,
        pausedTotalMs: idle.pausedTotalMs,
        idlePausedAtMs: idle.idlePausedAtMs,
      }
    }

    case 'SET_PLAYER_ACTION':
      return {
        ...state,
        playerAction: action.action,
      }

    case 'END_GAME':
      if (state.status === 'gameover') {
        return state
      }
      return {
        ...state,
        status: 'gameover',
        lockedProjectileId: null,
        pausedAtMs: null,
        idlePausedAtMs: null,
        endReason: action.reason,
      }

    case 'PAUSE_GAME': {
      if (state.status !== 'playing') {
        return state
      }
      let pausedTotalMs = state.pausedTotalMs
      if (state.idlePausedAtMs !== null) {
        pausedTotalMs += Math.max(0, action.atMs - state.idlePausedAtMs)
      }
      return {
        ...state,
        status: 'paused',
        pausedAtMs: action.atMs,
        pausedTotalMs,
        idlePausedAtMs: null,
      }
    }

    case 'RESUME_GAME': {
      if (state.status !== 'paused') {
        return state
      }
      const pausedExtra =
        state.pausedAtMs === null
          ? 0
          : Math.max(0, action.atMs - state.pausedAtMs)
      const nextPausedTotal = state.pausedTotalMs + pausedExtra
      const playable = hasPlayableProjectile(state.activeProjectiles)
      return {
        ...state,
        status: 'playing',
        pausedTotalMs: nextPausedTotal,
        pausedAtMs: null,
        idlePausedAtMs:
          !playable && state.gameStartedAtMs !== null ? action.atMs : null,
      }
    }

    case 'BEGIN_IDLE_PAUSE': {
      if (
        state.status !== 'playing' ||
        state.gameStartedAtMs === null ||
        state.pausedAtMs !== null ||
        state.idlePausedAtMs !== null
      ) {
        return state
      }
      if (hasPlayableProjectile(state.activeProjectiles)) {
        return state
      }
      return {
        ...state,
        idlePausedAtMs: action.atMs,
      }
    }

    case 'END_IDLE_PAUSE': {
      if (state.idlePausedAtMs === null) {
        return state
      }
      return {
        ...state,
        pausedTotalMs:
          state.pausedTotalMs + Math.max(0, action.atMs - state.idlePausedAtMs),
        idlePausedAtMs: null,
      }
    }

    default:
      return state
  }
}
