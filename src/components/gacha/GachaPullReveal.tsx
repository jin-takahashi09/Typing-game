import { useEffect, useRef, useState } from 'react'
import type { CharacterRarity } from '../../config/characters'
import { getSoundManager, type SfxId } from '../../audio/SoundManager'
import type { GachaPullItem, GachaPullType } from '../../utils/gacha'
import { MULTI_SCROLL_COUNT, MULTI_SCROLL_HOLD_MS } from './gachaMultiReveal'
import {
  isActiveMultiRevealSlot,
  isMultiRevealComplete,
  shouldDimMultiGridBackground,
} from './gachaMultiRevealState'
import { GachaScrollSlot } from './GachaScrollSlot'
import {
  createInitialSlotStates,
  runMultiCentralRevealSequence,
  runSingleRevealSequence,
  type MultiGridSlotState,
  type ScrollSlotState,
} from './gachaCardRevealSequence'

interface GachaPullRevealProps {
  items: GachaPullItem[]
  peakRarity: CharacterRarity
  pullType: GachaPullType
  reducedMotion: boolean
  onClose: () => void
}

function sfxForRarity(rarity: CharacterRarity): SfxId | null {
  if (rarity === 'SHINNIN' || rarity === 'UR') return 'gachaUr'
  if (rarity === 'SSR') return 'gachaSsr'
  if (rarity === 'SR') return 'gachaSr'
  return null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function isActiveRevealState(state: ScrollSlotState): boolean {
  return state === 'anticipation' || state === 'opening' || state === 'impact'
}

function playRevealSfx(item: GachaPullItem, state: ScrollSlotState) {
  if (state === 'anticipation') {
    const sfx = sfxForRarity(item.rarity)
    if (sfx) {
      getSoundManager().playSfx(sfx)
    }
  }
  if (state === 'impact' && item.rarity === 'SSR') {
    const sfx = sfxForRarity(item.rarity)
    if (sfx) {
      getSoundManager().playSfx(sfx)
    }
  }
}

export function GachaPullReveal({
  items,
  pullType,
  reducedMotion,
  onClose,
}: GachaPullRevealProps) {
  const isMulti = pullType === 'multi'
  const [gridSlotStates, setGridSlotStates] = useState<MultiGridSlotState[]>(() =>
    createInitialSlotStates(isMulti ? MULTI_SCROLL_COUNT : 1, 'closed') as MultiGridSlotState[],
  )
  const [singleSlotState, setSingleSlotState] = useState<ScrollSlotState>('closed')
  const [centralState, setCentralState] = useState<ScrollSlotState>('closed')
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null)
  const [approaching, setApproaching] = useState(false)
  const [finished, setFinished] = useState(false)
  const [globalDim, setGlobalDim] = useState(false)
  const [centralReturning, setCentralReturning] = useState(false)
  const [settlingSlotIndex, setSettlingSlotIndex] = useState<number | null>(null)
  const [multiCompleteFx, setMultiCompleteFx] = useState(false)
  const cancelRef = useRef(false)
  const activeIndexRef = useRef<number | null>(null)
  const multiCompletePlayedRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    const controller = new AbortController()

    const run = async () => {
      try {
        if (isMulti) {
          await delay(reducedMotion ? 120 : 360)
          if (cancelRef.current) return

          await runMultiCentralRevealSequence(
            items,
            reducedMotion,
            {
              setActiveRevealIndex: (index) => {
                activeIndexRef.current = index
                setActiveRevealIndex(index)
              },
              setGridSlotState: (index, state) => {
                setGridSlotStates((prev) => {
                  const next = [...prev]
                  next[index] = state
                  return next
                })
              },
              setCentralState: (state) => {
                setCentralState(state)
                const index = activeIndexRef.current
                const item = index !== null ? items[index] : undefined
                if (!item) {
                  return
                }
                if (state === 'anticipation' && item.rarity === 'SHINNIN') {
                  setGlobalDim(true)
                }
                playRevealSfx(item, state)
                if (state === 'revealed') {
                  setGlobalDim(false)
                }
              },
              setCentralReturning: (returning) => {
                setCentralReturning(returning)
              },
              setSlotSettlingIndex: (index) => {
                setSettlingSlotIndex(index)
              },
            },
            controller.signal,
          )

          await delay(reducedMotion ? 200 : MULTI_SCROLL_HOLD_MS)
        } else {
          const item = items[0]
          if (!item) {
            return
          }
          await runSingleRevealSequence(
            item,
            reducedMotion,
            (state) => {
              setSingleSlotState(state)
              if (state === 'anticipation' && item.rarity === 'SHINNIN') {
                setGlobalDim(true)
              }
              playRevealSfx(item, state)
              if (state === 'revealed') {
                setGlobalDim(false)
              }
            },
            setApproaching,
            controller.signal,
          )
          await delay(reducedMotion ? 200 : 480)
        }

        if (!cancelRef.current) {
          setFinished(true)
        }
      } catch {
        /* aborted */
      }
    }

    void run()

    return () => {
      cancelRef.current = true
      controller.abort()
    }
  }, [isMulti, items, reducedMotion])

  const revealedCount = isMulti
    ? gridSlotStates.filter((state) => state === 'revealed').length
    : singleSlotState === 'revealed'
      ? 1
      : 0

  const centralActive = isMulti && activeRevealIndex !== null
  const centralItem =
    centralActive && activeRevealIndex !== null ? items[activeRevealIndex] : null
  const gridBackgroundDimmed = isMulti && shouldDimMultiGridBackground(activeRevealIndex)
  const isMultiComplete =
    isMulti && isMultiRevealComplete(revealedCount, activeRevealIndex) && !centralReturning

  useEffect(() => {
    if (!isMultiComplete || multiCompletePlayedRef.current) {
      return
    }
    multiCompletePlayedRef.current = true
    setMultiCompleteFx(true)
  }, [isMultiComplete])

  return (
    <div
      className={[
        'gacha-pull-reveal',
        isMulti ? 'gacha-pull-reveal--multi' : 'gacha-pull-reveal--single',
        globalDim ? 'gacha-pull-reveal--dim' : '',
        finished ? 'gacha-pull-reveal--finished' : '',
        centralActive ? 'gacha-pull-reveal--central-active' : '',
        centralReturning ? 'gacha-pull-reveal--central-returning' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="gacha-pull-reveal"
      data-pull-type={pullType}
      data-revealed-count={revealedCount}
      data-active-reveal-index={activeRevealIndex ?? ''}
      data-multi-complete={isMulti && multiCompleteFx ? 'true' : 'false'}
    >
      {isMulti && (
        <>
          <header className="gacha-pull-reveal__header">
            <h2 className="gacha-pull-reveal__title" data-testid="gacha-result-title">
              ガチャ結果
            </h2>
          </header>

          <div className="gacha-pull-reveal__grid-area">
            <div
              className={[
                'gacha-multi-scrolls',
                'gacha-multi-scrolls--ready',
                gridBackgroundDimmed ? 'gacha-multi-scrolls--background' : '',
                multiCompleteFx ? 'gacha-multi-scrolls--complete' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid="gacha-multi-scrolls"
              data-opened-count={revealedCount}
              data-background-dimmed={gridBackgroundDimmed ? 'true' : 'false'}
              data-complete={multiCompleteFx ? 'true' : 'false'}
            >
              {items.slice(0, MULTI_SCROLL_COUNT).map((item, index) => {
                const state = gridSlotStates[index] ?? 'closed'
                const isActiveRevealSlot = isActiveMultiRevealSlot(index, activeRevealIndex)
                const isInactive = centralActive && !isActiveRevealSlot
                return (
                  <GachaScrollSlot
                    key={`${item.characterId}-${index}`}
                    item={item}
                    state={state}
                    index={index}
                    variant="multi"
                    reducedMotion={reducedMotion}
                    gridOnly
                    isActiveRevealSlot={isActiveRevealSlot}
                    isInactive={isInactive}
                    isGridSettling={settlingSlotIndex === index}
                  />
                )
              })}
            </div>
          </div>

          {centralItem && centralActive && (
            <div
              className={[
                'gacha-pull-reveal__central',
                centralReturning ? 'gacha-pull-reveal__central--returning' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid="gacha-central-reveal"
              data-scroll-index={activeRevealIndex}
            >
              <GachaScrollSlot
                item={centralItem}
                state={centralState}
                index={activeRevealIndex ?? 0}
                variant="central"
                reducedMotion={reducedMotion}
                globalDim={globalDim}
                isActive={isActiveRevealState(centralState) || centralState === 'revealed'}
              />
            </div>
          )}
        </>
      )}

      {!isMulti && items[0] && (
        <div className="gacha-pull-reveal__single-stage">
          <GachaScrollSlot
            item={items[0]}
            state={singleSlotState}
            index={0}
            variant="single"
            reducedMotion={reducedMotion}
            approaching={approaching}
            globalDim={globalDim}
            isActive={
              isActiveRevealState(singleSlotState) ||
              approaching ||
              singleSlotState === 'revealed'
            }
          />
        </div>
      )}

      {finished && (
        <div className="gacha-pull-reveal__footer">
          <button
            type="button"
            className="gacha-pull-reveal__close"
            data-testid="gacha-reveal-close"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  )
}
