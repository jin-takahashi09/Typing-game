import { useRef } from 'react'
import { GameButton } from '../components/common/GameButton'
import { BackButton } from '../components/common/BackButton'
import { useFocusOnMount } from '../hooks/useFocusTrap'

interface HowToScreenProps {
  onStartTraining: () => void
  onBack: () => void
}

export function HowToScreen({ onStartTraining, onBack }: HowToScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        <BackButton onClick={onBack} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-6 text-center text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl"
        >
          遊び方
        </h1>

        <div className="space-y-6 text-left text-sm leading-relaxed text-[var(--color-text-soft)] md:text-base">
          <section>
            <h2 className="mb-2 font-bold text-white">基本</h2>
            <p>
              制限時間内に、表示された日本語をローマ字で入力して敵手裏剣を迎撃します。1問ずつ出題され、成功または失敗のあと次の敵が現れます（寿司打方式）。
            </p>
            <p className="mt-2">
              通常の入力成功では味方手裏剣で迎撃します。接触直前の成功だけ刀で斬ります。操作は基本的にタイピングだけです。
            </p>
            <p className="mt-2">
              一般的なローマ字の表記ゆれに対応しています。例えば「すし」は
              <code className="mx-1 text-[var(--color-accent-yellow)]">sushi</code>
              と
              <code className="mx-1 text-[var(--color-accent-yellow)]">susi</code>
              の両方で入力できます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">時間制・難易度</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>ゲームは制限時間制です。時間が 0 になると終了します</li>
              <li>ステージ進行はありません。難易度は最初から最後まで同じです</li>
              <li>難しさは主に落下速度で変わります（修行生は遅く、忍頭は速い）</li>
              <li>問題の長さも難易度設定だけで決まります</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">迎撃</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>通常の入力成功では、味方手裏剣を投げて迎撃します</li>
              <li>接触直前のギリギリ成功だけ、刀で斬って迎撃します</li>
              <li>成功または失敗の瞬間に現在の敵を消し、次の敵を生成します</li>
              <li>同時に複数の敵は出ません</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">HP・スコア</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>入力が間に合わず敵が到達すると HP が減り、コンボがリセットされます</li>
              <li>HP が 0 になってもゲームは終了せず、時間切れまで続きます</li>
              <li>成功するとスコアとコンボが増えます</li>
              <li>時間内にどれだけ多く倒せるかを競います</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-white">その他</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>一時停止（ボタン・Esc・タブ非表示）中は敵とタイマーが止まります</li>
              <li>撃破マイルストーンと成績に応じてコインを獲得できます</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <GameButton variant="primary" size="lg" onClick={onStartTraining}>
            修行を始める
          </GameButton>
        </div>
      </section>
    </main>
  )
}
