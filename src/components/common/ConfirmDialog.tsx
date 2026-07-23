import { useEffect } from 'react'
import { GameButton } from './GameButton'
import { useDialogA11y } from '../../hooks/useFocusTrap'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useDialogA11y(open)

  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-3"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-sm rounded-[var(--radius-xl)] border-2 border-[var(--color-border-red)] bg-slate-900 p-5 text-center shadow-2xl sm:p-6"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display mb-3 text-xl text-[var(--color-accent-red)]"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-desc"
          className="mb-6 text-sm leading-relaxed text-[var(--color-text-soft)]"
        >
          {description}
        </p>
        <div className="flex flex-col gap-3">
          <GameButton variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </GameButton>
          <GameButton variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </GameButton>
        </div>
      </div>
    </div>
  )
}
