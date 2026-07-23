import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppScreen, DifficultyId } from './types/app'
import type { GameResultSummary, ResultViewModel } from './types/game'
import type { StoredAppData, StoredSettings } from './types/records'
import { createDefaultStoredData } from './types/records'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { HowToScreen } from './screens/HowToScreen'
import { loadStoredData, saveStoredData } from './utils/storage'
import { getSaveErrorMessage, persistPlayResult } from './utils/persistPlayResult'
import { applyMotionPreference, resolveReducedMotion } from './utils/motionPreference'
import { getSoundManager } from './audio/SoundManager'

const initialLoad = loadStoredData()

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null)
  const [result, setResult] = useState<ResultViewModel | null>(null)
  const [storedData, setStoredData] = useState<StoredAppData>(initialLoad.data)
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null)
  const [gameSession, setGameSession] = useState(0)
  const savedPlaySessionsRef = useRef<Set<number>>(new Set())
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
    (summary: GameResultSummary, playSessionId: number) => {
      if (savedPlaySessionsRef.current.has(playSessionId)) {
        setScreen('result')
        return
      }
      savedPlaySessionsRef.current.add(playSessionId)

      const persisted = persistPlayResult(storedDataRef.current, summary)
      storedDataRef.current = persisted.data
      setStoredData(persisted.data)

      setResult({
        summary,
        comparison: persisted.comparison,
        saveError: getSaveErrorMessage(persisted.saveResult.error),
        playSessionId,
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
    return (
      <TitleScreen
        storedData={createDefaultStoredData()}
        onStartTraining={async () => {
          await unlockAudio()
          setDifficulty(null)
          setScreen('difficulty')
        }}
        onOpenRecords={() => setScreen('records')}
        onOpenSettings={() => setScreen('settings')}
        onOpenHowTo={() => setScreen('howto')}
      />
    )
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
          volume={storedData.settings.volume}
          muted={storedData.settings.muted}
          reducedMotion={reducedMotion}
          onVolumeChange={(volume) => updateSettings({ volume })}
          onMutedChange={(muted) => updateSettings({ muted })}
          onGameOver={handleGameOver}
          onRetry={() => startGame(difficulty!)}
          onAbandonToTitle={goTitle}
        />
      )
    case 'result':
      return (
        <ResultScreen
          result={result!}
          onRetry={() => startGame(difficulty!)}
          onChangeDifficulty={() => setScreen('difficulty')}
          onTitle={goTitle}
        />
      )
    case 'records':
      return (
        <RecordsScreen
          data={storedData}
          onBack={() => setScreen('title')}
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
