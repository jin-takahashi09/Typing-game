import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import {
  getDifficultyConfig,
  getMaxActiveTargets,
} from '../config/difficultyConfig'
import { gameConfig } from '../config/gameConfig'
import type { ActivePlayCharacter } from '../config/characters'
import { GameArea } from '../components/game/GameArea'
import { GameHud } from '../components/game/GameHud'
import { DefenseGauge } from '../components/game/DefenseGauge'
import { NinjaPlayer } from '../components/game/NinjaPlayer'
import { TrainingGroundBackground } from '../components/game/TrainingGroundBackground'
import { EnemyProjectileView } from '../components/game/EnemyProjectileView'
import { AllyShurikenFx } from '../components/game/AllyShurikenFx'
import { ComboDisplay } from '../components/game/ComboDisplay'
import { PauseOverlay } from '../components/game/PauseOverlay'
import { AbilityFloatText } from '../components/game/AbilityFloatText'
import {
  createInitialGameState,
  gameReducer,
} from '../features/game/gameReducer'
import {
  coinMilestoneIndex,
  computeSuccessRate,
  findLockCandidates,
  findMostDangerousProjectileId,
  shouldAwardCoinMilestone,
  toTypingProblem,
} from '../features/game/gameLogic'
import {
  canSpawnMore,
  createEnemyProjectile,
  resetProjectileIdSequence,
} from '../features/game/projectileSpawner'
import {
  useFallingProjectileLoop,
  type ProjectileMotionState,
} from '../hooks/useFallingProjectileLoop'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { createProblemBag, type ProblemBag } from '../utils/problemBag'
import { calculateScore } from '../utils/calculateScore'
import { buildTypingStats } from '../utils/calculateTypingStats'
import { computeElapsedMs } from '../utils/elapsedTime'
import {
  computeRemainingMs,
  formatRemainingTime,
  isTimeUp,
} from '../utils/remainingTime'
import { applyPerfectClear } from '../utils/streakRewards'
import { STREAK_REWARD_CONFIG } from '../config/streakRewardConfig'
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
import {
  isEmergencySlash,
  playerActionFromIntercept,
  selectInterceptAction,
  slashAngleDeg,
  allyThrowAngleDeg,
} from '../utils/interceptSelector'
import {
  distancePxBetween,
  isProjectileHittingPlayer,
} from '../utils/collision'
import {
  computeFallDurationMs,
  estimateTimeToImpactMs,
  computeFallProgress,
  sampleFallingMotion,
} from '../utils/fallingProjectileMotion'
import { getSoundManager } from '../audio/SoundManager'
import type { DifficultyId } from '../types/app'
import type { GameResultSummary, PlayCoinSummary } from '../types/game'
import type { InterceptAction, EnemyProjectile } from '../types/projectile'
import {
  PLAYER_X_PERCENT,
  PLAYER_Y_PERCENT,
} from '../types/projectile'

