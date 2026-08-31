import { useRef } from 'react'
import { GameButton } from '../components/common/GameButton'
import { BackButton } from '../components/common/BackButton'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { MotionPreference, RomajiLetterCase } from '../types/app'
import type { StoredSettings } from '../types/records'

interface SettingsScreenProps {
  settings: StoredSettings
  saveError: string | null
  onChange: (patch: Partial<StoredSettings>) => void
  onBack: () => void
  onTestSound: () => void
}

const MOTION_OPTIONS: { id: MotionPreference; label: string; description: string }[] = [
  {
    id: 'system',
    label: 'システム設定に従う',
    description: 'OS の prefers-reduced-motion を尊重します',
  },
  {
    id: 'reduced',
    label: '軽減',
    description: '揺れ・点滅・拡大などの装飾演出を抑えます',
  },
  {
    id: 'full',
    label: '通常',
    description: 'すべての演出を表示します',
  },
]

const ROMAJI_CASE_OPTIONS: { id: RomajiLetterCase; label: string; example: string }[] = [
  { id: 'lower', label: '小文字', example: 'tomodati' },
  { id: 'upper', label: '大文字', example: 'TOMODATI' },
]

export function SettingsScreen({
  settings,
  saveError,
  onChange,
  onBack,
  onTestSound,
}: SettingsScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow w-full max-w-lg rounded-[var(--radius-xl)] bg-black/90 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        <BackButton onClick={onBack} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-8 text-center text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl"
        >
          設定
        </h1>

        {saveError && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            音声
          </h2>
          <label className="mb-4 block text-sm text-[var(--color-text-soft)]">
            全体音量 ({Math.round(settings.volume * 100)}%)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) =>
                onChange({ volume: Number(event.target.value) / 100 })
              }
              className="mt-2 w-full"
            />
          </label>
          <label className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-soft)]">
            <input
              type="checkbox"
              checked={settings.muted}
              onChange={(event) => onChange({ muted: event.target.checked })}
            />
            ミュート
          </label>
          <GameButton variant="ghost" onClick={onTestSound}>
            音を確認
          </GameButton>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            タイピング
          </h2>
          <p className="mb-2 text-sm text-[var(--color-text-soft)]">ローマ字表示</p>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="ローマ字表示"
          >
            {ROMAJI_CASE_OPTIONS.map((option) => {
              const selected = (settings.romajiLetterCase ?? 'lower') === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ romajiLetterCase: option.id })}
                  className={[
                    'min-h-11 rounded border px-3 py-2.5 text-center transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                    'focus-visible:outline-[var(--color-accent-yellow)]',
                    selected
                      ? 'border-[var(--color-accent-yellow)] bg-yellow-950/30 text-[var(--color-accent-yellow)]'
                      : 'border-[var(--color-border-blue)] bg-black/40 text-[var(--color-text-soft)] hover:bg-black/55',
                  ].join(' ')}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-0.5 block font-game text-xs tracking-wide opacity-80">
                    {option.example}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            モーション
          </h2>
          <div className="space-y-2" role="radiogroup" aria-label="モーション設定">
            {MOTION_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={[
                  'flex cursor-pointer flex-col rounded border px-3 py-2 text-left',
                  settings.motionPreference === option.id
                    ? 'border-[var(--color-accent-yellow)] bg-yellow-950/30'
                    : 'border-[var(--color-border-blue)] bg-black/40',
                ].join(' ')}
              >
                <span className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="radio"
                    name="motion"
                    checked={settings.motionPreference === option.id}
                    onChange={() => onChange({ motionPreference: option.id })}
                  />
                  {option.label}
                </span>
                <span className="mt-1 pl-6 text-xs text-[var(--color-text-muted)]">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
