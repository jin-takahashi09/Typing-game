import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppScreen, DifficultyId } from './types/app'
import type { GameResultSummary, ResultViewModel } from './types/game'
import type { StoredAppData } from './types/records'
import { createDefaultStoredData } from './types/records'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { loadStoredData } from './utils/storage'
import { getSaveErrorMessage, persistPlayResult } from './utils/persistPlayResult'

const initialLoad = loadStoredData()

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null)
  const [result, setResult] = useState<ResultViewModel | null>(null)
  const [storedData, setStoredData] = useState<StoredAppData>(initialLoad.data)
  const [gameSession, setGameSession] = useState(0)
  const savedPlaySessionsRef = useRef<Set<number>>(new Set())
  const storedDataRef = useRef(storedData)

  useEffect(() => {
    storedDataRef.current = storedData
  }, [storedData])

  const startGame = useCallback((id: DifficultyId) => {
    setDifficulty(id)
    setResult(null)
    setGameSession((value) => value + 1)
    setScreen('game')
  }, [])

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
        onStartTraining={() => {
          setDifficulty(null)
          setScreen('difficulty')
        }}
        onOpenRecords={() => setScreen('records')}
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
          onGameOver={handleGameOver}
        />
      )
    case 'result':
      return (
        <ResultScreen
          result={result!}
          onRetry={() => startGame(difficulty!)}
          onChangeDifficulty={() => setScreen('difficulty')}
          onTitle={() => {
            setResult(null)
            setScreen('title')
          }}
        />
      )
    case 'records':
      return (
        <RecordsScreen
          data={storedData}
          onBack={() => setScreen('title')}
        />
      )
    case 'title':
    default:
      return (
        <TitleScreen
          storedData={storedData}
          onStartTraining={() => {
            setDifficulty(null)
            setScreen('difficulty')
          }}
          onOpenRecords={() => setScreen('records')}
        />
      )
  }
}