interface AllyFxItem {
  id: string
  fromXPercent: number
  fromYPercent: number
  toXPercent: number
  toYPercent: number
  areaWidthPx: number
  areaHeightPx: number
  angleDeg: number
  variant: import('../components/game/AllyShurikenFx').AllyShurikenVariant
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
  browserBackRequest?: number
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

import type { AllyShurikenVariant } from '../components/game/AllyShurikenFx'

function allyVariantFor(characterId: string): AllyShurikenVariant {
  if (characterId === 'shinobi-red') return 'fire'
  if (characterId === 'shinobi-blue') return 'water'
  if (characterId === 'shinobi-gold') return 'gold'
  return 'basic'
}

function readPos(
  id: string,
  projectile: {
    id: string
    spawnX: number
    spawnY: number
    flightDurationMs: number
    trajectory: import('../types/projectile').FallingTrajectory
  },
  motionRef: Map<string, ProjectileMotionState>,
  elementRefs: Map<string, HTMLElement>,
  frozenPositions?: Map<string, { xPercent: number; yPercent: number }>,
): { xPercent: number; yPercent: number } {
  const frozen = frozenPositions?.get(id)
  if (frozen) {
    return frozen
  }
  const el = elementRefs.get(id)
  if (el?.dataset.x && el.dataset.y) {
    return {
      xPercent: Number(el.dataset.x),
      yPercent: Number(el.dataset.y),
    }
  }
  const motion = motionRef.get(id)
  const elapsed = motion?.elapsedMs ?? 0
  const progress = computeFallProgress(
    elapsed,
    projectile.flightDurationMs,
  )
  return sampleFallingMotion({
    spawnX: projectile.spawnX,
    spawnY: projectile.spawnY,
    impactY: PLAYER_Y_PERCENT,
    trajectory: projectile.trajectory,
    progress,
  })
}

const SPAWN_COLUMNS = [18, 34, 50, 66, 82] as const

declare global {
  interface Window {
    __SHINOBI_KEYS_TEST__?: {
      /** 次の1発だけ適用して消費する */
      forceNextSpawn?: {
        trajectory?: import('../types/projectile').FallingTrajectory
        spawnX?: number
        yPercent?: number
        /** true なら位置を固定（被弾・距離判定用） */
        freeze?: boolean
        /** 残り接触時間を強制（緊急斬撃テスト用） */
        remainingMs?: number
      }
      /** 即時1発（テスト用・消費） */
      requestImmediateSpawn?: {
        trajectory?: import('../types/projectile').FallingTrajectory
        spawnX?: number
        yPercent?: number
        freeze?: boolean
        remainingMs?: number
        size?: import('../types/projectile').ProjectileSize
        /** 検証用。本番の寿司打方式では使わない */
        allowMultiple?: boolean
        forceProblem?: {
          displayText: string
          reading: string
          romaji: string
        }
      }
      pauseMotion?: boolean
      suppressSpawn?: boolean
      /** 検証用: true で時間切れ終了を即時発火（消費） */
      forceEndGame?: boolean
      /** 検証用: 次スポーンの問題を強制（消費は requestImmediateSpawn 側） */
      forceProblem?: {
        displayText: string
        reading: string
        romaji: string
      }
      /** 検証用: 連続成功・時間ボーナスの読み取り */
      getStreakSnapshot?: () => {
        perfectStreakCount: number
        maxPerfectStreak: number
        timeBonusMs: number
        totalBonusSeconds: number
        streakRewardCoins: number
        currentProblemHadMiss: boolean
      }
    }
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
  const [areaReady, setAreaReady] = useState(false)
  const [areaSize, setAreaSize] = useState({ width: 800, height: 700 })
  const [damaged, setDamaged] = useState(false)
  const [allyFx, setAllyFx] = useState<AllyFxItem[]>([])
  const [comboPopup, setComboPopup] = useState<ComboPopup | null>(null)
  const [slashAngle, setSlashAngle] = useState(0)
  const [showEmergencyHint, setShowEmergencyHint] = useState(false)
  const [showScoreBurst, setShowScoreBurst] = useState(false)
  const [showScoreAbilityHint, setShowScoreAbilityHint] = useState(false)
  const [showGuardBurst, setShowGuardBurst] = useState(false)
  const [guardFloat, setGuardFloat] = useState<{ reducedBy: number } | null>(null)
  const [pausedFromBrowserBack, setPausedFromBrowserBack] = useState(false)
  const [coinGainFlash, setCoinGainFlash] = useState<number | null>(null)
  const [goldAbilityFlash, setGoldAbilityFlash] = useState<number | null>(null)
  const [timeBonusFlash, setTimeBonusFlash] = useState<number | null>(null)

  const motionRef = useRef<Map<string, ProjectileMotionState>>(new Map())
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map())
  const frozenPositionsRef = useRef<
    Map<string, { xPercent: number; yPercent: number }>
  >(new Map())
  const timersRef = useRef<Set<number>>(new Set())
  const stateRef = useRef(state)
  const endedRef = useRef(false)
  const isPlayingRef = useRef(true)
  const soundStartedRef = useRef(false)
  const playCoinTrackerRef = useRef<PlayCoinTracker>(createPlayCoinTracker())
  const abilityBonusScoreRef = useRef(0)
  const abilityBonusCoinsRef = useRef(0)
  const resolvingIdsRef = useRef<Set<string>>(new Set())
  const streakAwardedEventsRef = useRef<Set<string>>(new Set())
  const areaSizeRef = useRef(areaSize)
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
    if (window.__SHINOBI_KEYS_TEST__) {
      window.__SHINOBI_KEYS_TEST__.getStreakSnapshot = () => ({
        perfectStreakCount: state.perfectStreakCount,
        maxPerfectStreak: state.maxPerfectStreak,
        timeBonusMs: state.timeBonusMs,
        totalBonusSeconds: state.totalBonusSeconds,
        streakRewardCoins: state.streakRewardCoins,
        currentProblemHadMiss: state.currentProblemHadMiss,
      })
    }
  }, [state])

  useEffect(() => {
    areaSizeRef.current = areaSize
  }, [areaSize])

  useEffect(() => {
    isPlayingRef.current = true
    endedRef.current = false
  }, [])

  useEffect(() => {
    const sound = getSoundManager()
    void sound.unlock().then(() => {
      if (soundStartedRef.current) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playSessionId remount boundary
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
    const motions = motionRef.current
    const elements = elementRefs.current
    const resolvingIds = resolvingIdsRef.current
    resetProjectileIdSequence()
    return () => {
      clearTimers()
      endedRef.current = true
      motions.clear()
      elements.clear()
      resolvingIds.clear()
    }
  }, [clearTimers])

  const pauseGame = useCallback((fromBrowserBack = false) => {
    if (stateRef.current.status !== 'playing') {
      if (fromBrowserBack && stateRef.current.status === 'paused') {
        setPausedFromBrowserBack(true)
      }
      return
    }
    if (fromBrowserBack) setPausedFromBrowserBack(true)
    dispatch({ type: 'PAUSE_GAME', atMs: Date.now() })
    const sound = getSoundManager()
    sound.pauseBgm()
    sound.playSfx('pause')
  }, [])

  const resumeGame = useCallback(() => {
    if (stateRef.current.status !== 'paused') return
    setPausedFromBrowserBack(false)
    dispatch({ type: 'RESUME_GAME', atMs: Date.now() })
    const sound = getSoundManager()
    sound.playSfx('resume')
    sound.resumeBgm()
  }, [])

  const togglePause = useCallback(() => {
    if (stateRef.current.status === 'playing') pauseGame(false)
    else if (stateRef.current.status === 'paused') resumeGame()
  }, [pauseGame, resumeGame])

  useEffect(() => {
    if (browserBackRequest <= 0) return
    const timerId = window.setTimeout(() => pauseGame(true), 0)
    return () => window.clearTimeout(timerId)
  }, [browserBackRequest, pauseGame])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stateRef.current.status === 'playing') pauseGame()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [pauseGame])

  useEffect(() => {
    if (state.status !== 'playing' || state.gameStartedAtMs === null) return
    const tick = () => {
      const now = Date.now()
      setHudNowMs(now)
      const current = stateRef.current
      if (current.status !== 'playing' || endedRef.current) return
      if (window.__SHINOBI_KEYS_TEST__?.forceEndGame) {
        window.__SHINOBI_KEYS_TEST__.forceEndGame = false
        isPlayingRef.current = false
        dispatch({ type: 'END_GAME', reason: 'timeout' })
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
          current.timeBonusMs,
        )
      ) {
        isPlayingRef.current = false
        dispatch({ type: 'END_GAME', reason: 'timeout' })
      }
    }
    const intervalId = window.setInterval(tick, gameConfig.hudStatsUpdateIntervalMs)
    tick()
    return () => window.clearInterval(intervalId)
  }, [state.status, state.gameStartedAtMs, state.timeBonusMs, config.timeLimitSeconds])

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
      onGameOver(
        {
          difficulty: state.difficulty,
          score: state.score,
          stage: Math.max(
            1,
            coinMilestoneIndex(state.destroyedTargets, config.coinMilestoneEvery),
          ),
          destroyedTargets: state.destroyedTargets,
          failedTargets: state.failedTargets,
          maxCombo: state.maxCombo,
          typedChars: stats.typedChars,
          correctChars: stats.correctChars,
          missCount: stats.missCount,
          elapsedMs: stats.elapsedMs,
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          successRate: computeSuccessRate(
            state.destroyedTargets,
            state.failedTargets,
          ),
          characterId: playCharacter.characterId,
          abilityBonusScore: abilityBonusScoreRef.current,
          abilityBonusCoins: abilityBonusCoinsRef.current,
          endReason: state.endReason ?? 'timeout',
          timeLimitSeconds: config.timeLimitSeconds,
          maxPerfectStreak: state.maxPerfectStreak,
          bonusTimeSeconds: state.totalBonusSeconds,
          streakRewardCoins: state.streakRewardCoins,
        },
        playSessionId,
        {
          ...summarizePlayCoins(
            playCoinTrackerRef.current,
            state.streakRewardCoins,
          ),
        },
      )
    }
  }, [state, onGameOver, playSessionId, playCharacter.characterId, config.timeLimitSeconds, config.coinMilestoneEvery])

  useEffect(() => {
    if (!state.showMissFeedback) return
    schedule(() => dispatch({ type: 'CLEAR_MISS_FEEDBACK' }), gameConfig.missFeedbackMs)
  }, [state.showMissFeedback, schedule])

  useEffect(() => {
    if (!shouldAwardCoinMilestone(state.destroyedTargets, config.coinMilestoneEvery)) {
      return
    }
    const milestone = coinMilestoneIndex(
      state.destroyedTargets,
      config.coinMilestoneEvery,
    )
    const award = tryAwardStageClear(playCoinTrackerRef.current, milestone)
    if (!award.awarded) return
    getSoundManager().playSfx('stageUp')
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
  }, [
    state.destroyedTargets,
    config.coinMilestoneEvery,
    schedule,
    onAwardStageCoins,
    playCharacter.ability,
  ])


  const registerElement = useCallback((id: string, element: HTMLElement | null) => {
    if (element) elementRefs.current.set(id, element)
    else elementRefs.current.delete(id)
  }, [])

  const getProjectiles = useCallback(() => stateRef.current.activeProjectiles, [])
  const gameNowMs = useCallback(() => Date.now(), [])

  const spawnFromDirector = useCallback(
    (wallNowMs: number): number => {
      try {
        const current = stateRef.current
        if (current.status !== 'playing') return 0

        const spawnOne = (
          opts: {
            spawnX: number
            trajectory: import('../types/projectile').FallingTrajectory
            size: import('../types/projectile').ProjectileSize
            damage: number
            yPercent?: number
            freeze?: boolean
            remainingMs?: number
            forceProblem?: {
              displayText: string
              reading: string
              romaji: string
            }
          },
          living: EnemyProjectile[],
        ): EnemyProjectile | null => {
          if (!problemBagRef.current) {
            problemBagRef.current = createProblemBag(difficulty)
          }
          const activeProblemIds = new Set(living.map((p) => p.problemId))
          const forced = opts.forceProblem
          const problem = forced
            ? {
                id: `test-force-${Date.now()}`,
                displayText: forced.displayText,
                reading: forced.reading,
                romajiPatterns: [forced.romaji.toLowerCase()],
                difficulty,
                category: 'basic' as const,
                baseScore: 80,
              }
            : problemBagRef.current.next(activeProblemIds)
          const romajiLen = Math.max(
            1,
            ...problem.romajiPatterns.map((p) => p.length),
          )
          const flightDurationMs = computeFallDurationMs({
            romajiLength: romajiLen,
            fallSpeed: config.fallSpeed,
            trajectory: opts.trajectory,
            size: opts.size,
          })
          const projectile = createEnemyProjectile({
            problem,
            spawnX: opts.spawnX,
            trajectory: opts.trajectory,
            size: opts.size,
            damage: opts.damage,
            flightDurationMs,
            nowMs: wallNowMs,
          })
          if (typeof opts.yPercent === 'number') {
            const yPercent = opts.yPercent
            let elapsedMs = Math.max(
              0,
              ((yPercent - projectile.spawnY) /
                (PLAYER_Y_PERCENT - projectile.spawnY)) *
                projectile.flightDurationMs,
            )
            if (typeof opts.remainingMs === 'number') {
              elapsedMs = Math.max(
                0,
                projectile.flightDurationMs - Math.max(0, opts.remainingMs),
              )
            }
            motionRef.current.set(projectile.id, { elapsedMs })
            if (opts.freeze) {
              frozenPositionsRef.current.set(projectile.id, {
                xPercent: projectile.spawnX,
                yPercent,
              })
            }
          } else if (typeof opts.remainingMs === 'number') {
            motionRef.current.set(projectile.id, {
              elapsedMs: Math.max(
                0,
                projectile.flightDurationMs - Math.max(0, opts.remainingMs),
              ),
            })
          } else {
            motionRef.current.set(projectile.id, { elapsedMs: 0 })
          }
          dispatch({ type: 'SPAWN_PROJECTILE', projectile })
          return projectile
        }

        const living = current.activeProjectiles.filter(
          (p) =>
            p.state === 'incoming' ||
            p.state === 'targeted' ||
            p.state === 'resolving' ||
            p.state === 'hit',
        ) as EnemyProjectile[]

        const immediate = window.__SHINOBI_KEYS_TEST__?.requestImmediateSpawn
        if (immediate && window.__SHINOBI_KEYS_TEST__) {
          window.__SHINOBI_KEYS_TEST__.requestImmediateSpawn = undefined
          // 寿司打: 原則1体。allowMultiple は検証用のみ
          if (!immediate.allowMultiple && living.length > 0) {
            return 0
          }
          const forceProblem =
            immediate.forceProblem ??
            window.__SHINOBI_KEYS_TEST__.forceProblem
          if (window.__SHINOBI_KEYS_TEST__.forceProblem) {
            window.__SHINOBI_KEYS_TEST__.forceProblem = undefined
          }
          const spawned = spawnOne(
            {
              spawnX: immediate.spawnX ?? PLAYER_X_PERCENT,
              trajectory: immediate.trajectory ?? 'straight',
              size: immediate.size ?? 'normal',
              damage: config.missDamage,
              yPercent: immediate.yPercent,
              freeze: immediate.freeze,
              remainingMs: immediate.remainingMs,
              forceProblem,
            },
            living,
          )
          return spawned ? 1 : 0
        }

        if (window.__SHINOBI_KEYS_TEST__?.suppressSpawn) return 0

        // 寿司打方式: 結果が出るまで次を出さない（同時は常に最大1）
        const maxActive = getMaxActiveTargets(config)
        if (!canSpawnMore(living.length, maxActive)) return 0
        if (living.length > 0) return 0

        const forceSpawn = window.__SHINOBI_KEYS_TEST__?.forceNextSpawn
        if (forceSpawn && window.__SHINOBI_KEYS_TEST__) {
          window.__SHINOBI_KEYS_TEST__.forceNextSpawn = undefined
        }

        const spawnX =
          forceSpawn?.spawnX ??
          SPAWN_COLUMNS[Math.floor(Math.random() * SPAWN_COLUMNS.length)]!

        const projectile = spawnOne(
          {
            spawnX,
            trajectory: forceSpawn?.trajectory ?? 'straight',
            size: 'normal',
            damage: config.missDamage,
            yPercent: forceSpawn?.yPercent,
            freeze: forceSpawn?.freeze,
            remainingMs: forceSpawn?.remainingMs,
          },
          living,
        )
        return projectile ? 1 : 0
      } catch (error) {
        console.error('spawnFromDirector failed', error)
        return 0
      }
    },
    [config, difficulty],
  )


  const handleImpactCheck = useCallback(
    (nowMs: number) => {
      if (!isPlayingRef.current) return
      const current = stateRef.current
      if (current.status !== 'playing') return

      for (const projectile of current.activeProjectiles) {
        if (
          projectile.state === 'destroyed' ||
          projectile.state === 'hit' ||
          projectile.state === 'resolving'
        ) {
          const motion = motionRef.current.get(projectile.id)
          if (motion && motion.elapsedMs > projectile.flightDurationMs + 600) {
            motionRef.current.delete(projectile.id)
            elementRefs.current.delete(projectile.id)
            resolvingIdsRef.current.delete(projectile.id)
            frozenPositionsRef.current.delete(projectile.id)
            dispatch({ type: 'REMOVE_PROJECTILE', projectileId: projectile.id })
          }
          continue
        }

        if (resolvingIdsRef.current.has(projectile.id)) continue

        const pos = readPos(
          projectile.id,
          projectile,
          motionRef.current,
          elementRefs.current,
          frozenPositionsRef.current,
        )

        if (
          isProjectileHittingPlayer({
            projectile,
            xPercent: pos.xPercent,
            yPercent: pos.yPercent,
            playerAction: current.playerAction,
            invulnerableUntilMs: current.invulnerableUntilMs,
            nowMs,
          })
        ) {
          const damageResult = applyDamageAbility(
            projectile.damage,
            playCharacter.ability,
          )
          if (damageResult.reducedBy > 0) {
            setShowGuardBurst(true)
            setGuardFloat({ reducedBy: damageResult.reducedBy })
            schedule(() => {
              setShowGuardBurst(false)
              setGuardFloat(null)
            }, 800)
          }
          getSoundManager().playSfx('damage')
          setDamaged(!reducedMotion)
          schedule(() => setDamaged(false), 200)
          schedule(() => {
            if (stateRef.current.playerAction === 'damaged') {
              dispatch({ type: 'SET_PLAYER_ACTION', action: 'idle' })
            }
          }, 280)
          dispatch({
            type: 'PROJECTILE_HIT_PLAYER',
            projectileId: projectile.id,
            damage: damageResult.finalDamage,
            invulnerableUntilMs: nowMs + gameConfig.invulnerableMs,
          })
          schedule(() => {
            motionRef.current.delete(projectile.id)
            elementRefs.current.delete(projectile.id)
            frozenPositionsRef.current.delete(projectile.id)
            dispatch({ type: 'REMOVE_PROJECTILE', projectileId: projectile.id })
            // 失敗後に次の敵を生成（寿司打方式）
            if (stateRef.current.status === 'playing') {
              spawnFromDirector(Date.now())
            }
          }, 120)
          break
        }
      }
    },
    [playCharacter.ability, reducedMotion, schedule, spawnFromDirector],
  )

  useFallingProjectileLoop({
    enabled: state.status === 'playing' && areaReady,
    getProjectiles,
    motionRef,
    elementRefs,
    frozenPositionsRef,
    onFrameImpactCheck: handleImpactCheck,
    onSpawnTick: spawnFromDirector,
    gameNowMs,
  })

  useEffect(() => {
    if (state.status !== 'playing' || !areaReady) return
    spawnFromDirector(Date.now())
    const id = window.setInterval(() => {
      if (stateRef.current.status === 'playing') spawnFromDirector(Date.now())
    }, 280)
    return () => window.clearInterval(id)
  }, [state.status, areaReady, spawnFromDirector])

  const handleChar = useCallback(
    (char: string) => {
      if (!isPlayingRef.current) return
      const current = stateRef.current
      if (current.status !== 'playing') return

      const living = current.activeProjectiles.filter(
        (p) => p.state === 'incoming' || p.state === 'targeted',
      )
      let projectileId = current.lockedProjectileId

      if (!projectileId) {
        const candidates = findLockCandidates(living, char)
        projectileId = findMostDangerousProjectileId(candidates)
        if (!projectileId) {
          getSoundManager().playSfx('typeMiss')
          dispatch({ type: 'TYPE_MISS' })
          return
        }
      }

      const projectile = living.find((p) => p.id === projectileId)
      if (!projectile || projectile.state === 'hit') {
        getSoundManager().playSfx('typeMiss')
        dispatch({ type: 'TYPE_MISS' })
        return
      }

      const problem = toTypingProblem(projectile, current.difficulty)
      const matchResult = processRomajiInput(projectile.matchState, problem, char)
      if (!matchResult.accepted) {
        getSoundManager().playSfx('typeMiss')
        dispatch({ type: 'TYPE_MISS' })
        return
      }

      getSoundManager().playSfx('typeCorrect')

      if (matchResult.isComplete) {
        const fresh = stateRef.current.activeProjectiles.find(
          (p) => p.id === projectile.id,
        )
        if (
          !fresh ||
          fresh.state === 'hit' ||
          fresh.state === 'destroyed' ||
          fresh.state === 'resolving' ||
          resolvingIdsRef.current.has(projectile.id)
        ) {
          return
        }

        resolvingIdsRef.current.add(projectile.id)
        const pos = readPos(
          projectile.id,
          projectile,
          motionRef.current,
          elementRefs.current,
          frozenPositionsRef.current,
        )
        // 演出用に現在位置で固定（判定はすでに確定）
        frozenPositionsRef.current.set(projectile.id, {
          xPercent: pos.xPercent,
          yPercent: pos.yPercent,
        })
        const elNow = elementRefs.current.get(projectile.id)
        if (elNow) {
          elNow.style.left = `${pos.xPercent}%`
          elNow.style.top = `${pos.yPercent}%`
          elNow.dataset.x = String(Math.round(pos.xPercent))
          elNow.dataset.y = String(Math.round(pos.yPercent))
        }
        const dist = distancePxBetween(
          pos.xPercent,
          pos.yPercent,
          PLAYER_X_PERCENT,
          PLAYER_Y_PERCENT,
          areaSizeRef.current.width,
          areaSizeRef.current.height,
        )
        const elapsedMs = motionRef.current.get(projectile.id)?.elapsedMs ?? 0
        const timeToImpactMs = estimateTimeToImpactMs(
          elapsedMs,
          projectile.flightDurationMs,
        )
        const decision = selectInterceptAction({
          distancePx: dist,
          gameHeightPx: areaSizeRef.current.height,
          timeToImpactMs,
          projectileState: fresh.state,
        })
        if (!decision.canIntercept) {
          resolvingIdsRef.current.delete(projectile.id)
          return
        }

        const action: InterceptAction = decision.action
        const nextCombo = current.combo + 1
        const baseGain = calculateScore({
          baseScore: projectile.baseScore,
          difficultyMultiplier: config.scoreMultiplier,
          combo: nextCombo,
          comboMultiplier: config.comboMultiplier,
        })
        const applied = applyScoreAbility(baseGain, playCharacter.ability)
        abilityBonusScoreRef.current += applied.bonusScore
        if (applied.bonusScore > 0) {
          setShowScoreBurst(true)
          setShowScoreAbilityHint(true)
          schedule(() => {
            setShowScoreBurst(false)
            setShowScoreAbilityHint(false)
          }, 700)
        }

        const playerAct = playerActionFromIntercept(action)
        dispatch({ type: 'SET_PLAYER_ACTION', action: playerAct })
        if (isEmergencySlash(action)) {
          setSlashAngle(
            slashAngleDeg(
              pos.xPercent,
              pos.yPercent,
              PLAYER_X_PERCENT,
              PLAYER_Y_PERCENT,
            ),
          )
          setShowEmergencyHint(true)
          schedule(() => setShowEmergencyHint(false), 500)
          // ヒットストップ風の短い強調（DOM class のみ・React state なし）
          const el = elementRefs.current.get(projectile.id)
          if (el && !reducedMotion) {
            el.classList.add('projectile-hitstop')
            schedule(() => el.classList.remove('projectile-hitstop'), 60)
          }
        }

        schedule(() => {
          if (
            stateRef.current.playerAction === playerAct &&
            stateRef.current.status === 'playing'
          ) {
            dispatch({ type: 'SET_PLAYER_ACTION', action: 'idle' })
          }
        }, isEmergencySlash(action) ? 380 : 400)

        getSoundManager().playSfx('destroy')

        if (action === 'throw' && !reducedMotion) {
          const fxId = `ally-${projectile.id}-${Date.now()}`
          const fromX = PLAYER_X_PERCENT
          const fromY = PLAYER_Y_PERCENT - 6
          setAllyFx((prev) => [
            ...prev,
            {
              id: fxId,
              fromXPercent: fromX,
              fromYPercent: fromY,
              toXPercent: pos.xPercent,
              toYPercent: pos.yPercent,
              areaWidthPx: areaSizeRef.current.width,
              areaHeightPx: areaSizeRef.current.height,
              angleDeg: allyThrowAngleDeg(
                fromX,
                fromY,
                pos.xPercent,
                pos.yPercent,
              ),
              variant: allyVariantFor(playCharacter.characterId),
            },
          ])
          schedule(() => {
            setAllyFx((prev) => prev.filter((item) => item.id !== fxId))
          }, 400)
        }

        if (!reducedMotion && nextCombo >= gameConfig.comboPopupThreshold) {
          const popupId = `combo-${projectile.id}`
          setComboPopup({
            id: popupId,
            combo: nextCombo,
            xPercent: pos.xPercent,
            yPx: (pos.yPercent / 100) * areaSizeRef.current.height,
          })
          schedule(() => {
            setComboPopup((prev) => (prev?.id === popupId ? null : prev))
          }, 900)
        }

        dispatch({
          type: 'TYPE_CORRECT',
          projectileId: projectile.id,
          typedLength: matchResult.nextConfirmedLength,
          matchState: matchResult.nextState,
        })

        const hadMiss = stateRef.current.currentProblemHadMiss
        const streakPayload = hadMiss
          ? ({ kind: 'skip-miss' } as const)
          : ({
              kind: 'apply' as const,
              eventId: `${projectile.id}-streak`,
              result: applyPerfectClear({
                currentCount: stateRef.current.perfectStreakCount,
                maxCount: STREAK_REWARD_CONFIG.cycleLength,
                totalBonusSeconds: stateRef.current.totalBonusSeconds,
                totalRewardCoins: stateRef.current.streakRewardCoins,
              }),
            } as const)

        if (streakPayload.kind === 'apply') {
          const { result, eventId } = streakPayload
          const alreadyAwarded = streakAwardedEventsRef.current.has(eventId)
          if (!alreadyAwarded && (result.coinBonus > 0 || result.timeBonusSeconds > 0)) {
            streakAwardedEventsRef.current.add(eventId)
            if (result.coinBonus > 0) {
              onAwardStageCoins(result.coinBonus)
              setCoinGainFlash(result.coinBonus)
              schedule(() => setCoinGainFlash(null), 700)
            }
            if (result.timeBonusSeconds > 0) {
              setTimeBonusFlash(result.timeBonusSeconds)
              schedule(() => setTimeBonusFlash(null), 700)
            }
            if (result.reachedMilestone) {
              getSoundManager().playSfx('stageUp')
            }
          }
        }

        dispatch({
          type: 'RESOLVE_PROJECTILE',
          projectileId: projectile.id,
          action,
          scoreGain: applied.finalScore,
          heal: config.killHeal,
          streak: streakPayload,
        })

        schedule(() => {
          motionRef.current.delete(projectile.id)
          elementRefs.current.delete(projectile.id)
          resolvingIdsRef.current.delete(projectile.id)
          frozenPositionsRef.current.delete(projectile.id)
          dispatch({ type: 'REMOVE_PROJECTILE', projectileId: projectile.id })
          // 成功後に次の敵を生成（寿司打方式）
          if (stateRef.current.status === 'playing') {
            spawnFromDirector(Date.now())
          }
        }, gameConfig.destroyRemoveDelayMs)
        return
      }

      dispatch({
        type: 'TYPE_CORRECT',
        projectileId: projectile.id,
        typedLength: matchResult.nextConfirmedLength,
        matchState: matchResult.nextState,
      })
    },
    [config, schedule, reducedMotion, playCharacter, spawnFromDirector, onAwardStageCoins],
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
      state.timeBonusMs,
    )
  }, [
    config.timeLimitSeconds,
    hudNowMs,
    state.gameStartedAtMs,
    state.pausedAtMs,
    state.pausedTotalMs,
    state.status,
    state.timeBonusMs,
  ])

  useKeyboardInput({
    enabled: state.status === 'playing',
    onChar: handleChar,
    onEscape: togglePause,
  })

  const handleAreaReady = useCallback((element: HTMLDivElement | null) => {
    if (!element) {
      setAreaReady(false)
      return
    }
    setAreaSize({
      width: element.clientWidth,
      height: element.clientHeight,
    })
    setAreaReady(element.clientHeight > 0)
  }, [])

  useEffect(() => {
    if (state.status !== 'playing') return
    const timerId = window.setTimeout(() => {
      setAreaReady((ready) => ready || true)
    }, 50)
    return () => window.clearTimeout(timerId)
  }, [state.status])

  return (
    <main className="flex min-h-[100vh] min-h-[100dvh] flex-col items-center overflow-x-hidden px-1 py-1 sm:px-2 sm:py-2">
      <GameArea damaged={damaged && !reducedMotion} onReady={handleAreaReady}>
        <TrainingGroundBackground
          paused={state.status !== 'playing'}
          reducedMotion={reducedMotion}
        />
        <span className="sr-only" data-testid="projectile-count">
          {state.activeProjectiles.length}
        </span>
        <GameHud
          score={state.score}
          combo={state.combo}
          remainingLabel={formatRemainingTime(hudRemainingMs)}
          remainingUrgent={hudRemainingMs <= 10_000}
          wpm={hudStats.wpm}
          coins={coins}
          coinGainFlash={coinGainFlash}
          showScoreAbilityHint={showScoreAbilityHint}
          streakCount={state.perfectStreakCount}
          streakMax={STREAK_REWARD_CONFIG.cycleLength}
          timeBonusFlash={timeBonusFlash}
          reducedMotion={reducedMotion}
          onPause={
            state.status === 'playing' ? () => pauseGame(false) : undefined
          }
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

        {state.activeProjectiles.map((projectile) =>
          projectile.state === 'hit' ? null : (
            <EnemyProjectileView
              key={projectile.id}
              projectile={projectile}
              isLocked={state.lockedProjectileId === projectile.id}
              showMiss={
                !reducedMotion &&
                state.showMissFeedback &&
                state.lockedProjectileId === projectile.id
              }
              registerElement={registerElement}
            />
          ),
        )}

        {!reducedMotion &&
          allyFx.map((fx) => (
            <AllyShurikenFx
              key={fx.id}
              id={fx.id}
              fromXPercent={fx.fromXPercent}
              fromYPercent={fx.fromYPercent}
              toXPercent={fx.toXPercent}
              toYPercent={fx.toYPercent}
              areaWidthPx={fx.areaWidthPx}
              areaHeightPx={fx.areaHeightPx}
              angleDeg={fx.angleDeg}
              variant={fx.variant}
            />
          ))}

        {!reducedMotion && comboPopup && (
          <ComboDisplay
            combo={comboPopup.combo}
            xPercent={comboPopup.xPercent}
            yPx={comboPopup.yPx}
            visible
          />
        )}

        <NinjaPlayer
          action={state.playerAction}
          character={playCharacter}
          reducedMotion={reducedMotion}
          slashAngleDeg={slashAngle}
          showScoreBurst={showScoreBurst}
          showGuardBurst={showGuardBurst}
          showEmergencyHint={showEmergencyHint}
        />

        {guardFloat && (
          <div
            className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
            style={
              {
                left: `${PLAYER_X_PERCENT}%`,
                top: `${PLAYER_Y_PERCENT - 12}%`,
              } as CSSProperties
            }
          >
            <AbilityFloatText
              text={`蒼影の守り -${guardFloat.reducedBy}`}
              variant="water"
            />
          </div>
        )}

        {config.showBeginnerGuide && state.destroyedTargets === 0 && (
          <p className="pointer-events-none absolute bottom-28 left-1/2 z-20 w-[90%] -translate-x-1/2 text-center text-sm text-[var(--color-text-soft)] md:bottom-32">
            表示された文字を入力して迎撃。成功または失敗のあと、次の敵が現れます
          </p>
        )}

        {state.status === 'paused' && (
          <PauseOverlay
            playCharacter={playCharacter}
            volume={volume}
            muted={muted}
            confirmExit={pausedFromBrowserBack}
            onResume={resumeGame}
            onRetry={() => {
              getSoundManager().stopBgm()
              onRetry()
            }}
            onTitle={() => {
              getSoundManager().stopBgm()
              onAbandonToTitle()
            }}
            onVolumeChange={onVolumeChange}
            onMutedChange={onMutedChange}
          />
        )}
      </GameArea>
    </main>
  )
}
