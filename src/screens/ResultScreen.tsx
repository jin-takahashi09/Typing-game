import { useRef } from 'react'
import { getDifficultyConfig } from '../config/difficultyConfig'
import { resolveCharacter } from '../config/characters'
import { GameButton } from '../components/common/GameButton'
import { CharacterPreview } from '../components/common/CharacterPreview'
import { PlayComparisonPanel } from '../components/records/PlayComparisonPanel'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import { formatElapsedTime } from '../utils/calculateTypingStats'
import type { ResultViewModel } from '../types/game'

interface ResultScreenProps {
  result: ResultViewModel
  characterId: string
  onRetry: () => void
  onChangeDifficulty: () => void
  onTitle: () => void
}

export function ResultScreen({
  result,
  characterId,
  onRetry,
  onChangeDifficulty,
  onTitle,
}: ResultScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)
  const { summary, comparison, saveError, coinSummary } = result
  const config = getDifficultyConfig(summary.difficulty)
  const character = resolveCharacter(characterId)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <section className="panel-glow w-full max-w-lg rounded-[var(--radius-xl)] bg-black/90 px-4 py-8 text-center sm:px-6 sm:py-10 md:px-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-4 text-2xl text-[var(--color-accent-red)] outline-none sm:mb-6 sm:text-3xl md:text-4xl"
        >
          TIME UP
        </h1>

        <p
          className="mb-4 text-sm text-[var(--color-text-soft)]"
          data-testid="end-reason"
        >
          終了理由：時間切れ
        </p>

        <div className="mb-4 flex flex-col items-center gap-2">
          <CharacterPreview characterId={character.id} size="md" />
          <p className="text-sm text-[var(--color-text-soft)]">{character.name}</p>
          <p className="text-xs text-[var(--color-accent-yellow)]">
            {character.ability.name}：{character.ability.description}
          </p>
          {summary.abilityBonusScore > 0 && (
            <p className="text-xs font-bold text-[var(--color-accent-yellow)]">
              能力による追加スコア：+{summary.abilityBonusScore}
            </p>
          )}
          {summary.abilityBonusCoins > 0 && (
            <p className="text-xs font-bold text-[var(--color-accent-yellow)]">
              能力による追加コイン：+{summary.abilityBonusCoins}
            </p>
          )}
        </div>

        <PlayComparisonPanel comparison={comparison} />

        {saveError && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <div
          className="mb-6 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-yellow)] bg-slate-900/80 p-4 text-left"
          aria-label="コイン獲得"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            獲得コイン
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-soft)]">撃破ボーナス</dt>
              <dd className="font-display text-[var(--color-accent-yellow)]">
                +{coinSummary.stageClearCoins}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-soft)]">連続成功コイン</dt>
              <dd className="font-display text-[var(--color-accent-yellow)]">
                +{coinSummary.streakRewardCoins ?? 0}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-soft)]">成績ボーナス</dt>
              <dd className="font-display text-[var(--color-accent-yellow)]">
                +{coinSummary.resultBonusCoins}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-[var(--color-border-blue)] pt-2">
              <dt className="text-white">今回の合計</dt>
              <dd
                className="font-display text-[var(--color-accent-yellow)]"
                data-testid="result-total-coins"
              >
                +{coinSummary.totalEarned}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-soft)]">現在の所持コイン</dt>
              <dd className="font-display text-white">{coinSummary.balanceAfter}</dd>
            </div>
          </dl>
        </div>

        <div className="mb-8 rounded-[var(--radius-lg)] border-2 border-[var(--color-border-blue)] bg-slate-800/80 p-6 text-left shadow-2xl">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              スコア
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)]"
              data-testid="result-score"
            >
              {summary.score}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              難易度
            </div>
            <div className="font-display text-right text-xl text-[var(--color-text-soft)]">
              {config.displayName}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              撃破数
            </div>
            <div
              className="font-display text-right text-xl text-white"
              data-testid="result-destroyed"
            >
              {summary.destroyedTargets}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              成功数
            </div>
            <div
              className="font-display text-right text-xl text-white"
              data-testid="result-success"
            >
              {summary.destroyedTargets}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              失敗数
            </div>
            <div
              className="font-display text-right text-xl text-white"
              data-testid="result-fail"
            >
              {summary.failedTargets}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              成功率
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)]"
              data-testid="result-success-rate"
            >
              {summary.successRate.toFixed(1)}%
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              最大連続成功
            </div>
            <div
              className="font-display text-right text-xl text-white"
              data-testid="result-max-streak"
            >
              {summary.maxPerfectStreak ?? 0}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              追加時間
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)]"
              data-testid="result-bonus-time"
            >
              +{summary.bonusTimeSeconds ?? 0}秒
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              連続成功コイン
            </div>
            <div
              className="font-display text-right text-xl text-[var(--color-accent-yellow)]"
              data-testid="result-streak-coins"
            >
              +{summary.streakRewardCoins ?? 0}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              最大コンボ
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-red)]">
              {summary.maxCombo}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              プレイ時間
            </div>
            <div className="font-display text-right text-xl text-white">
              {formatElapsedTime(summary.elapsedMs)}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              入力文字数
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.typedChars}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              ミス入力
            </div>
            <div className="font-display text-right text-xl text-white">
              {summary.missCount}
            </div>

            <div className="text-sm font-bold uppercase text-[var(--color-text-muted)]">
              WPM
            </div>
            <div className="font-display text-right text-xl text-[var(--color-accent-yellow)]">
              {summary.wpm.toFixed(1)}
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <GameButton variant="secondary" size="lg" onClick={onRetry}>
            同じ難易度でもう一度
          </GameButton>
          <GameButton variant="primary" onClick={onChangeDifficulty}>
            難易度を変える
          </GameButton>
          <GameButton variant="ghost" onClick={onTitle}>
            タイトルへ戻る
          </GameButton>
        </div>
      </section>
    </main>
  )
}
