import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppScreen, DifficultyId } from './types/app'
import type { GameResultSummary, PlayCoinSummary, ResultViewModel } from './types/game'
import type { StoredAppData, StoredSettings } from './types/records'
import { createDefaultStoredData } from './types/records'
import {
  type ActivePlayCharacter,
  getDefaultCharacter,
  resolveCharacter,
  toActivePlayCharacter,
} from './config/characters'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { HowToScreen } from './screens/HowToScreen'
import { GachaScreen } from './screens/GachaScreen'
import { ShinobiRecordScreen } from './screens/ShinobiRecordScreen'
import { loadStoredData, saveStoredData } from './utils/storage'
import { getSaveErrorMessage, persistPlayResult } from './utils/persistPlayResult'
import { applyMotionPreference, resolveReducedMotion } from './utils/motionPreference'
import { clearPlayRecords } from './utils/clearPlayRecords'
import {
  awardCoins,
  getEconomyErrorMessage,
  selectCharacter,
} from './utils/economy'
import { pullGacha, type GachaPullItem, type GachaPullType } from './utils/gacha'
import type { CharacterRarity } from './config/characters'
import { gachaConfig } from './config/gachaConfig'
import { getSoundManager } from './audio/SoundManager'
import {
  useAppHistory,
  type HistoryEntry,
} from './hooks/useAppHistory'

