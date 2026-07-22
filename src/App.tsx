import { useCallback, useState } from 'react'
import type { AppScreen, DifficultyId } from './types/app'
import type { GameResultSummary } from './types/game'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null)
  const [result, setResult] = useState<GameResultSummary | null>(null)
  const [gameSession, setGameSession] = useState(0)

  const startGame = useCallback((id: DifficultyId) => {
    setDifficulty(id)
    setResult(null)
    setGameSession((value) => value + 1)
    setScreen('game')
  }, [])

  const handleGameOver = useCallback((summary: GameResultSummary) => {
    setResult(summary)
    setScreen('result')
  }, [])

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
    return <TitleScreen onStartTraining={() => {
      setDifficulty(null)
      setScreen('difficulty')
    }} />
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
    case 'title':
    default:
      return <TitleScreen onStartTraining={() => {
        setDifficulty(null)
        setScreen('difficulty')
      }} />
  }
}
