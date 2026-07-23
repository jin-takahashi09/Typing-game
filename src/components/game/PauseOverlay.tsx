import { useEffect } from 'react'
import { GameButton } from '../common/GameButton'
import { CharacterPreview } from '../common/CharacterPreview'
import { useDialogA11y } from '../../hooks/useFocusTrap'

interface PauseOverlayProps {
  characterId: string
  volume: number
  muted: boolean
  onResume: () => void
  onRetry: () => void
  onTitle: () => void
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void
}

export function PauseOverlay({
  characterId,
  volume,
  muted,
  onResume,
  onRetry,
  onTitle,
  onVolumeChange,
  onMutedChange,
}: PauseOverlayProps) {
  const dialogRef = useDialogA11y(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onResume()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onResume])

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 px-3 py-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="my-auto w-full max-w-sm rounded-[var(--radius-xl)] border-2 border-[var(--color-border-yellow)] bg-slate-900 p-5 text-center shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        <h2
          id="pause-title"
          className="font-display mb-4 text-2xl text-[var(--color-accent-yellow)]"
        >
          一時停止
        </h2>

        <div className="mb-4 flex justify-center">
          <CharacterPreview characterId={characterId} size="md" />
        </div>

        <div className="mb-6 space-y-3 text-left">
          <label className="block text-sm text-[var(--color-text-soft)]">
            音量
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
              className="mt-1 w-full"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-soft)]">
            <input
              type="checkbox"
              checked={muted}
              onChange={(event) => onMutedChange(event.target.checked)}
            />
            ミュート
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <GameButton variant="secondary" size="lg" onClick={onResume}>
            再開
          </GameButton>
          <GameButton variant="primary" onClick={onRetry}>
            最初からやり直す
          </GameButton>
          <GameButton variant="ghost" onClick={onTitle}>
            タイトルへ戻る
          </GameButton>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Esc でも再開できます
        </p>
      </div>
    </div>
  )
}
