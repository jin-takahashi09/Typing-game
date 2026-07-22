import { appConfig } from '../config/appConfig'
import { GameButton } from '../components/common/GameButton'

interface TitleScreenProps {
  onStartTraining: () => void
}

const upcomingMenus = [
  { id: 'howto', label: '遊び方' },
  { id: 'records', label: 'プレイ記録' },
  { id: 'settings', label: '設定' },
] as const

export function TitleScreen({ onStartTraining }: TitleScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section
        className="panel-glow relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-panel)] px-6 py-12 text-center md:px-12"
        aria-labelledby="app-title"
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

        <p className="relative mb-3 text-sm tracking-widest text-[var(--color-text-soft)] md:text-base">
          {appConfig.nameJa}
        </p>

        <h1
          id="app-title"
          className="font-display text-glow-yellow relative mb-6 text-3xl leading-tight text-[var(--color-accent-yellow)] md:text-5xl"
        >
          {appConfig.name}
        </h1>

        <p className="relative mb-10 text-lg text-[var(--color-text-soft)] md:text-2xl">
          {appConfig.tagline}
        </p>

        <div className="relative mb-10 flex justify-center">
          <GameButton size="lg" onClick={onStartTraining}>
            修行を始める
          </GameButton>
        </div>

        <nav
          className="relative mx-auto flex max-w-md flex-col gap-3"
          aria-label="今後追加予定のメニュー"
        >
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            今後実装予定
          </p>
          {upcomingMenus.map((item) => (
            <GameButton key={item.id} variant="ghost" disabled aria-disabled="true">
              {item.label}
              <span className="ml-2 text-[0.65rem] opacity-80">（準備中）</span>
            </GameButton>
          ))}
        </nav>
      </section>
    </main>
  )
}