const initialLoad = loadStoredData()

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null)
  const [result, setResult] = useState<ResultViewModel | null>(null)
  const [storedData, setStoredData] = useState<StoredAppData>(initialLoad.data)
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null)
  const [recordsClearError, setRecordsClearError] = useState<string | null>(null)
  const [gachaError, setGachaError] = useState<string | null>(null)
  const [gameSession, setGameSession] = useState(0)
  const [browserBackRequest, setBrowserBackRequest] = useState(0)
  const [playCharacter, setPlayCharacter] = useState<ActivePlayCharacter | null>(
    null,
  )
  const savedPlaySessionsRef = useRef<Set<number>>(new Set())
  const pullingRef = useRef(false)
  const storedDataRef = useRef(storedData)
  const screenRef = useRef(screen)

  useEffect(() => {
    storedDataRef.current = storedData
  }, [storedData])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const handleHistoryRestore = useCallback((entry: HistoryEntry) => {
    if (entry.screen === 'game') {
      // ゲーム画面への進む操作では二重開始しない（既存セッションを維持）
      if (screenRef.current === 'game') {
        return
      }
      setScreen('difficulty')
      return
    }
    if (entry.screen === 'result') {
      setScreen(result ? 'result' : 'title')
      return
    }
    setScreen(entry.screen)
    if (entry.difficulty !== undefined) {
      setDifficulty(entry.difficulty)
    }
  }, [result])

  const handleGameBackRequest = useCallback(() => {
    setBrowserBackRequest((value) => value + 1)
  }, [])

  const isInGameSession = useCallback(() => {
    return screenRef.current === 'game'
  }, [])

  const { requestBack } = useAppHistory({
    screen,
    difficulty,
    onGameBackRequest: handleGameBackRequest,
    onRestore: handleHistoryRestore,
    isInGameSession,
  })


  useEffect(() => {
    applyMotionPreference(storedData.settings.motionPreference)
  }, [storedData.settings.motionPreference])

  useEffect(() => {
    const sound = getSoundManager()
    sound.setVolume(storedData.settings.volume)
    sound.setMuted(storedData.settings.muted)
  }, [storedData.settings.volume, storedData.settings.muted])

  const commitStoredData = useCallback((next: StoredAppData): boolean => {
    storedDataRef.current = next
    setStoredData(next)
    const saveResult = saveStoredData(next)
    return saveResult.ok
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }
    const current = storedDataRef.current
    if (current.economy.coins >= gachaConfig.multiCost) {
      return
    }
    const result = awardCoins(
      current.economy,
      10_000 - current.economy.coins,
    )
    if (!result.ok) {
      return
    }
    commitStoredData({
      ...current,
      economy: result.economy,
    })
  }, [commitStoredData])

  const updateSettings = useCallback((patch: Partial<StoredSettings>) => {
    const next: StoredAppData = {
      ...storedDataRef.current,
      settings: {
        ...storedDataRef.current.settings,
        ...patch,
      },
    }
    storedDataRef.current = next
    setStoredData(next)

    const sound = getSoundManager()
    if (patch.volume !== undefined) {
      sound.setVolume(patch.volume)
    }
    if (patch.muted !== undefined) {
      sound.setMuted(patch.muted)
    }
    if (patch.motionPreference !== undefined) {
      applyMotionPreference(patch.motionPreference)
    }

    const saveResult = saveStoredData(next)
    if (!saveResult.ok) {
      setSettingsSaveError(
        getSaveErrorMessage(saveResult.error) ??
          '設定の保存に失敗しました。このセッションでは変更が有効です。',
      )
    } else {
      setSettingsSaveError(null)
    }
  }, [])

  const handleClearRecords = useCallback((): boolean => {
    const next = clearPlayRecords(storedDataRef.current)
    const ok = commitStoredData(next)
    if (!ok) {
      setRecordsClearError(
        '記録の削除に失敗しました。画面上ではクリアされていますが、再読み込みで戻る可能性があります。',
      )
      return false
    }
    setRecordsClearError(null)
    return true
  }, [commitStoredData])

  const handleAwardStageCoins = useCallback(
    (amount: number) => {
      if (amount <= 0) {
        return
      }
      const awarded = awardCoins(storedDataRef.current.economy, amount)
      if (!awarded.ok) {
        return
      }
      commitStoredData({
        ...storedDataRef.current,
        economy: awarded.economy,
      })
    },
    [commitStoredData],
  )

  const handleGachaPull = useCallback(
    (
      pullType: GachaPullType,
    ): {
      ok: boolean
      items?: GachaPullItem[]
      peakRarity?: CharacterRarity
    } => {
      if (pullingRef.current) {
        return { ok: false }
      }
      pullingRef.current = true
      try {
        const testRng = window.__SHINOBI_KEYS_TEST__?.gachaRng
        const result = pullGacha(
          storedDataRef.current.economy,
          pullType,
          typeof testRng === 'function' ? testRng : undefined,
        )
        if (!result.ok) {
          setGachaError(
            result.error === 'insufficient_coins'
              ? 'コインが足りません'
              : 'ガチャに失敗しました',
          )
          return { ok: false }
        }
        const ok = commitStoredData({
          ...storedDataRef.current,
          economy: result.economy,
        })
        if (!ok) {
          setGachaError(
            'ガチャ結果の保存に失敗しました。画面上は反映されていますが、再読み込みで戻る可能性があります。',
          )
        } else {
          setGachaError(null)
        }
        getSoundManager().playSfx('uiClick')
        return {
          ok: true,
          items: result.items,
          peakRarity: result.peakRarity,
        }
      } finally {
        pullingRef.current = false
      }
    },
    [commitStoredData],
  )

  const handleSelectCharacter = useCallback(
    (characterId: string): boolean => {
      const selected = selectCharacter(storedDataRef.current.economy, characterId)
      if (!selected.ok) {
        setGachaError(getEconomyErrorMessage(selected.error))
        return false
      }
      const ok = commitStoredData({
        ...storedDataRef.current,
        economy: selected.economy,
      })
      if (!ok) {
        setGachaError(
          '選択の保存に失敗しました。画面上は反映されていますが、再読み込みで戻る可能性があります。',
        )
        return false
      }
      setGachaError(null)
      getSoundManager().playSfx('uiClick')
      return true
    },
    [commitStoredData],
  )

  const unlockAudio = useCallback(async () => {
    const sound = getSoundManager()
    await sound.unlock()
    sound.setVolume(storedDataRef.current.settings.volume)
    sound.setMuted(storedDataRef.current.settings.muted)
  }, [])

  const startGame = useCallback(
    async (id: DifficultyId) => {
      await unlockAudio()
      getSoundManager().playSfx('uiClick')
      const selectedId = storedDataRef.current.economy.selectedCharacterId
      const owned =
        storedDataRef.current.economy.ownedCharacterIds.includes(selectedId)
      const def = owned ? resolveCharacter(selectedId) : getDefaultCharacter()
      setPlayCharacter(toActivePlayCharacter(def))
      setDifficulty(id)
      setResult(null)
      setGameSession((value) => value + 1)
      setScreen('game')
    },
    [unlockAudio],
  )

  const handleGameOver = useCallback(
    (
      summary: GameResultSummary,
      playSessionId: number,
      coinBase: Omit<PlayCoinSummary, 'balanceAfter'>,
    ) => {
      if (savedPlaySessionsRef.current.has(playSessionId)) {
        setScreen('result')
        return
      }
      savedPlaySessionsRef.current.add(playSessionId)

      const bonusAward = awardCoins(
        storedDataRef.current.economy,
        coinBase.resultBonusCoins,
      )
      const withBonus: StoredAppData = {
        ...storedDataRef.current,
        economy: bonusAward.economy,
      }

      const persisted = persistPlayResult(withBonus, summary)
      storedDataRef.current = persisted.data
      setStoredData(persisted.data)

      setResult({
        summary,
        comparison: persisted.comparison,
        saveError: getSaveErrorMessage(persisted.saveResult.error),
        playSessionId,
        coinSummary: {
          ...coinBase,
          balanceAfter: persisted.data.economy.coins,
        },
      })
      setScreen('result')
    },
    [],
  )

  const goTitle = useCallback(() => {
    getSoundManager().stopBgm()
    setResult(null)
    setDifficulty(null)
    setPlayCharacter(null)
    setScreen('title')
  }, [])

  const reducedMotion = resolveReducedMotion(storedData.settings.motionPreference)
  const selectedCharacterId = storedData.economy.selectedCharacterId
  const activePlayCharacter =
    playCharacter ?? toActivePlayCharacter(getDefaultCharacter())
  const resultCharacterId =
    result?.summary.characterId ??
    playCharacter?.characterId ??
    selectedCharacterId

  const titleFallback = (
    <TitleScreen
      storedData={createDefaultStoredData()}
      onStartTraining={async () => {
        await unlockAudio()
        setDifficulty(null)
        setScreen('difficulty')
      }}
      onOpenGacha={() => setScreen('gacha')}
      onOpenShinobiRecord={() => setScreen('shinobi-record')}
      onOpenRecords={() => setScreen('records')}
      onOpenSettings={() => setScreen('settings')}
      onOpenHowTo={() => setScreen('howto')}
    />
  )

  if (screen === 'game' && !difficulty) {
    return (
      <DifficultyScreen
        key="fallback"
        onBack={requestBack}
        onStart={startGame}
      />
    )
  }

  if (screen === 'result' && (!result || !difficulty)) {
    return titleFallback
  }

  switch (screen) {
    case 'difficulty':
      return (
        <DifficultyScreen
          key={difficulty ?? 'fresh'}
          onBack={requestBack}
          onStart={startGame}
          initialDifficulty={difficulty ?? undefined}
        />
      )
    case 'game':
      return (
        <GameScreen
          key={`${difficulty}-${gameSession}`}
          difficulty={difficulty!}
          playSessionId={gameSession}
          playCharacter={activePlayCharacter}
          volume={storedData.settings.volume}
          muted={storedData.settings.muted}
          reducedMotion={reducedMotion}
          romajiLetterCase={storedData.settings.romajiLetterCase ?? 'lower'}
          browserBackRequest={browserBackRequest}
          coins={storedData.economy.coins}
          onVolumeChange={(volume) => updateSettings({ volume })}
          onMutedChange={(muted) => updateSettings({ muted })}
          onAwardStageCoins={handleAwardStageCoins}
          onGameOver={handleGameOver}
          onRetry={() => startGame(difficulty!)}
          onAbandonToTitle={goTitle}
        />
      )
    case 'result':
      return (
        <ResultScreen
          result={result!}
          characterId={resultCharacterId}
          onRetry={() => startGame(difficulty!)}
          onChangeDifficulty={() => setScreen('difficulty')}
          onTitle={goTitle}
        />
      )
    case 'records':
      return (
        <RecordsScreen
          data={storedData}
          clearError={recordsClearError}
          onBack={() => {
            setRecordsClearError(null)
            requestBack()
          }}
          onClearRecords={handleClearRecords}
        />
      )
    case 'gacha':
      return (
        <GachaScreen
          coins={storedData.economy.coins}
          error={gachaError}
          reducedMotion={reducedMotion}
          onBack={() => {
            setGachaError(null)
            requestBack()
          }}
          onPull={handleGachaPull}
        />
      )
    case 'shinobi-record':
      return (
        <ShinobiRecordScreen
          economy={storedData.economy}
          error={gachaError}
          onBack={() => {
            setGachaError(null)
            requestBack()
          }}
          onSelect={(characterId) => {
            setGachaError(null)
            const ok = handleSelectCharacter(characterId)
            if (ok) {
              getSoundManager().playSfx('uiClick')
            }
            return ok
          }}
        />
      )
    case 'settings':
      return (
        <SettingsScreen
          settings={storedData.settings}
          saveError={settingsSaveError}
          onChange={updateSettings}
          onBack={requestBack}
          onTestSound={async () => {
            await unlockAudio()
            getSoundManager().playSfx('uiClick')
          }}
        />
      )
    case 'howto':
      return (
        <HowToScreen
          onStartTraining={async () => {
            await unlockAudio()
            setDifficulty(null)
            setScreen('difficulty')
          }}
          onBack={requestBack}
        />
      )
    case 'title':
    default:
      return (
        <TitleScreen
          storedData={storedData}
          onStartTraining={async () => {
            await unlockAudio()
            getSoundManager().playSfx('uiClick')
            setGachaError(null)
            setDifficulty(null)
            setScreen('difficulty')
          }}
          onOpenGacha={() => {
            getSoundManager().playSfx('uiClick')
            setGachaError(null)
            setScreen('gacha')
          }}
          onOpenShinobiRecord={() => {
            getSoundManager().playSfx('uiClick')
            setGachaError(null)
            setScreen('shinobi-record')
          }}
          onOpenRecords={() => {
            getSoundManager().playSfx('uiClick')
            setScreen('records')
          }}
          onOpenSettings={() => {
            getSoundManager().playSfx('uiClick')
            setScreen('settings')
          }}
          onOpenHowTo={() => {
            getSoundManager().playSfx('uiClick')
            setScreen('howto')
          }}
        />
      )
  }
}
