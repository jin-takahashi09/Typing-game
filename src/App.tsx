import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppScreen, DifficultyId } from './types/app'
import type { GameResultSummary, PlayCoinSummary, ResultViewModel } from './types/game'
import type { StoredAppData, StoredSettings } from './types/records'
import { createDefaultStoredData } from './types/records'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { HowToScreen } from './screens/HowToScreen'
import { CharactersScreen } from './screens/CharactersScreen'
import { loadStoredData, saveStoredData } from './utils/storage'
import { getSaveErrorMessage, persistPlayResult } from './utils/persistPlayResult'
import { applyMotionPreference, resolveReducedMotion } from './utils/motionPreference'
import { clearPlayRecords } from './utils/clearPlayRecords'
import {
  awardCoins,
  getEconomyErrorMessage,
  purchaseCharacter,
  selectCharacter,
} from './utils/economy'
import { getSoundManager } from './audio/SoundManager'

const initialLoad = loadStoredData()

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null)
  const [result, setResult] = useState<ResultViewModel | null>(null)
  const [storedData, setStoredData] = useState<StoredAppData>(initialLoad.data)
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null)
  const [recordsClearError, setRecordsClearError] = useState<string | null>(null)
  const [charactersError, setCharactersError] = useState<string | null>(null)
  const [gameSession, setGameSession] = useState(0)
  const savedPlaySessionsRef = useRef<Set<number>>(new Set())
  const purchasingRef = useRef(false)
  const storedDataRef = useRef(storedData)

  useEffect(() => {
    storedDataRef.current = storedData
  }, [storedData])

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

  const handlePurchaseCharacter = useCallback(
    (characterId: string): boolean => {
      if (purchasingRef.current) {
        return false
      }
      purchasingRef.current = true
      try {
        const purchased = purchaseCharacter(
          storedDataRef.current.economy,
          characterId,
        )
        if (!purchased.ok) {
          setCharactersError(getEconomyErrorMessage(purchased.error))
          return false
        }
        const ok = commitStoredData({
          ...storedDataRef.current,
          economy: purchased.economy,
        })
        if (!ok) {
          setCharactersError(
            '購入結果の保存に失敗しました。画面上は反映されていますが、再読み込みで戻る可能性があります。',
          )
          return false
        }
        setCharactersError(null)
        getSoundManager().playSfx('uiClick')
        return true
      } finally {
        purchasingRef.current = false
      }
    },
    [commitStoredData],
  )

  const handleSelectCharacter = useCallback(
    (characterId: string): boolean => {
      const selected = selectCharacter(storedDataRef.current.economy, characterId)
      if (!selected.ok) {
        setCharactersError(getEconomyErrorMessage(selected.error))
        return false
      }
      const ok = commitStoredData({
        ...storedDataRef.current,
        economy: selected.economy,
      })
      if (!ok) {
        setCharactersError(
          '選択の保存に失敗しました。画面上は反映されていますが、再読み込みで戻る可能性があります。',
        )
        return false
      }
      setCharactersError(null)
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
    setScreen('title')
  }, [])

  const reducedMotion = resolveReducedMotion(storedData.settings.motionPreference)
  const selectedCharacterId = storedData.economy.selectedCharacterId

  const titleFallback = (
    <TitleScreen
      storedData={createDefaultStoredData()}
      onStartTraining={async () => {
        await unlockAudio()
        setDifficulty(null)
        setScreen('difficulty')
      }}
      onOpenRecords={() => setScreen('records')}
      onOpenCharacters={() => setScreen('characters')}
      onOpenSettings={() => setScreen('settings')}
      onOpenHowTo={() => setScreen('howto')}
    />
  )

  if (screen === 'game' && !difficulty) {
    return (
      <DifficultyScreen
        key="fallback"
        onBack={() => setScreen('title')}
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
          onBack={() => setScreen('title')}
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
          characterId={selectedCharacterId}
          volume={storedData.settings.volume}
          muted={storedData.settings.muted}
          reducedMotion={reducedMotion}
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
          characterId={selectedCharacterId}
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
            setScreen('title')
          }}
          onClearRecords={handleClearRecords}
        />
      )
    case 'characters':
      return (
        <CharactersScreen
          economy={storedData.economy}
          error={charactersError}
          onBack={() => {
            setCharactersError(null)
            setScreen('title')
          }}
          onPurchase={handlePurchaseCharacter}
          onSelect={handleSelectCharacter}
        />
      )
    case 'settings':
      return (
        <SettingsScreen
          settings={storedData.settings}
          saveError={settingsSaveError}
          onChange={updateSettings}
          onBack={() => setScreen('title')}
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
          onBack={() => setScreen('title')}
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
            setDifficulty(null)
            setScreen('difficulty')
          }}
          onOpenCharacters={() => {
            getSoundManager().playSfx('uiClick')
            setScreen('characters')
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
