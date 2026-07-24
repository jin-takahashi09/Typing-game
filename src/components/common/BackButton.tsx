interface BackButtonProps {
  onClick: () => void
  label?: string
}

/** サブ画面左上の戻るボタン */
export function BackButton({ onClick, label = '戻る' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="前の画面に戻る"
      data-testid="back-button"
      className={[
        'sticky top-3 z-40 mb-3 inline-flex min-h-11 min-w-11 items-center gap-1 rounded-[var(--radius-md)]',
        'border border-[var(--color-border-blue)] bg-black/70 px-3 py-2 text-sm font-bold',
        'text-[var(--color-text-soft)] shadow-lg backdrop-blur-sm',
        'hover:bg-black/90 focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-yellow)]',
      ].join(' ')}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  )
}
