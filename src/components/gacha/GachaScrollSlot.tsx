import type { CharacterRarity } from '../../config/characters'
import type { GachaPullItem } from '../../utils/gacha'
import { GachaCardRevealFx } from './GachaCardRevealFx'
import { GachaResultCard } from './GachaResultCard'
import type {
  CardRevealContext,
  MultiGridSlotState,
  ScrollSlotState,
} from './gachaCardRevealSequence'

interface GachaScrollSlotProps {
  item: GachaPullItem
  state: ScrollSlotState | MultiGridSlotState
  index: number
  variant: CardRevealContext
  reducedMotion: boolean
  approaching?: boolean
  globalDim?: boolean
  isActive?: boolean
  isInactive?: boolean
  isActiveRevealSlot?: boolean
  isGridSettling?: boolean
  gridOnly?: boolean
}

function isGridRevealed(state: ScrollSlotState | MultiGridSlotState): boolean {
  return state === 'revealed'
}

function isFullRevealState(state: ScrollSlotState | MultiGridSlotState): state is ScrollSlotState {
  return (
    state === 'closed' ||
    state === 'anticipation' ||
    state === 'opening' ||
    state === 'impact' ||
    state === 'revealed'
  )
}

export function GachaScrollSlot({
  item,
  state,
  index,
  variant,
  reducedMotion,
  approaching = false,
  globalDim = false,
  isActive = false,
  isInactive = false,
  isActiveRevealSlot = false,
  isGridSettling = false,
  gridOnly = false,
}: GachaScrollSlotProps) {
  const isMultiGrid = variant === 'multi' && gridOnly
  const isCentralLayout = variant === 'central' || variant === 'single'
  const showRevealFx = isCentralLayout && isFullRevealState(state) && state !== 'revealed'
  const useSafeArea = isCentralLayout

  const slotBody = (
    <>
      {isMultiGrid && !isGridRevealed(state) && (
        <div className="gacha-scroll-slot__scroll-closed" aria-hidden="true">
          <span className="gacha-scroll-slot__seal">印</span>
        </div>
      )}

      {showRevealFx && isFullRevealState(state) && (
        <GachaCardRevealFx
          rarity={item.rarity as CharacterRarity}
          state={state === 'closed' && approaching ? 'closed' : state}
          context={variant === 'central' ? 'central' : variant}
          reducedMotion={reducedMotion}
          showClosedScroll={state === 'closed'}
        />
      )}

      {(isGridRevealed(state) || (isCentralLayout && state === 'revealed')) && (
        <div
          className={[
            'gacha-scroll-slot__result',
            isMultiGrid ? 'gacha-scroll-slot__result--multi' : 'gacha-scroll-slot__result--single',
            isMultiGrid && isGridRevealed(state) ? 'gacha-scroll-slot__result--grid-fade-in' : '',
            isMultiGrid && isGridSettling ? 'gacha-scroll-slot__result--grid-settle-pop' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <GachaResultCard
            item={item}
            compact={isMultiGrid}
            variant="reveal"
            duplicateDisplay={isMultiGrid ? 'compact' : 'full'}
          />
        </div>
      )}
    </>
  )

  return (
    <div
      className={[
        'gacha-scroll-slot',
        `gacha-scroll-slot--${variant === 'central' ? 'single' : variant}`,
        variant === 'central' ? 'gacha-scroll-slot--central' : '',
        approaching ? 'gacha-scroll-slot--approach' : '',
        isActive ? 'gacha-scroll-slot--active' : '',
        isInactive ? 'gacha-scroll-slot--inactive' : '',
        isActiveRevealSlot ? 'gacha-scroll-slot--active-reveal' : '',
        isMultiGrid && state === 'opening' ? 'gacha-scroll-slot--pending' : '',
        isMultiGrid && isGridSettling ? 'gacha-scroll-slot--grid-settling' : '',
        globalDim && state === 'anticipation' && item.rarity === 'SHINNIN'
          ? 'gacha-scroll-slot--global-dim'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={
        isMultiGrid
          ? 'gacha-multi-scroll-slot'
          : variant === 'central'
            ? 'gacha-central-scroll-slot'
            : 'gacha-single-scroll-slot'
      }
      data-scroll-index={index}
      data-state={state}
      data-rarity={item.rarity}
      data-active-reveal-slot={isActiveRevealSlot ? 'true' : 'false'}
      data-grid-settling={isGridSettling ? 'true' : 'false'}
    >
      {useSafeArea ? (
        <div className="gacha-scroll-slot__positioner">
          <div
            className={[
              'gacha-scroll-slot__motion',
              approaching ? 'gacha-scroll-slot__motion--approach' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="gacha-central-safe-area" data-testid="gacha-central-safe-area">
              <div className="gacha-scroll-slot__stage">{slotBody}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gacha-scroll-slot__stage">{slotBody}</div>
      )}
    </div>
  )
}
