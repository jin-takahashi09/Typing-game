interface StageClearCoinPopupProps {
  stage: number
  coins: number
  /** 黄金能力による追加分（0なら非表示） */
  abilityBonusCoins?: number
}

export function StageClearCoinPopup({
  stage,
  coins,
  abilityBonusCoins = 0,
}: StageClearCoinPopupProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1/3 z-40 flex justify-center px-3"
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          'rounded-[var(--radius-lg)] border-2 border-[var(--color-border-yellow)] bg-black/85 px-5 py-4 text-center shadow-2xl motion-safe-scale',
          abilityBonusCoins > 0 ? 'stage-clear-gold-burst' : '',
        ].join(' ')}
      >
        <p className="font-display text-sm text-[var(--color-accent-yellow)] sm:text-base">
          STAGE {stage} CLEAR
        </p>
        <p className="mt-2 text-base font-bold text-[var(--color-accent-yellow)] sm:text-lg">
          +{coins} コイン
        </p>
        {abilityBonusCoins > 0 && (
          <p className="mt-1 text-xs font-bold text-[var(--color-accent-yellow)] sm:text-sm">
            黄金の褒賞 +{abilityBonusCoins}コイン
          </p>
        )}
      </div>
    </div>
  )
}
