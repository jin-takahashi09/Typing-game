import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { getDifficultyConfig } from '../config/difficultyConfig'
import { gameConfig } from '../config/gameConfig'
import { GameArea } from '../components/game/GameArea'
import { GameHud } from '../components/game/GameHud'
import { DefenseGauge } from '../components/game/DefenseGauge'
import { NinjaPlayer } from '../components/game/NinjaPlayer'
import { FallingTarget } from '../components/game/FallingTarget'
import { SlashEffect } from '../components/game/SlashEffect'
import { ComboDisplay } from '../components/game/ComboDisplay'
import { PauseOverlay } from '../components/game/PauseOverlay'
import { StageClearCoinPopup } from '../components/game/StageClearCoinPopup'
import {
  createInitialGameState,
  gameReducer,
} from '../features/game/gameReducer'
import {
  findLockCandidates,
  findMostDangerousTargetId,
  shouldAdvanceStage,
} from '../features/game/gameLogic'
import {
  applySequentialBottomDamage,
  filterBottomReachTargetIds,
} from '../features/game/bottomReachLogic'
import {
  canSpawnTarget,
  createTarget,
  getFallSpeed,
  getSpawnIntervalMs,
  resetTargetIdSequence,
} from '../features/game/targetSpawner'
import { useGameLoop, type TargetMotion } from '../hooks/useGameLoop'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { selectTypingProblem } from '../utils/selectTypingProblem'
import { calculateScore } from '../utils/calculateScore'
import {
  buildTypingStats,
  formatElapsedTime,
} from '../utils/calculateTypingStats'
import { computeElapsedMs } from '../utils/elapsedTime'
import { processRomajiInput } from '../utils/romajiMatcher'
import {
  createPlayCoinTracker,
  summarizePlayCoins,
  tryAwardResultBonus,
  tryAwardStageClear,
  type PlayCoinTracker,
} from '../utils/coinRewards'
import { getSoundManager } from '../audio/SoundManager'
import type { DifficultyId } from '../types/app'
import type {
  GameResultSummary,
  GameTarget,
  NinjaAnimationState,
  PlayCoinSummary,
} from '../types/game'
import type { TypingProblem } from '../types/typing'

interface SlashItem {
  id: string
  xPercent: number
  yPx: number
}

interface ComboPopup {
  id: string
  combo: number
  xPercent: number
  yPx: number
}

interface GameScreenProps {
  difficulty: DifficultyId
  playSessionId: number
  characterId: string
  volume: number
  muted: boolean
  reducedMotion: boolean
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void
  onAwardStageCoins: (amount: number) => void
  onGameOver: (
    result: GameResultSummary,
    playSessionId: number,
    coinSummary: Omit<PlayCoinSummary, 'balanceAfter'>,
  ) => void
  onRetry: () => void
  onAbandonToTitle: () => void
}

function toTypingProblem(target: GameTarget, difficulty: DifficultyId): TypingProblem {
  return {
    id: target.problemId,
    displayText: target.displayText,
    reading: target.reading,
    romajiPatterns: target.romajiPatterns,
    difficulty,
    category: 'basic',
    baseScore: target.baseScore,
  }
}

