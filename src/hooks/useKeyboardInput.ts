import { useEffect } from 'react'
import { isTypingKey } from '../features/game/gameLogic'

interface UseKeyboardInputParams {
  enabled: boolean
  onChar: (char: string) => void
  onEscape?: () => void
}

export function useKeyboardInput({
  enabled,
  onChar,
  onEscape,
}: UseKeyboardInputParams): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) {
        return
      }

      if (event.key === 'Escape') {
        if (onEscape) {
          event.preventDefault()
          onEscape()
        }
        return
      }

      if (!enabled) {
        return
      }

      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.key === 'Shift' ||
        event.key === 'Tab' ||
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'Backspace' ||
        event.key.startsWith('Arrow') ||
        (event.key.startsWith('F') && event.key.length <= 3)
      ) {
        return
      }

      if (!isTypingKey(event.key)) {
        return
      }

      event.preventDefault()
      onChar(event.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onChar, onEscape])
}
