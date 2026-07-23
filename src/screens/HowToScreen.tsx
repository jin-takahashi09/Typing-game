import { GameButton } from '../components/common/GameButton'

interface HowToScreenProps {
  onStartTraining: () => void
  onBack: () => void
}

export function HowToScreen({ onStartTraining, onBack }: HowToScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <section className="panel-glow w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-6 py-8 md:px-10">
        <h1 className="font-display mb-6 text-center text-3xl text-[var(--color-accent-yellow)]">
          遊び方
        </h1>

        <div className="space-y-6 text-left text-sm leading-relaxed text-[var(--color-text-soft)] md:text-base">
          <section>
            <h2 className="mb-2 font-bold text-white">基本</h2>
            <p>
              上空から落ちてくる日本語の下に、代表ローマ字が表示されます。そのローマ字をキーボードで入力し、手裏剣を撃ち落としてください。
            </p>
            <p className="mt-2">
              一部の問題では複数のローマ字表記（例: shi / si）を受け付けます。画面には代表表記のみが表示されます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">コンボ・防御</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>連続で撃破するとコンボが伸び、スコア倍率が上がります</li>
              <li>ミスするとコンボはリセットされます</li>
              <li>ターゲットが底に到達すると防御力が減ります</li>
              <li>防御力が 0 になるとゲームオーバーです</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">WPM・正確率</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>WPM は正しく入力した文字数から算出します</li>
              <li>正確率は正しい入力数 ÷ 総入力数です</li>
              <li>一時停止中は経過時間が進まないため、WPM も増えません</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">一時停止</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>ゲーム中の「一時停止」ボタン、または Esc キー</li>
              <li>ブラウザのタブを非表示にすると自動で一時停止します</li>
              <li>タブに戻っても自動再開はしません。手動で再開してください</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">難易度</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>修行生: 短い問題・ゆったりしたテンポ</li>
              <li>忍者: 標準。複数ターゲットと中程度の速度</li>
              <li>忍頭: 長い問題・速い落下・高いダメージ</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <GameButton size="lg" onClick={onStartTraining}>
            修行を始める
          </GameButton>
          <GameButton variant="ghost" onClick={onBack}>
            タイトルへ戻る
          </GameButton>
        </div>
      </section>
    </main>
  )
}
