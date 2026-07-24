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
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><path d='M0 100 L20 60 L40 80 L70 30 L100 90 L100 100 Z' fill='%233498db'/></svg>\")",
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'bottom',
          backgroundSize: '200px 100px',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}
