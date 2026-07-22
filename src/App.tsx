import { useState } from 'react'
import type { AppScreen } from './types/app'
import { TitleScreen } from './screens/TitleScreen'
import { DifficultyScreen } from './screens/DifficultyScreen'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')

  switch (screen) {
    case 'difficulty':
      return <DifficultyScreen onBack={() => setScreen('title')} />
    case 'title':
    default:
      return <TitleScreen onStartTraining={() => setScreen('difficulty')} />
  }
}
