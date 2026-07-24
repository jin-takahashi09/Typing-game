import { useRef, useState } from 'react'
import { GameButton } from '../components/common/GameButton'
import { BackButton } from '../components/common/BackButton'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { BestScoreCard } from '../components/records/BestScoreCard'
import { RecentPlaysList } from '../components/records/RecentPlaysList'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { StoredAppData } from '../types/records'

interface RecordsScreenProps {
  data: StoredAppData
  clearError: string | null
  onBack: () => void
  onClearRecords: () => boolean
}

export function RecordsScreen({
  data,
  clearError,
  onBack,
  onClearRecords,
}: RecordsScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  const [confirmOpen, setConfirmOpen] = useState(false)

  const hasAnyRecord =
    data.aggregates.totalPlays > 0 ||
    data.recentPlays.length > 0 ||
    Object.values(data.bestByDifficulty).some((best) => best !== null)

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        <BackButton onClick={onBack} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-6 text-center text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl md:text-4xl"
        >
          プレイ記録
        </h1>

        {clearError && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {clearError}
          </p>
        )}

        {!hasAnyRecord ? (
          <div className="mb-8 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-blue)] bg-slate-900/50 p-6 text-center sm:p-8">
            <p className="text-base text-[var(--color-text-soft)]">
              まだ記録がありません。
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              ゲームをプレイすると、ベストスコアと履歴がここに表示されます。
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-blue)] bg-slate-800/80 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                総プレイ回数
              </p>
              <p className="font-display text-3xl text-white">{data.aggregates.totalPlays}</p>
            </div>

            <BestScoreCard data={data} />

            <RecentPlaysList plays={data.recentPlays} />
          </>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {hasAnyRecord && (
            <GameButton variant="primary" onClick={() => setConfirmOpen(true)}>
              記録を削除
            </GameButton>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="記録を削除しますか？"
        description="難易度別ベストとプレイ履歴、集計値をすべて削除します。所持コイン・購入済みキャラクター・選択中キャラクター・音量などの設定は残ります。この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          const ok = onClearRecords()
          if (ok) {
            setConfirmOpen(false)
          }
        }}
      />
    </main>
  )
}
