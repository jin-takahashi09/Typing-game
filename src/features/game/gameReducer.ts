import type { DifficultyId } from '../../types/app'
import type { GameAction, GameState } from '../../types/game'
import { gameConfig } from '../../config/gameConfig'
import { clampDefense } from '../../utils/calculateScore'

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
    showMissFeedback: false,
    endReason: null,
    invulnerableUntilMs: 0,
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

    case 'SPAWN_PROJECTILE':
      return {
        ...state,
        activeProjectiles: [...state.activeProjectiles, action.projectile],
        lastProblemId: action.projectile.problemId,
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
      }

    case 'CLEAR_MISS_FEEDBACK':
      return {
        ...state,
        showMissFeedback: false,
      }

    case 'RESOLVE_PROJECTILE': {
      const nextCombo = state.combo + 1
      const nextDestroyed = state.destroyedTargets + 1
      const nextDefense = clampDefense(state.defense + action.heal)
      const nextScore = state.score + action.scoreGain

      return {
        ...state,
        score: nextScore,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        defense: nextDefense,
        destroyedTargets: nextDestroyed,
        lockedProjectileId: null,
        lastInterceptAction: action.action,
        activeProjectiles: state.activeProjectiles.map((item) =>
          item.id === action.projectileId
            ? {
                ...item,
                state: 'resolving' as const,
                resolveAction: action.action,
                typedLength: item.displayRomaji.length,
                matchState: {
                  ...item.matchState,
                  confirmedLength: item.displayRomaji.length,
                  isComplete: true,
                  activePaths: [],
                },
              }
            : item,
        ),
      }
    }

    case 'REMOVE_PROJECTILE':
      return {
        ...state,
        activeProjectiles: state.activeProjectiles.filter(
          (item) => item.id !== action.projectileId,
        ),
        lockedProjectileId:
          state.lockedProjectileId === action.projectileId
            ? null
            : state.lockedProjectileId,
      }

    case 'PROJECTILE_HIT_PLAYER': {
      const nextDefense = clampDefense(state.defense - action.damage)
      // HP 0 でもゲーム終了しない（時間切れまで続行）
      return {
        ...state,
        defense: Math.max(0, nextDefense),
        combo: 0,
        failedTargets: state.failedTargets + 1,
        playerAction: 'damaged',
        invulnerableUntilMs: action.invulnerableUntilMs,
        lockedProjectileId:
          state.lockedProjectileId === action.projectileId
            ? null
            : state.lockedProjectileId,
        activeProjectiles: state.activeProjectiles.map((item) =>
          item.id === action.projectileId
            ? { ...item, state: 'hit' as const }
            : item,
        ),
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
        endReason: action.reason,
      }

    case 'PAUSE_GAME': {
      if (state.status !== 'playing') {
        return state
      }
      return {
        ...state,
        status: 'paused',
        pausedAtMs: action.atMs,
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
      return {
        ...state,
        status: 'playing',
        pausedTotalMs: state.pausedTotalMs + pausedExtra,
        pausedAtMs: null,
      }
    }

    default:
      return state
  }
}
