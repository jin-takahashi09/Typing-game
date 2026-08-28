import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface GameAreaProps {
  children: ReactNode
  damaged: boolean
  onReady: (element: HTMLDivElement | null) => void
}

export function GameArea({ children, damaged, onReady }: GameAreaProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const reportSize = () => {
      onReady(element)
    }

    reportSize()

    const observer = new ResizeObserver(() => {
      reportSize()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [onReady])

  return (
    <div
      ref={ref}
      className={[
        // 画面下部近くまで伸ばす（モバイルは dvh、フォールバックで vh）
        'relative w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] panel-glow',
        'min-h-[70vh] min-h-[70dvh]',
        'h-[calc(100vh-1.5rem)] h-[calc(100dvh-1.5rem)]',
        'max-h-[calc(100vh-1.5rem)] max-h-[calc(100dvh-1.5rem)]',
        'sm:h-[calc(100vh-2rem)] sm:h-[calc(100dvh-2rem)]',
        damaged ? 'damage-flash' : '',
      ].join(' ')}
      data-testid="game-area"
      role="application"
      aria-label="タイピングゲームエリア"
      tabIndex={0}
    >
      {children}
    </div>
  )
}
