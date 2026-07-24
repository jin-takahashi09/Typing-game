import { useRef, useState } from 'react'
import { characters } from '../config/characters'
import { GameButton } from '../components/common/GameButton'
import { BackButton } from '../components/common/BackButton'
import { CharacterPreview } from '../components/common/CharacterPreview'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { useFocusOnMount } from '../hooks/useFocusTrap'
import type { StoredEconomy } from '../types/records'

interface CharactersScreenProps {
  economy: StoredEconomy
  error: string | null
  onBack: () => void
  onPurchase: (characterId: string) => boolean
  onSelect: (characterId: string) => boolean
}

export function CharactersScreen({
  economy,
  error,
  onBack,
  onPurchase,
  onSelect,
}: CharactersScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  useFocusOnMount(headingRef)

  const [pendingPurchaseId, setPendingPurchaseId] = useState<string | null>(null)
  const pendingCharacter = characters.find((item) => item.id === pendingPurchaseId) ?? null

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <section className="panel-glow w-full max-w-2xl rounded-[var(--radius-xl)] bg-black/90 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        <BackButton onClick={onBack} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mb-2 text-center text-2xl text-[var(--color-accent-yellow)] outline-none sm:text-3xl md:text-4xl"
        >
          忍者屋敷
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--color-text-soft)]">
          所持コイン:{' '}
          <span className="font-display text-[var(--color-accent-yellow)]">
            {economy.coins}
          </span>
        </p>

        {error && (
          <p
            className="mb-4 rounded border border-[var(--color-border-red)] bg-red-950/40 px-3 py-2 text-sm text-[var(--color-accent-red)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <ul className="space-y-4">
          {characters.map((character) => {
            const owned = economy.ownedCharacterIds.includes(character.id)
            const selected = economy.selectedCharacterId === character.id
            const canAfford = economy.coins >= character.price

            return (
              <li
                key={character.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-blue)] bg-slate-900/70 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <CharacterPreview characterId={character.id} size="md" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-sm text-white sm:text-base">
                        {character.name}
                      </h2>
                      {selected && (
                        <span className="rounded border border-[var(--color-border-yellow)] px-2 py-0.5 text-xs text-[var(--color-accent-yellow)]">
                          使用中
                        </span>
                      )}
                      {owned && !selected && (
                        <span className="rounded border border-[var(--color-border-blue)] px-2 py-0.5 text-xs text-[var(--color-text-soft)]">
                          所持済み
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-sm text-[var(--color-text-soft)]">
                      {character.description}
                    </p>
                    <div className="mb-2 rounded border border-[var(--color-border-yellow)]/40 bg-black/30 px-2 py-1.5">
                      <p className="text-xs font-bold text-[var(--color-accent-yellow)]">
                        固有能力：{character.ability.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-soft)]">
                        {character.ability.description}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {character.price === 0 ? '無料' : `${character.price} コイン`}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-44">
                    {!owned && (
                      <>
                        <GameButton
                          variant="primary"
                          disabled={!canAfford}
                          onClick={() => setPendingPurchaseId(character.id)}
                        >
                          {canAfford
                            ? `${character.price}コインで購入`
                            : 'コインが足りません'}
                        </GameButton>
                        {!canAfford && (
                          <p className="text-center text-xs text-[var(--color-accent-red)]">
                            コインが足りません
                          </p>
                        )}
                      </>
                    )}
                    {owned && !selected && (
                      <GameButton
                        variant="secondary"
                        onClick={() => onSelect(character.id)}
                      >
                        このキャラクターを使う
                      </GameButton>
                    )}
                    {owned && selected && (
                      <GameButton variant="ghost" disabled>
                        使用中
                      </GameButton>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={pendingCharacter !== null}
        title={
          pendingCharacter
            ? `「${pendingCharacter.name}」を${pendingCharacter.price}コインで購入しますか？`
            : ''
        }
        description="購入後は取り消せません。所持コインから差し引かれます。"
        confirmLabel="購入する"
        cancelLabel="キャンセル"
        onCancel={() => setPendingPurchaseId(null)}
        onConfirm={() => {
          if (!pendingCharacter) {
            return
          }
          const ok = onPurchase(pendingCharacter.id)
          if (ok) {
            setPendingPurchaseId(null)
          }
        }}
      />
    </main>
  )
}
