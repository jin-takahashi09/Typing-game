import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { GachaPullItem } from '../../utils/gacha'
import { GachaResultCard } from './GachaResultCard'

function mockDuplicateItem(): GachaPullItem {
  return {
    characterId: 'shinobi-default',
    name: 'テスト忍者',
    rarity: 'SR',
    wasDuplicate: true,
    duplicateCoins: 30,
    newlyOwned: false,
  }
}

describe('GachaResultCard duplicate display', () => {
  it('uses compact duplicate line for final multi grid', () => {
    const html = renderToStaticMarkup(
      <GachaResultCard item={mockDuplicateItem()} variant="reveal" compact duplicateDisplay="compact" />,
    )
    expect(html).toContain('data-testid="gacha-result-duplicate-compact"')
    expect(html).toContain('重複 +30')
    expect(html).not.toContain('data-testid="gacha-result-duplicate"')
    expect(html).not.toContain('DUPLICATE')
  })

  it('keeps full duplicate detail for central/single reveal', () => {
    const html = renderToStaticMarkup(
      <GachaResultCard item={mockDuplicateItem()} variant="reveal" duplicateDisplay="full" />,
    )
    expect(html).toContain('data-testid="gacha-result-duplicate"')
    expect(html).toContain('DUPLICATE')
    expect(html).toContain('+30コイン')
    expect(html).not.toContain('data-testid="gacha-result-duplicate-compact"')
  })
})
