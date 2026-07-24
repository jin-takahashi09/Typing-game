import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  getDifficultyConfig,
  getMaxActiveTargetsForStage,
} from '../config/difficultyConfig'
import { gameConfig } from '../config/gameConfig'
import type { ActivePlayCharacter } from '../config/characters'
import { GameArea } from '../components/game/GameArea'
import { GameHud } from '../components/game/GameHud'
import { DefenseGauge } from '../components/game/DefenseGauge'
import { NinjaPlayer } from '../components/game/NinjaPlayer'
import { FallingTarget } from '../components/game/FallingTarget'
import { SlashEffect } from '../components/game/SlashEffect'
import { ComboDisplay } from '../components/game/ComboDisplay'
import { PauseOverlay } from '../components/game/PauseOverlay'
import { AbilityFloatText } from '../components/game/AbilityFloatText'
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
import { createProblemBag, type ProblemBag } from '../utils/problemBag'
import { calculateScore } from '../utils/calculateScore'
import {
  buildTypingStats,
} from '../utils/calculateTypingStats'
import { computeElapsedMs } from '../utils/elapsedTime'
import {
  computeRemainingMs,
  formatRemainingTime,
  isTimeUp,
} from '../utils/remainingTime'
import { processRomajiInput } from '../utils/romajiMatcher'
import {
  createPlayCoinTracker,
  summarizePlayCoins,
  tryAwardResultBonus,
  tryAwardStageClear,
  type PlayCoinTracker,
} from '../utils/coinRewards'
import {
  applyDamageAbility,
  applyScoreAbility,
  applyStageCoinAbility,
} from '../utils/characterAbilities'
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
  playCharacter: ActivePlayCharacter
  volume: number
  muted: boolean
  reducedMotion: boolean
  /** ブラウザ戻る操作の要求カウンタ（増加時に一時停止＋終了確認） */
  browserBackRequest?: number
  /** 現在の所持コイン（localStorage と同期） */
  coins: number
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
  playCharacter,
  volume,
  muted,
  reducedMotion,
  browserBackRequest = 0,
  coins,
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
  const [showScoreBurst, setShowScoreBurst] = useState(false)
  const [showScoreAbilityHint, setShowScoreAbilityHint] = useState(false)
  const [showGuardBurst, setShowGuardBurst] = useState(false)
  const [guardFloat, setGuardFloat] = useState<{ reducedBy: number } | null>(
    null,
  )
  const [pausedFromBrowserBack, setPausedFromBrowserBack] = useState(false)
  const [coinGainFlash, setCoinGainFlash] = useState<number | null>(null)
  const [goldAbilityFlash, setGoldAbilityFlash] = useState<number | null>(null)

  const targetsRef = useRef<Map<string, TargetMotion>>(new Map())
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map())
  const timersRef = useRef<Set<number>>(new Set())
  const stateRef = useRef(state)
  const endedRef = useRef(false)
  const isPlayingRef = useRef(true)
  const soundStartedRef = useRef(false)
  const playCoinTrackerRef = useRef<PlayCoinTracker>(createPlayCoinTracker())
  const abilityBonusScoreRef = useRef(0)
  const abilityBonusCoinsRef = useRef(0)
  const problemBagRef = useRef<ProblemBag | null>(null)
  if (problemBagRef.current === null) {
    problemBagRef.current = createProblemBag(difficulty)
  }

  useEffect(() => {
    abilityBonusScoreRef.current = 0
    abilityBonusCoinsRef.current = 0
  }, [])

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

  const pauseGame = useCallback((fromBrowserBack = false) => {
    if (stateRef.current.status !== 'playing') {
      if (fromBrowserBack && stateRef.current.status === 'paused') {
        setPausedFromBrowserBack(true)
      }
      return
    }
    if (fromBrowserBack) {
      setPausedFromBrowserBack(true)
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
    setPausedFromBrowserBack(false)
    dispatch({ type: 'RESUME_GAME', atMs: Date.now() })
    const sound = getSoundManager()
    sound.playSfx('resume')
    sound.resumeBgm()
  }, [])

  const togglePause = useCallback(() => {
    if (stateRef.current.status === 'playing') {
      pauseGame(false)
    } else if (stateRef.current.status === 'paused') {
      resumeGame()
    }
  }, [pauseGame, resumeGame])

  useEffect(() => {
    if (browserBackRequest <= 0) {
      return
    }
    const timerId = window.setTimeout(() => {
      pauseGame(true)
    }, 0)
    return () => {
      window.clearTimeout(timerId)
    }
  }, [browserBackRequest, pauseGame])

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

    const tick = () => {
      const now = Date.now()
      setHudNowMs(now)
      const current = stateRef.current
      if (current.status !== 'playing' || endedRef.current) {
        return
      }
      if (
        isTimeUp(
          {
            gameStartedAtMs: current.gameStartedAtMs,
            pausedTotalMs: current.pausedTotalMs,
            pausedAtMs: current.pausedAtMs,
          },
          now,
          config.timeLimitSeconds,
        )
      ) {
        isPlayingRef.current = false
        dispatch({ type: 'END_GAME', reason: 'timeout' })
      }
    }

    const intervalId = window.setInterval(
      tick,
      gameConfig.hudStatsUpdateIntervalMs,
    )
    tick()

    return () => {
      window.clearInterval(intervalId)
    }
  }, [state.status, state.gameStartedAtMs, config.timeLimitSeconds])

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
          characterId: playCharacter.characterId,
          abilityBonusScore: abilityBonusScoreRef.current,
          abilityBonusCoins: abilityBonusCoinsRef.current,
          endReason: state.endReason ?? 'defense',
          timeLimitSeconds: config.timeLimitSeconds,
        },
        playSessionId,
        coinSummary,
      )
    }
  }, [state, onGameOver, playSessionId, playCharacter.characterId, config.timeLimitSeconds])

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
      const applied = applyStageCoinAbility(award.coins, playCharacter.ability)
      const awards = [...award.tracker.stageAwards]
      const last = awards[awards.length - 1]!
      awards[awards.length - 1] = { stage: last.stage, coins: applied.finalCoins }
      playCoinTrackerRef.current = { ...award.tracker, stageAwards: awards }
      abilityBonusCoinsRef.current += applied.bonusCoins
      onAwardStageCoins(applied.finalCoins)
      setCoinGainFlash(applied.finalCoins)
      schedule(() => setCoinGainFlash(null), 900)
      if (applied.bonusCoins > 0) {
        setGoldAbilityFlash(applied.bonusCoins)
        schedule(() => setGoldAbilityFlash(null), 900)
      }
    }

    schedule(() => dispatch({ type: 'CLEAR_STAGE_UP_FLASH' }), 450)
  }, [
    state.showStageUpFlash,
    state.stage,
    schedule,
    onAwardStageCoins,
    playCharacter.ability,
  ])

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
    const maxActive = getMaxActiveTargetsForStage(config, current.stage)
    if (!canSpawnTarget(living.length, maxActive)) {
      return
    }

    const activeProblemIds = new Set(living.map((t) => t.problemId))
    const problem = problemBagRef.current!.next(activeProblemIds)
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

      const damageResult = applyDamageAbility(
        config.missDamage,
        playCharacter.ability,
      )

      const { appliedTargetIds, remainingDefense } = applySequentialBottomDamage(
        current.defense,
        eligibleIds,
        damageResult.finalDamage,
      )

      if (damageResult.reducedBy > 0 && appliedTargetIds.length > 0) {
        setShowGuardBurst(true)
        setGuardFloat({ reducedBy: damageResult.reducedBy })
        schedule(() => {
          setShowGuardBurst(false)
          setGuardFloat(null)
        }, 800)
      }

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
          damage: damageResult.finalDamage,
        })
      }

      if (remainingDefense <= 0) {
        isPlayingRef.current = false
      }
    },
    [config.missDamage, schedule, reducedMotion, playCharacter],
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
        const baseGain = calculateScore({
          baseScore: target.baseScore,
          difficultyMultiplier: config.scoreMultiplier,
          combo: nextCombo,
          comboMultiplier: config.comboMultiplier,
        })
        const applied = applyScoreAbility(baseGain, playCharacter.ability)
        const scoreGain = applied.finalScore
        abilityBonusScoreRef.current += applied.bonusScore
        if (applied.bonusScore > 0) {
          setShowScoreBurst(true)
          setShowScoreAbilityHint(true)
          schedule(() => {
            setShowScoreBurst(false)
            setShowScoreAbilityHint(false)
          }, 700)
        }
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

        // 演出は独立。入力対象からは即除外済み（DESTROY で activeTargets から削除）
        targetsRef.current.delete(target.id)
        elementRefs.current.delete(target.id)
        return
      }

      dispatch({
        type: 'TYPE_CORRECT',
        targetId: target.id,
        typedLength: matchResult.nextConfirmedLength,
        matchState: matchResult.nextState,
      })
    },
    [config, schedule, reducedMotion, playCharacter],
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

  const hudRemainingMs = useMemo(() => {
    return computeRemainingMs(
      {
        gameStartedAtMs: state.gameStartedAtMs,
        pausedTotalMs: state.pausedTotalMs,
        pausedAtMs: state.pausedAtMs,
      },
      state.status === 'paused' ? (state.pausedAtMs ?? hudNowMs) : hudNowMs,
      config.timeLimitSeconds,
    )
  }, [
    config.timeLimitSeconds,
    hudNowMs,
    state.gameStartedAtMs,
    state.pausedAtMs,
    state.pausedTotalMs,
    state.status,
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
    <main className="flex min-h-[100vh] min-h-[100dvh] flex-col items-center overflow-x-hidden px-1 py-1 sm:px-2 sm:py-2">
      <GameArea damaged={damaged && !reducedMotion} onReady={handleAreaReady}>
        <GameHud
          score={state.score}
          combo={state.combo}
          stage={state.stage}
          showStageUp={state.showStageUpFlash && !reducedMotion}
          remainingLabel={formatRemainingTime(hudRemainingMs)}
          remainingUrgent={hudRemainingMs <= 10_000}
          wpm={hudStats.wpm}
          coins={coins}
          coinGainFlash={coinGainFlash}
          showScoreAbilityHint={showScoreAbilityHint}
          onPause={state.status === 'playing' ? () => pauseGame(false) : undefined}
        />
        <DefenseGauge defense={state.defense} maxDefense={gameConfig.maxHealth} />

        {goldAbilityFlash !== null && goldAbilityFlash > 0 && (
          <p
            className="pointer-events-none absolute right-2 top-[11.5rem] z-40 text-xs font-bold text-[var(--color-accent-yellow)] sm:right-3 sm:top-36 md:right-4"
            role="status"
          >
            黄金の褒賞 +{goldAbilityFlash}コイン
          </p>
        )}

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
          character={playCharacter}
          reducedMotion={reducedMotion}
          showScoreBurst={showScoreBurst}
          showGuardBurst={showGuardBurst}
        />

        {guardFloat && (
          <div
            className="pointer-events-none absolute bottom-28 z-40 -translate-x-1/2 md:bottom-32"
            style={{ left: `${ninjaX}%` }}
          >
            <AbilityFloatText
              text={`蒼影の守り -${guardFloat.reducedBy}`}
              variant="water"
            />
          </div>
        )}

        {config.showBeginnerGuide && state.destroyedTargets === 0 && (
          <p className="pointer-events-none absolute bottom-28 left-1/2 z-20 w-[90%] -translate-x-1/2 text-center text-sm text-[var(--color-text-soft)] md:bottom-32">
            落下する日本語をローマ字入力して手裏剣を撃ち落とせ！
          </p>
        )}

        {state.status === 'paused' && (
          <PauseOverlay
            playCharacter={playCharacter}
            volume={volume}
            muted={muted}
            confirmExit={pausedFromBrowserBack}
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