export function GameScreen({
  difficulty,
  playSessionId,
  characterId,
  volume,
  muted,
  reducedMotion,
  onVolumeChange,
  onMutedChange,
  onAwardStageCoins,
  onGameOver,
  onRetry,
  onAbandonToTitle,
}: GameScreenProps) {
  const config = useMemo(() => getDifficultyConfig(difficulty), [difficulty])
  const [state, dispatch] = useReducer(gameReducer, undefined, () => ({
    ...createInitialGameState(difficulty, gameConfig.maxHealth),
    status: 'playing' as const,
    gameStartedAtMs: Date.now(),
  }))

  const [hudNowMs, setHudNowMs] = useState(() => Date.now())
  const [areaHeight, setAreaHeight] = useState(0)
  const [damaged, setDamaged] = useState(false)
  const [ninjaX, setNinjaX] = useState(50)
  const [ninjaAnim, setNinjaAnim] = useState<NinjaAnimationState>('idle')
  const [slashes, setSlashes] = useState<SlashItem[]>([])
  const [comboPopup, setComboPopup] = useState<ComboPopup | null>(null)
  const [stageCoinPopup, setStageCoinPopup] = useState<{
    stage: number
    coins: number
  } | null>(null)

  const targetsRef = useRef<Map<string, TargetMotion>>(new Map())
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map())
  const timersRef = useRef<Set<number>>(new Set())
  const stateRef = useRef(state)
  const endedRef = useRef(false)
  const sessionIdRef = useRef(0)
  const isPlayingRef = useRef(true)
  const soundStartedRef = useRef(false)
  const playCoinTrackerRef = useRef<PlayCoinTracker>(createPlayCoinTracker())

  useEffect(() => {
    stateRef.current = state
    isPlayingRef.current = state.status === 'playing'
  }, [state])

  useEffect(() => {
    isPlayingRef.current = true
    endedRef.current = false
  }, [])

  useEffect(() => {
    const sound = getSoundManager()
    void sound.unlock().then(() => {
      if (soundStartedRef.current) {
        return
      }
      soundStartedRef.current = true
      sound.setVolume(volume)
      sound.setMuted(muted)
      sound.playSfx('gameStart')
      sound.startBgm('game')
    })

    return () => {
      sound.stopBgm()
      soundStartedRef.current = false
    }
    // Session-scoped audio bootstrap; volume/mute sync is handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playSessionId is the remount boundary
  }, [playSessionId])

  useEffect(() => {
    const sound = getSoundManager()
    sound.setVolume(volume)
    sound.setMuted(muted)
  }, [volume, muted])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current.clear()
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
  }, [])

  useEffect(() => {
    const targets = targetsRef.current
    const elements = elementRefs.current
    resetTargetIdSequence()
    return () => {
      clearTimers()
      endedRef.current = true
      targets.clear()
      elements.clear()
    }
  }, [clearTimers])

  const pauseGame = useCallback(() => {
    if (stateRef.current.status !== 'playing') {
      return
    }
    dispatch({ type: 'PAUSE_GAME', atMs: Date.now() })
    const sound = getSoundManager()
    sound.pauseBgm()
    sound.playSfx('pause')
  }, [])

  const resumeGame = useCallback(() => {
    if (stateRef.current.status !== 'paused') {
      return
    }
    dispatch({ type: 'RESUME_GAME', atMs: Date.now() })
    const sound = getSoundManager()
    sound.playSfx('resume')
    sound.resumeBgm()
  }, [])

  const togglePause = useCallback(() => {
    if (stateRef.current.status === 'playing') {
      pauseGame()
    } else if (stateRef.current.status === 'paused') {
      resumeGame()
    }
  }, [pauseGame, resumeGame])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stateRef.current.status === 'playing') {
        pauseGame()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [pauseGame])

  useEffect(() => {
    if (state.status !== 'playing' || state.gameStartedAtMs === null) {
      return
    }

    const intervalId = window.setInterval(() => {
      setHudNowMs(Date.now())
    }, gameConfig.hudStatsUpdateIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [state.status, state.gameStartedAtMs])

  useEffect(() => {
    if (state.status === 'gameover' && !endedRef.current) {
      endedRef.current = true
      const sound = getSoundManager()
      sound.stopBgm()
      sound.playSfx('gameOver')

      const elapsedMs = computeElapsedMs(
        {
          gameStartedAtMs: state.gameStartedAtMs,
          pausedTotalMs: state.pausedTotalMs,
          pausedAtMs: state.pausedAtMs,
        },
        Date.now(),
      )
      const stats = buildTypingStats(
        {
          typedChars: state.typedCount,
          correctChars: state.correctChars,
          missCount: state.missCount,
        },
        elapsedMs,
      )
      const resultBonus = tryAwardResultBonus(playCoinTrackerRef.current, state.score)
      playCoinTrackerRef.current = resultBonus.tracker
      const coinSummary = summarizePlayCoins(playCoinTrackerRef.current)

      onGameOver(
        {
          difficulty: state.difficulty,
          score: state.score,
          stage: state.stage,
          destroyedTargets: state.destroyedTargets,
          maxCombo: state.maxCombo,
          typedChars: stats.typedChars,
          correctChars: stats.correctChars,
          missCount: stats.missCount,
          elapsedMs: stats.elapsedMs,
          wpm: stats.wpm,
          accuracy: stats.accuracy,
        },
        playSessionId,
        coinSummary,
      )
    }
  }, [state, onGameOver, playSessionId])

  useEffect(() => {
    if (!state.showMissFeedback) {
      return
    }
    schedule(() => dispatch({ type: 'CLEAR_MISS_FEEDBACK' }), gameConfig.missFeedbackMs)
  }, [state.showMissFeedback, schedule])

  useEffect(() => {
    if (!state.showStageUpFlash) {
      return
    }
    getSoundManager().playSfx('stageUp')

    const clearedStage = state.stage - 1
    const award = tryAwardStageClear(playCoinTrackerRef.current, clearedStage)
    if (award.awarded) {
      playCoinTrackerRef.current = award.tracker
      onAwardStageCoins(award.coins)
      setStageCoinPopup({ stage: clearedStage, coins: award.coins })
      schedule(() => setStageCoinPopup(null), 1600)
    }

    schedule(() => dispatch({ type: 'CLEAR_STAGE_UP_FLASH' }), 450)
  }, [state.showStageUpFlash, state.stage, schedule, onAwardStageCoins])

  const registerElement = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      elementRefs.current.set(id, element)
      const motion = targetsRef.current.get(id)
      if (motion) {
        element.style.transform = `translate3d(-50%, ${motion.y}px, 0)`
        element.dataset.fallY = String(Math.round(motion.y))
      }
    } else {
      elementRefs.current.delete(id)
    }
  }, [])

  const handleSpawnNeeded = useCallback(() => {
    if (!isPlayingRef.current) {
      return
    }
    const current = stateRef.current
    if (current.status !== 'playing') {
      return
    }

    const living = current.activeTargets.filter((t) => t.state !== 'destroyed')
    if (!canSpawnTarget(living.length, config.maxActiveTargets)) {
      return
    }

    const problem = selectTypingProblem({
      difficulty: current.difficulty,
      config,
      lastProblemId: current.lastProblemId,
    })
    const target = createTarget({
      problem,
      speed: getFallSpeed(config, current.stage),
      existingXPercents: living.map((t) => t.xPercent),
    })

    targetsRef.current.set(target.id, {
      y: target.yPosition,
      speed: target.speed,
    })
    dispatch({ type: 'SPAWN_TARGET', target })
  }, [config])

  const handleTargetsReachedBottom = useCallback(
    (targetIds: string[]) => {
      if (!isPlayingRef.current) {
        return
      }

      const current = stateRef.current
      if (current.status !== 'playing') {
        return
      }

      const eligibleIds = filterBottomReachTargetIds(
        targetIds,
        current.activeTargets,
        targetsRef.current,
      )
      if (eligibleIds.length === 0) {
        return
      }

      const { appliedTargetIds, remainingDefense } = applySequentialBottomDamage(
        current.defense,
        eligibleIds,
        config.missDamage,
      )

      for (const id of appliedTargetIds) {
        if (!targetsRef.current.has(id)) {
          continue
        }

        targetsRef.current.delete(id)
        elementRefs.current.delete(id)
        getSoundManager().playSfx('damage')
        setNinjaAnim('damage')
        setDamaged(!reducedMotion)
        schedule(() => setNinjaAnim('idle'), 220)
        schedule(() => setDamaged(false), 200)
        dispatch({
          type: 'TARGET_REACHED_BOTTOM',
          targetId: id,
          damage: config.missDamage,
        })
      }

      if (remainingDefense <= 0) {
        isPlayingRef.current = false
      }
    },
    [config.missDamage, schedule, reducedMotion],
  )

  const getSpawnInterval = useCallback(() => {
    return getSpawnIntervalMs(config, stateRef.current.stage)
  }, [config])

  useGameLoop({
    enabled: state.status === 'playing' && areaHeight > 0,
    areaHeight,
    getSpawnIntervalMs: getSpawnInterval,
    onSpawnNeeded: handleSpawnNeeded,
    onTargetsReachedBottom: handleTargetsReachedBottom,
    targetsRef,
    elementRefs,
  })

  const handleChar = useCallback(
    (char: string) => {
      if (!isPlayingRef.current) {
        return
      }
      const current = stateRef.current
      if (current.status !== 'playing') {
        return
      }

      const living = current.activeTargets.filter((t) => t.state !== 'destroyed')
      let targetId = current.lockedTargetId

      if (!targetId) {
        const candidates = findLockCandidates(living, char)
        const yMap = new Map<string, number>()
        living.forEach((t) => {
          yMap.set(t.id, targetsRef.current.get(t.id)?.y ?? t.yPosition)
        })
        targetId = findMostDangerousTargetId(candidates, yMap)
        if (!targetId) {
          getSoundManager().playSfx('typeMiss')
          dispatch({ type: 'TYPE_MISS' })
          return
        }
      }

      const target = living.find((t) => t.id === targetId)
      if (!target) {
        getSoundManager().playSfx('typeMiss')
        dispatch({ type: 'TYPE_MISS' })
        return
      }

      const problem = toTypingProblem(target, current.difficulty)
      const matchResult = processRomajiInput(target.matchState, problem, char)

      if (!matchResult.accepted) {
        getSoundManager().playSfx('typeMiss')
        dispatch({ type: 'TYPE_MISS' })
        return
      }

      getSoundManager().playSfx('typeCorrect')
      setNinjaX(target.xPercent)
      setNinjaAnim('attack')
      schedule(() => setNinjaAnim('idle'), 160)

      if (matchResult.isComplete) {
        const nextCombo = current.combo + 1
        const scoreGain = calculateScore({
          baseScore: target.baseScore,
          difficultyMultiplier: config.scoreMultiplier,
          combo: nextCombo,
          comboMultiplier: config.comboMultiplier,
        })
        const shouldAdvance = shouldAdvanceStage(
          current.destroyedTargets + 1,
          config.stageUpCondition,
          current.score + scoreGain,
        )
        const y = targetsRef.current.get(target.id)?.y ?? target.yPosition
        getSoundManager().playSfx('destroy')

        if (!reducedMotion) {
          const slashId = `slash-${target.id}-${Date.now()}`
          setSlashes((prev) => [
            ...prev,
            { id: slashId, xPercent: target.xPercent, yPx: y },
          ])
          schedule(() => {
            setSlashes((prev) => prev.filter((item) => item.id !== slashId))
          }, 300)

          if (nextCombo >= gameConfig.comboPopupThreshold) {
            const popupId = `combo-${slashId}`
            setComboPopup({
              id: popupId,
              combo: nextCombo,
              xPercent: target.xPercent,
              yPx: y,
            })
            schedule(() => {
              setComboPopup((prev) => (prev?.id === popupId ? null : prev))
            }, 900)
          }
        }

        dispatch({
          type: 'TYPE_CORRECT',
          targetId: target.id,
          typedLength: matchResult.nextConfirmedLength,
          matchState: matchResult.nextState,
        })
        dispatch({
          type: 'DESTROY_TARGET',
          targetId: target.id,
          scoreGain,
          heal: config.killHeal,
          shouldAdvanceStage: shouldAdvance,
        })

        targetsRef.current.delete(target.id)

        const sessionAtDestroy = sessionIdRef.current
        schedule(() => {
          if (sessionIdRef.current !== sessionAtDestroy) {
            return
          }
          elementRefs.current.delete(target.id)
          dispatch({ type: 'REMOVE_TARGET', targetId: target.id })
        }, gameConfig.destroyRemoveDelayMs)
        return
      }

      dispatch({
        type: 'TYPE_CORRECT',
        targetId: target.id,
        typedLength: matchResult.nextConfirmedLength,
        matchState: matchResult.nextState,
      })
    },
    [config, schedule, reducedMotion],
  )

  const hudStats = useMemo(() => {
    const elapsedMs = computeElapsedMs(
      {
        gameStartedAtMs: state.gameStartedAtMs,
        pausedTotalMs: state.pausedTotalMs,
        pausedAtMs: state.pausedAtMs,
      },
      state.status === 'paused' ? (state.pausedAtMs ?? hudNowMs) : hudNowMs,
    )
    return buildTypingStats(
      {
        typedChars: state.typedCount,
        correctChars: state.correctChars,
        missCount: state.missCount,
      },
      elapsedMs,
    )
  }, [
    hudNowMs,
    state.correctChars,
    state.gameStartedAtMs,
    state.missCount,
    state.pausedAtMs,
    state.pausedTotalMs,
    state.status,
    state.typedCount,
  ])

  useKeyboardInput({
    enabled: state.status === 'playing',
    onChar: handleChar,
    onEscape: togglePause,
  })

  const handleAreaReady = useCallback((element: HTMLDivElement | null) => {
    if (!element) {
      return
    }
    setAreaHeight(element.clientHeight)
  }, [])

  const handleAbandon = useCallback(() => {
    getSoundManager().stopBgm()
    onAbandonToTitle()
  }, [onAbandonToTitle])

  const handleRetryFromPause = useCallback(() => {
    getSoundManager().stopBgm()
    onRetry()
  }, [onRetry])

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-2 py-4 sm:px-3 sm:py-6 md:px-4">
      <GameArea damaged={damaged && !reducedMotion} onReady={handleAreaReady}>
        <GameHud
          score={state.score}
          combo={state.combo}
          stage={state.stage}
          difficultyLabel={config.displayName}
          showStageUp={state.showStageUpFlash && !reducedMotion}
          elapsedLabel={formatElapsedTime(hudStats.elapsedMs)}
          wpm={hudStats.wpm}
          accuracy={hudStats.accuracy}
          onPause={state.status === 'playing' ? pauseGame : undefined}
        />
        <DefenseGauge defense={state.defense} maxDefense={gameConfig.maxHealth} />

        {state.activeTargets.map((target) => (
          <FallingTarget
            key={target.id}
            target={target}
            isLocked={state.lockedTargetId === target.id}
            showMiss={
              !reducedMotion &&
              state.showMissFeedback &&
              state.lockedTargetId === target.id
            }
            registerElement={registerElement}
          />
        ))}

        {!reducedMotion && <SlashEffect effects={slashes} />}
        {!reducedMotion && comboPopup && (
          <ComboDisplay
            combo={comboPopup.combo}
            xPercent={comboPopup.xPercent}
            yPx={comboPopup.yPx}
            visible
          />
        )}

        <NinjaPlayer
          xPercent={ninjaX}
          animation={ninjaAnim}
          characterId={characterId}
        />

        {stageCoinPopup && (
          <StageClearCoinPopup
            stage={stageCoinPopup.stage}
            coins={stageCoinPopup.coins}
          />
        )}

        {config.showBeginnerGuide && state.destroyedTargets === 0 && (
          <p className="pointer-events-none absolute bottom-28 left-1/2 z-20 w-[90%] -translate-x-1/2 text-center text-sm text-[var(--color-text-soft)] md:bottom-32">
            落下する日本語をローマ字入力して手裏剣を撃ち落とせ！
          </p>
        )}

        {state.status === 'paused' && (
          <PauseOverlay
            characterId={characterId}
            volume={volume}
            muted={muted}
            onResume={resumeGame}
            onRetry={handleRetryFromPause}
            onTitle={handleAbandon}
            onVolumeChange={onVolumeChange}
            onMutedChange={onMutedChange}
          />
        )}
      </GameArea>
    </main>
  )
}
