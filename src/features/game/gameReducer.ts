import type { DifficultyId } from '../../types/app'
import type { GameAction, GameState, GameTarget } from '../../types/game'
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
    stage: 1,
    destroyedTargets: 0,
    activeTargets: [],
    lockedTargetId: null,
    lastProblemId: null,
    typedCount: 0,
    missCount: 0,
    showMissFeedback: false,
    showStageUpFlash: false,
  }
}

function mapTarget(
  targets: GameTarget[],
  targetId: string,
  updater: (target: GameTarget) => GameTarget,
): GameTarget[] {
  return targets.map((target) =>
    target.id === targetId ? updater(target) : target,
  )
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
    case 'RESET_GAME':
      return {
        ...createInitialGameState(action.difficulty, action.maxDefense),
        status: 'playing',
      }

    case 'SPAWN_TARGET':
      return {
        ...state,
        activeTargets: [...state.activeTargets, action.target],
        lastProblemId: action.target.problemId,
      }

    case 'TYPE_CORRECT': {
      const target = state.activeTargets.find((item) => item.id === action.targetId)
      if (!target || target.state === 'destroyed') {
        return state
      }

      const typedLength = target.typedLength + 1
      return {
        ...state,
        typedCount: state.typedCount + 1,
        lockedTargetId: action.targetId,
        showMissFeedback: false,
        activeTargets: mapTarget(state.activeTargets, action.targetId, (item) => ({
          ...item,
          typedLength,
          state: 'locked',
        })),
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

    case 'DESTROY_TARGET': {
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
        lockedTargetId: null,
        showStageUpFlash: action.shouldAdvanceStage,
        stage: action.shouldAdvanceStage ? state.stage + 1 : state.stage,
        activeTargets: mapTarget(state.activeTargets, action.targetId, (item) => ({
          ...item,
          state: 'destroyed',
          typedLength: item.inputText.length,
        })),
      }
    }

    case 'REMOVE_TARGET':
      return {
        ...state,
        activeTargets: state.activeTargets.filter(
          (target) => target.id !== action.targetId,
        ),
        lockedTargetId:
          state.lockedTargetId === action.targetId ? null : state.lockedTargetId,
      }

    case 'TARGET_REACHED_BOTTOM': {
      const nextDefense = clampDefense(state.defense - action.damage)
      const nextState: GameState = {
        ...state,
        defense: nextDefense,
        combo: 0,
        lockedTargetId:
          state.lockedTargetId === action.targetId ? null : state.lockedTargetId,
        activeTargets: state.activeTargets.filter(
          (target) => target.id !== action.targetId,
        ),
      }

      if (nextDefense <= 0) {
        return {
          ...nextState,
          defense: 0,
          status: 'gameover',
        }
      }

      return nextState
    }

    case 'CLEAR_STAGE_UP_FLASH':
      return {
        ...state,
        showStageUpFlash: false,
      }

    case 'END_GAME':
      return {
        ...state,
        status: 'gameover',
        lockedTargetId: null,
      }

    default:
      return state
  }
}
